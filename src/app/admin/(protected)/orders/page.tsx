import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { formatMoney } from '@/lib/db/types';
import { getAllOrders } from '@/lib/services/order.service';
import { 
  Eye, 
  Search, 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  Phone,
} from 'lucide-react';

export const metadata = {
  title: 'Order List | Admin | The Golden Oak',
};

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase() ?? 'unknown';
  
  const config: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    pending: {
      bg: 'bg-amber-400/20',
      text: 'text-amber-300',
      border: 'border-amber-400/40',
      dot: 'bg-amber-400 animate-pulse',
    },
    confirmed: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-300',
      border: 'border-blue-500/40',
      dot: 'bg-blue-400',
    },
    preparing: {
      bg: 'bg-orange-500/20',
      text: 'text-orange-300',
      border: 'border-orange-500/40',
      dot: 'bg-orange-400 animate-pulse',
    },
    ready: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-300',
      border: 'border-emerald-500/40',
      dot: 'bg-emerald-400 animate-pulse',
    },
    completed: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-300',
      border: 'border-emerald-500/40',
      dot: 'bg-emerald-400',
    },
    cancelled: {
      bg: 'bg-rose-500/20',
      text: 'text-rose-300',
      border: 'border-rose-500/40',
      dot: 'bg-rose-400',
    },
  };

  const current = config[normalized] || {
    bg: 'bg-white/10',
    text: 'text-zinc-300',
    border: 'border-white/20',
    dot: 'bg-zinc-400',
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-full ${current.bg} ${current.text} ${current.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {status}
    </span>
  );
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const statusFilter = params.status;
  const search = params.search;

  const RESTAURANT_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
  
  // Fetch all orders for telemetry metrics
  const allOrders = await getAllOrders(RESTAURANT_ID);
  const normalizedSearch = search?.trim().toLowerCase() || '';

  // Filtered orders for table (supports status + search across name, phone, or order ID)
  const orders = (allOrders ?? []).filter((o: any) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (!normalizedSearch) return true;
    return (
      String(o.customer_phone || '').toLowerCase().includes(normalizedSearch) ||
      String(o.customer_name || '').toLowerCase().includes(normalizedSearch) ||
      String(o.id || '').toLowerCase().includes(normalizedSearch)
    );
  });

  const totalOrdersCount = allOrders?.length ?? 0;
  const totalRevenuePaise = allOrders
    ?.filter(o => o.status === 'completed')
    ?.reduce((sum, o) => sum + (o.total_paise ?? 0), 0) ?? 0;
  
  const activeOrdersCount = allOrders
    ?.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready' || o.status === 'confirmed')
    ?.length ?? 0;

  const completedCount = allOrders
    ?.filter(o => o.status === 'completed')
    ?.length ?? 0;

  return (
    <div className="space-y-3 select-none font-sans">
      {/* ===================================================================== */}
      {/* 1. TOP METRIC CARDS: 4 Glowing Dark Glass Cards                       */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Settled Revenue (Emerald Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-emerald-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
              ₹
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Settled Revenue</span>
          </div>
          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {formatMoney(totalRevenuePaise)}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="emeraldGradOrd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 35 Q 20 28, 35 30 T 60 18 T 80 12 T 100 5 L 100 40 L 0 40 Z" fill="url(#emeraldGradOrd)" />
              <path d="M 0 35 Q 20 28, 35 30 T 60 18 T 80 12 T 100 5" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#34d399]" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold relative z-10">
            <TrendingUp className="w-3 h-3" /> Reconciled Sales
          </div>
        </div>

        {/* Card 2: Total Orders (Amber Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-amber-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Total Orders</span>
          </div>
          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {totalOrdersCount}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="amberGradOrd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 32 Q 25 35, 45 22 T 75 18 T 100 8 L 100 40 L 0 40 Z" fill="url(#amberGradOrd)" />
              <path d="M 0 32 Q 25 35, 45 22 T 75 18 T 100 8" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#fbbf24]" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold relative z-10">
            <TrendingUp className="w-3 h-3" /> Live Kitchen Tickets
          </div>
        </div>

        {/* Card 3: Active in Kitchen (Purple Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-purple-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-purple-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-inner">
              <ChefHat className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Active in Kitchen</span>
          </div>
          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {activeOrdersCount}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="purpleGradOrd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 25 Q 25 32, 50 20 T 75 14 T 100 10 L 100 40 L 0 40 Z" fill="url(#purpleGradOrd)" />
              <path d="M 0 25 Q 25 32, 50 20 T 75 14 T 100 10" fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#c084fc]" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-purple-400 font-bold relative z-10">
            <Clock className="w-3 h-3" /> In Preparation
          </div>
        </div>

        {/* Card 4: Fulfilled Orders (Rose Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-rose-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-rose-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Fulfilled Orders</span>
          </div>
          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {completedCount}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="roseGradOrd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 35 Q 25 30, 45 32 T 75 16 T 100 10 L 100 40 L 0 40 Z" fill="url(#roseGradOrd)" />
              <path d="M 0 35 Q 25 30, 45 32 T 75 16 T 100 10" fill="none" stroke="#fb7185" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#fb7185]" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-bold relative z-10">
            <CheckCircle2 className="w-3 h-3" /> Completed & Billed
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. MAIN ORDERS PANEL: Translucent Frosted Glass Card                  */}
      {/* ===================================================================== */}
      <div className="rounded-[20px] bg-black/35 backdrop-blur-xl border border-white/10 p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs md:text-sm font-bold text-white tracking-wide">
              Orders Feed
            </h2>
            <span className="bg-white/10 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10 font-mono">
              {totalOrdersCount}
            </span>
          </div>

          {/* Search & Filter Form */}
          <form className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 min-w-[140px] sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400" />
              <input
                name="search"
                defaultValue={search}
                placeholder="Search name, phone, ID..."
                className="w-full pl-7 pr-2.5 py-1 bg-[#201d24] border border-white/10 rounded-lg text-[10px] text-white placeholder-zinc-500 focus:border-amber-400/40 outline-none"
              />
            </div>
            <select 
              name="status"
              defaultValue={statusFilter || ''}
              className="px-2 py-1 bg-[#201d24] border border-white/10 rounded-lg text-[10px] text-zinc-300 outline-none cursor-pointer"
            >
              <option value="" className="bg-zinc-900 text-white">All Statuses</option>
              <option value="pending" className="bg-zinc-900 text-white">Pending</option>
              <option value="confirmed" className="bg-zinc-900 text-white">Confirmed</option>
              <option value="preparing" className="bg-zinc-900 text-white">Preparing</option>
              <option value="ready" className="bg-zinc-900 text-white">Ready</option>
              <option value="completed" className="bg-zinc-900 text-white">Completed</option>
              <option value="cancelled" className="bg-zinc-900 text-white">Cancelled</option>
            </select>
            <button 
              type="submit" 
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-lg text-[10px] transition-colors shadow-sm cursor-pointer"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="text-zinc-500 border-b border-white/5 text-[9px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-3 py-2">Order ID</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {orders?.map((order: any) => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-3 py-2 font-mono text-[10px]">
                    <span className="text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      #{order.id?.slice(0, 8) ?? 'N/A'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-semibold text-white text-[11px]">
                      {order.customer_name || 'Guest'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-zinc-300 border border-white/10 capitalize">
                      {order.order_type || 'dine-in'}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-bold text-white font-mono text-xs">
                    {formatMoney(order.total_paise)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-3 py-2 text-zinc-400 text-[10px]">
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-medium text-white transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Details</span>
                    </Link>
                  </td>
                </tr>
              ))}
              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 text-xs">
                    No active kitchen orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
