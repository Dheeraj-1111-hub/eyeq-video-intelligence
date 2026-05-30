export type FootageStatus = "Queued" | "Processing" | "Indexed" | "Failed";

export type Footage = {
  id: string;
  filename: string;
  size: string;
  upload_time: string;
  status: FootageStatus;
  duration: string;
  detected_objects?: number;
  video_url: string;
};

export const footage: Footage[] = [
  {
    id: "f1",
    filename: "lobby_cam_28may.mp4",
    size: "2.1 GB",
    upload_time: "29 May 2026, 09:41 AM",
    status: "Indexed",
    duration: "01:42:22",
    detected_objects: 1284,
    video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  },
  {
    id: "f2",
    filename: "parking_west_27may.mp4",
    size: "4.8 GB",
    upload_time: "28 May 2026, 14:22 PM",
    status: "Indexed",
    duration: "03:10:08",
    detected_objects: 2410,
    video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  },
  {
    id: "f3",
    filename: "entrance_north_27may.mp4",
    size: "1.2 GB",
    upload_time: "27 May 2026, 11:05 AM",
    status: "Indexed",
    duration: "00:48:51",
    detected_objects: 612,
    video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  },
  {
    id: "f4",
    filename: "elevator_b_26may.mp4",
    size: "3.5 GB",
    upload_time: "27 May 2026, 16:30 PM",
    status: "Processing",
    duration: "02:05:14",
    video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  },
  {
    id: "f5",
    filename: "rear_alley_25may.mp4",
    size: "5.1 GB",
    upload_time: "25 May 2026, 08:15 AM",
    status: "Queued",
    duration: "04:20:00",
    video_url: "",
  },
];

export type Detection = {
  id: string;
  frame: number;
  timestamp: string;
  object: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, w, h] in percentages
};

export const mockDetections: Record<string, Detection[]> = {
  f1: [
    { id: "d1", frame: 450, timestamp: "00:05:12", object: "Person", confidence: 0.94, bbox: [35, 45, 15, 35] },
    { id: "d2", frame: 800, timestamp: "00:08:31", object: "Vehicle", confidence: 0.88, bbox: [60, 55, 20, 30] },
    { id: "d3", frame: 1250, timestamp: "00:12:45", object: "Backpack", confidence: 0.81, bbox: [40, 60, 10, 15] },
    { id: "d4", frame: 2100, timestamp: "00:18:22", object: "Person", confidence: 0.91, bbox: [20, 50, 12, 30] },
    { id: "d5", frame: 3400, timestamp: "00:25:09", object: "Package", confidence: 0.76, bbox: [70, 70, 8, 10] },
  ]
};

export type FootageSummary = {
  persons: number;
  vehicles: number;
  packages: number;
  peakActivity: string;
};

export const mockSummaries: Record<string, FootageSummary> = {
  f1: { persons: 24, vehicles: 8, packages: 3, peakActivity: "18:30–18:45" },
  f2: { persons: 45, vehicles: 112, packages: 0, peakActivity: "08:00–09:15" },
  f3: { persons: 12, vehicles: 2, packages: 1, peakActivity: "12:00–12:30" },
};

export type SearchResult = {
  id: string;
  timestamp: string;
  camera: string;
  label: string;
  confidence: number;
};

export const sampleResults: SearchResult[] = [
  { id: "r1", timestamp: "18:42:11", camera: "CAM-02", label: "Person with black backpack entering", confidence: 0.94 },
  { id: "r2", timestamp: "18:51:03", camera: "CAM-01", label: "Person with backpack near elevator", confidence: 0.88 },
];

export type Case = {
  id: string;
  name: string;
  clips: number;
  updated: string;
  status: "Open" | "Closed" | "Review";
};

export const cases: Case[] = [
  { id: "c1", name: "Parking Theft — 27 May", clips: 6, updated: "2h ago", status: "Open" },
  { id: "c2", name: "Missing Package — Apt 304", clips: 4, updated: "Yesterday", status: "Review" },
];
