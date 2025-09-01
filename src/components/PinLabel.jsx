// PinLabel.jsx - UPDATED VERSION
import React from 'react';
import { getPinColor } from '../utils/pinLibrary';
import { viaToCanvasSimple } from '../utils/coordinateTransform';

const PinLabel = ({ pin, component, isHovered = false, isNearby = false, scale = 1, offset = {x: 0, y: 0} }) => {
  if (!isHovered && !isNearby) return null;
  
  // FIXED: Use correct coordinate transformation with original dimensions
  const originalWidth = pin.originalImageWidth || component.originalWidth || component.width;
  const originalHeight = pin.originalImageHeight || component.originalHeight || component.height;
  
  const { x: pinX, y: pinY } = viaToCanvasSimple(
    pin.x, 
    pin.y, 
    component, 
    originalWidth, 
    originalHeight
  );
  
  const labelX = pinX + 15;
  const labelY = pinY - 10;
  
  return (
    <div
      style={{
        position: "absolute",
        left: `${labelX}px`,
        top: `${labelY}px`,
        background: "rgba(0, 0, 0, 0.9)",
        color: "white",
        padding: "6px 10px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "500",
        whiteSpace: "nowrap",
        zIndex: 20,
        pointerEvents: "none",
        border: `2px solid ${getPinColor(pin.type)}`,
        opacity: isHovered ? 1 : 0.8,
        transform: isHovered ? "translateY(-2px) scale(1.05)" : "translateY(0) scale(1)",
        transition: "all 0.15s ease",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)"
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "2px" }}>
        {pin.id}
      </div>
      {pin.description && (
        <div style={{ 
          fontSize: "10px", 
          opacity: 0.9, 
          marginTop: "2px",
          fontStyle: "italic"
        }}>
          {pin.description}
        </div>
      )}
    </div>
  );
};

export default PinLabel;