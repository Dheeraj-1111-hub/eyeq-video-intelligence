import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ResizableLayout } from "@/components/ui/custom-resizable";
import { SubjectSidebar } from "@/components/intelligence/SubjectSidebar";
import { DigitalTwin } from "@/components/intelligence/DigitalTwin";
import { KnowledgeGraph } from "@/components/intelligence/KnowledgeGraph";
import { getCases, getCaseDetails } from "@/features/cases/services/caseApi";
import { Case, CaseDetailsResponse } from "@/features/cases/types";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/intelligence")({
  head: () => ({ meta: [{ title: "Intelligence Command Center — EYEQ" }] }),
  component: IntelligencePage,
});

function IntelligencePage() {
  const [isTracking, setIsTracking] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseDetails, setCaseDetails] = useState<CaseDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      fetchCaseDetails(selectedCaseId);
    } else {
      setCaseDetails(null);
    }
  }, [selectedCaseId]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await getCases();
      setCases(data);
      if (data.length > 0) {
        setSelectedCaseId(data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseDetails = async (id: string) => {
    try {
      setLoading(true);
      const data = await getCaseDetails(id);
      setCaseDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !cases.length) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-black">
      {/* Top Bar for Case Selection */}
      <div className="h-14 border-b border-white/10 flex items-center px-6 shrink-0 bg-zinc-950 z-20">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-4">Select Investigation Case:</div>
        <select
          className="bg-black border border-white/10 rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-brand-cyan min-w-[250px]"
          value={selectedCaseId || ""}
          onChange={(e) => setSelectedCaseId(e.target.value)}
        >
          {cases.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-4" />}
      </div>

      <div className="flex-1 min-h-0">
        {!caseDetails ? (
           <div className="flex items-center justify-center h-full text-muted-foreground">Select a case with evidence to begin intelligence analysis.</div>
        ) : (
          <ResizableLayout
            defaultLeftWidth={320}
            minLeftWidth={280}
            maxLeftWidth={450}
            leftPanel={
              <SubjectSidebar 
                isTracking={isTracking} 
                onTrackToggle={() => setIsTracking(!isTracking)} 
                caseDetails={caseDetails}
              />
            }
            centerPanel={
              <div className="h-full w-full flex flex-col p-4 gap-4 bg-black">
                {/* Top Half: Digital Twin */}
                <div className="flex-1 min-h-0 relative">
                  <DigitalTwin tracking={isTracking} caseDetails={caseDetails} />
                </div>
                
                {/* Bottom Half: Knowledge Graph */}
                <div className="flex-1 min-h-0 relative">
                  <KnowledgeGraph caseDetails={caseDetails} isTracking={isTracking} />
                </div>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
