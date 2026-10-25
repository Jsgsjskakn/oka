'use client';

import { useEffect, useState } from 'react';
import { Hand, ZoomIn } from 'lucide-react';

export function InstructionOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
      <div className="bg-obsidian/70 backdrop-blur-md rounded-2xl px-6 py-4 flex flex-col items-center gap-3 border border-border-subtle animate-in fade-in duration-300">
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center gap-1">
            <Hand className="w-5 h-5 text-primary" />
            <span className="text-[10px] text-text-primary/70 font-medium">Drag to Rotate</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex flex-col items-center gap-1">
            <ZoomIn className="w-5 h-5 text-primary" />
            <span className="text-[10px] text-text-primary/70 font-medium">Pinch to Zoom</span>
          </div>
        </div>
      </div>
    </div>
  );
}
