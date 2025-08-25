// src/utils/canvasUtils.js
export const GRID_SIZE = 10;

// Coordinate conversion functions
export const worldToGrid = (wx, wy) => ({
  gx: Math.round(wx / GRID_SIZE),
  gy: Math.round(wy / GRID_SIZE)
});

// FIXED: Return coordinates directly instead of an object
export const gridToWorld = (gx, gy) => ({
  x: gx * GRID_SIZE,
  y: gy * GRID_SIZE
});

export const snapWorld = (v) => Math.round(v / GRID_SIZE) * GRID_SIZE;

// Helper function to check if a point is inside a rectangle
export const pointInRect = (px, py, rx, ry, rw, rh) => {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
};

// Generate unique ID
export const uid = () => Math.random().toString(36).slice(2, 9);