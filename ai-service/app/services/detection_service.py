"""
Detection service — orchestrates:
  1. Update video status → processing
  2. Extract frames at 1fps
  3. Run YOLO on each frame
  4. Bulk insert detections into MongoDB
  5. Update video status → indexed  (or failed on error)
"""

import os
import traceback
from datetime import datetime, timezone
from bson import ObjectId
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv
import requests

from app.detectors.yolo_detector import YOLODetector
from app.services.frame_extractor import extract_frames
from app.embeddings.clip_encoder import CLIPEncoder
from app.search.vector_search import VectorDB
from app.reid.osnet import extract_person_embedding
from PIL import Image

load_dotenv()

MONGODB_URI = os.environ["MONGODB_URI"]
DB_NAME = "test"  # matches Mongoose default — change if your DB has a custom name

# Shared detector instance (loaded once per process)
_detector: YOLODetector | None = None


def get_detector() -> YOLODetector:
    global _detector
    if _detector is None:
        _detector = YOLODetector()
    return _detector


def _get_db():
    client = MongoClient(MONGODB_URI)
    return client[DB_NAME]


def _fmt_timestamp(seconds: float) -> str:
    """Format seconds → HH:MM:SS or MM:SS"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    if h > 0:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"


def process_video(video_id: str, video_path: str, detection_threshold: float = 0.5, reid_threshold: float = 0.85) -> None:
    """
    Full pipeline for one video. Called from a background thread.
    """
    db = _get_db()
    videos_col = db["videos"]
    detections_col = db["detections"]
    
    backend_url = os.environ.get("BACKEND_URL", "http://backend:5000")

    def report_progress(progress_pct: int, msg: str):
        try:
            requests.post(f"{backend_url}/api/videos/{video_id}/progress", json={
                "progress": progress_pct,
                "message": msg
            }, timeout=2)
        except Exception as e:
            print(f"[AI] Webhook failed: {e}")

    oid = ObjectId(video_id)

    try:
        print(f"[AI] Starting pipeline for video {video_id}")

        # 1. Mark as processing
        videos_col.update_one(
            {"_id": oid},
            {"$set": {"status": "processing", "pipeline.frames_extracted": False}}
        )
        report_progress(10, "Extracting frames and initializing YOLO...")

        detector = get_detector()
        clip_encoder = CLIPEncoder()
        vector_db = VectorDB()
        all_detections = []

        # Get video dimensions for bbox normalization
        import cv2
        cap = cv2.VideoCapture(video_path)
        frame_w = cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1920
        frame_h = cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 1080
        cap.release()

        # 2. Extract frames + detect
        for sample_idx, timestamp, frame in extract_frames(video_path, fps_target=1):
            results = detector.detect(frame, conf_threshold=detection_threshold)

            for det in results:
                det_id = ObjectId()
                bx, by, bw, bh = det["bbox"]

                # Normalize bbox to percentages for the frontend overlay
                bx_pct = round((bx / frame_w) * 100, 2)
                by_pct = round((by / frame_h) * 100, 2)
                bw_pct = round((bw / frame_w) * 100, 2)
                bh_pct = round((bh / frame_h) * 100, 2)

                # Crop object for CLIP and Thumbnail
                crop = frame[max(0, int(by)):min(int(frame_h), int(by+bh)), max(0, int(bx)):min(int(frame_w), int(bx+bw))]
                vector = None
                
                if crop.size > 0:
                    # Save thumbnail
                    thumb_path = f"static/thumbnails/{det_id}.jpg"
                    cv2.imwrite(thumb_path, crop)
                    
                    # Generate 512D Vector
                    vector = clip_encoder.encode_image(crop)
                    
                    # Generate ReID Embedding if person
                    reid_embedding = None
                    if det["label"] == "person":
                        pil_crop = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
                        reid_embedding = extract_person_embedding(pil_crop)
                    
                    # Index in FAISS
                    vector_db.add_vector(str(det_id), vector)

                all_detections.append({
                    "_id": det_id,
                    "video_id": oid,
                    "frame": sample_idx,
                    "timestamp": _fmt_timestamp(timestamp),
                    "timestamp_seconds": round(timestamp, 2),
                    "label": det["label"],
                    "confidence": det["confidence"],
                    "bbox": [bx_pct, by_pct, bw_pct, bh_pct],
                    "vector": vector, # store in MongoDB too
                    "reid_embedding": reid_embedding,
                    "thumbnail": f"/static/thumbnails/{det_id}.jpg",
                    "created_at": datetime.now(timezone.utc),
                })

        print(f"[AI] Detected {len(all_detections)} objects in video {video_id}")

        # 3. Update frames_extracted milestone
        videos_col.update_one(
            {"_id": oid},
            {"$set": {"pipeline.frames_extracted": True, "pipeline.objects_detected": True}}
        )
        report_progress(80, "Detections complete. Generating FAISS indices...")

        # 4. Bulk insert detections
        if all_detections:
            # Clear any previous detections for this video (re-processing scenario)
            detections_col.delete_many({"video_id": oid})
            detections_col.insert_many(all_detections)

            # Ensure indexes
            detections_col.create_index([("video_id", ASCENDING), ("timestamp_seconds", ASCENDING)])

        # 5. Mark as indexed
        videos_col.update_one(
            {"_id": oid},
            {
                "$set": {
                    "status": "indexed",
                    "pipeline.embeddings_generated": True,
                    "pipeline.indexed": True,
                }
            }
        )
        print(f"[AI] Video {video_id} indexed successfully.")
        report_progress(100, "Processing Complete")

    except Exception as e:
        print(f"[AI] Pipeline failed for video {video_id}: {e}")
        traceback.print_exc()
        videos_col.update_one(
            {"_id": oid},
            {"$set": {"status": "failed"}}
        )
