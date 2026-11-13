'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ShoppingBag } from 'lucide-react';
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
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredOrders =
    activeFilter === 'all'
      ? initialOrders
      : initialOrders.filter((o) => o.status === activeFilter);

  return (
    <div className="min-h-[calc(100vh-76px)] sm:min-h-[calc(100vh-84px)] bg-obsidian text-text-primary pb-24 md:pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-4 flex items-center gap-3 border-b border-white/5">
        <Link
          href="/profile"
          aria-label="Back to Profile"
          className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95 rounded-full hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-heading text-lg sm:text-xl font-bold">My Orders</h1>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Filter Tabs */}
        <div className="px-4 sm:px-6 py-4 flex gap-2 overflow-x-auto scrollbar-hide border-b border-white/5">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={`px-4 py-2 rounded-full text-xs font-medium border whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
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
        <div className="px-4 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredOrders.length === 0 ? (
            <div className="sm:col-span-2">
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
            </div>
          ) : (
            filteredOrders.map((order) => <OrderCard key={order.id} order={order} />)
          )}
        </div>
      </div>
    </div>
  );
}
