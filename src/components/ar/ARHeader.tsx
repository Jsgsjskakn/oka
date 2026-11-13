'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ARHeaderProps {
  onExit: () => void;
  modeBadgeLabel?: string;
  isWorldTracked?: boolean;
}

export function ARHeader({
  onExit,
  modeBadgeLabel = 'Camera Overlay Preview',
  isWorldTracked = false,
}: ARHeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/60 to-transparent pt-safe">
      <div className="p-4 flex items-center justify-between h-16">
        <button
          onClick={onExit}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-obsidian/50 border border-border-subtle text-text-primary transition-transform active:scale-95"
          aria-label="Exit spatial view"
        >
          <X className="w-5 h-5" />
        </button>
        
        <span
          data-testid="ar-experience-mode-badge"
          data-world-tracked={isWorldTracked ? 'true' : 'false'}
          className="text-[10px] font-bold text-champagne uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/40 border border-white/10"
        >
          {modeBadgeLabel}
        </span>

        {/* Empty space to balance the header */}
        <div className="w-10 h-10"></div>
      </div>
    </div>
  );
}
