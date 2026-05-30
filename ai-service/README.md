# EYEQ AI Service

FastAPI service that runs YOLOv4-tiny object detection on uploaded CCTV footage.

## Setup

```bash
pip install -r requirements.txt
```

## Run

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Or on Windows just double-click `start.bat`.

## How it works

1. Backend calls `POST /process` after a video upload (fire-and-forget)
2. AI service downloads YOLOv4-tiny model files on first run (~23 MB, cached in `models/`)
3. Extracts 1 frame per second from the video using OpenCV
4. Runs YOLO detection, filters to 8 target classes (person, car, truck, bus, motorcycle, backpack, handbag, suitcase)
5. Stores all detections directly in MongoDB (same DB as backend)
6. Updates video status: `queued → processing → indexed`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/process` | Trigger processing pipeline |

## Detection Classes

`person`, `car`, `truck`, `bus`, `motorcycle`, `backpack`, `handbag`, `suitcase`
