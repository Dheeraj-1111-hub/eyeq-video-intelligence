from fastapi import APIRouter
from pydantic import BaseModel
from bson import ObjectId
from typing import List, Optional
from app.embeddings.clip_encoder import CLIPEncoder
from app.search.vector_search import VectorDB
from app.services.detection_service import _get_db

router = APIRouter()

class SearchQuery(BaseModel):
    query: str
    top_k: int = 20
    video_id: Optional[str] = None
    mode: str = "semantic"
    confidence_threshold: Optional[float] = None
    semantic_threshold: Optional[float] = 0.5
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    entities: Optional[List[str]] = None
    start_hour: Optional[int] = None
    end_hour: Optional[int] = None

class SearchResult(BaseModel):
    video_id: str
    detection_id: str
    frame: int
    timestamp: str
    timestamp_seconds: float
    label: str
    confidence: float
    thumbnail: Optional[str]
    score: float
    video_filename: Optional[str]

@router.post("/search", response_model=List[SearchResult])
def search_detections(request: SearchQuery):
    # Get DB details
    db = _get_db()
    det_col = db["detections"]
    vid_col = db["videos"]

    results = []
    video_names = {}

    if request.mode == "exact":
        # Direct MongoDB text/regex filter
        filter_query = {"label": {"$regex": request.query, "$options": "i"}}
        if request.video_id:
            filter_query["video_id"] = ObjectId(request.video_id)
        if request.entities:
            # Case insensitive exact match or regex
            filter_query["label"] = {"$in": [e for e in request.entities]}
            
        cursor = det_col.find(filter_query).sort("confidence", -1).limit(request.top_k * 3) # Fetch more for post-filtering
        
        for doc in cursor:
            vid_id = str(doc["video_id"])
            if vid_id not in video_names:
                v_doc = vid_col.find_one({"_id": ObjectId(vid_id)})
                if not v_doc: continue
                video_names[vid_id] = {
                    "filename": v_doc["filename"],
                    "createdAt": v_doc.get("createdAt")
                }
            
            # Post-filter by date/time
            v_meta = video_names[vid_id]
            dt = v_meta.get("createdAt")
            
            if dt:
                # Date filtering (YYYY-MM-DD string comparison)
                dt_str = dt.strftime("%Y-%m-%d")
                if request.start_date and dt_str < request.start_date: continue
                if request.end_date and dt_str > request.end_date: continue
                
                # Hour filtering
                if request.start_hour is not None and dt.hour < request.start_hour: continue
                if request.end_hour is not None and dt.hour > request.end_hour: continue
            
            if len(results) >= request.top_k:
                break
                
                
            results.append(SearchResult(
                video_id=vid_id,
                detection_id=str(doc["_id"]),
                frame=doc.get("frame", 0),
                timestamp=doc.get("timestamp", "00:00"),
                timestamp_seconds=doc.get("timestamp_seconds", 0.0),
                label=doc.get("label", "unknown"),
                confidence=doc.get("confidence", 0.0),
                thumbnail=doc.get("thumbnail"),
                score=1.0, # Exact match score is always 100%
                video_filename=v_meta["filename"]
            ))
        return results

    # --- Semantic Search Flow ---
    clip_encoder = CLIPEncoder()
    vector_db = VectorDB()
    
    # Encode text
    query_vector = clip_encoder.encode_text(request.query)
    
    # Query a large pool of candidates to bypass any 'ghost' vectors from deleted videos
    search_k = min(300, vector_db._index.ntotal)
    matches = vector_db.search(query_vector, k=search_k)
    
    if not matches:
        return []

    results = []
    
    # Simple cache for video names
    video_names = {}
    
    for match in matches:
        if len(results) >= request.top_k:
            break
            
        det_id = match["db_id"]
        score = match["score"]
        
        # Normalize CLIP score (0.15 -> 0.0, 0.30 -> 1.0) to match UI percentages
        normalized_score = max(0.0, min(1.0, (score - 0.15) / 0.15))
        
        # Apply semantic threshold from user settings
        if request.semantic_threshold and normalized_score < request.semantic_threshold:
            continue
            
        # Retrieve from MongoDB
        doc = det_col.find_one({"_id": ObjectId(det_id)})
        if not doc:
            continue
            
        if request.entities and doc.get("label") not in request.entities:
            continue
            
        vid_id = str(doc["video_id"])
        
        # Apply filtering if video_id is requested
        if request.video_id and vid_id != request.video_id:
            continue
            
        if request.confidence_threshold and doc.get("confidence", 0.0) < request.confidence_threshold:
            continue
        
        if vid_id not in video_names:
            v_doc = vid_col.find_one({"_id": ObjectId(vid_id)})
            if not v_doc: continue
            video_names[vid_id] = {
                "filename": v_doc["filename"],
                "createdAt": v_doc.get("createdAt")
            }
            
        # Post-filter by date/time
        v_meta = video_names[vid_id]
        dt = v_meta.get("createdAt")
        
        if dt:
            # Date filtering (YYYY-MM-DD string comparison)
            dt_str = dt.strftime("%Y-%m-%d")
            if request.start_date and dt_str < request.start_date: continue
            if request.end_date and dt_str > request.end_date: continue
            
            # Hour filtering
            if request.start_hour is not None and dt.hour < request.start_hour: continue
            if request.end_hour is not None and dt.hour > request.end_hour: continue
            
        results.append(SearchResult(
            video_id=vid_id,
            detection_id=str(doc["_id"]),
            frame=doc.get("frame", 0),
            timestamp=doc.get("timestamp", "00:00"),
            timestamp_seconds=doc.get("timestamp_seconds", 0.0),
            label=doc.get("label", "unknown"),
            confidence=doc.get("confidence", 0.0),
            thumbnail=doc.get("thumbnail"),
            score=round(normalized_score, 3),
            video_filename=v_meta["filename"]
        ))

    return results
