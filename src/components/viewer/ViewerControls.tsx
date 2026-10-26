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
      label: autoRotate ? 'Stop Rotation' : 'Auto-Rotate',
      active: autoRotate,
      onClick: () => {
        haptic();
        onToggleAutoRotate();
      },
      icon: (
        <RotateCw
          className={`w-[18px] h-[18px] transition-transform ${
            autoRotate ? 'animate-spin text-[#E2A84B]' : 'text-[#9A9286]'
          }`}
          style={autoRotate ? { animationDuration: '4s' } : undefined}
        />
      ),
    },
    {
      id: 'hotspots',
      label: showHotspots ? 'Hide Pins' : 'Ingredient Pins',
      active: showHotspots,
      onClick: () => {
        haptic();
        onToggleHotspots();
      },
      icon: (
        <Layers
          className={`w-[18px] h-[18px] ${
            showHotspots ? 'text-[#E2A84B]' : 'text-[#9A9286]'
          }`}
        />
      ),
    },
    {
      id: 'angle',
      label: cameraPreset === 'top' ? 'Side 45° View' : 'Top 90° View',
      active: cameraPreset === 'top',
      onClick: () => {
        haptic();
        onToggleCameraAngle();
      },
      icon: (
        <Eye
          className={`w-[18px] h-[18px] ${
            cameraPreset === 'top' ? 'text-[#E2A84B]' : 'text-[#9A9286]'
          }`}
        />
      ),
    },
    {
      id: 'reset',
      label: 'Reset Camera',
      active: false,
      onClick: () => {
        haptic();
        onReset();
      },
      icon: <RotateCcw className="w-[18px] h-[18px] text-[#9A9286] group-hover:text-[#FAF5EC]" />,
    },
  ];

  return (
    <aside
      className="fixed right-4 sm:right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center pointer-events-auto"
      aria-label="3D Camera & Presentation Controls"
    >
      <div className="flex flex-col gap-1.5 p-2 rounded-[14px] bg-[rgba(21,17,14,0.82)] backdrop-blur-xl border border-[rgba(226,168,75,0.22)] shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        {controls.map((ctrl, index) => (
          <React.Fragment key={ctrl.id}>
            {index > 0 && <div className="w-5 h-[1px] bg-white/[0.06] my-0.5 mx-auto" />}
            <div className="relative group flex items-center justify-center">
              <button
                onClick={ctrl.onClick}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                  ctrl.active
                    ? 'bg-[#E2A84B]/15 border border-[#E2A84B]/40 shadow-[0_0_12px_rgba(226,168,75,0.25)]'
                    : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.06] hover:border-white/10'
                }`}
                aria-label={ctrl.label}
              >
                {ctrl.icon}
              </button>

              {/* Left-Sliding Frosted Gold Tooltip */}
              <div className="absolute right-full mr-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:-translate-x-1.5 whitespace-nowrap bg-[rgba(21,17,14,0.92)] backdrop-blur-md border border-[#E2A84B]/35 rounded-md px-2.5 py-1 text-[11px] font-medium text-[#FAF5EC] shadow-[0_4px_16px_rgba(0,0,0,0.6)] z-50">
                {ctrl.label}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </aside>
  );
}
