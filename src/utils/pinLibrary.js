export const PIN_TYPES = {
  POWER: 'power',
  GROUND: 'ground', 
  DIGITAL: 'digital',
  ANALOG: 'analog',
  SIGNAL: 'signal',
  COMMUNICATION: 'communication'
};

export const PIN_COLORS = {
  [PIN_TYPES.POWER]: '#ff4444',
  [PIN_TYPES.GROUND]: '#00d32eff',
  [PIN_TYPES.DIGITAL]: '#0099ffff',
  [PIN_TYPES.ANALOG]: '#fcff44ff',
  [PIN_TYPES.SIGNAL]: '#ba44ffff',
  [PIN_TYPES.COMMUNICATION]: '#44ffff'
};

export const getPinColor = (pinType) => {
  return PIN_COLORS[pinType] || '#cccccc';
};

// Enhanced pin detection with better fallbacks
export const detectPinsFromImage = (componentType, width, height) => {
  const componentLower = componentType.toLowerCase();
  
  // Arduino-like pattern (pins on both sides)
  if (componentLower.includes('arduino') || componentLower.includes('uno') || componentLower.includes('nano')) {
    return generateArduinoStylePins(width, height);
  }
  
  // Sensor pattern (multiple pins)
  if (componentLower.includes('sensor') || componentLower.includes('module')) {
    return generateSensorPins(width, height);
  }
  
  // Default: 2-pin components (LEDs, resistors, etc.)
  return [
    {
      id: 'PIN1',
      type: PIN_TYPES.SIGNAL,
      x: width * 0.25,
      y: height / 2,
      description: 'Pin 1'
    },
    {
      id: 'PIN2',
      type: PIN_TYPES.SIGNAL,
      x: width * 0.75, 
      y: height / 2,
      description: 'Pin 2'
    }
  ];
};

const generateArduinoStylePins = (width, height) => {
  const pins = [];
  const pinCount = 14; // Typical for Arduino
  const pinSpacing = height / (pinCount + 1);
  
  // Left side pins
  for (let i = 0; i < pinCount; i++) {
    pins.push({
      id: `L${i + 1}`,
      type: i < 2 ? PIN_TYPES.POWER : (i < 4 ? PIN_TYPES.GROUND : PIN_TYPES.DIGITAL),
      x: width * 0.1,
      y: pinSpacing * (i + 1),
      description: `Left Pin ${i + 1}`
    });
  }
  
  // Right side pins
  for (let i = 0; i < pinCount; i++) {
    pins.push({
      id: `R${i + 1}`,
      type: PIN_TYPES.DIGITAL,
      x: width * 0.9,
      y: pinSpacing * (i + 1),
      description: `Right Pin ${i + 1}`
    });
  }
  
  return pins;
};

const generateSensorPins = (width, height) => {
  const pins = [];
  const pinCount = 4; // Typical for sensors
  const pinSpacing = height / (pinCount + 1);
  
  for (let i = 0; i < pinCount; i++) {
    pins.push({
      id: `P${i + 1}`,
      type: i === 0 ? PIN_TYPES.POWER : (i === 1 ? PIN_TYPES.GROUND : PIN_TYPES.SIGNAL),
      x: width / 2,
      y: pinSpacing * (i + 1),
      description: `Pin ${i + 1}`
    });
  }
  
  return pins;
};