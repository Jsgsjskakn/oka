'use client';

import React from 'react';
import { Camera } from 'lucide-react';

export interface ARCaptureButtonProps {
  onCapture: () => void;
}

export function ARCaptureButton({ onCapture }: ARCaptureButtonProps) {
  return (
    <button
      onClick={onCapture}
      className="w-12 h-12 rounded-full border-2 border-white/80 bg-obsidian/10 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform duration-200 focus:outline-none"
      aria-label="Capture AR screenshot"
    >
      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
        <Camera className="w-5 h-5 text-text-primary" />
      </div>
    </button>
  );
}
