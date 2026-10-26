'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Hero3DPedestal } from './Hero3DPedestal';

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[#0D0A08] text-[#FAF5EC] flex flex-col justify-center min-h-[calc(90vh-80px)]">
      {/* Background Restaurant Photography - Restored Authentic Ambience from Original Hero */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src="/images/hero.jpg"
          alt="The Golden Oak Fine Dining Restaurant Ambience"
          fill
          priority
          className="object-cover object-top sm:object-[center_25%] filter brightness-[0.75] contrast-[1.05] saturate-[1.15]"
        />
        {/* Layered Deep Velvet Scrim for High-Contrast Text Legibility while keeping warm restaurant glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0A08]/92 via-[#0D0A08]/65 lg:via-[#0D0A08]/45 to-[#0D0A08]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0A08] via-transparent to-[#0D0A08]/40" />
      </div>

      {/* Main 12-Column Asymmetric Split Editorial Hero Container */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 py-12 lg:py-20 flex items-center">
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
    </section>
  );
}
