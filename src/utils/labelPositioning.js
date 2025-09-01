export const getLabelPosition = (pinX, pinY, index, totalPins) => {
  // Simple positioning logic - you can enhance this later
  const positions = [
    { x: 15, y: -10 },  // Right side
    { x: -15, y: -10 }, // Left side  
    { x: 0, y: -20 },   // Top
    { x: 0, y: 15 }     // Bottom
  ];
  
  const position = positions[index % positions.length];
  return {
    x: pinX + position.x,
    y: pinY + position.y
  };
};