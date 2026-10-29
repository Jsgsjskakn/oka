'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  RotateCw,
  Plus,
  Minus,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Box,
  Leaf,
  Layers,
  Sparkles,
  Compass,
  ArrowRight,
  QrCode,
  X,
  Smartphone,
} from 'lucide-react';
import { toast } from '@/store/toast-store';

const PromoWarriorCanvas = dynamic(
  () => import('./PromoWarriorCanvas').then((mod) => ({ default: mod.PromoWarriorCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#100C09] text-[#F0C36B]">
        <div className="w-10 h-10 rounded-full border-2 border-[#F0C36B]/20 border-t-[#F0C36B] animate-spin mb-2" />
        <span className="text-[10px] font-mono tracking-widest uppercase">Loading 3D Model...</span>
      </div>
    ),
  }
);

interface DishPreviewData {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  category: string;
  scale: string;
  image: string;
  price: number;
}

const PREVIEW_DISHES: DishPreviewData[] = [
  {
    id: 'tandoori-paneer-pizza',
    slug: 'tandoori-paneer-pizza',
    name: 'Tandoori Paneer Pizza',
    emoji: '🍕',
    category: 'Wood-Fired Pizza',
    scale: '32 cm • 8 Slices',
    image: '/images/dishes/tandoori-paneer-pizza.webp',
    price: 449,
  },
  {
    id: 'classic-smash-burger',
    slug: 'classic-smash-burger',
    name: 'Classic Smash Burger',
    emoji: '🍔',
    category: 'Handcrafted Burger',
    scale: '180g Double Patty • 12 cm',
    image: '/images/dishes/classic-smash-burger.webp',
    price: 349,
  },
  {
    id: 'dynamite-chilli-potatoes',
    slug: 'dynamite-chilli-potatoes',
    name: 'Dynamite Chilli Potatoes',
    emoji: '🍟',
    category: 'Crispy Fusion Tapas',
    scale: 'Signature Bowl • Single Share',
    image: '/images/dishes/dynamite-chilli-potatoes.webp',
    price: 249,
  },
];

export function ARPromoSection() {
  const [activeDishIndex, setActiveDishIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [showQRModal, setShowQRModal] = useState(false);

  const currentDish = PREVIEW_DISHES[activeDishIndex];

  const handleSelectDish = useCallback((index: number) => {
    const safeIndex = (index + PREVIEW_DISHES.length) % PREVIEW_DISHES.length;
    setActiveDishIndex(safeIndex);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const handleToggleRotate = useCallback(() => {
    setAutoRotate((prev) => {
      const next = !prev;
      toast.info(next ? 'Auto-rotation resumed' : 'Auto-rotation paused');
      return next;
    });
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(8);
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((z) => Math.min(1.4, Number((z + 0.15).toFixed(2))));
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(6);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((z) => Math.max(0.75, Number((z - 0.15).toFixed(2))));
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(6);
    }
  }, []);

  const handleOpenAR = useCallback(() => {
    const isMobile =
      typeof window !== 'undefined' &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `/ar/${currentDish.slug}`;
    } else {
      setShowQRModal(true);
    }
  }, [currentDish.slug]);

  return (
    <section className="px-4 sm:px-6 md:px-10 lg:px-12 py-12 sm:py-16 max-w-[1360px] mx-auto w-full select-none">
      {/* Outer Card: Deep Obsidian Glass Frame Directly Matching User Reference */}
      <div
        className="relative overflow-hidden rounded-3xl sm:rounded-[36px] border border-[#F0C36B]/35 p-6 sm:p-10 lg:p-12 xl:p-14 shadow-[0_30px_90px_rgba(0,0,0,0.92)] group"
        style={{
          background: 'linear-gradient(135deg, rgba(16,12,9,0.94) 0%, rgba(22,17,13,0.92) 50%, rgba(12,9,7,0.96) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Radial Warm Golden Ambient Aura behind the 3D stage */}
        <div
          className="pointer-events-none absolute -top-24 right-0 w-[650px] h-[650px] rounded-full blur-3xl opacity-35"
          style={{
            background: 'radial-gradient(circle, rgba(240, 195, 107, 0.28) 0%, rgba(197, 143, 46, 0.10) 45%, transparent 70%)',
          }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* ========================================================================= */}
          {/* LEFT SIDE (lg:col-span-7): Editorial, Highlights, CTAs & Pagination       */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* 1. Overline Badge: [ ⦿ INTERACTIVE 3D EXPERIENCE ] */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#F0C36B]/40 bg-black/50 text-[#F0C36B] font-mono text-[10px] tracking-[0.22em] uppercase font-semibold shadow-md mb-3">
              <span className="w-2 h-2 rounded-full border border-[#F0C36B] flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-[#F0C36B] animate-pulse" />
              </span>
              <span>Interactive 3D Experience</span>
            </div>

            {/* 2. Main Heading: Explore Dishes in / Interactive 3D & AR */}
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[46px] xl:text-[52px] leading-[1.12] font-bold text-[#F8F2E8] tracking-tight mb-3">
              Explore Dishes in{' '}
              <span className="font-serif italic font-normal text-[#F0C36B] block sm:inline">
                Interactive 3D &amp; AR
              </span>
            </h2>

            {/* 3. Subtext Description */}
            <p className="text-xs sm:text-sm text-[#D4C7B6] font-light leading-relaxed mb-6 max-w-xl">
              Discover every detail, explore ingredients, and experience our signature dishes in stunning 3D and AR.
            </p>

            {/* 4. Interactive Preview Dish Pills Row */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-6 w-full overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] uppercase tracking-wider text-[#A69B8D] font-bold font-mono mr-1 shrink-0">
                PREVIEW DISH:
              </span>
              {PREVIEW_DISHES.map((dish, idx) => {
                const isActive = activeDishIndex === idx;
                return (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => handleSelectDish(idx)}
                    className={`px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-serif font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer select-none active:scale-97 shrink-0 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#F0C36B] to-[#D4A346] text-[#120E0B] shadow-[0_2px_14px_rgba(240,195,107,0.45)] ring-1 ring-[#FFE3A5]/50'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-[#D8CFBE] hover:text-[#FAF5EC] border border-white/10 hover:border-[#F0C36B]/40'
                    }`}
                  >
                    <span>{dish.emoji}</span>
                    <span>{dish.name}</span>
                  </button>
                );
              })}
            </div>

            {/* 5. Four Feature Highlight Badges Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-7 w-full max-w-2xl">
              {/* Badge 1: Interactive 3D */}
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/45 border border-white/10 shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-[#F0C36B]/15 border border-[#F0C36B]/30 flex items-center justify-center shrink-0">
                  <Box className="w-3.5 h-3.5 text-[#F0C36B]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-[#F8F2E8] truncate">Interactive 3D</span>
                  <span className="text-[9px] text-[#A69B8D] truncate">Rotate • Zoom • Explore</span>
                </div>
              </div>

              {/* Badge 2: Real Ingredients */}
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/45 border border-white/10 shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-[#3EE094]/15 border border-[#3EE094]/30 flex items-center justify-center shrink-0">
                  <Leaf className="w-3.5 h-3.5 text-[#3EE094]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-[#F8F2E8] truncate">Real Ingredients</span>
                  <span className="text-[9px] text-[#A69B8D] truncate">See What&apos;s Inside</span>
                </div>
              </div>

              {/* Badge 3: AR Experience */}
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/45 border border-white/10 shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-[#F0C36B]/15 border border-[#F0C36B]/30 flex items-center justify-center shrink-0">
                  <Maximize2 className="w-3.5 h-3.5 text-[#F0C36B]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-[#F8F2E8] truncate">AR Experience</span>
                  <span className="text-[9px] text-[#A69B8D] truncate">View in Your Space</span>
                </div>
              </div>

              {/* Badge 4: 360° View */}
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/45 border border-white/10 shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-[#F0C36B]/15 border border-[#F0C36B]/30 flex items-center justify-center shrink-0">
                  <RotateCw className="w-3.5 h-3.5 text-[#F0C36B]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-[#F8F2E8] truncate">360° View</span>
                  <span className="text-[9px] text-[#A69B8D] truncate">Every Angle, Detail</span>
                </div>
              </div>
            </div>

            {/* 6. Action CTA Pair */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mb-7">
              {/* Primary Launch 3D Food Lounge Button */}
              <Link
                href={`/3d/${currentDish.slug}`}
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#F0C36B] via-[#E2A84B] to-[#C99132] text-[#120E0B] font-serif font-bold text-xs sm:text-[13px] shadow-[0_4px_25px_rgba(240,195,107,0.35)] hover:shadow-[0_6px_30px_rgba(240,195,107,0.55)] active:scale-98 transition-all cursor-pointer border border-[#FFE3A5]/40"
              >
                <Box className="w-4 h-4 text-[#120E0B] group-hover:scale-110 transition-transform" />
                <span>Launch 3D Food Lounge</span>
                <ArrowRight className="w-4 h-4 text-[#120E0B] group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Secondary Instant AR Button */}
              <button
                type="button"
                onClick={handleOpenAR}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-[#F0C36B]/40 bg-white/[0.04] hover:bg-[#F0C36B]/15 text-[#FAF5EC] hover:text-white font-serif font-bold text-xs sm:text-[13px] active:scale-98 transition-all cursor-pointer shadow-sm"
              >
                <Maximize2 className="w-4 h-4 text-[#F0C36B]" />
                <span>Preview on My Table (AR)</span>
              </button>
            </div>

            {/* 7. Bottom Pagination / Stepper with Navigation Arrows */}
            <div className="flex items-center gap-4 w-full">
              {/* Counter 01 / 03 */}
              <span className="font-mono text-xs font-semibold text-[#F0C36B] tabular-nums">
                {String(activeDishIndex + 1).padStart(2, '0')} / {String(PREVIEW_DISHES.length).padStart(2, '0')}
              </span>

              {/* Animated Progress Track */}
              <div className="w-28 sm:w-36 h-[2px] bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#F0C36B] to-[#FFE3A5] transition-all duration-300 ease-out"
                  style={{
                    width: `${((activeDishIndex + 1) / PREVIEW_DISHES.length) * 100}%`,
                  }}
                />
              </div>

              {/* Left & Right Chevron Arrows */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectDish(activeDishIndex - 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-[#F0C36B]/20 text-[#D8CFBE] hover:text-[#F0C36B] border border-white/10 hover:border-[#F0C36B]/40 active:scale-90 transition-all cursor-pointer"
                  aria-label="Previous preview dish"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDish(activeDishIndex + 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-[#F0C36B]/20 text-[#D8CFBE] hover:text-[#F0C36B] border border-white/10 hover:border-[#F0C36B]/40 active:scale-90 transition-all cursor-pointer"
                  aria-label="Next preview dish"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT SIDE (lg:col-span-5): 3D Model Stage with Platter & Spatial UI       */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 relative w-full aspect-square max-w-[460px] mx-auto flex items-center justify-center">
            
            {/* Top Right Active Dish Pill */}
            <Link
              href={`/3d/${currentDish.slug}`}
              className="absolute -top-3 right-0 sm:right-2 z-30 px-3.5 py-1.5 rounded-full bg-[rgba(18,14,11,0.92)] backdrop-blur-md border border-[#F0C36B]/50 text-[#FFE3A5] hover:text-white font-serif font-bold text-xs flex items-center gap-2 shadow-lg hover:border-[#F0C36B] transition-all cursor-pointer group"
              title="Click to open full 3D interactive view"
            >
              <span>{currentDish.emoji}</span>
              <span className="truncate max-w-[150px]">{currentDish.name}</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#F0C36B] group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Top Right Scale / Dimensions Badge */}
            <div className="absolute top-7 right-0 sm:right-2 z-20 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono text-[#FAF5EC]/85 flex items-center gap-1 shadow-md pointer-events-none">
              <span className="text-[#F0C36B]">↗</span>
              <span>{currentDish.scale}</span>
              <span className="text-[#F0C36B]">↙</span>
            </div>

            {/* Glowing Golden Concentric Orbital Rings */}
            <div className="absolute inset-2 sm:inset-4 pointer-events-none flex items-center justify-center">
              {/* Outer Golden Dash Orbit */}
              <div className="w-full h-full rounded-full border border-dashed border-[#F0C36B]/30 animate-[spin_60s_linear_infinite]" />
              {/* Middle Thin Solid Gold Halo */}
              <div className="absolute w-[86%] h-[86%] rounded-full border border-[#F0C36B]/20" />
              {/* Inner Glowing Amber Accent Ring */}
              <div className="absolute w-[72%] h-[72%] rounded-full border border-[#FFE3A5]/25 shadow-[0_0_30px_rgba(240,195,107,0.2)]" />
            </div>

            {/* Left Vertical Floating Controls */}
            <div className="absolute left-0 sm:left-1 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2">
              {/* 1. Rotate Toggle */}
              <button
                type="button"
                onClick={handleToggleRotate}
                className={`w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                  autoRotate
                    ? 'bg-[#F0C36B]/20 border-[#F0C36B] text-[#FFE3A5] ring-2 ring-[#F0C36B]/40'
                    : 'bg-black/75 border-white/15 text-[#D8CFBE] hover:text-[#FAF5EC] hover:border-[#F0C36B]/50'
                }`}
                title={autoRotate ? 'Pause auto-rotation' : 'Start auto-rotation'}
                aria-label="Toggle auto-rotate"
              >
                <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
              </button>

              {/* 2. Zoom In */}
              <button
                type="button"
                onClick={handleZoomIn}
                className="w-9 h-9 rounded-full bg-black/75 backdrop-blur-md border border-white/15 hover:border-[#F0C36B]/50 text-[#D8CFBE] hover:text-[#FAF5EC] flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
                title="Zoom in 3D model"
                aria-label="Zoom in"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {/* 3. Zoom Out */}
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-9 h-9 rounded-full bg-black/75 backdrop-blur-md border border-white/15 hover:border-[#F0C36B]/50 text-[#D8CFBE] hover:text-[#FAF5EC] flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
                title="Zoom out 3D model"
                aria-label="Zoom out"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {/* 4. Fullscreen / Expand */}
              <Link
                href={`/3d/${currentDish.slug}`}
                className="w-9 h-9 rounded-full bg-black/75 backdrop-blur-md border border-white/15 hover:border-[#F0C36B]/50 text-[#D8CFBE] hover:text-[#FAF5EC] flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
                title="Open full interactive 3D lounge"
                aria-label="Expand to full 3D lounge"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Central Round 3D Model Stage: Displays 3D Warrior Model on Platter */}
            <div
              className="relative w-[280px] h-[280px] sm:w-[330px] sm:h-[330px] rounded-full overflow-hidden border-2 border-[#F0C36B]/50 z-10 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(240,195,107,0.3)] bg-gradient-to-b from-[#18130F] via-[#0E0B09] to-[#070504] group/platter"
              title="Drag horizontally to rotate 360°"
            >
              <PromoWarriorCanvas autoRotate={autoRotate} zoomLevel={zoomLevel} />

              {/* Inner Platter Rim Shadow & Specular Sheen */}
              <div
                className="absolute inset-0 pointer-events-none rounded-full"
                style={{
                  boxShadow: 'inset 0 0 45px rgba(0, 0, 0, 0.85), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
                }}
              />
            </div>

            {/* Right Vertical Dish Thumbnail Carousel */}
            <div className="absolute right-0 sm:right-1 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectDish(activeDishIndex - 1)}
                className="w-6 h-6 rounded-md flex items-center justify-center text-[#F0C36B] hover:bg-[#F0C36B]/15 transition-all cursor-pointer"
                aria-label="Previous thumbnail dish"
              >
                <ChevronUp className="w-4 h-4" />
              </button>

              {PREVIEW_DISHES.map((dish, idx) => {
                const isActive = activeDishIndex === idx;
                return (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => handleSelectDish(idx)}
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer shadow-md select-none group ${
                      isActive
                        ? 'border-[#F0C36B] ring-2 ring-[#F0C36B] shadow-[0_0_16px_rgba(240,195,107,0.5)] scale-105'
                        : 'border-white/15 opacity-70 hover:opacity-100 hover:border-white/40'
                    }`}
                    title={`Preview ${dish.name}`}
                  >
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleSelectDish(activeDishIndex + 1)}
                className="w-6 h-6 rounded-md flex items-center justify-center text-[#F0C36B] hover:bg-[#F0C36B]/15 transition-all cursor-pointer"
                aria-label="Next thumbnail dish"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Right Floating AR Badge: [ View in Your Space | Scan with AR ] */}
            <button
              type="button"
              onClick={handleOpenAR}
              className="absolute -bottom-2 right-0 sm:right-2 z-20 px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-[#F0C36B]/50 hover:border-[#F0C36B] text-[#FFE3A5] hover:text-white text-left transition-all shadow-xl flex items-center gap-2 cursor-pointer group"
              title="Experience dish in Augmented Reality"
            >
              <div className="w-6 h-6 rounded-md bg-[#F0C36B]/15 border border-[#F0C36B]/40 flex items-center justify-center shrink-0">
                <Compass className="w-3.5 h-3.5 text-[#F0C36B] group-hover:rotate-45 transition-transform" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-serif font-bold text-[#F8F2E8]">View in Your Space</span>
                <span className="text-[8.5px] font-mono text-[#F0C36B] tracking-wider uppercase">Scan with AR ⛶</span>
              </div>
            </button>
          </div>
        </div>

        {/* Bottom Sub-Bar Pill */}
        <div className="relative mt-8 pt-6 border-t border-white/[0.08] flex items-center justify-end">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[11px] font-medium text-[#FAF5EC]/85 shadow-sm">
            <span className="flex items-center gap-1 text-[#3EE094]">
              <Leaf className="w-3 h-3 text-[#3EE094]" />
              <span>Authentic Flavours</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1 text-[#FFE3A5]">
              <Sparkles className="w-3 h-3 text-[#F0C36B]" />
              <span>Premium Ingredients</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[#FAF5EC]">Crafted with Passion</span>
          </div>
        </div>
      </div>

      {/* Desktop Modal for "Scan with AR" */}
      {showQRModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-sm rounded-3xl bg-[rgba(18,14,11,0.96)] border border-[#F0C36B]/50 p-6 shadow-2xl flex flex-col items-center text-center">
            <button
              type="button"
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#F0C36B]/15 border border-[#F0C36B]/40 flex items-center justify-center text-[#F0C36B] mb-3">
              <Smartphone className="w-6 h-6 text-[#F0C36B]" />
            </div>

            <h3 className="font-serif text-lg font-bold text-[#F8F2E8] mb-1">
              Scan with Your Phone
            </h3>
            <p className="text-xs text-[#D4C7B6] mb-4 leading-relaxed">
              Experience {currentDish.name} in Augmented Reality on your dining table.
            </p>

            {/* QR Code Container */}
            <div className="p-3 bg-white rounded-2xl shadow-inner mb-4 flex items-center justify-center">
              <QrCode className="w-32 h-32 text-black" />
            </div>

            <span className="text-[10px] font-mono uppercase tracking-widest text-[#F0C36B]/80 mb-4">
              Open Camera &amp; Point at Code
            </span>

            <div className="w-full flex items-center gap-2">
              <Link
                href={`/3d/${currentDish.slug}`}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#F0C36B] to-[#D4A346] text-[#120E0B] font-serif font-bold text-xs text-center shadow-md hover:brightness-110 active:scale-98 transition-all"
                onClick={() => setShowQRModal(false)}
              >
                Open 3D Lounge
              </Link>
              <button
                type="button"
                onClick={() => setShowQRModal(false)}
                className="py-2.5 px-4 rounded-xl border border-white/15 text-xs text-[#FAF5EC] hover:bg-white/10 active:scale-98 transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
