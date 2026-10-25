'use client';

import React, { useState, useEffect } from 'react';
import { Share2, Link2, Box } from 'lucide-react';
import Link from 'next/link';

export interface ARShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  dishName: string;
  dishId: string;
}

export function ARShareSheet({ isOpen, onClose, dishName, dishId }: ARShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleShare = async () => {
    const url = window.location.origin + `/dish/${dishId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${dishName} at The Golden Oak`,
          url: url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    const url = window.location.origin + `/dish/${dishId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-obsidian/60 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-obsidian/90 backdrop-blur-xl border-t border-border-subtle rounded-t-3xl max-h-[40vh] pb-safe-bottom transition-transform duration-300 transform ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="p-4 flex flex-col items-center">
          <div className="w-10 h-1 rounded-full bg-white/20 mb-4" />
          <h3 className="text-sm font-semibold text-text-primary mb-6">Share this dish</h3>
          
          <div className="flex flex-row gap-8 justify-center w-full">
            {/* Share Button */}
            <button onClick={handleShare} className="flex flex-col items-center gap-2 group focus:outline-none">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-border-subtle flex items-center justify-center group-active:scale-95 transition-transform">
                <Share2 className="w-5 h-5 text-text-primary" />
              </div>
              <span className="text-[10px] text-text-primary/60">Share</span>
            </button>

            {/* Copy Link Button */}
            <button onClick={handleCopy} className="flex flex-col items-center gap-2 group focus:outline-none">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-border-subtle flex items-center justify-center group-active:scale-95 transition-transform relative">
                <Link2 className="w-5 h-5 text-text-primary" />
              </div>
              <span className="text-[10px] text-text-primary/60">{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            {/* View in 3D Button */}
            <Link href={`/3d/${dishId}`} className="flex flex-col items-center gap-2 group focus:outline-none">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-border-subtle flex items-center justify-center group-active:scale-95 transition-transform">
                <Box className="w-5 h-5 text-text-primary" />
              </div>
              <span className="text-[10px] text-text-primary/60">View in 3D</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
