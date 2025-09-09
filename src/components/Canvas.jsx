import React, { useEffect, useRef, useState, useCallback } from "react";
import { STORAGE_KEYS, saveToStorage, loadFromStorage, clearStorage } from "../utils/storage";
import Toolbar, { TOOLS } from "./Toolbar";
import UndoRedoButtons from "./UndoRedoButtons";
import Trace from "./Trace";
import SelectionBox from "./SelectionBox";
import StatusIndicators from "./StatusIndicators";
import CustomCursor from "./CustomCursor";
import ExportModal from "./ExportModal";
import SettingsModal from "./SettingsModal";
import SettingsButton from "./SettingsButton";
import { getPinColor, PIN_TYPES } from "../utils/pinLibrary";
import { getComponentPins } from "../utils/pinDefinitions/loader";
import PinHighlight from "./PinHighlight";
import PinLabel from "./PinLabel";
import { viaToCanvasSimple } from "../utils/coordinateTransform";

import {
  GRID_SIZE,
  worldToGrid,
  gridToWorld,
  snapWorld,
  pointInRect,
  uid
} from "../utils/canvasUtils";

const DOT_RADIUS = 1;
const VIRTUAL_WORLD_MIN = 10000;
const MIN_COMPONENT_SIZE = 400;
const MAX_COMPONENT_SIZE = 1080;
const SIZE_INCREMENT = GRID_SIZE / 2;

