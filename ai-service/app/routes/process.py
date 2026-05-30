"""
FastAPI router for the /process endpoint.
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from app.services.detection_service import process_video

router = APIRouter()


class ProcessRequest(BaseModel):
    videoPath: str
    videoId: str
    detectionThreshold: float = 0.5
    reidThreshold: float = 0.85


@router.post("/process")
async def process_video_endpoint(req: ProcessRequest, background_tasks: BackgroundTasks):
    """
    Trigger AI processing pipeline for a video.
    Returns immediately — processing runs in background.
    """
    if not req.videoPath or not req.videoId:
        raise HTTPException(status_code=400, detail="videoPath and videoId are required")

    # Fire and forget — don't await
    background_tasks.add_task(process_video, req.videoId, req.videoPath, req.detectionThreshold, req.reidThreshold)

    return {
        "message": "Processing started",
        "videoId": req.videoId,
    }
