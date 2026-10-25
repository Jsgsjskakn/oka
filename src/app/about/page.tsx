import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { CompactFooter } from '@/components/layout/CompactFooter';
import { RESTAURANT_CONFIG } from '@/lib/config';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-obsidian text-text-primary flex flex-col">
      <header className="px-4 py-5 flex items-center gap-3 border-b border-white/5 sticky top-0 bg-obsidian/90 backdrop-blur-md z-40">
        <Link href="/" className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-heading text-lg font-bold">About Us</h1>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative h-[40vh] w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/restaurant-interior.jpg')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
          
          <div className="relative z-10 text-center px-4">
            <h1 className="font-heading text-4xl md:text-5xl font-bold gold-gradient mb-4">
              {RESTAURANT_CONFIG.name}
            </h1>
            <p className="text-sm md:text-base text-text-primary/80 max-w-md mx-auto">
              Where traditional Indian flavors meet contemporary artisanal craft in a setting of uncompromised luxury.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-4 py-12 max-w-2xl mx-auto space-y-12">
          
          <section className="text-center">
            <h2 className="font-heading text-2xl text-primary mb-6 flex items-center justify-center gap-4">
              <span className="w-12 h-px bg-primary/30"></span>
              Our Philosophy
              <span className="w-12 h-px bg-primary/30"></span>
            </h2>
            <p className="text-text-primary/70 leading-relaxed font-light">
              At {RESTAURANT_CONFIG.name}, we believe that dining is an art form. Our culinary approach celebrates the rich, complex spices of traditional Indian cuisine while embracing modern techniques and global inspirations. Every dish is a carefully composed masterpiece, designed to delight the senses and evoke a sense of refined nostalgia.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🌿</span>
              </div>
              <h3 className="font-heading text-lg font-bold text-text-primary mb-2">Finest Ingredients</h3>
              <p className="text-sm text-text-primary/60">
                We source only the most premium, organic, and ethically produced ingredients. From hand-ground spices to farm-fresh produce, quality is our foundation.
              </p>
            </div>
            
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🔥</span>
              </div>
              <h3 className="font-heading text-lg font-bold text-text-primary mb-2">Artisanal Craft</h3>
              <p className="text-sm text-text-primary/60">
                Whether it's our hand-stretched sourdough pizzas or slow-cooked clay oven specialties, everything is crafted with meticulous attention to detail.
              </p>
            </div>
          </div>

          <section className="text-center pb-8">
            <h2 className="font-heading text-2xl text-primary mb-6 flex items-center justify-center gap-4">
              <span className="w-12 h-px bg-primary/30"></span>
              The Experience
              <span className="w-12 h-px bg-primary/30"></span>
            </h2>
            <p className="text-text-primary/70 leading-relaxed font-light">
              Stepping into {RESTAURANT_CONFIG.name} is entering a world of warm gold accents, ambient lighting, and impeccable hospitality. We curate an atmosphere that is both intimate and grand, perfect for celebrations, quiet dinners, and everything in between.
            </p>
          </section>
        </div>
      </main>

      <CompactFooter />
    </div>
  );
}
