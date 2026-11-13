'use client';

import { useEffect, useState } from 'react';
import { Circle, CheckCircle2, XCircle } from 'lucide-react';
import type { OrderStatus } from '@/types/order';
import { createBrowserClient } from '@supabase/ssr';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';

interface OrderStatusSummaryProps {
  orderId?: string;
  currentStatus: OrderStatus | 'completed' | 'cancelled' | string;
}

const steps: { key: string; label: string }[] = [
  { key: 'received', label: 'Order Received' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
];

function mapOrderStatus(rawStatus: string): string {
  if (rawStatus === 'pending' || rawStatus === 'confirmed') return 'received';
  return rawStatus;
}

export function OrderStatusSummary({ currentStatus, orderId }: OrderStatusSummaryProps) {
  const [status, setStatus] = useState<string>(() => mapOrderStatus(currentStatus));

  useEffect(() => {
    setStatus(mapOrderStatus(currentStatus));
  }, [currentStatus]);

  // 1. Primary Realtime: Convex Query
  const isConvexId = !!orderId && !orderId.includes('-') && /^[a-z0-9]+$/i.test(orderId);
  const convexOrder = useQuery(
    api.orders.getOrderById,
    isConvexId ? { orderId: orderId as any } : 'skip'
  );

  useEffect(() => {
    if (convexOrder?.status) {
      setStatus(mapOrderStatus(convexOrder.status));
    }
  }, [convexOrder]);

  // 2. Secondary Realtime: Supabase Fallback & Periodic Fetch for legacy / UUID orders
  useEffect(() => {
    if (!orderId || isConvexId) return;

    let isSubscribed = true;

    // Direct API poll fallback for legacy / offline orders
    const fetchStatus = () => {
      fetch(`/api/orders/${orderId}`)
        .then((res) => res.json())
        .then((data) => {
          if (isSubscribed && data?.order?.status) {
            setStatus(mapOrderStatus(data.order.status));
          }
        })
        .catch(() => {});
    };

    const interval = setInterval(fetchStatus, 4000);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        return () => {
          isSubscribed = false;
          clearInterval(interval);
        };
      }

      const supabase = createBrowserClient(supabaseUrl, supabaseKey);

      const channel = supabase
        .channel(`public:orders:status:${orderId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
          (payload) => {
            if (payload.new?.status) {
              setStatus(mapOrderStatus(payload.new.status));
            }
          }
        )
        .subscribe();

      return () => {
        isSubscribed = false;
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    } catch {
      return () => {
        isSubscribed = false;
        clearInterval(interval);
      };
    }
  }, [orderId, isConvexId]);

  if (status === 'cancelled') {
    return (
      <div className="px-4 pb-8 max-w-md lg:max-w-2xl mx-auto w-full">
        <div className="bg-[#1a1a1a] border border-rose-500/30 rounded-2xl p-5 flex items-center gap-4">
          <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-rose-200">Order Cancelled</h3>
            <p className="text-xs text-text-primary/50 mt-0.5">
              This order has been cancelled. Please reach out to our concierge if you need assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = Math.max(0, steps.findIndex((s) => s.key === status));

  return (
    <div className="px-4 pb-8 max-w-md lg:max-w-2xl mx-auto w-full">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 sm:p-6">
        <h3 className="text-xs font-semibold text-text-primary/45 uppercase tracking-widest mb-5">
          Order Status
        </h3>
        <div className="flex flex-col gap-0">
          {steps.map((step, index) => {
            const isComplete = index <= currentIndex;
            const isLast = index === steps.length - 1;
            const isActiveInProgress = status === step.key && step.key !== 'completed';
            return (
              <div key={step.key} className="flex items-start gap-4 relative">
                {!isLast && (
                  <div
                    className={`absolute left-[9px] top-7 w-[2px] h-8 transition-colors ${
                      index < currentIndex ? 'bg-primary' : 'bg-white/10'
                    }`}
                  />
                )}
                <div className="relative z-10 py-1">
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-primary fill-primary/10" />
                  ) : (
                    <Circle className="w-5 h-5 text-text-primary/20" />
                  )}
                </div>
                <div className="py-1 pb-4">
                  <p
                    className={`text-sm font-medium transition-colors ${
                      isComplete ? 'text-text-primary' : 'text-text-primary/40'
                    }`}
                  >
                    {step.label}
                  </p>
                  {isActiveInProgress && (
                    <p className="text-[11px] text-primary mt-0.5 animate-pulse">
                      In progress...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
