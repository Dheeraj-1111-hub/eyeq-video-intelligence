"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const FloatingNode = ({
  children,
  className,
  delay = 0,
  duration = 4,
  yOffset = 15,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
}) => {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: [-yOffset, yOffset, -yOffset] }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay,
      }}
      className={cn("absolute", className)}
    >
      {children}
    </motion.div>
  );
};

export const FloatingConnectionLine = ({
  startX,
  startY,
  endX,
  endY,
  className,
}: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  className?: string;
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0">
      <motion.path
        d={`M ${startX} ${startY} C ${startX + (endX - startX) / 2} ${startY}, ${startX + (endX - startX) / 2} ${endY}, ${endX} ${endY}`}
        stroke="currentColor"
        strokeWidth="2"
        fill="transparent"
        className={cn("text-white/20", className)}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
    </svg>
  );
};
