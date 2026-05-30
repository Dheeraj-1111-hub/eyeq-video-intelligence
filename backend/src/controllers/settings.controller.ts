import { Request, Response } from "express";
import UserSettings from "../models/UserSettings";
import User from "../models/User";
import Video from "../models/Video";
import Case from "../models/Case";
import Detection from "../models/Detection";
import Evidence from "../models/Evidence";
import TimelineEvent from "../models/TimelineEvent";
import CaseNote from "../models/CaseNote";
import { AuthRequest } from "../middleware/auth.middleware";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";

export const getSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    
    let settings = await UserSettings.findOne({ userId });
    
    // Create defaults if not exists
    if (!settings) {
      settings = await UserSettings.create({ userId });
    }
    
    res.json(settings);
  } catch (error) {
    console.error("Get settings error", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    const updates = req.body;
    
    updates.updatedAt = new Date();
    
    const settings = await UserSettings.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true }
    );
    
    res.json(settings);
  } catch (error) {
    console.error("Update settings error", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    const { name, password } = req.body;
    
    const updateData: any = {};
    if (name) updateData.name = name;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password, salt);
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("-password_hash");
    
    res.json(user);
  } catch (error) {
    console.error("Update profile error", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

export const deleteStorage = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    const { type } = req.params; // "videos", "cases", "reports"
    
    if (type === "videos") {
      // Find all videos to cascade delete their detections
      const videos = await Video.find({ uploadedBy: userId });
      const videoIds = videos.map(v => v._id);
      
      // Physically delete files from the hard drive
      for (const video of videos) {
        // Delete video file
        if (video.filepath && fs.existsSync(video.filepath)) {
          try {
            fs.unlinkSync(video.filepath);
          } catch (e) {
            console.error(`Failed to delete physical video file: ${video.filepath}`);
          }
        }
        
        // Delete generated thumbnail
        const thumbnailPath = path.join(__dirname, "../../../ai-service/static/thumbnails", `${video._id}.jpg`);
        if (fs.existsSync(thumbnailPath)) {
          try {
            fs.unlinkSync(thumbnailPath);
          } catch (e) {
            console.error(`Failed to delete thumbnail: ${thumbnailPath}`);
          }
        }
      }
      
      // Cascade delete records
      await Detection.deleteMany({ video_id: { $in: videoIds } });
      await Video.deleteMany({ uploadedBy: userId });
      
      res.json({ message: "All videos and detections deleted successfully" });
    } else if (type === "cases") {
      // Find all cases to cascade delete their evidence, timelines, and notes
      const cases = await Case.find({ uploadedBy: userId });
      const caseIds = cases.map(c => c._id);
      
      // Cascade delete
      await Evidence.deleteMany({ caseId: { $in: caseIds } });
      await TimelineEvent.deleteMany({ caseId: { $in: caseIds } });
      await CaseNote.deleteMany({ caseId: { $in: caseIds } });
      await Case.deleteMany({ uploadedBy: userId });
      
      res.json({ message: "All case files and evidence deleted successfully" });
    } else {
      res.status(400).json({ error: "Invalid storage type" });
    }
  } catch (error) {
    console.error("Delete storage error", error);
    res.status(500).json({ error: "Failed to clear storage" });
  }
};
