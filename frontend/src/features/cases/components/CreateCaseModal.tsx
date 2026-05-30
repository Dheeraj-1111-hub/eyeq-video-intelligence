import { useState } from "react";
import { createCase } from "../services/caseApi";
import { Button } from "@/components/ui/button";
import { X, FolderPlus, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCaseModal({ isOpen, onClose }: CreateCaseModalProps) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");

  if (!isOpen) return null;

  const handleCreateCase = async () => {
    if (!newTitle.trim()) return;
    try {
      setIsCreating(true);
      const newCase = await createCase({ title: newTitle, description: newDescription, priority: newPriority });
      onClose();
      // Navigate to cases tab
      navigate({ to: "/cases" });
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-brand-cyan" />
            Create Case File
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Title</label>
              <input 
                type="text" 
                placeholder="e.g. Parking Theft - May 27" 
                className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-brand-cyan"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Description</label>
              <textarea 
                placeholder="Brief summary of the incident..." 
                className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-brand-cyan min-h-[80px] resize-none"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Priority</label>
              <select 
                className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-brand-cyan"
                value={newPriority}
                onChange={e => setNewPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
          
          <div className="pt-2">
            <Button 
              className="w-full bg-brand-cyan text-black hover:bg-brand-cyan/80 font-bold"
              disabled={!newTitle.trim() || isCreating}
              onClick={handleCreateCase}
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initialize Case"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
