import { detectPinsFromImage } from '../pinLibrary';

// Helper to extract pin type from name
const getPinTypeFromName = (pinName) => {
  const name = pinName.toLowerCase();
  
  if (name.includes('v') || name.includes('power') || name.includes('vin') || name.includes('5v') || name.includes('3.3v')) return 'power';
  if (name.includes('gnd') || name.includes('ground')) return 'ground';
  if (name.includes('a') || name.includes('analog') || /a[0-9]/.test(name)) return 'analog';
  if (name.includes('sda') || name.includes('scl') || name.includes('i2c') || name.includes('rx') || name.includes('tx')) return 'communication';
  if (/\d/.test(name)) return 'digital';
  
  return 'signal';
};

// Process VIA format - MAKE THIS ASYNC
const processVIAFormat = async (viaData, componentType) => {
  if (!viaData) return null;
  
  // EXTRACT THE MAIN KEY
  const viaKey = Object.keys(viaData)[0];
  const viaEntry = viaData[viaKey];
  
  if (!viaEntry || !viaEntry.regions) return null;
  
  // EXTRACT COMPONENT NAME FROM FILENAME
  let actualComponentType = componentType;
  
  if (viaEntry.filename) {
    actualComponentType = viaEntry.filename
      .replace('.png', '')
      .replace(/_/g, '-')
      .toLowerCase();
  } else if (viaKey.includes('.png')) {
    actualComponentType = viaKey
      .split('.png')[0]
      .replace(/_/g, '-')
      .toLowerCase();
  }
  
  // GET ACTUAL IMAGE DIMENSIONS - USE PROMISE INSTEAD OF AWAIT
  const actualDimensions = await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 1080, height: 1080 }); // fallback
    img.src = `/components/${actualComponentType}.png`;
  });

  const regions = viaEntry.regions;
  const pins = [];
  
  regions.forEach((region, index) => {
    const shape = region.shape_attributes;
    const attributes = region.region_attributes || {};
    
    // EXTRACT PIN NAME - HANDLE BOTH FORMATS
let pinName = 'PIN_' + (index + 1);

if (attributes.pin_names) {
  if (typeof attributes.pin_names === 'string') {
    pinName = attributes.pin_names;
  } else if (typeof attributes.pin_names === 'object') {
    // Handle both { "pin_name": true } and { "pin_name": "value" } formats
    const pinKeys = Object.keys(attributes.pin_names);
    if (pinKeys.length > 0) {
      pinName = pinKeys[0];
      
      // If the value is a string (not boolean), use that instead
      if (typeof attributes.pin_names[pinKeys[0]] === 'string') {
        pinName = attributes.pin_names[pinKeys[0]];
      }
    }
  }
}
    
    // SCALE COORDINATES based on actual image size
    const scaleX = actualDimensions.width / 1080; // Adjust scaling factor
    const scaleY = actualDimensions.height / 1080;
    
    const scaledX = shape.cx * scaleX;
    const scaledY = shape.cy * scaleY;
    
    pins.push({
      id: pinName.toUpperCase().replace(/\s+/g, '_'),
      type: getPinTypeFromName(pinName),
      x: scaledX,
      y: scaledY,
      description: `${pinName} pin`
    });
  });
  
  return {
    id: actualComponentType,
    name: actualComponentType.replace(/-/g, ' ').toUpperCase(),
    image: `/components/${actualComponentType}.png`,
    width: actualDimensions.width,
    height: actualDimensions.height,
    pins: pins
  };
};

export const loadPinDefinition = async (componentType) => {
  try {
    const cleanType = componentType.toLowerCase().replace(/\s+/g, '-');
    
    console.log(`🔄 Loading pins for: "${componentType}" → "${cleanType}.json"`);
    
    try {
      const response = await import(`./${cleanType}.json`);
      const result = await processVIAFormat(response.default, cleanType); // ADD AWAIT HERE
      console.log(`✅ Loaded ${result.pins.length} pins for: ${result.id}`);
      return result;
    } catch (error) {
      console.log(`❌ No pin definition found for "${cleanType}.json"`);
      return null;
    }
  } catch (error) {
    console.log(`⚠️ No pin definition for ${componentType}, using fallback`);
    return null;
  }
};

export const getComponentPins = async (componentType, width, height) => {
  try {
    const definition = await loadPinDefinition(componentType);
    
    if (definition && definition.pins) {
      return definition.pins;
    }
  } catch (error) {
    console.warn(`Error loading pins for ${componentType}:`, error);
  }
  
  return detectPinsFromImage(componentType, width, height);
};

// Helper to convert VIA format to our format
export const convertVIAtoOurFormat = (viaData, componentName, imagePath, width, height) => {
  const viaKey = Object.keys(viaData)[0];
  const regions = viaData[viaKey]?.regions || [];
  
  const pins = regions.map((region, index) => {
    const attributes = region.region_attributes?.pin_names || {};
    const pinName = Object.keys(attributes)[0] || `PIN_${index + 1}`;
    
    return {
      id: pinName.toUpperCase().replace(/\s+/g, '_'),
      type: getPinTypeFromName(pinName),
      x: region.shape_attributes.cx,
      y: region.shape_attributes.cy,
      description: `${pinName} pin`
    };
  });
  
  return {
    id: componentName.toLowerCase().replace(/\s+/g, '-'),
    name: componentName,
    image: imagePath,
    width: width,
    height: height,
    pins: pins
  };
};