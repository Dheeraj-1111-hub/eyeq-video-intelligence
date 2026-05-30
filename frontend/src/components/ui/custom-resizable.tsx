import React, { useState, useEffect, useRef } from "react";

interface ResizableLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel?: React.ReactNode;
  defaultLeftWidth?: number;
  defaultRightWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  minRightWidth?: number;
  maxRightWidth?: number;
}

export function ResizableLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  defaultLeftWidth = 280,
  defaultRightWidth = 320,
  minLeftWidth = 200,
  maxLeftWidth = 500,
  minRightWidth = 200,
  maxRightWidth = 500,
}: ResizableLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [rightWidth, setRightWidth] = useState(defaultRightWidth);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag state
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  useEffect(() => {
    if (!isDraggingLeft && !isDraggingRight) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      if (isDraggingLeft) {
        // Calculate new left width based on mouse X relative to container left
        const newWidth = e.clientX - rect.left;
        setLeftWidth(Math.max(minLeftWidth, Math.min(newWidth, maxLeftWidth)));
      }
      
      if (isDraggingRight) {
        // Calculate new right width based on mouse X relative to container right
        const newWidth = rect.right - e.clientX;
        setRightWidth(Math.max(minRightWidth, Math.min(newWidth, maxRightWidth)));
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    
    // Prevent text selection while dragging
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
  }, [isDraggingLeft, isDraggingRight, minLeftWidth, maxLeftWidth, minRightWidth, maxRightWidth]);

  return (
    <div 
      ref={containerRef}
      className="h-[calc(100vh-3.5rem)] w-full bg-background"
      style={{
        display: "grid",
        gridTemplateColumns: rightPanel 
          ? `${leftWidth}px 1fr ${rightWidth}px` 
          : `${leftWidth}px 1fr`,
      }}
    >
      {/* Left Panel */}
      <div className="relative h-full flex flex-col min-w-0 overflow-hidden bg-card/30">
        {leftPanel}
        
        {/* Left Resizer Handle */}
        <div 
          className="absolute top-0 right-0 bottom-0 w-3 cursor-col-resize z-50 group flex items-center justify-center translate-x-1.5"
          onMouseDown={() => setIsDraggingLeft(true)}
        >
          <div className="h-full w-px bg-white/10 group-hover:bg-brand-cyan/50 transition-colors shadow-[0_0_8px_rgba(30,212,237,0)] group-hover:shadow-[0_0_8px_rgba(30,212,237,0.5)]" />
        </div>
      </div>

      {/* Center Panel */}
      <div className="relative h-full flex flex-col min-w-0 overflow-hidden bg-muted/20">
        {centerPanel}
      </div>

      {/* Right Panel */}
      {rightPanel && (
        <div className="relative h-full flex flex-col min-w-0 overflow-hidden bg-card/30">
          {/* Right Resizer Handle */}
          <div 
            className="absolute top-0 left-0 bottom-0 w-3 cursor-col-resize z-50 group flex items-center justify-center -translate-x-1.5"
            onMouseDown={() => setIsDraggingRight(true)}
          >
            <div className="h-full w-px bg-white/10 group-hover:bg-brand-cyan/50 transition-colors shadow-[0_0_8px_rgba(30,212,237,0)] group-hover:shadow-[0_0_8px_rgba(30,212,237,0.5)]" />
          </div>
          
          {rightPanel}
        </div>
      )}
    </div>
  );
}
