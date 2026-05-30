import { TimelineEvent } from "../types";
import { Badge } from "@/components/ui/badge";

export function TimelineView({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center border border-white/5 border-dashed rounded-lg">
        <p className="text-sm text-muted-foreground">No events recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="relative before:absolute before:inset-y-0 before:left-[15px] before:w-px before:bg-gradient-to-b before:from-brand-cyan/50 before:via-white/10 before:to-transparent">
      <div className="space-y-5">
        {events.map((e, i) => (
          <div key={e._id || i} className="relative pl-10 group">
            {/* Timeline Dot */}
            <div className="absolute left-[11.5px] top-[22px] h-[8px] w-[8px] rounded-full bg-brand-cyan border border-background shadow-[0_0_10px_var(--color-brand-cyan)] z-10 group-hover:scale-150 transition-transform duration-500" />

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 shadow-sm hover:bg-white/[0.04] hover:border-brand-cyan/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/90 capitalize">{e.title}</div>
                <div className="text-[10px] font-mono text-muted-foreground bg-black/40 px-2 py-1 rounded-md border border-white/5">{e.timestamp}</div>
              </div>

              <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                <Badge variant="secondary" className="bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20 shadow-none font-medium">
                  {e.eventType}
                </Badge>
                {e.description && <span className="font-mono opacity-80">{e.description}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
