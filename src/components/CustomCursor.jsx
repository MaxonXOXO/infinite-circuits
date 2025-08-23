// src/components/CustomCursor.jsx
import React from "react";

const CustomCursor = ({ activeTool, smartDrawStart }) => {
  if (activeTool !== 'smart_draw') return null;
  
  return (
    <div
      style={{
        position: "fixed",
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        backgroundColor: smartDrawStart ? "#60a5fa" : "#00e676",
        border: "2px solid white",
        pointerEvents: "none",
        zIndex: 10000,
        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        transform: "translate(-50%, -50%)",
        left: "var(--mouse-x, -100px)",
        top: "var(--mouse-y, -100px)",
        transition: "background-color 0.2s ease"
      }}
    />
  );
};

export default CustomCursor;