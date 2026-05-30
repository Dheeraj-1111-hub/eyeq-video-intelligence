import api from "@/lib/api";

export interface TrackMatch {
  detectionId: string;
  videoId: string;
  videoFilename: string;
  timestamp: string;
  timestampSeconds: number;
  thumbnail: string;
  confidence: number;
}

export interface Subject {
  _id: string;
  firstSeen: string;
  lastSeen: string;
  thumbnail: string;
  confidenceScore: number;
  createdAt: string;
}

export const trackSubject = async (detectionId: string, threshold: number): Promise<TrackMatch[]> => {
  const { data } = await api.post("/reid/track", { detectionId, threshold });
  return data;
};

export const createSubject = async (matches: TrackMatch[], sourceDetectionId: string): Promise<Subject> => {
  const { data } = await api.post("/reid/subjects", { matches, sourceDetectionId });
  return data;
};
