import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import api from "../lib/api";
import {
  Search,
  Filter,
  Cpu,
  CheckCircle2,
  CircleDashed,
  Clock,
  ChevronRight,
  Play,
} from "lucide-react";
import { motion } from "framer-motion";

// Shadcn UI Imports
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ResizableLayout } from "@/components/ui/custom-resizable";

// Aceternity UI Imports
import { Meteors } from "@/components/ui/aceternity/meteors";
import { MovingBorder } from "@/components/ui/aceternity/moving-border";
import { AddToCaseModal } from "@/features/cases/components/AddToCaseModal";

interface SearchResult {
  video_id: string;
  detection_id: string;
  frame: number;
  timestamp: string;
  timestamp_seconds: number;
  label: string;
  confidence: number;
  thumbnail: string;
  score: number;
  video_filename: string;
}

interface SearchMetadata {
  indexedCount: number;
  processingCount: number;
  cameras: { id: string, name: string }[];
  entities: string[];
}

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): { videoId?: string; q?: string } => {
    return {
      videoId: search.videoId as string | undefined,
      q: search.q as string | undefined,
    };
  },
  component: SearchPage,
});

function SearchPage() {
  const navigate = useNavigate();
  const { videoId, q: initialQuery } = Route.useSearch();
  const [scope, setScope] = useState<"workspace" | "video">(videoId ? "video" : "workspace");
  const [searchMode, setSearchMode] = useState<"semantic" | "exact">("semantic");
  const [query, setQuery] = useState(initialQuery || "");
  
  // Advanced Filters
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [timeWindow, setTimeWindow] = useState<number[]>([0, 24]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [metadata, setMetadata] = useState<SearchMetadata>({
    indexedCount: 0,
    processingCount: 0,
    cameras: [],
    entities: [],
  });
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  
  // Modal State
  const [selectedResultForCase, setSelectedResultForCase] = useState<SearchResult | null>(null);
  
  // NLP Parser state
  const [nlp, setNlp] = useState({ subject: "", action: "", object: "" });

  useEffect(() => {
    // Load search history
    try {
      const history = JSON.parse(localStorage.getItem("eyeq_search_history") || "[]");
      setRecentQueries(history);
    } catch (e) {}

    const fetchMetadata = async () => {
      try {
        const res = await api.get("/search/metadata");
        setMetadata(res.data);
      } catch (err) {
        console.error("Failed to fetch search metadata", err);
      }
    };
    fetchMetadata();
  }, []);

  // Auto-search if an initial query was provided
  useEffect(() => {
    if (initialQuery && !hasSearched && !isSearching) {
      handleSearch();
    }
  }, [initialQuery, hasSearched, isSearching]);

  const parseQuery = (q: string) => {
    // Ultra simple heuristic parser for MVP
    const lower = q.toLowerCase();
    const actionWords = ["entering", "leaving", "moving", "running", "walking", "carrying", "holding"];
    const action = actionWords.find(w => lower.includes(w)) || "";
    
    let subject = "";
    let object = "";
    
    if (metadata.entities.length > 0) {
      // Find matching entities in query
      const matches = metadata.entities.filter(e => lower.includes(e.toLowerCase()));
      if (matches.length > 0) subject = matches[0];
      if (matches.length > 1) object = matches[1];
    } else {
      // Fallback
      if (lower.includes("person") || lower.includes("vehicle") || lower.includes("bus")) subject = lower.split(" ")[0];
      if (lower.includes("backpack") || lower.includes("bag")) object = "backpack";
    }

    setNlp({ subject, action, object });
  };

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    try {
      const payload: any = { 
        query, 
        top_k: 12, 
        mode: searchMode,
        confidenceThreshold: confidenceThreshold > 0 ? confidenceThreshold / 100 : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        entities: selectedEntities.length > 0 ? selectedEntities : undefined,
        startHour: timeWindow[0] > 0 ? timeWindow[0] : undefined,
        endHour: timeWindow[1] < 24 ? timeWindow[1] : undefined
      };
      
      // Inject videoId if scope is restricted
      if (scope === "video" && videoId) {
        payload.videoId = videoId;
      } else if (selectedCameraId) {
        payload.videoId = selectedCameraId;
      }
      
      const res = await api.post("/search", payload);
      setResults(res.data);
      setHasSearched(true);
      parseQuery(query);

      // Save history
      const newHistory = [query, ...recentQueries.filter(q => q !== query)].slice(0, 5);
      setRecentQueries(newHistory);
      localStorage.setItem("eyeq_search_history", JSON.stringify(newHistory));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleResultClick = (res: SearchResult) => {
    // Navigate to workspace with video selected
    navigate({
      to: "/",
      search: {
        active: res.video_id,
        t: res.timestamp_seconds,
      },
    });
  };

  return (
    <ResizableLayout
      defaultLeftWidth={280}
      leftPanel={
        <>
          <div className="p-4 flex items-center gap-2 border-b bg-background">
            <Filter className="h-4 w-4 text-brand-cyan" />
            <h2 className="text-sm font-semibold tracking-tight text-white/90">Filters</h2>
          </div>
          <ScrollArea className="flex-1 p-5">
            <div className="space-y-8">
              <FilterSection title="Date Range">
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Start</label>
                      <Input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-8 text-xs bg-zinc-900 border-zinc-800 focus-visible:ring-brand-cyan" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">End</label>
                      <Input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-8 text-xs bg-zinc-900 border-zinc-800 focus-visible:ring-brand-cyan" 
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge
                      variant="outline"
                      onClick={() => {
                        const d = new Date(); d.setDate(d.getDate() - 7);
                        setStartDate(d.toISOString().split('T')[0]);
                        setEndDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="cursor-pointer hover:bg-muted text-muted-foreground border-white/10"
                    >
                      Last 7 days
                    </Badge>
                    <Badge
                      variant="outline"
                      onClick={() => {
                        const d = new Date(); d.setDate(d.getDate() - 30);
                        setStartDate(d.toISOString().split('T')[0]);
                        setEndDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="cursor-pointer hover:bg-muted text-muted-foreground border-white/10"
                    >
                      Last 30 days
                    </Badge>
                    {(startDate || endDate) && (
                      <Badge
                        variant="default"
                        onClick={() => {
                          setStartDate("");
                          setEndDate("");
                        }}
                        className="cursor-pointer bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      >
                        Clear Dates
                      </Badge>
                    )}
                  </div>
                </div>
              </FilterSection>

              <FilterSection title="Entities">
                <div className="flex flex-wrap gap-2">
                  {metadata.entities.length > 0 ? (
                    metadata.entities.map((entity, i) => {
                      const isSelected = selectedEntities.includes(entity);
                      return (
                        <Badge
                          key={entity}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => {
                            setSelectedEntities(prev => 
                              isSelected ? prev.filter(e => e !== entity) : [...prev, entity]
                            );
                          }}
                          className={`cursor-pointer capitalize ${isSelected ? "bg-brand-cyan text-black hover:bg-brand-cyan/90" : "hover:bg-muted text-muted-foreground border-white/10"}`}
                        >
                          {entity}
                        </Badge>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No entities detected yet</span>
                  )}
                </div>
              </FilterSection>

              <FilterSection title="Camera Source">
                <div className="flex flex-col gap-2">
                  <select 
                    value={scope === "video" && videoId ? videoId : selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      if (e.target.value) {
                        setScope("workspace"); // Unset strictly isolated "video" scope to allow normal search with camera filter
                      }
                    }}
                    className="h-8 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan"
                  >
                    <option value="">All Cameras</option>
                    {metadata.cameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>{cam.name}</option>
                    ))}
                  </select>
                </div>
              </FilterSection>

              <FilterSection title="Time Window">
                <div className="space-y-4">
                  <div className="text-xs font-mono text-muted-foreground flex justify-between">
                    <span>{timeWindow[0].toString().padStart(2, '0')}:00</span>
                    <span>{timeWindow[1].toString().padStart(2, '0')}:00</span>
                  </div>
                  <Slider
                    value={timeWindow}
                    onValueChange={(vals) => setTimeWindow(vals)}
                    max={24}
                    step={1}
                    className="[&_[role=slider]]:bg-brand-cyan [&>span:first-child]:bg-brand-cyan/20 [&_[role=slider]]:border-brand-cyan"
                  />
                </div>
              </FilterSection>

              <FilterSection title="Min Confidence">
                <div className="space-y-4">
                  <div className="text-xs font-mono flex justify-between">
                    <span className="text-muted-foreground">0%</span>
                    <span className="text-brand-cyan font-bold">{confidenceThreshold}%</span>
                    <span className="text-muted-foreground">100%</span>
                  </div>
                  <Slider
                    value={[confidenceThreshold]}
                    onValueChange={(vals) => setConfidenceThreshold(vals[0])}
                    max={100}
                    step={5}
                    className="[&_[role=slider]]:bg-brand-cyan [&>span:first-child]:bg-brand-cyan/20 [&_[role=slider]]:border-brand-cyan"
                  />
                </div>
              </FilterSection>
            </div>
          </ScrollArea>
        </>
      }
      centerPanel={
        <>
          {/* Search Header */}
          <div className="p-6 border-b bg-background flex flex-col gap-6">
            
            {/* Scope & Mode Toggles */}
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScope("workspace")}
                  className={`rounded-full h-8 px-4 text-xs font-semibold ${scope === "workspace" ? "bg-white text-black border-white" : "bg-black text-muted-foreground border-white/10 hover:text-white"}`}
                >
                  Entire Workspace
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!videoId}
                  onClick={() => { if (videoId) setScope("video"); }}
                  className={`rounded-full h-8 px-4 text-xs font-semibold ${scope === "video" ? "bg-brand-cyan text-black border-brand-cyan" : "bg-black text-muted-foreground border-white/10 hover:text-white"} disabled:opacity-30`}
                >
                  Selected Video {videoId ? "" : "(None Selected)"}
                </Button>
              </div>

              <div className="flex items-center gap-6 text-xs font-medium text-muted-foreground">
                <label 
                  onClick={() => setSearchMode("semantic")}
                  className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                >
                  <div className={`w-3 h-3 rounded-full border border-brand-purple flex items-center justify-center ${searchMode === "semantic" ? "bg-brand-purple" : "bg-transparent"}`}>
                    {searchMode === "semantic" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  Semantic Search
                </label>
                <label 
                  onClick={() => setSearchMode("exact")}
                  className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                >
                  <div className={`w-3 h-3 rounded-full border border-brand-cyan flex items-center justify-center ${searchMode === "exact" ? "bg-brand-cyan" : "bg-transparent"}`}>
                    {searchMode === "exact" && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                  </div>
                  Exact Detection Search
                </label>
              </div>
            </div>

            <div className="relative max-w-2xl w-full mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by object, action, time, or natural language..."
                className="h-12 w-full pl-12 pr-24 rounded-lg border border-white/10 bg-black/40 shadow-sm text-base text-white focus-visible:border-brand-cyan focus-visible:ring-brand-cyan/20 transition-all placeholder:text-muted-foreground/50"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || metadata.indexedCount === 0}
                className="absolute right-1.5 top-1.5 h-9 px-4 rounded-md font-semibold bg-brand-cyan text-black hover:bg-brand-cyan/80 disabled:opacity-50"
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-3">
              {recentQueries.length > 0 ? (
                recentQueries.map((rq, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    onClick={() => { setQuery(rq); }}
                    className="cursor-pointer text-[11px] font-normal bg-white/5 border-white/5 hover:bg-white/10 text-muted-foreground"
                  >
                    "{rq}"
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Recent queries will appear here</span>
              )}
            </div>
          </div>

          {/* Results Grid */}
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
                  <Badge
                    variant="outline"
                    className="border-brand-cyan/30 text-brand-cyan font-bold bg-brand-cyan/10"
                  >
                    {results.length} MATCHES
                  </Badge>
                </div>
                <div className="text-sm font-semibold flex items-center gap-4">
                  <span className="text-muted-foreground cursor-pointer hover:text-white transition-colors">
                    SORT: RELEVANCE
                  </span>
                </div>
              </div>

              {metadata.indexedCount === 0 && metadata.processingCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <CircleDashed className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-white/90">No indexed footage</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                    Upload and process footage from the workspace to enable semantic search capabilities.
                  </p>
                </div>
              ) : metadata.indexedCount === 0 && metadata.processingCount > 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="h-10 w-10 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin mb-4" />
                  <h3 className="text-lg font-medium text-white/90">Indexing in progress</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                    {metadata.processingCount} source(s) are currently being processed. Search will be available soon.
                  </p>
                </div>
              ) : !hasSearched ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground italic text-sm">
                  Describe what you are looking for in plain English.
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <h3 className="text-lg font-medium text-white/90">No matches found</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                    We couldn't find any exact matches for "{query}". Try adjusting your keywords.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.map((r, i) => (
                    <ResultCard 
                      key={r.detection_id} 
                      result={r} 
                      index={i} 
                      onClick={() => handleResultClick(r)}
                      onAddToCase={(e) => { e.stopPropagation(); setSelectedResultForCase(r); }}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
          <AddToCaseModal 
            isOpen={!!selectedResultForCase} 
            onClose={() => setSelectedResultForCase(null)} 
            result={selectedResultForCase} 
          />
        </>
      }
    />
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ResultCard({ result, index, onClick, onAddToCase }: { result: SearchResult; index: number; onClick: () => void; onAddToCase: (e: React.MouseEvent) => void }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-background border border-white/5 rounded-xl overflow-hidden shadow-sm cursor-pointer group hover:border-brand-cyan/40 hover:shadow-[0_0_15px_rgba(30,212,237,0.1)] transition-colors relative"
    >
      <div className="relative aspect-video bg-zinc-950 overflow-hidden flex items-center justify-center">
        {result.thumbnail ? (
          <img 
            src={`http://localhost:8001${result.thumbnail}`} 
            alt={result.label}
            className="w-full h-full object-contain filter group-hover:brightness-110 transition-all duration-500" 
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-800 opacity-60" />
        )}

        <div className="absolute top-2 left-2 flex items-center gap-2">
          <Badge
            variant="secondary"
            className="text-[10px] bg-black/60 text-white backdrop-blur-md border-white/10 font-mono capitalize"
          >
            {result.label}
          </Badge>
          <Badge
            variant="secondary"
            className="text-[10px] bg-black/60 text-white backdrop-blur-md border-white/10 font-mono"
          >
            {result.timestamp}
          </Badge>
        </div>

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-brand-cyan text-black flex items-center justify-center shadow-[0_0_15px_var(--color-brand-cyan)] transform scale-90 group-hover:scale-100 transition-transform">
              <Play className="h-5 w-5 translate-x-0.5" />
            </div>
            <Button size="sm" onClick={onAddToCase} className="bg-black/60 text-white border border-white/20 hover:bg-white/20 hover:border-white/40 h-7 text-[10px] uppercase font-bold tracking-wider">
              Add To Case
            </Button>
          </div>
        </div>
      </div>
      <div className="p-4 bg-black/20">
        <h4 className="text-sm font-semibold truncate group-hover:text-brand-cyan transition-colors text-white/90">
          {result.video_filename}
        </h4>
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground font-mono">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> {Math.round(result.confidence * 100)}% Conf
            </span>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-brand-cyan/70">{Math.round(result.score * 100)}% Match</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DetectionBox({
  x,
  y,
  w,
  h,
  label,
  tone = "cyan",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  tone?: "cyan" | "purple" | "amber";
}) {
  const borderColor =
    tone === "cyan"
      ? "border-brand-cyan"
      : tone === "purple"
        ? "border-brand-purple"
        : "border-brand-amber";
  const bgColor =
    tone === "cyan"
      ? "bg-brand-cyan/20"
      : tone === "purple"
        ? "bg-brand-purple/20"
        : "bg-brand-amber/20";
  const badgeBg =
    tone === "cyan" ? "bg-brand-cyan" : tone === "purple" ? "bg-brand-purple" : "bg-brand-amber";

  return (
    <div
      className={`absolute border-2 ${borderColor} ${bgColor} flex flex-col items-start`}
      style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}
    >
      <div
        className={`-mt-5 px-1.5 py-0.5 text-[9px] font-bold text-black ${badgeBg} rounded-t-sm whitespace-nowrap shadow-sm`}
      >
        {label}
      </div>
    </div>
  );
}

function ExtractedVector({
  label,
  value,
  active,
  tone = "cyan",
}: {
  label: string;
  value: string;
  active?: boolean;
  tone?: "cyan" | "purple" | "amber";
}) {
  const activeBorder =
    tone === "cyan"
      ? "border-brand-cyan/30"
      : tone === "purple"
        ? "border-brand-purple/30"
        : "border-brand-amber/30";
  const activeBg =
    tone === "cyan"
      ? "bg-brand-cyan/10"
      : tone === "purple"
        ? "bg-brand-purple/10"
        : "bg-brand-amber/10";
  const activeText =
    tone === "cyan"
      ? "text-brand-cyan"
      : tone === "purple"
        ? "text-brand-purple"
        : "text-brand-amber";
  const badgeBg =
    tone === "cyan"
      ? "bg-brand-cyan text-black"
      : tone === "purple"
        ? "bg-brand-purple text-white"
        : "bg-brand-amber text-black";

  return (
    <div
      className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${active ? `${activeBg} ${activeBorder}` : "bg-background border-white/5"}`}
    >
      <span
        className={`text-[11px] font-bold tracking-wider ${active ? activeText : "text-muted-foreground"}`}
      >
        {label}
      </span>
      <Badge
        variant={active ? "default" : "secondary"}
        className={`text-[10px] font-mono tracking-wider ${active ? badgeBg : "bg-white/5 border-white/10 text-muted-foreground"}`}
      >
        {value}
      </Badge>
    </div>
  );
}

function TimelineNode({
  title,
  active,
  tone = "cyan",
}: {
  title: string;
  active?: boolean;
  tone?: "cyan" | "purple" | "amber";
}) {
  const borderColor =
    tone === "cyan"
      ? "border-brand-cyan"
      : tone === "purple"
        ? "border-brand-purple"
        : "border-brand-amber";
  const textColor =
    tone === "cyan"
      ? "text-brand-cyan"
      : tone === "purple"
        ? "text-brand-purple"
        : "text-brand-amber";

  return (
    <div className="relative flex items-center gap-4">
      <div
        className={`absolute -left-[5px] h-[11px] w-[11px] rounded-full border-2 bg-background ${active ? `${borderColor} shadow-[0_0_8px_var(--color-brand-${tone})]` : "border-muted-foreground"}`}
      />
      <span
        className={`text-[13px] ${active ? `font-semibold ${textColor}` : "text-muted-foreground font-medium"}`}
      >
        {title}
      </span>
    </div>
  );
}
