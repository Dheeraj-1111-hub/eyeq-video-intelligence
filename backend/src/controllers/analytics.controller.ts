import { Request, Response } from "express";
import User from "../models/User";
import Video from "../models/Video";
import Case from "../models/Case";
import Detection from "../models/Detection";
import SearchHistory from "../models/SearchHistory";
import ProcessingMetric from "../models/ProcessingMetric";
import { AuthRequest } from "../middleware/auth.middleware";

export const getOverview = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    
    // We filter by user for analytics, assuming multi-tenant separation.
    // If admin wants system-wide, we'd check role. For now, show personal stats.
    const videosCount = await Video.countDocuments({ uploadedBy: userId });
    const detectionsCount = await Detection.countDocuments(); // Detections don't have userId directly, could join via video_id
    
    // Actually, to get true detections for user, we need their videos
    const userVideos = await Video.find({ uploadedBy: userId }).select("_id").lean();
    const videoIds = userVideos.map(v => v._id);
    
    const userDetectionsCount = await Detection.countDocuments({ video_id: { $in: videoIds } });
    const casesCount = await Case.countDocuments({ uploadedBy: userId });
    
    res.json({
      totalVideos: videosCount,
      totalDetections: userDetectionsCount,
      totalCases: casesCount,
      totalReports: 0 // If reports exist, count them.
    });
  } catch (error) {
    console.error("Overview error", error);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
};

export const getProcessingMetrics = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    
    const metrics = await ProcessingMetric.find({ userId }).sort({ createdAt: -1 }).limit(30);
    
    let totalFrames = 0;
    let totalEmbeddings = 0;
    let totalProcessingTime = 0;
    
    metrics.forEach(m => {
      totalFrames += m.frameCount;
      totalEmbeddings += m.embeddings;
      totalProcessingTime += m.processingTimeMs;
    });
    
    const avgProcessingTime = metrics.length > 0 ? (totalProcessingTime / metrics.length) : 0;
    
    res.json({
      videosIndexed: metrics.length,
      framesProcessed: totalFrames,
      embeddingsGenerated: totalEmbeddings,
      avgProcessingTime,
      recentMetrics: metrics
    });
  } catch (error) {
    console.error("Processing metrics error", error);
    res.status(500).json({ error: "Failed to fetch processing metrics" });
  }
};

export const getSearchAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    
    const history = await SearchHistory.find({ userId }).sort({ createdAt: -1 });
    
    // Aggregate queries
    const queryCounts: Record<string, number> = {};
    let totalTime = 0;
    
    history.forEach(h => {
      queryCounts[h.query] = (queryCounts[h.query] || 0) + 1;
      totalTime += h.executionTimeMs;
    });
    
    const topQueries = Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query, count]) => ({ query, count }));
      
    const avgTime = history.length > 0 ? (totalTime / history.length) : 0;
    
    res.json({
      totalSearches: history.length,
      topQueries,
      avgSearchTimeMs: avgTime,
      recentSearches: history.slice(0, 10)
    });
  } catch (error) {
    console.error("Search analytics error", error);
    res.status(500).json({ error: "Failed to fetch search analytics" });
  }
};

export const getInvestigationAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    
    const cases = await Case.find({ uploadedBy: userId });
    
    const statusCounts = {
      open: 0,
      investigating: 0,
      review: 0,
      closed: 0
    };
    
    cases.forEach(c => {
      if (!c.status) {
        statusCounts.open++;
        return;
      }
      
      const s = c.status;
      if (s === "Open") statusCounts.open++;
      else if (s === "Under Investigation") statusCounts.investigating++;
      else if (s === "Review") statusCounts.review++;
      else if (s === "Closed") statusCounts.closed++;
      else statusCounts.open++;
    });
    
    res.json({
      totalCases: cases.length,
      casesClosed: statusCounts.closed,
      openCases: statusCounts.open + statusCounts.investigating + statusCounts.review,
      statusDistribution: statusCounts
    });
  } catch (error) {
    console.error("Investigation analytics error", error);
    res.status(500).json({ error: "Failed to fetch investigation analytics" });
  }
};
