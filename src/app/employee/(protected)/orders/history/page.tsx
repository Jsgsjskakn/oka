import { requireEmployee } from '@/lib/auth/employee-auth';
import { createClient } from '@/lib/supabase/server';
import { HistoryFilters } from '@/components/employee/HistoryFilters';
import { formatMoney } from '@/lib/db/types';
import { Clock, SearchX } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EmployeeHistoryPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requireEmployee();
  const searchParams = await props.searchParams;
  
  const supabase = await createClient();
  
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  const status = typeof searchParams.status === 'string' ? searchParams.status : '';
  const dateStr = typeof searchParams.date === 'string' ? searchParams.date : '';
  const page = parseInt(typeof searchParams.page === 'string' ? searchParams.page : '1') || 1;
  const limit = 50;
  
  let orders: any[] = [];
  let count: number | null = 0;

  // 1. Convex Primary Query
  try {
    const { fetchQuery } = await import('convex/nextjs');
    const { api } = await import('@/../convex/_generated/api');
    const convexOrders = await fetchQuery(api.orders.getOrderHistory, {});
    if (convexOrders && convexOrders.length > 0) {
      let filtered = convexOrders.filter((o: any) => {
        if (status) return o.status === status;
        return ['completed', 'cancelled'].includes(o.status);
      });

      if (q) {
        const lowerQ = q.toLowerCase();
        filtered = filtered.filter((o: any) =>
          o._id.toLowerCase().includes(lowerQ) ||
          (o.tableNumber && String(o.tableNumber).includes(lowerQ)) ||
          (o.customerName && o.customerName.toLowerCase().includes(lowerQ))
        );
      }

      if (dateStr === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter((o: any) => o.createdAt >= today.getTime());
      } else if (dateStr === 'yesterday') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        filtered = filtered.filter((o: any) => o.createdAt >= yesterday.getTime() && o.createdAt < today.getTime());
      } else if (dateStr === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter((o: any) => o.createdAt >= weekAgo.getTime());
      }

      count = filtered.length;
      const paginated = filtered.slice((page - 1) * limit, page * limit);
      orders = paginated.map((o: any) => ({
        id: o._id,
        order_type: o.orderType,
        table_id: o.tableNumber || null,
        created_at: new Date(o.createdAt).toISOString(),
        order_items: (o.items || []).map((i: any) => ({
          dish_name: i.dishName,
          quantity: i.quantity,
          line_total_paise: i.lineTotalPaise,
        })),
        total_paise: o.totalPaise || (o.subtotalPaise + (o.taxPaise || 0) + (o.tipPaise || 0)),
        status: o.status,
        payment_status: o.paymentStatus || 'paid',
      }));
    }
  } catch {
    // fallback to Supabase
  }

  // 2. Supabase Fallback Query
  if (orders.length === 0) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id, quantity, line_total_paise, special_instructions, dish_name
          )
        `, { count: 'exact' })
        .in('status', status ? [status] : ['completed', 'cancelled']);

      if (q) {
        if (!isNaN(Number(q))) {
          query = query.or(`id.ilike.%${q}%,table_id.eq.${q}`);
        } else {
          query = query.ilike('id', `%${q}%`);
        }
      }

      if (dateStr === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('created_at', today.toISOString());
      } else if (dateStr === 'yesterday') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        query = query.gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString());
      } else if (dateStr === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      }

      const { data: sbOrders, count: sbCount } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      
      if (sbOrders) {
        orders = sbOrders;
        count = sbCount;
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <HistoryFilters />

      {!orders || orders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-500 border border-dashed border-border-subtle rounded-3xl premium-glass">
          <div className="w-16 h-16 mb-4 rounded-full bg-zinc-900 flex items-center justify-center border border-border-subtle">
            <SearchX className="w-6 h-6 text-zinc-700" />
          </div>
          <p className="text-lg font-medium text-zinc-300">No orders found</p>
          <p className="text-sm mt-1">Try changing your filters or date range.</p>
        </div>
      ) : (
        <div className="bg-zinc-950/50 border border-border-subtle rounded-2xl overflow-hidden premium-glass">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-900/80 text-zinc-400 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Table/Pickup</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-zinc-300">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-zinc-500">
                      {order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 font-medium text-platinum">
                      {order.order_type === 'dine-in' ? `Table ${order.table_id || '?'}` : 'Pickup'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {order.order_items?.length} items
                    </td>
                    <td className="px-6 py-4 font-medium text-champagne">
                      {formatMoney(order.total_paise || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        order.status === 'completed' ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-red-900/40 text-red-400 border border-red-900/50'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${order.payment_status === 'paid' ? 'text-emerald-400' : 'text-yellow-500'}`}>
                        {order.payment_status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {count && count > limit && (
            <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between bg-zinc-900/40">
              <span className="text-xs text-zinc-500 font-medium">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, count)} of {count} orders
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link 
                    href={`?page=${page - 1}${q ? `&q=${q}` : ''}${status ? `&status=${status}` : ''}${dateStr ? `&date=${dateStr}` : ''}`}
                    className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider hover:bg-zinc-700 transition-colors"
                  >
                    Previous
                  </Link>
                )}
                {page * limit < count && (
                  <Link 
                    href={`?page=${page + 1}${q ? `&q=${q}` : ''}${status ? `&status=${status}` : ''}${dateStr ? `&date=${dateStr}` : ''}`}
                    className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider hover:bg-zinc-700 transition-colors"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
