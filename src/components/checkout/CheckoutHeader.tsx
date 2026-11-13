'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CheckoutHeader() {
  const router = useRouter();

  return (
    <header className="border-b border-white/5 bg-obsidian/95 backdrop-blur-lg sticky top-0 z-40">
      <div className="max-w-md lg:max-w-5xl mx-auto px-4 lg:px-6 py-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-11 h-11 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95 transition-all rounded-full hover:bg-white/5"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="font-heading text-lg sm:text-xl font-bold text-text-primary">Checkout</h1>
          <p className="text-[11px] text-text-primary/45">Complete your order</p>
        </div>
      </div>
    </header>
  );
}
