'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ZoomIn, Maximize2, Layers, Sparkles, Box, RotateCw, ArrowRight } from 'lucide-react';

const PromoWarriorCanvas = dynamic(
  () => import('./PromoWarriorCanvas').then((mod) => ({ default: mod.PromoWarriorCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0D0A08] text-[#E2A84B]">
        <div className="w-10 h-10 rounded-full border-2 border-[#E2A84B]/20 border-t-[#E2A84B] animate-spin mb-2" />
        <span className="text-[10px] font-mono tracking-widest uppercase">Loading 3D Mesh...</span>
      </div>
    ),
  }
);

const PREVIEW_DISHES = [
  {
    id: 'tandoori-paneer-pizza',
    name: 'Tandoori Paneer Pizza',
    category: 'Wood-Fired Sourdough',
    image: '/images/dishes/tandoori-paneer-pizza.webp',
    scale: '32 cm · 8 Artisanal Slices',
    ingredients: 'San Marzano & Smoked Fior di Latte',
    meshDetails: '48K Polygons · 4K PBR',
  },
  {
    id: 'classic-smash-burger',
    name: 'Classic Smash Burger',
    category: 'Handcrafted Brioche',
    image: '/images/dishes/classic-smash-burger.webp',
    scale: '180g Double Patty · 12 cm',
    ingredients: 'Aged Cheddar & Truffle Aioli',
    meshDetails: '42K Polygons · 4K PBR',
  },
  {
    id: 'dynamite-chilli-potatoes',
    name: 'Dynamite Chilli Potatoes',
    category: 'Crispy Fusion Tapas',
    image: '/images/dishes/dynamite-chilli-potatoes.webp',
    scale: 'Signature Bowl · Single Share',
    ingredients: 'Wok Glazed Birds Eye Chilli',
    meshDetails: '36K Polygons · 4K PBR',
  },
];

export function ARPromoSection() {
  const [activeDishIndex, setActiveDishIndex] = useState(0);
  const currentDish = PREVIEW_DISHES[activeDishIndex];

  return (
    <section className="px-6 md:px-12 py-16 max-w-7xl mx-auto w-full select-none">
      {/* Spatial 3D Showcase Spotlight Container */}
      <div
        className="relative overflow-hidden rounded-3xl border p-8 sm:p-12 lg:p-16 shadow-[0_25px_60px_rgba(0,0,0,0.85)] group"
        style={{
          background: 'linear-gradient(135deg, #0A1712 0%, #0E1F18 50%, #08110D 100%)',
          borderColor: 'rgba(226, 168, 75, 0.28)',
        }}
      >
        {/* Animated Radial Gold & Emerald Ambient Auras */}
        <div
          className="pointer-events-none absolute -top-32 -right-32 w-[550px] h-[550px] rounded-full blur-3xl animate-pulse-glow"
          style={{
            background:
              'radial-gradient(circle, rgba(226, 168, 75, 0.18) 0%, rgba(14, 31, 24, 0.05) 70%, transparent 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-32 w-[450px] h-[450px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(34, 197, 139, 0.12) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Side (55% Width / lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Overline with Pulsing Radar Dot */}
            <div className="flex items-center gap-2.5 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E0532B] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E0532B]" />
              </span>
              <span className="text-[11px] uppercase tracking-[0.25em] text-[#E0532B] font-bold">
                SPATIAL DINING EXPERIENCE · WEBXR READY
              </span>
            </div>

            {/* Heading: 42px Serif with "Interactive 3D & AR" in Molten Gold */}
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-[46px] leading-[1.12] font-bold text-[#FAF5EC] mb-5 tracking-tight">
              Explore Dishes in{' '}
              <span className="italic text-[#E2A84B] font-normal block sm:inline">
                Interactive 3D &amp; AR
              </span>
            </h2>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-[#B5ADA2] font-light leading-relaxed mb-8 max-w-xl">
              Rotate, inspect photorealistic textures, and preview exact 1:1 portion sizes of our signature wood-fired pizzas and fusion cuisine right in your physical dining space before ordering.
            </p>

            {/* Interactive Dish Switcher Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-8 w-full">
              <span className="text-[10px] uppercase tracking-wider text-[#9A9286] font-semibold mr-2 block sm:inline">
                PREVIEW DISH:
              </span>
              {PREVIEW_DISHES.map((dish, idx) => {
                const isActive = activeDishIndex === idx;
                return (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => setActiveDishIndex(idx)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5 active:scale-95 shadow-sm"
                    style={{
                      background: isActive
                        ? 'rgba(226, 168, 75, 0.22)'
                        : 'rgba(255, 255, 255, 0.04)',
                      borderColor: isActive
                        ? '#E2A84B'
                        : 'rgba(255, 255, 255, 0.1)',
                      borderWidth: '1px',
                      color: isActive ? '#FAF5EC' : '#B5ADA2',
                    }}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-[#E2A84B]' : 'bg-transparent'
                      }`}
                    />
                    <span>{dish.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Spatial Feature Micro-Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 w-full max-w-xl">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/30 border border-white/[0.06] text-xs text-[#FAF5EC]">
                <Box className="w-3.5 h-3.5 text-[#E2A84B] shrink-0" />
                <span className="truncate">1:1 Physical Scale</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/30 border border-white/[0.06] text-xs text-[#FAF5EC]">
                <Sparkles className="w-3.5 h-3.5 text-[#22C58B] shrink-0" />
                <span className="truncate">Zero App Required</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/30 border border-white/[0.06] text-xs text-[#FAF5EC]">
                <RotateCw className="w-3.5 h-3.5 text-[#E0532B] shrink-0" />
                <span className="truncate">360° Free Rotation</span>
              </div>
            </div>

            {/* Action CTA Pair */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              {/* Primary Launch 3D Food Lounge Button */}
              <Link
                href="/ar"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-xs sm:text-sm font-extrabold text-[#0D0A08] transition-all duration-300 hover:brightness-110 active:scale-[0.98] group shadow-[0_4px_25px_rgba(226,168,75,0.4)]"
                style={{
                  background: 'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                  borderRadius: '6px',
                }}
              >
                <span>Launch 3D Food Lounge</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              {/* Secondary Instant AR Button */}
              <Link
                href="/ar"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 text-xs sm:text-sm font-semibold text-[#FAF5EC] border transition-all duration-300 hover:bg-[#0E1F18] hover:border-[#E2A84B]/60 active:scale-[0.98]"
                style={{
                  borderColor: 'rgba(250, 245, 236, 0.24)',
                  borderRadius: '6px',
                }}
              >
                <Box className="w-4 h-4 text-[#E2A84B]" />
                <span>Open in Augmented Reality</span>
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
                stroke="rgba(226, 168, 75, 0.35)"
                strokeWidth="1.5"
                strokeDasharray="6 8"
              />
              <circle cx="50" cy="145" r="4.5" fill="#E2A84B" />
              <circle cx="350" cy="255" r="4.5" fill="#E0532B" />
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
                stroke="rgba(34, 197, 139, 0.25)"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
              <circle cx="200" cy="85" r="3.5" fill="#22C58B" />
            </svg>

            {/* Central Round 3D Model Stage (Real-Time Three.js Spatial Warrior) */}
            <div
              className="relative w-[270px] h-[270px] sm:w-[320px] sm:h-[320px] rounded-full overflow-hidden border-2 border-[#E2A84B]/50 z-10 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(226,168,75,0.3)] bg-gradient-to-b from-[#18130F] via-[#0E0B09] to-[#070504] group/platter"
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

            {/* Floating Holographic Tag 1: 4K Texture Zoom (Animated Float Gentle) */}
            <div
              className="absolute -top-3 left-0 sm:left-2 z-20 px-3.5 py-1.5 rounded-full text-[11px] font-medium text-[#FAF5EC] shadow-2xl flex items-center gap-2 animate-float-gentle border pointer-events-none"
              style={{
                background: 'rgba(13, 10, 8, 0.88)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderColor: 'rgba(226, 168, 75, 0.4)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#E2A84B] animate-pulse" />
              <ZoomIn className="w-3.5 h-3.5 text-[#E2A84B]" />
              <span className="font-semibold tracking-wide">4K Texture Zoom</span>
            </div>

            {/* Floating Holographic Tag 2: True Portion Scale (Animated Float Delayed) */}
            <div
              className="absolute top-8 -right-2 sm:-right-4 z-20 px-3.5 py-1.5 rounded-full text-[11px] font-medium text-[#FAF5EC] shadow-2xl flex items-center gap-2 animate-float-delayed border pointer-events-none"
              style={{
                background: 'rgba(13, 10, 8, 0.88)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderColor: 'rgba(226, 168, 75, 0.4)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C58B] animate-pulse" />
              <Maximize2 className="w-3.5 h-3.5 text-[#E2A84B]" />
              <span className="font-semibold tracking-wide">{currentDish.scale}</span>
            </div>

            {/* Floating Holographic Tag 3: Live Ingredient Layering (Animated Float Gentle) */}
            <div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full text-[11px] font-medium text-[#FAF5EC] shadow-2xl flex items-center gap-2 whitespace-nowrap animate-float-gentle border pointer-events-none"
              style={{
                background: 'rgba(13, 10, 8, 0.90)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderColor: 'rgba(226, 168, 75, 0.4)',
              }}
            >
              <Layers className="w-3.5 h-3.5 text-[#E2A84B]" />
              <span className="text-[#FAF5EC] font-semibold">{currentDish.ingredients}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
