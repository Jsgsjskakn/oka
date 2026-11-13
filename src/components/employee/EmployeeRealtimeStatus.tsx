'use client';

import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';

export function EmployeeRealtimeStatus() {
  const convexOrders = useQuery(api.orders.getActiveOrders);
  const [supabaseStatus, setSupabaseStatus] = useState<'LIVE' | 'RECONNECTING' | 'DISCONNECTED'>('RECONNECTING');

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    const channel = supabase.channel('system_ping');

    channel
      .on('system', { event: '*' }, () => {})
      .subscribe((nextStatus) => {
        if (nextStatus === 'SUBSCRIBED') {
          setSupabaseStatus('LIVE');
        } else if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT') {
          setSupabaseStatus('DISCONNECTED');
        } else {
          setSupabaseStatus('RECONNECTING');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const status: 'LIVE' | 'RECONNECTING' | 'DISCONNECTED' =
    convexOrders !== undefined
      ? 'LIVE'
      : isSupabaseConfigured()
      ? supabaseStatus
      : 'RECONNECTING';

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-2 w-2">
        {status === 'LIVE' && (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </>
        )}
        {status === 'RECONNECTING' && (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500 animate-pulse"></span>
        )}
        {status === 'DISCONNECTED' && (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        )}
      </div>
      <span
        className={`text-[10px] uppercase font-bold tracking-widest ${
          status === 'LIVE'
            ? 'text-emerald-500'
            : status === 'RECONNECTING'
            ? 'text-yellow-500'
            : 'text-red-500'
        }`}
      >
        {status}
      </span>
    </div>
  );
}
