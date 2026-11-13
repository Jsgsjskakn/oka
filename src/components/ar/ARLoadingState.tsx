'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface ARLoadingStateProps {
  dishName: string;
  dishImage: string;
  progress: number;
  onCancel?: () => void;
}

export function ARLoadingState({ dishName, dishImage, progress, onCancel }: ARLoadingStateProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-obsidian px-6">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 inline-flex items-center gap-1.5 px-3.5 min-h-[44px] rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-text-primary transition-colors cursor-pointer touch-manipulation"
          aria-label="Go Back"
        >
          <ArrowLeft className="w-4 h-4 text-[#F0C36B]" />
          <span>Back</span>
        </button>
      )}

      <div className="relative mb-6">
        <img
          src={dishImage}
          alt={dishName}
          className="w-24 h-24 rounded-2xl object-cover border border-border-subtle"
        />
      </div>
      
      <div className="relative flex items-center justify-center mb-4">
        <div className="absolute w-12 h-12 border-2 border-champagne/20 border-t-[#c9a84c] rounded-full animate-spin"></div>
        <span className="text-[10px] font-medium text-text-primary">{Math.round(progress)}%</span>
      </div>

      <h2 className="text-sm font-semibold text-text-primary mb-1">Preparing AR Experience</h2>
      <p className="text-[10px] text-text-primary/50">Setting up camera...</p>
    </div>
  );
}
