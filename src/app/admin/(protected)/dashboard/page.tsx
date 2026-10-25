import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { formatMoney } from '@/lib/db/types';
import { createClient } from '@/lib/supabase/server';
import {
  UtensilsCrossed,
  TrendingUp,
  CalendarDays,
  Activity,
  ArrowUpRight,
  Clock,
  Users,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Layers,
  CreditCard,
  Grid3x3,
  BarChart3
} from 'lucide-react';

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Orders (Convex Primary, Supabase Fallback)
  let recentOrders: Array<{ id: string; total_paise: number; status: string; order_type: string; created_at: string; customer_name: string }> = [];
  let totalOrdersToday = 0;
  let revenueToday = 0;

  try {
    const { fetchQuery } = await import('convex/nextjs');
    const { api } = await import('@/../convex/_generated/api');
    const convexOrders = await fetchQuery(api.orders.getOrderHistory, {});
    if (convexOrders && convexOrders.length > 0) {
      recentOrders = convexOrders.slice(0, 5).map((o: any) => ({
        id: o._id,
        total_paise: o.totalPaise || (o.subtotalPaise + (o.taxPaise || 0) + (o.tipPaise || 0)),
        status: o.status,
        order_type: o.orderType || 'dine-in',
        created_at: new Date(o.createdAt).toISOString(),
        customer_name: o.customerName || 'Guest Customer',
      }));

      const todayStart = today.getTime();
      const todaysConvexOrders = convexOrders.filter((o: any) => o.createdAt >= todayStart);
      totalOrdersToday = todaysConvexOrders.length;
      revenueToday = todaysConvexOrders
        .filter((o: any) => o.status === 'completed' || o.status === 'delivered')
        .reduce((sum: number, o: any) => sum + (o.totalPaise || 0), 0);
    }
  } catch {
    // fallback
  }

  if (recentOrders.length === 0) {
    try {
      const { data: sbOrders } = await supabase
        .from('orders')
        .select('id, total_paise, status, order_type, created_at, customer_name')
        .order('created_at', { ascending: false })
        .limit(5) as { data: Array<{ id: string; total_paise: number; status: string; order_type: string; created_at: string; customer_name: string }> | null };
      if (sbOrders) recentOrders = sbOrders;

      const { data: todaysOrders } = await supabase
        .from('orders')
        .select('total_paise, status')
        .gte('created_at', today.toISOString()) as { data: Array<{ total_paise: number; status: string }> | null };
      totalOrdersToday = todaysOrders?.length ?? 0;
      revenueToday = todaysOrders
        ?.filter(o => o.status === 'completed' || o.status === 'delivered')
        ?.reduce((sum, o) => sum + (o.total_paise ?? 0), 0) ?? 0;
    } catch {
      // ignore
    }
  }

  // 2. Bookings (Convex Primary, Supabase Fallback)
  let recentBookings: Array<{ id: string; customer_name: string; booking_date: string; booking_time: string; guests: number; status: string }> = [];
  let activeBookingsCount = 0;

  try {
    const { fetchQuery } = await import('convex/nextjs');
    const { api } = await import('@/../convex/_generated/api');
    const convexBookings = await fetchQuery(api.bookings.getAllBookings, {});
    if (convexBookings && convexBookings.length > 0) {
      recentBookings = convexBookings.slice(0, 5).map((b: any) => ({
        id: b._id,
        customer_name: b.customerName,
        booking_date: b.bookingDate,
        booking_time: b.bookingTime,
        guests: b.guests,
        status: b.status,
      }));
      activeBookingsCount = convexBookings.filter((b: any) => b.status === 'confirmed').length;
    }
  } catch {
    // fallback
  }

  if (recentBookings.length === 0) {
    try {
      const { data: sbBookings } = await supabase
        .from('bookings')
        .select('id, customer_name, booking_date, booking_time, guests, status')
        .order('created_at', { ascending: false })
        .limit(5) as { data: Array<{ id: string; customer_name: string; booking_date: string; booking_time: string; guests: number; status: string }> | null };
      if (sbBookings) {
        recentBookings = sbBookings;
        activeBookingsCount = sbBookings.filter(b => b.status === 'confirmed').length;
      }
    } catch {
      // ignore
    }
  }

  // 3. Asset Requests (Preserved fallback)
  let openIssuesCount = 0;
  let openAssetRequests: Array<{ id: string; request_type: string; status: string; dish_id: string | null }> = [];
  try {
    const { data: reqs } = await supabase
      .from('asset_requests')
      .select('id, request_type, status, dish_id')
      .eq('status', 'open')
      .order('created_at', { ascending: false }) as { data: Array<{ id: string; request_type: string; status: string; dish_id: string | null }> | null };
    if (reqs) {
      openAssetRequests = reqs;
      openIssuesCount = reqs.length;
    }
  } catch {
    // ignore
  }

  // Format today's date
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="relative min-h-screen p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Background Futuristic Ambient Glow Orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-champagne/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-32 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header with Telemetry Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-2 border-b border-border-subtle/60">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-emerald-500/10 text-success border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              Live Operations
            </span>
            <span className="text-xs text-text-secondary/70 font-mono tracking-wider">
              {formattedDate}
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl heading-ui text-text-primary text-2xl text-transparent bg-clip-text bg-gradient-to-r from-champagne via-platinum to-champagne drop-shadow-[0_0_20px_rgba(201,168,76,0.3)]">
              Executive Dashboard
            </h1>
            <p className="text-champagne/80 text-[13px] font-medium tracking-[0.05em] uppercase">
              Real-time operational telemetry and performance intelligence for The Golden Oak.
            </p>
          </div>
        </div>

        {/* Quick Nav Shortcut Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/orders"
            className="flex items-center gap-2 px-4 py-2 bg-surface/80 hover:bg-elevated border border-border-subtle hover:border-border-strong rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary transition-all duration-300 shadow-md hover:-translate-y-0.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-champagne" />
            <span>Orders Feed</span>
          </Link>
          <Link
            href="/admin/tables"
            className="flex items-center gap-2 px-4 py-2 bg-surface/80 hover:bg-elevated border border-border-subtle hover:border-border-strong rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary transition-all duration-300 shadow-md hover:-translate-y-0.5"
          >
            <Grid3x3 className="w-3.5 h-3.5 text-platinum" />
            <span>Floor Plan</span>
          </Link>
          <Link
            href="/admin/analytics"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-champagne/20 to-champagne/5 hover:from-champagne/30 hover:to-champagne/10 border border-border-subtle rounded-xl text-xs font-medium text-platinum transition-all duration-300 shadow-lg shadow-[#c9a84c]/5 hover:-translate-y-0.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-champagne" />
            <span>Full Analytics</span>
            <ArrowUpRight className="w-3 h-3 opacity-70" />
          </Link>
        </div>
      </div>

      {/* Futuristic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Total Orders Today */}
        <div className="group relative bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle hover:border-border-subtle p-6 rounded-2xl shadow-2xl shadow-black/60 transition-all duration-500 hover:-translate-y-1 hover:shadow-[#c9a84c]/10 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-champagne/5 rounded-bl-full blur-2xl group-hover:bg-champagne/15 transition-all duration-700" />
          
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Total Orders
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-champagne shadow-[0_0_15px_rgba(201,168,76,0.15)] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all duration-300">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 relative z-10">
            <p className="text-4xl md:text-5xl font-black text-text-primary tracking-tight group-hover:text-platinum transition-colors">
              {totalOrdersToday}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
              <span className="text-text-secondary/70">Active Shift Feed</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-elevated text-text-secondary border border-border-strong/50">
                Today
              </span>
            </div>
          </div>
        </div>

        {/* 2. Revenue Today - GREEN COLOR THEMED */}
        <div className="group relative bg-gradient-to-b from-zinc-900/90 via-zinc-950/90 to-zinc-950 backdrop-blur-xl border border-border-subtle hover:border-champagne/60 p-6 rounded-2xl shadow-2xl shadow-black/60 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_35px_rgba(16,185,129,0.18)] overflow-hidden">
          {/* Glowing Green Aura */}
          <div className="absolute -top-6 -right-6 w-36 h-36 bg-success/10 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all duration-700" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-success">
                Revenue Today
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-emerald-500/15 text-success border border-border-subtle shadow-[0_0_10px_rgba(52,211,153,0.2)] animate-pulse">
                Live Inflow
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-success/10 border border-success/30 text-success shadow-[0_0_20px_rgba(52,211,153,0.3)] group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] transition-all duration-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 relative z-10">
            <p className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200 tracking-tight drop-shadow-[0_0_20px_rgba(52,211,153,0.35)]">
              {formatMoney(revenueToday)}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-success/80 font-medium">Reconciled Sales</span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-success">
                <CheckCircle2 className="w-3 h-3" />
                Settled
              </span>
            </div>
          </div>
        </div>

        {/* 3. Active Bookings */}
        <div className="group relative bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle hover:border-platinum/30 p-6 rounded-2xl shadow-2xl shadow-black/60 transition-all duration-500 hover:-translate-y-1 hover:shadow-cyan-500/10 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full blur-2xl group-hover:bg-cyan-500/15 transition-all duration-700" />

          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Active Bookings
            </span>
            <div className="p-2.5 rounded-xl bg-platinum/5 border border-cyan-500/20 text-platinum shadow-[0_0_15px_rgba(6,182,212,0.15)] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-300">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 relative z-10">
            <p className="text-4xl md:text-5xl font-black text-text-primary tracking-tight group-hover:text-platinum transition-colors">
              {activeBookingsCount}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
              <span className="text-text-secondary/70">Confirmed Tables</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-elevated text-text-secondary border border-border-strong/50">
                Reserved
              </span>
            </div>
          </div>
        </div>

        {/* 4. Open Issues / Asset Pipeline */}
        <div className="group relative bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle hover:border-warning/30 p-6 rounded-2xl shadow-2xl shadow-black/60 transition-all duration-500 hover:-translate-y-1 hover:shadow-amber-500/10 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full blur-2xl group-hover:bg-amber-500/15 transition-all duration-700" />

          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Asset & System Queue
            </span>
            <div className={`p-2.5 rounded-xl border transition-all duration-300 group-hover:scale-110 ${
              openIssuesCount === 0
                ? 'bg-emerald-500/10 border-emerald-500/20 text-success shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                : 'bg-amber-500/10 border-amber-500/20 text-warning shadow-[0_0_15px_rgba(251,191,36,0.15)]'
            }`}>
              {openIssuesCount === 0 ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
          </div>

          <div className="mt-4 relative z-10">
            <p className={`text-4xl md:text-5xl font-black tracking-tight transition-colors ${
              openIssuesCount === 0 ? 'text-text-primary group-hover:text-success' : 'text-warning'
            }`}>
              {openIssuesCount}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
              <span className="text-text-secondary/70">
                {openIssuesCount === 0 ? 'All 3D/AR Pipelines Clean' : 'Requests Pending'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                openIssuesCount === 0
                  ? 'bg-emerald-500/10 text-success border-emerald-500/20'
                  : 'bg-amber-500/10 text-warning border-amber-500/20'
              }`}>
                {openIssuesCount === 0 ? 'Optimal' : 'Attention'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tables Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent Orders Table Panel */}
        <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(201,168,76,0.15)] hover:shadow-[0_25px_70px_rgba(201,168,76,0.25)] hover:-translate-y-1 transition-all duration-500 hover:border-champagne/60">
          <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-obsidian/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-champagne shadow-[0_0_8px_#c9a84c]" />
              <h2 className="text-lg font-serif text-text-primary tracking-wide">Recent Orders</h2>
            </div>
            <Link
              href="/admin/orders"
              className="group flex items-center gap-1.5 text-xs font-semibold text-champagne hover:text-platinum transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-obsidian/90 text-text-secondary border-b border-border-subtle backdrop-blur-xl">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Order ID</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Customer</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Type</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-text-secondary">
                {recentOrders?.map((order) => (
                  <tr key={order.id} className="group hover:bg-elevated/40 transition-all duration-300">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-champagne bg-champagne/10 px-2.5 py-1 rounded-md border border-champagne/20 font-medium">
                        #{order.id?.slice(0, 8) ?? 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-elevated border border-border-strong flex items-center justify-center text-[11px] font-bold text-text-secondary">
                          {order.customer_name ? order.customer_name.slice(0, 2).toUpperCase() : 'GS'}
                        </div>
                        <span className="font-medium text-zinc-100 group-hover:text-text-primary transition-colors">
                          {order.customer_name || 'Guest Customer'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-xs font-medium text-text-secondary bg-elevated/60 px-2.5 py-1 rounded-lg border border-border-strong/40">
                        {order.order_type || 'dine-in'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border shadow-sm backdrop-blur-sm ${
                        order.status === 'completed' || order.status === 'delivered'
                          ? 'bg-emerald-500/10 text-success border-emerald-500/25 shadow-emerald-500/10'
                          : order.status === 'cancelled'
                          ? 'bg-rose-500/10 text-danger border-rose-500/25 shadow-rose-500/10'
                          : 'bg-amber-400/10 text-warning border-amber-400/25 shadow-amber-400/10'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          order.status === 'completed' || order.status === 'delivered'
                            ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                            : order.status === 'cancelled'
                            ? 'bg-rose-400'
                            : 'bg-amber-400 animate-pulse'
                        }`} />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-zinc-100 font-mono text-sm">
                      {formatMoney(order.total_paise)}
                    </td>
                  </tr>
                ))}
                {(!recentOrders || recentOrders.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ShoppingBag className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
                        <p className="text-sm font-medium text-text-secondary">No active orders yet today</p>
                        <p className="text-xs text-zinc-600">New orders will stream here automatically in real time</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Bookings Table Panel */}
        <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(201,168,76,0.15)] hover:shadow-[0_25px_70px_rgba(201,168,76,0.25)] hover:-translate-y-1 transition-all duration-500 hover:border-champagne/60">
          <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-obsidian/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 " />
              <h2 className="text-lg font-serif text-text-primary tracking-wide">Recent Bookings</h2>
            </div>
            <Link
              href="/admin/bookings"
              className="group flex items-center gap-1.5 text-xs font-semibold text-platinum hover:text-platinum transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-obsidian/90 text-text-secondary border-b border-border-subtle backdrop-blur-xl">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Guest Name</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Schedule</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Party Size</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-text-secondary">
                {recentBookings?.map((booking) => (
                  <tr key={booking.id} className="group hover:bg-elevated/40 transition-all duration-300">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-platinum/5 border border-cyan-500/20 flex items-center justify-center text-[11px] font-bold text-platinum">
                          {booking.customer_name ? booking.customer_name.slice(0, 2).toUpperCase() : 'BK'}
                        </div>
                        <span className="font-medium text-zinc-100 group-hover:text-platinum transition-colors">
                          {booking.customer_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <Clock className="w-3.5 h-3.5 text-text-secondary/70" />
                        <span>{booking.booking_date}</span>
                        <span className="text-text-secondary/70">at</span>
                        <span className="text-champagne font-medium">{booking.booking_time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-elevated/60 border border-border-strong/40 text-xs text-zinc-200">
                        <Users className="w-3.5 h-3.5 text-text-secondary" />
                        <span>{booking.guests} Guests</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border shadow-sm backdrop-blur-sm ${
                        booking.status === 'confirmed'
                          ? 'bg-emerald-500/10 text-success border-emerald-500/25 shadow-emerald-500/10'
                          : booking.status === 'cancelled'
                          ? 'bg-rose-500/10 text-danger border-rose-500/25 shadow-rose-500/10'
                          : 'bg-amber-400/10 text-warning border-amber-400/25 shadow-amber-400/10'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          booking.status === 'confirmed'
                            ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                            : booking.status === 'cancelled'
                            ? 'bg-rose-400'
                            : 'bg-amber-400'
                        }`} />
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!recentBookings || recentBookings.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <CalendarDays className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
                        <p className="text-sm font-medium text-text-secondary">No recent table reservations</p>
                        <p className="text-xs text-zinc-600">Upcoming customer bookings will show up here</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Open Asset Requests Panel (if any) */}
        {openAssetRequests && openAssetRequests.length > 0 && (
          <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(201,168,76,0.15)] hover:shadow-[0_25px_70px_rgba(201,168,76,0.25)] hover:-translate-y-1 transition-all duration-500 hover:border-champagne/60 xl:col-span-2">
            <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-obsidian/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                <h2 className="text-lg font-serif text-text-primary tracking-wide">Pending Asset & AR Requests</h2>
              </div>
              <Link
                href="/admin/assets"
                className="group flex items-center gap-1.5 text-xs font-semibold text-warning hover:text-warning transition-colors"
              >
                <span>Manage Assets</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-obsidian/90 text-text-secondary border-b border-border-subtle backdrop-blur-xl">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Request ID</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Type</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Dish Reference</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 text-text-secondary">
                  {openAssetRequests.map((request) => (
                    <tr key={request.id} className="group hover:bg-elevated/40 transition-all duration-300">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-warning/90 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20 font-medium">
                          #{request.id?.slice(0, 8) ?? 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 capitalize font-medium text-zinc-100">
                        {request.request_type?.replace('_', ' ') ?? ''}
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-mono text-xs">
                        {request.dish_id ? `Dish: ${request.dish_id.slice(0, 8)}` : 'System Wide'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border shadow-sm backdrop-blur-sm bg-amber-400/10 text-warning border-amber-400/20 shadow-amber-400/10">
                          {request.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

