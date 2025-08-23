// src/components/Header.jsx
import React, { useState, useEffect } from "react";
import logo from "../ininity.png"; // <-- import your logo

export default function Header() {
  const colors = [
    { name: "red", hex: "#e53935" },
    { name: "green", hex: "#00c853" },
    { name: "blue", hex: "#2962ff" },
    { name: "yellow", hex: "#ffd600" },
    { name: "orange", hex: "#ff6d00" },
    { name: "purple", hex: "#aa00ff" },
    { name: "pink", hex: "#ff4081" },
    { name: "cyan", hex: "#00e5ff" },
  ];

  const [selected, setSelected] = useState("green");
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState("#00e676");

  useEffect(() => {
    const ev = new CustomEvent("trace-color-changed", { detail: selected });
    window.dispatchEvent(ev);
  }, [selected]);

  useEffect(() => {
    const handleSaveEvent = () => {
      setLastSaved(new Date().toLocaleTimeString());
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    };

    const handleSavingEvent = () => {
      setSaveStatus("saving");
    };

    window.addEventListener("canvas-saved", handleSaveEvent);
    window.addEventListener("canvas-saving", handleSavingEvent);

    return () => {
      window.removeEventListener("canvas-saved", handleSaveEvent);
      window.removeEventListener("canvas-saving", handleSavingEvent);
    };
  }, []);

  const handleCustomColorSelect = () => {
    setSelected(customColor);
    setShowCustomPicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showCustomPicker && !e.target.closest(".header-center")) {
        setShowCustomPicker(false);
      }
    };

    if (showCustomPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCustomPicker]);

  return (
    <header
      className="header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "#110e1fff",
        zIndex: 1000,
      }}
    >
      {/* Left logo */}
      <div className="header-left" style={{ display: "flex", alignItems: "center" }}>
        <img
          src={logo}
          alt="Infinite Circuits Logo"
          style={{ height: "100px", objectFit: "contain" }}
        />
      </div>

      {/* Center-aligned color selector */}
      <div
        className="header-center"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {colors.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelected(c.hex)}
              title={c.name}
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                border:
                  selected === c.hex
                    ? "2px solid #fff"
                    : "2px solid rgba(255,255,255,0.3)",
                background: c.hex,
                padding: 0,
                cursor: "pointer",
                boxSizing: "border-box",
                boxShadow:
                  selected === c.hex ? "0 0 8px rgba(255,255,255,0.5)" : "none",
              }}
            />
          ))}

          <button
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            title="Custom color"
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: "2px dashed rgba(255,255,255,0.5)",
              background: "rgba(255,255,255,0.1)",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "12px",
            }}
          >
            +
          </button>
        </div>

        {showCustomPicker && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#1a1f2e",
              padding: "12px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              zIndex: 1001,
              marginTop: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              style={{
                width: "60px",
                height: "60px",
                padding: 0,
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              style={{
                width: "80px",
                padding: "6px",
                borderRadius: "4px",
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                fontSize: "12px",
              }}
            />
            <button
              onClick={handleCustomColorSelect}
              style={{
                padding: "6px 12px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: "#60a5fa",
                color: "#fff",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      <div
        className="header-right"
        style={{ display: "flex", alignItems: "center", gap: 12 }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn" disabled style={{ padding: "6px 10px" }}>
            New
          </button>
          <button
            className="btn"
            onClick={() => {
              const event = new CustomEvent("trigger-save");
              window.dispatchEvent(event);
            }}
            style={{ padding: "6px 10px", cursor: "pointer" }}
            title="Save (Ctrl+S)"
          >
            Save
          </button>
          <button className="btn" disabled style={{ padding: "6px 10px" }}>
            Help
          </button>
        </div>

        {saveStatus === "saving" && (
          <span style={{ fontSize: "12px", color: "#9ca3af", marginLeft: "8px" }}>
            Saving...
          </span>
        )}
        {saveStatus === "saved" && lastSaved && (
          <span style={{ fontSize: "12px", color: "#00c853", marginLeft: "8px" }}>
            Saved {lastSaved}
          </span>
        )}
      </div>
    </header>
  );
}
