import React from "react";

const UndoRedoButtons = ({ undo, redo, historyIndex, history }) => {
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        right: 1500, // adjust this number (in px) to move further/closer to edge
        zIndex: 4,
        display: "flex",
        gap: "8px"
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          undo();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        disabled={!canUndo}
        style={{
          background: canUndo ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.3)",
          color: canUndo ? "#fff" : "#666",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "6px",
          padding: "8px 12px",
          cursor: canUndo ? "pointer" : "not-allowed",
          fontSize: "12px",
          userSelect: "none",
          pointerEvents: "auto"
        }}
        title="Undo (Ctrl+Z)"
      >
        ↶ Undo
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          redo();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        disabled={!canRedo}
        style={{
          background: canRedo ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.3)",
          color: canRedo ? "#fff" : "#666",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "6px",
          padding: "8px 12px",
          cursor: canRedo ? "pointer" : "not-allowed",
          fontSize: "12px",
          userSelect: "none",
          pointerEvents: "auto"
        }}
        title="Redo (Ctrl+Y)"
      >
        ↷ Redo
      </button>
    </div>
  );
};

export default UndoRedoButtons;
