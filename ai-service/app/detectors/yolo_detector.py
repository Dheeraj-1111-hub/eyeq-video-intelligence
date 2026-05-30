"""
YOLO Detector using OpenCV DNN backend.
Uses YOLOv4-tiny weights — compatible with any Python version.
No ultralytics dependency required.
"""

import cv2
import numpy as np
import os
import urllib.request
from pathlib import Path

# Target COCO class names we care about for EYEQ
TARGET_CLASSES = {
    "person",
    "car",
    "truck",
    "bus",
    "motorcycle",
    "backpack",
    "handbag",
    "suitcase",
}

MODELS_DIR = Path(__file__).parent.parent.parent / "models"

WEIGHTS_URL = "https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v4_pre/yolov4-tiny.weights"
CFG_URL = "https://raw.githubusercontent.com/AlexeyAB/darknet/master/cfg/yolov4-tiny.cfg"
NAMES_URL = "https://raw.githubusercontent.com/AlexeyAB/darknet/master/data/coco.names"

WEIGHTS_PATH = MODELS_DIR / "yolov4-tiny.weights"
CFG_PATH = MODELS_DIR / "yolov4-tiny.cfg"
NAMES_PATH = MODELS_DIR / "coco.names"

CONFIDENCE_THRESHOLD = 0.40
NMS_THRESHOLD = 0.45


def _download_if_missing(url: str, dest: Path, label: str) -> None:
    if dest.exists():
        return
    print(f"[YOLO] Downloading {label}...")
    dest.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, str(dest))
    print(f"[YOLO] {label} downloaded → {dest}")


def ensure_model_files() -> None:
    _download_if_missing(WEIGHTS_URL, WEIGHTS_PATH, "yolov4-tiny.weights")
    _download_if_missing(CFG_URL, CFG_PATH, "yolov4-tiny.cfg")
    _download_if_missing(NAMES_URL, NAMES_PATH, "coco.names")


class YOLODetector:
    def __init__(self):
        ensure_model_files()

        # Load class names
        with open(NAMES_PATH) as f:
            self.class_names = [line.strip() for line in f.readlines()]

        # Map class name → index for quick lookup
        self.target_indices = {
            i for i, name in enumerate(self.class_names) if name in TARGET_CLASSES
        }

        # Load network
        self.net = cv2.dnn.readNetFromDarknet(str(CFG_PATH), str(WEIGHTS_PATH))
        self.net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
        self.net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)

        layer_names = self.net.getLayerNames()
        out_layers = self.net.getUnconnectedOutLayers()
        # Handle both flat and nested returns
        if isinstance(out_layers[0], (list, np.ndarray)):
            self.output_layers = [layer_names[i[0] - 1] for i in out_layers]
        else:
            self.output_layers = [layer_names[i - 1] for i in out_layers]

        print("[YOLO] Model loaded successfully.")

    def detect(self, frame: np.ndarray, conf_threshold: float = CONFIDENCE_THRESHOLD) -> list[dict]:
        """
        Run YOLO on a single BGR frame.
        Returns list of: { label, confidence, bbox: [x, y, w, h] } in pixels.
        """
        h, w = frame.shape[:2]

        blob = cv2.dnn.blobFromImage(frame, 1 / 255.0, (416, 416), swapRB=True, crop=False)
        self.net.setInput(blob)
        outputs = self.net.forward(self.output_layers)

        boxes, confidences, class_ids = [], [], []

        for output in outputs:
            for detection in output:
                scores = detection[5:]
                class_id = int(np.argmax(scores))
                confidence = float(scores[class_id])

                if class_id not in self.target_indices:
                    continue
                if confidence < conf_threshold:
                    continue

                # YOLO returns center x, center y, width, height (normalized)
                cx = int(detection[0] * w)
                cy = int(detection[1] * h)
                bw = int(detection[2] * w)
                bh = int(detection[3] * h)
                x = cx - bw // 2
                y = cy - bh // 2

                boxes.append([x, y, bw, bh])
                confidences.append(confidence)
                class_ids.append(class_id)

        # Non-maximum suppression
        indices = cv2.dnn.NMSBoxes(boxes, confidences, conf_threshold, NMS_THRESHOLD)
        results = []

        if len(indices) > 0:
            flat_indices = indices.flatten() if hasattr(indices, "flatten") else indices
            for i in flat_indices:
                results.append({
                    "label": self.class_names[class_ids[i]],
                    "confidence": round(confidences[i], 4),
                    "bbox": boxes[i],  # [x, y, w, h] in pixels
                })

        return results
