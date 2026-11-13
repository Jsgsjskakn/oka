'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, RefreshCw, UtensilsCrossed } from 'lucide-react';

interface ViewerErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ViewerErrorState({ message, onRetry }: ViewerErrorStateProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/menu');
    }
  };

  return (
    <div className="absolute inset-0 z-[45] flex flex-col items-center justify-center bg-obsidian/95 backdrop-blur-md px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-text-primary mb-2">Unable to Load Model</h2>
      <p className="text-sm text-text-primary/60 mb-6 max-w-xs">
        {message || 'Something went wrong while loading the 3D model. Please try again.'}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-2 px-5 min-h-[48px] bg-primary text-black rounded-full text-sm font-semibold active:scale-95 transition-transform cursor-pointer touch-manipulation"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 px-5 min-h-[48px] bg-[#1a1a1a] border border-border-subtle text-text-primary rounded-full text-sm font-medium active:scale-95 transition-transform cursor-pointer touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
        <Link
          href="/menu"
          className="flex items-center gap-2 px-5 min-h-[48px] bg-zinc-900 border border-border-subtle text-text-primary rounded-full text-sm font-medium active:scale-95 transition-transform touch-manipulation"
        >
          <UtensilsCrossed className="w-4 h-4 text-primary" />
          Return to Menu
        </Link>
      </div>
    </div>
  );
}
