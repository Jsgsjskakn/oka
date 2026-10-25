'use client';

import React from 'react';

export interface ARHotspotLabelProps {
  name: string;
  description: string;
  isActive: boolean;
  position: { x: number; y: number };
  onTap: () => void;
  onDismiss: () => void;
}

export function ARHotspotLabel({
  name,
  description,
  isActive,
  position,
  onTap,
  onDismiss,
}: ARHotspotLabelProps) {
  return (
    <div
      className="absolute z-25 pointer-events-auto"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* Expanded State */}
        <div
          className={`absolute bottom-4 min-w-[120px] bg-obsidian/80 backdrop-blur-lg border border-champagne/20 rounded-xl p-3 shadow-lg transform transition-all duration-300 origin-bottom ${
            isActive ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-75 opacity-0 pointer-events-none'
          }`}
          onClick={isActive ? onDismiss : undefined}
        >
          <div className="text-xs font-semibold text-text-primary whitespace-nowrap">{name}</div>
          <div className="text-[10px] text-text-primary/50 mt-1 line-clamp-2">{description}</div>
          {/* Downward pointing arrow */}
          <div className="absolute -bottom-[6px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-obsidian/80 border-b border-r border-champagne/20 rotate-45" />
        </div>

        {/* Collapsed State */}
        <div
          className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${
            isActive ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'
          }`}
          onClick={!isActive ? onTap : undefined}
        >
          <div className="mb-1 text-[9px] text-text-primary/70 bg-obsidian/50 backdrop-blur-sm rounded px-1.5 py-0.5 whitespace-nowrap">
            {name}
          </div>
          <div className="w-3 h-3 rounded-full bg-champagne shadow-[0_0_8px_rgba(201,168,76,0.5)] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
