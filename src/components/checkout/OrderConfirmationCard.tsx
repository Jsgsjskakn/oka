'use client';

import { CheckCircle2, ShoppingBag, Clock, UtensilsCrossed, CreditCard, Bike, MapPin } from 'lucide-react';
import type { StoredOrderDetails } from '@/store/order-store';

interface OrderConfirmationCardProps {
  order: StoredOrderDetails;
}

function formatRupees(amount: number): string {
  return Number.isInteger(amount)
    ? amount.toLocaleString('en-IN')
    : amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function OrderConfirmationCard({ order }: OrderConfirmationCardProps) {
  const paymentLabels: Record<string, string> = {
    upi: 'UPI / GPay / PhonePe',
    card: 'Card',
    cash: 'Cash at Counter',
  };
  const totalDishCount = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div className="px-4 py-8 max-w-md lg:max-w-2xl mx-auto w-full">
      {/* Success Icon */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          Order Confirmed!
        </h1>
        <p className="text-text-primary/60 text-sm">
          Your order has been placed successfully and relayed to our kitchen.
        </p>
        {order.id && (
          <div className="mt-4 inline-flex items-center bg-[#1a1a1a] border border-border-subtle px-4 py-1.5 rounded-full max-w-full">
            <span className="text-[10px] text-text-primary/50 uppercase tracking-widest mr-2 shrink-0">
              Order ID
            </span>
            <span className="text-xs sm:text-sm font-bold text-primary font-mono truncate">
              {order.id}
            </span>
          </div>
        )}
      </div>

      {/* Order Details Card */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl mb-6">
        <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">Order Summary</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              {order.orderType === 'delivery' ? (
                <Bike className="w-4 h-4 text-primary" />
              ) : (
                <UtensilsCrossed className="w-4 h-4 text-primary" />
              )}
            </div>
            <div>
              <p className="text-[10px] text-text-primary/45 uppercase tracking-wider mb-0.5">
                Dining Option
              </p>
              <p className="text-sm text-text-primary font-medium">
                {order.orderType === 'dine-in'
                  ? 'Dine In'
                  : order.orderType === 'delivery'
                  ? 'Home Delivery'
                  : 'Takeaway'}
                {order.tableNumber ? ` · Table #${order.tableNumber}` : ''}
                {order.orderType === 'takeaway' && order.pickupTime ? ` · Pickup in ${order.pickupTime}` : ''}
                {order.orderType === 'delivery' ? ' · Direct to Door' : ''}
              </p>
            </div>
          </div>

          {order.deliveryAddress && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-text-primary/45 uppercase tracking-wider mb-0.5">
                  Delivery Address
                </p>
                <p className="text-sm text-text-primary/80 font-light leading-relaxed">
                  {order.deliveryAddress}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-text-primary/45 uppercase tracking-wider mb-0.5">
                Items ({totalDishCount} dish{totalDishCount !== 1 ? 'es' : ''})
              </p>
              <ul className="space-y-1 text-sm text-text-primary/85">
                {order.items.map((item, idx) => (
                  <li key={item.cartItemId || idx} className="flex items-baseline justify-between gap-2">
                    <span className="truncate">
                      <span className="font-mono text-primary mr-1.5">{item.quantity}×</span>
                      {item.dish?.name || 'Dish'}
                      {item.size?.name ? ` (${item.size.name})` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-text-primary/45 uppercase tracking-wider mb-0.5">
                Total Amount · {paymentLabels[order.paymentMethod] || order.paymentMethod}
              </p>
              <p className="text-sm text-text-primary font-bold">
                ₹{formatRupees(order.total)}
                {order.tip && order.tip > 0 ? (
                  <span className="text-xs font-normal text-text-primary/50 ml-2">
                    (incl. ₹{formatRupees(order.tip)} tip)
                  </span>
                ) : null}
                {order.discount && order.discount > 0 ? (
                  <span className="text-xs font-semibold text-[#22C58B] ml-2">
                    (saved ₹{formatRupees(order.discount)}{order.promoCode ? ` via ${order.promoCode}` : ''})
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-text-primary/45 uppercase tracking-wider mb-0.5">
                Estimated Preparation
              </p>
              <p className="text-sm text-text-primary font-medium">{order.estimatedPrepTime}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
