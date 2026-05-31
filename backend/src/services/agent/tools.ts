import { tool } from "ai";
import { z } from "zod";
import axios from "axios";
import Case from "../../models/Case";
import Evidence from "../../models/Evidence";
import Video from "../../models/Video";
import Detection from "../../models/Detection";

const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8001";

export const searchEvidence = tool({
  description: "Search for specific objects, people, or events across all indexed video footage using natural language or semantic meaning.",
  parameters: z.object({
    query: z.string().describe("The natural language search query (e.g., 'person carrying a red backpack')"),
    startDate: z.string().optional().describe("ISO date string to filter videos from this date onwards"),
    endDate: z.string().optional().describe("ISO date string to filter videos up to this date"),
    entities: z.array(z.string()).optional().describe("Array of specific object classes to filter (e.g., ['person', 'backpack'])"),
  }),
  execute: async ({ query, startDate, endDate, entities }) => {
    try {
      const payload: any = { query, top_k: 10, mode: "semantic" };
      if (startDate) payload.start_date = startDate;
      if (endDate) payload.end_date = endDate;
      if (entities && entities.length > 0) payload.entities = entities;

      const aiResponse = await axios.post(`${aiServiceUrl}/search`, payload);
      const results = aiResponse.data;
      
      return {
        success: true,
        count: results.length,
        results: results.slice(0, 5) // Return top 5 to avoid overflowing context
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
});

export const trackSubject = tool({
  description: "Track a specific person across multiple cameras using their Re-Identification (ReID) signature.",
  parameters: z.object({
    detectionId: z.string().describe("The MongoDB ObjectId of the detection to track")
  }),
  execute: async ({ detectionId }) => {
    try {
      const aiResponse = await axios.post(`${aiServiceUrl}/reid/track`, {
        detectionId,
        threshold: 0.85
      });
      const results = aiResponse.data;
      
      return {
        success: true,
        matchCount: results.length,
        matches: results.slice(0, 5)
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
});

export const createCase = tool({
  description: "Create a new investigation case to organize evidence and notes.",
  parameters: z.object({
    userId: z.string().describe("The MongoDB ObjectId of the user creating the case"),
    title: z.string().describe("A short, descriptive title for the case"),
    description: z.string().describe("Detailed description of the incident being investigated"),
    priority: z.enum(["Low", "Medium", "High", "Critical"]).describe("The priority level of the case")
  }),
  execute: async ({ userId, title, description, priority }) => {
    try {
      const newCase = await Case.create({
        title,
        description,
        priority,
        status: "Open",
        uploadedBy: userId
      });
      return { success: true, caseId: newCase._id.toString(), title: newCase.title };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
});

export const addEvidence = tool({
  description: "Add a specific piece of video evidence (a detection) to an existing investigation case.",
  parameters: z.object({
    caseId: z.string().describe("The MongoDB ObjectId of the case"),
    videoId: z.string().describe("The MongoDB ObjectId of the video"),
    detectionId: z.string().describe("The MongoDB ObjectId of the specific detection"),
    label: z.string().describe("The class label of the detected object (e.g., 'person')"),
    timestampSeconds: z.number().describe("The exact time in seconds where the event occurred in the video"),
  }),
  execute: async ({ caseId, videoId, detectionId, label, timestampSeconds }) => {
    try {
      const caseExists = await Case.findById(caseId);
      if (!caseExists) return { success: false, error: "Case not found" };

      const evidence = await Evidence.create({
        caseId,
        videoId,
        detectionId,
        timestamp: new Date(timestampSeconds * 1000).toISOString().substr(11, 8), // roughly HH:MM:SS format
        timestampSeconds,
        label,
        confidence: 0.99,
        thumbnailPath: `/uploads/thumbnails/${videoId}_${timestampSeconds}.jpg`, // Mock thumbnail for now
      });
      return { success: true, evidenceId: evidence._id.toString() };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
});

export const getPlatformStats = tool({
  description: "Retrieve general statistics about the EYEQ platform to understand system volume.",
  parameters: z.object({}),
  execute: async () => {
    try {
      const videos = await Video.countDocuments();
      const detections = await Detection.countDocuments();
      const cases = await Case.countDocuments();
      
      return {
        success: true,
        totalVideosIndexed: videos,
        totalDetectionsFound: detections,
        totalInvestigationCases: cases
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
});
