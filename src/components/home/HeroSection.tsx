'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

export function HeroSection() {
  return (
    <section className="relative w-full h-[75vh] min-h-[500px] flex items-end pb-8 -mt-16">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero.jpg"
          alt="The Golden Oak Restaurant"
          fill
          priority
          className="object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black z-10" />
      </div>

      {/* Content */}
      <div className="relative z-20 w-full px-6 animate-slide-up">
        <div className="max-w-md mx-auto">
          {/* AR Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-obsidian/40 backdrop-blur-md border border-border-subtle text-xs font-medium text-text-primary mb-4">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>View dishes in AR</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-2">
            <span className="gold-gradient">The Golden Oak</span>
          </h1>
          
          <p className="text-lg text-text-primary/90 mb-4 font-light">
            Where Tradition Meets Innovation
          </p>

          <div className="w-12 h-[1px] bg-primary mb-6" />

          <p className="text-sm text-muted-foreground line-clamp-2">
            Experience culinary excellence in a luxurious setting. Our curated menu brings you the finest ingredients prepared with masterful techniques.
          </p>
        </div>
      </div>
    </section>
  );
}
