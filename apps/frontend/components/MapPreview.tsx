'use client';

import { useEffect, useState } from 'react';

export function MapPreview({ marker = { x: 60, y: 60 } }: { marker?: { x: number; y: number } }) {
  const [position, setPosition] = useState(marker);

  useEffect(() => {
    setPosition(marker);
  }, [marker.x, marker.y]);

  return (
    <div className="map-box">
      <div className="map-grid" />
      <div
        className="map-marker"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
}
