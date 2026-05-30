"""
Frame extractor: pulls 1 frame per second from a video file using OpenCV.
"""

import cv2
import numpy as np
from typing import Generator


def extract_frames(video_path: str, fps_target: int = 1) -> Generator[tuple[int, float, np.ndarray], None, None]:
    """
    Yields (frame_index, timestamp_seconds, frame_bgr) at fps_target frames per second.

    Args:
        video_path: Absolute path to the video file.
        fps_target: How many frames per second to sample (default: 1).

    Yields:
        Tuple of (frame_index, timestamp_in_seconds, numpy_array_bgr)
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    video_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # Number of source frames to skip between samples
    frame_interval = max(1, int(round(video_fps / fps_target)))

    frame_idx = 0
    sample_idx = 0

    while True:
        # Seek to the exact frame for efficiency
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret:
            break

        timestamp = frame_idx / video_fps
        yield sample_idx, timestamp, frame

        frame_idx += frame_interval
        sample_idx += 1

        if frame_idx >= total_frames:
            break

    cap.release()
