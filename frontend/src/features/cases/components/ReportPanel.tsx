import { useState, useEffect } from "react";
import { Case } from "../types";
import { downloadReport, getReportPreview } from "../services/caseApi";
import { FileDown, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportPreview } from "./ReportPreview";

interface ReportPanelProps {
  activeCase: Case;
}

export function ReportPanel({ activeCase }: ReportPanelProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setIsLoadingPreview(true);
        const html = await getReportPreview(activeCase._id);
        setHtmlContent(html);
      } catch (err) {
        console.error("Failed to load report preview", err);
      } finally {
        setIsLoadingPreview(false);
      }
    };
    fetchPreview();
  }, [activeCase._id]);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadReport(activeCase._id, activeCase.title);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-lg border border-white/5">
        <div>
          <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-cyan" />
            Official Investigation Report
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">Generated dynamically from case evidence and timeline.</p>
        </div>
        
        <Button 
          onClick={handleDownload}
          disabled={isDownloading || isLoadingPreview}
          className="bg-brand-cyan text-black hover:bg-brand-cyan/80 font-bold"
        >
          {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
          {isDownloading ? "Exporting..." : "Export to PDF"}
        </Button>
      </div>

      <ReportPreview htmlContent={htmlContent} isLoading={isLoadingPreview} />
    </div>
  );
}
