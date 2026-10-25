'use client';

import { useEffect, useState } from 'react';
import { Circle, CheckCircle2 } from 'lucide-react';
import type { OrderStatus } from '@/types/order';
import { createBrowserClient } from '@supabase/ssr';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';

interface OrderStatusSummaryProps {
  orderId?: string;
  currentStatus: OrderStatus;
}

const steps: { key: OrderStatus | string; label: string }[] = [
  { key: 'received', label: 'Order Received' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
];

export function OrderStatusSummary({ currentStatus, orderId }: OrderStatusSummaryProps) {
  const [status, setStatus] = useState<OrderStatus | string>(currentStatus);

  // 1. Primary Realtime: Convex Query
  const isConvexId = !!orderId && orderId.length > 25 && !orderId.includes('-');
  const convexOrder = useQuery(
    api.orders.getOrderById,
    isConvexId ? { orderId: orderId as any } : 'skip'
  );

  useEffect(() => {
    if (convexOrder) {
      const newStatus = convexOrder.status;
      const mappedStatus = (newStatus === 'pending' || newStatus === 'confirmed' ? 'received' : newStatus);
      setStatus(mappedStatus);
    }
  }, [convexOrder]);

  // 2. Secondary Realtime: Supabase Fallback (for legacy UUID orders)
  useEffect(() => {
    if (!orderId || isConvexId) return;
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createBrowserClient(supabaseUrl, supabaseKey);
      
      const channel = supabase.channel(`public:orders:status:${orderId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
          (payload) => {
            const newStatus = payload.new.status;
            const mappedStatus = (newStatus === 'pending' || newStatus === 'confirmed' ? 'received' : newStatus);
            setStatus(mappedStatus);
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // ignore
    }
  }, [orderId, isConvexId]);

  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="px-4 pb-8 max-w-md mx-auto w-full">
      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5">
        <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-5">
          Order Status
        </h3>
        <div className="flex flex-col gap-0">
          {steps.map((step, index) => {
            const isComplete = index <= currentIndex;
            const isLast = index === steps.length - 1;
            return (
              <div key={step.key} className="flex items-start gap-4 relative">
                {!isLast && (
                  <div
                    className={`absolute left-3.5 top-7 w-[2px] h-8 -ml-[1px] transition-colors ${
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
                <div className="py-1">
                  <p
                    className={`text-sm font-medium transition-colors ${
                      isComplete ? 'text-text-primary' : 'text-text-primary/40'
                    }`}
                  >
                    {step.label}
                  </p>
                  {status === step.key && (
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
