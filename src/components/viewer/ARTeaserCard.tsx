'use client';

import Link from 'next/link';
import { Camera, Sparkles } from 'lucide-react';

interface ARTeaserCardProps {
  dishId?: string;
}

export function ARTeaserCard({ dishId }: ARTeaserCardProps) {
  if (!dishId) {
    return (
      <div className="bg-white/5 border border-border-subtle rounded-xl p-3 flex items-center justify-between overflow-hidden relative group opacity-50">
        <div className="flex items-center space-x-3 relative z-10">
          <div className="p-2 bg-obsidian/40 rounded-lg">
            <Camera size={20} className="text-text-primary/50" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary/60">View in AR</h4>
            <p className="text-[10px] text-text-primary/40 flex items-center mt-0.5">
              <Sparkles size={10} className="mr-1" />
              Not available for this dish
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/ar/${dishId}`}
      className="bg-white/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between overflow-hidden relative group active:scale-[0.98] transition-transform"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-center space-x-3 relative z-10">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Camera size={20} className="text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-text-primary/90">View in AR</h4>
          <p className="text-[10px] text-primary/80 flex items-center mt-0.5">
            <Sparkles size={10} className="mr-1" />
            Place on your table
          </p>
        </div>
      </div>
      
      <div className="relative z-10">
        <div className="w-8 h-8 rounded-full border border-primary/30 flex items-center justify-center bg-primary/10">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </Link>
  );
}
