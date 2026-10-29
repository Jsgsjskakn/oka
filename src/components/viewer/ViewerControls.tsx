'use client';

import React from 'react';
import { RotateCw, Layers, Eye, RotateCcw } from 'lucide-react';

interface ViewerControlsProps {
  onReset: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  showHotspots: boolean;
  onToggleHotspots: () => void;
  cameraPreset: 'side' | 'top';
  onToggleCameraAngle: () => void;
}

export function ViewerControls({
  onReset,
  autoRotate,
  onToggleAutoRotate,
  showHotspots,
  onToggleHotspots,
  cameraPreset,
  onToggleCameraAngle,
}: ViewerControlsProps) {
  const haptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
  };

  const controls = [
    {
      id: 'rotate',
      label: 'Rotate',
      active: autoRotate,
      onClick: () => {
        haptic();
        onToggleAutoRotate();
      },
      icon: (
        <RotateCw
          className={`w-5 h-5 transition-transform ${
            autoRotate ? 'animate-spin text-[#F0C36B]' : 'text-[#D2C3AD] group-hover:text-[#F8F2E8]'
          }`}
          style={autoRotate ? { animationDuration: '4s' } : undefined}
        />
      ),
    },
    {
      id: 'layers',
      label: 'Layers',
      active: showHotspots,
      onClick: () => {
        haptic();
        onToggleHotspots();
      },
      icon: (
        <Layers
          className={`w-5 h-5 ${
            showHotspots ? 'text-[#F0C36B]' : 'text-[#D2C3AD] group-hover:text-[#F8F2E8]'
          }`}
        />
      ),
    },
    {
      id: 'view',
      label: 'View',
      active: cameraPreset === 'top',
      onClick: () => {
        haptic();
        onToggleCameraAngle();
      },
      icon: (
        <Eye
          className={`w-5 h-5 ${
            cameraPreset === 'top' ? 'text-[#F0C36B]' : 'text-[#D2C3AD] group-hover:text-[#F8F2E8]'
          }`}
        />
      ),
    },
    {
      id: 'reset',
      label: 'Reset',
      active: false,
      onClick: () => {
        haptic();
        onReset();
      },
      icon: <RotateCcw className="w-5 h-5 text-[#D2C3AD] group-hover:text-[#F8F2E8]" />,
    },
  ];

  return (
    <aside
      className="fixed left-4 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center pointer-events-auto select-none animate-in fade-in slide-in-from-left-4 duration-300"
      aria-label="3D Camera & Presentation Controls"
    >
      <div className="flex flex-col gap-2 px-2 py-3 rounded-full bg-[rgba(20,15,11,0.85)] backdrop-blur-2xl border border-[rgba(240,195,107,0.3)] shadow-[0_16px_40px_rgba(0,0,0,0.85)]">
        {controls.map((ctrl, index) => (
          <React.Fragment key={ctrl.id}>
            {index > 0 && <div className="w-6 h-[1px] bg-white/[0.06] my-0.5 mx-auto" />}
            <button
              onClick={ctrl.onClick}
              className="flex flex-col items-center justify-center gap-1.5 p-1 min-h-[48px] min-w-[48px] transition-all active:scale-90 group cursor-pointer touch-manipulation"
              title={ctrl.label}
              aria-label={ctrl.label}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  ctrl.active
                    ? 'bg-[#F0C36B]/25 border border-[#F0C36B] shadow-[0_0_14px_rgba(240,195,107,0.4)]'
                    : 'bg-black/40 border border-white/10 group-hover:border-[#F0C36B]/40 group-hover:bg-[#F0C36B]/10'
                }`}
              >
                {ctrl.icon}
              </div>
              <span
                className={`text-[10px] font-medium leading-none tracking-tight ${
                  ctrl.active ? 'text-[#FFE1A0] font-semibold' : 'text-[#A99B8B] group-hover:text-[#F8F2E8]'
                }`}
              >
                {ctrl.label}
              </span>
            </button>
          </React.Fragment>
        ))}
      </div>
    </aside>
  );
}
