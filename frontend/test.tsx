import React from "react";
import { createRoot } from "react-dom/client";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./components/ui/resizable";

function TestApp() {
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15}>
          <div style={{ background: "red", height: "100%" }}>Left</div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={60}>
          <div style={{ background: "green", height: "100%" }}>Center</div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={20} minSize={15}>
          <div style={{ background: "blue", height: "100%" }}>Right</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

// I want to see if the styles are being applied correctly
console.log("TestApp loaded");
