'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Camera, Box, ArrowLeft, QrCode, Copy, Check } from 'lucide-react';
import Link from 'next/link';

interface ARUnsupportedProps {
  dishId: string;
  dishName?: string;
  onGoBack: () => void;
}

export function ARUnsupported({ dishId, dishName = 'Dish', onGoBack }: ARUnsupportedProps) {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0705] px-4 sm:px-6 select-none overflow-y-auto py-8">
      {/* Background Ambient Warm Spotlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(240, 195, 107, 0.15) 0%, rgba(10, 7, 5, 0.95) 60%)',
        }}
      />

      {/* Main Glassmorphic Dialog Card */}
      <div className="relative z-10 w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[rgba(18,14,11,0.85)] backdrop-blur-2xl border border-[#F0C36B]/50 shadow-[0_24px_60px_rgba(0,0,0,0.88),inset_0_1px_1px_rgba(255,255,255,0.18)] flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Glowing Device Icon with Rear Camera Indicator */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#1C1612] to-[#2B1F16] border border-[#F0C36B]/60 shadow-[0_0_30px_rgba(240,195,107,0.3)] text-[#F0C36B]">
            <Smartphone className="w-10 h-10 text-[#F0C36B]" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#E0532B] border-2 border-[#0A0705] flex items-center justify-center text-white shadow-md">
            <Camera className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Exact User Requested Heading */}
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#F8F2E8] mb-2 leading-tight">
          Please open on phone due to unsupported back camera
        </h2>

        {/* Informative Subtitle */}
        <p className="text-xs sm:text-sm text-[#D4C7B6] max-w-sm mb-6 font-light leading-relaxed">
          Augmented Reality table placement requires a mobile smartphone equipped with an environment-facing back camera. Laptops and desktop PCs do not have the required rear camera hardware to place dishes in your physical space.
        </p>

        {/* QR Code / Mobile Link Section */}
        <div className="w-full p-4 rounded-2xl bg-black/50 border border-white/10 mb-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#F0C36B]">
            <QrCode className="w-4 h-4" />
            <span>Open on Mobile Smartphone</span>
          </div>

          <p className="text-[11px] text-[#A69F94] font-light max-w-xs">
            Open your smartphone camera and scan your current browser address or copy the link to WhatsApp / AirDrop.
          </p>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 px-3 rounded-xl bg-white/[0.05] hover:bg-[#F0C36B]/15 border border-[#F0C36B]/40 hover:border-[#F0C36B] text-xs font-mono font-medium text-[#FAF5EC] flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#36D6A0]" />
                <span className="text-[#36D6A0] font-bold">Link Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#F0C36B]" />
                <span>Copy Page Link for Mobile Phone</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          <Link
            href={`/3d/${dishId}`}
            className="w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide text-[#17100C] shadow-[0_8px_25px_rgba(240,195,107,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
            }}
          >
            <Box className="w-4 h-4 text-[#17100C]" />
            <span>View in 3D Mode Instead</span>
          </Link>

          <button
            type="button"
            onClick={onGoBack}
            className="w-full py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#FAF5EC] font-medium text-xs border border-white/10 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#A99A88]" />
            <span>Return to Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
