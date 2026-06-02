import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import { ZipArchive } from "archiver";
import PDFDocument from "pdfkit";
import Video from "../models/Video";
import Detection from "../models/Detection";
import Notification from "../models/Notification";
import ProcessingMetric from "../models/ProcessingMetric";
import UserSettings from "../models/UserSettings";
import { videoQueue, addVideoJob } from "../queue/video.queue";
import { getIo } from "../socket";
import { logAuditAction } from "../services/audit.service";

// Configure fluent-ffmpeg to use the locally installed binaries
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

export const uploadVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No video file provided" });
      return;
    }

    const file = req.file;
    const userId = (req as any).user.userId;

    // Extract metadata using ffprobe
    ffmpeg.ffprobe(file.path, async (err, metadata) => {
      let duration = 0;
      let fps = 0;
      let resolution = "Unknown";

      if (!err && metadata && metadata.streams) {
        const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
        if (videoStream) {
          duration = videoStream.duration ? parseFloat(videoStream.duration) : 0;
          resolution = `${videoStream.width}x${videoStream.height}`;
          
          if (videoStream.r_frame_rate) {
            const parts = videoStream.r_frame_rate.split('/');
            if (parts.length === 2 && parseFloat(parts[1]) > 0) {
              fps = Math.round(parseFloat(parts[0]) / parseFloat(parts[1]));
            } else {
              fps = parseFloat(videoStream.r_frame_rate);
            }
          }
        } else if (metadata.format && metadata.format.duration) {
          duration = parseFloat(metadata.format.duration);
        }
      }

      // Create video record in DB
      const video = new Video({
        filename: file.filename,
        originalName: file.originalname,
        filepath: file.path,
        size: file.size,
        duration,
        fps,
        resolution,
        location: req.body.location || "Unknown",
        status: "queued",
        uploadedBy: userId
      });

      await video.save();

      // Respond to client immediately — don't wait for AI
      res.status(201).json(video);

      // Fire-and-forget: Add to BullMQ processing queue
      // Use absolute path so Python can find the file
      const absoluteVideoPath = path.resolve(file.path);
      await addVideoJob(String(video._id), absoluteVideoPath);
      await logAuditAction(userId, "VIDEO_UPLOADED", String(video._id), { filename: file.filename, size: file.size });
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload video" });
  }
};

export const getVideos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const videos = await Video.find({ uploadedBy: userId }).sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

export const getVideoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const video = await Video.findOne({ _id: id, uploadedBy: userId });
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    res.json(video);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch video" });
  }
};

export const streamVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const video = await Video.findOne({ _id: id, uploadedBy: userId });
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    const videoPath = video.filepath;
    
    if (!fs.existsSync(videoPath)) {
      res.status(404).json({ error: "Video file not found on server" });
      return;
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4",
      };
      
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error("Streaming error:", error);
    res.status(500).json({ error: "Failed to stream video" });
  }
};

export const getDetections = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Verify ownership
    const video = await Video.findOne({ _id: id, uploadedBy: userId });
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    const detections = await Detection.find({ video_id: id })
      .sort({ timestamp_seconds: 1 } as any)
      .limit(1000);

    res.json(detections);
  } catch (error) {
    console.error("GetDetections error:", error);
    res.status(500).json({ error: "Failed to fetch detections" });
  }
};

// Label groups for summary aggregation
const VEHICLE_LABELS = new Set(["car", "truck", "bus", "motorcycle"]);
const PACKAGE_LABELS = new Set(["backpack", "handbag", "suitcase"]);

