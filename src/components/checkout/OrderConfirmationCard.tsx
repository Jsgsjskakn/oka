'use client';

import { CheckCircle2, ShoppingBag, Clock, UtensilsCrossed, CreditCard } from 'lucide-react';
import type { OrderDetails } from '@/types/order';

interface OrderConfirmationCardProps {
  order: OrderDetails;
}

export function OrderConfirmationCard({ order }: OrderConfirmationCardProps) {
  const paymentLabels = { upi: 'UPI', card: 'Card', cash: 'Cash' };

  return (
    <div className="px-4 py-8 max-w-md mx-auto w-full">
      {/* Success Icon */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">Order Confirmed!</h1>
        <p className="text-text-primary/50 text-sm">Your order has been placed successfully.</p>
        <div className="mt-4 inline-block bg-[#1a1a1a] border border-border-subtle px-4 py-1.5 rounded-full">
          <span className="text-[10px] text-text-primary/50 uppercase tracking-widest mr-2">Order ID</span>
          <span className="text-sm font-bold text-primary">{order.id}</span>
        </div>
      </div>

      {/* Order Details Card */}
      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 shadow-2xl mb-6">
        <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">Order Summary</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-text-primary/40 uppercase tracking-wider mb-0.5">Order Type</p>
              <p className="text-sm text-text-primary font-medium capitalize">{order.orderType === 'dine-in' ? 'Dine In' : 'Takeaway'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-text-primary/40 uppercase tracking-wider mb-0.5">Items</p>
              <p className="text-sm text-text-primary font-medium">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-text-primary/40 uppercase tracking-wider mb-0.5">Total Amount</p>
              <p className="text-sm text-text-primary font-bold">₹{order.total.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-text-primary/40 uppercase tracking-wider mb-0.5">Estimated Preparation</p>
              <p className="text-sm text-text-primary font-medium">{order.estimatedPrepTime}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
