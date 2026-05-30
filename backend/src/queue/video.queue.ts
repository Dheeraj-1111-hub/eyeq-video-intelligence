import { Queue, Worker, Job } from "bullmq";
import axios from "axios";
import Video from "../models/Video";
import UserSettings from "../models/UserSettings";

const REDIS_URL = process.env.REDIS_URL || null;

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  // Disable retries so it doesn't spam the terminal when Redis is unavailable
  lazyConnect: true,
  maxRetriesPerRequest: 0,
  enableReadyCheck: false,
  retryStrategy: () => null, // Don't retry connecting — fail fast and gracefully
};

let videoQueue: Queue | null = null;

const isRedisAvailable = (): boolean => {
  // If REDIS_URL is explicitly set (Docker env), assume Redis is up
  if (process.env.REDIS_URL && process.env.REDIS_URL !== "") return true;
  return false;
};

// Trigger AI processing directly (fallback without Redis)
const triggerDirectProcessing = async (videoId: string, absoluteVideoPath: string) => {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8001";
    
    const video = await Video.findById(videoId);
    if (!video) throw new Error("Video not found");
    
    const settings = await UserSettings.findOne({ userId: video.uploadedBy });
    const detectionThreshold = settings?.detectionThreshold ?? 0.5;
    const reidThreshold = settings?.reidThreshold ?? 0.85;

    await Video.updateOne({ _id: videoId }, { status: "processing" });
    // Fire-and-forget: call FastAPI directly (old behaviour for local dev)
    axios.post(`${aiServiceUrl}/process`, {
      videoId: videoId,
      videoPath: absoluteVideoPath,
      detectionThreshold,
      reidThreshold
    }).catch((err) => {
      console.error(`[AI] Direct processing failed for ${videoId}:`, err.message);
    });
    console.log(`[Queue] No Redis — dispatched video ${videoId} directly to AI service.`);
  } catch (err) {
    console.error("[Queue] Failed to dispatch directly:", err);
    await Video.updateOne({ _id: videoId }, { status: "failed" });
  }
};

// Main export: add job to queue (or fallback if no Redis)
export const addVideoJob = async (videoId: string, absoluteVideoPath: string) => {
  if (!isRedisAvailable() || !videoQueue) {
    // Local development without Redis — go direct
    return triggerDirectProcessing(videoId, absoluteVideoPath);
  }

  await videoQueue.add("process-video", { videoId, absoluteVideoPath });
  console.log(`[Queue] Added video ${videoId} to BullMQ queue.`);
};

// Initialize BullMQ worker only if Redis is configured
export const initVideoWorker = () => {
  if (!isRedisAvailable()) {
    console.log("[Queue] Redis not configured — running in direct-dispatch mode (local dev).");
    return;
  }

  try {
    videoQueue = new Queue("video-processing", { connection });

    const worker = new Worker(
      "video-processing",
      async (job: Job) => {
        const { videoId, absoluteVideoPath } = job.data;
        console.log(`[Queue] Processing video ${videoId} via BullMQ worker.`);

        const video = await Video.findById(videoId);
        const settings = await UserSettings.findOne({ userId: video?.uploadedBy });
        const detectionThreshold = settings?.detectionThreshold ?? 0.5;
        const reidThreshold = settings?.reidThreshold ?? 0.85;

        await Video.updateOne({ _id: videoId }, { status: "processing" });

        const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8001";
        await axios.post(`${aiServiceUrl}/process`, {
          videoId: videoId,
          videoPath: absoluteVideoPath,
          detectionThreshold,
          reidThreshold
        });
      },
      { connection, concurrency: 2 }
    );

    worker.on("completed", (job) => console.log(`[Queue] Job ${job.id} completed.`));
    worker.on("failed", (job, err) => console.error(`[Queue] Job ${job?.id} failed:`, err.message));

    console.log("[Queue] BullMQ worker initialized with Redis.");
  } catch (err) {
    console.warn("[Queue] Could not initialize BullMQ — falling back to direct dispatch.", err);
  }
};