export const getSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const video = await Video.findOne({ _id: id, uploadedBy: userId });
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    // Aggregate detection counts by label using Max Concurrent Objects per frame
    const counts = await Detection.aggregate([
      { $match: { video_id: video._id } },
      // 1. Count how many of each label appear in each frame
      { $group: { _id: { frame: "$frame", label: "$label" }, count: { $sum: 1 } } },
      // 2. Find the maximum count for each label across all frames
      { $group: { _id: "$_id.label", count: { $max: "$count" } } }
    ]);

    let persons = 0;
    let vehicles = 0;
    let packages = 0;

    for (const c of counts) {
      if (c._id === "person") persons = c.count;
      else if (VEHICLE_LABELS.has(c._id)) vehicles += c.count;
      else if (PACKAGE_LABELS.has(c._id)) packages += c.count;
    }

    // Peak activity: find the 1-minute window with most detections
    const peakPipeline = await Detection.aggregate([
      { $match: { video_id: video._id } },
      {
        // Group into 60-second buckets based on timestamp_seconds
        $group: {
          _id: { $floor: { $divide: [{ $ifNull: ["$timestamp_seconds", 0] }, 60] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    let peak_activity = "N/A";
    if (peakPipeline.length > 0) {
      const bucketMinute = peakPipeline[0]._id;
      const startSec = bucketMinute * 60;
      const endSec = startSec + 60;
      const fmt = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
      };
      peak_activity = `${fmt(startSec)} – ${fmt(endSec)}`;
    }

    res.json({ persons, vehicles, packages, peak_activity });
  } catch (error) {
    console.error("GetSummary error:", error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
};

export const getPipelineStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const video = await Video.findOne({ _id: id, uploadedBy: userId }).select("pipeline");
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    res.json(video.pipeline);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pipeline status" });
  }
};

export const updateVideoProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { progress, message } = req.body;
    
    // Broadcast via Socket.IO
    getIo().to(`video_${id}`).emit("video_progress", {
      videoId: id,
      progress,
      message
    });

    if (progress === 100) {
      const video = await Video.findById(id);
      if (video) {
        
        let shouldNotify = true;
        const settings = await UserSettings.findOne({ userId: video.uploadedBy });
        if (settings && settings.notifications.processingComplete === false) {
          shouldNotify = false;
        }

        if (shouldNotify) {
          await Notification.create({
            userId: video.uploadedBy,
            title: "Video Processing Complete",
            message: `Your video "${video.originalName}" has finished processing and is ready for investigation.`,
            type: "success"
          });
        }
        
        // Log processing metric
        const frameCount = await Detection.countDocuments({ video_id: id });
        // Simplified metric: use duration of processing from video.createdAt
        const processingTimeMs = Date.now() - video.createdAt.getTime();
        
        await ProcessingMetric.create({
          videoId: id,
          userId: video.uploadedBy,
          processingTimeMs,
          frameCount, // approximation based on detections if actual frame count is not readily available
          detections: frameCount,
          embeddings: frameCount // each detection has an embedding
        });
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to broadcast progress" });
  }
};

export const exportEvidence = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const video = await Video.findOne({ _id: id, uploadedBy: userId });
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    const detections = await Detection.find({ video_id: id }).sort({ timestamp_seconds: 1 } as any);

    const archive = new ZipArchive({ zlib: { level: 9 } });

    res.attachment(`${video.originalName}_Evidence.zip`);
    archive.pipe(res);

    if (fs.existsSync(video.filepath)) {
      archive.file(video.filepath, { name: video.originalName });
    }

    const metadata = {
      filename: video.originalName,
      resolution: video.resolution,
      duration: video.duration,
      fps: video.fps,
      uploadedAt: video.createdAt,
      total_detections: detections.length
    };
    archive.append(JSON.stringify(metadata, null, 2), { name: "metadata.json" });
    archive.append(JSON.stringify(detections, null, 2), { name: "detections.json" });

    await archive.finalize();

  } catch (error) {
    console.error("Export error:", error);
    if (!res.headersSent) res.status(500).json({ error: "Failed to export evidence" });
  }
};

export const generateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const video = await Video.findOne({ _id: id, uploadedBy: userId });
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    const detectionsCount = await Detection.countDocuments({ video_id: id });
    
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${video.originalName}_Report.pdf"`);
    
    doc.pipe(res);

    doc.fontSize(20).text("EYEQ Intelligence Report", { align: "center" });
    doc.moveDown();
    
    doc.fontSize(14).text("Video Information");
    doc.fontSize(10).moveDown(0.5);
    doc.text(`Filename: ${video.originalName}`);
    doc.text(`Uploaded: ${new Date(video.createdAt).toLocaleString()}`);
    doc.text(`Duration: ${video.duration} seconds`);
    doc.text(`Resolution: ${video.resolution}`);
    doc.text(`FPS: ${video.fps}`);
    doc.moveDown();
    
    doc.fontSize(14).text("Analysis Summary");
    doc.fontSize(10).moveDown(0.5);
    doc.text(`Total Objects Detected: ${detectionsCount}`);
    doc.text(`Processing Status: ${video.status}`);
    doc.moveDown();
    
    doc.fontSize(8).text("Generated by EYEQ Video Intelligence System", 50, doc.page.height - 50, { align: "center" });

    doc.end();

  } catch (error) {
    console.error("Report generation error:", error);
    if (!res.headersSent) res.status(500).json({ error: "Failed to generate report" });
  }
};

