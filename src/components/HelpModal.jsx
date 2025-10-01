// src/components/HelpModal.jsx
import React from "react";

const MODAL_STYLE = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "550px",
  maxWidth: "90%",
  background: "#1a1f2e",
  color: "#fff",
  borderRadius: "12px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
  zIndex: 2000,
  display: "flex",
  flexDirection: "column",
  maxHeight: "80vh",
  overflowY: "auto",
};

const OVERLAY_STYLE = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.7)",
  zIndex: 1999,
};

const shortcutData = [
  { section: "Tools", shortcuts: [
    { key: "V", description: "Pointer Tool (Select & Drag)" },
    { key: "P", description: "Pan Tool (Move Canvas)" },
    { key: "S", description: "Select Tool (Draw selection box)" },
    { key: "D", description: "Draw Tool (Free-form trace)" },
    { key: "W", description: "Smart Draw Tool (90° trace)" },
  ]},
  { section: "Canvas Actions", shortcuts: [
    { key: "Spacebar (Hold)", description: "Temporary Pan (override current tool)" },
    { key: "Mouse Wheel", description: "Zoom In/Out" },
    { key: "ESC", description: "Deselect, Cancel Draw, Close Modals" },
    { key: "Delete / Backspace", description: "Delete selected components/traces" },
  ]},
  { section: "System Actions", shortcuts: [
    { key: "Ctrl + Z / Cmd + Z", description: "Undo Last Action" },
    { key: "Ctrl + Y / Ctrl + Shift + Z", description: "Redo Action" },
    { key: "Ctrl + S / Cmd + S", description: "Manual Save" },
    { key: "Ctrl + A / Cmd + A", description: "Select All Components and Traces" },
  ]},
  { section: "Component Actions (with item selected)", shortcuts: [
    { key: "Shift + +", description: "Increase Component Size" },
    { key: "Shift + -", description: "Decrease Component Size" },
  ]},
];

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      <div style={OVERLAY_STYLE} onClick={onClose} />
      <div style={MODAL_STYLE}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Infinite Circuits Help & Shortcuts</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "1.5rem", cursor: "pointer" }}>
            &times;
          </button>
        </div>
        <div style={{ padding: "20px" }}>
          <p style={{ color: "#9ca3af", marginBottom: "20px", fontSize: "14px" }}>
            Infinite Circuits is a web-based and desktop application for rapid electronic circuit prototyping.
          </p>

          {shortcutData.map((section, index) => (
            <div key={index} style={{ marginBottom: "20px" }}>
              <h3 style={{ borderBottom: "1px dashed #60a5fa", paddingBottom: "5px", fontSize: "1.1rem", color: "#60a5fa" }}>
                {section.section}
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "#ddd" }}>
                <tbody>
                  {section.shortcuts.map((item, i) => (
                    <tr key={i}>
                      <td style={{ padding: "6px 0", width: "150px", fontWeight: "bold" }}>
                        <code style={{ background: "#252b3b", padding: "3px 6px", borderRadius: "4px" }}>
                          {item.key}
                        </code>
                      </td>
                      <td style={{ padding: "6px 0", fontSize: "14px" }}>
                        {item.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}