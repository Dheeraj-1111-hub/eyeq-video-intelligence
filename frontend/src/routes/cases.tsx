import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { Case, CaseDetailsResponse } from "@/features/cases/types";
import { getCases, getCaseDetails, addNote, updateCaseStatus } from "@/features/cases/services/caseApi";

// Shadcn UI Imports
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ResizableLayout } from "@/components/ui/custom-resizable";

// Aceternity UI Imports
import { Meteors } from "@/components/ui/aceternity/meteors";

// Feature Components
import { CaseCard } from "@/features/cases/components/CaseCard";
import { EvidenceGallery } from "@/features/cases/components/EvidenceGallery";
import { TimelineView } from "@/features/cases/components/TimelineView";
import { NotesPanel } from "@/features/cases/components/NotesPanel";
import { ReportPanel } from "@/features/cases/components/ReportPanel";
import { CaseStatusBadge } from "@/features/cases/components/CaseStatusBadge";

export const Route = createFileRoute("/cases")({
  head: () => ({ meta: [{ title: "Cases — EYEQ" }] }),
  component: CasesPage,
});

function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<CaseDetailsResponse | null>(null);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"overview" | "evidence" | "timeline" | "notes" | "report">("overview");

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchDetails(selectedId);
    } else {
      setDetails(null);
    }
  }, [selectedId]);

  const fetchCases = async () => {
    try {
      setLoadingCases(true);
      const data = await getCases();
      setCases(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCases(false);
    }
  };

  const fetchDetails = async (id: string) => {
    try {
      setLoadingDetails(true);
      const data = await getCaseDetails(id);
      setDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleStatusChange = async (status: any) => {
    if (!details) return;
    try {
      await updateCaseStatus(details.case._id, status, details.case.priority);
      fetchDetails(details.case._id);
      fetchCases(); // Refresh list to update badge
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ResizableLayout
      defaultLeftWidth={280}
      defaultRightWidth={320}
      leftPanel={
        <>
          <div className="p-4 flex flex-col gap-1 border-b bg-background">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-white/90">Cases</h2>
              {/* <Button variant="outline" size="sm" className="h-7 px-2 text-[10px] uppercase font-bold tracking-wider gap-1 border-white/10 hover:bg-white/10">
                <Plus className="h-3 w-3" /> New
              </Button> */}
            </div>
          </div>

          <ScrollArea className="flex-1 p-3">
            <div className="space-y-1">
              {loadingCases ? (
                <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-brand-cyan" /></div>
              ) : cases.length === 0 ? (
                <p className="text-xs text-center text-muted-foreground mt-4">No cases found.</p>
              ) : (
                cases.map((c) => (
                  <CaseCard key={c._id} c={c} isActive={c._id === selectedId} onClick={() => setSelectedId(c._id)} />
                ))
              )}
            </div>
          </ScrollArea>
        </>
      }
      centerPanel={
        !details ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            {loadingDetails ? <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" /> : "Select a case to view details"}
          </div>
        ) : (
          <>
            <div className="p-6 border-b bg-background flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-white/90 tracking-tight">{details.case.title}</h3>
                  <div className="text-[11px] text-muted-foreground font-mono mt-2 flex items-center gap-3">
                    <span className="font-bold uppercase tracking-wider px-2 py-0.5 bg-white/5 rounded border border-white/10">ID: {details.case._id.substring(0, 8)}</span>
                    <CaseStatusBadge status={details.case.status} />
                    <span className={`font-bold uppercase px-2 py-0.5 rounded border ${details.case.priority === 'Critical' ? 'bg-brand-rose/20 text-brand-rose border-brand-rose/30' : 'bg-white/5 border-white/10 text-muted-foreground'}`}>
                      {details.case.priority} PRIORITY
                    </span>
                  </div>
                </div>
                
                <select 
                  className="bg-black border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand-cyan"
                  value={details.case.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="Open">Open</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Review">Review</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-6 border-t border-white/5 pt-4 mt-2">
                {["overview", "evidence", "timeline", "notes", "report"].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors ${activeTab === tab ? "text-brand-cyan border-brand-cyan" : "text-muted-foreground border-transparent hover:text-white/80"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl mx-auto pb-12">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Case Description</h3>
                    <p className="text-sm text-white/80 leading-relaxed bg-black/30 p-4 rounded-lg border border-white/5">
                      {details.case.description || "No description provided."}
                    </p>
                    
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                      <div className="bg-background border border-white/5 p-4 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Total Evidence</span>
                        <span className="text-2xl font-bold font-mono text-white/90">{details.evidence.length}</span>
                      </div>
                      <div className="bg-background border border-white/5 p-4 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Timeline Events</span>
                        <span className="text-2xl font-bold font-mono text-white/90">{details.timeline.length}</span>
                      </div>
                      <div className="bg-background border border-white/5 p-4 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Notes</span>
                        <span className="text-2xl font-bold font-mono text-white/90">{details.notes.length}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "evidence" && <EvidenceGallery evidence={details.evidence} />}
                {activeTab === "timeline" && <TimelineView events={details.timeline} />}
                {activeTab === "notes" && <NotesPanel notes={details.notes} onAddNote={async (content) => { await addNote(details.case._id, content); fetchDetails(details.case._id); }} />}
                {activeTab === "report" && <ReportPanel activeCase={details.case} />}
              </div>
            </ScrollArea>
          </>
        )
      }
      rightPanel={
        <>
          <div className="absolute top-0 left-0 right-0 h-40 overflow-hidden pointer-events-none opacity-[0.08] mix-blend-screen">
            <Meteors number={10} />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-emerald/10 to-transparent" />
          </div>

          <div className="p-4 border-b flex items-center gap-2 bg-background relative z-10">
            <div className="flex items-center justify-center h-6 w-6 rounded bg-brand-emerald/20 border border-brand-emerald/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
              <Sparkles className="h-3.5 w-3.5 text-brand-emerald" />
            </div>
            <h2 className="text-sm font-semibold tracking-tight text-white/90">AI Investigation Summary</h2>
          </div>

          <ScrollArea className="flex-1 p-5">
            <div className="space-y-6">
              <section>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Reconstruction</h3>
                <div className="rounded-xl border border-white/5 bg-background p-4 text-xs leading-relaxed text-white/80 space-y-3">
                  {!details ? (
                    <p className="text-muted-foreground">Select a case...</p>
                  ) : (
                    <p className="whitespace-pre-wrap">{details.summary}</p>
                  )}
                </div>
              </section>

              {details && details.evidence.length === 0 && (
                <div className="mt-4 p-3 bg-brand-amber/10 border border-brand-amber/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-brand-amber shrink-0 mt-0.5" />
                  <p className="text-xs text-brand-amber/90">Navigate to Search to extract video evidence and build the timeline for this case.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      }
    />
  );
}
