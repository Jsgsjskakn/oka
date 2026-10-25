'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Activity } from 'lucide-react';

export function EmployeeRealtimeStatus() {
  const [status, setStatus] = useState<'LIVE' | 'RECONNECTING' | 'DISCONNECTED'>('RECONNECTING');

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase.channel('system_ping');

    channel
      .on('system', { event: '*' }, () => {}) // Dummy listener just to keep channel active
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setStatus('LIVE');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setStatus('DISCONNECTED');
        } else {
          setStatus('RECONNECTING');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      <span className={`text-[10px] uppercase font-bold tracking-widest ${
        status === 'LIVE' ? 'text-emerald-500' : 
        status === 'RECONNECTING' ? 'text-yellow-500' : 'text-red-500'
      }`}>
        {status}
      </span>
    </div>
  );
}
