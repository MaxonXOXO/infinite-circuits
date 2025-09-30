// loader.js - DEBUG VERSION
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

const processVIAFormat = async (viaData) => {
  console.log('🔍 [processVIAFormat] STARTED');
  console.log('📨 [processVIAFormat] VIA DATA RECEIVED:', viaData);
  
  if (!viaData) {
    console.log('❌ [processVIAFormat] VIA DATA IS NULL/UNDEFINED');
    return null;
  }

  // FIX: Better key detection that handles both formats
  console.log('🔑 [processVIAFormat] All keys in viaData:', Object.keys(viaData));
  
  const mainKey = Object.keys(viaData).find(key => 
    key.includes('.png') || (viaData.filename && key.includes(viaData.filename))
  );
  
  console.log('🎯 [processVIAFormat] Selected mainKey:', mainKey);
  
  if (!mainKey) {
    console.log('❌ [processVIAFormat] No mainKey found containing .png');
    return null;
  }
  
  // FIX: Get the actual entry regardless of key structure
  const viaEntry = viaData[mainKey];
  console.log('📄 [processVIAFormat] viaEntry:', viaEntry);
  
  if (!viaEntry) {
    console.log('❌ [processVIAFormat] No viaEntry found for mainKey');
    return null;
  }
  
  if (!viaEntry.regions) {
    console.log('❌ [processVIAFormat] No regions found in viaEntry');
    return null;
  }
  
  // FIX: Use filename from the entry if available, otherwise use key
  const fileName = viaEntry.filename || mainKey.split('.png')[0];
  console.log('📝 [processVIAFormat] Original fileName:', fileName);
  
  let componentType = fileName
    .replace(/_/g, '-')
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();

  console.log(`📝 [processVIAFormat] Processing component: ${componentType}`);
  console.log(`📝 [processVIAFormat] Regions count: ${viaEntry.regions.length}`);

  const actualDimensions = await new Promise((resolve) => {
    const img = new Image();
    const imagePath = `/components/${componentType}.png`;
    console.log(`🖼️ [processVIAFormat] Loading image from: ${imagePath}`);
    
    img.onload = () => {
      console.log(`✅ [processVIAFormat] Image loaded successfully: ${img.width}x${img.height}`);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      console.warn(`❌ [processVIAFormat] Failed to load image for ${componentType}, using defaults`);
      resolve({ width: 1080, height: 1080 });
    };
    img.src = imagePath;
  });

  const regions = viaEntry.regions;
  const pins = [];
  
  console.log(`📍 [processVIAFormat] Processing ${regions.length} regions...`);
  
  regions.forEach((region, index) => {
    console.log(`📍 [processVIAFormat] Region ${index + 1}:`, region);
    
    const shape = region.shape_attributes;
    const attributes = region.region_attributes || {};
    
    if (shape.name === 'rect') {
      console.log(`⏩ [processVIAFormat] Skipping rectangle shape`);
      return; // Skip rectangles
    }

    let pinName = 'unknown';
    if (attributes.pin_names) {
      if (typeof attributes.pin_names === 'string') {
        pinName = attributes.pin_names;
      } else if (typeof attributes.pin_names === 'object' && Object.keys(attributes.pin_names).length > 0) {
        pinName = Object.keys(attributes.pin_names)[0];
      }
    }
    
    console.log(`🏷️ [processVIAFormat] Pin name extracted: ${pinName}`);
    
    const scaleX = actualDimensions.width / 1080;
    const scaleY = actualDimensions.height / 1080;
    
    const scaledX = shape.cx * scaleX;
    const scaledY = shape.cy * scaleY;
    
    const pinType = getPinTypeFromName(pinName);
    
    console.log(`📐 [processVIAFormat] Pin coordinates: ${shape.cx},${shape.cy} -> ${scaledX},${scaledY}`);
    console.log(`🎨 [processVIAFormat] Pin type: ${pinType}`);
    
    pins.push({
      id: pinName.toUpperCase().replace(/\s+/g, '_'),
      type: pinType,
      x: scaledX,
      y: scaledY,
      description: `${pinName} pin`
    });
  });
  
  console.log(`✅ [processVIAFormat] Successfully processed ${pins.length} pins`);
  console.log('📍 [processVIAFormat] Final pins array:', pins);
  
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
  
  console.log(`🔄 [loadPinDefinition] STEP 1: Loading pins for: "${componentType}" → "${cleanType}.json"`);
  
  try {
    console.log(`📁 [loadPinDefinition] STEP 2: Attempting to import ./${cleanType}.json`);
    const response = await import(`./${cleanType}.json`);
    
    console.log('✅ [loadPinDefinition] STEP 3: JSON import successful!');
    console.log('📦 [loadPinDefinition] RAW RESPONSE:', response);
    console.log('📦 [loadPinDefinition] RESPONSE DEFAULT:', response.default);
    console.log('🔑 [loadPinDefinition] ALL KEYS IN RESPONSE:', Object.keys(response));
    
    if (response.default) {
      console.log('🔑 [loadPinDefinition] KEYS IN RESPONSE.DEFAULT:', Object.keys(response.default));
      console.log('📊 [loadPinDefinition] RESPONSE.DEFAULT CONTENT:', response.default);
    } else {
      console.log('❌ [loadPinDefinition] response.default is undefined!');
    }
    
    console.log('🔄 [loadPinDefinition] STEP 4: Calling processVIAFormat...');
    const result = await processVIAFormat(response.default);
    
    if (result) {
      console.log(`✅ [loadPinDefinition] STEP 5: SUCCESS! Loaded ${result.pins.length} pins for: ${result.id}`);
      console.log('📍 [loadPinDefinition] PINS:', result.pins);
    } else {
      console.log('❌ [loadPinDefinition] STEP 5: processVIAFormat returned NULL');
    }
    
    return result;
  } catch (error) {
    console.log(`❌ [loadPinDefinition] ERROR at step 2-3:`, error);
    console.log('💡 [loadPinDefinition] ERROR DETAILS:', {
      message: error.message,
      stack: error.stack
    });
    return null;
  }
};

export const getComponentPins = async (componentType, width, height) => {
  console.log(`🎯 [getComponentPins] STARTED for: ${componentType}`);
  
  try {
    const definition = await loadPinDefinition(componentType);
    
    if (definition && definition.pins) {
      console.log(`✅ [getComponentPins] Using JSON definition with ${definition.pins.length} pins`);
      return definition.pins;
    } else {
      console.log('❌ [getComponentPins] No definition found, falling back to auto-detection');
    }
  } catch (error) {
    console.warn(`❌ [getComponentPins] Error loading pins for ${componentType}:`, error);
  }
  
  console.log('🔄 [getComponentPins] Falling back to detectPinsFromImage');
  const autoPins = detectPinsFromImage(componentType, width, height);
  console.log(`🔄 [getComponentPins] Auto-generated ${autoPins.length} pins`);
  return autoPins;
};