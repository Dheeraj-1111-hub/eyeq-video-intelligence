import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import User from "../models/User";
import Video from "../models/Video";
import Case from "../models/Case";
import AuditLog from "../models/AuditLog";

export const getMetrics = async (req: Request, res: Response) => {
  try {
    const usersCount = await User.countDocuments();
    const videosCount = await Video.countDocuments();
    const casesCount = await Case.countDocuments();
    
    // Recent activity
    const recentLogs = await AuditLog.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(20);
      
    res.json({
      metrics: {
        users: usersCount,
        videos: videosCount,
        cases: casesCount,
      },
      activity: recentLogs
    });
  } catch (err) {
    console.error("Metrics Error", err);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
};

const getDirSize = (dirPath: string): number => {
  let size = 0;
  if (!fs.existsSync(dirPath)) return 0;
  
  const files = fs.readdirSync(dirPath);
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(dirPath, files[i]);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      size += getDirSize(filePath);
    } else {
      size += stats.size;
    }
  }
  return size;
};

export const getStorageStats = async (req: Request, res: Response) => {
  try {
    const uploadsDir = path.join(__dirname, "../../uploads");
    const thumbnailsDir = path.join(__dirname, "../../../ai-service/static/thumbnails");
    
    const uploadsSize = getDirSize(uploadsDir);
    const thumbnailsSize = getDirSize(thumbnailsDir);
    
    res.json({
      uploadsSizeBytes: uploadsSize,
      thumbnailsSizeBytes: thumbnailsSize,
      totalSizeBytes: uploadsSize + thumbnailsSize
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate storage" });
  }
};
