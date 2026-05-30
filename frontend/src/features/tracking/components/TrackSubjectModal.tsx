import { useState, useEffect } from "react";
import { Loader2, Activity, Fingerprint, Crosshair, MapPin, UserSquare2, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrackMatch, trackSubject, createSubject } from "../api";
import { addEvidence } from "../../cases/services/caseApi";
import { toast } from "sonner";

interface TrackSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectionId: string;
  sourceThumbnail: string;
  caseId?: string; // If provided, we can automatically add to case
}

export function TrackSubjectModal({ isOpen, onClose, detectionId, sourceThumbnail, caseId }: TrackSubjectModalProps) {
  const [threshold, setThreshold] = useState<number>(0.85);
  const [matches, setMatches] = useState<TrackMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [subjectCreated, setSubjectCreated] = useState(false);

  useEffect(() => {
    if (isOpen && detectionId) {
      handleTrack();
      setSubjectCreated(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, detectionId]); // ← threshold deliberately excluded: user clicks Re-Scan to apply

  const handleTrack = async () => {
    try {
      setIsLoading(true);
      const results = await trackSubject(detectionId, threshold);
      setMatches(results);
    } catch (err) {
      toast.error("Failed to track subject across network");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveIdentity = async () => {
    try {
      setIsSaving(true);
      // 1. Create the persistent subject profile
      await createSubject(matches, detectionId);
      
      // 2. If caseId exists, bulk add all matches as evidence with origin tracking
      if (caseId) {
        for (const match of matches) {
          // Skip the source detection to avoid duplicates if it's already in the case, 
          // or just add it (simple approach)
          if (match.detectionId !== detectionId) {
            await addEvidence(caseId, {
              videoId: match.videoId,
              videoFilename: match.videoFilename,
              detectionId: match.detectionId,
              timestamp: match.timestamp,
              timestampSeconds: match.timestampSeconds,
              label: "Tracked Subject",
              confidence: match.confidence,
              thumbnailPath: match.thumbnail,
              originEvidenceId: detectionId  // traceability: which detection triggered this
            });
          }
        }
        toast.success(`Identity established and ${matches.length - 1} new timeline events added to case!`);
      } else {
        toast.success("Identity established successfully!");
      }
      setSubjectCreated(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      toast.error("Failed to establish identity");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl bg-zinc-950 border border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl">
        
        {/* Header Area */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Fingerprint className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <DialogTitle className="text-xl tracking-tight text-white flex items-center gap-2">
                  Subject Re-Identification
                  {isLoading && <Activity className="h-4 w-4 text-indigo-400 animate-pulse" />}
                </DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Scanning global network for Market1501 visual signature matches.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Threshold Scrubber */}
          <div className="mt-6 bg-zinc-900 rounded-lg p-4 border border-zinc-800 flex items-center gap-4">
            <Crosshair className="h-4 w-4 text-zinc-500" />
            <div className="flex-1">
              <div className="flex justify-between text-xs font-medium text-zinc-400 mb-2">
                <span>Precision Tuning (Confidence)</span>
                <span className="text-indigo-400">{Math.round(threshold * 100)}% Match</span>
              </div>
              <input 
                type="range" 
                min="0.7" 
                max="0.95" 
                step="0.05" 
                value={threshold} 
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 mt-1 uppercase tracking-wider">
                <span>Higher Recall</span>
                <span>Higher Precision</span>
              </div>
            </div>
            <button
              onClick={handleTrack}
              disabled={isLoading}
              className="ml-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 rounded-lg hover:bg-indigo-600/40 hover:text-indigo-300 transition-all disabled:opacity-50"
            >
              {isLoading ? "Scanning..." : "Re-Scan"}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex h-[400px]">
          
          {/* Target Profile Left */}
          <div className="w-1/3 bg-zinc-900/30 border-r border-zinc-800 p-6 flex flex-col items-center justify-center">
            <div className="w-40 h-56 bg-zinc-900 rounded-xl border-2 border-indigo-500/30 overflow-hidden relative shadow-[0_0_30px_rgba(99,102,241,0.1)] group">
              <img src={sourceThumbnail ? (sourceThumbnail.startsWith('http') ? sourceThumbnail : `http://localhost:8001${sourceThumbnail.startsWith('/') ? '' : '/'}${sourceThumbnail}`) : ''} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all" alt="Target" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <UserSquare2 className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold tracking-wider text-white">TARGET_SIG_#01</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-6 text-center max-w-[200px]">
              Extracting semantic clothing, gait, and structural features via OSNet.
            </p>
          </div>

          {/* Journey Right */}
          <div className="flex-1 p-6 overflow-y-auto bg-zinc-950/50">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
                <p className="text-sm font-medium uppercase tracking-widest">Correlating Embeddings...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                <p className="text-sm">No other matches found at {Math.round(threshold*100)}% confidence.</p>
              </div>
            ) : (
              <div className="relative pl-6">
                {/* Timeline Line */}
                <div className="absolute left-[35px] top-4 bottom-4 w-0.5 bg-zinc-800"></div>

                {matches.map((m, idx) => (
                  <div key={idx} className="relative flex items-start gap-6 mb-8 group">
                    
                    {/* Timeline Node */}
                    <div className="relative z-10 w-8 h-8 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center mt-4 group-hover:border-indigo-400 transition-colors">
                      {idx === 0 ? <Play className="h-3 w-3 text-emerald-400" /> : <MapPin className="h-3 w-3 text-zinc-400 group-hover:text-indigo-400" />}
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex gap-4 hover:border-indigo-500/50 transition-colors shadow-lg">
                      <div className="w-20 h-20 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
                        <img src={m.thumbnail ? (m.thumbnail.startsWith('http') ? m.thumbnail : `http://localhost:8001${m.thumbnail.startsWith('/') ? '' : '/'}${m.thumbnail}`) : ''} className="w-full h-full object-cover" alt="Match" />
                      </div>
                      <div className="flex-1 py-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                            {m.videoFilename}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${m.confidence === 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                            {Math.round(m.confidence * 100)}% Match
                          </span>
                        </div>
                        <p className="text-lg font-bold text-white font-mono tracking-tight">{m.timestamp}</p>
                        {m.confidence === 1 && (
                          <p className="text-[10px] text-emerald-500/80 uppercase font-bold mt-1 tracking-wider">Source Signature</p>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 flex justify-between items-center">
          <p className="text-xs text-zinc-500">
            {matches.length} chronological sightings correlated.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">Cancel</Button>
            <Button 
              disabled={isLoading || isSaving || subjectCreated || matches.length === 0}
              onClick={handleSaveIdentity}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Fingerprint className="mr-2 h-4 w-4" />}
              {subjectCreated ? "Identity Established" : "Establish Identity & Add to Timeline"}
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
