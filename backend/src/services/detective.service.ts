import mongoose from "mongoose";
import Evidence from "../models/Evidence";
import Detection from "../models/Detection";
import Case from "../models/Case";
import Video from "../models/Video";
import Notification from "../models/Notification";
import { getIO } from "../socket";

// Cosine Similarity between two vectors
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const triggerDetectiveScan = async (newVideoId: string) => {
  try {
    console.log(`[Detective AI] Initiating autonomous scan on new video: ${newVideoId}`);

    // 1. Get all new person detections from this video that have ReID embeddings
    const newDetections = await Detection.find({
      video_id: new mongoose.Types.ObjectId(newVideoId),
      label: "person",
      reid_embedding: { $exists: true, $ne: [] }
    }).lean();

    if (newDetections.length === 0) {
      console.log(`[Detective AI] No trackable subjects found in new video.`);
      return;
    }

    // 2. Fetch all Evidence across all cases that represent people
    // To optimize, we find evidence where the original detection had a reid_embedding
    const activeEvidenceList = await Evidence.find({ label: "person" })
      .populate("caseId")
      .lean();

    if (activeEvidenceList.length === 0) return;

    // 3. Batch fetch detections for the active evidence to get their embeddings
    const evidenceDetectionIds = activeEvidenceList.map(e => e.detectionId).filter(Boolean);
    const existingDetections = await Detection.find({
      _id: { $in: evidenceDetectionIds.map(id => new mongoose.Types.ObjectId(id)) },
      reid_embedding: { $exists: true, $ne: [] }
    }).lean();

    // Create a map for fast lookup
    const existingEmbeddingMap = new Map();
    for (const det of existingDetections) {
      existingEmbeddingMap.set(det._id.toString(), det.reid_embedding);
    }

    // Also get the new video details for the notification
    const newVideo = await Video.findById(newVideoId).lean();
    const newVideoName = newVideo ? newVideo.filename : "Unknown Video";

    // 4. Perform the cross-reference
    const MATCH_THRESHOLD = 0.85;
    const foundMatches = new Set(); // To prevent duplicate alerts for the same person in the same case

    for (const newDet of newDetections) {
      const newEmbedding = newDet.reid_embedding!;

      for (const evidence of activeEvidenceList) {
        const evidenceDetId = evidence.detectionId;
        const caseData = evidence.caseId as any; // Populated case doc
        
        if (!caseData || !caseData.title) continue;
        
        const existingEmbedding = existingEmbeddingMap.get(evidenceDetId);
        if (!existingEmbedding) continue;

        const score = cosineSimilarity(newEmbedding, existingEmbedding);

        if (score >= MATCH_THRESHOLD) {
          const matchKey = `${caseData._id}-${newVideoId}`; // Only one alert per case per video

          if (!foundMatches.has(matchKey)) {
            foundMatches.add(matchKey);

            // 5. TRIGGER AUTONOMOUS ALERT
            const msg = `Subject from case "${caseData.title}" was just detected in new footage: ${newVideoName}`;
            console.log(`[Detective AI] 🚨 HIT: ${msg} (Score: ${score.toFixed(2)})`);

            // Save notification to DB
            const notif = await Notification.create({
              userId: caseData.uploadedBy, // Send to case owner
              title: "Detective AI Match",
              message: msg,
              type: "alert",
              read: false,
              link: `/intelligence?caseId=${caseData._id}` // Link to the intelligence center for this case
            });

            // Emit via WebSockets
            const io = getIO();
            if (io) {
              io.emit("notification", notif);
              // Also emit a specific detective event for the real-time feed
              io.emit("detective_hit", {
                caseId: caseData._id,
                caseTitle: caseData.title,
                newVideoId: newVideoId,
                newVideoName: newVideoName,
                timestamp: newDet.timestamp,
                thumbnail: newDet.thumbnail,
                score: score,
                message: msg,
                time: new Date()
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("[Detective AI] Fatal error during autonomous scan:", error);
  }
};
