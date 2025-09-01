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

// Alternative: Simple offset approach (try this first)
export const viaToCanvasSimple = (viaX, viaY, component) => {
  // Direct conversion: VIA coordinates are already image-relative
  // Just position them relative to component's top-left
  return {
    x: component.x - component.width / 2 + viaX,
    y: component.y - component.height / 2 + viaY
  };
};

// Debug function
export const debugCoordinateConversion = (viaX, viaY, component, scale, offset) => {
  const simple = viaToCanvasSimple(viaX, viaY, component);
  const transformed = viaToCanvasCoordinates(viaX, viaY, component, scale, offset);
  
  console.log('=== COORDINATE DEBUG ===');
  console.log('VIA coordinates:', viaX, viaY);
  console.log('Component center:', component.x, component.y);
  console.log('Component size:', component.width, 'x', component.height);
  console.log('Simple conversion:', simple.x, simple.y);
  console.log('Transformed conversion:', transformed.x, transformed.y);
  
  return transformed;
};