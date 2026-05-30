import Detection from "../models/Detection";
import Video from "../models/Video";
import mongoose from "mongoose";

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

export interface TrackMatch {
  detectionId: string;
  videoId: string;
  videoFilename: string;
  timestamp: string;
  timestampSeconds: number;
  thumbnail: string;
  confidence: number; // Similarity score
}

export const findSimilarSubjects = async (
  targetEmbedding: number[],
  threshold: number = 0.85,
  excludeDetectionId?: string
): Promise<TrackMatch[]> => {
  
  // 1. Fetch all detections that are "person" and have an embedding
  const query: any = { label: "person", reid_embedding: { $exists: true, $ne: [] } };
  if (excludeDetectionId) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeDetectionId) };
  }

  // To avoid memory bloat on large datasets, this could be paginated or pre-filtered by time, 
  // but for investigation cases, keeping it in memory is incredibly fast for a few thousand records.
  const candidates = await Detection.find(query).lean();
  
  // 2. We need to fetch Video filenames for the matches to show in the UI journey
  // (Or we can fetch it later)
  const videoMap = new Map();
  const videos = await Video.find({}).lean();
  videos.forEach(v => videoMap.set(v._id.toString(), v.filename));

  const matches: TrackMatch[] = [];

  for (const doc of candidates) {
    if (!doc.reid_embedding) continue;
    const score = cosineSimilarity(targetEmbedding, doc.reid_embedding);
    
    if (score >= threshold) {
      matches.push({
        detectionId: doc._id.toString(),
        videoId: doc.video_id.toString(),
        videoFilename: videoMap.get(doc.video_id.toString()) || "Unknown Video",
        timestamp: doc.timestamp,
        timestampSeconds: doc.timestamp_seconds,
        thumbnail: doc.thumbnail || "",
        confidence: score
      });
    }
  }

  // Sort chronologically for the Journey timeline
  matches.sort((a, b) => a.timestampSeconds - b.timestampSeconds);

  return matches;
};
