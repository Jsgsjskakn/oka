'use client';

import { useState, useEffect, useRef } from 'react';
import { Maximize2, RotateCw, Info, Maximize } from 'lucide-react';

interface ViewerControlsProps {
  onReset: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onToggleInfo: () => void;
  showInfo: boolean;
}

export function ViewerControls({
  onReset,
  autoRotate,
  onToggleAutoRotate,
  onToggleInfo,
  showInfo,
}: ViewerControlsProps) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-hide controls after 4 seconds of inactivity
  const showControls = () => {
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 4000);
  };

  useEffect(() => {
    showControls();
    const handleInteraction = () => showControls();
    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('mousemove', handleInteraction, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('mousemove', handleInteraction);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  };

  // Haptic feedback helper
  const haptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const buttons = [
    {
      icon: <Maximize2 className="w-[18px] h-[18px]" />,
      onClick: () => { haptic(); onReset(); },
      label: 'Reset',
      active: false,
    },
    {
      icon: <RotateCw className={`w-[18px] h-[18px] ${autoRotate ? 'animate-spin' : ''}`} style={autoRotate ? { animationDuration: '3s' } : {}} />,
      onClick: () => { haptic(); onToggleAutoRotate(); },
      label: 'Rotate',
      active: autoRotate,
    },
    {
      icon: <Maximize className="w-[18px] h-[18px]" />,
      onClick: () => { haptic(); handleFullscreen(); },
      label: 'Full',
      active: false,
    },
    {
      icon: <Info className="w-[18px] h-[18px]" />,
      onClick: () => { haptic(); onToggleInfo(); },
      label: 'Info',
      active: showInfo,
    },
  ];

  return (
    <div
      className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {buttons.map((btn) => (
        <button
          key={btn.label}
          onClick={btn.onClick}
          className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center active:scale-90 transition-all shadow-lg ${
            btn.active
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-obsidian/50 border-border-subtle text-text-primary/50 hover:text-text-primary'
          }`}
          aria-label={btn.label}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
}
