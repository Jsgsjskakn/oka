'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ViewerHeaderProps {
  dishName: string;
}

export function ViewerHeader({ dishName }: ViewerHeaderProps) {
  const router = useRouter();

  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 pt-4 pb-8 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
      <button
        onClick={() => router.back()}
        className="w-10 h-10 rounded-full bg-obsidian/50 backdrop-blur-md border border-border-subtle flex items-center justify-center text-text-primary/70 hover:text-text-primary active:scale-95 transition-all shrink-0"
        aria-label="Go back"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">3D View</p>
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
            Prototype Asset
          </span>
        </div>
        <h1 className="text-sm font-semibold text-text-primary truncate">{dishName}</h1>
      </div>
    </div>
  );
}
