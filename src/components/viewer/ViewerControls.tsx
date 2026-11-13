'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  variant?: 'desktop' | 'mobile' | 'modal';
  isSettingsOpen?: boolean;
  onOpenSettingsChange?: (open: boolean) => void;
  hideSettingsModal?: boolean;
}

export const QUALITY_OPTIONS: ReadonlyArray<{
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
  variant,
  isSettingsOpen: controlledSettingsOpen,
  onOpenSettingsChange,
  hideSettingsModal = false,
}: ViewerControlsProps) {
  const [internalSettingsOpen, setInternalSettingsOpen] = useState(false);
  const isSettingsOpen = controlledSettingsOpen ?? internalSettingsOpen;
  const setIsSettingsOpen = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      const resolved = typeof next === 'function' ? next(isSettingsOpen) : next;
      if (controlledSettingsOpen === undefined) {
        setInternalSettingsOpen(resolved);
      }
      onOpenSettingsChange?.(resolved);
    },
    [controlledSettingsOpen, isSettingsOpen, onOpenSettingsChange]
  );

  const canRenderModal = !hideSettingsModal;

  useEffect(() => {
    if (!canRenderModal || !isSettingsOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSettingsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [canRenderModal, isSettingsOpen, setIsSettingsOpen]);

  const haptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
  };

  // ---------------------------------------------------------------------------
  // 1. DESKTOP ORIGINAL CONTROLS LIST: Rotate, Layers, View, Reset
  // ---------------------------------------------------------------------------
  const desktopControls = [
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

  // ---------------------------------------------------------------------------
  // 2. MOBILE TOP DOCK CONTROLS LIST: View, Layers, Reset, Settings
  // ---------------------------------------------------------------------------
  const mobileTopControls = [
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
          className={`w-3.5 h-3.5 ${
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
          className={`w-3.5 h-3.5 ${
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
      icon: <RotateCcw className="w-3.5 h-3.5 text-[#D2C3AD] group-hover:text-[#F8F2E8]" />,
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
          className={`w-3.5 h-3.5 ${
            isSettingsOpen ? 'text-[#F0C36B] rotate-90' : 'text-[#D2C3AD] group-hover:text-[#F8F2E8]'
          } transition-transform duration-300`}
        />
      ),
    },
  ];

  const settingsModalNode =
    canRenderModal && isSettingsOpen ? (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="3D Viewer Settings & Hardware Quality"
        className="fixed inset-0 z-[80] pointer-events-auto flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsSettingsOpen(false);
        }}
      >
      <div className="relative w-full max-w-md rounded-3xl bg-[rgba(18,14,11,0.95)] backdrop-blur-2xl border border-[#F0C36B]/40 shadow-[0_24px_60px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.15)] p-5 sm:p-6 flex flex-col gap-5 text-[#FAF5EC] max-h-[88dvh] overflow-y-auto hide-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F0C36B]/20 border border-[#F0C36B]/40 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-[#F0C36B]" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#FAF5EC] leading-tight">
                3D Studio Calibration
              </h3>
              <p className="text-[11px] text-[#A99B8B]">Adaptive Quality & View Modes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-[#D2C3AD] hover:text-[#FAF5EC] transition-all cursor-pointer min-h-[48px] min-w-[48px] touch-manipulation"
            aria-label="Close Settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quality Selector */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-mono uppercase tracking-widest text-[#F0C36B] font-bold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#F0C36B]" />
              Graphics Fidelity
            </span>
            {activeQualityTier && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F0C36B]/15 border border-[#F0C36B]/30 text-[#FFE1A0]">
                Active: {TIER_BADGE_MAP[activeQualityTier]}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {QUALITY_OPTIONS.map((opt) => {
              const isSelected = qualityMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => {
                    haptic();
                    onChangeQualityMode?.(opt.mode);
                  }}
                  className={`min-h-[48px] min-w-[48px] p-3 rounded-2xl text-left transition-all cursor-pointer touch-manipulation flex flex-col justify-between border ${
                    isSelected
                      ? 'bg-[#F0C36B]/15 border-[#F0C36B] shadow-[0_0_18px_rgba(240,195,107,0.3)]'
                      : 'bg-black/35 border-white/10 hover:border-[#F0C36B]/40 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${isSelected ? 'text-[#FFE1A0]' : 'text-[#FAF5EC]'}`}>
                      {opt.label}
                    </span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[#F0C36B] text-black flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="text-[9.5px] text-[#A99B8B] leading-tight line-clamp-2">
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Tools */}
        <div className="flex flex-col gap-2.5 border-t border-white/[0.08] pt-3.5">
          <span className="text-[10.5px] font-mono uppercase tracking-widest text-[#F0C36B] font-bold">
            Camera & Presentation
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

        {/* AR Button if available */}
        {arHref && (
          <div className="border-t border-white/[0.08] pt-3.5">
            <NextLink
              href={arHref}
              className="w-full min-h-[48px] py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#F0C36B]/20 via-[#F0C36B]/30 to-[#F0C36B]/20 border border-[#F0C36B]/60 text-[#FFE1A0] flex items-center justify-center gap-2 text-xs font-bold hover:brightness-110 active:scale-[0.98] transition-all touch-manipulation"
            >
              <Box className="w-4 h-4 text-[#F0C36B]" />
              <span>View in AR · Place on Table</span>
            </NextLink>
          </div>
        )}

        {/* Done / Close Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="w-full min-h-[48px] py-2.5 rounded-xl bg-gradient-to-r from-[#F0C36B] to-[#D4A346] text-[#120E0B] font-bold text-xs sm:text-sm shadow-[0_2px_14px_rgba(240,195,107,0.35)] active:scale-[0.98] transition-all cursor-pointer touch-manipulation text-center"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (variant === 'modal') {
    return settingsModalNode;
  }

  // Desktop vertical left floating dock (Rotate, Layers, View, Reset) + subtle calibration button
  if (variant === 'desktop') {
    return (
      <>
        <aside
          className="hidden sm:flex fixed left-3 sm:left-5 lg:left-8 top-[56%] xl:top-1/2 -translate-y-1/2 z-40 flex-col items-center pointer-events-auto select-none animate-in fade-in slide-in-from-left-4 duration-300"
          aria-label="3D Camera & Presentation Controls"
        >
          <div className="flex flex-col gap-2 px-2 py-3 rounded-full bg-[rgba(20,15,11,0.85)] backdrop-blur-2xl border border-[rgba(240,195,107,0.3)] shadow-[0_16px_40px_rgba(0,0,0,0.85)]">
            {desktopControls.map((ctrl, index) => (
              <React.Fragment key={ctrl.id}>
                {index > 0 && <div className="w-6 h-[1px] bg-white/[0.06] my-0.5 mx-auto" />}
                <button
                  type="button"
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

          <button
            type="button"
            onClick={() => {
              haptic();
              setIsSettingsOpen((prev) => !prev);
            }}
            className={`mt-2.5 w-12 h-12 min-h-[48px] min-w-[48px] rounded-full backdrop-blur-2xl border flex items-center justify-center transition-all active:scale-90 cursor-pointer touch-manipulation shadow-[0_12px_32px_rgba(0,0,0,0.8)] ${
              isSettingsOpen
                ? 'bg-[#F0C36B]/25 border-[#F0C36B] text-[#FFE1A0] shadow-[0_0_16px_rgba(240,195,107,0.4)]'
                : 'bg-[rgba(20,15,11,0.85)] border-[rgba(240,195,107,0.3)] text-[#D2C3AD] hover:text-[#F8F2E8] hover:border-[#F0C36B]/60'
            }`}
            title="3D Studio Calibration & Quality"
            aria-label="3D Studio Calibration & Quality"
          >
            <Settings
              className={`w-4 h-4 transition-transform duration-300 ${
                isSettingsOpen ? 'rotate-90 text-[#F0C36B]' : ''
              }`}
            />
          </button>
        </aside>
        {settingsModalNode}
      </>
    );
  }

  // Mobile Top Bar version (+ inline Settings Modal unless hoisted via hideSettingsModal)
  return (
    <>
      <div className="flex sm:hidden pointer-events-auto items-center select-none shrink-0">
        <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-[rgba(20,15,11,0.85)] backdrop-blur-2xl border border-[rgba(240,195,107,0.3)] shadow-[0_12px_32px_rgba(0,0,0,0.85)]">
          {mobileTopControls.map((ctrl, index) => (
            <React.Fragment key={ctrl.id}>
              {index > 0 && <div className="w-[1px] h-3.5 bg-white/[0.08]" />}
              <button
                type="button"
                onClick={ctrl.onClick}
                className="relative flex items-center justify-center gap-1 px-1.5 min-[440px]:px-2 py-1 min-h-[38px] min-w-[38px] rounded-full transition-all active:scale-95 group cursor-pointer touch-manipulation shrink-0 before:content-[''] before:absolute before:-inset-y-1 before:-inset-x-0.5"
                title={ctrl.label}
                aria-label={ctrl.label}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    ctrl.active
                      ? 'bg-[#F0C36B]/25 border border-[#F0C36B] text-[#F0C36B] shadow-[0_0_8px_rgba(240,195,107,0.4)]'
                      : 'bg-black/40 border border-white/10 text-[#D2C3AD] group-hover:text-[#F8F2E8]'
                  }`}
                >
                  {ctrl.icon}
                </div>
                <span
                  className={`hidden min-[460px]:inline text-[9.5px] font-medium leading-none ${
                    ctrl.active ? 'text-[#FFE1A0] font-semibold' : 'text-[#A99B8B]'
                  }`}
                >
                  {ctrl.label}
                </span>
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {settingsModalNode}
    </>
  );
}
