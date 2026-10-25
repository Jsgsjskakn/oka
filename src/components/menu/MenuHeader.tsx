'use client';

import { Sparkles, UtensilsCrossed } from 'lucide-react';

export function MenuHeader() {
  return (
    <div className="pt-8 pb-6 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold text-[#d4af37]">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Culinary Collection</span>
      </div>

      <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight">
        Gourmet Dishes &amp;{' '}
        <span className="bg-gradient-to-r from-[#f7e4a8] via-[#d4af37] to-[#b38936] bg-clip-text text-transparent">
          Signature Craft
        </span>
      </h1>

      <p className="text-xs sm:text-sm text-white/65 max-w-xl mx-auto leading-relaxed font-light">
        Browse hand-stretched wood-fired sourdough pizzas, handcrafted smash burgers, aromatic tandoor sizzlers, and street fusion specialties.
      </p>
    </div>
  );
}
