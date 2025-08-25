// src/components/Trace.jsx
import React from "react";

// src/components/Trace.jsx
const Trace = ({ 
  trace, 
  isActive = false, 
  isSelected = false, 
  isSmartDraw = false, 
  gridToWorld,
  width = 12,
  selectedWidth = 14
}) => {
  
  // Convert grid points to world coordinates using the gridToWorld function
  const points = trace.points.map(pt => {
    const worldPoint = gridToWorld(pt.gx, pt.gy);  // ← Pass gx and gy separately
    return { x: worldPoint.x, y: worldPoint.y };
  });

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
      {isSmartDraw && points.map((pt, index) => (
        <g key={index}>
          <circle
            cx={pt.x}
            cy={pt.y}
            r={index === 0 || index === points.length - 1 ? "8" : "4"}
            fill={isSelected ? "#60a5fa" : trace.color}
            opacity={isSelected ? 0.8 : 1}
          />
          {(index === 0 || index === points.length - 1) && (
            <circle
              cx={pt.x}
              cy={pt.y}
              r="4"
              fill="white"
            />
          )}
        </g>
      ))}
      
      {/* Standard markers for regular traces */}
      {!isSmartDraw && points.length > 0 && (
        <g>
          <circle
            cx={points[0].x}
            cy={points[0].y}
            r="8"
            fill={isSelected ? "#60a5fa" : trace.color}
            opacity={isSelected ? 0.8 : 1}
          />
          <circle
            cx={points[0].x}
            cy={points[0].y}
            r="4"
            fill="white"
          />
        </g>
      )}
      
      {!isSmartDraw && points.length > 1 && 
       (points[0].x !== points[points.length - 1].x || 
        points[0].y !== points[points.length - 1].y) && (
        <g>
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="8"
            fill={isSelected ? "#60a5fa" : trace.color}
            opacity={isSelected ? 0.8 : 1}
          />
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="4"
            fill="white"
          />
        </g>
      )}
    </g>
  );
};

export default Trace;