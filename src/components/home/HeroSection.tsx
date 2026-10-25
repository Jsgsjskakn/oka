'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, UtensilsCrossed, Calendar, ChevronRight, Award, ShieldCheck } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative w-full min-h-[82vh] lg:min-h-[88vh] flex items-center justify-center -mt-16 pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Hero Photography */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero.jpg"
          alt="The Golden Oak Fine Dining Restaurant Ambience"
          fill
          priority
          className="object-cover object-center scale-105 filter brightness-[0.7] saturate-[1.2]"
        />
        {/* Layered Deep Forest Green & Obsidian Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060e08]/60 via-[#07130a]/80 to-[#060e08] z-10" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#060e08]/40 to-[#060e08] z-10" />
      </div>

      {/* Warm Ambient Champagne & Emerald Light Glows */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full bg-[#d4af37]/10 blur-3xl z-10" />
      <div className="pointer-events-none absolute top-1/3 left-1/4 w-[400px] h-[300px] rounded-full bg-[#1e462b]/25 blur-3xl z-10" />

      {/* Main Hero Content */}
      <div className="relative z-20 max-w-4xl mx-auto text-center flex flex-col items-center">
        {/* Top Floating Glass Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a180f]/80 backdrop-blur-xl border border-[#d4af37]/35 text-xs font-semibold text-[#f5e6b8] shadow-[0_8px_24px_rgba(0,0,0,0.5)] mb-6 animate-in fade-in duration-500">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37] animate-pulse" />
          <span>Interactive 3D Gastronomy &amp; Gourmet Indian Fusion</span>
        </div>

        {/* Heading */}
        <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-5">
          Where Heritage Flavors Meet{' '}
          <span className="bg-gradient-to-r from-[#f7e4a8] via-[#d4af37] to-[#b38936] bg-clip-text text-transparent">
            Artisanal Innovation
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-sm sm:text-base lg:text-lg text-white/75 font-light leading-relaxed mb-8">
          Welcome to <strong className="text-white font-medium">The Golden Oak</strong>. Experience hand-stretched wood-fired sourdough pizzas, charcoal tandoori delicacies, and handcrafted fusion street fare crafted with organic local spices.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full sm:w-auto mb-10">
          <Link
            href="/menu"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#a88232] text-black font-bold text-sm shadow-[0_12px_28px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <UtensilsCrossed className="w-4 h-4 text-black" />
            <span>Explore Culinary Menu</span>
            <ChevronRight className="w-4 h-4 text-black" />
          </Link>

          <Link
            href="/booking"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-[#0d1f13]/70 backdrop-blur-xl border border-white/15 text-white hover:text-[#d4af37] hover:border-[#d4af37]/50 font-semibold text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Calendar className="w-4 h-4 text-[#d4af37]" />
            <span>Reserve a Table</span>
          </Link>
        </div>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-w-2xl w-full pt-4 border-t border-white/[0.08] text-[11px] sm:text-xs text-white/65">
          <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <Award className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Award-Winning Chefs</span>
          </div>
          <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <Sparkles className="w-3.5 h-3.5 text-[#3EE094]" />
            <span>Live 3D Dish Previews</span>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#7B93FF]" />
            <span>100% Farm-Fresh Ingredients</span>
          </div>
        </div>
      </div>
    </section>
  );
}
