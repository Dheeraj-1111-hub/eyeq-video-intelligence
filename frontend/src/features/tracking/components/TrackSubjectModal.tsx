import { useState, useEffect } from "react";
import { Loader2, Fingerprint, Crosshair, MapPin, UserSquare2, Play, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrackMatch, trackSubject, createSubject } from "../api";
import { addEvidence } from "../../cases/services/caseApi";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface TrackSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectionId: string;
  sourceThumbnail: string;
  caseId?: string;
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
  }, [isOpen, detectionId]);

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
      await createSubject(matches, detectionId);
      
      if (caseId) {
        for (const match of matches) {
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
              originEvidenceId: detectionId
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

  const getImageUrl = (thumb: string) => {
    if (!thumb) return "";
    return thumb.startsWith('http') ? thumb : `http://localhost:8001${thumb.startsWith('/') ? '' : '/'}${thumb}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-zinc-950/90 backdrop-blur-3xl border border-white/10 text-zinc-100 p-0 overflow-hidden shadow-[0_0_80px_rgba(99,102,241,0.15)] flex flex-col">
        
        {/* Header Area */}
        <div className="p-4 md:p-5 border-b border-white/5 bg-gradient-to-r from-zinc-900/50 to-transparent relative overflow-hidden flex-shrink-0">
          {/* subtle animated glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />
          
          <DialogHeader>
            <div className="flex items-center gap-3 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Fingerprint className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl tracking-tight text-white flex items-center gap-2">
                  Subject Re-Identification
                  {isLoading && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="h-1.5 w-1.5 rounded-full bg-brand-cyan"
                    />
                  )}
                </DialogTitle>
                <DialogDescription className="text-zinc-400 text-xs mt-0.5">
                  Scanning global vector space for Market1501 visual signature matches.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Threshold Scrubber */}
          <div className="mt-4 md:mt-5 bg-black/40 rounded-xl p-3 md:p-4 border border-white/5 flex items-center gap-4 relative z-10 backdrop-blur-md">
            <div className="h-8 w-8 hidden md:flex rounded-full bg-white/5 items-center justify-center border border-white/10">
              <Crosshair className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[10px] md:text-xs font-semibold text-zinc-400 mb-2">
                <span className="uppercase tracking-wider">Precision Tuning</span>
                <span className="text-indigo-400 font-mono text-xs">{Math.round(threshold * 100)}% Match</span>
              </div>
              <input 
                type="range" 
                min="0.7" 
                max="0.95" 
                step="0.05" 
                value={threshold} 
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
              />
              <div className="flex justify-between text-[9px] text-zinc-500 mt-1.5 uppercase tracking-widest font-bold">
                <span>Higher Recall</span>
                <span>Higher Precision</span>
              </div>
            </div>
            <Button
              onClick={handleTrack}
              disabled={isLoading}
              variant="outline"
              className="ml-2 h-8 px-4 text-xs font-bold uppercase tracking-wider bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-all disabled:opacity-50"
            >
              {isLoading ? "Scanning..." : "Re-Scan"}
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 min-h-[250px] max-h-[350px] overflow-hidden relative">
          
          {/* Target Profile Left */}
          <div className="w-1/3 bg-black/20 border-r border-white/5 p-4 md:p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
            
            <div className="w-32 md:w-40 h-44 md:h-56 bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl group">
              {sourceThumbnail ? (
                <img 
                  src={getImageUrl(sourceThumbnail)} 
                  className={`w-full h-full object-cover transition-all duration-700 ${isLoading ? 'grayscale brightness-50 blur-[2px]' : 'grayscale-[20%]'}`} 
                  alt="Target" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                />
              ) : null}
              <div className={`absolute inset-0 flex items-center justify-center bg-zinc-900 ${sourceThumbnail ? 'hidden' : ''}`}>
                <UserSquare2 className="h-10 w-10 text-zinc-700" />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              
              {/* Animated Scanner Line */}
              {isLoading && (
                <motion.div 
                  initial={{ top: 0 }}
                  animate={{ top: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-brand-cyan shadow-[0_0_20px_var(--color-brand-cyan)] z-20"
                />
              )}

              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] md:text-[10px] font-bold tracking-widest text-white font-mono bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-md">TARGET_SIG</span>
              </div>
            </div>
            
            <p className="text-[10px] text-zinc-500 mt-4 md:mt-6 text-center max-w-[200px] leading-relaxed hidden md:block">
              Extracting semantic clothing, gait, and structural features via OSNet.
            </p>
          </div>

          {/* Journey Right */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-black/40 relative custom-scrollbar">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-zinc-500"
                >
                  <div className="relative mb-4">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-cyan relative z-10" />
                    <div className="absolute inset-0 bg-brand-cyan/20 blur-xl rounded-full" />
                  </div>
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Correlating Vector Embeddings...</p>
                </motion.div>
              ) : matches.length === 0 ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-zinc-500"
                >
                  <div className="h-12 w-12 rounded-full border border-dashed border-zinc-700 flex items-center justify-center mb-3">
                    <MapPin className="h-5 w-5 text-zinc-600" />
                  </div>
                  <p className="text-xs md:text-sm">No other matches found at {Math.round(threshold*100)}% confidence.</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="relative pl-6 md:pl-8"
                >
                  {/* Timeline Line */}
                  <div className="absolute left-[31px] md:left-[39px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-brand-cyan/50 via-indigo-500/20 to-transparent rounded-full" />

                  {matches.map((m, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx} 
                      className="relative flex items-start gap-4 md:gap-6 mb-6 group"
                    >
                      {/* Timeline Node */}
                      <div className="relative z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black border-2 border-white/10 flex items-center justify-center mt-2 group-hover:border-brand-cyan group-hover:shadow-[0_0_15px_rgba(30,212,237,0.3)] transition-all flex-shrink-0">
                        {idx === 0 ? <Play className="h-3 w-3 md:h-4 md:w-4 text-brand-cyan ml-0.5" /> : <MapPin className="h-3 w-3 md:h-4 md:w-4 text-zinc-400 group-hover:text-brand-cyan transition-colors" />}
                      </div>

                      {/* Content Card */}
                      <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-3 md:p-4 flex gap-3 md:gap-4 group-hover:bg-white/[0.04] group-hover:border-white/10 transition-all">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-black rounded-xl overflow-hidden border border-white/10 relative flex-shrink-0">
                          {m.thumbnail ? (
                            <img 
                              src={getImageUrl(m.thumbnail)} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              alt="Match" 
                              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                            />
                          ) : null}
                          <div className={`absolute inset-0 flex items-center justify-center bg-zinc-900 ${m.thumbnail ? 'hidden' : ''}`}>
                            <UserSquare2 className="h-6 w-6 text-zinc-700" />
                          </div>
                        </div>
                        <div className="flex-1 py-0.5 flex flex-col justify-center min-w-0">
                          <div className="flex items-center justify-between mb-1 md:mb-1.5">
                            <span className="text-[10px] md:text-xs font-semibold text-zinc-400 bg-black/40 px-2 py-0.5 md:py-1 rounded-full border border-white/5 truncate mr-2">
                              {m.videoFilename}
                            </span>
                            <span className={`text-[8px] md:text-[9px] font-bold px-2 py-0.5 md:py-1 rounded-full uppercase tracking-wider flex-shrink-0 ${m.confidence === 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : m.confidence > 0.9 ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                              {Math.round(m.confidence * 100)}%
                            </span>
                          </div>
                          <p className="text-lg md:text-xl font-bold text-white font-mono tracking-tight">{m.timestamp}</p>
                          {m.confidence === 1 && (
                            <div className="flex items-center gap-1 md:gap-1.5 mt-1 md:mt-1.5">
                              <CheckCircle2 className="h-2.5 w-2.5 md:h-3 md:w-3 text-emerald-500" />
                              <p className="text-[8px] md:text-[9px] text-emerald-500 uppercase font-bold tracking-widest">Source Sig</p>
                            </div>
                          )}
                        </div>
                      </div>

                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 md:p-4 border-t border-white/5 bg-black/60 backdrop-blur-xl flex justify-between items-center relative z-10 flex-shrink-0">
          <p className="text-[10px] md:text-xs text-zinc-500 font-mono">
            <span className="text-white font-bold">{matches.length}</span> chronological sightings.
          </p>
          <div className="flex gap-2 md:gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-zinc-400 hover:text-white hover:bg-white/5 text-xs md:text-sm h-8 md:h-9">Cancel</Button>
            <Button 
              size="sm"
              disabled={isLoading || isSaving || subjectCreated || matches.length === 0}
              onClick={handleSaveIdentity}
              className={`text-xs md:text-sm h-8 md:h-9 font-bold px-3 md:px-5 tracking-wide transition-all ${subjectCreated ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-brand-cyan text-black hover:bg-brand-cyan/90 hover:shadow-[0_0_20px_rgba(30,212,237,0.3)]'}`}
            >
              {isSaving ? <Loader2 className="mr-1.5 h-3 w-3 md:h-4 md:w-4 animate-spin" /> : subjectCreated ? <CheckCircle2 className="mr-1.5 h-3 w-3 md:h-4 md:w-4" /> : <Fingerprint className="mr-1.5 h-3 w-3 md:h-4 md:w-4" />}
              {subjectCreated ? "Identity Established" : "Establish Identity"}
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
