import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { formatMoney } from '@/lib/db/types';
import { getAllOrders } from '@/lib/services/order.service';
import { 
  Eye, 
  Search, 
  Filter, 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  ChefHat, 
  Phone, 
  ChevronRight, 
  ArrowLeft, 
  ArrowRight,
  UtensilsCrossed
} from 'lucide-react';

export const metadata = {
  title: 'Orders | Admin | The Golden Oak',
};

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase() ?? 'unknown';
  
  const config: Record<string, { bg: string; text: string; border: string; shadow: string; dot: string }> = {
    pending: {
      bg: 'bg-amber-500/10',
      text: 'text-warning',
      border: 'border-amber-500/25',
      shadow: 'shadow-amber-500/10',
      dot: 'bg-amber-400 animate-pulse',
    },
    confirmed: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-300',
      border: 'border-blue-500/25',
      shadow: 'shadow-blue-500/10',
      dot: 'bg-blue-400',
    },
    preparing: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-300',
      border: 'border-orange-500/25',
      shadow: 'shadow-orange-500/10',
      dot: 'bg-orange-400 animate-pulse',
    },
    ready: {
      bg: 'bg-platinum/5',
      text: 'text-platinum',
      border: 'border-cyan-500/25',
      shadow: 'shadow-cyan-500/10',
      dot: 'bg-cyan-400 animate-pulse',
    },
    completed: {
      bg: 'bg-emerald-500/10',
      text: 'text-success',
      border: 'border-emerald-500/25',
      shadow: 'shadow-emerald-500/10',
      dot: 'bg-emerald-400 shadow-[0_0_6px_#34d399]',
    },
    delivered: {
      bg: 'bg-emerald-500/10',
      text: 'text-success',
      border: 'border-emerald-500/25',
      shadow: 'shadow-emerald-500/10',
      dot: 'bg-emerald-400 shadow-[0_0_6px_#34d399]',
    },
    cancelled: {
      bg: 'bg-rose-500/10',
      text: 'text-danger',
      border: 'border-rose-500/25',
      shadow: 'shadow-rose-500/10',
      dot: 'bg-rose-400',
    },
  };

  const current = config[normalized] || {
    bg: 'bg-elevated/80',
    text: 'text-text-secondary',
    border: 'border-border-strong/50',
    shadow: 'shadow-black/10',
    dot: 'bg-zinc-400',
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest border rounded-full shadow-sm backdrop-blur-sm ${current.bg} ${current.text} ${current.border} ${current.shadow}`}>
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
  const page = parseInt(params.page || '1');
  const statusFilter = params.status;
  const search = params.search;

  const RESTAURANT_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
  
  // Fetch all orders for telemetry metrics
  const allOrders = await getAllOrders(RESTAURANT_ID);
  
  // Filtered orders for table
  const orders = await getAllOrders(RESTAURANT_ID, {
    status: statusFilter as import('@/lib/db/types').OrderStatus | undefined,
    phone: search,
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
    <div className="relative min-h-screen p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Background Futuristic Ambient Glow Orbs */}
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-champagne/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header with Telemetry Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-2 border-b border-border-subtle/60">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-champagne/10 text-platinum border border-champagne/20 shadow-[0_0_15px_rgba(201,168,76,0.1)]">
              <Sparkles className="w-3 h-3 text-champagne" />
              Live Order Stream
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl heading-ui text-text-primary text-2xl text-transparent bg-clip-text bg-gradient-to-r from-champagne via-platinum to-champagne drop-shadow-[0_0_20px_rgba(201,168,76,0.3)]">
              Orders Management
            </h1>
            <p className="text-champagne/80 text-[13px] font-medium tracking-[0.05em] uppercase">
              Live kitchen tracking, customer orders, digital tickets, and payment reconciliation.
            </p>
          </div>
        </div>

        {/* Search & Filter Form */}
        <form className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary/70" />
            <input 
              name="search"
              defaultValue={search}
              placeholder="Search phone number..."
              className="w-full pl-10 pr-4 py-2.5 bg-obsidian/80 border border-border-strong/80 rounded-xl focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50 text-sm text-zinc-100 placeholder-zinc-500 transition-all shadow-inner outline-none"
            />
          </div>
          <select 
            name="status"
            defaultValue={statusFilter || ''}
            className="px-4 py-2.5 bg-obsidian/80 border border-border-strong/80 rounded-xl focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50 text-sm text-text-secondary transition-all shadow-inner outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button 
            type="submit" 
            className="px-5 py-2.5 bg-gradient-to-r from-champagne to-platinum hover:from-[#d8b85b] hover:to-[#f0db99] text-zinc-950 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg shadow-[#c9a84c]/20 hover:shadow-[#c9a84c]/30 hover:-translate-y-0.5"
          >
            Search
          </button>
        </form>
      </div>

      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {/* 1. Total Orders */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-border-subtle transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-champagne" />
          </div>
          <p className="text-3xl font-black text-text-primary mt-2">{totalOrdersCount}</p>
        </div>

        {/* 2. Settled Revenue - Emerald Green */}
        <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-950/90 to-zinc-950 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-success">Settled Revenue</span>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200 mt-2 relative z-10 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
            {formatMoney(totalRevenuePaise)}
          </p>
        </div>

        {/* 3. Active in Kitchen */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-warning">Active Kitchen Queue</span>
            <ChefHat className="w-4 h-4 text-warning" />
          </div>
          <p className="text-3xl font-black text-warning mt-2">{activeOrdersCount}</p>
        </div>

        {/* 4. Completed Orders */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-platinum">Fulfilled</span>
            <CheckCircle2 className="w-4 h-4 text-platinum" />
          </div>
          <p className="text-3xl font-black text-platinum mt-2">{completedCount}</p>
        </div>
      </div>

      {/* Quick Filter Pill Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/orders"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border ${
            !statusFilter 
              ? 'bg-gradient-to-r from-champagne to-platinum text-zinc-950 border-transparent shadow-lg shadow-[#c9a84c]/20' 
              : 'bg-surface/80 text-text-secondary border-border-subtle hover:text-text-primary hover:border-border-strong'
          }`}
        >
          All Orders ({totalOrdersCount})
        </Link>
        <Link
          href="/admin/orders?status=preparing"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border ${
            statusFilter === 'preparing'
              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-lg shadow-orange-500/10'
              : 'bg-surface/80 text-text-secondary border-border-subtle hover:text-orange-300 hover:border-border-strong'
          }`}
        >
          Preparing
        </Link>
        <Link
          href="/admin/orders?status=ready"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border ${
            statusFilter === 'ready'
              ? 'bg-platinum/10 text-platinum border-platinum/30 shadow-lg shadow-cyan-500/10'
              : 'bg-surface/80 text-text-secondary border-border-subtle hover:text-platinum hover:border-border-strong'
          }`}
        >
          Ready for Pickup
        </Link>
        <Link
          href="/admin/orders?status=completed"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border ${
            statusFilter === 'completed'
              ? 'bg-success/10 text-success border-success/30 shadow-lg shadow-emerald-500/10'
              : 'bg-surface/80 text-text-secondary border-border-subtle hover:text-success hover:border-border-strong'
          }`}
        >
          Completed ({completedCount})
        </Link>
        <Link
          href="/admin/orders?status=cancelled"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border ${
            statusFilter === 'cancelled'
              ? 'bg-danger/10 text-danger border-danger/30 shadow-lg shadow-rose-500/10'
              : 'bg-surface/80 text-text-secondary border-border-subtle hover:text-danger hover:border-border-strong'
          }`}
        >
          Cancelled
        </Link>
      </div>

      {/* Orders Table Panel */}
      <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(201,168,76,0.15)] hover:shadow-[0_25px_70px_rgba(201,168,76,0.25)] hover:-translate-y-1 transition-all duration-500 hover:border-champagne/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-obsidian/90 text-text-secondary border-b border-border-subtle backdrop-blur-xl">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Order ID</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Customer</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Contact</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Type</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Amount</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-center">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Timestamp</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-text-secondary">
              {orders?.map((order: any) => (
                <tr key={order.id} className="group hover:bg-elevated/40 transition-all duration-300">
                  <td className="px-6 py-4 font-mono text-xs">
                    <span className="text-champagne bg-champagne/10 px-2.5 py-1 rounded-md border border-champagne/20 font-medium">
                      #{order.id?.slice(0, 8) ?? 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-elevated border border-border-strong flex items-center justify-center text-[11px] font-bold text-text-secondary">
                        {order.customer_name ? order.customer_name.slice(0, 2).toUpperCase() : 'GS'}
                      </div>
                      <span className="font-semibold text-zinc-100 group-hover:text-text-primary transition-colors">
                        {order.customer_name || 'Guest'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-text-secondary">
                    {order.customer_phone ? (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-text-secondary/70" />
                        <span>{order.customer_phone}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-elevated/80 text-text-secondary border border-border-strong/40 capitalize">
                      {order.order_type || 'dine-in'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-zinc-100 font-mono text-sm">
                    {formatMoney(order.total_paise)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-xs tracking-wide">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-text-secondary/70" />
                      <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-text-secondary/70">{new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-border-subtle bg-champagne/10 text-platinum hover:bg-champagne/20 hover:border-champagne/50 hover:shadow-[0_0_12px_rgba(201,168,76,0.2)] transition-all duration-300 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </Link>
                  </td>
                </tr>
              ))}
              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center text-zinc-600 shadow-inner">
                        <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-text-secondary">
                          {search || statusFilter ? 'No orders match your filter criteria' : 'No orders recorded yet'}
                        </p>
                        <p className="text-xs text-text-secondary/70 max-w-sm">
                          Incoming dining and takeaway orders will automatically stream to this queue in real time.
                        </p>
                      </div>
                      {(search || statusFilter) && (
                        <Link 
                          href="/admin/orders" 
                          className="mt-2 text-xs font-semibold text-champagne hover:underline"
                        >
                          Clear Filters & Search
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* High-Tech Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-2">
        <p className="text-xs text-text-secondary tracking-wider font-mono">
          DISPLAYING PAGE <span className="font-bold text-champagne">{page}</span> OF DIGITAL ORDERS
        </p>
        <div className="flex items-center gap-2">
          {page > 1 && (
            <Link 
              href={`/admin/orders?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ''}${search ? `&search=${search}` : ''}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface/80 hover:bg-elevated border border-border-subtle hover:border-border-strong text-text-secondary hover:text-text-primary rounded-xl text-xs font-semibold transition-all duration-300 shadow-md"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </Link>
          )}
          <Link 
            href={`/admin/orders?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ''}${search ? `&search=${search}` : ''}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 border border-border-strong/80 text-text-primary rounded-xl text-xs font-semibold transition-all duration-300 shadow-md hover:-translate-y-0.5"
          >
            <span>Next Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

