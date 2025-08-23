// src/components/StatusIndicators.jsx
import React from "react";

const StatusIndicators = ({ 
  activeTool, 
  selectedTraces, 
  selectedComponents, 
  lastSaveTime, 
  autoSaveEnabled, 
  autoSaveInterval 
}) => {
  return (
    <>
      <div style={{
        position: "absolute",
        top: 8,
        left: 8,
        zIndex: 4,
        color: "#fff",
        pointerEvents: "none",
        background: "rgba(0,0,0,0.5)",
        padding: "4px 8px",
        borderRadius: 4
      }}>
        Active Tool: {activeTool.toUpperCase()} • Space for temporary pan • Keys: P/V/S/D/W for tools
      </div>

      {(selectedTraces.size > 0 || selectedComponents.size > 0) && (
        <div style={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 4,
          color: "#60a5fa",
          pointerEvents: "none",
          background: "rgba(0,0,0,0.7)",
          padding: "4px 8px",
          borderRadius: 4,
          fontSize: 12
        }}>
          Selected: {selectedTraces.size} traces, {selectedComponents.size} components
        </div>
      )}

      {lastSaveTime && (
        <div style={{
          position: "absolute",
          bottom: 60,
          right: 16,
          zIndex: 4,
          color: "#9ca3af",
          fontSize: 12,
          background: "rgba(0,0,0,0.7)",
          padding: "4px 8px",
          borderRadius: 4,
          pointerEvents: "none"
        }}>
          Last auto-save: {new Date(lastSaveTime).toLocaleTimeString()}
        </div>
      )}

      {autoSaveEnabled && (
        <div style={{
          position: "absolute",
          bottom: 40,
          right: 16,
          zIndex: 4,
          color: "#00c853",
          fontSize: 12,
          background: "rgba(0,0,0,0.7)",
          padding: "4px 8px",
          borderRadius: 4,
          pointerEvents: "none"
        }}>
          Auto-save: {autoSaveInterval}s
        </div>
      )}
    </>
  );
};

export default StatusIndicators;