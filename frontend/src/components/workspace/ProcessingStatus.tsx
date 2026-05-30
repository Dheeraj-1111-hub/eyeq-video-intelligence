import { CheckCircle2, Loader2, AlertCircle, Clock, Check } from "lucide-react";

export function StatusIndicator({ status, isActive }: { status: string; isActive?: boolean }) {
  if (status === "indexed") {
    return (
      <div className={`flex items-center gap-1.5 text-xs font-medium ${isActive ? "text-brand-cyan" : "text-emerald-400"}`}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        Indexed
      </div>
    );
  }
  if (status === "processing") {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Processing
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-red-400">
        <AlertCircle className="h-3.5 w-3.5" />
        Failed
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
      <Clock className="h-3.5 w-3.5" />
      Queued
    </div>
  );
}

export function PipelineStep({ label, done, active }: { label: string; done: boolean; active?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center justify-center h-6 w-6 rounded-full border ${done ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan' : active ? 'border-brand-cyan text-brand-cyan shadow-[0_0_10px_rgba(30,212,237,0.3)] animate-pulse' : 'border-zinc-800 text-zinc-600'}`}>
        {done ? <Check className="h-3 w-3" /> : active ? <Loader2 className="h-3 w-3 animate-spin" /> : <div className="h-1.5 w-1.5 rounded-full bg-zinc-800" />}
      </div>
      <span className={`text-sm ${done ? 'text-white' : active ? 'text-brand-cyan font-medium' : 'text-zinc-600'}`}>
        {label}
      </span>
    </div>
  );
}
