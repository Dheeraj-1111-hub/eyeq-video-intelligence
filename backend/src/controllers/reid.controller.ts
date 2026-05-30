import { Request, Response } from "express";
import Detection from "../models/Detection";
import { findSimilarSubjects } from "../services/reid.service";
import { createSubjectProfile } from "../services/subject.service";
import UserSettings from "../models/UserSettings";
import { AuthRequest } from "../middleware/auth.middleware";

export const trackSubject = async (req: Request, res: Response) => {
  try {
    let { detectionId, threshold } = req.body;
    const userId = (req as AuthRequest).user?.userId;
    
    if (!threshold && userId) {
      const settings = await UserSettings.findOne({ userId });
      threshold = settings?.reidThreshold ?? 0.85;
    }
    
    // Get the target embedding
    const target = await Detection.findById(detectionId);
    if (!target) return res.status(404).json({ error: "Detection not found" });
    if (!target.reid_embedding || target.reid_embedding.length === 0) {
      return res.status(400).json({ error: "No ReID embedding available for this detection." });
    }

    const matches = await findSimilarSubjects(target.reid_embedding, threshold, detectionId);

    // Also include the original detection in the results so the journey is complete
    matches.unshift({
      detectionId: target._id.toString(),
      videoId: target.video_id.toString(),
      videoFilename: "Source Detection",
      timestamp: target.timestamp,
      timestampSeconds: target.timestamp_seconds,
      thumbnail: target.thumbnail || "",
      confidence: 1.0 // 100% since it's the exact same crop
    });

    // Sort again since we just added the source
    matches.sort((a, b) => a.timestampSeconds - b.timestampSeconds);

    return res.status(200).json(matches);
  } catch (error: any) {
    console.error("Track Subject Error:", error);
    return res.status(500).json({ error: "Failed to track subject" });
  }
};

export const createSubject = async (req: Request, res: Response) => {
  try {
    const { matches, sourceDetectionId } = req.body;
    
    const target = await Detection.findById(sourceDetectionId);
    if (!target || !target.reid_embedding) {
      return res.status(400).json({ error: "Invalid source detection" });
    }

    const subject = await createSubjectProfile(matches, target.reid_embedding);
    
    return res.status(201).json(subject);
  } catch (error: any) {
    console.error("Create Subject Error:", error);
    return res.status(500).json({ error: "Failed to create subject" });
  }
};
