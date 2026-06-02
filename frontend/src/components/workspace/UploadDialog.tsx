import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2, Video } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useUploadVideo } from "@/hooks/useVideos";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: (videoId: string) => void;
}

export function UploadDialog({ open, onOpenChange, onUploadSuccess }: UploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [location, setLocation] = useState("");
  const uploadMutation = useUploadVideo();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setProgress(0);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    uploadMutation.mutate(
      {
        file: selectedFile,
        location: location.trim() || undefined,
        onProgress: (p) => setProgress(p),
      },
      {
        onSuccess: (data) => {
          setSelectedFile(null);
          setLocation("");
          setProgress(0);
          onOpenChange(false);
          if (onUploadSuccess) {
            onUploadSuccess(data._id);
          }
        },
        onError: (err) => {
          console.error("Upload failed", err);
        },
      }
    );
  };

  const handleClose = () => {
    if (uploadMutation.isPending) return; // Prevent closing while uploading
    setSelectedFile(null);
    setLocation("");
    setProgress(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-brand-cyan" />
            Upload Video Source
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Select a CCTV or drone footage file to begin processing.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-6 space-y-6">
          {!selectedFile ? (
            <div
              className="border-2 border-dashed border-zinc-800 rounded-xl w-full h-40 flex flex-col items-center justify-center cursor-pointer hover:border-brand-cyan/50 hover:bg-white/5 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="h-10 w-10 text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-400">Click to browse or drag and drop</p>
              <p className="text-xs text-zinc-600 mt-1">MP4, AVI, MOV up to 1GB</p>
            </div>
          ) : (
            <div className="w-full space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5">
                <Video className="h-6 w-6 text-brand-cyan" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              {uploadMutation.isPending && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-white/5 [&>div]:bg-brand-cyan" />
                </div>
              )}

              {uploadMutation.isError && (
                <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-md">
                  Upload failed. Please try again.
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <label className="text-xs text-zinc-400 font-medium">Camera Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Lobby, Parking, Entrance"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan"
                  disabled={uploadMutation.isPending}
                />
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="video/mp4,video/x-m4v,video/*"
            onChange={handleFileChange}
          />

          <div className="flex w-full gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white"
              onClick={handleClose}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-brand-cyan text-black hover:bg-brand-cyan/80 font-semibold"
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading
                </>
              ) : (
                "Upload File"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
