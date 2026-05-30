import { Router } from "express";
import {
  uploadVideo,
  getVideos,
  getVideoById,
  streamVideo,
  getDetections,
  getSummary,
  getPipelineStatus,
  updateVideoProgress,
  exportEvidence,
  generateReport,
} from "../controllers/video.controller";
import { upload } from "../middleware/upload.middleware";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Internal webhook from Python service (no JWT needed)
router.post("/:id/progress", updateVideoProgress);

// Protect all video routes with JWT authentication
router.use(requireAuth);

router.post("/upload", upload.single("video_file"), uploadVideo);
router.get("/", getVideos);
router.get("/:id", getVideoById);
router.get("/:id/stream", streamVideo);
router.get("/:id/detections", getDetections);
router.get("/:id/summary", getSummary);
router.get("/:id/pipeline", getPipelineStatus);
router.get("/:id/export", exportEvidence);
router.get("/:id/report", generateReport);

export default router;
