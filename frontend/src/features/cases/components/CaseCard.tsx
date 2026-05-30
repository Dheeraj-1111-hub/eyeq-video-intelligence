import { Case } from "../types";
import { CaseStatusBadge } from "./CaseStatusBadge";
import { motion } from "framer-motion";
import { MovingBorder } from "@/components/ui/aceternity/moving-border";

export function CaseCard({ c, isActive, onClick }: { c: Case; isActive: boolean; onClick: () => void }) {
  const content = (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-colors border ${
        isActive
          ? "bg-brand-cyan/10 border-brand-cyan/20"
          : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1 pr-2">
          <div className={`truncate text-sm font-medium ${isActive ? "text-white" : "text-muted-foreground"}`}>
            {c.title}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground font-mono">
            {c.priority} <span className="opacity-50">·</span> {c.clipsCount || 0} clips
          </div>
        </div>
        <CaseStatusBadge status={c.status} />
      </div>
    </button>
  );

  return (
    <div className="relative group">
      {isActive ? (
        <div className="relative rounded-lg overflow-hidden p-[1px] shadow-[0_0_10px_rgba(30,212,237,0.1)] z-10">
          <MovingBorder duration={4000} rx="8px" ry="8px">
            <div className="h-full w-full bg-white/20" />
          </MovingBorder>
          <div className="relative z-10 bg-background/95 rounded-lg backdrop-blur-md">
            {content}
          </div>
        </div>
      ) : (
        <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }} className="relative z-10">
          {content}
        </motion.div>
      )}
    </div>
  );
}
