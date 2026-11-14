'use client';

import React from 'react';
import {
  Scan,
  CheckCircle2,
  AlertTriangle,
  Move,
  Maximize2,
  XCircle,
} from 'lucide-react';
import type { XRTrackingState } from '@/lib/xr/spatial-contract';

export interface ARTrackingStatusProps {
  state: XRTrackingState;
  dishTitle?: string;
  userScale?: number;
  onReposition?: () => void;
  onResetScale?: () => void;
  errorMessage?: string;
  className?: string;
}

export function ARTrackingStatus({
  state,
  dishTitle,
  userScale = 1.0,
  onReposition,
  onResetScale,
  errorMessage,
  className = '',
}: ARTrackingStatusProps) {
  const isScaleModified = Math.abs(userScale - 1.0) > 0.02;
  const scalePercent = Math.round(userScale * 100);

  return (
    <div
      className={`pointer-events-none flex flex-col items-center justify-between transition-all duration-300 ${className}`}
      aria-live="polite"
      role="status"
    >
      {/* Top Floating Tracking Pill */}
      <div className="pointer-events-auto mt-2">
        {state === 'scanning' && (
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-obsidian/85 backdrop-blur-md border border-gold-primary/30 shadow-lg shadow-black/40">
            <Scan className="w-4 h-4 text-gold-primary animate-pulse" />
            <span className="text-xs font-medium text-gold-light tracking-wide uppercase">
              Scanning Table Surface
            </span>
          </div>
        )}

        {state === 'surface-detected' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-obsidian/90 backdrop-blur-md border border-emerald-500/40 shadow-lg shadow-emerald-950/30 animate-in fade-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-300 tracking-wide">
              Table Detected • Tap to Place
            </span>
          </div>
        )}

        {state === 'placed' && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-obsidian/80 backdrop-blur-md border border-white/10 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
            <span className="text-xs text-text-secondary tracking-wide">
              {dishTitle ? dishTitle : 'Dish'} placed •{' '}
              <span className="text-gold-light font-medium">{scalePercent}% Real Size</span>
            </span>
          </div>
        )}

        {state === 'tracking-limited' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-obsidian/90 backdrop-blur-md border border-amber-500/40 shadow-lg shadow-amber-950/30">
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-medium text-amber-300 tracking-wide">
              Tracking Limited • Hold Steady
            </span>
          </div>
        )}

        {(state === 'error' || state === 'unsupported' || state === 'session-denied') && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-950/80 backdrop-blur-md border border-red-500/40 shadow-lg">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-red-200 tracking-wide">
              {errorMessage || 'AR tracking unavailable'}
            </span>
          </div>
        )}
      </div>

      {/* Center Guidance Hint (Only visible during scanning / surface-detected) */}
      {(state === 'scanning' || state === 'surface-detected') && (
        <div className="pointer-events-none my-auto max-w-xs text-center px-4 py-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-text-primary text-xs leading-relaxed shadow-xl animate-in fade-in duration-300">
          {state === 'scanning' ? (
            <p>
              Point your camera toward your tabletop or flat surface and move it slowly in small circles.
            </p>
          ) : (
            <p className="text-gold-light font-medium">
              A placement reticle is ready. Tap anywhere on the table to set your plate.
            </p>
          )}
        </div>
      )}

      {/* Bottom Placement Controls (When dish is placed) */}
      {state === 'placed' && (
        <div className="pointer-events-auto mb-4 flex items-center gap-2 bg-obsidian/90 backdrop-blur-md border border-border-subtle p-1.5 rounded-full shadow-2xl">
          {onReposition && (
            <button
              onClick={onReposition}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-subtle/60 hover:bg-surface-subtle text-text-primary text-xs font-medium transition-all active:scale-95"
              aria-label="Reposition dish"
            >
              <Move className="w-3.5 h-3.5 text-gold-primary" />
              <span>Reposition</span>
            </button>
          )}

          {onResetScale && isScaleModified && (
            <button
              onClick={onResetScale}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-primary/20 hover:bg-gold-primary/30 text-gold-light text-xs font-medium transition-all active:scale-95 border border-gold-primary/30"
              aria-label="Reset to 100% real size"
            >
              <Maximize2 className="w-3.5 h-3.5 text-gold-primary" />
              <span>Reset 100% Size</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
