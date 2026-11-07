'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import {
  RotateCw,
  Layers,
  Eye,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Box,
  Sparkles,
  Settings,
  X,
  Sliders,
  Check,
} from 'lucide-react';
import type { QualityTier } from '@/hooks/useQualityTier';

export type ViewerQualityMode = 'auto' | 'low' | 'medium' | 'high';

export interface ViewerControlsProps {
  onReset: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  showHotspots: boolean;
  onToggleHotspots: () => void;
  cameraPreset: 'side' | 'top';
  onToggleCameraAngle: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  arHref?: string;
  qualityMode?: ViewerQualityMode;
  activeQualityTier?: QualityTier;
  onChangeQualityMode?: (mode: ViewerQualityMode) => void;
}

const QUALITY_OPTIONS: ReadonlyArray<{
  mode: ViewerQualityMode;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    mode: 'auto',
    label: 'Auto',
    shortLabel: 'Auto',
    description: 'Automatic hardware-calibrated quality',
  },
  {
    mode: 'low',
    label: 'Ultra-Light',
    shortLabel: 'Ultra-Light',
    description: 'Battery saver · 1.0x DPR · Static shadow disc',
  },
  {
    mode: 'medium',
    label: 'Balanced',
    shortLabel: 'Balanced',
    description: '1.25x DPR · Studio IBL · 512px baked shadow',
  },
  {
    mode: 'high',
    label: 'High',
    shortLabel: 'High',
    description: '1.5x DPR · Full 4-point studio rig & IBL',
  },
];

const TIER_BADGE_MAP: Record<QualityTier, string> = {
  low: 'Light',
  medium: 'Balanced',
  high: 'High',
};

