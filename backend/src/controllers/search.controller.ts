import { Request, Response } from "express";
import axios from "axios";
import Video from "../models/Video";
import Detection from "../models/Detection";
import SearchHistory from "../models/SearchHistory";
import UserSettings from "../models/UserSettings";
import { AuthRequest } from "../middleware/auth.middleware";

export const getSearchMetadata = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    
    // Total indexed videos for this user
    const indexedVideos = await Video.countDocuments({ uploadedBy: userId, status: "indexed" });
    const processingVideos = await Video.countDocuments({ uploadedBy: userId, status: "processing" });

    // Distinct camera names (originalName) and IDs for this user's indexed videos
    const videos = await Video.find({ uploadedBy: userId, status: "indexed" }).select("originalName _id").lean();
    
    // Deduplicate by originalName to avoid listing the same camera multiple times
    const uniqueCameras = new Map<string, string>();
    videos.forEach(v => {
      if (!uniqueCameras.has(v.originalName)) {
        uniqueCameras.set(v.originalName, v._id.toString());
      }
    });
    
    const cameras = Array.from(uniqueCameras.entries()).map(([name, id]) => ({ id, name }));

    // Distinct entity labels
    const entities = await Detection.distinct("label");

    return res.status(200).json({
      indexedCount: indexedVideos,
      processingCount: processingVideos,
      cameras,
      entities
    });
  } catch (error: any) {
    console.error("[SearchController] Error fetching metadata:", error.message);
    return res.status(500).json({
      error: "Failed to fetch search metadata",
      details: error.message,
    });
  }
};

export const searchDetections = async (req: Request, res: Response) => {
  try {
    const { query, top_k = 20, videoId, mode = "semantic", confidenceThreshold, startDate, endDate, entities, startHour, endHour } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const userId = (req as AuthRequest).user?.userId;

    let semanticThreshold = 0.5;

    if (userId) {
      const settings = await UserSettings.findOne({ userId });
      if (settings) {
        semanticThreshold = settings.searchThreshold;
      }
    }

    const payload: any = { query, top_k, mode };
    if (videoId) payload.video_id = videoId;
    if (confidenceThreshold !== undefined) payload.confidence_threshold = confidenceThreshold;
    payload.semantic_threshold = semanticThreshold;
    if (startDate) payload.start_date = startDate;
    if (endDate) payload.end_date = endDate;
    if (entities && Array.isArray(entities)) payload.entities = entities;
    if (startHour !== undefined) payload.start_hour = startHour;
    if (endHour !== undefined) payload.end_hour = endHour;

    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8001";
    const startTime = Date.now();
    const aiResponse = await axios.post(`${aiServiceUrl}/search`, payload);
    const executionTimeMs = Date.now() - startTime;

    const results = aiResponse.data;

    // Log the search
    if (userId) {
      await SearchHistory.create({
        userId,
        query,
        filters: {
          confidenceThreshold,
          startDate,
          endDate,
          videoSource: videoId
        },
        resultsCount: results.length || 0,
        executionTimeMs
      });
    }

    return res.status(200).json(results);
  } catch (error: any) {
    console.error("[SearchController] Error searching detections:", error.message);
    return res.status(500).json({
      error: "Failed to perform semantic search",
      details: error.message,
    });
  }
};
