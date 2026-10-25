'use client';

import { useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { updateOrderStatusByEmployee } from '@/lib/actions/employee-actions';
import type { Database, OrderStatus } from '@/lib/db/types';
import { Clock, ExternalLink, Filter, Search, X, Activity } from 'lucide-react';
import { formatMoney } from '@/lib/db/types';

export type OrderWithDetails = Database['public']['Tables']['orders']['Row'] & {
  order_items: (Database['public']['Tables']['order_items']['Row'] & {
    dish_name: string;
  })[];
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (id?: string | null): boolean => Boolean(id && UUID_REGEX.test(id));

const VALID_TRANSITIONS: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'completed',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'New',
  confirmed: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50',
  confirmed: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
  preparing: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
  ready: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  completed: 'bg-zinc-800 text-zinc-300 border-zinc-600/50',
  cancelled: 'bg-red-900/40 text-red-300 border-red-700/50',
};

export function OrdersDashboard({ 
  initialOrders,
  employeeId,
  employeeName
}: { 
  initialOrders: OrderWithDetails[];
  employeeId: string;
  employeeName: string;
}) {
  const [orders, setOrders] = useState<OrderWithDetails[]>(initialOrders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);

  // 1. Primary: Convex Live Realtime Query
  const convexLiveOrders = useQuery(api.orders.getActiveOrders);

  useEffect(() => {
    if (convexLiveOrders !== undefined) {
      const mapped: OrderWithDetails[] = (convexLiveOrders || []).map((o: any) => ({
        id: o._id,
        restaurant_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        customer_name: o.customerName,
        customer_phone: o.customerPhone,
        customer_email: o.customerEmail || null,
        order_type: o.orderType,
        table_id: null,
        status: o.status,
        payment_status: o.paymentStatus,
        payment_method: o.paymentMethod,
        pickup_time: o.pickupTime || null,
        notes: o.notes || null,
        subtotal_paise: o.subtotalPaise,
        tax_paise: o.taxPaise,
        tip_paise: o.tipPaise,
        total_paise: o.totalPaise,
        idempotency_key: o.idempotencyKey || null,
        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
        processed_by: null,
        created_at: new Date(o.createdAt).toISOString(),
        updated_at: new Date(o.createdAt).toISOString(),
        order_items: (o.items || []).map((item: any, idx: number) => ({
          id: `item-${idx}`,
          order_id: o._id,
          dish_id: item.dishId,
          dish_name: item.dishName,
          dish_price_paise: item.dishPricePaise,
          quantity: item.quantity,
          size_name: item.sizeName || null,
          size_price_modifier_paise: item.sizePriceModifierPaise || 0,
          special_instructions: item.specialInstructions || null,
          line_total_paise: item.lineTotalPaise,
          created_at: new Date(o.createdAt).toISOString(),
        })),
      }));

      // Merge with any existing Supabase fallback orders
      setOrders((prev) => {
        // Collect all IDs and idempotency keys from active Convex orders
        const convexKeys = new Set<string>();
        for (const m of mapped) {
          if (m.id) convexKeys.add(m.id);
          if (m.idempotency_key) convexKeys.add(m.idempotency_key);
        }
        for (const o of (convexLiveOrders || [])) {
          if (o.legacyId) convexKeys.add(o.legacyId);
        }

        // Retain only valid Supabase fallback orders (distinguished by UUID pattern)
        // that do not match Convex order IDs or idempotency keys.
        // Completed Convex tickets (non-UUID ids) from prev are dropped since mapped is authoritative.
        const seenSupabaseKeys = new Set<string>();
        const validSupabaseOrders = prev.filter((p) => {
          // Fallback orders originating from Supabase always have standard UUID identifiers
          if (!isUuid(p.id)) return false;

          // Do not retain completed or cancelled tickets
          if (p.status === 'completed' || p.status === 'cancelled') return false;

          // Deduplicate if already present in Convex by order ID or idempotency key
          if (convexKeys.has(p.id)) return false;
          if (p.idempotency_key && convexKeys.has(p.idempotency_key)) return false;

          // Prevent duplicates within fallback orders
          const key = p.idempotency_key || p.id;
          if (seenSupabaseKeys.has(key)) return false;
          seenSupabaseKeys.add(key);

          return true;
        });

        return [...mapped, ...validSupabaseOrders].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    }
  }, [convexLiveOrders]);

  // 2. Secondary: Supabase Fallback Realtime Listener & Poller (Prevents Starving Fallback Orders)
  useEffect(() => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createBrowserClient(supabaseUrl, supabaseKey);

      const fetchLatestOrders = async () => {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id, quantity, line_total_paise, special_instructions, dish_name
            )
          `)
          .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
          .order('created_at', { ascending: true });

        if (error) {
          console.warn('[OrdersDashboard] Error fetching Supabase fallback orders:', error);
          return;
        }

        if (data) {
          setOrders((currentOrders) => {
            // Keep active Convex orders (non-UUID ids) from current state
            const convexOrders = currentOrders.filter((o) => !isUuid(o.id));
            const convexKeys = new Set<string>();
            for (const c of convexOrders) {
              if (c.id) convexKeys.add(c.id);
              if (c.idempotency_key) convexKeys.add(c.idempotency_key);
            }

            // Deduplicate incoming active Supabase orders against Convex and each other
            const activeSupabaseOrders: OrderWithDetails[] = [];
            const seenSupabaseKeys = new Set<string>();

            for (const sbo of data as OrderWithDetails[]) {
              if (convexKeys.has(sbo.id)) continue;
              if (sbo.idempotency_key && convexKeys.has(sbo.idempotency_key)) continue;

              const key = sbo.idempotency_key || sbo.id;
              if (seenSupabaseKeys.has(key)) continue;
              seenSupabaseKeys.add(key);

              activeSupabaseOrders.push(sbo);
            }

            return [...convexOrders, ...activeSupabaseOrders].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
        }
      };

      fetchLatestOrders();
      const interval = setInterval(fetchLatestOrders, 10000); // 10s fallback poller

      const channel = supabase
        .channel('public:orders:active')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchLatestOrders();
        })
        .subscribe();

      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    } catch {
      // fallback
    }
  }, []);

  const handleStatusUpdate = async (order: OrderWithDetails) => {
    if (updatingId) return;
    const nextStatus = VALID_TRANSITIONS[order.status];
    if (!nextStatus) return;

    setUpdatingId(order.id);
    
    // Optimistic UI update
    const previousOrders = [...orders];
    
    if (nextStatus === 'completed') {
      setOrders(prev => prev.filter(o => o.id !== order.id));
      setSelectedOrder(null);
    } else {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: nextStatus as OrderStatus } : o));
      if (selectedOrder?.id === order.id) {
        setSelectedOrder({ ...order, status: nextStatus as OrderStatus });
      }
    }

    // Call server action (which routes to Convex first, then Supabase fallback)
    const res = await updateOrderStatusByEmployee(order.id, nextStatus as OrderStatus, employeeId, employeeName);
    
    if (res?.error) {
      setOrders(previousOrders);
      if (selectedOrder?.id === order.id) setSelectedOrder(order);
      alert(`Error updating order: ${res.error}`);
    }
    
    setUpdatingId(null);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          o.id.toLowerCase().includes(s) || 
          (o.table_id && o.table_id.toLowerCase().includes(s))
        );
      }
      return true;
    });
  }, [orders, search, statusFilter]);

  const activeFilters = ['ALL', 'pending', 'confirmed', 'preparing', 'ready'];

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      
      {/* Controls Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by Order ID or Table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-border-subtle rounded-xl text-sm text-platinum focus:outline-none focus:border-champagne/50 transition-colors placeholder:text-zinc-600"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          {activeFilters.map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === filter 
                  ? 'bg-champagne text-obsidian shadow-[0_0_15px_rgba(214,183,122,0.3)]' 
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-platinum border border-border-subtle hover:border-zinc-700'
              }`}
            >
              {filter === 'ALL' ? 'All Active' : STATUS_LABELS[filter]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filteredOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-500 border border-dashed border-border-subtle rounded-3xl premium-glass">
          <div className="w-16 h-16 mb-4 rounded-full bg-zinc-900 flex items-center justify-center border border-border-subtle">
            <Activity className="w-6 h-6 text-zinc-700" />
          </div>
          <p className="text-lg font-medium text-zinc-300">No active orders</p>
          <p className="text-sm mt-1">All caught up. New orders will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {filteredOrders.map(order => {
            const placedTime = new Date(order.created_at);
            const elapsedMins = Math.floor((Date.now() - placedTime.getTime()) / 60000);
            const nextStatus = VALID_TRANSITIONS[order.status];

            return (
              <div key={order.id} className="premium-glass p-5 rounded-2xl flex flex-col hover:border-zinc-700 transition-colors group">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-platinum tracking-wide">
                      {order.order_type === 'dine-in' ? `TABLE ${order.table_id || '?'}` : 'PICKUP'}
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono mt-1">#{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-widest ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </div>
                </div>

                {/* Timing & Payment */}
                <div className="flex gap-3 text-xs mb-5 border-b border-border-subtle pb-4">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    {placedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                    <span className="text-zinc-600">({elapsedMins}m ago)</span>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center">
                    Pay: <span className={`ml-1 font-semibold ${order.payment_status === 'paid' ? 'text-emerald-400' : 'text-yellow-500'}`}>
                      {order.payment_status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="flex-1 mb-5">
                  <ul className="space-y-2 text-sm">
                    {order.order_items?.slice(0, 3).map(item => (
                      <li key={item.id} className="flex items-start text-zinc-300">
                        <span className="text-champagne font-bold mr-2.5">{item.quantity}×</span>
                        <span className="flex-1">{item.dish_name || 'Item'}</span>
                      </li>
                    ))}
                    {(order.order_items?.length || 0) > 3 && (
                      <li className="text-zinc-500 text-xs italic mt-2">
                        + {(order.order_items?.length || 0) - 3} more items...
                      </li>
                    )}
                  </ul>
                  {order.notes && (
                    <div className="mt-3 p-2 rounded bg-yellow-950/20 border border-yellow-900/30 text-xs text-yellow-200/80">
                      <strong>Note:</strong> {order.notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-auto pt-4 border-t border-border-subtle">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 hover:text-platinum transition-all flex items-center justify-center gap-2"
                  >
                    Details <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  {nextStatus && (
                    <button
                      onClick={() => handleStatusUpdate(order)}
                      disabled={updatingId === order.id}
                      className="flex-[1.5] py-2.5 rounded-xl bg-champagne text-obsidian text-xs font-extrabold uppercase tracking-widest hover:bg-white hover:shadow-[0_0_20px_rgba(214,183,122,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingId === order.id ? 'Updating...' : `Mark ${STATUS_LABELS[nextStatus]}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onUpdateStatus={() => handleStatusUpdate(selectedOrder)}
          isUpdating={updatingId === selectedOrder.id}
          nextStatus={VALID_TRANSITIONS[selectedOrder.status]}
        />
      )}
    </div>
  );
}

// Order Details Modal Component
function OrderDetailsModal({ 
  order, 
  onClose, 
  onUpdateStatus, 
  isUpdating, 
  nextStatus 
}: { 
  order: OrderWithDetails; 
  onClose: () => void; 
  onUpdateStatus: () => void; 
  isUpdating: boolean;
  nextStatus?: string;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-full flex flex-col bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
          <div>
            <h2 className="text-2xl font-bold text-platinum tracking-wide">
              {order.order_type === 'dine-in' ? `Table ${order.table_id || '?'}` : 'Pickup'}
            </h2>
            <p className="text-sm text-zinc-500 font-mono mt-1">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Metadata Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Status</p>
              <p className={`text-sm font-bold capitalize ${STATUS_COLORS[order.status]?.split(' ')[1] || 'text-white'}`}>{STATUS_LABELS[order.status] || order.status}</p>
            </div>
            <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Payment</p>
              <p className={`text-sm font-bold capitalize ${order.payment_status === 'paid' ? 'text-emerald-400' : 'text-yellow-500'}`}>{order.payment_status}</p>
            </div>
            <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Time</p>
              <p className="text-sm font-medium text-zinc-300">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
            <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Total</p>
              <p className="text-sm font-medium text-platinum">{formatMoney(order.total_paise || 0)}</p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4">Order Items</h3>
            <ul className="space-y-3">
              {order.order_items?.map(item => (
                <li key={item.id} className="flex items-start justify-between bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
                  <div className="flex items-start">
                    <span className="w-8 h-8 rounded-lg bg-zinc-800 text-champagne font-bold flex items-center justify-center mr-4 shrink-0">
                      {item.quantity}
                    </span>
                    <div>
                      <p className="font-medium text-platinum text-sm md:text-base">{item.dish_name || 'Item'}</p>
                      {item.special_instructions && (
                        <p className="text-xs text-yellow-500/80 mt-1 italic">Note: {item.special_instructions}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-zinc-400 shrink-0">
                    {formatMoney(item.line_total_paise || 0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {order.notes && (
            <div className="bg-yellow-950/20 border border-yellow-900/30 p-4 rounded-xl">
              <h3 className="text-[10px] uppercase tracking-widest text-yellow-600 font-bold mb-1">Customer Note</h3>
              <p className="text-sm text-yellow-200/90">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/80 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-300 font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>
          {nextStatus && (
            <button 
              onClick={onUpdateStatus}
              disabled={isUpdating}
              className="flex-[2] py-3 rounded-xl bg-champagne text-obsidian font-extrabold uppercase tracking-widest hover:bg-white hover:shadow-[0_0_30px_rgba(214,183,122,0.3)] transition-all disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : `Mark as ${STATUS_LABELS[nextStatus]}`}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
