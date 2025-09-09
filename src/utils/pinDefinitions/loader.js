// loader.js - REWRITTEN
import { detectPinsFromImage } from '../pinLibrary';

// Helper to extract pin type from name
const getPinTypeFromName = (pinName) => {
  const name = pinName.toLowerCase();
  
  if (name.includes('v') || name.includes('power') || name.includes('vin') || name.includes('5v') || name.includes('3.3v')) return 'power';
  if (name.includes('gnd') || name.includes('ground')) return 'ground';
  if (name.includes('a') || name.includes('analog') || /a[0-9]/.test(name)) return 'analog';
  if (name.includes('sda') || name.includes('scl') || name.includes('i2c') || name.includes('rx') || name.includes('tx')) return 'communication';
  if (/\d/.test(name) || name === 'data') return 'digital'; // Added 'data' to digital
  
  return 'signal';
};

// Process VIA format
const processVIAFormat = async (viaData) => {
  if (!viaData) return null;

  // Find the primary entry, which is the key that contains ".png"
  const mainKey = Object.keys(viaData).find(key => key.includes('.png'));
  if (!mainKey) return null;
  
  const viaEntry = viaData[mainKey];
  if (!viaEntry || !viaEntry.regions) return null;
  
  const componentType = mainKey.split('.png')[0].replace(/_/g, '-').toLowerCase();

  const actualDimensions = await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 1080, height: 1080 });
    img.src = `/components/${componentType}.png`;
  });

  const regions = viaEntry.regions;
  const pins = [];
  
  regions.forEach((region) => {
    const shape = region.shape_attributes;
    const attributes = region.region_attributes || {};
    
    // Check for "rect" shape and skip it, as it's not a pin
    if (shape.name === 'rect') {
      return;
    }

    // Use a simple, robust method to get the pin name
    let pinName = 'unknown';
    if (attributes.pin_names) {
      if (typeof attributes.pin_names === 'string') {
        pinName = attributes.pin_names;
      } else if (typeof attributes.pin_names === 'object' && Object.keys(attributes.pin_names).length > 0) {
        pinName = Object.keys(attributes.pin_names)[0];
      }
    }
    
    // Scale coordinates based on the actual image size
    const scaleX = actualDimensions.width / 1080;
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
    id: componentType,
    name: componentType.replace(/-/g, ' ').toUpperCase(),
    image: `/components/${componentType}.png`,
    width: actualDimensions.width,
    height: actualDimensions.height,
    pins: pins
  };
};

export const loadPinDefinition = async (componentType) => {
  const cleanType = componentType.toLowerCase().replace(/\s+/g, '-');
  
  console.log(`🔄 Loading pins for: "${componentType}" → "${cleanType}.json"`);
  
  try {
    const response = await import(`./${cleanType}.json`);
    const result = await processVIAFormat(response.default);
    console.log(`✅ Loaded ${result.pins.length} pins for: ${result.id}`);
    return result;
  } catch (error) {
    console.log(`❌ No pin definition found for "${cleanType}.json" or an error occurred:`, error);
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

// ... (remove the old convertVIAtoOurFormat function as it's redundant)