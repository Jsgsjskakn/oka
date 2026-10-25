'use client';

import React, { useState, useEffect } from 'react';
import { Move, Pointer, Maximize2, RotateCw } from 'lucide-react';

export function ARInstructionsOverlay() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-obsidian/60 backdrop-blur-sm transition-opacity duration-500 ease-in-out">
      <div className="flex flex-col space-y-8 items-center text-center">
        <div className="flex flex-col items-center">
          <Move className="w-8 h-8 text-champagne mb-2" />
          <p className="text-xs text-text-primary/80">Move phone slowly to find a surface</p>
        </div>
        <div className="flex flex-col items-center">
          <Pointer className="w-8 h-8 text-champagne mb-2" />
          <p className="text-xs text-text-primary/80">Tap to place your dish</p>
        </div>
        <div className="flex flex-col items-center">
          <Maximize2 className="w-8 h-8 text-champagne mb-2" />
          <p className="text-xs text-text-primary/80">Pinch to resize</p>
        </div>
        <div className="flex flex-col items-center">
          <RotateCw className="w-8 h-8 text-champagne mb-2" />
          <p className="text-xs text-text-primary/80">Drag to rotate</p>
        </div>
      </div>
    </div>
  );
}
