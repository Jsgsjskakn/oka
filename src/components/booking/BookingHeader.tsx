'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BookingHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}

export function BookingHeader({ 
  title = "Reserve at The Golden Oak", 
  subtitle = "Book your premium experience",
  showBack = true
}: BookingHeaderProps) {
  const router = useRouter();

  return (
    <div className="px-4 py-6 text-center relative border-b border-white/5 bg-obsidian sticky top-0 z-40">
      {showBack && (
        <button 
          onClick={() => router.back()}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-text-primary/70 hover:text-text-primary active:scale-95 transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      
      <h1 className="font-heading text-xl sm:text-2xl font-bold text-text-primary mb-1">
        {title}
      </h1>
      <p className="text-xs text-text-primary/50">
        {subtitle}
      </p>
    </div>
  );
}
