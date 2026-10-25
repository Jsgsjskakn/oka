'use client';

import { useState } from 'react';
import { Camera, RotateCcw, Share2, Eye, EyeOff, Box, MapPin } from 'lucide-react';

interface ARControlsProps {
  onCapture: () => void;
  onReset: () => void;
  onShare: () => void;
  onToggleHotspots: () => void;
  onView3D: () => void;
  onReplace?: () => void;
  showHotspots: boolean;
  isPlaced: boolean;
  isVisible?: boolean;
}

export function ARControls({
  onCapture,
  onReset,
  onShare,
  onToggleHotspots,
  onView3D,
  onReplace,
  showHotspots,
  isPlaced,
  isVisible = true,
}: ARControlsProps) {
  const [activeBtn, setActiveBtn] = useState<string | null>(null);

  const handleBtn = (id: string, action: () => void) => {
    setActiveBtn(id);
    action();
    if ('vibrate' in navigator) navigator.vibrate(10);
    setTimeout(() => setActiveBtn(null), 200);
  };

  const buttons = [
    { id: 'hotspots', icon: showHotspots ? EyeOff : Eye, action: onToggleHotspots, active: showHotspots },
    { id: 'capture', icon: Camera, action: onCapture },
    { id: 'share', icon: Share2, action: onShare },
    { id: 'reset', icon: RotateCcw, action: onReset },
    ...(isPlaced && onReplace ? [{ id: 'replace', icon: MapPin, action: onReplace }] : []),
    { id: '3d', icon: Box, action: onView3D },
  ];

  return (
    <div
      className={`absolute right-3 top-16 bottom-24 z-20 flex flex-col justify-center items-end gap-1.5 max-h-[calc(100vh-160px)] overflow-y-auto no-scrollbar py-1 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {buttons.map((btn) => (
        <button
          key={btn.id}
          onClick={() => handleBtn(btn.id, btn.action)}
          className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full backdrop-blur-md border transition-all active:scale-90 ${
            activeBtn === btn.id || btn.active
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-obsidian/50 border-border-subtle text-text-primary/80'
          }`}
          aria-label={btn.id}
        >
          <btn.icon className="w-[18px] h-[18px]" />
        </button>
      ))}
    </div>
  );
}
