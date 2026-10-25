'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { CartSummary } from '@/components/cart/CartSummary';
import { EmptyCartState } from '@/components/cart/EmptyCartState';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const [taxRate, setTaxRate] = useState(0.05);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(s => {
        if (s.tax_rate_percent) setTaxRate(Number(s.tax_rate_percent) / 100);
      })
      .catch(() => {});
  }, []);

  const subtotal = getTotalPrice();

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col">
        <header className="px-4 py-4 flex items-center border-b border-white/5">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-text-primary ml-2">Your Cart</h1>
        </header>
        <div className="flex-1 flex flex-col justify-center">
          <EmptyCartState />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian pb-28">
      <header className="px-4 py-4 flex items-center border-b border-white/5 sticky top-0 bg-obsidian/90 backdrop-blur-md z-40">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-text-primary ml-2">Your Cart</h1>
      </header>

      <div className="p-4 flex flex-col gap-4">
        {items.map((item) => (
          <CartItemCard 
            key={item.cartItemId} 
            item={item} 
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        ))}
        
        <div className="mt-4">
          <CartSummary subtotal={subtotal} taxRate={taxRate} />
        </div>

        <button 
          onClick={() => router.push('/checkout')}
          className="w-full mt-4 bg-primary text-black py-4 rounded-xl font-semibold shadow-[0_0_20px_rgba(201,168,76,0.3)] active:scale-[0.98] transition-transform"
        >
          Proceed to Checkout
        </button>

        <button 
          onClick={() => router.push('/menu')}
          className="w-full mt-3 bg-[#1a1a1a] text-text-primary py-4 rounded-xl font-semibold border border-border-subtle active:scale-[0.98] transition-transform"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
