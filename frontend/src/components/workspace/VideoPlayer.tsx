import { AlertCircle } from "lucide-react";
import React from "react";
import { VideoCanvas } from "./VideoCanvas";
import type { Detection } from "@/types/video";

interface Video {
  _id: string;
  filename: string;
  status: string;
  createdAt: string;
}

interface VideoPlayerProps {
  active: Video;
  token: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  showOverlays: boolean;
  detectionsBySecond: Map<number, Detection[]>;
  isPlaying: boolean;
  onTimeUpdate: () => void;
  onPlay: () => void;
  onPause: () => void;
}

export function VideoPlayer({
  active,
  token,
  videoRef,
  showOverlays,
  detectionsBySecond,
  isPlaying,
  onTimeUpdate,
  onPlay,
  onPause,
}: VideoPlayerProps) {
  return (
    <div className="relative w-full aspect-video rounded-xl border border-zinc-800 bg-black overflow-hidden flex items-center justify-center shadow-2xl">
      {active.status !== "failed" ? (
        <>
          <video
            ref={videoRef}
            src={`http://localhost:5000/api/videos/${active._id}/stream?token=${token}`}
            className="w-full h-full object-contain"
            onTimeUpdate={onTimeUpdate}
            controls
            onPlay={onPlay}
            onPause={onPause}
            crossOrigin="anonymous"
          />
          <VideoCanvas
            videoRef={videoRef}
            detectionsBySecond={detectionsBySecond}
            showOverlays={showOverlays}
            isPlaying={isPlaying}
          />
        </>
      ) : (
        <div className="text-zinc-600 flex flex-col items-center gap-2">
          <AlertCircle className="h-10 w-10 opacity-20 text-red-500" />
          <span className="text-sm">Video processing failed</span>
        </div>
      )}
    </div>
  );
}
