'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CheckoutHeader() {
  const router = useRouter();

  return (
    <div className="px-4 py-5 flex items-center gap-3 border-b border-white/5 bg-obsidian sticky top-0 z-40">
      <button 
        onClick={() => router.back()}
        className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95 transition-all"
        aria-label="Go back"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <div>
        <h1 className="font-heading text-lg font-bold text-text-primary">Checkout</h1>
        <p className="text-[10px] text-text-primary/40">Complete your order</p>
      </div>
    </div>
  );
}
