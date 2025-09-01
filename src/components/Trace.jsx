// src/components/Trace.jsx - ENHANCED VERSION
import React from "react";

const Trace = ({ 
  trace, 
  isActive = false, 
  isSelected = false, 
  isSmartDraw = false, 
  gridToWorld,
  width = 12,
  selectedWidth = 14,
  componentPins = {},
  placed = []
}) => {
  
  // Convert grid points to world coordinates using the gridToWorld function
  const points = trace.points.map(pt => {
    const worldPoint = gridToWorld(pt.gx, pt.gy);
    return { x: worldPoint.x, y: worldPoint.y };
  });

  // Function to check if a point is near a pin
  const isPointNearPin = (point) => {
    for (const component of placed) {
      const pins = componentPins[component.id] || [];
      for (const pin of pins) {
        // Calculate pin world position
        const scaleX = component.width / 1080;
        const scaleY = component.height / 1080;
        const scaledPinX = pin.x * scaleX;
        const scaledPinY = pin.y * scaleY;
        const pinWorldX = component.x + (scaledPinX - component.width / 2);
        const pinWorldY = component.y + (scaledPinY - component.height / 2);
        
        // Check distance
        const distance = Math.sqrt(
          Math.pow(point.x - pinWorldX, 2) + 
          Math.pow(point.y - pinWorldY, 2)
        );
        
        if (distance < 15) { // Within snapping distance
          return { isNearPin: true, pin, component };
        }
      }
    }
    return { isNearPin: false };
  };

  return (
    <g>
      {/* Main trace line */}
      <polyline
        points={points.map(pt => `${pt.x},${pt.y}`).join(" ")}
        fill="none"
        stroke={isSelected ? "#60a5fa" : trace.color}
        strokeWidth={isActive ? 2 : (isSelected ? selectedWidth : width)}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isSelected ? 0.8 : 1}
        strokeDasharray={isSmartDraw ? "5,3" : "none"}
      />
      
      {/* Show markers at all points for smart draw traces */}
      {isSmartDraw && points.map((pt, index) => {
        const { isNearPin } = isPointNearPin(pt);
        const isEndpoint = index === 0 || index === points.length - 1;
        
        return (
          <g key={index}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={isEndpoint ? "8" : "4"}
              fill={isSelected ? "#60a5fa" : trace.color}
              opacity={isSelected ? 0.8 : 1}
              stroke={isNearPin ? "#00ff00" : "none"}
              strokeWidth={isNearPin ? "2" : "0"}
            />
            {isEndpoint && (
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill={isNearPin ? "#00ff00" : "white"}
              />
            )}
            {/* Pin connection indicator */}
            {isNearPin && (
              <circle
                cx={pt.x}
                cy={pt.y}
                r="12"
                fill="none"
                stroke="#00ff00"
                strokeWidth="2"
                opacity="0.6"
                
              />
            )}
          </g>
        );
      })}
      
      {/* Enhanced markers for regular traces */}
      {!isSmartDraw && points.length > 0 && (
        <g>
          {points.map((pt, index) => {
            const { isNearPin } = isPointNearPin(pt);
            const isEndpoint = index === 0 || index === points.length - 1;
            
            if (!isEndpoint) return null;
            
            return (
              <g key={`endpoint-${index}`}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="8"
                  fill={isSelected ? "#60a5fa" : trace.color}
                  opacity={isSelected ? 0.8 : 1}
                     stroke={isSelected ? "#60a5fa" : trace.color} // 👈 dynamic color
                  strokeWidth={isNearPin ? "2" : "0"}
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  fill={isNearPin ? "#ffffffff" : "white"}
                />
                {/* Pin connection indicator */}
                {isNearPin && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="12"
                    fill="none"
                       stroke={isSelected ? "#60a5fa" : trace.color} // 👈 dynamic color
                    strokeWidth="2"
                    opacity="0.6"
                     
                  />
                )}
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
};

export default Trace;