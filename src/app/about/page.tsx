import { ChevronLeft, Leaf, Flame, Sparkles, Award } from 'lucide-react';
import Link from 'next/link';
import { CompactFooter } from '@/components/layout/CompactFooter';
import { RESTAURANT_CONFIG } from '@/lib/config';
import { StationaryOakTreeBackground } from '@/components/home/StationaryOakTreeBackground';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#070503] text-text-primary flex flex-col relative overflow-hidden select-none">
      {/* ===================================================================== */}
      {/* STATIONARY THE GOLDEN OAK PARTICLE TREE BACKGROUND (EXACT SAME TREE)  */}
      {/* Stays majestically in place in the background ("ek he jagha rahega")  */}
      {/* ===================================================================== */}
      <StationaryOakTreeBackground isFixed={true} />

      {/* Top Header / Breadcrumb navigation */}
      <header className="px-4 sm:px-6 py-4 flex items-center gap-3 border-b border-white/[0.08] sticky top-0 bg-[#070503]/85 backdrop-blur-md z-40 shadow-sm">
        <Link
          href="/"
          className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-[#D4C8B8] hover:text-[#F0C36B] hover:border-[#F0C36B]/40 active:scale-95 transition-all"
          aria-label="Back to Home"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#F0C36B] font-bold">
            The Golden Oak
          </span>
          <span className="text-white/20">/</span>
          <h1 className="font-serif text-base font-bold text-[#FAF5EC]">Our Story</h1>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        {/* ========================================================= */}
        {/* HERO SECTION: Centered gracefully above the Golden Tree   */}
        {/* ========================================================= */}
        <div className="relative min-h-[44vh] sm:min-h-[48vh] w-full flex items-center justify-center overflow-hidden py-16 sm:py-20 px-4">
          <div className="relative z-10 text-center max-w-3xl mx-auto flex flex-col items-center">
            {/* Crown Crest Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F0C36B]/10 border border-[#F0C36B]/35 text-[#F0C36B] text-[10.5px] font-mono tracking-widest uppercase mb-5 shadow-lg backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#F0C36B]" />
              <span>EST. BENGALURU · HERITAGE &amp; GASTRONOMY</span>
            </div>

            <h1
              className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5 drop-shadow-[0_4px_30px_rgba(240,195,107,0.35)]"
              style={{
                background: 'linear-gradient(135deg, #FFF6E0 0%, #F0C36B 50%, #C4902C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {RESTAURANT_CONFIG.name}
            </h1>

            <p className="text-sm sm:text-base text-[#D4C8B8] font-light max-w-lg mx-auto leading-relaxed drop-shadow-md">
              Where traditional Indian flavors meet contemporary artisanal craft in a setting of uncompromised luxury.
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CONTENT SECTION: Our Philosophy, Craft & The Experience   */}
        {/* ========================================================= */}
        <div className="px-4 sm:px-6 py-12 max-w-3xl mx-auto space-y-16">
          {/* Section 1: Our Philosophy */}
          <section className="text-center relative">
            <h2 className="font-serif text-2xl sm:text-3xl text-[#F0C36B] mb-6 flex items-center justify-center gap-4">
              <span className="w-12 h-px bg-gradient-to-r from-transparent to-[#F0C36B]/50" />
              <span>Our Philosophy</span>
              <span className="w-12 h-px bg-gradient-to-l from-transparent to-[#F0C36B]/50" />
            </h2>
            <div
              className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#F0C36B]/25 shadow-2xl backdrop-blur-md"
              style={{
                background: 'linear-gradient(145deg, rgba(16, 12, 9, 0.70) 0%, rgba(10, 7, 5, 0.75) 100%)',
              }}
            >
              <p className="text-sm sm:text-[15px] text-[#E0D5C5] leading-relaxed font-light">
                At <span className="text-[#F0C36B] font-semibold">{RESTAURANT_CONFIG.name}</span>, we believe that dining is an art form. Our culinary approach celebrates the rich, complex spices of traditional Indian cuisine while embracing modern techniques and global inspirations. Every dish is a carefully composed masterpiece, designed to delight the senses and evoke a sense of refined nostalgia.
              </p>
            </div>
          </section>

          {/* Section 2: Finest Ingredients & Artisanal Craft */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Card 1 */}
            <div
              className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#F0C36B]/25 shadow-xl flex flex-col items-center text-center backdrop-blur-md hover:border-[#F0C36B]/50 transition-all duration-300"
              style={{
                background: 'linear-gradient(145deg, rgba(16, 12, 9, 0.72) 0%, rgba(10, 7, 5, 0.78) 100%)',
              }}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F0C36B]/10 border border-[#F0C36B]/30 flex items-center justify-center mb-4 shadow-inner">
                <Leaf className="w-5 h-5 text-[#F0C36B]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#FAF5EC] mb-2.5">
                Finest Ingredients
              </h3>
              <p className="text-xs sm:text-sm text-[#A89D8E] leading-relaxed font-light">
                We source only the most premium, organic, and ethically produced ingredients. From hand-ground spices to farm-fresh produce, pristine quality is our foundation.
              </p>
            </div>

            {/* Card 2 */}
            <div
              className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#F0C36B]/25 shadow-xl flex flex-col items-center text-center backdrop-blur-md hover:border-[#F0C36B]/50 transition-all duration-300"
              style={{
                background: 'linear-gradient(145deg, rgba(16, 12, 9, 0.72) 0%, rgba(10, 7, 5, 0.78) 100%)',
              }}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F0C36B]/10 border border-[#F0C36B]/30 flex items-center justify-center mb-4 shadow-inner">
                <Flame className="w-5 h-5 text-[#F0C36B]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#FAF5EC] mb-2.5">
                Artisanal Craft
              </h3>
              <p className="text-xs sm:text-sm text-[#A89D8E] leading-relaxed font-light">
                Whether it&apos;s our hand-stretched wood-fired sourdough pizzas or charcoal-smoked tandoor delicacies, every creation is crafted with meticulous attention to detail.
              </p>
            </div>
          </div>

          {/* Section 3: The Experience */}
          <section className="text-center pb-8">
            <h2 className="font-serif text-2xl sm:text-3xl text-[#F0C36B] mb-6 flex items-center justify-center gap-4">
              <span className="w-12 h-px bg-gradient-to-r from-transparent to-[#F0C36B]/50" />
              <span>The Experience</span>
              <span className="w-12 h-px bg-gradient-to-l from-transparent to-[#F0C36B]/50" />
            </h2>
            <div
              className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#F0C36B]/25 shadow-2xl backdrop-blur-md"
              style={{
                background: 'linear-gradient(145deg, rgba(16, 12, 9, 0.70) 0%, rgba(10, 7, 5, 0.75) 100%)',
              }}
            >
              <p className="text-sm sm:text-[15px] text-[#E0D5C5] leading-relaxed font-light">
                Stepping into <span className="text-[#F0C36B] font-semibold">{RESTAURANT_CONFIG.name}</span> is entering a world of warm gold accents, ambient hearth illumination, and impeccable hospitality. We curate an atmosphere that is both intimate and grand, perfect for celebrations, romantic evenings, and culinary discoveries.
              </p>
            </div>
          </section>
        </div>
      </main>

      <div className="relative z-10">
        <CompactFooter />
      </div>
    </div>
  );
}
