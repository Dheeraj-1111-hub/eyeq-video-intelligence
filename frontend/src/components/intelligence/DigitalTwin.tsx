import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Video } from 'lucide-react';
import { CaseDetailsResponse } from '@/features/cases/types';

interface DigitalTwinProps {
  tracking: boolean;
  caseDetails: CaseDetailsResponse;
}

interface CameraNode {
  id: string;
  name: string;
  x: number;
  y: number;
  timeOffset: number; // relative time in ms for animation sequence
}

export function DigitalTwin({ tracking, caseDetails }: DigitalTwinProps) {
  const [activeCamera, setActiveCamera] = useState<string | null>(null);
  const [pathProgress, setPathProgress] = useState(0);
  const [cameras, setCameras] = useState<CameraNode[]>([]);
  const [pathD, setPathD] = useState("");
  const [duration, setDuration] = useState(6000);

  useEffect(() => {
    if (!caseDetails || caseDetails.evidence.length === 0) return;

    // Group evidence by unique camera location, sorted by time
    const sortedEv = [...caseDetails.evidence].sort((a, b) => a.timestampSeconds - b.timestampSeconds);
    
    const uniqueLocations: { id: string; name: string; timeSeconds: number }[] = [];
    const locationSet = new Set();
    
    sortedEv.forEach(ev => {
      const locName = ev.videoLocation || 'Unknown Location';
      const locId = `cam-${ev.videoId}`;
      if (!locationSet.has(locId)) {
        locationSet.add(locId);
        uniqueLocations.push({ id: locId, name: locName, timeSeconds: ev.timestampSeconds });
      }
    });

    if (uniqueLocations.length === 0) return;

    const baseTime = uniqueLocations[0].timeSeconds;
    
    // Layout logic: arrange nodes in a rough ellipse or circle
    const numNodes = uniqueLocations.length;
    const centerX = 50;
    const centerY = 50;
    const radiusX = 35;
    const radiusY = 25;

    const newCameras = uniqueLocations.map((loc, i) => {
      // Calculate angle for ellipse distribution
      const angle = (i / numNodes) * 2 * Math.PI - Math.PI / 2; // start at top
      
      return {
        id: loc.id,
        name: loc.name,
        x: centerX + radiusX * Math.cos(angle),
        y: centerY + radiusY * Math.sin(angle),
        timeOffset: (loc.timeSeconds - baseTime) * 1000 // ms difference
      };
    });

    // Normalize time offsets to fit within a 6 second animation window,
    // or just spread them evenly if they happened too close or too far apart.
    const maxOffset = newCameras[newCameras.length - 1].timeOffset;
    const animDuration = 6000;
    
    newCameras.forEach((cam, i) => {
      if (maxOffset === 0) {
        cam.timeOffset = i * (animDuration / numNodes);
      } else {
        // Map true time to animation window
        cam.timeOffset = (cam.timeOffset / maxOffset) * animDuration;
      }
    });

    setCameras(newCameras);
    setDuration(animDuration + 1000); // add 1s buffer

    // Build SVG Path
    if (newCameras.length > 1) {
      const d = newCameras.reduce((acc, cam, i) => {
        return acc + `${i === 0 ? 'M' : 'L'} ${cam.x} ${cam.y} `;
      }, "");
      setPathD(d);
    } else {
      setPathD("");
    }
  }, [caseDetails]);

  useEffect(() => {
    if (!tracking || cameras.length === 0) {
      setActiveCamera(null);
      setPathProgress(0);
      return;
    }

    let timeouts: ReturnType<typeof setTimeout>[] = [];

    cameras.forEach((cam) => {
      const t = setTimeout(() => {
        setActiveCamera(cam.id);
      }, cam.timeOffset);
      timeouts.push(t);
    });

    let startTime = Date.now();
    const animatePath = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setPathProgress(progress);
      if (progress < 1) {
        requestAnimationFrame(animatePath);
      }
    };
    
    requestAnimationFrame(animatePath);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [tracking, cameras, duration]);

  if (!caseDetails || caseDetails.evidence.length === 0) {
    return (
      <div className="w-full h-full bg-zinc-950/80 rounded-xl border border-white/5 flex items-center justify-center text-muted-foreground text-sm">
        No evidence available to generate Digital Twin map.
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-zinc-950/80 rounded-xl border border-white/5 overflow-hidden relative flex items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem]" />
      
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs font-mono text-cyan-500 flex items-center gap-2">
          <Map className="w-3 h-3" />
          DYNAMIC NETWORK MAP
        </div>
      </div>

      <div className="relative w-full max-w-2xl aspect-video border border-white/10 bg-black/50 rounded-2xl shadow-2xl overflow-hidden p-8 backdrop-blur-sm">
        
        {/* Dynamic Map Nodes */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {pathD && (
            <>
              {/* Background trace line */}
              <path
                d={pathD}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="0.5"
              />
              {/* Animated track line */}
              <motion.path
                d={pathD}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="0.5"
                strokeDasharray="2 2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: pathProgress }}
                transition={{ duration: 0, ease: "linear" }}
                className="drop-shadow-[0_0_8px_hsl(var(--primary))]"
              />
            </>
          )}
        </svg>

        {cameras.map((cam, index) => {
          const isActive = activeCamera === cam.id;
          return (
            <div
              key={cam.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
              style={{ left: `${cam.x}%`, top: `${cam.y}%` }}
            >
              {isActive && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: [0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-primary/40 blur-md"
                />
              )}
              <div
                className={`relative w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                  isActive
                    ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_hsl(var(--primary))] z-10'
                    : 'bg-zinc-900 border-white/20 text-zinc-400 group-hover:border-primary/50'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
              </div>
              <div className={`mt-2 text-[10px] font-mono font-medium tracking-wider transition-colors duration-300 whitespace-nowrap bg-black/50 px-2 py-0.5 rounded ${isActive ? 'text-primary' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                {cam.name.toUpperCase()}
              </div>
              <div className={`text-[8px] font-mono opacity-60 bg-black/50 px-1 rounded ${isActive ? 'text-primary' : 'text-zinc-600'}`}>
                NODE {index + 1}
              </div>
            </div>
          );
        })}

        <AnimatePresence>
          {tracking && activeCamera && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-6 right-6 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-md flex items-center gap-2 backdrop-blur-md"
            >
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-mono text-rose-500 uppercase tracking-widest">Subject Tracking</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
