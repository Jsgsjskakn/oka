'use client';

import { useState } from 'react';
import {
  Camera,
  RotateCcw,
  Share2,
  Eye,
  EyeOff,
  Box,
  MapPin,
  Crosshair,
  UtensilsCrossed,
  Sparkles,
} from 'lucide-react';

export interface ARControlsProps {
  onCapture: () => void;
  onReset: () => void;
  onShare: () => void;
  onToggleHotspots: () => void;
  onView3D: () => void;
  onReplace?: () => void;
  onRecenter?: () => void;
  onToggleDishSelector?: () => void;
  isDishSelectorOpen?: boolean;
  showHotspots: boolean;
  isPlaced: boolean;
  isVisible?: boolean;
  sceneViewerIntentUrl?: string | null;
  quickLookUsdzUrl?: string | null;
  dishPosterUrl?: string;
}

export function ARControls({
  onCapture,
  onReset,
  onShare,
  onToggleHotspots,
  onView3D,
  onReplace,
  onRecenter,
  onToggleDishSelector,
  isDishSelectorOpen = false,
  showHotspots,
  isPlaced,
  isVisible = true,
  sceneViewerIntentUrl,
  quickLookUsdzUrl,
  dishPosterUrl,
}: ARControlsProps) {
  const [activeBtn, setActiveBtn] = useState<string | null>(null);

  const handleBtn = (id: string, action: () => void) => {
    setActiveBtn(id);
    action();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setTimeout(() => setActiveBtn(null), 200);
  };

  const buttons = [
    ...(onToggleDishSelector
      ? [
          {
            id: 'dishes',
            label: 'Switch Dish',
            icon: UtensilsCrossed,
            action: onToggleDishSelector,
            active: isDishSelectorOpen,
          },
        ]
      : []),
    {
      id: 'hotspots',
      label: showHotspots ? 'Hide Ingredients' : 'Show Ingredients',
      icon: showHotspots ? EyeOff : Eye,
      action: onToggleHotspots,
      active: showHotspots,
    },
    {
      id: 'capture',
      label: 'Capture AR Photo',
      icon: Camera,
      action: onCapture,
    },
    {
      id: 'share',
      label: 'Share Dish',
      icon: Share2,
      action: onShare,
    },
    ...(isPlaced && onRecenter
      ? [
          {
            id: 'recenter',
            label: 'Re-center on Table',
            icon: Crosshair,
            action: onRecenter,
          },
        ]
      : []),
    {
      id: 'reset',
      label: 'Reset Scale & Angle',
      icon: RotateCcw,
      action: onReset,
    },
    ...(isPlaced && onReplace
      ? [
          {
            id: 'replace',
            label: 'Reposition Dish',
            icon: MapPin,
            action: onReplace,
          },
        ]
      : []),
    {
      id: '3d',
      label: 'Inspect in 3D Studio',
      icon: Box,
      action: onView3D,
    },
  ];

  return (
    <div
      data-testid="ar-controls-dock"
      className={`absolute right-3 top-[calc(4.5rem+env(safe-area-inset-top))] bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-20 flex flex-col justify-start sm:justify-center items-end gap-1.5 max-h-[calc(100dvh-10rem)] overflow-y-auto hide-scrollbar py-1 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Native Android ARCore Scene Viewer 1-Tap Launcher */}
      {sceneViewerIntentUrl && (
        <a
          href={sceneViewerIntentUrl}
          data-testid="ar-scene-viewer-launcher"
          title="Open Native Android ARCore Plane Tracking"
          aria-label="Open in Android ARCore Scene Viewer"
          className="min-h-[40px] px-2.5 shrink-0 flex items-center gap-1.5 rounded-full backdrop-blur-md bg-[#E2A84B]/20 border border-[#E2A84B]/55 text-[#F6D386] text-[10px] font-semibold tracking-wide shadow-lg active:scale-95 transition-all touch-manipulation"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>ARCore</span>
        </a>
      )}

      {/* Native iOS Safari AR Quick Look Launcher (rendered ONLY when both rel="ar" and valid .usdz exist) */}
      {quickLookUsdzUrl && (
        <a
          rel="ar"
          href={quickLookUsdzUrl}
          data-testid="ar-quick-look-launcher"
          title="Open Apple AR Quick Look"
          aria-label="Open in Apple AR Quick Look"
          className="min-h-[40px] px-2.5 shrink-0 flex items-center gap-1.5 rounded-full backdrop-blur-md bg-[#E2A84B]/20 border border-[#E2A84B]/55 text-[#F6D386] text-[10px] font-semibold tracking-wide shadow-lg active:scale-95 transition-all touch-manipulation"
        >
          {/* Apple Safari requires an <img> as the direct first child of <a rel="ar"> */}
          <img
            src={dishPosterUrl || '/images/dishes/placeholder.jpg'}
            alt=""
            className="w-px h-px opacity-0 absolute pointer-events-none"
          />
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Quick Look</span>
        </a>
      )}

      {buttons.map((btn) => (
        <button
          key={btn.id}
          type="button"
          data-testid={`ar-control-${btn.id}`}
          title={btn.label}
          onClick={() => handleBtn(btn.id, btn.action)}
          className={`w-11 h-11 min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center rounded-full backdrop-blur-md border transition-all active:scale-90 cursor-pointer touch-manipulation ${
            activeBtn === btn.id || btn.active
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-obsidian/60 border-border-subtle text-text-primary/80'
          }`}
          aria-label={btn.label}
        >
          <btn.icon className="w-[18px] h-[18px]" />
        </button>
      ))}
    </div>
  );
}
