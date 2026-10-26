'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ZoomIn, Maximize2, Layers } from 'lucide-react';

export function ARPromoSection() {
  return (
    <section className="px-6 md:px-12 py-12 max-w-7xl mx-auto w-full">
      {/* Spatial 3D Showcase Spotlight Container */}
      <div
        className="relative overflow-hidden rounded-2xl border p-8 sm:p-12 lg:p-16 shadow-2xl"
        style={{
          background: '#0E1F18',
          borderColor: 'rgba(226, 168, 75, 0.22)',
        }}
      >
        {/* Radial Gold Aura */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(circle at 80% 50%, rgba(226, 168, 75, 0.16), transparent 65%)',
          }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Side (55% Width / lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Clean Uppercase Overline in Spiced Saffron #E0532B (No pill badge) */}
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#E0532B] font-bold mb-4">
              SPATIAL DINING EXPERIENCE
            </span>

            {/* Heading: 42px Serif with "Interactive 3D" in Gold Italic */}
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] leading-tight font-bold text-[#FAF5EC] mb-5 tracking-tight">
              Explore Dishes in{' '}
              <span className="italic text-[#E2A84B] font-normal block sm:inline">
                Interactive 3D
              </span>
            </h2>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-[#B5ADA2] font-light leading-relaxed mb-8 max-w-xl">
              Rotate, inspect textures, and preview portion sizes of our signature artisan pizzas and fusion dishes right on your screen before placing your order.
            </p>

            {/* Crisp Metallic Gold Gradient Button */}
            <Link
              href="/ar"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-xs sm:text-sm font-bold text-[#0D0A08] transition-all duration-300 hover:brightness-110 active:scale-[0.98] group shadow-md"
              style={{
                background: 'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                borderRadius: '6px',
              }}
            >
              <span>Launch 3D Food Lounge</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {/* Right Side (45% Width / lg:col-span-5) — Circular Dish Platter with 360° Orbital Gold Ring & 3 Floating Clean Vector Tags */}
          <div className="lg:col-span-5 relative w-full aspect-square max-w-[420px] mx-auto flex items-center justify-center">
            {/* 360° Orbital Gold Ring (SVG Ellipse Ring) */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none animate-[spin_50s_linear_infinite]"
              viewBox="0 0 400 400"
              fill="none"
            >
              <ellipse
                cx="200"
                cy="200"
                rx="180"
                ry="130"
                transform="rotate(-25 200 200)"
                stroke="rgba(226, 168, 75, 0.35)"
                strokeWidth="1.5"
                strokeDasharray="6 8"
              />
              <circle cx="60" cy="140" r="4" fill="#E2A84B" />
              <circle cx="340" cy="260" r="4" fill="#E0532B" />
            </svg>

            {/* Central Round Dish Platter (Rounded Platter Frame without awkward square image box) */}
            <div
              className="relative w-[230px] h-[230px] sm:w-[270px] sm:h-[270px] rounded-full overflow-hidden border-2 border-[#E2A84B]/35 z-10 transition-transform hover:scale-105 duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
            >
              <Image
                src="/images/dishes/tandoori-paneer-pizza.webp"
                alt="Wood-Fired Tandoori Paneer Pizza 3D Rendering"
                fill
                sizes="(max-width: 640px) 230px, 270px"
                className="object-cover scale-110"
              />
              <div
                className="absolute inset-0 pointer-events-none rounded-full"
                style={{
                  boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.6)',
                }}
              />
            </div>

            {/* Floating Glass Tag 1: 4K Texture Zoom (Vector Lucide Icon, NO EMOJI) */}
            <div
              className="absolute -top-1 left-2 sm:left-4 z-20 px-3.5 py-1.5 rounded-full text-[11px] font-medium text-[#FAF5EC] shadow-xl flex items-center gap-2"
              style={{
                background: 'rgba(13, 10, 8, 0.85)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(226, 168, 75, 0.35)',
              }}
            >
              <ZoomIn className="w-3.5 h-3.5 text-[#E2A84B]" />
              <span>4K Texture Zoom</span>
            </div>

            {/* Floating Glass Tag 2: True Portion Scale (Vector Lucide Icon, NO EMOJI) */}
            <div
              className="absolute top-10 -right-2 sm:right-0 z-20 px-3.5 py-1.5 rounded-full text-[11px] font-medium text-[#FAF5EC] shadow-xl flex items-center gap-2"
              style={{
                background: 'rgba(13, 10, 8, 0.85)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(226, 168, 75, 0.35)',
              }}
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#E2A84B]" />
              <span>True Portion Scale</span>
            </div>

            {/* Floating Glass Tag 3: Live Ingredient Layering (Vector Lucide Icon, NO EMOJI) */}
            <div
              className="absolute -bottom-2 sm:bottom-0 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full text-[11px] font-medium text-[#FAF5EC] shadow-xl flex items-center gap-2 whitespace-nowrap"
              style={{
                background: 'rgba(13, 10, 8, 0.85)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(226, 168, 75, 0.35)',
              }}
            >
              <Layers className="w-3.5 h-3.5 text-[#E2A84B]" />
              <span>Live Ingredient Layering</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
