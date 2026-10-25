'use client';

import { Sparkles, Box } from 'lucide-react';
import Link from 'next/link';

export function ARPromoSection() {
  return (
    <section className="px-4 py-8">
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-8 shadow-2xl">
        {/* Subtle glass effect background */}
        <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-3xl" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-6 opacity-30">
          <Box className="w-24 h-24 text-champagne stroke-[0.5]" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-champagne/10 border border-champagne/20">
            <Sparkles className="w-4 h-4 text-champagne" />
            <span className="text-xs font-medium text-champagne uppercase tracking-wider">Try Now</span>
          </div>
          
          <h2 className="font-heading text-3xl font-bold text-text-primary mb-3">
            Dine in <span className="gold-gradient">Augmented Reality</span>
          </h2>
          
          <p className="text-sm text-text-primary/70 mb-8 max-w-[80%] leading-relaxed">
            Preview our masterfully crafted dishes on your table before you order. A new dimension of culinary exploration awaits.
          </p>
          
          <Link 
            href="/ar"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-border-subtle text-text-primary font-medium hover:bg-white/10 transition-colors"
          >
            <Box className="w-4 h-4 text-champagne" />
            <span>Discover the Experience</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
