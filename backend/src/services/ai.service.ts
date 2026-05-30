import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";

/**
 * Trigger the AI processing pipeline for a given video.
 * Fire-and-forget — the AI service runs asynchronously.
 * This function does NOT await the pipeline completion.
 */
export async function processVideo(videoId: string, videoPath: string): Promise<void> {
  try {
    await axios.post(`${AI_SERVICE_URL}/process`, {
      videoId,
      videoPath,
    });
    console.log(`[AI Service] Processing triggered for video ${videoId}`);
  } catch (err: any) {
    // Log but don't crash the upload flow — AI service may be down
    console.error(`[AI Service] Failed to trigger processing for video ${videoId}:`, err.message);
  }
}
