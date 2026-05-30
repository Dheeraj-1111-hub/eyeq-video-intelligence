export interface Video {
  _id: string;
  filename: string;
  originalName: string;
  filepath: string;
  size: number;
  duration: number;
  fps: number;
  resolution: string;
  status: "queued" | "processing" | "indexed" | "failed";
  uploadedBy: string;
  createdAt: string;
  pipeline: {
    frames_extracted: boolean;
    objects_detected: boolean;
    embeddings_generated: boolean;
    indexed: boolean;
  };
}

export interface Detection {
  _id: string;
  video_id: string;
  frame: number;
  timestamp: string;         // formatted "MM:SS" or "HH:MM:SS"
  timestamp_seconds: number; // raw seconds
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x%, y%, w%, h%]
  created_at: string;
}

export interface VideoSummary {
  persons: number;
  vehicles: number;
  packages: number;
  peak_activity: string;
}
