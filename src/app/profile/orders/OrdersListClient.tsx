'use client';

import { useState } from 'react';
import { ChevronLeft, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { OrderCard } from '@/components/orders/OrderCard';
import { EmptyState } from '@/components/shared/EmptyState';
import type { OrderDetails, OrderStatus } from '@/types/order';

type FilterType = 'all' | OrderStatus;

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'received', label: 'Active' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Completed' },
];

export function OrdersListClient({ initialOrders }: { initialOrders: OrderDetails[] }) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredOrders =
    activeFilter === 'all'
      ? initialOrders
      : initialOrders.filter((o) => o.status === activeFilter);

  return (
    <div className="min-h-screen bg-obsidian text-text-primary pb-24">
      <div className="px-4 py-5 flex items-center gap-3 border-b border-white/5 sticky top-0 bg-obsidian z-40">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-heading text-lg font-bold">My Orders</h1>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-4 flex gap-2 overflow-x-auto scrollbar-hide border-b border-white/5">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`px-4 py-2 rounded-full text-xs font-medium border whitespace-nowrap transition-all active:scale-95 ${
              activeFilter === key
                ? 'bg-primary border-primary text-black'
                : 'bg-transparent border-border-subtle text-text-primary/60 hover:border-white/30'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="px-4 py-4 flex flex-col gap-3">
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="w-7 h-7 text-text-primary/30" />}
            title="No Orders Found"
            description={
              activeFilter === 'all'
                ? 'Your order history will appear here once you place your first order.'
                : `No ${filters.find((f) => f.key === activeFilter)?.label.toLowerCase()} orders found.`
            }
            actionLabel="Explore Menu"
            actionHref="/menu"
          />
        ) : (
          filteredOrders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
}
