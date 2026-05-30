import { Users, Car, Package, Activity, Loader2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import type { VideoSummary } from "@/types/video";
import type { DetectionStats as AdvancedStats } from "@/hooks/useVideoDetections";

interface DetectionStatsProps {
  summary: VideoSummary | undefined;
  advancedStats: AdvancedStats | undefined;
  status: string;
}

interface StatRowProps {
  label: string;
  value: number;
  color: string;
  max?: number;
  icon: React.ReactNode;
}

function StatRow({ label, value, color, max = 50, icon }: StatRowProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-white/80">
          {icon}
          {label}
        </span>
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`font-mono font-bold ${color}`}
        >
          {value}
        </motion.span>
      </div>
      <Progress
        value={pct}
        className={`h-1.5 bg-white/5`}
        style={{ "--progress-color": color } as any}
      />
    </div>
  );
}

export function DetectionStats({ summary, advancedStats, status }: DetectionStatsProps) {
  const isProcessing = status === "processing";
  const isQueued = status === "queued";
  const isIndexed = status === "indexed";

  if (isQueued || isProcessing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <Activity className="h-4 w-4" /> Summary
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-5 flex flex-col items-center justify-center gap-3 min-h-[120px]">
          <Loader2 className="h-6 w-6 text-brand-cyan animate-spin" />
          <p className="text-sm text-zinc-400 text-center">
            {isProcessing ? "AI is analyzing footage..." : "Queued for processing..."}
          </p>
          {isProcessing && (
            <p className="text-xs text-zinc-600 text-center">
              Object detection running — refresh in a few seconds
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!isIndexed || !summary) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <Activity className="h-4 w-4" /> Summary
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center text-sm text-zinc-500 italic">
          Awaiting index completion...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Count Summary */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <Activity className="h-4 w-4" /> Summary
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
          <p className="text-white">
            <span className="text-brand-cyan font-bold">{summary.persons}</span>{" "}
            {summary.persons === 1 ? "person" : "persons"} detected
          </p>
          <p className="text-white">
            <span className="text-amber-400 font-bold">{summary.vehicles}</span>{" "}
            {summary.vehicles === 1 ? "vehicle" : "vehicles"} detected
          </p>
          {summary.packages > 0 && (
            <p className="text-white">
              <span className="text-brand-rose font-bold">{summary.packages}</span>{" "}
              {summary.packages === 1 ? "package/bag" : "packages/bags"} detected
            </p>
          )}
          <Separator className="my-2 bg-white/10" />
          <p className="text-muted-foreground text-xs flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            Peak activity:{" "}
            <span className="text-white font-mono">{summary.peak_activity}</span>
          </p>
        </div>
      </div>

      {/* Advanced Stats */}
      {advancedStats && advancedStats.totalDetections > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <Activity className="h-4 w-4" /> Advanced Metrics
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-white/80">Total Detections</span>
              <span className="font-mono font-bold text-white">{advancedStats.totalDetections}</span>
            </div>
            {advancedStats.topDetection && (
              <div className="flex justify-between items-center">
                <span className="text-white/80">Top Object</span>
                <span className="font-mono font-bold capitalize text-brand-cyan">
                  {advancedStats.topDetection.label} ({advancedStats.topDetection.count})
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-white/80">Avg. Confidence</span>
              <span className="font-mono font-bold text-amber-400">
                {Math.round(advancedStats.avgConfidence * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Entity Progress Bars */}

      <div className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Detected Entities
        </div>

        <StatRow
          label="Persons"
          value={summary.persons}
          color="text-brand-cyan"
          max={Math.max(summary.persons, 10)}
          icon={<Users className="h-3.5 w-3.5 text-brand-cyan" />}
        />
        <StatRow
          label="Vehicles"
          value={summary.vehicles}
          color="text-amber-400"
          max={Math.max(summary.vehicles, 10)}
          icon={<Car className="h-3.5 w-3.5 text-amber-400" />}
        />
        <StatRow
          label="Packages / Bags"
          value={summary.packages}
          color="text-brand-rose"
          max={Math.max(summary.packages, 5)}
          icon={<Package className="h-3.5 w-3.5 text-brand-rose" />}
        />
      </div>
    </div>
  );
}
