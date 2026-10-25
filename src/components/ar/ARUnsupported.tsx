'use client';

import React from 'react';
import { Smartphone } from 'lucide-react';
import Link from 'next/link';

interface ARUnsupportedProps {
  dishId: string;
  onGoBack: () => void;
}

export function ARUnsupported({ dishId, onGoBack }: ARUnsupportedProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-obsidian px-6">
      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/5 border border-border-subtle text-text-primary/50 mb-6">
        <Smartphone className="w-8 h-8" />
      </div>
      
      <h2 className="text-lg font-semibold text-text-primary mb-2">AR Not Available</h2>
      <p className="text-sm text-text-primary/40 max-w-xs text-center mb-8">
        Your device or browser doesn't support AR. You can still explore this dish in our interactive 3D viewer.
      </p>

      <div className="w-full max-w-xs space-y-3">
        <Link
          href={`/3d/${dishId}`}
          className="flex justify-center items-center w-full py-3 rounded-full bg-champagne text-black font-semibold text-sm transition-transform active:scale-95"
        >
          View in 3D
        </Link>
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
