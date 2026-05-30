import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileDown,
  FolderPlus,
  FileText,
  UploadCloud,
  Database,
  Cpu,
  Clock,
  Search,
  Loader2,
} from "lucide-react";
import { fetchSummary, fetchPipelineStatus, exportEvidence, generateReport } from "../lib/api";
import { useVideos } from "../hooks/useVideos";
import { useVideoDetections } from "../hooks/useVideoDetections";
import { VideoLibrary } from "@/components/workspace/VideoLibrary";
import { VideoPlayer } from "@/components/workspace/VideoPlayer";
import { PipelineStep } from "@/components/workspace/ProcessingStatus";
import { UploadDialog } from "@/components/workspace/UploadDialog";
import { DetectionStats } from "@/components/workspace/DetectionStats";
import { DetectionTimeline } from "@/components/workspace/DetectionTimeline";
import { Meteors } from "@/components/ui/aceternity/meteors";
import { CreateCaseModal } from "@/features/cases/components/CreateCaseModal";
import { io } from "socket.io-client";

// Shadcn UI Imports
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ResizableLayout } from "@/components/ui/custom-resizable";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { useAuth } from "../hooks/useAuth";
import type { Detection, VideoSummary } from "@/types/video";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Workspace — EYEQ" }] }),
  component: Workspace,
});

