import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface ReportPreviewProps {
  htmlContent: string;
  isLoading: boolean;
}

export function ReportPreview({ htmlContent, isLoading }: ReportPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      // Setup the iframe document
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }
  }, [htmlContent]);

  if (isLoading) {
    return (
      <div className="w-full h-[600px] bg-white rounded-lg shadow-xl border border-border/50 flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan mb-4" />
        <p className="text-sm font-medium tracking-wide uppercase">Compiling Investigation Report...</p>
      </div>
    );
  }

  if (!htmlContent) {
    return (
      <div className="w-full h-[600px] bg-white rounded-lg shadow-xl border border-border/50 flex items-center justify-center text-zinc-400">
        No report data available.
      </div>
    );
  }

  return (
    <div className="w-full relative rounded-lg shadow-2xl overflow-hidden border border-zinc-200/20 bg-zinc-900/50 p-4">
      {/* Visual wrapper to look like a document viewer */}
      <div className="w-full h-[800px] bg-white rounded shadow-inner overflow-hidden">
        <iframe
          ref={iframeRef}
          title="Report Preview"
          className="w-full h-full border-none bg-white"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
