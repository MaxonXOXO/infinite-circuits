// src/utils/coordinateTransform.js

// VIA: (0,0) at top-left of image
// Your Canvas: (0,0) at center of component + CSS transforms

export const viaToCanvasCoordinates = (viaX, viaY, component, scale = 1, offset = {x: 0, y: 0}) => {
  // VIA coordinates are relative to the original image's top-left
  // Your canvas uses component center as origin with world coordinates
  
  // Step 1: Convert VIA coordinates to component-relative coordinates
  const componentRelativeX = viaX - component.width / 2;
  const componentRelativeY = viaY - component.height / 2;
  
  // Step 2: Apply canvas transformations (scale and offset)
  const worldX = (componentRelativeX * scale) + offset.x;
  const worldY = (componentRelativeY * scale) + offset.y;
  
  // Step 3: Add component's world position
  const finalX = component.x + worldX;
  const finalY = component.y + worldY;
  
  return {
    x: finalX,
    y: finalY
  };
};

/**
 * Transforms pin coordinates (VIA coords, relative to image top-left) 
 * into World Coordinates, applying component rotation.
 * * FIX: Swapped the 90 and 270 degree rotation formulas to correct 
 * the observed inversion/mirroring when matching the CSS rotation.
 */
export const viaToCanvasSimple = (viaX, viaY, component) => {
  const rotation = component.rotation || 0;
  
  // Component center in world coordinates (pivot point)
  const centerX = component.x;
  const centerY = component.y;
  
  // 1. Determine the Original UNROTATED Dimensions (W_orig, H_orig).
  // This is crucial for establishing the pin's center offset correctly.
  let W_orig = component.width;
  let H_orig = component.height;
  
  if (rotation === 90 || rotation === 270) {
    // Swap dimensions back to get the ORIGINAL (unrotated) dimensions.
    W_orig = component.height;
    H_orig = component.width;
  }
  
  let finalCenteredX = 0;
  let finalCenteredY = 0;
  
  // Center Offsets:
  const pinCenteredX = viaX - (W_orig / 2);
  const pinCenteredY = viaY - (H_orig / 2);

  // 2. Apply Direct Axis Mapping (Rotation around Center)
  switch (rotation) {
    case 90:
      // SWAP APPLIED: Using the 90-degree Counter-Clockwise (CCW) formula
      // Rotates (x, y) to (-y, x)
      finalCenteredX = -pinCenteredY;
      finalCenteredY = pinCenteredX;
      break;
    case 180:
      // Rotates (x, y) to (-x, -y)
      finalCenteredX = -pinCenteredX;
      finalCenteredY = -pinCenteredY;
      break;
    case 270:
      // SWAP APPLIED: Using the 90-degree Clockwise (CW) formula
      // Rotates (x, y) to (y, -x)
      finalCenteredX = pinCenteredY;
      finalCenteredY = -pinCenteredX;
      break;
    case 0:
    default:
      finalCenteredX = pinCenteredX;
      finalCenteredY = pinCenteredY;
      break;
  }
  
  // 3. Translate the rotated point back to World Coordinates
  const worldX = centerX + finalCenteredX;
  const worldY = centerY + finalCenteredY;
  
  return { x: worldX, y: worldY };
};

