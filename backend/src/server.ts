import express from "express";
import http from "http";
import { initSocket } from "./socket";
import { initVideoWorker } from "./queue/video.queue";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Import routes
import videoRoutes from "./routes/video.routes";
import authRoutes from "./routes/auth.routes";
import searchRoutes from "./routes/search.routes";
import caseRoutes from "./routes/case.routes";
import reidRoutes from "./routes/reid.routes";
import adminRoutes from "./routes/admin.routes";
import notificationRoutes from "./routes/notification.routes";
import analyticsRoutes from "./routes/analytics.routes";
import settingsRoutes from "./routes/settings.routes";
import investigatorRoutes from "./routes/investigator.routes";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

// Start Queue Worker
initVideoWorker();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static route for uploads (optional if using streaming, but good for thumbnails)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/reid", reidRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/investigator", investigatorRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
