import { useState, useEffect } from "react";
import { Case } from "../types";
import { getCases, createCase, addEvidence } from "../services/caseApi";
import { Button } from "@/components/ui/button";
import { Plus, X, FolderOpen, Loader2 } from "lucide-react";

interface AddToCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: any;
}

export function AddToCaseModal({ isOpen, onClose, result }: AddToCaseModalProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");

  useEffect(() => {
    if (isOpen) {
      fetchCases();
    }
  }, [isOpen]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await getCases();
      setCases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvidence = async (caseId: string) => {
    try {
      setAddingTo(caseId);
      await addEvidence(caseId, {
        videoId: result.video_id,
        videoFilename: result.video_filename,
        detectionId: result.detection_id,
        timestamp: result.timestamp,
        timestampSeconds: result.timestamp_seconds,
        label: result.label,
        confidence: result.confidence,
        thumbnailPath: result.thumbnail,
      });
      onClose();
    } catch (err) {
      console.error("Failed to add evidence", err);
    } finally {
      setAddingTo(null);
    }
  };

  const handleCreateCase = async () => {
    if (!newTitle.trim()) return;
    try {
      setIsCreating(true);
      const newCase = await createCase({ title: newTitle, description: "", priority: newPriority });
      await handleAddEvidence(newCase._id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-brand-cyan" />
            Add to Case
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* New Case Section */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Create New Case</h4>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Case Title (e.g. Parking Theft)" 
                className="flex-1 bg-black border border-white/10 rounded px-3 py-1.5 text-sm text-white outline-none focus:border-brand-cyan"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
              <select 
                className="bg-black border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-brand-cyan"
                value={newPriority}
                onChange={e => setNewPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Med</option>
                <option value="High">High</option>
                <option value="Critical">Crit</option>
              </select>
            </div>
            <Button 
              size="sm" 
              className="w-full bg-brand-cyan text-black hover:bg-brand-cyan/80 font-bold"
              disabled={!newTitle.trim() || isCreating}
              onClick={handleCreateCase}
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & Add Evidence"}
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-muted-foreground font-medium uppercase">Or select existing</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Existing Cases List */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-brand-cyan" /></div>
            ) : cases.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-2">No open cases found.</p>
            ) : (
              cases.map(c => (
                <div key={c._id} className="flex items-center justify-between p-3 rounded-lg border border-white/5 hover:border-white/20 hover:bg-white/5 transition-colors group">
                  <div>
                    <h5 className="text-sm font-semibold text-white/90">{c.title}</h5>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] text-brand-cyan px-1.5 py-0.5 rounded bg-brand-cyan/10 font-bold uppercase">{c.status}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{c.clipsCount || 0} clips</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={addingTo === c._id}
                    onClick={() => handleAddEvidence(c._id)}
                  >
                    {addingTo === c._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