function Workspace() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateCaseOpen, setIsCreateCaseOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Real-time progress state
  const [liveProgress, setLiveProgress] = useState<{ progress: number, message: string } | null>(null);

  // Queries
  const { data: videos = [], isLoading: isLoadingVideos } = useVideos();

  const activeId = selected || (videos.length > 0 ? videos[0]._id : null);
  const active = videos.find((v: any) => v._id === activeId);

  const { data: pipeline = { frames_extracted: false, objects_detected: false, embeddings_generated: false, indexed: false } } = useQuery({
    queryKey: ["pipeline", activeId],
    queryFn: () => fetchPipelineStatus(activeId!),
    enabled: !!activeId,
    refetchInterval: (active?.status === "queued" || active?.status === "processing") ? 3000 : false,
  });

  const { detections, detectionsBySecond, stats } = useVideoDetections(
    activeId,
    active?.status === "indexed"
  );

  const { data: summary } = useQuery<VideoSummary>({
    queryKey: ["summary", activeId],
    queryFn: () => fetchSummary(activeId!),
    enabled: !!activeId && active?.status === "indexed",
  });

  // Sync playing state with video element
  useEffect(() => {
    if (videoRef.current) {
      if (playing) videoRef.current.play().catch(() => {});
      else videoRef.current.pause();
    }
  }, [playing]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const jumpToTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setPlaying(true);
    }
  };

  const handleExportEvidence = async () => {
    if (!activeId || !active) return;
    try {
      setIsExporting(true);
      const blob = await exportEvidence(activeId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${active.originalName}_Evidence.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!activeId || !active) return;
    try {
      setIsGenerating(true);
      const blob = await generateReport(activeId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${active.originalName}_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Socket.IO for real-time progress
  useEffect(() => {
    if (!activeId || active?.status !== "processing") {
      setLiveProgress(null);
      return;
    }

    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      auth: { token },
      transports: ["websocket"]
    });

    socket.on("connect", () => {
      socket.emit("join_video", activeId);
    });

    socket.on("video_progress", (data: { videoId: string, progress: number, message: string }) => {
      if (data.videoId === activeId) {
        setLiveProgress({ progress: data.progress, message: data.message });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeId, active?.status, token]);

  // Detections handling moved to useVideoDetections hook and HTML5 Canvas

  return (
    <ResizableLayout
      defaultLeftWidth={280}
      defaultRightWidth={340}
      leftPanel={
        <>
          <UploadDialog
            open={isUploadOpen}
            onOpenChange={setIsUploadOpen}
            onUploadSuccess={(id) => setSelected(id)}
          />
          <div className="p-4 flex flex-col gap-4 border-b bg-background">
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="w-full bg-white text-black hover:bg-brand-cyan font-semibold transition-colors"
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload Footage
            </Button>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-white/90">Footage Library</h2>
              <span className="text-xs text-muted-foreground font-mono">{videos.length} files</span>
            </div>
          </div>
          <VideoLibrary
            videos={videos}
            isLoadingVideos={isLoadingVideos}
            activeId={activeId}
            setSelected={setSelected}
            setPlaying={setPlaying}
          />
        </>
      }
      centerPanel={
        active ? (
          <>
            {/* Header info */}
            <div className="p-4 border-b flex items-center justify-between bg-background">
              <div>
                <h3 className="text-sm font-semibold text-white/90">{active.filename}</h3>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  {new Date(active.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
                  <Switch
                    id="overlays"
                    checked={showOverlays}
                    onCheckedChange={setShowOverlays}
                    className="data-[state=checked]:bg-brand-cyan"
                  />
                  <Label htmlFor="overlays" className="text-xs font-medium text-white/80 cursor-pointer">
                    Object Overlays
                  </Label>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 bg-zinc-950/50">
              <div className="p-6 max-w-5xl mx-auto w-full space-y-8">

                {/* Video Player */}
                <div className="space-y-4">
                  <VideoPlayer
                    active={active}
                    token={token}
                    videoRef={videoRef}
                    showOverlays={showOverlays}
                    detectionsBySecond={detectionsBySecond}
                    isPlaying={playing}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                  />
                </div>

                {/* Pipeline + Timeline Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Processing Pipeline */}
                  <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-5 flex items-center gap-2">
                      <Database className="h-4 w-4" /> Processing Pipeline
                    </h4>
                    <div className="space-y-4 ml-1 relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-brand-cyan/20 before:via-brand-cyan/20 before:to-transparent">
                      <PipelineStep label="Video Uploaded" done={true} />
                      <PipelineStep label="Frames Extracted" done={pipeline.frames_extracted} active={active.status === "processing" && !pipeline.frames_extracted} />
                      <PipelineStep label="Objects Detected" done={pipeline.objects_detected} active={pipeline.frames_extracted && !pipeline.objects_detected} />
                      <PipelineStep label="Embeddings Generated" done={pipeline.embeddings_generated} active={pipeline.objects_detected && !pipeline.embeddings_generated} />
                      <PipelineStep label="Search Index Ready" done={pipeline.indexed} active={pipeline.embeddings_generated && !pipeline.indexed} />
                    </div>
                    {liveProgress && active.status === "processing" && (
                      <div className="mt-6 pt-4 border-t border-zinc-800/50">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-brand-cyan font-medium">{liveProgress.message}</span>
                          <span className="text-zinc-400">{liveProgress.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-cyan transition-all duration-500 ease-out" 
                            style={{ width: `${liveProgress.progress}%` }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Detection Timeline */}
                  <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-5 flex flex-col h-full max-h-[300px]">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Detection Timeline
                    </h4>
                    <DetectionTimeline
                      detections={detections}
                      status={active.status}
                      onJumpToTime={jumpToTime}
                      currentTime={currentTime}
                    />
                  </div>

                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            Upload footage to begin investigation.
          </div>
        )
      }
      rightPanel={
        <>
          <div className="absolute top-0 left-0 right-0 h-40 overflow-hidden pointer-events-none opacity-[0.08] mix-blend-screen">
            <Meteors number={10} />
          </div>

          <div className="p-4 border-b bg-background relative z-10">
            <h2 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-brand-cyan" />
              Footage Intelligence
            </h2>
          </div>

          <ScrollArea className="flex-1 relative z-10">
            <div className="p-4 space-y-6">

              {!active ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <Database className="h-8 w-8 text-zinc-700" />
                  <p className="text-sm text-zinc-500">
                    Upload footage to see intelligence metrics and actions.
                  </p>
                </div>
              ) : (
                <>
                  {/* Real Detection Stats */}
                  <DetectionStats
                    summary={summary}
                    advancedStats={stats}
                    status={active.status}
                  />

                  <Separator className="bg-border" />

                  {/* Actions */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                      Actions
                    </div>
                    <Button 
                      onClick={() => navigate({ to: "/search", search: { videoId: activeId } })}
                      variant="outline" 
                      className="w-full justify-start border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan hover:text-black transition-colors h-11"
                    >
                      <Search className="mr-3 h-4 w-4" />
                      Search Footage
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-white/10 hover:bg-white/5 hover:text-white transition-colors h-11"
                      onClick={() => setIsCreateCaseOpen(true)}
                    >
                      <FolderPlus className="mr-3 h-4 w-4 text-muted-foreground" />
                      Create Case File
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-white/10 hover:bg-white/5 hover:text-white transition-colors h-11 disabled:opacity-50" 
                      disabled={isExporting}
                      onClick={handleExportEvidence}
                    >
                      {isExporting ? <Loader2 className="mr-3 h-4 w-4 animate-spin text-brand-cyan" /> : <FileDown className="mr-3 h-4 w-4 text-muted-foreground" />}
                      {isExporting ? "Bundling ZIP..." : "Export Evidence"}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-white/10 hover:bg-white/5 hover:text-white transition-colors h-11 disabled:opacity-50" 
                      disabled={isGenerating}
                      onClick={handleGenerateReport}
                    >
                      {isGenerating ? <Loader2 className="mr-3 h-4 w-4 animate-spin text-brand-cyan" /> : <FileText className="mr-3 h-4 w-4 text-muted-foreground" />}
                      {isGenerating ? "Generating PDF..." : "Generate Report"}
                    </Button>
                  </div>
                </>
              )}

            </div>
          </ScrollArea>
          
          <CreateCaseModal 
            isOpen={isCreateCaseOpen}
            onClose={() => setIsCreateCaseOpen(false)}
          />
        </>
      }
    />
  );
}
