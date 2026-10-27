'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ZoomIn, Maximize2, Layers, Box, RotateCw, ArrowRight } from 'lucide-react';

const PromoWarriorCanvas = dynamic(
  () => import('./PromoWarriorCanvas').then((mod) => ({ default: mod.PromoWarriorCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#071B15] text-[#F0C36B]">
        <div className="w-10 h-10 rounded-full border-2 border-[#F0C36B]/20 border-t-[#F0C36B] animate-spin mb-2" />
        <span className="text-[10px] font-mono tracking-widest uppercase">Loading 3D Mesh...</span>
      </div>
    ),
  }
);

const PREVIEW_DISHES = [
  {
    id: 'tandoori-paneer-pizza',
    slug: 'tandoori-paneer-pizza',
    name: 'Tandoori Paneer Pizza',
    category: 'Wood-Fired Sourdough',
    scale: '32 cm · 8 Artisanal Slices',
    ingredients: 'San Marzano & Smoked Fior di Latte',
  },
  {
    id: 'classic-smash-burger',
    slug: 'classic-smash-burger',
    name: 'Classic Smash Burger',
    category: 'Handcrafted Brioche',
    scale: '180g Double Patty · 12 cm',
    ingredients: 'Aged Cheddar & Truffle Aioli',
  },
  {
    id: 'dynamite-chilli-potatoes',
    slug: 'dynamite-chilli-potatoes',
    name: 'Dynamite Chilli Potatoes',
    category: 'Crispy Fusion Tapas',
    scale: 'Signature Bowl · Single Share',
    ingredients: 'Wok Glazed Birds Eye Chilli',
  },
];

export function ARPromoSection() {
  const [activeDishIndex, setActiveDishIndex] = useState(0);
  const currentDish = PREVIEW_DISHES[activeDishIndex];

  return (
    <section className="px-6 md:px-12 py-16 max-w-7xl mx-auto w-full select-none">
      {/* Spatial 3D Showcase Spotlight Container: Deep Forest Luxury Surface */}
      <div
        className="relative overflow-hidden rounded-3xl border p-8 sm:p-12 lg:p-16 shadow-[0_25px_60px_rgba(0,0,0,0.85)] group"
        style={{
          background: 'linear-gradient(135deg, #071B15 0%, #0C251C 50%, #05130E 100%)',
          borderColor: 'rgba(240, 195, 107, 0.25)',
        }}
      >
        {/* Animated Radial Gold & Emerald Ambient Auras */}
        <div
          className="pointer-events-none absolute -top-32 -right-32 w-[550px] h-[550px] rounded-full blur-3xl animate-pulse-glow"
          style={{
            background:
              'radial-gradient(circle, rgba(240, 195, 107, 0.16) 0%, rgba(12, 37, 28, 0.05) 70%, transparent 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-32 w-[450px] h-[450px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(64, 201, 149, 0.12) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Side (55% Width / lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Overline with Pulsing Radar Dot */}
            <div className="flex items-center gap-2.5 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F0C36B] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F0C36B]" />
              </span>
              <span className="text-[11px] uppercase tracking-[0.25em] text-[#F0C36B] font-bold">
                SPATIAL DINING EXPERIENCE
              </span>
            </div>

            {/* Heading: 44px Serif with "Interactive 3D & AR" in Champagne Gold */}
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-[46px] leading-[1.12] font-bold text-[#F8F2E8] mb-4 tracking-tight">
              Explore Dishes in{' '}
              <span className="italic text-[#F0C36B] font-normal block sm:inline">
                Interactive 3D &amp; AR
              </span>
            </h2>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-[#D1C3B1] font-light leading-relaxed mb-8 max-w-xl">
              Explore the details, discover ingredients, and preview available dishes before you order.
            </p>

            {/* Interactive Dish Switcher Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-8 w-full">
              <span className="text-[10px] uppercase tracking-wider text-[#A59685] font-semibold mr-2 block sm:inline">
                PREVIEW DISH:
              </span>
              {PREVIEW_DISHES.map((dish, idx) => {
                const isActive = activeDishIndex === idx;
                return (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => setActiveDishIndex(idx)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
                    style={{
                      background: isActive
                        ? 'rgba(240, 195, 107, 0.22)'
                        : 'rgba(255, 255, 255, 0.04)',
                      borderColor: isActive
                        ? '#F0C36B'
                        : 'rgba(255, 255, 255, 0.1)',
                      borderWidth: '1px',
                      color: isActive ? '#F8F2E8' : '#D1C3B1',
                    }}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-[#F0C36B]' : 'bg-transparent'
                      }`}
                    />
                    <span>{dish.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Truthful Spatial Feature Micro-Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 w-full max-w-xl">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-[#F8F2E8]">
                <Box className="w-3.5 h-3.5 text-[#F0C36B] shrink-0" />
                <span className="truncate">Interactive 3D Viewer</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-[#F8F2E8]">
                <Layers className="w-3.5 h-3.5 text-[#40C995] shrink-0" />
                <span className="truncate">Ingredient Details</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-[#F8F2E8]">
                <RotateCw className="w-3.5 h-3.5 text-[#F0C36B] shrink-0" />
                <span className="truncate">360° Free Rotation</span>
              </div>
            </div>

            {/* Action CTA Pair */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              {/* Primary Launch 3D Food Lounge Button */}
              <Link
                href={`/3d/${currentDish.slug}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-xs sm:text-sm font-bold text-[#17100C] transition-all duration-300 hover:brightness-110 active:scale-[0.98] group shadow-[0_4px_25px_rgba(240,195,107,0.35)] rounded-[8px]"
                style={{
                  background: 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
                }}
              >
                <span>Launch 3D Food Lounge</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              {/* Secondary Instant AR Button */}
              <Link
                href={`/ar/${currentDish.slug}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 text-xs sm:text-sm font-semibold text-[#F8F2E8] border transition-all duration-300 hover:bg-[#12382A] hover:border-[#F0C36B] active:scale-[0.98] rounded-[8px] bg-[rgba(12,37,28,0.65)]"
                style={{
                  borderColor: 'rgba(240, 195, 107, 0.28)',
                }}
              >
                <Box className="w-4 h-4 text-[#F0C36B]" />
                <span>Preview on My Table (AR)</span>
              </Link>
            </div>
          </div>

          {/* Right Side (45% Width / lg:col-span-5) — Interactive 360° Rotatable Platter with Floating Holographic Tags */}
          <div className="lg:col-span-5 relative w-full aspect-square max-w-[440px] mx-auto flex items-center justify-center">
            {/* Concentric Dual Orbital SVG Geometry Rings */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none animate-[spin_45s_linear_infinite]"
              viewBox="0 0 400 400"
              fill="none"
            >
              <ellipse
                cx="200"
                cy="200"
                rx="185"
                ry="135"
                transform="rotate(-20 200 200)"
                stroke="rgba(240, 195, 107, 0.35)"
                strokeWidth="1.5"
                strokeDasharray="6 8"
              />
              <circle cx="50" cy="145" r="4.5" fill="#F0C36B" />
              <circle cx="350" cy="255" r="4.5" fill="#DDA33E" />
            </svg>

            <svg
              className="absolute inset-4 w-[calc(100%-32px)] h-[calc(100%-32px)] pointer-events-none animate-[spin_35s_linear_infinite_reverse]"
              viewBox="0 0 400 400"
              fill="none"
            >
              <ellipse
                cx="200"
                cy="200"
                rx="160"
                ry="115"
                transform="rotate(30 200 200)"
                stroke="rgba(64, 201, 149, 0.25)"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
              <circle cx="200" cy="85" r="3.5" fill="#40C995" />
            </svg>

            {/* Central Round 3D Model Stage */}
            <div
              className="relative w-[270px] h-[270px] sm:w-[320px] sm:h-[320px] rounded-full overflow-hidden border-2 border-[#F0C36B]/50 z-10 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(240,195,107,0.3)] bg-gradient-to-b from-[#18130F] via-[#0E0B09] to-[#070504] group/platter"
              title="Drag horizontally to rotate 360°"
            >
              <PromoWarriorCanvas />

              {/* Inner Platter Rim Shadow & Specular Sheen */}
              <div
                className="absolute inset-0 pointer-events-none rounded-full"
                style={{
                  boxShadow:
                    'inset 0 0 40px rgba(0, 0, 0, 0.8), inset 0 2px 4px rgba(255, 255, 255, 0.15)',
                }}
              />
            </div>

            {/* Floating Holographic Tag 1: Interactive 3D Preview */}
            <div
              className="absolute -top-3 left-0 sm:left-2 z-20 px-3.5 py-1.5 rounded-full text-[11px] font-medium text-[#F8F2E8] shadow-2xl flex items-center gap-2 border pointer-events-none"
              style={{
                background: 'rgba(7, 27, 21, 0.88)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderColor: 'rgba(240, 195, 107, 0.4)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#F0C36B] animate-pulse" />
              <ZoomIn className="w-3.5 h-3.5 text-[#F0C36B]" />
              <span className="font-semibold tracking-wide">Interactive 3D Preview</span>
            </div>

            {/* Floating Holographic Tag 2: True Portion Scale */}
            <div
              className="absolute top-8 -right-2 sm:-right-4 z-20 px-3.5 py-1.5 rounded-full text-[11px] font-medium text-[#F8F2E8] shadow-2xl flex items-center gap-2 border pointer-events-none"
              style={{
                background: 'rgba(7, 27, 21, 0.88)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderColor: 'rgba(240, 195, 107, 0.4)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#40C995] animate-pulse" />
              <Maximize2 className="w-3.5 h-3.5 text-[#F0C36B]" />
              <span className="font-semibold tracking-wide">{currentDish.scale}</span>
            </div>

            {/* Floating Holographic Tag 3: Live Ingredient Layering */}
            <div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full text-[11px] font-medium text-[#F8F2E8] shadow-2xl flex items-center gap-2 whitespace-nowrap border pointer-events-none"
              style={{
                background: 'rgba(7, 27, 21, 0.90)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderColor: 'rgba(240, 195, 107, 0.4)',
              }}
            >
              <Layers className="w-3.5 h-3.5 text-[#F0C36B]" />
              <span className="text-[#F8F2E8] font-semibold">{currentDish.ingredients}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
