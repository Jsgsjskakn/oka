'use client';

import { Sparkles, Box, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function ARPromoSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full">
      <div className="relative overflow-hidden rounded-3xl border border-[#d4af37]/25 bg-gradient-to-br from-[#0c2014]/90 via-[#07150c]/85 to-[#050e08]/90 p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {/* Subtle Ambient Radial Lighting */}
        <div className="pointer-events-none absolute top-0 right-0 w-80 h-80 rounded-full bg-[#d4af37]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#1b3e25]/20 blur-3xl" />

        {/* Decorative 3D Cube Outline */}
        <div className="absolute top-4 right-4 sm:right-8 opacity-15 pointer-events-none">
          <Box className="w-36 h-36 sm:w-48 sm:h-48 text-[#d4af37] stroke-[0.4]" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold text-[#d4af37]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Futuristic Dining Feature</span>
          </div>

          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
            Explore Dishes in{' '}
            <span className="bg-gradient-to-r from-[#f7e4a8] via-[#d4af37] to-[#b38936] bg-clip-text text-transparent">
              Interactive 3D
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-white/70 mb-8 max-w-xl leading-relaxed font-light">
            Rotate, inspect textures, and preview portion sizes of our signature artisan pizzas and fusion dishes right on your screen before placing your order.
          </p>

          <Link
            href="/ar"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b38936] text-black font-bold text-xs sm:text-sm shadow-[0_10px_25px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Box className="w-4 h-4 text-black" />
            <span>Launch 3D Food Lounge</span>
            <ArrowRight className="w-3.5 h-3.5 text-black" />
          </Link>
        </div>
      </div>
    </section>
  );
}
