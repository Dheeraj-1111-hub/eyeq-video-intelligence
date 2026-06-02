import { User, Activity, AlertTriangle, Crosshair, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CaseDetailsResponse } from '@/features/cases/types';

interface SubjectSidebarProps {
  onTrackToggle: () => void;
  isTracking: boolean;
  caseDetails: CaseDetailsResponse;
}

export function SubjectSidebar({ onTrackToggle, isTracking, caseDetails }: SubjectSidebarProps) {
  // Derive threat score based on evidence count
  const evidenceCount = caseDetails.evidence.length;
  const baseScore = Math.min(100, 30 + (evidenceCount * 10)); // Just a simple derived score for now
  
  // Extract unique locations
  const uniqueLocations = new Set(caseDetails.evidence.map(e => e.videoLocation).filter(Boolean));
  const hasMultipleLocations = uniqueLocations.size > 1;
  const crossCameraScore = hasMultipleLocations ? 15 : 0;
  
  const finalScore = Math.min(100, baseScore + crossCameraScore);

  return (
    <div className="w-full h-full bg-zinc-950 border-r border-white/5 p-6 flex flex-col overflow-y-auto">
      
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(30,212,237,0.2)]">
          <Crosshair className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white line-clamp-1">{caseDetails.case.title}</h2>
          <div className="text-xs text-muted-foreground font-mono">CASE: {caseDetails.case._id.substring(0, 8).toUpperCase()}</div>
        </div>
      </div>

      {/* Profile Image placeholder */}
      <div className="w-full aspect-square bg-zinc-900 border border-white/10 rounded-xl mb-6 flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
        {caseDetails.evidence.length > 0 && caseDetails.evidence[0].framePath ? (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity group-hover:scale-105 group-hover:opacity-60 transition-all duration-700" 
            style={{ backgroundImage: `url(${import.meta.env.VITE_API_URL}${caseDetails.evidence[0].framePath})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542384701-c0e46e0eda04?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity group-hover:scale-105 group-hover:opacity-60 transition-all duration-700" />
        )}
        
        <div className="relative z-20 flex flex-col items-center">
          <User className="w-12 h-12 text-zinc-500 mb-2 drop-shadow-xl" />
          <div className="text-sm font-mono text-white tracking-widest bg-black/50 px-3 py-1 rounded backdrop-blur-md border border-white/10 uppercase">
            {caseDetails.case.title.substring(0, 15)}
          </div>
        </div>
        
        <div className="absolute top-3 right-3 z-20">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
        </div>
      </div>

      {/* Risk Score */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <Activity className="w-4 h-4 text-rose-500" />
            Threat Level
          </div>
          <div className="text-rose-500 font-mono font-bold">{finalScore}/100</div>
        </div>
        
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-4">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${finalScore}%` }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="h-full bg-gradient-to-r from-amber-500 to-rose-500" 
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-500">Base Detections ({evidenceCount})</span>
            <span className="text-rose-400">+{baseScore}</span>
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-500">Cross-camera movement</span>
            <span className={crossCameraScore > 0 ? "text-amber-400" : "text-zinc-600"}>+{crossCameraScore}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Button 
          onClick={onTrackToggle}
          disabled={caseDetails.evidence.length === 0}
          className={`w-full h-12 font-bold tracking-widest relative overflow-hidden group ${
            isTracking 
              ? 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 border border-rose-500/50' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(30,212,237,0.4)]'
          }`}
        >
          {isTracking ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              STOP TRACKING
            </span>
          ) : (
            <span className="flex items-center gap-2 relative z-10">
              <Play className="w-4 h-4 fill-current" />
              INITIATE TRACKING
            </span>
          )}
          {!isTracking && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          )}
        </Button>
      </div>
      
    </div>
  );
}
