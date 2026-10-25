'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ARHeaderProps {
  onExit: () => void;
}

export function ARHeader({ onExit }: ARHeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/60 to-transparent pt-safe">
      <div className="p-4 flex items-center justify-between h-16">
        <button
          onClick={onExit}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-obsidian/50 border border-border-subtle text-text-primary transition-transform active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
        
        <span className="text-[10px] font-bold text-champagne uppercase tracking-widest">
          AR View
        </span>

        {/* Empty space to balance the header */}
        <div className="w-10 h-10"></div>
      </div>
    </div>
  );
}
