import React from 'react';

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  autoSaveEnabled, 
  setAutoSaveEnabled,
  autoSaveInterval,
  setAutoSaveInterval,
  manualSave,
  clearAllData,
  lastSaveTime,
  // Add these new props for trace width
  traceWidth,
  setTraceWidth,
  selectedTraceWidth,
  setSelectedTraceWidth
}) => {
  if (!isOpen) return null;

  const formatLastSave = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '8px',
          padding: '24px',
          minWidth: '400px',
          maxWidth: '500px',
          color: 'white',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '20px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚙️</span>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Canvas Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Trace Width Settings - NEW SECTION */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            fontWeight: '500',
            color: '#e5e7eb'
          }}>
            Trace Appearance
          </h3>
          
          <div style={{ 
            padding: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            marginBottom: '12px'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '14px' }}>Trace Width</span>
                <span style={{ 
                  fontSize: '14px', 
                  color: '#60a5fa',
                  fontWeight: '500'
                }}>
                  {traceWidth}px
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="24"
                value={traceWidth}
                onChange={(e) => setTraceWidth(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'rgba(96, 165, 250, 0.3)',
                  outline: 'none',
                }}
              />
            </div>
            
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '14px' }}>Selected Trace Width</span>
                <span style={{ 
                  fontSize: '14px', 
                  color: '#60a5fa',
                  fontWeight: '500'
                }}>
                  {selectedTraceWidth}px
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="28"
                value={selectedTraceWidth}
                onChange={(e) => setSelectedTraceWidth(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'rgba(96, 165, 250, 0.3)',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Auto-save Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            fontWeight: '500',
            color: '#e5e7eb'
          }}>
            Auto-save Settings
          </h3>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
          }}>
            <span style={{ fontSize: '14px' }}>Enable Auto-save</span>
            <label style={{ 
              position: 'relative', 
              display: 'inline-block', 
              width: '44px', 
              height: '24px' 
            }}>
              <input
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                style={{ 
                  opacity: 0, 
                  width: 0, 
                  height: 0 
                }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: autoSaveEnabled ? '#10b981' : '#374151',
                transition: '0.4s',
                borderRadius: '24px',
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: autoSaveEnabled ? '23px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  transition: '0.4s',
                  borderRadius: '50%',
                }} />
              </span>
            </label>
          </div>

          <div style={{ 
            padding: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            marginBottom: '12px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '14px' }}>Save Interval</span>
              <span style={{ 
                  fontSize: '14px', 
                  color: '#10b981',
                  fontWeight: '500'
                }}>
                {autoSaveInterval}s
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setAutoSaveInterval(prev => Math.max(10, prev - 10))}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '4px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                -10s
              </button>
              <button
                onClick={() => setAutoSaveInterval(prev => prev + 10)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '4px',
                  color: '#10b981',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                +10s
              </button>
            </div>
          </div>

          <div style={{ 
            fontSize: '12px', 
            color: '#9ca3af',
            padding: '8px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '4px'
          }}>
            Last saved: {formatLastSave(lastSaveTime)}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => {
              manualSave();
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: '#1083b9ff',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            <span style={{ fontSize: '16px' }}>💾</span>
            Save Now (Ctrl+S)
          </button>
          
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                clearAllData();
                onClose();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '6px',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            <span style={{ fontSize: '16px' }}>🗑️</span>
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;