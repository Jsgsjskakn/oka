'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ARHotspotLabel } from './ARHotspotLabel';

export interface Hotspot {
  id: string;
  name: string;
  description: string;
  screenX: number;
  screenY: number;
}

export interface ARHotspotLayerProps {
  hotspots: Hotspot[];
  isVisible: boolean;
}

export function ARHotspotLayer({ hotspots, isVisible }: ARHotspotLayerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTap = (id: string) => {
    setActiveId(id);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setActiveId(null);
    }, 5000);
  };

  const handleDismiss = () => {
    setActiveId(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-25 pointer-events-none transition-opacity duration-300 opacity-100">
      {hotspots.map((hotspot) => (
        <ARHotspotLabel
          key={hotspot.id}
          name={hotspot.name}
          description={hotspot.description}
          isActive={activeId === hotspot.id}
          position={{ x: hotspot.screenX, y: hotspot.screenY }}
          onTap={() => handleTap(hotspot.id)}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
}
