'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Utensils, HeartHandshake, Flame, ArrowRight } from 'lucide-react';

export function StorySection() {
  return (
    <section id="story" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="rounded-3xl bg-gradient-to-br from-[#0c1f13]/85 via-[#08150c]/80 to-[#050c07]/90 border border-white/[0.09] p-6 sm:p-10 lg:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#d4af37]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#1b3e25]/25 blur-3xl" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-10">
          {/* Left Column: Story Details */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold text-[#d4af37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Our Culinary Philosophy</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Honoring Heritage Traditions with{' '}
              <span className="text-[#d4af37]">Modern Precision</span>
            </h2>

            <p className="text-sm text-white/70 leading-relaxed font-light">
              Founded on the belief that dining should be an unforgettable sensory journey, <strong className="text-white font-medium">The Golden Oak</strong> marries centuries-old Indian cooking wisdom with contemporary culinary science.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                <Flame className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Wood-Fired Hearth</h4>
                  <p className="text-[11px] text-white/55 mt-1 leading-snug">
                    48-hour slow-fermented sourdough bases blistered at 450°C.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                <Utensils className="w-5 h-5 text-[#3EE094] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Artisanal Fusion</h4>
                  <p className="text-[11px] text-white/55 mt-1 leading-snug">
                    Charcoal tandoor aromatics fused with gourmet brioche &amp; pasta craft.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#d4af37] hover:text-white transition-colors group"
              >
                <span>Discover our signature recipes</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Collage */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <Image
              src="/images/hero.jpg"
              alt="The Golden Oak dining ambiance"
              fill
              className="object-cover brightness-90 hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060e08]/90 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
              <p className="text-xs font-medium text-white/90">
                &ldquo;Every dish is a canvas where organic Indian spices celebrate international technique.&rdquo;
              </p>
              <p className="text-[10px] text-[#d4af37] font-semibold mt-1">
                — Executive Chef, The Golden Oak
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
