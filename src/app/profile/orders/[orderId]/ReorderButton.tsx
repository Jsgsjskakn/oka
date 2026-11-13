'use client';

import { RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart-store';
import { toast } from '@/store/toast-store';

export function ReorderButton({ items }: { items: any[] }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const handleReorder = () => {
    if (!items.length) {
      router.push('/menu');
      return;
    }
    items.forEach((item) => {
      addItem(item.dish, item.quantity, {
        size: item.size,
        selectedAddOns: item.selectedAddOns,
        specialInstructions: item.specialInstructions,
      });
    });
    toast.success('Order Added to Cart', `${items.length} item${items.length > 1 ? 's' : ''} ready in your cart.`);
    router.push('/cart');
  };

  return (
    <button
      type="button"
      onClick={handleReorder}
      className="w-full bg-primary text-black py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(201,168,76,0.2)] active:scale-[0.98] transition-transform cursor-pointer"
    >
      <RotateCcw className="w-4 h-4" />
      Reorder
    </button>
  );
}
