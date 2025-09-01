// src/components/ExportModal.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
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
  const [imageCache, setImageCache] = useState(new Map());
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const previewRef = useRef(null);

  // Calculate bounds of all elements to center them
  const calculateBounds = useCallback(() => {
    if (traces.length === 0 && placed.length === 0) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // Check traces
    traces.forEach(trace => {
      trace.points.forEach(pt => {
        const worldPt = gridToWorld(pt.gx, pt.gy);
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

    // Add margin
    return { 
      minX: minX - 20, 
      minY: minY - 20, 
      maxX: maxX + 20, 
      maxY: maxY + 20 
    };
  }, [traces, placed]);

  // Load all component images and cache them
  useEffect(() => {
    if (!isOpen) {
      setImageCache(new Map());
      setImagesLoaded(false);
      return;
    }
    
    const loadImages = async () => {
      const newCache = new Map(imageCache); // Start with existing cache
      const imagePromises = placed.map(component => {
        return new Promise((resolve) => {
          // Check if already cached
          if (newCache.has(component.img)) {
            resolve();
            return;
          }

          const img = new Image();
          img.crossOrigin = "Anonymous";
          
          img.onload = () => {
            newCache.set(component.img, { img, loaded: true });
            resolve();
          };
          
          img.onerror = () => {
            newCache.set(component.img, { img: null, loaded: false });
            resolve();
          };
          
          try {
            const url = new URL(component.img, window.location.href);
            url.searchParams.set('t', Date.now());
            img.src = url.toString();
          } catch (error) {
            img.src = component.img + (component.img.includes('?') ? '&' : '?') + 't=' + Date.now();
          }
        });
      });

      await Promise.all(imagePromises);
      setImageCache(newCache);
      setImagesLoaded(true);
    };

    if (placed.length > 0) {
      setImagesLoaded(false);
      loadImages();
    } else {
      setImagesLoaded(true);
    }
  }, [isOpen, placed]);

  const renderPreview = useCallback(() => {
    if (!previewRef.current || !imagesLoaded) return;

    const canvas = previewRef.current;
    const ctx = canvas.getContext('2d');
    const bounds = calculateBounds();
    
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    
    // Set canvas size to a reasonable preview size
    const PREVIEW_WIDTH = 350;
    const PREVIEW_HEIGHT = 250;
    
    canvas.width = PREVIEW_WIDTH;
    canvas.height = PREVIEW_HEIGHT;
    
    // Avoid division by zero
    if (contentWidth === 0 || contentHeight === 0) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No content to preview', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    const scale = Math.min(
      (canvas.width - padding * 2) / contentWidth,
      (canvas.height - padding * 2) / contentHeight,
      1
    );
    
    const offsetX = (canvas.width - contentWidth * scale) / 2 - bounds.minX * scale;
    const offsetY = (canvas.height - contentHeight * scale) / 2 - bounds.minY * scale;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    if (includeGrid) {
      const gridSize = 15 * scale;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 0.5;
      
      for (let x = offsetX; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = offsetY; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Draw traces
    traces.forEach(trace => {
      const points = trace.points.map(pt => {
        const worldPt = gridToWorld(pt.gx, pt.gy);
        return {
          x: worldPt.x * scale + offsetX,
          y: worldPt.y * scale + offsetY
        };
      });
      
      if (points.length === 0) return;
      
      // Draw trace line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      ctx.strokeStyle = trace.color;
      ctx.lineWidth = 8 * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      
      // Draw start and end points
      if (points.length > 0) {
        // Start point
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, 5 * scale, 0, Math.PI * 2);
        ctx.fillStyle = trace.color;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, 2.5 * scale, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        // End point (if different from start)
        if (points.length > 1 && 
            (points[0].x !== points[points.length - 1].x || 
             points[0].y !== points[points.length - 1].y)) {
          ctx.beginPath();
          ctx.arc(points[points.length - 1].x, points[points.length - 1].y, 5 * scale, 0, Math.PI * 2);
          ctx.fillStyle = trace.color;
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(points[points.length - 1].x, points[points.length - 1].y, 2.5 * scale, 0, Math.PI * 2);
          ctx.fillStyle = 'white';
          ctx.fill();
        }
      }
    });

    // Helper function to draw placeholder
    const drawPlaceholder = (left, top, width, height, name) => {
      ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
      ctx.fillRect(left, top, width, height);
      
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1 * scale;
      ctx.strokeRect(left, top, width, height);
      
      ctx.fillStyle = 'white';
      ctx.font = `${Math.max(10 * scale, 6)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, left + width/2, top + height/2);
    };

    // Draw components using cached images
    placed.forEach((component) => {
      const left = (component.x - component.width / 2) * scale + offsetX;
      const top = (component.y - component.height / 2) * scale + offsetY;
      const width = component.width * scale;
      const height = component.height * scale;
      
      // Skip drawing if component is too small in preview
      if (width < 2 || height < 2) return;
      
      const cachedImage = imageCache.get(component.img);
      
      if (cachedImage && cachedImage.loaded && cachedImage.img) {
        try {
          ctx.drawImage(cachedImage.img, left, top, width, height);
        } catch (error) {
          drawPlaceholder(left, top, width, height, component.name);
        }
      } else {
        drawPlaceholder(left, top, width, height, component.name);
      }
    });
  }, [traces, placed, backgroundColor, includeGrid, padding, calculateBounds, imageCache, imagesLoaded]);

  useEffect(() => {
    if (isOpen && imagesLoaded) {
      const timeoutId = setTimeout(() => {
        renderPreview();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, format, backgroundColor, includeGrid, padding, renderPreview, imagesLoaded]);

  const handleExport = () => {
    onExport({
      format,
      backgroundColor,
      includeGrid,
      padding
    });
    onClose();
  };

  if (!isOpen) return null;

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
          padding: "32px",
          width: "85%",
          maxWidth: "750px",
          maxHeight: "85vh",
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
          marginBottom: "24px" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>📤</span>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
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

        <div style={{ display: "flex", gap: "24px", marginBottom: "24px", flexDirection: "row" }}>
          {/* Preview Section */}
          <div style={{ flex: 1.2, minWidth: "300px" }}>
            <h3 style={{ 
              margin: "0 0 12px 0", 
              fontSize: "16px", 
              fontWeight: "500",
              color: "#e5e7eb"
            }}>
              Preview
            </h3>
            <div style={{ 
              position: 'relative',
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "6px",
              overflow: "hidden",
              backgroundColor: backgroundColor,
              width: "100%",
              height: "200px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <canvas 
                ref={previewRef} 
                style={{ 
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain"
                }}
              />
              {(traces.length === 0 && placed.length === 0) && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#666',
                  fontSize: '14px',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}>
                  No content to export
                </div>
              )}
              {!imagesLoaded && placed.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#666',
                  fontSize: '14px',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}>
                  Loading images...
                </div>
              )}
            </div>
          </div>
          
          {/* Settings Section */}
          <div style={{ flex: 1, minWidth: "280px" }}>
            <h3 style={{ 
              margin: "0 0 12px 0", 
              fontSize: "16px", 
              fontWeight: "500",
              color: "#e5e7eb"
            }}>
              Export Settings
            </h3>
            
            {/* Format */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", color: "#9ca3af", marginBottom: "6px", fontSize: "14px" }}>
                Format
              </label>
              <select 
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(8, 22, 53, 1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffffff",
                  fontSize: "14px"
                }}
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="svg">SVG (Not implemented)</option>
              </select>
            </div>
            
            {/* Background Color */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", color: "#9ca3af", marginBottom: "6px", fontSize: "14px" }}>
                Background Color
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input 
                  type="color" 
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  style={{
                    width: "32px",
                    height: "32px",
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
                    borderRadius: "4px",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                    fontSize: "14px"
                  }}
                />
              </div>
            </div>
            
            {/* Include Grid */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#9ca3af", fontSize: "14px" }}>
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
            
            {/* Padding */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", color: "#9ca3af", marginBottom: "6px", fontSize: "14px" }}>
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
                  height: "4px",
                  borderRadius: "2px",
                  background: "rgba(255, 255, 255, 0.1)",
                  outline: "none"
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Buttons */}
        <div style={{ 
          display: "flex", 
          justifyContent: "flex-end", 
          gap: "12px",
          marginTop: "24px"
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: "4px",
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
              borderRadius: "4px",
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