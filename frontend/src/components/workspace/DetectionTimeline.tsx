import React, { useEffect, useRef } from "react";
import { Clock, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Detection } from "@/types/video";

interface DetectionTimelineProps {
  detections: Detection[];
  status: string;
  onJumpToTime: (seconds: number) => void;
  currentTime: number;
}

const LABEL_COLORS: Record<string, string> = {
  person: "text-brand-cyan",
  car: "text-amber-400",
  truck: "text-amber-400",
  bus: "text-amber-400",
  motorcycle: "text-amber-400",
  backpack: "text-brand-rose",
  handbag: "text-brand-rose",
  suitcase: "text-brand-rose",
};

export function DetectionTimeline({
  detections,
  status,
  onJumpToTime,
  currentTime,
}: DetectionTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isActive = (d: Detection) =>
    currentTime >= d.timestamp_seconds && currentTime <= d.timestamp_seconds + 5;

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const activeEl = scrollContainerRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [Math.floor(currentTime)]);

  if (status !== "indexed") {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 text-sm italic">
        {status === "processing" ? "Indexing in progress..." : "Awaiting index completion..."}
      </div>
    );
  }

  if (detections.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 text-sm italic">
        No detections found in this video.
      </div>
    );
  }

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-auto -mx-2 px-2">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-zinc-500 uppercase sticky top-0 bg-zinc-900/90 backdrop-blur-sm z-10">
          <tr>
            <th className="px-2 py-2 font-medium">Time</th>
            <th className="px-2 py-2 font-medium">Object</th>
            <th className="px-2 py-2 font-medium text-right">Conf.</th>
            <th className="px-2 py-2 w-6"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          <AnimatePresence>
            {detections.map((d) => {
              const active = isActive(d);
              const color = LABEL_COLORS[d.label] ?? "text-zinc-300";
              return (
                <motion.tr
                  key={d._id}
                  data-active={active}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => onJumpToTime(d.timestamp_seconds)}
                  className={`cursor-pointer transition-colors group ${
                    active
                      ? "bg-brand-cyan/10 border-l-2 border-brand-cyan"
                      : "hover:bg-white/5"
                  }`}
                >
                  <td className="px-2 py-2 font-mono text-brand-cyan text-xs group-hover:text-brand-cyan/80">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 opacity-60" />
                      {d.timestamp}
                    </span>
                  </td>
                  <td className={`px-2 py-2 font-medium capitalize ${color}`}>
                    {d.label}
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-muted-foreground text-xs">
                    {Math.round(d.confidence * 100)}%
                  </td>
                  <td className="px-2 py-2">
                    <ChevronRight className="h-3 w-3 text-zinc-600 group-hover:text-white transition-colors" />
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
