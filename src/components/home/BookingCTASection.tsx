'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

export function BookingCTASection() {
  return (
    <section className="px-4 py-8 relative">
      <div className="glass-card rounded-2xl p-8 text-center relative overflow-hidden border border-champagne/20">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-champagne/10 blur-[50px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#1a0f0a] border border-border-subtle flex items-center justify-center mb-4">
            <Calendar className="w-5 h-5 text-champagne" />
          </div>
          
          <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
            Reserve Your Table
          </h2>
          
          <p className="text-sm text-text-primary/70 mb-6 max-w-[250px] mx-auto">
            Experience our exclusive culinary journey. Book in advance to secure your spot.
          </p>
          
          <Link href="/booking" className="w-full sm:w-auto">
            <PrimaryButton fullWidth className="min-w-[200px]">
              Book Now
            </PrimaryButton>
          </Link>
        </div>
      </div>
    </section>
  );
}
