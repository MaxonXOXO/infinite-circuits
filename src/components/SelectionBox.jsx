// src/components/SelectionBox.jsx
import React from "react";

const SelectionBox = ({ isSelecting, selectionStart, selectionEnd }) => {
  if (!isSelecting || !selectionStart || !selectionEnd) return null;
  
  const left = Math.min(selectionStart.x, selectionEnd.x);
  const top = Math.min(selectionStart.y, selectionEnd.y);
  const width = Math.abs(selectionEnd.x - selectionStart.x);
  const height = Math.abs(selectionEnd.y - selectionStart.y);
  
  return (
    <div
      style={{
        position: "absolute",
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        border: "1px dashed #60a5fa",
        backgroundColor: "rgba(96, 165, 250, 0.1)",
        zIndex: 10,
        pointerEvents: "none"
      }}
    />
  );
};

export default SelectionBox;