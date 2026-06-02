import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Search, AlertTriangle, ArrowRight, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { io } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';

export interface DetectiveHit {
  caseId: string;
  caseTitle: string;
  newVideoId: string;
  newVideoName: string;
  timestamp: string;
  thumbnail: string;
  score: number;
  message: string;
  time: Date;
}

export function DetectiveFeed() {
  const [hits, setHits] = useState<DetectiveHit[]>([]);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      auth: { token },
      transports: ["websocket"]
    });

    const handleHit = (hit: DetectiveHit) => {
      setHits(prev => [hit, ...prev].slice(0, 10)); // Keep last 10 hits
    };

    socket.on('detective_hit', handleHit);
    
    return () => {
      socket.off('detective_hit', handleHit);
      socket.disconnect();
    };
  }, [token]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center gap-3 px-1">
        <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
          <Search className="w-4 h-4 text-rose-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Detective AI Insights</h2>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Autonomous Cross-Case Pattern Recognition</p>
        </div>
      </div>

      <div className="bg-zinc-950 border border-white/10 rounded-xl overflow-hidden relative min-h-[300px]">
        {/* Subtle background radar sweep animation */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-50" />
        <motion.div 
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.4) 0%, transparent 50%)', backgroundSize: '200% 200%' }}
        />

        <div className="relative z-10 p-4 h-full flex flex-col">
          {hits.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
                <Fingerprint className="w-6 h-6 text-zinc-600 animate-pulse" />
              </div>
              <p className="text-sm font-medium text-white/80">Scanning New Footage...</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
                The Detective AI runs autonomously in the background. It will alert you immediately if a suspect from an active case is spotted in newly uploaded videos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {hits.map((hit, idx) => (
                  <motion.div
                    key={hit.time.toString() + idx}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-black/60 border border-rose-500/30 rounded-lg p-4 backdrop-blur-md shadow-xl"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-bold text-rose-500 tracking-wider uppercase">Pattern Match Found</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-rose-500/50 text-rose-400 bg-rose-500/10">
                        {Math.round(hit.score * 100)}% CONFIDENCE
                      </Badge>
                    </div>

                    <p className="text-sm text-zinc-300 font-medium mb-4 leading-relaxed">
                      Subject from active case <span className="text-white font-bold">"{hit.caseTitle}"</span> was just detected in newly uploaded footage <span className="text-white font-mono text-xs">({hit.newVideoName})</span>.
                    </p>

                    <div className="flex gap-4 items-center bg-zinc-900/50 rounded-lg p-2 border border-white/5">
                      <div className="w-24 aspect-video rounded overflow-hidden bg-black flex-shrink-0 relative">
                        <img 
                          src={`http://localhost:8001${hit.thumbnail}`} 
                          alt="Match Thumbnail" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(244,63,94,0.3)]" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-muted-foreground font-mono mb-1">DETECTION TIME</div>
                        <div className="text-xs font-bold text-white">{hit.timestamp}</div>
                      </div>

                      <Button 
                        size="sm" 
                        className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 hover:text-rose-300 border border-rose-500/30"
                        onClick={() => navigate({ to: '/intelligence', search: { caseId: hit.caseId } })}
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        View Case
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
