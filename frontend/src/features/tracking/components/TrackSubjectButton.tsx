import { useState } from "react";
import { Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackSubjectModal } from "./TrackSubjectModal";

interface TrackSubjectButtonProps {
  detectionId: string;
  thumbnail: string;
  caseId?: string;
}

export function TrackSubjectButton({ detectionId, thumbnail, caseId }: TrackSubjectButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setIsModalOpen(true)}
        variant="outline" 
        size="sm" 
        className="w-full mt-2 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all font-semibold gap-2 shadow-[0_0_10px_rgba(99,102,241,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
      >
        <Crosshair className="h-3 w-3" />
        Track Subject
      </Button>

      <TrackSubjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        detectionId={detectionId}
        sourceThumbnail={thumbnail}
        caseId={caseId}
      />
    </>
  );
}
