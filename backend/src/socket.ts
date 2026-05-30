import { Server as SocketServer } from "socket.io";
import { Server } from "http";

let io: SocketServer | null = null;

export const initSocket = (server: Server) => {
  io = new SocketServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);
    
    // Clients can join rooms based on user ID or video ID to receive targeted updates
    socket.on("join_video", (videoId) => {
      socket.join(`video_${videoId}`);
      console.log(`[Socket.IO] Client joined room: video_${videoId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
};
