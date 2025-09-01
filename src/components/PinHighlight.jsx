// PinHighlight.jsx - CORRECTED VERSION
import React from 'react';
import { getPinColor } from '../utils/pinLibrary';
import { viaToCanvasSimple } from '../utils/coordinateTransform';

const PinHighlight = ({ pin, component, isHovered = false, scale = 1, offset = {x: 0, y: 0} }) => {
  if (!isHovered) return null;
  
  // Use correct coordinate transformation
  const originalWidth = pin.originalImageWidth || component.originalWidth || component.width;
  const originalHeight = pin.originalImageHeight || component.originalHeight || component.height;
  
  const { x: pinX, y: pinY } = viaToCanvasSimple(
    pin.x, 
    pin.y, 
    component, 
    originalWidth, 
    originalHeight
  );
  
  const highlightSize = 20;
  
  return (
    <div
      style={{
        position: "absolute",
        left: `${pinX}px`,
        top: `${pinY}px`,
        width: `${highlightSize}px`,
        height: `${highlightSize}px`,
        borderRadius: "50%",
        background: getPinColor(pin.type),
        opacity: 0.7,
        transform: "translate(-50%, -50%)",
        zIndex: 15,
        pointerEvents: "none",
        boxShadow: `0 0 0 2px white, 0 0 10px 4px ${getPinColor(pin.type)}`,
        animation: "pulse 1.5s infinite"
      }}
    />
  );
};

export default PinHighlight;