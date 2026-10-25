'use client';

import type { OrderStatus } from '@/types/order';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusStyles: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  received: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Received' },
  preparing: { bg: 'bg-warning/10', text: 'text-warning', label: 'Preparing' },
  ready: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Ready' },
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.received;
  return (
    <span className={`${style.bg} ${style.text} text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider`}>
      {style.label}
    </span>
  );
}
