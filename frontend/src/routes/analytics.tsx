import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Activity } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — EYEQ" }] }),
  component: AnalyticsPage,
});

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/services/analyticsApi";

function formatMs(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function AnalyticsPage() {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: analyticsApi.fetchOverview,
  });

  const { data: processing, isLoading: loadingProcessing } = useQuery({
    queryKey: ["analytics", "processing"],
    queryFn: analyticsApi.fetchProcessingMetrics,
  });

  const { data: search, isLoading: loadingSearch } = useQuery({
    queryKey: ["analytics", "search"],
    queryFn: analyticsApi.fetchSearchAnalytics,
  });

  const { data: investigation, isLoading: loadingInv } = useQuery({
    queryKey: ["analytics", "investigation"],
    queryFn: analyticsApi.fetchInvestigationAnalytics,
  });

  // Convert case distribution to chart data
  const distData = [
    { label: "Open", value: investigation?.statusDistribution?.open || 0, tone: "cyan" as const },
    { label: "Investigating", value: investigation?.statusDistribution?.investigating || 0, tone: "amber" as const },
    { label: "Review", value: investigation?.statusDistribution?.review || 0, tone: "purple" as const },
    { label: "Closed", value: investigation?.statusDistribution?.closed || 0, tone: "rose" as const },
  ];

  // Calculate percentages for distribution
  const totalCasesDist = distData.reduce((acc, curr) => acc + curr.value, 0);
  const distribution = distData.map(d => ({
    ...d,
    percentage: totalCasesDist > 0 ? Math.round((d.value / totalCasesDist) * 100) : 0
  }));

  // Sparkline for recent processing frames
  const processingSeries = processing?.recentMetrics?.map((m: any) => m.frameCount).reverse() || [0, 0, 0, 0, 0];
  if (processingSeries.length < 2) processingSeries.push(...[0, 0]); // Need at least 2 points for sparkline

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-brand-cyan/20 border border-brand-cyan/30 shadow-[0_0_15px_rgba(30,212,237,0.2)]">
          <BarChart3 className="h-5 w-5 text-brand-cyan" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">System Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time throughput and operational insights.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Stat label="Videos Indexed" value={loadingOverview ? "..." : overview?.totalVideos.toString() || "0"} tone="cyan" />
        <Stat label="Objects Detected" value={loadingOverview ? "..." : overview?.totalDetections.toString() || "0"} tone="purple" />
        <Stat label="Total Cases" value={loadingOverview ? "..." : overview?.totalCases.toString() || "0"} tone="emerald" />
        <Stat label="Total Searches" value={loadingSearch ? "..." : search?.totalSearches.toString() || "0"} tone="cyan" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Indexing Throughput" subtitle="Frames processed per recent video">
          <Sparkline data={processingSeries} />
        </Panel>

        <Panel title="Case Distribution" subtitle="Share of current case statuses">
          <div className="space-y-4 mt-2">
            {distribution.length === 0 ? (
              <div className="text-sm text-zinc-500 py-4">No case data available.</div>
            ) : distribution.map((d) => {
              const bg =
                d.tone === "cyan"
                  ? "bg-brand-cyan shadow-[0_0_8px_var(--color-brand-cyan)]"
                  : d.tone === "amber"
                    ? "bg-brand-amber shadow-[0_0_8px_var(--color-brand-amber)]"
                    : d.tone === "rose"
                      ? "bg-brand-rose shadow-[0_0_8px_var(--color-brand-rose)]"
                      : "bg-brand-purple shadow-[0_0_8px_var(--color-brand-purple)]";
              const text =
                d.tone === "cyan"
                  ? "text-brand-cyan"
                  : d.tone === "amber"
                    ? "text-brand-amber"
                    : d.tone === "rose"
                      ? "text-brand-rose"
                      : "text-brand-purple";

              return (
                <div key={d.label}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-white/90">{d.label} ({d.value})</span>
                    <span className={`font-mono font-bold ${text}`}>{d.percentage}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-black/50 border border-white/5">
                    <div className={`h-full ${bg} rounded-full`} style={{ width: `${d.percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Panel title="Top Search Queries" subtitle="Most frequent semantic searches">
          <div className="space-y-3 mt-4">
            {loadingSearch ? (
              <div className="text-sm text-zinc-500">Loading...</div>
            ) : search?.topQueries?.length === 0 ? (
              <div className="text-sm text-zinc-500">No search history yet.</div>
            ) : search?.topQueries?.map((q: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-sm font-medium text-white">"{q.query}"</span>
                <span className="text-xs text-brand-cyan bg-brand-cyan/10 px-2 py-1 rounded">{q.count} searches</span>
              </div>
            ))}
          </div>
        </Panel>
        
        <Panel title="System Performance" subtitle="Average processing metrics">
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-xs text-zinc-400 mb-1">Avg Search Time</div>
              <div className="text-2xl font-mono text-brand-purple">{loadingSearch ? "..." : formatMs(search?.avgSearchTimeMs || 0)}</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-xs text-zinc-400 mb-1">Avg Processing Time</div>
              <div className="text-2xl font-mono text-brand-emerald">{loadingProcessing ? "..." : formatMs(processing?.avgProcessingTime || 0)}</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-xs text-zinc-400 mb-1">Total Frames Parsed</div>
              <div className="text-2xl font-mono text-white">{loadingProcessing ? "..." : processing?.framesProcessed?.toLocaleString() || "0"}</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-xs text-zinc-400 mb-1">Total Embeddings</div>
              <div className="text-2xl font-mono text-brand-cyan">{loadingProcessing ? "..." : processing?.embeddingsGenerated?.toLocaleString() || "0"}</div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  tone = "cyan",
}: {
  label: string;
  value: string | number;
  delta?: string;
  tone?: "cyan" | "purple" | "emerald";
}) {
  const textColor =
    tone === "cyan"
      ? "text-brand-cyan"
      : tone === "purple"
        ? "text-brand-purple"
        : "text-brand-emerald";

  return (
    <div className="rounded-xl border border-white/5 bg-card/40 p-6 backdrop-blur-sm shadow-sm transition-colors hover:bg-white/[0.02]">
      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-3 text-4xl font-bold tracking-tight text-white">{value}</div>
      {delta && <div className={`mt-3 text-xs font-semibold ${textColor}`}>{delta}</div>}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-card/40 p-6 backdrop-blur-sm shadow-sm">
      <div className="mb-6 border-b border-white/5 pb-4">
        <div className="text-sm font-semibold text-white/90">{title}</div>
        {subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1); // Prevent division by zero if all values are 0
  const w = 100;
  const h = 40;
  const step = w / (Math.max(data.length - 1, 1));
  const points = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
  const area = `0,${h} ${points} ${w},${h}`;

  // Using brand cyan variables
  const strokeColor = "var(--color-brand-cyan)";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#g1)" />
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Gauge({
  value,
  label,
  tone = "cyan",
}: {
  value: number;
  label: string;
  tone?: "cyan" | "purple";
}) {
  const pct = Math.round(value * 100);
  const r = 36;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  const strokeColor = tone === "cyan" ? "var(--color-brand-cyan)" : "var(--color-brand-purple)";

  return (
    <div className="flex items-center gap-8 py-2">
      <div className="relative">
        <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={r}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
            fill="none"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={r}
            stroke={strokeColor}
            strokeWidth="8"
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={c}
            animate={{ strokeDashoffset: off }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl font-bold font-mono"
          >
            {label}
          </motion.span>
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-white/90">Healthy</div>
        <div className="text-xs text-muted-foreground mt-1">Within target operational band</div>
      </div>
    </div>
  );
}
