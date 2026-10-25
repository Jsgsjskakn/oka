'use client';

import React from 'react';

interface ARLoadingStateProps {
  dishName: string;
  dishImage: string;
  progress: number;
}

export function ARLoadingState({ dishName, dishImage, progress }: ARLoadingStateProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-obsidian">
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
      <p className="text-[10px] text-text-primary/40">Setting up camera...</p>
    </div>
  );
}
