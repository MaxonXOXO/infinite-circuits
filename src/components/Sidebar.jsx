// src/components/Sidebar.jsx
import React, { useState, useMemo } from "react";

// Helper function to import images with automatic naming
const importImages = (imageContext) => {
  return imageContext.keys().map((key) => {
    const imagePath = imageContext(key);
    const fileName = key.replace('./', '').replace(/\.[^/.]+$/, '');
    
    return {
      id: fileName,
      name: fileName.split('_')
                   .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                   .join(' '),
      image: imagePath
    };
  });
};

// Import all images from the assets folder
const allParts = importImages(require.context('../assets', false, /\.(png|jpe?g|svg)$/));

export default function Sidebar() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter parts based on search term
  const filteredParts = useMemo(() => {
    if (!searchTerm) return allParts;
    
    return allParts.filter(part => 
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleDragStart = (event, part) => {
    // Send the whole part object as JSON under a custom mime type
    event.dataTransfer.setData("application/reactflow", JSON.stringify(part));
    event.dataTransfer.effectAllowed = "copy";

    // Optional: set a nicer drag ghost image (fallback will still happen)
    try {
      const ghost = new Image();
      ghost.src = part.image;
      // offset the ghost so cursor is near top-left
      event.dataTransfer.setDragImage(ghost, 24, 24);
    } catch (err) {
      // ignore
    }
  };

  return (
    <aside className="sidebar">
      <h3 className="sidebar-title">PARTS</h3>
      
      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button 
            className="clear-search" 
            onClick={() => setSearchTerm("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      
      <div className="sidebar-parts">
        {filteredParts.length > 0 ? (
          filteredParts.map((part) => (
            <div
              key={part.id}
              className="part-item"
              draggable
              onDragStart={(e) => handleDragStart(e, part)}
            >
              {/* IMPORTANT: this image must NOT be directly draggable to avoid browser default image-drag */}
              <img src={part.image} alt={part.name} className="part-image" draggable={false} />
              <span>{part.name}</span>
            </div>
          ))
        ) : (
          <div className="no-results">No components found</div>
        )}
      </div>
    </aside>
  );
}