export default function Canvas() {

  const [traceWidth, setTraceWidth] = useState(12);
  const [selectedTraceWidth, setSelectedTraceWidth] = useState(14);
  const [showLabels, setShowLabels] = useState(true);

  

  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const hostRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState("#00e676");
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [placed, setPlaced] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const [resizingId, setResizingId] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [traces, setTraces] = useState([]);
  const [activeTrace, setActiveTrace] = useState(null);
 
  
  // Tool state
  const [activeTool, setActiveTool] = useState(TOOLS.POINTER);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  
  // Smart draw state
  const [smartDrawStart, setSmartDrawStart] = useState(null);
  const [smartDrawEnd, setSmartDrawEnd] = useState(null);
  
  // Selection box state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [selectedTraces, setSelectedTraces] = useState(new Set());
  const [selectedComponents, setSelectedComponents] = useState(new Set());

  //New pin snapping
  const [componentPins, setComponentPins] = useState({});
  const [hoveredPin, setHoveredPin] = useState(null);
  const [nearestPin, setNearestPin] = useState(null);
  const [showPins, setShowPins] = useState(true);

  // Add this debug component to Canvas.jsx
const DebugOverlay = ({ component, pins }) => {
  if (!pins || pins.length === 0) return null;

  return (
    <>
      {/* Component bounding box */}
      <div
        style={{
          position: "absolute",
          left: `${component.x - component.width/2}px`,
          top: `${component.y - component.height/2}px`,
          width: `${component.width}px`,
          height: `${component.height}px`,
          border: "2px dashed red",
          pointerEvents: "none",
          zIndex: 4
        }}
      />
      
      {/* Coordinate markers */}
      {pins.map((pin, index) => {
        const pinX = component.x + pin.x - component.width/2;
        const pinY = component.y + pin.y - component.height/2;
        return (
          <div key={`debug-${index}`}>
            {/* Pin coordinate crosshair */}
            <div
              style={{
                position: "absolute",
                left: `${pinX - 10}px`,
                top: `${pinY}px`,
                width: "20px",
                height: "1px",
                background: "blue",
                pointerEvents: "none",
                zIndex: 4
              }}
            />
            <div
              style={{
                position: "absolute",
                left: `${pinX}px`,
                top: `${pinY - 10}px`,
                width: "1px",
                height: "20px",
                background: "blue",
                pointerEvents: "none",
                zIndex: 4
              }}
            />
            
            {/* Coordinate text */}
            <div
              style={{
                position: "absolute",
                left: `${pinX + 5}px`,
                top: `${pinY + 5}px`,
                background: "rgba(0,0,255,0.8)",
                color: "white",
                padding: "2px 4px",
                borderRadius: "2px",
                fontSize: "10px",
                pointerEvents: "none",
                zIndex: 4
              }}
            >
              {pin.x},{pin.y}
            </div>
          </div>
        );
      })}
    </>
  );
};
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetId: null,
    targetTraceId: null,
  });
  
  // History state for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Auto-save state
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(30); // seconds
  
  const contextMenuRef = useRef(null);

  // Coordinate helpers - wrapped in useCallback
  const toLocal = useCallback((e) => {
    const rect = hostRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const toWorld = useCallback((x, y) => ({
    wx: (x - offset.x) / scale,
    wy: (y - offset.y) / scale
  }), [offset.x, offset.y, scale]);

// 2. Enhanced findNearestPin function with better snapping logic
const findNearestPin = useCallback((worldX, worldY) => {
  let closestPin = null;
  let minDistance = 25;

  placed.forEach(component => {
    const pins = componentPins[component.id] || [];

    pins.forEach(pin => {
      // ✅ CORRECTED: Use viaToCanvasSimple for accurate transformation
      const { x: pinWorldX, y: pinWorldY } = viaToCanvasSimple(
        pin.x,
        pin.y,
        component
      );

      const distance = Math.sqrt(
        Math.pow(worldX - pinWorldX, 2) + 
        Math.pow(worldY - pinWorldY, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestPin = {
          component,
          pin,
          distance,
          worldX: pinWorldX,
          worldY: pinWorldY,
          pinType: pin.type,
          pinId: pin.id,
          componentName: component.name
        };
      }
    });
  });

  return closestPin;
}, [placed, componentPins]);


  const calculateBounds = useCallback(() => {
  if (traces.length === 0 && placed.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  // Check traces - FIX gridToWorld usage
  traces.forEach(trace => {
    trace.points.forEach(pt => {
      const worldPt = gridToWorld(pt.gx, pt.gy); // ← FIX: Use correct signature
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

  // Add some margin
  return { 
    minX: minX - 20, 
    minY: minY - 20, 
    maxX: maxX + 20, 
    maxY: maxY + 20 
  };
}, [traces, placed, gridToWorld]); // ← ADD gridToWorld DEPENDENCY
 
// Trigger download function
const triggerDownload = useCallback((canvas, format = 'png') => {
  try {
    // Create a temporary link for download
    const link = document.createElement('a');
    link.download = `circuit-diagram.${format}`;
    
    // Convert canvas to data URL
    let dataUrl;
    if (format === 'jpeg') {
      dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    } else {
      dataUrl = canvas.toDataURL('image/png');
    }
    
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Download failed:', error);
    alert('Export failed. Please try again.');
  }
}, []);


  // Helper functions wrapped in useCallback
  const traceIntersectsRect = useCallback((trace, rect) => {
  const { x, y, width, height } = rect;
  return trace.points.some(pt => {
    // Use the same gridToWorld conversion as the Trace component
    const worldPt = gridToWorld(pt.gx, pt.gy); // ← FIX: Pass gx and gy separately
    return pointInRect(worldPt.x, worldPt.y, x, y, width, height);
  });
}, [gridToWorld]); // ← Add gridToWorld to dependencies

  const componentIntersectsRect = useCallback((component, rect) => {
    const compLeft = component.x - component.width / 2;
    const compTop = component.y - component.height / 2;
    const compRight = compLeft + component.width;
    const compBottom = compTop + component.height;
    
    const rectRight = rect.x + rect.width;
    const rectBottom = rect.y + rect.height;
    
    return !(compRight < rect.x || compLeft > rectRight || 
             compBottom < rect.y || compTop > rectBottom);
  }, []);

  // Clear selection - wrapped in useCallback
  const clearSelection = useCallback(() => {
    setSelectedTraces(new Set());
    setSelectedComponents(new Set());
  }, []);

  // Save state to history - wrapped in useCallback
  const saveToHistory = useCallback((newPlaced, newTraces) => {
    const state = {
      placed: newPlaced || placed,
      traces: newTraces || traces,
      timestamp: Date.now()
    };
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(state);
      return newHistory.slice(-50);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
    
    // Trigger auto-save if enabled
    if (autoSaveEnabled) {
      const stateToSave = {
        placed: newPlaced || placed,
        traces: newTraces || traces,
        offset,
        scale,
        timestamp: Date.now()
      };
      
      saveToStorage(STORAGE_KEYS.CANVAS_STATE, stateToSave);
      setLastSaveTime(Date.now());
      saveToStorage(STORAGE_KEYS.LAST_SAVED, Date.now());
    }
  }, [placed, traces, historyIndex, autoSaveEnabled, offset, scale]);

  // Manual save function
  const manualSave = useCallback(() => {
    // Show saving status
    window.dispatchEvent(new CustomEvent("canvas-saving"));
    
    const stateToSave = {
      placed,
      traces,
      offset,
      scale,
      timestamp: Date.now()
    };
    
    const saved = saveToStorage(STORAGE_KEYS.CANVAS_STATE, stateToSave);
    if (saved) {
      setLastSaveTime(Date.now());
      saveToStorage(STORAGE_KEYS.LAST_SAVED, Date.now());
      
      // Show saved status
      window.dispatchEvent(new CustomEvent("canvas-saved"));
      
      console.log('Canvas saved successfully');
    }
  }, [placed, traces, offset, scale]);

  // Clear all data function
  const clearAllData = useCallback(() => {
    setPlaced([]);
    setTraces([]);
    setOffset({ x: 0, y: 0 });
    setScale(1);
    clearStorage(STORAGE_KEYS.CANVAS_STATE);
    clearStorage(STORAGE_KEYS.LAST_SAVED);
    setLastSaveTime(null);
    clearSelection();
    saveToHistory([], []);
  }, [clearSelection, saveToHistory]);

  // Undo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setPlaced(prevState.placed);
      setTraces(prevState.traces);
      setHistoryIndex(historyIndex - 1);
      clearSelection();
    }
  }, [history, historyIndex, clearSelection]);

  // Redo functionality
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setPlaced(nextState.placed);
      setTraces(nextState.traces);
      setHistoryIndex(historyIndex + 1);
      clearSelection();
    }
  }, [history, historyIndex, clearSelection]);

  // Update selection based on current selection box
  const updateSelection = useCallback(() => {
  if (!selectionStart || !selectionEnd) return;
  
  const startWorld = toWorld(selectionStart.x, selectionStart.y);
  const endWorld = toWorld(selectionEnd.x, selectionEnd.y);
  
  const selectionRect = {
    x: Math.min(startWorld.wx, endWorld.wx),
    y: Math.min(startWorld.wy, endWorld.wy),
    width: Math.abs(endWorld.wx - startWorld.wx),
    height: Math.abs(endWorld.wy - startWorld.wy)
  };
    
    const newSelectedTraces = new Set();
    traces.forEach(trace => {
      if (traceIntersectsRect(trace, selectionRect)) {
        newSelectedTraces.add(trace.id);
      }
    });
    
    const newSelectedComponents = new Set();
    placed.forEach(component => {
      if (componentIntersectsRect(component, selectionRect)) {
        newSelectedComponents.add(component.id);
      }
    });
    
    setSelectedTraces(newSelectedTraces);
    setSelectedComponents(newSelectedComponents);
  }, [selectionStart, selectionEnd, traces, placed, toWorld, traceIntersectsRect, componentIntersectsRect]);

  // Delete selected items
  const deleteSelected = useCallback(() => {
    // Create filtered arrays
    const newTraces = traces.filter(trace => !selectedTraces.has(trace.id));
    const newPlaced = placed.filter(component => !selectedComponents.has(component.id));
    
    // Update state with the filtered arrays
    setTraces(newTraces);
    setPlaced(newPlaced);
    
    // Save to history and clear selection
    saveToHistory(newPlaced, newTraces);
    clearSelection();
  }, [selectedTraces, selectedComponents, traces, placed, saveToHistory, clearSelection]);

  // Add trace deletion to context menu
  const deleteTrace = useCallback(() => {
    if (!contextMenu.targetTraceId) return;
    
    // Create a new array without the deleted trace
    const newTraces = traces.filter(t => t.id !== contextMenu.targetTraceId);
    setTraces(newTraces);
    
    // Also remove from selection if it was selected
    if (selectedTraces.has(contextMenu.targetTraceId)) {
      const newSelection = new Set(selectedTraces);
      newSelection.delete(contextMenu.targetTraceId);
      setSelectedTraces(newSelection);
    }
    
    setContextMenu({ visible: false, x: 0, y: 0, targetId: null, targetTraceId: null });
    
    // Save the updated state to history
    saveToHistory(placed, newTraces);
  }, [contextMenu.targetTraceId, traces, placed, selectedTraces, saveToHistory]);

  // Get cursor based on active tool
  const getCursor = useCallback(() => {
    if (resizingId) return "nwse-resize";
    if (isPanning) return "grabbing";
    if (panStart) return "grabbing";
    if (activeTool === TOOLS.PAN) return "grab";
    if (activeTool === TOOLS.SELECT && isSelecting) return "crosshair";
    if (activeTool === TOOLS.DRAW && (isDrawing || !smartDrawStart)) return "crosshair";
    if (activeTool === TOOLS.SMART_DRAW) return "none";
    if (activeTool === TOOLS.POINTER) return "default";
    if (draggingId) return "grabbing";
    return "default";
  }, [resizingId, isPanning, panStart, activeTool, isSelecting, isDrawing, smartDrawStart, draggingId]);

  // Smart draw pathfinding algorithm
  const createSmartTrace = useCallback((start, end) => {
    const startGrid = worldToGrid(start.wx, start.wy);
    const endGrid = worldToGrid(end.wx, end.wy);
    
    // Simple L-shaped path with 90-degree turns
    const points = [startGrid];
    
    // Determine if we should go horizontal first or vertical first
    const dx = Math.abs(endGrid.gx - startGrid.gx);
    const dy = Math.abs(endGrid.gy - startGrid.gy);
    
    // Go horizontal first if horizontal distance is greater
    if (dx >= dy) {
      // Horizontal then vertical
      if (endGrid.gx !== startGrid.gx) {
        points.push({ gx: endGrid.gx, gy: startGrid.gy });
      }
      points.push(endGrid);
    } else {
      // Vertical then horizontal
      if (endGrid.gy !== startGrid.gy) {
        points.push({ gx: startGrid.gx, gy: endGrid.gy });
      }
      points.push(endGrid);
    }
    
    return points;
  }, []);

  // Component resizing
  const resizeComponent = useCallback((id, delta) => {
    setPlaced(prev => prev.map(item => {
      if (item.id === id) {
        const newWidth = Math.min(
          Math.max(item.width + delta, MIN_COMPONENT_SIZE),
          MAX_COMPONENT_SIZE
        );
        const newHeight = Math.min(
          Math.max(item.height + delta, MIN_COMPONENT_SIZE),
          MAX_COMPONENT_SIZE
        );
        return { ...item, width: newWidth, height: newHeight };
      }
      return item;
    }));
  }, []);

  //  update handleExport
const handleExport = useCallback((options) => {
  // Create a temporary canvas for rendering
  const exportCanvas = document.createElement('canvas');
  const ctx = exportCanvas.getContext('2d');
  
  // Calculate bounds to center content
  const bounds = calculateBounds();
  const contentWidth = bounds.maxX - bounds.minX;
  const contentHeight = bounds.maxY - bounds.minY;
  
  // Set canvas size with padding - MAKE SURE THESE ARE VALID NUMBERS
  exportCanvas.width = Math.max(contentWidth + options.padding * 2, 100);
  exportCanvas.height = Math.max(contentHeight + options.padding * 2, 100);
    
  // Fill background
  ctx.fillStyle = options.backgroundColor;
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  
  // Draw grid if enabled
  if (options.includeGrid) {
    const gridSize = 20;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    
    // Fix grid drawing coordinates
    for (let x = options.padding; x <= exportCanvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, exportCanvas.height);
      ctx.stroke();
    }
    
    for (let y = options.padding; y <= exportCanvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(exportCanvas.width, y);
      ctx.stroke();
    }
  }
  
  // Draw traces - FIX gridToWorld usage
  traces.forEach(trace => {
    const points = trace.points.map(pt => {
      // FIX: Use the correct gridToWorld signature
      const worldPt = gridToWorld(pt.gx, pt.gy);
      return {
        x: worldPt.x - bounds.minX + options.padding,
        y: worldPt.y - bounds.minY + options.padding
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
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Draw start and end points
    if (points.length > 0) {
      // Start point
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, 8, 0, Math.PI * 2);
      ctx.fillStyle = trace.color;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      
      // End point (if different from start)
      if (points.length > 1 && 
          (points[0].x !== points[points.length - 1].x || 
           points[0].y !== points[points.length - 1].y)) {
        ctx.beginPath();
        ctx.arc(points[points.length - 1].x, points[points.length - 1].y, 8, 0, Math.PI * 2);
        ctx.fillStyle = trace.color;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(points[points.length - 1].x, points[points.length - 1].y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
      }
    }
  });
  // Helper function to draw placeholders
  const drawPlaceholder = (ctx, left, top, width, height, name) => {
    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.fillRect(left, top, width, height);
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(left, top, width, height);
    
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name || 'Component', left + width/2, top + height/2);
  };

  
    
    // Draw components with better error handling
  const drawComponents = () => {
    return new Promise((resolve) => {
      let loadedCount = 0;
      const totalComponents = placed.length;
      
      if (totalComponents === 0) {
        resolve();
        return;
      }
      
      placed.forEach(component => {
        const left = component.x - component.width / 2 - bounds.minX + options.padding;
        const top = component.y - component.height / 2 - bounds.minY + options.padding;
        
        // Create a temporary image element to draw the component
        const img = new Image();
        
        // Handle CORS issues
        img.crossOrigin = "Anonymous";
        
        img.onload = () => {
          try {
            ctx.drawImage(img, left, top, component.width, component.height);
          } catch (error) {
            console.warn('Failed to draw image:', error);
            // Draw placeholder on error
            drawPlaceholder(ctx, left, top, component.width, component.height, component.name);
          }
          loadedCount++;
          if (loadedCount === totalComponents) resolve();
        };
        
        img.onerror = () => {
          // If image fails to load, draw a placeholder
          drawPlaceholder(ctx, left, top, component.width, component.height, component.name);
          loadedCount++;
          if (loadedCount === totalComponents) resolve();
        };
        
        // Add timestamp to avoid caching issues
        try {
          img.src = component.img + (component.img.includes('?') ? '&' : '?') + 't=' + Date.now();
        } catch (error) {
          console.warn('Invalid image URL:', component.img);
          drawPlaceholder(ctx, left, top, component.width, component.height, component.name);
          loadedCount++;
          if (loadedCount === totalComponents) resolve();
        }
      });
    });
  };
      // Wait for all components to load before triggering download
  drawComponents().then(() => {
    triggerDownload(exportCanvas, options.format);
  }).catch(error => {
    console.error('Export failed:', error);
    triggerDownload(exportCanvas, options.format);
  });
}, [traces, placed, calculateBounds, triggerDownload, gridToWorld]);



  // Handle export modal open
  const handleOpenExport = useCallback(() => {
    setShowExportModal(true);
  }, []);

  // Event handlers
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback((e) => {
  e.preventDefault();
  const raw = e.dataTransfer.getData("application/reactflow") || e.dataTransfer.getData("text/plain");
  if (!raw) return;

  let part = {};
  try {
    part = JSON.parse(raw);
  } catch {
    part = { id: uid(), name: "part", image: raw };
  }

  const { x: lx, y: ly } = toLocal(e);
  const { wx, wy } = toWorld(lx, ly);
  const sx = snapWorld(wx);
  const sy = snapWorld(wy);

  // Load image to get actual dimensions
  const img = new Image();
  img.onload = () => {
    setPlaced((p) => [
      ...p,
      {
        id: uid(),
        type: part.id || "part",
        name: part.name || "Part",
        img: part.image || part.img || "",
        x: sx,
        y: sy,
        width: img.width,    // ← Use actual image width
        height: img.height   // ← Use actual image height
      }
    ]);
  };
  img.onerror = () => {
    // Fallback to original size if image fails to load
    setPlaced((p) => [
      ...p,
      {
        id: uid(),
        type: part.id || "part",
        name: part.name || "Part",
        img: part.image || part.img || "",
        x: sx,
        y: sy,
        width: 1080,
        height: 648
      }
    ]);
  };
  img.src = part.image || part.img || "";
}, [toLocal, toWorld, saveToHistory]);

  const onItemMouseDown = useCallback((e, id) => {
    if (activeTool === TOOLS.DRAW || activeTool === TOOLS.SMART_DRAW) return;
    if (activeTool === TOOLS.PAN || isPanning || isSelecting) return;
    e.stopPropagation();
    setContextMenu((c) => (c.visible ? { ...c, visible: false } : c));

    const item = placed.find((p) => p.id === id);
    if (!item) return;

    if (activeTool === TOOLS.POINTER) {
      clearSelection();
      setContextMenu((c) => ({ ...c, targetId: id, targetTraceId: null }));
    }

    const { x: lx, y: ly } = toLocal(e);
    const { wx, wy } = toWorld(lx, ly);
    setDraggingId(id);
    dragOffset.current = { x: wx - item.x, y: wy - item.y };
  }, [activeTool, isPanning, isSelecting, placed, clearSelection, toLocal, toWorld]);

  const onItemContextMenu = useCallback((e, id) => {
    // Disable context menu for drawing tools
    if (activeTool === TOOLS.DRAW || activeTool === TOOLS.SMART_DRAW) return;
    
    e.preventDefault();
    e.stopPropagation();
    const rect = hostRef.current.getBoundingClientRect();
    setContextMenu({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      targetId: id,
      targetTraceId: null
    });
  }, [activeTool]);

  const onSectionContextMenu = useCallback((e) => {
    e.preventDefault();
    const { x: lx, y: ly } = toLocal(e);
    const { wx, wy } = toWorld(lx, ly);
    
    const clickedTrace = traces.find(trace => {
      return trace.points.some(pt => {
        const { x, y } = gridToWorld(pt);
        return Math.abs(x - wx) < 5 && Math.abs(y - wy) < 5;
      });
    });

    if (clickedTrace) {
      const rect = hostRef.current.getBoundingClientRect();
      setContextMenu({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        targetTraceId: clickedTrace.id,
        targetId: null
      });
    } else if (selectedTraces.size > 0 || selectedComponents.size > 0) {
      const rect = hostRef.current.getBoundingClientRect();
      setContextMenu({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        targetTraceId: null,
        targetId: null
      });
    }
  }, [toLocal, toWorld, traces, selectedTraces, selectedComponents]);

  const deleteContextTarget = useCallback(() => {
    if (!contextMenu.targetId) return;
    
    // Create a new array without the deleted component
    const newPlaced = placed.filter((it) => it.id !== contextMenu.targetId);
    setPlaced(newPlaced);
    
    // Also remove from selection if it was selected
    if (selectedComponents.has(contextMenu.targetId)) {
      const newSelection = new Set(selectedComponents);
      newSelection.delete(contextMenu.targetId);
      setSelectedComponents(newSelection);
    }
    
    setContextMenu({ visible: false, x: 0, y: 0, targetId: null, targetTraceId: null });
    setDraggingId((d) => (d === contextMenu.targetId ? null : d));
    
    // Save the updated state to history
    setTimeout(() => saveToHistory(newPlaced, traces), 0);
  }, [contextMenu.targetId, placed, selectedComponents, traces, saveToHistory]);

// 2. Update onSectionMouseDown to handle pin snapping for draw tools
const onSectionMouseDown = useCallback((e) => {
  setContextMenu((c) => (c.visible ? { ...c, visible: false } : c));

  const { x: lx, y: ly } = toLocal(e);
  const { wx, wy } = toWorld(lx, ly);

  // Pan tool or space key panning
  if (activeTool === TOOLS.PAN || isPanning) {
    setPanStart({
      x: e.clientX,
      y: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y
    });
    return;
  }

  // Pointer tool - just clears selection and allows component interaction
  if (activeTool === TOOLS.POINTER) {
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
      clearSelection();
      setContextMenu((c) => ({ ...c, targetId: null, targetTraceId: null }));
    }
    return;
  }

  // Selection tool
  if (activeTool === TOOLS.SELECT) {
    e.preventDefault();
    clearSelection();
    setSelectionStart({ x: lx, y: ly });
    setSelectionEnd({ x: lx, y: ly });
    setIsSelecting(true);
    setContextMenu((c) => ({ ...c, targetId: null, targetTraceId: null }));
    return;
  }

  // UPDATED: Draw tool with pin snapping
  if (activeTool === TOOLS.DRAW) {
    e.preventDefault();
    
    // Use nearest pin if close enough, otherwise use mouse position
    let targetX = wx, targetY = wy;
    if (nearestPin && nearestPin.distance < 20) {
      targetX = nearestPin.worldX;
      targetY = nearestPin.worldY;
    }
    
    const gp = worldToGrid(targetX, targetY);
    setActiveTrace({ id: uid(), points: [gp], color: selectedColor });
    setIsDrawing(true);
    return;
  }

  // UPDATED: Smart draw tool with pin snapping
  if (activeTool === TOOLS.SMART_DRAW) {
    e.preventDefault();
    
    // Use nearest pin if close enough, otherwise use mouse position
    let targetX = wx, targetY = wy;
    if (nearestPin && nearestPin.distance < 20) {
      targetX = nearestPin.worldX;
      targetY = nearestPin.worldY;
    }
    
    if (!smartDrawStart) {
      setSmartDrawStart({ wx: targetX, wy: targetY, x: lx, y: ly });
      
      // Add a temporary marker at the start point
      const gp = worldToGrid(targetX, targetY);
      setActiveTrace({ 
        id: 'smart-draw-temp', 
        points: [gp], 
        color: selectedColor,
        isSmartDraw: true 
      });
      setIsDrawing(true);
    } else {
      setSmartDrawEnd({ wx: targetX, wy: targetY, x: lx, y: ly });
      
      // Create smart trace
      const tracePoints = createSmartTrace(smartDrawStart, { wx: targetX, wy: targetY });
      const newTrace = {
        id: uid(),
        points: tracePoints,
        color: selectedColor
      };
      
      setTraces(prev => [...prev, newTrace]);
      setTimeout(() => saveToHistory(), 0);
      
      // Clear the temporary trace
      setActiveTrace(null);
      setIsDrawing(false);
      setSmartDrawStart(null);
      setSmartDrawEnd(null);
    }
    return;
  }

  // Clear selection when clicking on empty canvas (only for pointer tool)
  if (activeTool === TOOLS.POINTER && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
    clearSelection();
    setContextMenu((c) => ({ ...c, targetId: null, targetTraceId: null }));
  }
}, [toLocal, toWorld, activeTool, isPanning, offset, clearSelection, smartDrawStart, selectedColor, createSmartTrace, saveToHistory, nearestPin]);

  const onMouseMove = useCallback((e) => {
  // Update custom cursor position for smart draw
  if (activeTool === TOOLS.SMART_DRAW) {
    document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
  }
  
  // Find nearest pin for snapping (for both draw tools)
  if (activeTool === TOOLS.DRAW || activeTool === TOOLS.SMART_DRAW) {
    const { x: lx, y: ly } = toLocal(e);
    const { wx, wy } = toWorld(lx, ly);
    const nearest = findNearestPin(wx, wy);
    setNearestPin(nearest);
  }
    
   if (resizingId) {
    const { x: lx, y: ly } = toLocal(e);
    const { wx } = toWorld(lx, ly);
    const component = placed.find(c => c.id === resizingId);
    
    if (component) {
      const dx = Math.abs(wx - component.x) * 2;
      const newSize = Math.max(
        MIN_COMPONENT_SIZE, 
        Math.min(MAX_COMPONENT_SIZE, dx)
      );
      
      setPlaced(prev =>
        prev.map(c =>
          c.id === resizingId
            ? { ...c, width: newSize, height: newSize }
            : c
        )
      );
    }
    return;
  }

  if (isSelecting) {
    const { x: lx, y: ly } = toLocal(e);
    setSelectionEnd({ x: lx, y: ly });
    return;
  }

  if ((activeTool === TOOLS.PAN || isPanning) && panStart) {
    const dx = (e.clientX - panStart.x) / scale;
    const dy = (e.clientY - panStart.y) / scale;
    setOffset({
      x: panStart.offsetX + dx,
      y: panStart.offsetY + dy
    });
    return;
  }
     if (isDrawing && activeTrace && activeTool === TOOLS.DRAW) {
    const { x: lx, y: ly } = toLocal(e);
    const { wx, wy } = toWorld(lx, ly);
    
    // Use nearest pin if close enough, otherwise use mouse position
    let targetX = wx, targetY = wy;
    if (nearestPin && nearestPin.distance < 20) {
      targetX = nearestPin.worldX;
      targetY = nearestPin.worldY;
    }
    
    const gp = worldToGrid(targetX, targetY);

    setActiveTrace((prev) => {
      const pts = prev.points;
      const last = pts[pts.length - 1];
      if (!last || last.gx !== gp.gx || last.gy !== gp.gy) {
        return { ...prev, points: [...pts, gp] };
      }
      return prev;
    });
    return;
  }
     // UPDATED: Smart draw visual feedback with pin snapping
  if (smartDrawStart && !smartDrawEnd && activeTool === TOOLS.SMART_DRAW) {
    const { x: lx, y: ly } = toLocal(e);
    const { wx, wy } = toWorld(lx, ly);
    
    // Use nearest pin if close enough, otherwise use mouse position
    let targetX = wx, targetY = wy;
    if (nearestPin && nearestPin.distance < 20) {
      targetX = nearestPin.worldX;
      targetY = nearestPin.worldY;
    }
    
    // Create the full path for visual feedback
    const tracePoints = createSmartTrace(smartDrawStart, { wx: targetX, wy: targetY });
    
    setActiveTrace({
      id: 'smart-draw-active',
      points: tracePoints,
      color: selectedColor,
      isSmartDraw: true
    });
    return;
  }

  if (!draggingId) return;
  const { x: lx, y: ly } = toLocal(e);
  const { wx, wy } = toWorld(lx, ly);
  const nx = snapWorld(wx - dragOffset.current.x);
  const ny = snapWorld(wy - dragOffset.current.y);

  setPlaced((prev) =>
    prev.map((p) => (p.id === draggingId ? { ...p, x: nx, y: ny } : p))
  );
}, [activeTool, resizingId, toLocal, toWorld, placed, isSelecting, isPanning, panStart, scale, isDrawing, activeTrace, smartDrawStart, smartDrawEnd, createSmartTrace, selectedColor, draggingId, findNearestPin, nearestPin]);

  const onMouseUp = useCallback(() => {
    setResizingId(null);
    if (panStart) setPanStart(null);
    
    if (isSelecting) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
    
    if (isDrawing && activeTrace) {
      if (activeTrace.points.length > 1) {
        setTraces((prev) => [...prev, activeTrace]);
        setTimeout(() => saveToHistory(), 0);
      }
      setActiveTrace(null);
      setIsDrawing(false);
    }
    setDraggingId(null);
  }, [panStart, isSelecting, isDrawing, activeTrace, saveToHistory]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = -e.deltaY / 500;
    setScale((prev) => Math.min(Math.max(prev + delta, 0.3), 2));
  }, []);

// 3. Enhanced pin hover areas in renderComponent (make them work with traces on top)
const renderComponent = useCallback((c) => {
  const isSelected = selectedComponents.has(c.id) || contextMenu.targetId === c.id;
  const pins = componentPins[c.id] || [];

  return (
    <div
      key={c.id}
      style={{
        position: "absolute",
        left: `${c.x}px`,
        top: `${c.y}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: 1, // ← Lower z-index for components
        userSelect: "none",
        pointerEvents: (activeTool === TOOLS.DRAW || activeTool === TOOLS.SMART_DRAW) ? "none" : "auto"
      }}
      onMouseDown={(e) => onItemMouseDown(e, c.id)}
      onContextMenu={(e) => onItemContextMenu(e, c.id)}
    >
      <img
        src={c.img}
        alt={c.name}
        draggable={false}
        style={{
          width: `${c.width}px`,
          height: `${c.height}px`,
          pointerEvents: "none",
          border: isSelected ? "2px solid #60a5fa" : "none",
          borderRadius: 4,
          boxShadow: isSelected ? "0 0 0 2px rgba(96, 165, 250, 0.3)" : "none"
        }}
      />
      
      {/* Pin interaction areas - only visible during non-drawing modes */}
       {showPins && activeTool !== TOOLS.DRAW && activeTool !== TOOLS.SMART_DRAW && pins.map((pin, index) => {
    // ✅ CORRECTED: Use viaToCanvasSimple for accurate transformation
    const { x: pinWorldX, y: pinWorldY } = viaToCanvasSimple(pin.x, pin.y, c);

    // Calculate position relative to component's top-left corner for hover area
    const hoverX = c.x - c.width / 2;
    const hoverY = c.y - c.height / 2;
    const hoverAreaLeft = pinWorldX - hoverX;
    const hoverAreaTop = pinWorldY - hoverY;

    return (
      <div
        key={`${c.id}-${pin.id}-hover-${index}`}
        style={{
          position: "absolute",
          left: `${hoverAreaLeft - 15}px`,
          top: `${hoverAreaTop - 15}px`,
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          backgroundColor: "transparent",
          cursor: "crosshair",
          zIndex: 2,
          transition: "all 0.1s ease"
        }}
        onMouseEnter={() => setHoveredPin({ component: c, pin })}
        onMouseLeave={() => setHoveredPin(null)}
        onClick={(e) => {
          e.stopPropagation();
          console.log(`Clicked pin: ${pin.id} on ${c.name}`, {
            viaCoords: [pin.x, pin.y],
            worldCoords: [pinWorldX, pinWorldY]
          });
        }}
      />
    );
  })}

    </div>
  );
}, [selectedComponents, contextMenu.targetId, activeTool, onItemMouseDown, onItemContextMenu, componentPins, showPins]);

  const renderContextMenu = useCallback(() => {
    if (!contextMenu.visible) return null;
    
    const hasSelectedItems = selectedTraces.size > 0 || selectedComponents.size > 0;
    
    return (
      <div
        ref={contextMenuRef}
        style={{
          position: "absolute",
          left: contextMenu.x,
          top: contextMenu.y,
          zIndex: 9999,
          background: "#110724ff",
          border: "1px solid rgba(0,0,0,0.12)",
          boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
          borderRadius: 4,
          minWidth: 160,
          overflow: "hidden",
          userSelect: "none",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {contextMenu.targetTraceId ? (
          <>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)", fontSize: 13 }}>
              Trace Options
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                deleteTrace();
              }}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, color: "#ef4444" }}
            >
              Delete Trace
            </div>
          </>
        ) : contextMenu.targetId ? (
          <>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)", fontSize: 13 }}>
              Component Options
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                deleteContextTarget();
              }}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, color: "#ef4444" }}
            >
              Delete Component
            </div>
            <div style={{ padding: "6px 12px", fontSize: 12, color: "#9ca3af" }}>
              Resize:
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                resizeComponent(contextMenu.targetId, SIZE_INCREMENT);
              }}
              style={{ padding: "6px 12px", cursor: "pointer", fontSize: 13 }}
            >
              Increase Size (Shift++)
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                resizeComponent(contextMenu.targetId, -SIZE_INCREMENT);
              }}
              style={{ padding: "6px 12px", cursor: "pointer", fontSize: 13 }}
            >
              Decrease Size (Shift+-)
            </div>
          </>
        ) : hasSelectedItems ? (
          <>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)", fontSize: 13 }}>
              Selection ({selectedTraces.size + selectedComponents.size} items)
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                deleteSelected();
              }}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, color: "#ef4444" }}
            >
              Delete Selected
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13 }}
            >
              Clear Selection
            </div>
          </>
        ) : null}
      </div>
    );
  }, [contextMenu, selectedTraces.size, selectedComponents.size, deleteTrace, deleteContextTarget, resizeComponent, deleteSelected, clearSelection]);

  // Event listeners
  
  useEffect(() => {
  const loadAllPins = async () => {
    const pinsMap = {};
    
    for (const component of placed) {
      try {
        const pins = await getComponentPins(component.type, component.width, component.height);
        pinsMap[component.id] = pins;
      } catch (error) {
        console.warn(`Failed to load pins for ${component.type}:`, error);
        pinsMap[component.id] = [];
      }
    }
    
    setComponentPins(pinsMap);
  };
  
  loadAllPins();
}, [placed]);


  useEffect(() => {
    const handler = (e) => setSelectedColor(e?.detail || "#00e676");
    window.addEventListener("trace-color-changed", handler);
    return () => window.removeEventListener("trace-color-changed", handler);
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.floor(r.width), h: Math.floor(r.height) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const autoSave = () => {
      const stateToSave = {
        placed,
        traces,
        offset,
        scale,
        timestamp: Date.now()
      };
      
      const saved = saveToStorage(STORAGE_KEYS.CANVAS_STATE, stateToSave);
      if (saved) {
        setLastSaveTime(Date.now());
        saveToStorage(STORAGE_KEYS.LAST_SAVED, Date.now());
      }
    };

    // Save immediately on first load if we have data
    if ((placed.length > 0 || traces.length > 0) && lastSaveTime === null) {
      autoSave();
    }

    // Set up interval for auto-saving
    const intervalId = setInterval(autoSave, autoSaveInterval * 1000);

    return () => clearInterval(intervalId);
  }, [placed, traces, offset, scale, autoSaveEnabled, autoSaveInterval, lastSaveTime]);

  // Load saved state on component mount
  useEffect(() => {
    const savedState = loadFromStorage(STORAGE_KEYS.CANVAS_STATE);
    const lastSaved = loadFromStorage(STORAGE_KEYS.LAST_SAVED);
    
    if (savedState) {
      setPlaced(savedState.placed || []);
      setTraces(savedState.traces || []);
      setOffset(savedState.offset || { x: 0, y: 0 });
      setScale(savedState.scale || 1);
      setLastSaveTime(lastSaved);
    }
  }, []);

  // Listen for save trigger from Header
  useEffect(() => {
    const handleSaveTrigger = () => {
      manualSave();
    };
    
    window.addEventListener("trigger-save", handleSaveTrigger);
    return () => window.removeEventListener("trigger-save", handleSaveTrigger);
  }, [manualSave]);

  // Fix for Space key panning
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space bar for temporary panning - should work in any tool except PAN
      if (e.code === "Space" && activeTool !== TOOLS.PAN) {
        e.preventDefault();
        setIsPanning(true);
        setContextMenu((c) => (c.visible ? { ...c, visible: false } : c));
        
        // Set the cursor to grab immediately
        document.body.style.cursor = "grab";
      } else if (e.code === "Escape") {
        setContextMenu((c) => (c.visible ? { ...c, visible: false } : c));
        setShowSettingsModal(false);
        if (isDrawing) {
          setActiveTrace(null);
          setIsDrawing(false);
        }
        if (isSelecting) {
          setIsSelecting(false);
          setSelectionStart(null);
          setSelectionEnd(null);
        }
        if (smartDrawStart) {
          setSmartDrawStart(null);
          setSmartDrawEnd(null);
        }
        clearSelection();
        setResizingId(null);
      } else if (e.code === "Delete" || e.code === "Backspace") {
        if (selectedTraces.size > 0 || selectedComponents.size > 0) {
          e.preventDefault();
          deleteSelected();
        }
      } else if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        setSelectedTraces(new Set(traces.map(t => t.id)));
        setSelectedComponents(new Set(placed.map(c => c.id)));
      } else if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey && e.key === "y") || (e.ctrlKey && e.shiftKey && e.key === "Z")) {
        e.preventDefault();
        redo();
      } else if (contextMenu.targetId && e.shiftKey) {
        if (e.key === "+") {
          e.preventDefault();
          resizeComponent(contextMenu.targetId, SIZE_INCREMENT);
        } else if (e.key === "-") {
          e.preventDefault();
          resizeComponent(contextMenu.targetId, -SIZE_INCREMENT);
        }
      } else if ((e.ctrlKey && e.key === "s") || (e.metaKey && e.key === "s")) {
        e.preventDefault();
        manualSave();
      }
      
      // Tool shortcuts
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        switch(e.key.toLowerCase()) {
          case 'p':
            setActiveTool(TOOLS.PAN);
            break;
          case 'v':
            setActiveTool(TOOLS.POINTER);
            break;
          case 's':
            setActiveTool(TOOLS.SELECT);
            break;
          case 'd':
            setActiveTool(TOOLS.DRAW);
            break;
          case 'w':
            setActiveTool(TOOLS.SMART_DRAW);
            break;
          default:
            // Do nothing for other keys
            break;
        }
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.code === "Space" && activeTool !== TOOLS.PAN) {
        setIsPanning(false);
        setPanStart(null);
        
        // Reset the cursor to the appropriate tool cursor
        document.body.style.cursor = getCursor();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isDrawing, contextMenu.targetId, selectedTraces, selectedComponents, traces, placed, isSelecting, activeTool, smartDrawStart, deleteSelected, undo, redo, manualSave, getCursor, clearSelection, resizeComponent]);

  useEffect(() => {
    const handleDocMouseDown = (e) => {
      if (!contextMenu.visible) return;
      if (contextMenuRef.current?.contains(e.target)) return;
      setContextMenu((c) => ({ ...c, visible: false }));
    };
    window.addEventListener("mousedown", handleDocMouseDown);
    return () => window.removeEventListener("mousedown", handleDocMouseDown);
  }, [contextMenu.visible]);

  useEffect(() => {
    if (isSelecting) {
      updateSelection();
    }
  }, [selectionEnd, isSelecting, updateSelection]);

  // Infinite canvas dimensions
  const worldW = Math.max(size.w * 5, VIRTUAL_WORLD_MIN);
  const worldH = Math.max(size.h * 5, VIRTUAL_WORLD_MIN);

  // Styles
  const sectionGridStyle = {
  backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.12) ${DOT_RADIUS}px, transparent ${DOT_RADIUS + 0.5}px)`,
  backgroundSize: `${GRID_SIZE * 2 / scale}px ${GRID_SIZE * 2 / scale}px`, // Scale inversely with zoom
  backgroundPosition: `${offset.x}px ${offset.y}px`,
  backgroundRepeat: "repeat",
  backgroundColor: isDrawing ? 'rgba(0,0,0,0.02)' : 'transparent',
  transition: 'background 0.2s ease'
};
  const worldStyle = {
    position: "absolute",
    left: `${offset.x}px`,
    top: `${offset.y}px`,
    width: `${worldW}px`,
    height: `${worldH}px`,
    transform: `scale(${scale})`,
    transformOrigin: "0 0"
  };

 return (
  <section
    className="canvas"
    ref={hostRef}
    onDragOver={onDragOver}
    onDrop={onDrop}
    onWheel={onWheel}
    onMouseDown={onSectionMouseDown}
    onContextMenu={onSectionContextMenu}
    onMouseMove={onMouseMove}
    onMouseUp={onMouseUp}
    style={{
      position: "relative",
      overflow: "hidden",
      ...sectionGridStyle,
      cursor: getCursor(),
      width: "100%",
      height: "100%"
    }}
  >
    <CustomCursor activeTool={activeTool} smartDrawStart={smartDrawStart} />
  
    <div style={worldStyle}>
      {/* LAYER 1: Components (lowest z-index) */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {placed.map(renderComponent)}
      </div>
      
      {/* LAYER 2: Pin highlights and labels (middle z-index) */}
      <div style={{ position: "relative", zIndex: 2 }}>
       {showPins && placed.map(component => {
  const pins = componentPins[component.id] || [];
  return pins.map((pin, index) => {
    const isHovered = hoveredPin?.component?.id === component.id && 
                     hoveredPin?.pin?.id === pin.id;
    const isNearest = nearestPin?.component?.id === component.id && 
                     nearestPin?.pin?.id === pin.id;
    
    return (
      <React.Fragment key={`${component.id}-${pin.id}-${index}`}>
        <PinHighlight
          pin={pin}
          component={component}
          isHovered={isHovered || isNearest}
          scale={scale}
          offset={offset}
        />
        <PinLabel
  pin={pin}
  component={component}
  isHovered={isHovered}
  isNearby={isNearest && nearestPin?.distance < 30 && !isHovered} // Added !isHovered
  scale={scale}
  offset={offset}
/>
      </React.Fragment>
    );
  });
})}
      </div>
      
      {/* LAYER 3: Traces (highest z-index - drawn on top) */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          zIndex: 5, // ← INCREASED Z-INDEX to draw traces on top
          pointerEvents: 'none', // ← Allow mouse events to pass through to components
          overflow: 'visible'
        }}
      >
        {traces.map((trace) => (
          <Trace 
            key={trace.id} 
            trace={trace} 
            isSelected={selectedTraces.has(trace.id)}
            gridToWorld={gridToWorld}
            width={traceWidth}
            selectedWidth={selectedTraceWidth}
            componentPins={componentPins}
            placed={placed}
          />
        ))}

        {isDrawing && activeTrace && (
          <Trace 
            key={activeTrace.id}
            trace={activeTrace}
            isSelected={selectedTraces.has(activeTrace.id)}
            gridToWorld={gridToWorld}
            isActive={true}
            width={traceWidth}
            selectedWidth={selectedTraceWidth}
            isSmartDraw={activeTrace.isSmartDraw}
            componentPins={componentPins}
            placed={placed}
          />
        )}
      </svg>
      
      {/* LAYER 4: Pin snapping feedback (top layer) */}
      {nearestPin && (activeTool === TOOLS.DRAW || activeTool === TOOLS.SMART_DRAW) && (
        <div
          style={{
            position: "absolute",
            left: `${nearestPin.worldX}px`,
            top: `${nearestPin.worldY}px`,
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "3px solid #00ff00",
            backgroundColor: "rgba(0, 255, 0, 0.15)",
            pointerEvents: "none",
            zIndex: 10, // ← Highest z-index for snapping feedback
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 20px rgba(0, 255, 0, 0.6)",
            animation: "pulse 1.5s ease-in-out infinite"
          }}
        >
          {/* Inner dot to show exact snap point */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#00ff00",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 10px rgba(0, 255, 0, 0.8)"
            }}
          />
        </div>
      )}
    </div>

    <SelectionBox 
      isSelecting={isSelecting} 
      selectionStart={selectionStart} 
      selectionEnd={selectionEnd} 
    />
      
      <Toolbar 
        activeTool={activeTool} 
        setActiveTool={setActiveTool} 
        smartDrawStart={smartDrawStart} 
        setSmartDrawStart={setSmartDrawStart} 
        exportCanvas={handleOpenExport} 
      />
      
      <SettingsButton onClick={() => setShowSettingsModal(true)} />
      
      {renderContextMenu()}
      
      <UndoRedoButtons 
        undo={undo} 
        redo={redo} 
        historyIndex={historyIndex} 
        history={history} 
      />
      
      <StatusIndicators 
        activeTool={activeTool}
        selectedTraces={selectedTraces}
        selectedComponents={selectedComponents}
        lastSaveTime={lastSaveTime}
        autoSaveEnabled={autoSaveEnabled}
        autoSaveInterval={autoSaveInterval}
      />
      
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        traces={traces}
        placed={placed}
        onExport={handleExport}
      />
      
      <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          autoSaveEnabled={autoSaveEnabled}
          setAutoSaveEnabled={setAutoSaveEnabled}
          autoSaveInterval={autoSaveInterval}
          setAutoSaveInterval={setAutoSaveInterval}
          manualSave={manualSave}
         clearAllData={clearAllData}
          lastSaveTime={lastSaveTime}
          traceWidth={traceWidth}
          setTraceWidth={setTraceWidth}
          selectedTraceWidth={selectedTraceWidth}
          setSelectedTraceWidth={setSelectedTraceWidth}
  // ADD THESE NEW PROPS:
      showPins={showPins}
      setShowPins={setShowPins}
      showLabels={showLabels}
      setShowLabels={setShowLabels}
/>
<style jsx>{`
  @keyframes mainTorus {
    0% { 
      transform: scale(0.9);
      opacity: 0.7;
      filter: brightness(0.8);
    }
    30% { 
      transform: scale(1.05);
      opacity: 0.9;
      filter: brightness(1.1);
    }
    60% { 
      transform: scale(1.1);
      opacity: 1;
      filter: brightness(1.2);
    }
    100% { 
      transform: scale(0.9);
      opacity: 0.7;
      filter: brightness(0.8);
    }
  }
  
  @keyframes innerTorus {
    0% { 
      transform: translate(-50%, -50%) scale(1.1);
      opacity: 0.8;
    }
    40% { 
      transform: translate(-50%, -50%) scale(0.9);
      opacity: 1;
    }
    80% { 
      transform: translate(-50%, -50%) scale(0.85);
      opacity: 0.9;
    }
    100% { 
      transform: translate(-50%, -50%) scale(1.1);
      opacity: 0.8;
    }
  }
  
  @keyframes centerPulse {
    0% { 
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0.9;
    }
    50% { 
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 1;
    }
    100% { 
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0.9;
    }
  }
  
  @keyframes outerGlow {
    0% { 
      transform: scale(0.8);
      opacity: 0.2;
    }
    50% { 
      transform: scale(1.3);
      opacity: 0.6;
    }
    100% { 
      transform: scale(0.8);
      opacity: 0.2;
    }
  }
  
  @keyframes rotate {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
  
  @keyframes accentDot {
    0%, 100% { 
      opacity: 0.3;
      transform: translateY(-18px) scale(0.8);
    }
    50% { 
      opacity: 1;
      transform: translateY(-18px) scale(1.2);
    }
  }
`}</style>
  </section>
);
}