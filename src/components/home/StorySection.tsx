'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Flame, Utensils, ArrowRight } from 'lucide-react';

export function StorySection() {
  return (
    // Editorial Heritage Split Section (Full-bleed section, NO outer rounded box!)
    // High-Attraction Contrast Flip: #FAF5EC Warm Silk Ivory Background
    <section id="story" className="w-full bg-[#FAF5EC] py-20 lg:py-28 my-10 select-none">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column (Text on Ivory Canvas - 7 Columns) */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6">
            {/* Overline in Spiced Saffron #E0532B (No pill box) */}
            <span className="text-[11px] uppercase tracking-[0.28em] text-[#E0532B] font-bold">
              OUR CULINARY PHILOSOPHY
            </span>

            {/* Heading: Honoring Heritage Traditions with Modern Precision */}
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#0D0A08] tracking-tight leading-[1.15]">
              Honoring Heritage Traditions with{' '}
              <span className="italic text-[#9E6818] font-normal block sm:inline">
                Modern Precision
              </span>
            </h2>

            {/* Paragraph in #3D352E (Warm Charcoal) */}
            <p className="text-base sm:text-[17px] text-[#3D352E] font-light leading-relaxed max-w-2xl">
              Founded on the belief that dining should be an unforgettable sensory journey,{' '}
              <strong className="text-[#0D0A08] font-semibold">The Golden Oak</strong> marries
              centuries-old Indian cooking wisdom with contemporary culinary science and wood-fired mastery.
            </p>

            {/* Two Clean Editorial Columns (No boxes, no neon icons) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 w-full">
              {/* Column 1: Wood-Fired Hearth */}
              <div className="pt-4 border-t border-[#0D0A08]/15 space-y-2">
                <div className="flex items-center gap-2 text-[#9E6818]">
                  <Flame className="w-4 h-4 text-[#9E6818]" />
                  <h4 className="font-serif text-lg font-bold text-[#0D0A08]">
                    Wood-Fired Hearth
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-[#5C5248] leading-relaxed">
                  48-hour slow-fermented organic sourdough bases blistered to blistered perfection at 450°C.
                </p>
              </div>

              {/* Column 2: Artisanal Fusion */}
              <div className="pt-4 border-t border-[#0D0A08]/15 space-y-2">
                <div className="flex items-center gap-2 text-[#9E6818]">
                  <Utensils className="w-4 h-4 text-[#9E6818]" />
                  <h4 className="font-serif text-lg font-bold text-[#0D0A08]">
                    Artisanal Fusion
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-[#5C5248] leading-relaxed">
                  Charcoal tandoor aromatics fused seamlessly with gourmet brioche, fresh pasta, and pan-Asian fire.
                </p>
              </div>
            </div>

            {/* Spiced Saffron Bold Underline Link */}
            <div className="pt-4">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#E0532B] hover:text-[#9E6818] transition-colors border-b-2 border-[#E0532B] pb-1 group"
              >
                <span>Discover our signature recipes</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Column: Architectural Portrait Frame + Overlapping Chef Quote (5 Columns) */}
          <div className="lg:col-span-5 relative">
            {/* Architectural Portrait Photo Frame (border-radius: 8px) */}
            <div
              className="relative aspect-[4/5] w-full overflow-hidden shadow-2xl"
              style={{ borderRadius: '8px' }}
            >
              <Image
                src="/images/hero.jpg"
                alt="Candlelight Artisanal Dining Ambience at The Golden Oak"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Half-Overlapping Floating Chef Quote Card (background: #0D0A08, text #FAF5EC, left border 3px solid #E2A84B) */}
            <div
              className="relative sm:absolute -bottom-6 -left-4 sm:-left-8 right-4 sm:right-4 p-6 sm:p-7 shadow-2xl z-20 mt-4 sm:mt-0"
              style={{
                background: '#0D0A08',
                borderLeft: '3px solid #E2A84B',
                borderRadius: '0 8px 8px 0',
              }}
            >
              <p className="font-serif text-sm sm:text-base italic text-[#FAF5EC] leading-relaxed">
                &ldquo;Every dish is a canvas where organic Indian spices celebrate international technique.&rdquo;
              </p>
              <p className="text-xs font-semibold text-[#E2A84B] tracking-wider uppercase mt-3">
                — Executive Chef, The Golden Oak
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
