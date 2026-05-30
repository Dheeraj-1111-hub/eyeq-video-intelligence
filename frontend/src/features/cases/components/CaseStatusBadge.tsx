import { Badge } from "@/components/ui/badge";
import { CaseStatus } from "../types";

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  if (status === "Open") {
    return <Badge variant="secondary" className="bg-brand-cyan/20 text-brand-cyan border-none text-[9px] uppercase font-bold tracking-wider">Open</Badge>;
  }
  if (status === "Under Investigation") {
    return <Badge variant="secondary" className="bg-brand-purple/20 text-brand-purple border-none text-[9px] uppercase font-bold tracking-wider">Investigating</Badge>;
  }
  if (status === "Review") {
    return <Badge variant="secondary" className="bg-brand-amber/20 text-brand-amber border-none text-[9px] uppercase font-bold tracking-wider">Review</Badge>;
  }
  return <Badge variant="outline" className="border-white/10 text-muted-foreground text-[9px] uppercase font-bold tracking-wider">Closed</Badge>;
}
