import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";

export const BackgroundBeams = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "absolute inset-0 z-0 overflow-hidden pointer-events-none w-full h-full bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-30 mix-blend-screen" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2220%22 height=%2220%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath d=%22M1 1h18v18H1z%22 fill=%22none%22 stroke=%22rgba(255,255,255,0.03)%22 strokeWidth=%221%22/%3E%3C/svg%3E')] opacity-[0.2] pointer-events-none" />

      {/* Animated Beams Mock */}
      <motion.div
        animate={{
          transform: ["translateY(-100%)", "translateY(100%)"],
        }}
        transition={{
          repeat: Infinity,
          duration: 10,
          ease: "linear",
        }}
        className="absolute top-0 left-[20%] w-px h-full bg-gradient-to-b from-transparent via-primary to-transparent opacity-50"
      />
      <motion.div
        animate={{
          transform: ["translateY(100%)", "translateY(-100%)"],
        }}
        transition={{
          repeat: Infinity,
          duration: 15,
          ease: "linear",
        }}
        className="absolute top-0 right-[30%] w-px h-full bg-gradient-to-b from-transparent via-emerald-500 to-transparent opacity-30"
      />
    </div>
  );
};
