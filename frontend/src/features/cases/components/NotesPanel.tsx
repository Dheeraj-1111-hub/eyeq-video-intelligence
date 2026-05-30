import { useState } from "react";
import { CaseNote } from "../types";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function NotesPanel({ notes, onAddNote }: { notes: CaseNote[]; onAddNote: (content: string) => Promise<void> }) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    await onAddNote(content);
    setContent("");
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-background border border-white/5 p-4 rounded-xl">
        <textarea
          className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-brand-cyan min-h-[100px] resize-none"
          placeholder="Add an investigator note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end mt-3">
          <Button 
            size="sm" 
            className="bg-brand-cyan text-black hover:bg-brand-cyan/80 font-bold"
            disabled={!content.trim() || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Note"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {notes.length === 0 ? (
          <p className="text-sm text-center text-muted-foreground py-4">No notes recorded.</p>
        ) : (
          notes.map((n) => (
            <div key={n._id} className="p-4 bg-background border border-white/5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white/80">{n.userId?.name || "Investigator"}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-white/90 whitespace-pre-wrap">{n.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
