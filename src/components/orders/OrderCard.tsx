'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { OrderDetails } from '@/types/order';
import { OrderStatusBadge } from './OrderStatusBadge';

interface OrderCardProps {
  order: OrderDetails;
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Link
      href={`/profile/orders/${order.id}`}
      className="block bg-[#1a1a1a] border border-white/5 rounded-xl p-4 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">{order.id}</p>
          <p className="text-[10px] text-text-primary/40 mt-0.5">
            {format(parseISO(order.createdAt), 'MMM d, yyyy · h:mm a')}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-primary/50">
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </span>
          <span className="text-text-primary/20">·</span>
          <span className="text-xs text-text-primary/50 capitalize">{order.orderType === 'dine-in' ? 'Dine In' : 'Takeaway'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-primary">₹{order.total}</span>
          <ChevronRight className="w-4 h-4 text-text-primary/30" />
        </div>
      </div>
    </Link>
  );
}
