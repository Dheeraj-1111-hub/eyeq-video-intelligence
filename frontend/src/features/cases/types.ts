export type CaseStatus = "Open" | "Under Investigation" | "Review" | "Closed";
export type CasePriority = "Low" | "Medium" | "High" | "Critical";

export interface Case {
  _id: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  uploadedBy: string;
  clipsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Evidence {
  _id: string;
  caseId: string;
  videoId: string;
  videoFilename: string;
  videoLocation?: string;
  detectionId: string;
  timestamp: string;
  timestampSeconds: number;
  label: string;
  confidence: number;
  thumbnailPath: string;
  framePath: string;
  notes: string;
  createdAt: string;
}

export interface TimelineEvent {
  _id: string;
  caseId: string;
  evidenceId?: string;
  timestamp: string;
  timestampSeconds: number;
  eventType: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface CaseNote {
  _id: string;
  caseId: string;
  userId: any;
  content: string;
  createdAt: string;
}

export interface CaseDetailsResponse {
  case: Case;
  evidence: Evidence[];
  timeline: TimelineEvent[];
  notes: CaseNote[];
  summary: string;
}