export function ViewerControls({
  onReset,
  autoRotate,
  onToggleAutoRotate,
  showHotspots,
  onToggleHotspots,
  cameraPreset,
  onToggleCameraAngle,
  onZoomIn,
  onZoomOut,
  isFullscreen = false,
  onToggleFullscreen,
  arHref,
  qualityMode = 'auto',
  activeQualityTier,
  onChangeQualityMode,
}: ViewerControlsProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const haptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
  };

  // Only View, Layers, Reset, and Settings remain on the left floating dock
  const dockControls = [
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
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
            cameraPreset === 'top' ? 'text-[#F0C36B]' : 'text-[#D2C3AD] group-hover:text-[#F8F2E8]'
          }`}
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
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
            showHotspots ? 'text-[#F0C36B]' : 'text-[#D2C3AD] group-hover:text-[#F8F2E8]'
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
      icon: <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D2C3AD] group-hover:text-[#F8F2E8]" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      active: isSettingsOpen,
      onClick: () => {
        haptic();
        setIsSettingsOpen((prev) => !prev);
      },
      icon: (
        <Settings
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${
            isSettingsOpen ? 'text-[#F0C36B] rotate-90' : 'text-[#D2C3AD] group-hover:text-[#F8F2E8]'
          }`}
        />
      ),
    },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* Top Center Controls Bar: View · Layers · Reset · Settings (Where box drawn) */}
      {/* ========================================================================= */}
      <aside
        className="pointer-events-auto flex items-center select-none shrink-0"
        aria-label="3D Camera & Presentation Controls"
      >
        <div className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full bg-[rgba(20,15,11,0.85)] backdrop-blur-2xl border border-[rgba(240,195,107,0.3)] shadow-[0_12px_32px_rgba(0,0,0,0.85)]">
          {dockControls.map((ctrl, index) => (
            <React.Fragment key={ctrl.id}>
              {index > 0 && <div className="h-3.5 w-[1px] bg-white/[0.08] my-auto shrink-0" />}
              <button
                type="button"
                onClick={ctrl.onClick}
                className="flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 min-h-[44px] sm:min-h-[48px] min-w-[36px] sm:min-w-[48px] rounded-full transition-all active:scale-95 group cursor-pointer touch-manipulation shrink-0"
                title={ctrl.label}
                aria-label={ctrl.label}
              >
                <div
                  className={`w-5.5 h-5.5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
                    ctrl.active
                      ? 'bg-[#F0C36B]/25 border border-[#F0C36B] shadow-[0_0_12px_rgba(240,195,107,0.4)]'
                      : 'bg-black/40 border border-white/10 group-hover:border-[#F0C36B]/40 group-hover:bg-[#F0C36B]/10'
                  }`}
                >
                  {ctrl.icon}
                </div>
                <span
                  className={`text-[9.5px] sm:text-xs font-semibold leading-none tracking-tight ${
                    ctrl.id === 'settings' ? 'hidden md:inline' : 'inline'
                  } ${
                    ctrl.active
                      ? 'text-[#FFE1A0]'
                      : 'text-[#A99B8B] group-hover:text-[#F8F2E8]'
                  }`}
                >
                  {ctrl.label}
                </span>
              </button>
            </React.Fragment>
          ))}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 3D Settings Modal / Drawer: Quality Profiles & Advanced 3D Tools          */}
      {/* ========================================================================= */}
      {isSettingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="3D Viewer Settings"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-[rgba(18,14,11,0.95)] backdrop-blur-2xl border border-[#F0C36B]/40 shadow-[0_24px_60px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.15)] p-5 sm:p-6 flex flex-col gap-5 text-[#FAF5EC] max-h-[90vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#F0C36B]/20 border border-[#F0C36B]/40 flex items-center justify-center">
                  <Sliders className="w-4 h-4 text-[#F0C36B]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#F8F2E8] leading-tight">
                    3D Viewer Settings
                  </h3>
                  <p className="text-[11px] text-[#A99B8B]">
                    Graphics Quality & Interactive Controls
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-[#D2C3AD] hover:text-[#FAF5EC] transition-all cursor-pointer min-h-[48px] min-w-[48px] touch-manipulation"
                aria-label="Close Settings"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* SECTION 1: 3D Graphics Quality Tier */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-mono uppercase tracking-widest text-[#F0C36B] font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#F0C36B]" />
                  <span>Rendering Quality</span>
                </span>
                {activeQualityTier && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F0C36B]/15 border border-[#F0C36B]/30 text-[#FFE1A0]">
                    Current: {TIER_BADGE_MAP[activeQualityTier]}
                  </span>
                )}
              </div>

              {/* Quality Options Radio Group */}
              <div
                role="radiogroup"
                aria-label="3D Graphics Quality"
                data-testid="viewer-quality-selector"
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                {QUALITY_OPTIONS.map((opt) => {
                  const isSelected = qualityMode === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        haptic();
                        onChangeQualityMode?.(opt.mode);
                      }}
                      className={`min-h-[48px] min-w-[48px] p-3 rounded-2xl text-left transition-all cursor-pointer touch-manipulation flex flex-col justify-between border ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#F0C36B]/25 to-[#D4A346]/15 border-[#F0C36B] shadow-[0_0_16px_rgba(240,195,107,0.25)]'
                          : 'bg-black/35 hover:bg-white/[0.05] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span
                          className={`font-semibold text-xs ${
                            isSelected ? 'text-[#FFE1A0]' : 'text-[#FAF5EC]'
                          }`}
                        >
                          {opt.label}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#F0C36B] text-black flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-[#A99B8B] leading-tight">
                        {opt.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: Camera & Interaction Tools (moved from left dock) */}
            <div className="flex flex-col gap-2.5 border-t border-white/[0.08] pt-3.5">
              <span className="text-[10.5px] font-mono uppercase tracking-widest text-[#F0C36B] font-bold">
                Camera & Motion Controls
              </span>

              <div className="grid grid-cols-2 gap-2">
                {/* Auto Rotate Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    haptic();
                    onToggleAutoRotate();
                  }}
                  className={`min-h-[48px] min-w-[48px] p-2.5 rounded-2xl flex items-center gap-2.5 transition-all cursor-pointer touch-manipulation border ${
                    autoRotate
                      ? 'bg-[#F0C36B]/20 border-[#F0C36B] text-[#FFE1A0]'
                      : 'bg-black/35 border-white/10 text-[#D2C3AD] hover:bg-white/[0.05]'
                  }`}
                >
                  <RotateCw
                    className={`w-4 h-4 ${autoRotate ? 'animate-spin text-[#F0C36B]' : ''}`}
                    style={autoRotate ? { animationDuration: '4s' } : undefined}
                  />
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-xs font-semibold">Auto-Rotate</span>
                    <span className="text-[9.5px] text-[#A99B8B]">
                      {autoRotate ? 'Active (Spinning)' : 'Paused'}
                    </span>
                  </div>
                </button>

                {/* Fullscreen Toggle */}
                {onToggleFullscreen ? (
                  <button
                    type="button"
                    onClick={() => {
                      haptic();
                      onToggleFullscreen();
                    }}
                    className={`min-h-[48px] min-w-[48px] p-2.5 rounded-2xl flex items-center gap-2.5 transition-all cursor-pointer touch-manipulation border ${
                      isFullscreen
                        ? 'bg-[#F0C36B]/20 border-[#F0C36B] text-[#FFE1A0]'
                        : 'bg-black/35 border-white/10 text-[#D2C3AD] hover:bg-white/[0.05]'
                    }`}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4 text-[#F0C36B]" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                    <div className="flex flex-col text-left leading-tight">
                      <span className="text-xs font-semibold">
                        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                      </span>
                      <span className="text-[9.5px] text-[#A99B8B]">
                        {isFullscreen ? 'Normal View' : 'Immersive'}
                      </span>
                    </div>
                  </button>
                ) : null}

                {/* Zoom In Button */}
                {onZoomIn && (
                  <button
                    type="button"
                    onClick={() => {
                      haptic();
                      onZoomIn();
                    }}
                    className="min-h-[48px] min-w-[48px] p-2.5 rounded-2xl flex items-center gap-2.5 bg-black/35 hover:bg-white/[0.05] border border-white/10 text-[#D2C3AD] hover:text-[#FAF5EC] transition-all cursor-pointer touch-manipulation"
                  >
                    <ZoomIn className="w-4 h-4 text-[#F0C36B]" />
                    <div className="flex flex-col text-left leading-tight">
                      <span className="text-xs font-semibold">Zoom In</span>
                      <span className="text-[9.5px] text-[#A99B8B]">Closer View</span>
                    </div>
                  </button>
                )}

                {/* Zoom Out Button */}
                {onZoomOut && (
                  <button
                    type="button"
                    onClick={() => {
                      haptic();
                      onZoomOut();
                    }}
                    className="min-h-[48px] min-w-[48px] p-2.5 rounded-2xl flex items-center gap-2.5 bg-black/35 hover:bg-white/[0.05] border border-white/10 text-[#D2C3AD] hover:text-[#FAF5EC] transition-all cursor-pointer touch-manipulation"
                  >
                    <ZoomOut className="w-4 h-4 text-[#F0C36B]" />
                    <div className="flex flex-col text-left leading-tight">
                      <span className="text-xs font-semibold">Zoom Out</span>
                      <span className="text-[9.5px] text-[#A99B8B]">Wider View</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Done / Close Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="w-full min-h-[48px] py-2.5 rounded-xl bg-gradient-to-r from-[#F0C36B] to-[#D4A346] text-[#120E0B] font-bold text-xs sm:text-sm shadow-[0_2px_14px_rgba(240,195,107,0.35)] active:scale-98 transition-all cursor-pointer touch-manipulation text-center"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
