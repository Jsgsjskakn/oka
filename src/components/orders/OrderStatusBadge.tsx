'use client';

import type { OrderStatus } from '@/types/order';

interface OrderStatusBadgeProps {
  status: OrderStatus | 'pending' | 'confirmed' | 'completed' | 'cancelled' | string;
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Received' },
  confirmed: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Confirmed' },
  received: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Received' },
  preparing: { bg: 'bg-warning/10', text: 'text-warning', label: 'Preparing' },
  ready: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Ready' },
  completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Completed' },
  cancelled: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'Cancelled' },
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.received;
  return (
    <span className={`${style.bg} ${style.text} text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider`}>
      {style.label}
    </span>
  );
}
