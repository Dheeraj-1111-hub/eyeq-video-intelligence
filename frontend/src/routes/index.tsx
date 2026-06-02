import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  UploadCloud,
  Search,
  FolderOpen,
  Activity,
  ShieldCheck,
  Video,
  ArrowRight,
  PlayCircle
} from "lucide-react";
import { DetectiveFeed } from "@/components/dashboard/DetectiveFeed";
import { UploadDialog } from "@/components/workspace/UploadDialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchDashboardMetrics } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Global Command Center — EYEQ" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Fetch some quick stats
  const { data: stats } = useQuery({
    queryKey: ["dashboardMetrics"],
    queryFn: fetchDashboardMetrics
  });

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
      <UploadDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onUploadSuccess={(id) => navigate({ to: '/analyze', search: { active: id } })}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-cyan/5 via-background to-background pointer-events-none" />

      <ScrollArea className="flex-1">
        <div className="max-w-6xl mx-auto w-full p-8 space-y-10">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Global Command Center</h1>
              <p className="text-muted-foreground text-sm max-w-xl">
                Monitor autonomous threat detection, manage active investigations, and analyze new surveillance footage.
              </p>
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={() => navigate({ to: "/search" })}
                variant="outline" 
                className="bg-black/50 border-white/10 hover:bg-white/10 hover:text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                Global Search
              </Button>
              <Button 
                onClick={() => setIsUploadOpen(true)}
                className="bg-brand-cyan text-black hover:bg-brand-cyan/80 font-semibold shadow-[0_0_20px_rgba(30,212,237,0.3)]"
              >
                <UploadCloud className="w-4 h-4 mr-2" />
                Ingest Footage
              </Button>
            </div>
          </div>

          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard 
              icon={<FolderOpen className="w-5 h-5 text-brand-cyan" />}
              label="Active Case Files"
              value={stats?.cases?.count ?? 0}
              trend={stats?.cases?.trend ?? "0 this week"}
            />
            <MetricCard 
              icon={<Video className="w-5 h-5 text-brand-purple" />}
              label="Footage Indexed"
              value={stats?.footage?.count ?? 0}
              trend={stats?.footage?.trend ?? "0 Bytes Processed"}
            />
            <MetricCard 
              icon={<ShieldCheck className={`w-5 h-5 ${stats?.health?.status === 'Optimal' ? 'text-emerald-500' : 'text-brand-amber'}`} />}
              label="System Health"
              value={stats?.health?.status ?? "Checking"}
              trend={stats?.health?.detail ?? "Connecting to AI Engine..."}
            />
            <MetricCard 
              icon={<Activity className={`w-5 h-5 ${stats?.alerts?.count > 0 ? 'text-rose-500' : 'text-zinc-500'}`} />}
              label="Threat Alerts"
              value={stats?.alerts?.count ?? 0}
              trend={stats?.alerts?.trend ?? "0 unread"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Detective Feed */}
            <div className="lg:col-span-2 space-y-6">
              <DetectiveFeed />
              
              {/* Quick Jump to Video Analysis */}
              <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white/90">Recent Video Activity</h3>
                  <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/analyze' })} className="text-brand-cyan hover:text-brand-cyan/80 hover:bg-brand-cyan/10">
                    Open Workspace <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                
                {stats?.recentVideos && stats.recentVideos.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentVideos.map((video: any) => (
                      <div 
                        key={video._id} 
                        onClick={() => navigate({ to: '/analyze', search: { active: video._id } })}
                        className="bg-black/40 border border-white/5 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:border-brand-cyan/50 hover:bg-black/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-brand-cyan/10 flex items-center justify-center">
                            <PlayCircle className="w-5 h-5 text-brand-cyan" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{video.originalName}</p>
                            <p className="text-xs text-muted-foreground">{new Date(video.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border ${video.status === 'indexed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-brand-amber/10 text-brand-amber border-brand-amber/20'}`}>
                          {video.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground max-w-lg mb-6">
                      Manually scrub through processed footage, view frame-by-frame object detections, and track subject paths chronologically.
                    </p>
                    <div className="aspect-[21/9] bg-zinc-950 rounded-lg border border-white/5 relative overflow-hidden group cursor-pointer" onClick={() => navigate({ to: '/analyze' })}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="w-8 h-8 text-zinc-700 group-hover:text-brand-cyan transition-colors" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Recent Cases */}
            <div className="space-y-6">
              <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-6 h-full min-h-[500px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-white/90">Active Investigations</h3>
                  <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/cases' })} className="text-muted-foreground hover:text-white">
                    View All
                  </Button>
                </div>
                
                {stats?.recentCases && stats.recentCases.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentCases.map((c: any) => (
                      <div 
                        key={c._id}
                        onClick={() => navigate({ to: '/cases', search: { selectedId: c._id } })}
                        className="p-4 rounded-lg border border-white/5 bg-black/40 hover:bg-black/60 hover:border-white/10 cursor-pointer transition-colors"
                      >
                        <h4 className="text-sm font-semibold text-white mb-2">{c.title}</h4>
                        <div className="flex justify-between items-center text-xs">
                          <span className={`px-2 py-0.5 rounded border ${c.priority === 'Critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-white/5 text-muted-foreground border-white/10'}`}>
                            {c.priority}
                          </span>
                          <span className="text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <FolderOpen className="w-8 h-8 text-zinc-700 mb-3" />
                    <p className="text-sm text-zinc-400">No active cases found.</p>
                    <Button className="mt-6 bg-white/5 border border-white/10 text-white hover:bg-white/10" onClick={() => navigate({ to: '/cases' })}>
                      Create New Case
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}

function MetricCard({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string | number; trend: string }) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-5 hover:bg-zinc-900/60 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-black/40 rounded-lg border border-white/5">
          {icon}
        </div>
      </div>
      <div>
        <h4 className="text-2xl font-bold text-white tracking-tight mb-1">{value}</h4>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
          <span className="text-[10px] text-muted-foreground">{trend}</span>
        </div>
      </div>
    </div>
  );
}
