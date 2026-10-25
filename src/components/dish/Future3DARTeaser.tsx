'use client';

import { Box, Camera, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { Dish } from '@/types/menu';
import { hasModel } from '@/data/model-config';

interface Future3DARTeaserProps {
  dish?: Dish;
}

export function Future3DARTeaser({ dish }: Future3DARTeaserProps) {
  const targetSlug = dish?.slug || dish?.id;
  const has3D = Boolean(targetSlug && hasModel(targetSlug));

  if (has3D && dish) {
    const slugOrId = dish.slug || dish.id;
    return (
      <div className="px-4 py-4 space-y-3">
        {/* View in 3D */}
        <Link
          href={`/3d/${slugOrId}`}
          className="relative block overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-primary/20 p-4 group active:scale-[0.98] transition-transform"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Available Now</span>
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-0.5">View in 3D</h3>
              <p className="text-[10px] text-text-primary/40">Explore this dish interactively</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Box className="w-4 h-4 text-primary" />
            </div>
          </div>
        </Link>

        {/* View in AR */}
        <Link
          href={`/ar/${slugOrId}`}
          className="relative block overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-primary/15 p-4 group active:scale-[0.98] transition-transform"
        >
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Camera className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">New</span>
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-0.5">View in AR</h3>
              <p className="text-[10px] text-text-primary/40">Place this dish on your table</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Camera className="w-4 h-4 text-primary" />
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="rounded-xl bg-[#141414] border border-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
            <Box className="w-4 h-4 text-text-primary/30" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-primary/60">3D & AR Experience</h4>
            <p className="text-[10px] text-text-primary/30">3D preview coming soon for this dish</p>
          </div>
        </div>
      </div>
    </div>
  );
}
