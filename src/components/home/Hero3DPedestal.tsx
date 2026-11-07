'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { RotateCw, Box, Eye, Layers, RotateCcw } from 'lucide-react';
import { useQualityTier } from '@/hooks/useQualityTier';

const HeroWarriorCanvas = dynamic(
  () => import('./HeroWarriorCanvas').then((mod) => ({ default: mod.HeroWarriorCanvas })),
  { ssr: false }
);

export interface Hero3DPedestalProps {
  render3DModel?: boolean;
}

export function Hero3DPedestal({ render3DModel = false }: Hero3DPedestalProps = {}) {
  const quality = useQualityTier();
  const [autoRotate, setAutoRotate] = useState(true);
  const [userToggledRotate, setUserToggledRotate] = useState(false);
  const [showCallouts, setShowCallouts] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isDocumentHidden, setIsDocumentHidden] = useState(false);
  const [isSaveData, setIsSaveData] = useState(false);

  const rotationRef = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0, rotX: 0, rotY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const applyStageTransform = useCallback((x: number, y: number) => {
    rotationRef.current = { x, y };
    if (stageRef.current) {
      stageRef.current.style.transform = `perspective(1000px) rotateX(${x}deg) rotateY(${y}deg)`;
    }
  }, []);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      setIsSaveData(Boolean(conn?.saveData));
    }
  }, []);

  // Viewport visibility observer: Pauses Hero pedestal/WebGL work as soon as scrolled past Hero
  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05, rootMargin: '50px' }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Document visibility listener: Pauses work completely when browser tab is backgrounded
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const syncVisibility = () => {
      setIsDocumentHidden(document.visibilityState === 'hidden' || document.hidden);
    };
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    return () => document.removeEventListener('visibilitychange', syncVisibility);
  }, []);

  const isUltraLowPower =
    quality.isLowPower ||
    quality.isSoftwareGpu ||
    isSaveData ||
    (typeof quality.deviceMemory === 'number' && quality.deviceMemory <= 2);

  const effectiveAutoRotate =
    autoRotate && (userToggledRotate || (!quality.prefersReducedMotion && !isUltraLowPower));
  const isStageActive = isVisible && !isDocumentHidden;

  // Direct DOM rAF auto-rotation loop (zero React re-renders per frame; skipped when WebGL canvas handles rotation)
  useEffect(() => {
    if (render3DModel || !effectiveAutoRotate || isDragging || !isStageActive) return;

    let animId: number | null = null;
    let lastTime: number | null = null;

    const step = (time: number) => {
      if (document.hidden) {
        lastTime = null;
        return;
      }
      if (lastTime !== null) {
        const delta = Math.min(time - lastTime, 100);
        const degStep = delta * 0.01;
        const nextY = (rotationRef.current.y + degStep) % 360;
        applyStageTransform(rotationRef.current.x, nextY);
      }
      lastTime = time;
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [render3DModel, effectiveAutoRotate, isDragging, isStageActive, applyStageTransform]);

  // Interactive mouse drag to rotate
  const handleMouseDown = (e: React.MouseEvent) => {
    if (render3DModel) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      rotX: rotationRef.current.x,
      rotY: rotationRef.current.y,
    };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (render3DModel || !isStageActive) return;
      if (!isDragging) {
        // Subtle 3D perspective tilt on hover (direct DOM update, zero React re-renders)
        if (containerRef.current && !quality.prefersReducedMotion) {
          const rect = containerRef.current.getBoundingClientRect();
          const normY = (e.clientY - rect.top) / rect.height - 0.5;
          applyStageTransform(normY * -12, rotationRef.current.y);
        }
        return;
      }

      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;
      const nextX = Math.max(-18, Math.min(18, dragStart.current.rotX - deltaY * 0.15));
      const nextY = dragStart.current.rotY + deltaX * 0.4;
      applyStageTransform(nextX, nextY);
    },
    [render3DModel, isStageActive, isDragging, quality.prefersReducedMotion, applyStageTransform]
  );

  const handleMouseUp = () => {
    if (isDragging) setIsDragging(false);
  };

  const handleReset = () => {
    applyStageTransform(0, 0);
    setUserToggledRotate(true);
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

      {/* Main Interactive Truffle Pizza / Optional WebGL Showcase on Turntable Plinth */}
      <div
        ref={stageRef}
        onMouseDown={handleMouseDown}
        className="relative w-[340px] h-[340px] sm:w-[440px] sm:h-[400px] z-20 flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform duration-100 ease-out"
        style={{
          transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
        }}
      >
        {/* Glowing Molten Gold Neon Ring on Circular Turntable Plinth */}
        <div
          className={`absolute bottom-6 sm:bottom-7 w-[290px] sm:w-[380px] h-[75px] rounded-[100%] border-[2.5px] border-[#F0C36B] shadow-[0_0_40px_rgba(240,195,107,0.85),inset_0_0_20px_rgba(240,195,107,0.5)] pointer-events-none ${
            isStageActive && !quality.prefersReducedMotion ? 'animate-pulse' : ''
          }`}
          style={{ transform: 'rotateX(68deg)' }}
        />
        <div
          className="absolute bottom-5 sm:bottom-6 w-[270px] sm:w-[360px] h-[65px] rounded-[100%] bg-gradient-to-t from-[#F0C36B]/35 via-black/80 to-transparent blur-[3px] pointer-events-none"
          style={{ transform: 'rotateX(68deg)' }}
        />

        {render3DModel ? (
          <div className="relative w-full h-full">
            <HeroWarriorCanvas autoRotate={effectiveAutoRotate} isVisible={isStageActive} />
          </div>
        ) : (
          /* High-Resolution Artisanal Wood-Fired Pizza Showcase */
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
        )}
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
          onClick={() => {
            setUserToggledRotate(true);
            setAutoRotate(!autoRotate);
          }}
          className="flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-90 group cursor-pointer"
          title="Toggle Auto-Rotation"
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              effectiveAutoRotate
                ? 'bg-[#F0C36B]/25 border border-[#F0C36B] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_16px_rgba(240,195,107,0.4)]'
                : 'bg-white/[0.04] border border-white/10 group-hover:border-[#F0C36B]/50 group-hover:bg-[#F0C36B]/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
            }`}
          >
            <RotateCw
              className={`w-4 h-4 ${
                isStageActive && effectiveAutoRotate
                  ? 'animate-spin text-[#F0C36B]'
                  : effectiveAutoRotate
                    ? 'text-[#F0C36B]'
                    : 'text-[#D2C3AD]'
              }`}
              style={isStageActive && effectiveAutoRotate ? { animationDuration: '4s' } : undefined}
            />
          </div>
          <span
            className={`text-[9.5px] font-medium leading-none ${
              effectiveAutoRotate ? 'text-[#FFE1A0]' : 'text-[#A99B8B]'
            }`}
          >
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
