'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RotateCw, ShoppingBag } from 'lucide-react';
import { useOrderStore } from '@/store/order-store';
import { OrderConfirmationCard } from '@/components/checkout/OrderConfirmationCard';
import { OrderStatusSummary } from '@/components/checkout/OrderStatusSummary';

export function OrderSuccessClientFallback({ orderId }: { orderId?: string }) {
  const router = useRouter();
  const currentOrder = useOrderStore((s) => s.currentOrder);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (currentOrder && (!orderId || currentOrder.id === orderId)) {
    return (
      <div className="min-h-screen bg-obsidian text-text-primary pb-12">
        <OrderConfirmationCard order={currentOrder} />
        <OrderStatusSummary currentStatus={currentOrder.status} orderId={currentOrder.id} />

        <div className="mt-2 px-4 max-w-md lg:max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
          <Link
            href="/profile/orders"
            className="flex-1 min-h-[48px] py-3 px-5 flex items-center justify-center text-sm font-semibold text-black bg-primary hover:brightness-110 rounded-xl transition-all"
          >
            Track in Order History
          </Link>
          <Link
            href="/menu"
            className="flex-1 min-h-[48px] py-3 px-5 flex items-center justify-center text-sm font-medium text-text-primary/80 hover:text-text-primary border border-border-subtle rounded-xl bg-[#1a1a1a] hover:bg-white/5 transition-colors"
          >
            Return to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-text-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 sm:p-8 text-center shadow-2xl">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
          <ShoppingBag className="w-6 h-6 text-primary" />
        </div>
        <h1 className="font-heading text-xl font-bold mb-2">
          {orderId ? 'Locating Your Order' : 'Order Reference Missing'}
        </h1>
        <p className="text-sm text-text-primary/60 mb-6 leading-relaxed">
          {orderId
            ? `We could not immediately retrieve order ${orderId}. It may still be syncing or belong to a previous session.`
            : 'No order ID was provided in the confirmation link.'}
        </p>

        <div className="flex flex-col gap-3">
          {orderId && (
            <button
              type="button"
              onClick={() => router.refresh()}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-primary text-black text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
            >
              <RotateCw className="w-4 h-4" />
              <span>Refresh Order Status</span>
            </button>
          )}
          <Link
            href="/profile/orders"
            className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-text-primary flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            View My Orders
          </Link>
          <Link
            href="/menu"
            className="w-full min-h-[44px] py-2.5 px-4 text-sm text-primary hover:underline flex items-center justify-center"
          >
            Return to Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
