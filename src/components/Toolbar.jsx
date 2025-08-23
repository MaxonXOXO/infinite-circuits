// src/components/Toolbar.jsx
import React from "react";

const TOOLS = {
  PAN: 'pan',
  POINTER: 'pointer',
  SELECT: 'select',
  DRAW: 'draw',
  SMART_DRAW: 'smart_draw'
};

const Toolbar = ({ activeTool, setActiveTool, smartDrawStart, setSmartDrawStart, exportCanvas }) => {
  const toolButtons = [
    { id: TOOLS.PAN, icon: '✋', label: 'Pan', shortcut: 'P' },
    { id: TOOLS.POINTER, icon: '⇱', label: 'Pointer', shortcut: 'V' },
    { id: TOOLS.SELECT, icon: '⬚', label: 'Select Box', shortcut: 'S' },
    { id: TOOLS.DRAW, icon: '✏️', label: 'Draw', shortcut: 'D' },
    { id: TOOLS.SMART_DRAW, icon: '🪄', label: 'Smart Draw', shortcut: 'W' }
  ];

  const handleToolChange = (toolId) => {
    // Clear smart draw state when switching tools
    if (smartDrawStart) {
      setSmartDrawStart(null);
    }
    setActiveTool(toolId);
  };

  return (
    <div style={{
      position: "absolute",
      top: "50%",
      left: 20,
      transform: "translateY(-50%)",
      zIndex: 5,
      background: "rgba(17, 7, 36, 0.95)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 12,
      padding: 8,
      display: "flex",
      flexDirection: "column",
      gap: 4,
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
    }}>
      {toolButtons.map(tool => (
        <button
          key={tool.id}
          onClick={(e) => {
            e.stopPropagation();
            handleToolChange(tool.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title={`${tool.label} (${tool.shortcut})`}
          style={{
            width: 48,
            height: 48,
            border: activeTool === tool.id ? "2px solid #60a5fa" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            background: activeTool === tool.id ? "rgba(96, 165, 250, 0.2)" : "transparent",
            color: "#fff",
            fontSize: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            pointerEvents: "auto"
          }}
        >
          {tool.icon}
        </button>
      ))}
      
      {/* Export button */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }}></div>
      
      <button
  onClick={(e) => {
    e.stopPropagation();
    exportCanvas();
  }}
  onMouseDown={(e) => e.stopPropagation()}
  title="Export Canvas"
  style={{
    width: 48,
    height: 48,
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    background: "transparent",
    color: "#fff",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    pointerEvents: "auto"
  }}
>
  💾
</button>
    </div>
  );
};

export default Toolbar;
export { TOOLS };