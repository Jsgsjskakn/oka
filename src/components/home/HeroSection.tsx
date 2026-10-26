'use client';

import Link from 'next/link';
import { Hero3DPedestal } from './Hero3DPedestal';

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[#0D0A08] text-[#FAF5EC] flex flex-col justify-between">
      {/* Warm Smoky Vignette Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(circle at 70% 50%, rgba(226, 168, 75, 0.14), rgba(13, 10, 8, 0.94) 75%)',
        }}
      />

      {/* Main 12-Column Asymmetric Split Editorial Hero Container */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 min-h-[calc(90vh-80px)] flex items-center py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">
          {/* Left 7 Columns: Editorial Typography & CTAs (Left-Aligned) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Overline Text + 32px Gold Line (No pill badge, no sparkles) */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[11px] uppercase tracking-[0.25em] text-[#E2A84B] font-medium">
                EST. BENGALURU · WOOD-FIRED &amp; 3D GASTRONOMY
              </span>
              <span className="w-8 h-[1px] bg-[#E2A84B]" />
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-[68px] font-bold text-[#FAF5EC] leading-[1.06] tracking-tight mb-6">
              Where Heritage Flavors Meet{' '}
              <span className="italic text-[#E2A84B] font-normal block sm:inline">
                Artisanal Innovation
              </span>
            </h1>

            {/* Subtext */}
            <p className="max-w-[520px] text-[17px] text-[#B5ADA2] font-light leading-relaxed mb-10">
              Experience hand-stretched wood-fired sourdough pizzas, charcoal tandoori delicacies, and handcrafted fusion street fare crafted with organic local spices.
            </p>

            {/* CTA Pair */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              {/* Primary Button: Solid Gold Gradient, #0D0A08 bold text, 6px radius, clean arrow */}
              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-bold text-[#0D0A08] transition-all duration-300 hover:brightness-110 active:scale-[0.98] shadow-lg group"
                style={{
                  background: 'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                  borderRadius: '6px',
                }}
              >
                <span>Explore Culinary Menu</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>

              {/* Secondary Button: Transparent, ivory border, hover Emerald #0E1F18 */}
              <Link
                href="/booking"
                className="inline-flex items-center justify-center px-8 py-4 text-sm font-semibold text-[#FAF5EC] border transition-all duration-300 hover:bg-[#0E1F18] active:scale-[0.98]"
                style={{
                  borderColor: 'rgba(250, 245, 236, 0.28)',
                  borderRadius: '6px',
                }}
              >
                <span>Reserve a Table</span>
              </Link>
            </div>
          </div>

          {/* Right 5 Columns: Live Interactive 3D Dish Pedestal */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <Hero3DPedestal />
          </div>
        </div>
      </div>

      {/* Bottom Trust Strip (Architectural Divider Bar - Full Width, 64px Height) */}
      <div
        className="relative z-10 w-full min-h-[64px] py-4 px-6 md:px-12 flex items-center border-t border-b"
        style={{
          background: '#120E0B',
          borderTopColor: 'rgba(226, 168, 75, 0.12)',
          borderBottomColor: 'rgba(226, 168, 75, 0.12)',
        }}
      >
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs uppercase tracking-[0.2em] text-[#B5ADA2]">
            <span className="font-serif font-bold text-[#E2A84B]">01 /</span>
            <span>48-HR FERMENTED SOURDOUGH</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-[#B5ADA2]">
            <span className="font-serif font-bold text-[#E2A84B]">02 /</span>
            <span>INTERACTIVE 3D DISH PREVIEW</span>
          </div>
          <div className="flex items-center justify-center md:justify-end gap-2 text-xs uppercase tracking-[0.2em] text-[#B5ADA2]">
            <span className="font-serif font-bold text-[#E2A84B]">03 /</span>
            <span>15 SMART LIVE-BOOKING TABLES</span>
          </div>
        </div>
      </div>
    </section>
  );
}
