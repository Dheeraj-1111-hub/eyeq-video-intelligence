import { FileVideo } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MovingBorder } from "@/components/ui/aceternity/moving-border";
import { StatusIndicator } from "./ProcessingStatus";

interface Video {
  _id: string;
  filename: string;
  status: string;
  createdAt: string;
  size: number;
  duration: number;
}

interface VideoLibraryProps {
  videos: Video[];
  isLoadingVideos: boolean;
  activeId: string | null;
  setSelected: (id: string) => void;
  setPlaying: (playing: boolean) => void;
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m > 9 ? m : h ? '0' + m : m || '0', s > 9 ? s : '0' + s].filter(Boolean).join(':');
}

export function VideoLibrary({
  videos,
  isLoadingVideos,
  activeId,
  setSelected,
  setPlaying,
}: VideoLibraryProps) {
  return (
    <ScrollArea className="flex-1 p-3">
      <div className="space-y-1">
        {isLoadingVideos ? (
          <div className="p-4 text-center text-sm text-zinc-500">Loading library...</div>
        ) : (
          videos.map((f: Video) => {
            const isActive = f._id === activeId;

            const content = (
              <button
                key={f._id}
                onClick={() => {
                  setSelected(f._id);
                  setPlaying(false);
                }}
                className={`w-full text-left p-3 rounded-lg transition-colors border ${
                  isActive
                    ? "bg-brand-cyan/10 border-brand-cyan/20"
                    : "bg-transparent border-transparent hover:bg-muted"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${
                      isActive
                        ? "bg-brand-cyan/20 border-brand-cyan/30 text-brand-cyan shadow-[0_0_10px_rgba(30,212,237,0.15)]"
                        : "bg-transparent border-border text-muted-foreground"
                    }`}
                  >
                    <FileVideo className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-sm font-medium ${
                        isActive ? "text-white" : "text-muted-foreground"
                      }`}
                    >
                      {f.filename}
                    </div>
                    <div className="flex flex-col gap-0.5 mt-1 text-xs text-muted-foreground">
                      <div>Uploaded {new Date(f.createdAt).toLocaleDateString()}</div>
                      <div className="font-mono opacity-60">
                        {formatBytes(f.size)} · {formatDuration(f.duration)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <StatusIndicator status={f.status} isActive={isActive} />
                    </div>
                  </div>
                </div>
              </button>
            );

            return (
              <div key={f._id} className="relative group">
                {isActive ? (
                  <div className="relative rounded-lg overflow-hidden p-[1px] shadow-[0_0_10px_rgba(255,255,255,0.05)] z-10">
                    <MovingBorder duration={4000} rx="8px" ry="8px">
                      <div className="h-full w-full bg-white/20" />
                    </MovingBorder>
                    <div className="relative z-10 bg-background/95 rounded-lg backdrop-blur-md">
                      {content}
                    </div>
                  </div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10"
                  >
                    {content}
                  </motion.div>
                )}
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}
