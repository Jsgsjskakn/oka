'use client';

import Link from 'next/link';
import { WifiOff, UtensilsCrossed, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 animate-pulse">
        <WifiOff className="w-10 h-10 text-amber-400" />
      </div>

      <p className="text-amber-400 text-xs tracking-[0.3em] uppercase mb-2">Connection Interrupted</p>
      <h1 className="text-3xl sm:text-4xl font-serif text-white mb-4">You Are Currently Offline</h1>
      
      <p className="text-stone-400 max-w-md text-sm leading-relaxed mb-8">
        The Golden Oak experience requires an active internet connection to retrieve live table availability, real-time kitchen status, and 3D culinary models.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
        <button
          onClick={() => {
            if (typeof window !== 'undefined') window.location.reload();
          }}
          className="flex-1 py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>

        <Link
          href="/"
          className="flex-1 py-3 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <UtensilsCrossed className="w-4 h-4 text-amber-400" />
          Home
        </Link>
      </div>

      <div className="mt-16 text-xs text-stone-600">
        The Golden Oak Fine Dining &bull; Offline Mode
      </div>
    </div>
  );
}
