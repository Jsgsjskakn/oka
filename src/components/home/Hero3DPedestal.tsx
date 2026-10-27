'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RotateCw, Box, Eye, Layers, RotateCcw } from 'lucide-react';

export function Hero3DPedestal() {
  const [autoRotate, setAutoRotate] = useState(true);
  const [showCallouts, setShowCallouts] = useState(true);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, rotX: 0, rotY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Gentle auto-rotation when not interacting
  useEffect(() => {
    if (!autoRotate || isDragging) return;
    const interval = setInterval(() => {
      setRotation((prev) => ({
        ...prev,
        y: (prev.y + 0.3) % 360,
      }));
    }, 30);
    return () => clearInterval(interval);
  }, [autoRotate, isDragging]);

  // Interactive mouse drag to rotate
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      rotX: rotation.x,
      rotY: rotation.y,
    };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) {
        // Subtle 3D perspective tilt on hover
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const normX = (e.clientX - rect.left) / rect.width - 0.5;
          const normY = (e.clientY - rect.top) / rect.height - 0.5;
          setRotation((prev) => ({
            ...prev,
            x: normY * -12,
          }));
        }
        return;
      }

      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;
      setRotation({
        x: Math.max(-18, Math.min(18, dragStart.current.rotX - deltaY * 0.15)),
        y: dragStart.current.rotY + deltaX * 0.4,
      });
    },
    [isDragging]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setRotation({ x: 0, y: 0 });
    setAutoRotate(true);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full max-w-[560px] h-[410px] sm:h-[450px] mx-auto flex items-center justify-center select-none"
    >
      {/* Warm Ambient Gold Radial Glow Aura */}
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-[#F0C36B]/25 via-[#DDA33E]/08 to-transparent blur-3xl rounded-full" />

      {/* Floating Ingredient Callouts (Matching Reference Screenshot) */}
      {showCallouts && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {/* Top-Center: Black Truffle Oil */}
          <div className="absolute top-2 sm:top-3 left-[46%] -translate-x-1/2 flex flex-col items-center group pointer-events-auto cursor-pointer animate-in fade-in duration-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-[#F0C36B]/20 backdrop-blur-2xl border border-[#F0C36B]/60 hover:border-[#F0C36B] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.7)] hover:scale-105 transition-all">
              <span className="text-sm">💧</span>
              <span className="text-xs font-semibold text-[#F8F2E8] whitespace-nowrap">
                Black Truffle Oil
              </span>
            </div>
            {/* Fine Gold Drop Line with Oil Drop */}
            <svg className="w-6 h-12 overflow-visible -mt-0.5 pointer-events-none">
              <path d="M 12 0 L 12 36" fill="none" stroke="#F0C36B" strokeWidth="1.2" strokeOpacity="0.85" />
              <circle cx="12" cy="36" r="3.5" fill="#F0C36B" />
            </svg>
          </div>

          {/* Top-Right: Aged Parmesan */}
          <div className="absolute top-10 sm:top-12 right-2 sm:right-6 flex flex-col items-center group pointer-events-auto cursor-pointer animate-in fade-in duration-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-[#F0C36B]/20 backdrop-blur-2xl border border-[#F0C36B]/60 hover:border-[#F0C36B] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.7)] hover:scale-105 transition-all">
              <span className="text-sm">🧀</span>
              <span className="text-xs font-semibold text-[#F8F2E8] whitespace-nowrap">
                Aged Parmesan
              </span>
            </div>
            {/* Fine Leader Line */}
            <svg className="w-14 h-12 overflow-visible -mt-0.5 pointer-events-none">
              <path d="M 28 0 L 28 20 L 6 42" fill="none" stroke="#F0C36B" strokeWidth="1.2" strokeOpacity="0.85" />
              <circle cx="6" cy="42" r="3" fill="#F0C36B" />
            </svg>
          </div>

          {/* Mid-Left: Wild Mushrooms */}
          <div className="absolute top-[36%] left-0 sm:left-2 flex flex-col items-center group pointer-events-auto cursor-pointer animate-in fade-in duration-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-[#F0C36B]/20 backdrop-blur-2xl border border-[#F0C36B]/60 hover:border-[#F0C36B] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.7)] hover:scale-105 transition-all">
              <span className="text-sm">🍄</span>
              <span className="text-xs font-semibold text-[#F8F2E8] whitespace-nowrap">
                Wild Mushrooms
              </span>
            </div>
            {/* Fine Leader Line */}
            <svg className="w-14 h-12 overflow-visible -mt-0.5 pointer-events-none">
              <path d="M 28 0 L 28 18 L 48 40" fill="none" stroke="#F0C36B" strokeWidth="1.2" strokeOpacity="0.85" />
              <circle cx="48" cy="40" r="3" fill="#F0C36B" />
            </svg>
          </div>

          {/* Mid-Right: Fresh Thyme */}
          <div className="absolute top-[48%] right-0 sm:right-3 flex flex-col items-center group pointer-events-auto cursor-pointer animate-in fade-in duration-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-[#F0C36B]/20 backdrop-blur-2xl border border-[#F0C36B]/60 hover:border-[#F0C36B] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.7)] hover:scale-105 transition-all">
              <span className="text-sm">🌿</span>
              <span className="text-xs font-semibold text-[#F8F2E8] whitespace-nowrap">
                Fresh Thyme
              </span>
            </div>
            {/* Fine Leader Line */}
            <svg className="w-14 h-12 overflow-visible -mt-0.5 pointer-events-none">
              <path d="M 28 0 L 28 18 L 8 40" fill="none" stroke="#F0C36B" strokeWidth="1.2" strokeOpacity="0.85" />
              <circle cx="8" cy="40" r="3" fill="#F0C36B" />
            </svg>
          </div>
        </div>
      )}

      {/* Main Interactive Truffle Pizza 3D Showcase on Turntable Plinth */}
      <div
        onMouseDown={handleMouseDown}
        className="relative w-[340px] h-[340px] sm:w-[440px] sm:h-[400px] z-20 flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform duration-100 ease-out"
        style={{
          transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {/* Glowing Molten Gold Neon Ring on Circular Turntable Plinth */}
        <div
          className="absolute bottom-6 sm:bottom-7 w-[290px] sm:w-[380px] h-[75px] rounded-[100%] border-[2.5px] border-[#F0C36B] shadow-[0_0_40px_rgba(240,195,107,0.85),inset_0_0_20px_rgba(240,195,107,0.5)] pointer-events-none animate-pulse"
          style={{ transform: 'rotateX(68deg)' }}
        />
        <div
          className="absolute bottom-5 sm:bottom-6 w-[270px] sm:w-[360px] h-[65px] rounded-[100%] bg-gradient-to-t from-[#F0C36B]/35 via-black/80 to-transparent blur-[3px] pointer-events-none"
          style={{ transform: 'rotateX(68deg)' }}
        />

        {/* High-Resolution Artisanal Wood-Fired Pizza Showcase */}
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
          <Image
            src="/images/dishes/hero-pizza-full-showcase.png"
            alt="The Golden Oak Artisanal Wood-Fired Mushroom Truffle Pizza"
            fill
            priority
            sizes="(max-width: 768px) 340px, 440px"
            className="object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)]"
          />
        </div>
      </div>

      {/* Floating Drag Hint Pill Directly Beneath Pedestal */}
      <Link
        href="/3d/mushroom-truffle-pizza"
        className="absolute bottom-1 sm:bottom-2 z-30 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs text-[#F8F2E8] transition-all hover:border-[#F0C36B] hover:text-[#F0C36B] group shadow-2xl"
        style={{
          background: 'rgba(16, 12, 9, 0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(240, 195, 107, 0.45)',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 8px 28px rgba(0, 0, 0, 0.6)',
        }}
      >
        <RotateCw className="w-3.5 h-3.5 text-[#F0C36B] group-hover:rotate-180 transition-transform duration-500" />
        <span className="font-medium tracking-wide">Drag to Rotate 360° · Live 3D Menu</span>
        <Box className="w-3.5 h-3.5 text-[#F0C36B]/90 ml-0.5" />
      </Link>

      {/* Floating Vertical 3D Controls Dock on Far Right */}
      <div className="hidden xl:flex absolute -right-12 sm:-right-16 top-1/2 -translate-y-1/2 z-30 flex-col gap-2 p-2 rounded-full bg-[rgba(16,12,9,0.55)] backdrop-blur-2xl border border-[#F0C36B]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.18),0_16px_40px_rgba(0,0,0,0.65)]">
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className="flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-90 group cursor-pointer"
          title="Toggle Auto-Rotation"
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              autoRotate
                ? 'bg-[#F0C36B]/25 border border-[#F0C36B] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_16px_rgba(240,195,107,0.4)]'
                : 'bg-white/[0.04] border border-white/10 group-hover:border-[#F0C36B]/50 group-hover:bg-[#F0C36B]/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
            }`}
          >
            <RotateCw
              className={`w-4 h-4 ${autoRotate ? 'animate-spin text-[#F0C36B]' : 'text-[#D2C3AD]'}`}
              style={autoRotate ? { animationDuration: '4s' } : undefined}
            />
          </div>
          <span className={`text-[9.5px] font-medium leading-none ${autoRotate ? 'text-[#FFE1A0]' : 'text-[#A99B8B]'}`}>
            Rotate
          </span>
        </button>

        <div className="w-5 h-[1px] bg-white/10 mx-auto" />

        <button
          type="button"
          onClick={() => setShowCallouts(!showCallouts)}
          className="flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-90 group cursor-pointer"
          title="Toggle Ingredient Pins"
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              showCallouts
                ? 'bg-[#F0C36B]/25 border border-[#F0C36B] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_16px_rgba(240,195,107,0.4)]'
                : 'bg-white/[0.04] border border-white/10 group-hover:border-[#F0C36B]/50 group-hover:bg-[#F0C36B]/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
            }`}
          >
            <Layers className={`w-4 h-4 ${showCallouts ? 'text-[#F0C36B]' : 'text-[#D2C3AD]'}`} />
          </div>
          <span className={`text-[9.5px] font-medium leading-none ${showCallouts ? 'text-[#FFE1A0]' : 'text-[#A99B8B]'}`}>
            Layers
          </span>
        </button>

        <div className="w-5 h-[1px] bg-white/10 mx-auto" />

        <Link
          href="/3d/mushroom-truffle-pizza"
          className="flex flex-col items-center justify-center gap-1 py-1 text-[#D2C3AD] hover:text-[#F8F2E8] transition-all active:scale-90 group"
          title="View 3D Food Studio"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/10 group-hover:border-[#F0C36B]/50 group-hover:bg-[#F0C36B]/15 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <Eye className="w-4 h-4 text-[#D2C3AD] group-hover:text-[#F0C36B]" />
          </div>
          <span className="text-[9.5px] font-medium leading-none text-[#A99B8B] group-hover:text-[#D2C3AD]">
            View
          </span>
        </Link>

        <div className="w-5 h-[1px] bg-white/10 mx-auto" />

        <button
          type="button"
          onClick={handleReset}
          className="flex flex-col items-center justify-center gap-1 py-1 text-[#D2C3AD] hover:text-[#F8F2E8] transition-all active:scale-90 group cursor-pointer"
          title="Reset View"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/10 group-hover:border-[#F0C36B]/50 group-hover:bg-[#F0C36B]/15 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <RotateCcw className="w-4 h-4 text-[#D2C3AD] group-hover:text-[#F0C36B]" />
          </div>
          <span className="text-[9.5px] font-medium leading-none text-[#A99B8B] group-hover:text-[#D2C3AD]">
            Reset
          </span>
        </button>
      </div>
    </div>
  );
}
