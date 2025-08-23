import React from 'react';

const SettingsButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 1000,
        width: '44px',
        height: '44px',
        backgroundColor: 'rgba(26, 26, 26, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '8px',
        color: '#e5e7eb',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = 'rgba(26, 26, 26, 0.95)';
        e.target.style.transform = 'scale(1.05)';
        e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = 'rgba(26, 26, 26, 0.9)';
        e.target.style.transform = 'scale(1)';
        e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
      }}
      title="Canvas Settings"
    >
      <span style={{ fontSize: '20px' }}>⚙️</span>
    </button>
  );
};

export default SettingsButton;