'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { Share2, Link2, Box, X, QrCode } from 'lucide-react';
import Link from 'next/link';

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export interface ARShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  dishName: string;
  dishId: string;
  onShowQRCode?: () => void;
}

export function ARShareSheet({ isOpen, onClose, dishName, dishId, onShowQRCode }: ARShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const markCopied = () => {
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => {
      setCopied(false);
      copyTimerRef.current = null;
    }, 2000);
  };

  const handleCopy = async () => {
    const url = window.location.origin + `/3d/${dishId}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        markCopied();
        return;
      }
    } catch {
      // Fall through to execCommand fallback on restricted origins
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (ok) markCopied();
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async () => {
    const url = window.location.origin + `/3d/${dishId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${dishName} at The Golden Oak`,
          url: url,
        });
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          void handleCopy();
        }
      }
    } else {
      void handleCopy();
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-obsidian/65 backdrop-blur-xs z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal={isOpen}
        aria-label="Share this dish"
        className={`fixed bottom-0 left-0 right-0 sm:max-w-md sm:mx-auto sm:bottom-6 z-[65] bg-obsidian/95 backdrop-blur-xl border-t sm:border border-border-subtle rounded-t-3xl sm:rounded-3xl max-h-[70dvh] overflow-y-auto pb-safe transition-all duration-300 transform ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full sm:translate-y-8 opacity-0 pointer-events-none'
        }`}
      >
        <div className="p-4 sm:p-5 flex flex-col items-center relative">
          <div className="w-10 h-1 rounded-full bg-white/20 mb-3 sm:hidden" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share sheet"
            className="absolute top-3 right-3 min-w-[44px] min-h-[44px] rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-primary/70 hover:text-text-primary cursor-pointer touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-semibold text-text-primary mb-5 mt-1">Share this dish</h3>
          
          <div className="flex flex-row gap-6 sm:gap-8 justify-center w-full pb-2">
            {/* Share Button */}
            <button type="button" onClick={handleShare} className="min-w-[48px] min-h-[48px] flex flex-col items-center gap-2 group focus:outline-none cursor-pointer touch-manipulation">
              <div className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-border-subtle flex items-center justify-center group-active:scale-95 transition-transform">
                <Share2 className="w-5 h-5 text-text-primary" />
              </div>
              <span className="text-[10px] text-text-primary/70">Share</span>
            </button>

            {/* Copy Link Button */}
            <button type="button" onClick={handleCopy} className="min-w-[48px] min-h-[48px] flex flex-col items-center gap-2 group focus:outline-none cursor-pointer touch-manipulation">
              <div className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-border-subtle flex items-center justify-center group-active:scale-95 transition-transform relative">
                <Link2 className="w-5 h-5 text-text-primary" />
              </div>
              <span className="text-[10px] text-text-primary/70">{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            {/* QR Code Modal Button */}
            {onShowQRCode && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onShowQRCode();
                }}
                className="min-w-[48px] min-h-[48px] flex flex-col items-center gap-2 group focus:outline-none cursor-pointer touch-manipulation"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#F0C36B]/10 hover:bg-[#F0C36B]/20 border border-[#F0C36B]/40 flex items-center justify-center group-active:scale-95 transition-transform">
                  <QrCode className="w-5 h-5 text-[#F0C36B]" />
                </div>
                <span className="text-[10px] text-[#FFE1A0]">QR Code</span>
              </button>
            )}

            {/* View in 3D Button */}
            <Link href={`/3d/${dishId}`} className="min-w-[48px] min-h-[48px] flex flex-col items-center gap-2 group focus:outline-none touch-manipulation">
              <div className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-border-subtle flex items-center justify-center group-active:scale-95 transition-transform">
                <Box className="w-5 h-5 text-text-primary" />
              </div>
              <span className="text-[10px] text-text-primary/70">View in 3D</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
