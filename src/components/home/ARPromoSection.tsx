'use client';

import Link from 'next/link';
import Image from 'next/image';

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

          {/* Right Side (45% Width / lg:col-span-5) — Dish Visual with 360° Orbital Gold Ring & 3 Floating Glass Tags */}
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

            {/* Central Dish Artwork */}
            <div className="relative w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] z-10 transition-transform hover:scale-105 duration-500">
              <Image
                src="/images/dishes/tandoori-paneer-pizza.webp"
                alt="Wood-Fired Tandoori Paneer Pizza 3D Rendering"
                fill
                sizes="(max-width: 640px) 240px, 280px"
                className="object-contain"
                style={{
                  filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.85)) drop-shadow(0 0 20px rgba(226,168,75,0.2))',
                }}
              />
            </div>

            {/* Floating Glass Tag 1: 🔍 4K Texture Zoom (Top-Left) */}
            <div
              className="absolute -top-1 left-2 sm:left-4 z-20 px-3.5 py-1.5 rounded-full text-[11px] font-medium text-[#FAF5EC] shadow-xl flex items-center gap-1.5"
              style={{
                background: 'rgba(13, 10, 8, 0.78)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(226, 168, 75, 0.35)',
              }}
            >
              <span>🔍</span>
              <span>4K Texture Zoom</span>
            </div>

            {/* Floating Glass Tag 2: 📐 True Portion Scale (Top-Right) */}
            <div
              className="absolute top-10 -right-2 sm:right-0 z-20 px-3.5 py-1.5 rounded-full text-[11px] font-medium text-[#FAF5EC] shadow-xl flex items-center gap-1.5"
              style={{
                background: 'rgba(13, 10, 8, 0.78)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(226, 168, 75, 0.35)',
              }}
            >
              <span>📐</span>
              <span>True Portion Scale</span>
            </div>

            {/* Floating Glass Tag 3: 🔥 Live Ingredient Layering (Bottom-Center) */}
            <div
              className="absolute -bottom-2 sm:bottom-0 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full text-[11px] font-medium text-[#FAF5EC] shadow-xl flex items-center gap-1.5 whitespace-nowrap"
              style={{
                background: 'rgba(13, 10, 8, 0.78)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(226, 168, 75, 0.35)',
              }}
            >
              <span>🔥</span>
              <span>Live Ingredient Layering</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
