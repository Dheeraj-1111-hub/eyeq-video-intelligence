import React, { useEffect, useRef } from "react";
import type { Detection } from "@/types/video";

interface VideoCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  detectionsBySecond: Map<number, Detection[]>;
  showOverlays: boolean;
  isPlaying: boolean;
}

const COLORS: Record<string, string> = {
  person: "#06b6d4", // Cyan
  car: "#fbbf24", // Yellow
  truck: "#fbbf24",
  bus: "#fbbf24",
  motorcycle: "#fbbf24",
  backpack: "#a855f7", // Purple
  handbag: "#f43f5e", // Red
  suitcase: "#f43f5e",
};

export function VideoCanvas({
  videoRef,
  detectionsBySecond,
  showOverlays,
  isPlaying,
}: VideoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const drawFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas internal resolution to match video's intrinsic resolution
    // This allows object-contain CSS to perfectly align the canvas over the video letterboxing
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    } else {
      return; // Video metadata not loaded yet
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showOverlays) {
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(drawFrame);
      }
      return;
    }

    const currentSecond = Math.floor(video.currentTime);
    const activeDetections = detectionsBySecond.get(currentSecond) || [];

    for (const d of activeDetections) {
      const color = COLORS[d.label] || "#ffffff";
      
      // bbox is [x%, y%, w%, h%]
      const x = (d.bbox[0] / 100) * canvas.width;
      const y = (d.bbox[1] / 100) * canvas.height;
      const w = (d.bbox[2] / 100) * canvas.width;
      const h = (d.bbox[3] / 100) * canvas.height;

      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, canvas.width * 0.003);
      ctx.strokeRect(x, y, w, h);

      // Draw label background
      const label = `${d.label.toUpperCase()} ${Math.round(d.confidence * 100)}%`;
      ctx.font = `bold ${Math.max(12, canvas.width * 0.015)}px Inter, sans-serif`;
      const textWidth = ctx.measureText(label).width;
      const textHeight = Math.max(16, canvas.width * 0.02);
      
      ctx.fillStyle = color;
      ctx.fillRect(x - ctx.lineWidth / 2, y - textHeight, textWidth + 8, textHeight);

      // Draw label text
      ctx.fillStyle = "#000000";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + 4, y - textHeight / 2);
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(drawFrame);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(drawFrame);
    } else {
      // Draw once when paused/seeked
      drawFrame();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, showOverlays, detectionsBySecond]);

  // Handle external scrubs when not playing
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleSeeked = () => {
      if (!isPlaying) drawFrame();
    };

    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("timeupdate", handleSeeked);

    return () => {
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("timeupdate", handleSeeked);
    };
  }, [isPlaying, showOverlays, detectionsBySecond]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
    />
  );
}
