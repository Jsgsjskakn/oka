'use client';

import React from 'react';
import { ShieldOff } from 'lucide-react';

interface ARPermissionDeniedProps {
  onGoBack: () => void;
  onContinue3D: () => void;
}

export function ARPermissionDenied({ onGoBack, onContinue3D }: ARPermissionDeniedProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-obsidian px-6">
      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-warning mb-6">
        <ShieldOff className="w-8 h-8" />
      </div>
      
      <h2 className="text-lg font-semibold text-text-primary mb-2">Camera Access Required</h2>
      <p className="text-sm text-text-primary/40 max-w-xs text-center mb-8">
        To view dishes in AR, please allow camera access in your browser settings.
      </p>

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={onContinue3D}
          className="w-full py-3 rounded-full bg-champagne text-black font-semibold text-sm transition-transform active:scale-95"
        >
          Continue in 3D
        </button>
        <button
          onClick={onGoBack}
          className="w-full py-3 rounded-full bg-white/10 text-text-primary font-medium text-sm border border-white/5 transition-transform active:scale-95"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
