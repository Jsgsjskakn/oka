'use client';

import { ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function EmptyCartState() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-border-subtle">
        <ShoppingBag className="w-8 h-8 text-text-primary/20" />
      </div>
      
      <h2 className="text-xl font-semibold text-text-primary mb-2">
        Your cart is empty
      </h2>
      <p className="text-sm text-text-primary/50 max-w-[250px] mb-8 leading-relaxed">
        Discover our premium selection of dishes and add your favorites to the cart.
      </p>

      <button
        onClick={() => router.push('/menu')}
        className="bg-white text-black px-8 py-3 rounded-full font-semibold active:scale-[0.98] transition-transform"
      >
        Browse Menu
      </button>
    </div>
  );
}
