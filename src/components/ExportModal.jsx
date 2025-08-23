// src/components/ExportModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { gridToWorld } from "../utils/canvasUtils";

const ExportModal = ({ 
  isOpen, 
  onClose, 
  traces, 
  placed, 
  onExport 
}) => {
  const [format, setFormat] = useState("png");
  const [backgroundColor, setBackgroundColor] = useState("#0a0f1a");
  const [includeGrid, setIncludeGrid] = useState(true);
  const [padding, setPadding] = useState(40);
  const previewRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      renderPreview();
    }
  }, [isOpen, format, backgroundColor, includeGrid, padding]);

  if (!isOpen) return null;

  // Calculate bounds of all elements to center them
  const calculateBounds = () => {
    if (traces.length === 0 && placed.length === 0) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // Check traces
    traces.forEach(trace => {
      trace.points.forEach(pt => {
        const worldPt = gridToWorld(pt);
        minX = Math.min(minX, worldPt.x);
        minY = Math.min(minY, worldPt.y);
        maxX = Math.max(maxX, worldPt.x);
        maxY = Math.max(maxY, worldPt.y);
      });
    });

    // Check components
    placed.forEach(component => {
      const left = component.x - component.width / 2;
      const top = component.y - component.height / 2;
      const right = left + component.width;
      const bottom = top + component.height;
      
      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    });

    // Add some default bounds if everything is at the same point
    if (minX === Infinity) {
      minX = 0;
      minY = 0;
      maxX = 800;
      maxY = 600;
    }

    return { minX, minY, maxX, maxY };
  };

  const renderPreview = () => {
    if (!previewRef.current) return;

    const canvas = previewRef.current;
    const ctx = canvas.getContext('2d');
    const bounds = calculateBounds();
    
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    
    const scale = Math.min(
      (canvas.width - padding * 2) / contentWidth,
      (canvas.height - padding * 2) / contentHeight,
      1 // Don't scale up beyond original size
    );
    
    const offsetX = (canvas.width - contentWidth * scale) / 2 - bounds.minX * scale;
    const offsetY = (canvas.height - contentHeight * scale) / 2 - bounds.minY * scale;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    if (includeGrid) {
      const gridSize = 20 * scale;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      
      for (let x = bounds.minX * scale + offsetX; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = bounds.minY * scale + offsetY; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Draw traces
    traces.forEach(trace => {
      const points = trace.points.map(pt => {
        const worldPt = gridToWorld(pt);
        return {
          x: worldPt.x * scale + offsetX,
          y: worldPt.y * scale + offsetY
        };
      });
      
      // Draw trace line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      ctx.strokeStyle = trace.color;
      ctx.lineWidth = 12 * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      
      // Draw start and end points
      if (points.length > 0) {
        // Start point
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, 8 * scale, 0, Math.PI * 2);
        ctx.fillStyle = trace.color;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, 4 * scale, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        // End point (if different from start)
        if (points.length > 1 && 
            (points[0].x !== points[points.length - 1].x || 
             points[0].y !== points[points.length - 1].y)) {
          ctx.beginPath();
          ctx.arc(points[points.length - 1].x, points[points.length - 1].y, 8 * scale, 0, Math.PI * 2);
          ctx.fillStyle = trace.color;
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(points[points.length - 1].x, points[points.length - 1].y, 4 * scale, 0, Math.PI * 2);
          ctx.fillStyle = 'white';
          ctx.fill();
        }
      }
    });

    // Draw components
    placed.forEach(component => {
      const left = (component.x - component.width / 2) * scale + offsetX;
      const top = (component.y - component.height / 2) * scale + offsetY;
      const width = component.width * scale;
      const height = component.height * scale;
      
      // Create a temporary image element to draw the component
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, left, top, width, height);
      };
      img.onerror = () => {
        // If image fails to load, draw a placeholder
        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.fillRect(left, top, width, height);
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(left, top, width, height);
        
        ctx.fillStyle = 'white';
        ctx.font = `${20 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(component.name, left + width/2, top + height/2);
      };
      img.src = component.img;
    });
  };

  const handleExport = () => {
    onExport({
      format,
      backgroundColor,
      includeGrid,
      padding
    });
    onClose();
  };

  return (
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#1a1a1a",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "8px",
          padding: "24px",
          width: "80%",
          maxWidth: "800px",
          maxHeight: "90vh",
          overflow: "auto",
          color: "white",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          marginBottom: "20px" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>📤</span>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
              Export Canvas
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              margin: "0 0 12px 0", 
              fontSize: "16px", 
              fontWeight: "500",
              color: "#e5e7eb"
            }}>
              Preview
            </h3>
            <canvas 
              ref={previewRef} 
              width={400} 
              height={300} 
              style={{ 
                backgroundColor, 
                borderRadius: "8px", 
                border: "1px solid rgba(255, 255, 255, 0.1)",
                width: "100%"
              }}
            />
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              margin: "0 0 12px 0", 
              fontSize: "16px", 
              fontWeight: "500",
              color: "#e5e7eb"
            }}>
              Export Settings
            </h3>
            
            <div style={{ 
              marginBottom: "16px",
              padding: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "6px",
            }}>
              <label style={{ display: "block", color: "#9ca3af", marginBottom: "6px" }}>
                Format
              </label>
              <select 
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(8, 22, 53, 1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffffff",
                  fontSize: "14px"
                }}
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="svg">SVG</option>
              </select>
            </div>
            
            <div style={{ 
              marginBottom: "16px",
              padding: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "6px",
            }}>
              <label style={{ display: "block", color: "#9ca3af", marginBottom: "6px" }}>
                Background Color
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input 
                  type="color" 
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  style={{
                    width: "40px",
                    height: "40px",
                    padding: 0,
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                />
                <input 
                  type="text" 
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                    fontSize: "14px"
                  }}
                />
              </div>
            </div>
            
            <div style={{ 
              marginBottom: "16px",
              padding: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "6px",
            }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#9ca3af" }}>
                <input 
                  type="checkbox" 
                  checked={includeGrid}
                  onChange={(e) => setIncludeGrid(e.target.checked)}
                  style={{
                    margin: 0,
                    width: "16px",
                    height: "16px"
                  }}
                />
                Include Grid
              </label>
            </div>
            
            <div style={{ 
              padding: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "6px",
            }}>
              <label style={{ display: "block", color: "#9ca3af", marginBottom: "6px" }}>
                Padding: {padding}px
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={padding}
                onChange={(e) => setPadding(parseInt(e.target.value))}
                style={{ 
                  width: "100%",
                  height: "6px",
                  borderRadius: "3px",
                  background: "rgba(255, 255, 255, 0.1)",
                  outline: "none"
                }}
              />
            </div>
          </div>
        </div>
        
        <div style={{ 
          display: "flex", 
          justifyContent: "flex-end", 
          gap: "12px"
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backgroundColor: "transparent",
              color: "#fff",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#1083b9ff",
              color: "#fff",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;