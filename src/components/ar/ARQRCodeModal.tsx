'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  X,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export interface ARQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dishName: string;
  dishSlug: string;
  dishImage?: string;
  dishPrice?: number;
}

export function ARQRCodeModal({
  isOpen,
  onClose,
  dishName,
  dishSlug,
  dishImage,
  dishPrice,
}: ARQRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://thegoldenoak.in';
  const shareUrl = `${origin}/ar/${dishSlug}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&color=0D0A08&bgcolor=FAF5EC&data=${encodeURIComponent(
    shareUrl
  )}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2200);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Scan QR code to view ${dishName} in AR`}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-[rgba(18,14,11,0.96)] backdrop-blur-2xl border border-[#F0C36B]/50 shadow-[0_24px_60px_rgba(0,0,0,0.92),inset_0_1px_1px_rgba(255,255,255,0.2)] p-6 flex flex-col items-center text-center text-[#FAF5EC] max-h-[92dvh] overflow-y-auto hide-scrollbar">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close QR Modal"
          className="absolute top-4 right-4 min-w-[40px] min-h-[40px] rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-[#D2C3AD] hover:text-[#FAF5EC] transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0C36B]/15 border border-[#F0C36B]/35 text-[#FFE1A0] text-[10px] font-mono uppercase tracking-wider mb-3">
          <Sparkles className="w-3 h-3 text-[#F0C36B]" />
          <span>Mobile Table Placement</span>
        </div>

        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF5EC] mb-1">
          Scan to View in AR
        </h3>
        <p className="text-xs text-[#A99B8B] max-w-[260px] mb-4">
          Point your iPhone or Android camera at the QR code to project <span className="text-[#FFE1A0] font-semibold">{dishName}</span> onto your table in 1:1 scale.
        </p>

        {/* QR Code Container with High-End Platter Styling */}
        <div className="relative p-3.5 rounded-2xl bg-[#FAF5EC] border-2 border-[#F0C36B] shadow-[0_8px_32px_rgba(240,195,107,0.3)] mb-4 flex items-center justify-center">
          {!imgError ? (
            <img
              src={qrApiUrl}
              alt={`QR Code for ${dishName} AR experience`}
              className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
              loading="eager"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-48 h-48 sm:w-52 sm:h-52 flex flex-col items-center justify-center p-3 text-[#120E0B] text-center">
              <QrCode className="w-16 h-16 text-[#B58228] mb-2" />
              <span className="text-xs font-serif font-bold">The Golden Oak AR</span>
              <span className="text-[10px] text-[#554331] mt-1 break-all line-clamp-3 font-mono">
                {shareUrl}
              </span>
            </div>
          )}

          {/* Golden Oak Stamp in center if image loads cleanly */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-[#FAF5EC] border-2 border-[#F0C36B] shadow-md flex items-center justify-center">
              <span className="font-serif text-[11px] font-bold text-[#120E0B]">GO</span>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="w-full bg-black/40 border border-white/[0.08] rounded-2xl p-3 mb-4 text-left space-y-1.5 text-[11px] text-[#D2C3AD]">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-[#F0C36B]/25 text-[#FFE1A0] text-[9.5px] font-mono font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <span>Open your phone camera app</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-[#F0C36B]/25 text-[#FFE1A0] text-[9.5px] font-mono font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <span>Point camera at this screen</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-[#F0C36B]/25 text-[#FFE1A0] text-[9.5px] font-mono font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <span>Tap banner to place dish in 1:1 true scale</span>
          </div>
        </div>

        {/* Copy Link Alternative */}
        <div className="w-full space-y-2">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-[#F0C36B]/40 text-[#FFE1A0] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#36D6A0]" />
                <span className="text-[#36D6A0]">Direct Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#F0C36B]" />
                <span>Copy Direct AR URL for Mobile</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
