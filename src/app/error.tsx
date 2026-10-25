'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, UtensilsCrossed } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[RootError] Unhandled error captured by boundary:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center bg-obsidian text-text-primary">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
      </div>

      <h1 className="font-heading text-2xl font-bold mb-2 text-platinum">Something Went Wrong</h1>
      <p className="text-sm text-text-secondary max-w-sm mb-8 leading-relaxed">
        We apologize for the inconvenience. Our culinary experience encountered a temporary glitch.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-sm hover:from-amber-600 hover:to-amber-700 active:scale-95 transition-all shadow-[0_0_20px_rgba(201,168,76,0.3)] cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>

        <Link
          href="/menu"
          className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-zinc-900 border border-border-subtle text-text-primary font-medium text-sm hover:bg-zinc-800 active:scale-95 transition-all"
        >
          <UtensilsCrossed className="w-4 h-4 text-amber-500" />
          Return to Menu
        </Link>
      </div>

      {error?.digest && (
        <p className="mt-8 text-[11px] text-zinc-600 font-mono">
          Incident ID: {error.digest}
        </p>
      )}
    </div>
  );
}
