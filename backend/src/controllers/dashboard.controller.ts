import { Request, Response } from "express";
import Case from "../models/Case";
import Video from "../models/Video";
import Notification from "../models/Notification";
import axios from "axios";
import fs from "fs";
import path from "path";

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

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // 1. Active Cases
    const activeCasesCount = await Case.countDocuments({ uploadedBy: userId, status: { $in: ["Open", "Under Investigation", "Review"] } });
    
    // Calculate trend (cases created in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCasesCount = await Case.countDocuments({ uploadedBy: userId, createdAt: { $gte: sevenDaysAgo } });

    // Fetch actual recent cases for the UI
    const recentCases = await Case.find({ uploadedBy: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title status priority createdAt");

    // 2. Footage Indexed
    const videosCount = await Video.countDocuments({ uploadedBy: userId });
    
    // Fetch actual recent videos for the UI
    const recentVideos = await Video.find({ uploadedBy: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("filename status originalName createdAt");
    
    // Calculate approximate storage (uploads dir)
    const uploadsDir = path.join(__dirname, "../../uploads");
    const totalStorageBytes = getDirSize(uploadsDir); // In a real app, this would be grouped by user, but for demo this is fine
    const formattedStorage = formatBytes(totalStorageBytes);

    // 3. System Health
    let aiEngineStatus = "Offline";
    let systemHealth = "Critical";
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8001";
      // We assume if we can reach the health or search endpoint it's online
      await axios.get(`${aiServiceUrl}/docs`, { timeout: 2000 });
      aiEngineStatus = "AI Engine Online";
      systemHealth = "Optimal";
    } catch (err: any) {
      console.log("AI Engine unreachable:", err.message || err);
    }

    // 4. Threat Alerts
    const unreadAlerts = await Notification.countDocuments({ userId, type: "alert", read: false });

    res.json({
      cases: {
        count: activeCasesCount,
        trend: recentCasesCount > 0 ? `+${recentCasesCount} this week` : "No new cases"
      },
      footage: {
        count: videosCount,
        trend: `${formattedStorage} Processed`
      },
      health: {
        status: systemHealth,
        detail: aiEngineStatus
      },
      alerts: {
        count: unreadAlerts,
        trend: `${unreadAlerts} unread`
      },
      recentCases,
      recentVideos
    });

  } catch (err) {
    console.error("Dashboard Metrics Error", err);
    res.status(500).json({ error: "Failed to fetch dashboard metrics" });
  }
};
