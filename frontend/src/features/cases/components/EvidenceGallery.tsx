import { Evidence } from "../types";
import { Badge } from "@/components/ui/badge";
import { Play, Fingerprint } from "lucide-react";
import { TrackSubjectButton } from "../../tracking/components/TrackSubjectButton";

export function EvidenceGallery({ evidence, caseId }: { evidence: Evidence[], caseId: string }) {
  if (evidence.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center border border-white/5 border-dashed rounded-lg">
        <p className="text-sm text-muted-foreground">No evidence added to this case yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {evidence.map((e) => (
        <div key={e._id} className="bg-background border border-white/5 rounded-xl overflow-hidden shadow-sm flex flex-col group">
          <div className="relative aspect-video bg-zinc-950 overflow-hidden flex items-center justify-center">
            {e.thumbnailPath ? (
              <img 
                src={`http://localhost:8001${e.thumbnailPath}`} 
                alt={e.label}
                className="w-full h-full object-contain filter group-hover:brightness-110 transition-all" 
              />
            ) : (
              <div className="absolute inset-0 bg-zinc-800 opacity-60" />
            )}
            <div className="absolute top-2 left-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] bg-black/60 text-white backdrop-blur-md border-white/10 font-mono capitalize">
                {e.label}
              </Badge>
              {e.originEvidenceId && (
                <span className="px-2 py-1 bg-indigo-500/80 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-wider border border-indigo-400 flex items-center shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                  <Fingerprint className="h-3 w-3 mr-1" /> Re-ID
                </span>
              )}
              <Badge variant="secondary" className="text-[10px] bg-black/60 text-white backdrop-blur-md border-white/10 font-mono">
                {e.timestamp}
              </Badge>
            </div>
          </div>
          <div className="p-3 bg-black/20 flex-1 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-semibold truncate text-white/90">
                {e.videoFilename || e.videoId}
              </h4>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono">
                <span>Conf: {Math.round(e.confidence * 100)}%</span>
              </div>
            </div>
            
            {e.label.toLowerCase() === "person" && !e.originEvidenceId && (
              <div className="mt-4">
                <TrackSubjectButton 
                  detectionId={e.detectionId} 
                  thumbnail={e.thumbnailPath || ""} 
                  caseId={caseId} 
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
