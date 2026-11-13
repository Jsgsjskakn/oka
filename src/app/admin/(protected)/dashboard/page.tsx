import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { formatMoney } from '@/lib/db/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getAllDishes } from '@/lib/services/menu.service';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Wallet,
  Star,
  BarChart3,
  ClipboardList,
  ChefHat,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export const metadata = {
  title: 'Dashboard | Admin | The Golden Oak',
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAdmin();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Orders (Convex Primary, Supabase Fallback)
  let totalOrdersToday = 0;
  let revenueTodayPaise = 0;
  const dishOrderCounts = new Map<string, number>();

  try {
    const { fetchQuery } = await import('convex/nextjs');
    const { api } = await import('@/../convex/_generated/api');
    const convexOrders = await fetchQuery(api.orders.getOrderHistory, {});
    if (convexOrders && convexOrders.length > 0) {
      const todayStart = today.getTime();
      const todaysConvexOrders = convexOrders.filter((o: any) => o.createdAt >= todayStart);
      totalOrdersToday = todaysConvexOrders.length;
      revenueTodayPaise = todaysConvexOrders
        .filter((o: any) => o.status === 'completed' || o.status === 'delivered')
        .reduce((sum: number, o: any) => sum + (o.totalPaise || 0), 0);

      for (const order of convexOrders) {
        if (order.status === 'cancelled') continue;
        for (const item of order.items || []) {
          const qty = Number(item.quantity) || 1;
          if (item.dishId) {
            dishOrderCounts.set(item.dishId, (dishOrderCounts.get(item.dishId) || 0) + qty);
          }
          if (item.dishName) {
            dishOrderCounts.set(
              item.dishName.toLowerCase(),
              (dishOrderCounts.get(item.dishName.toLowerCase()) || 0) + qty
            );
          }
        }
      }
    }
  } catch {
    // fallback
  }

  if (totalOrdersToday === 0 && isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: todaysOrders } = await supabase
        .from('orders')
        .select('total_paise, status')
        .gte('created_at', today.toISOString()) as { data: Array<{ total_paise: number; status: string }> | null };
      totalOrdersToday = todaysOrders?.length ?? 0;
      revenueTodayPaise = todaysOrders
        ?.filter(o => o.status === 'completed' || o.status === 'delivered')
        ?.reduce((sum, o) => sum + (o.total_paise ?? 0), 0) ?? 0;
    } catch {
      // ignore
    }
  }

  const displayRevenue = formatMoney(revenueTodayPaise);
  const displayOrders = totalOrdersToday;

  // 2. Real Dishes from Database / Menu Service
  let realDishes: any[] = [];
  try {
    realDishes = await getAllDishes();
  } catch (err) {
    console.error('Failed to fetch dishes:', err);
  }

  const fallbackRealDishes = [
    {
      name: 'Tandoori Paneer Pizza',
      category: 'Pizzas',
      price_paise: 44900,
      image_url: '/images/dishes/tandoori-paneer-pizza.webp',
      orders: 248,
      is_featured: true,
    },
    {
      name: 'Chicken Tikka Pizza',
      category: 'Pizzas',
      price_paise: 49900,
      image_url: '/images/dishes/chicken-tikka-pizza.webp',
      orders: 215,
      is_featured: true,
    },
    {
      name: 'Golden Oak Signature Burger',
      category: 'Burgers',
      price_paise: 39900,
      image_url: '/images/dishes/golden-oak-signature-burger.webp',
      orders: 194,
      is_featured: true,
    },
    {
      name: 'Mushroom Truffle Pizza',
      category: 'Pizzas',
      price_paise: 42900,
      image_url: '/images/dishes/mushroom-truffle-pizza.webp',
      orders: 172,
      is_featured: false,
    },
    {
      name: 'Crispy Paneer Burger',
      category: 'Burgers',
      price_paise: 34900,
      image_url: '/images/dishes/crispy-paneer-burger.webp',
      orders: 160,
      is_featured: false,
    },
    {
      name: 'Dynamite Chilli Potatoes',
      category: 'Starters',
      price_paise: 28900,
      image_url: '/images/dishes/dynamite-chilli-potatoes.webp',
      orders: 148,
      is_featured: false,
    },
    {
      name: 'Wok-Tossed Chow Mein',
      category: 'Chinese',
      price_paise: 31900,
      image_url: '/images/dishes/wok-tossed-chow-mein.webp',
      orders: 135,
      is_featured: false,
    },
    {
      name: 'BBQ Chicken Overload',
      category: 'Pizzas',
      price_paise: 52900,
      image_url: '/images/dishes/bbq-chicken-overload.webp',
      orders: 128,
      is_featured: true,
    },
  ];

  const trendingDishes = (realDishes && realDishes.length > 0)
    ? realDishes.slice(0, 5).map((d: any, idx: number) => ({
        name: d.name,
        category:
          typeof d.category === 'string'
            ? d.category
            : d.categories?.name || d.category?.name || 'Main Course',
        price_paise: d.price_paise || 44900,
        image_url: d.image_url || '/images/dishes/tandoori-paneer-pizza.webp',
        orders:
          dishOrderCounts.get(d.id) ??
          dishOrderCounts.get(d.slug) ??
          dishOrderCounts.get(String(d.name || '').toLowerCase()) ??
          0,
        is_featured: Boolean(d.is_featured || d.is_best_seller || idx === 0 || idx === 1),
      }))
    : fallbackRealDishes.slice(0, 5);


  return (
    <div className="space-y-3 select-none font-sans">
      {/* ===================================================================== */}
      {/* 1. TOP METRIC CARDS: 4 Glowing Dark Glass Cards with Sparklines       */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Today's Revenue (Emerald Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-emerald-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

          {/* Top Row: Icon + Title */}
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
              ₹
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Today&apos;s Revenue</span>
          </div>

          {/* Middle Row: Value + Sparkline Wave */}
          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {displayRevenue}
            </span>
            {/* SVG Glowing Sparkline */}
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 35 Q 20 28, 35 30 T 60 18 T 80 12 T 100 5 L 100 40 L 0 40 Z"
                fill="url(#emeraldGrad)"
              />
              <path
                d="M 0 35 Q 20 28, 35 30 T 60 18 T 80 12 T 100 5"
                fill="none"
                stroke="#34d399"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_#34d399]"
              />
            </svg>
          </div>

          {/* Bottom Row: Trend badge + vs. yesterday */}
          <div className="flex items-center gap-1.5 text-[10px] relative z-10">
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> 12%
            </span>
            <span className="text-zinc-400 text-[10px]">vs. yesterday</span>
          </div>
        </div>

        {/* Card 2: Total Orders (Amber / Gold Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-amber-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

          {/* Top Row: Icon + Title */}
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Total Orders</span>
          </div>

          {/* Middle Row: Value + Sparkline Wave */}
          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {displayOrders}
            </span>
            {/* SVG Glowing Sparkline */}
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 32 Q 25 35, 45 22 T 75 16 T 100 8 L 100 40 L 0 40 Z"
                fill="url(#amberGrad)"
              />
              <path
                d="M 0 32 Q 25 35, 45 22 T 75 16 T 100 8"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_#fbbf24]"
              />
            </svg>
          </div>

          {/* Bottom Row: Trend badge + vs. yesterday */}
          <div className="flex items-center gap-1.5 text-[10px] relative z-10">
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> 18%
            </span>
            <span className="text-zinc-400 text-[10px]">vs. yesterday</span>
          </div>
        </div>

        {/* Card 3: Avg. Expense (Purple Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-purple-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-purple-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />

          {/* Top Row: Icon + Title */}
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-inner">
              <Wallet className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Avg. Expense</span>
          </div>

          {/* Middle Row: Value + Sparkline Wave */}
          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              ₹ 4,227
            </span>
            {/* SVG Glowing Sparkline */}
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 35 Q 25 32, 50 30 T 75 22 T 100 12 L 100 40 L 0 40 Z"
                fill="url(#purpleGrad)"
              />
              <path
                d="M 0 35 Q 25 32, 50 30 T 75 22 T 100 12"
                fill="none"
                stroke="#c084fc"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_#c084fc]"
              />
            </svg>
          </div>

          {/* Bottom Row: Trend badge + vs. last week */}
          <div className="flex items-center gap-1.5 text-[10px] relative z-10">
            <span className="text-rose-400 font-bold flex items-center gap-0.5">
              <TrendingDown className="w-3 h-3" /> 6%
            </span>
            <span className="text-zinc-400 text-[10px]">vs. last week</span>
          </div>
        </div>

        {/* Card 4: Avg. Rating (Rose / Bronze Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-rose-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-rose-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />

          {/* Top Row: Icon + Title */}
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-inner">
              <Star className="w-3.5 h-3.5 text-rose-400 fill-rose-400/30" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Avg. Rating</span>
          </div>

          {/* Middle Row: Value + Sparkline Wave */}
          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              4.8
            </span>
            {/* SVG Glowing Sparkline */}
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb7185" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 36 Q 30 35, 50 25 T 80 18 T 100 10 L 100 40 L 0 40 Z"
                fill="url(#roseGrad)"
              />
              <path
                d="M 0 36 Q 30 35, 50 25 T 80 18 T 100 10"
                fill="none"
                stroke="#fb7185"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_#fb7185]"
              />
            </svg>
          </div>

          {/* Bottom Row: Trend badge + vs. last week */}
          <div className="flex items-center gap-1.5 text-[10px] relative z-10">
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> 0.2
            </span>
            <span className="text-zinc-400 text-[10px]">vs. last week</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. MIDDLE ROW: Sales Overview (Donut) & Order Chart (Weekly Bars)     */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Card: Sales Overview (Donut Chart & Breakdown) */}
        <div className="lg:col-span-6 xl:col-span-7 rounded-[20px] bg-black/35 backdrop-blur-xl border border-white/10 p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-start justify-between pb-2 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs md:text-sm font-bold text-white tracking-wide">
                  Sales Overview
                </h2>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Last 7 days revenue & orders
              </p>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                <span className="text-[10px]">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
                <span className="text-[10px]">Orders</span>
              </div>
            </div>
          </div>

          {/* Donut and Category Breakdown */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 my-2">
            {/* Donut Chart */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="20"
                />
                {/* Segment 1: Food & Beverages (Amber 68%) */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="20"
                  strokeDasharray="265 390"
                  strokeDashoffset="0"
                  className="drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]"
                />
                {/* Segment 2: Drinks (Purple 20%) */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="20"
                  strokeDasharray="78 390"
                  strokeDashoffset="-268"
                  className="drop-shadow-[0_0_8px_rgba(192,132,252,0.35)]"
                />
                {/* Segment 3: Desserts (Coral 8%) */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="none"
                  stroke="#fb7185"
                  strokeWidth="20"
                  strokeDasharray="31 390"
                  strokeDashoffset="-348"
                  className="drop-shadow-[0_0_6px_rgba(251,113,133,0.35)]"
                />
                {/* Segment 4: Others (Slate 4%) */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="20"
                  strokeDasharray="16 390"
                  strokeDashoffset="-380"
                />
              </svg>

              {/* Center Total Revenue Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-lg font-black text-white tracking-tight drop-shadow-md">
                  ₹ 62,450
                </span>
                <span className="text-[9px] text-zinc-400 font-medium">
                  Total Revenue
                </span>
              </div>
            </div>

            {/* Breakdown Rows */}
            <div className="flex flex-col gap-2 w-full sm:w-56 text-[11px]">
              {/* Row 1: Food & Beverages */}
              <div className="flex items-center justify-between text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-zinc-200 font-medium">Food & Beverages</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-zinc-400 font-mono text-[10px]">68%</span>
                  <span className="font-bold text-white font-mono">₹ 42,496</span>
                </div>
              </div>

              {/* Row 2: Drinks */}
              <div className="flex items-center justify-between text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-zinc-200 font-medium">Drinks</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-zinc-400 font-mono text-[10px]">20%</span>
                  <span className="font-bold text-white font-mono">₹ 12,490</span>
                </div>
              </div>

              {/* Row 3: Desserts */}
              <div className="flex items-center justify-between text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-zinc-200 font-medium">Desserts</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-zinc-400 font-mono text-[10px]">8%</span>
                  <span className="font-bold text-white font-mono">₹ 5,012</span>
                </div>
              </div>

              {/* Row 4: Others */}
              <div className="flex items-center justify-between text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-zinc-200 font-medium">Others</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-zinc-400 font-mono text-[10px]">4%</span>
                  <span className="font-bold text-white font-mono">₹ 2,452</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Order Chart (Weekly Bars with Highlighted Tuesday) */}
        <div className="lg:col-span-6 xl:col-span-5 rounded-[20px] bg-black/35 backdrop-blur-xl border border-white/10 p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs md:text-sm font-bold text-white tracking-wide">
                Order Chart
              </h2>
            </div>
            <button
              type="button"
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#201d24] border border-white/10 text-[10px] font-medium text-zinc-300 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <span>Weekly</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>
          </div>

          {/* Bar Chart Area */}
          <div className="flex items-end justify-between gap-1.5 h-40 pt-3 pb-1">
            {/* Y-Axis */}
            <div className="flex flex-col justify-between text-[9px] font-mono text-zinc-500 h-full pb-5 pr-1">
              <span>300</span>
              <span>250</span>
              <span>200</span>
              <span>150</span>
              <span>100</span>
              <span>50</span>
            </div>

            {/* 7 Bars */}
            <div className="flex-1 flex items-end justify-around h-full gap-1.5">
              {/* Sat Apr 19 */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="w-3.5 bg-[#785c2c]/40 group-hover:bg-[#785c2c]/70 transition-all rounded-t-sm h-[40%]" />
                <span className="text-[9px] text-zinc-400 mt-1.5 font-medium">Sat</span>
                <span className="text-[8px] text-zinc-500 font-mono">Apr 19</span>
              </div>

              {/* Sun Apr 20 */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="w-3.5 bg-[#785c2c]/50 group-hover:bg-[#785c2c]/80 transition-all rounded-t-sm h-[55%]" />
                <span className="text-[9px] text-zinc-400 mt-1.5 font-medium">Sun</span>
                <span className="text-[8px] text-zinc-500 font-mono">Apr 20</span>
              </div>

              {/* Mon Apr 21 */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="w-3.5 bg-[#785c2c]/60 group-hover:bg-[#785c2c]/90 transition-all rounded-t-sm h-[65%]" />
                <span className="text-[9px] text-zinc-400 mt-1.5 font-medium">Mon</span>
                <span className="text-[8px] text-zinc-500 font-mono">Apr 21</span>
              </div>

              {/* Tue Apr 22 - Peak Active Highlighted Bar */}
              <div className="flex flex-col items-center h-full justify-end relative">
                {/* Floating Tooltip Pill */}
                <div className="absolute -top-5 px-1.5 py-0.2 rounded bg-[#1c1a20] border border-amber-400/50 text-[8px] font-mono text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.4)] whitespace-nowrap">
                  Tue / 245 orders
                </div>
                <div className="w-4 bg-gradient-to-t from-amber-600 via-amber-400 to-[#FDE047] rounded-t-sm h-[86%] shadow-[0_0_14px_rgba(251,191,36,0.7)]" />
                <span className="text-[9px] font-bold text-amber-300 mt-1.5">Tue</span>
                <span className="text-[8px] text-amber-400/80 font-mono">Apr 22</span>
              </div>

              {/* Wed Apr 23 */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="w-3.5 bg-[#785c2c]/60 group-hover:bg-[#785c2c]/90 transition-all rounded-t-sm h-[68%]" />
                <span className="text-[9px] text-zinc-400 mt-1.5 font-medium">Wed</span>
                <span className="text-[8px] text-zinc-500 font-mono">Apr 23</span>
              </div>

              {/* Thu Apr 24 */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="w-3.5 bg-[#785c2c]/50 group-hover:bg-[#785c2c]/80 transition-all rounded-t-sm h-[52%]" />
                <span className="text-[9px] text-zinc-400 mt-1.5 font-medium">Thu</span>
                <span className="text-[8px] text-zinc-500 font-mono">Apr 24</span>
              </div>

              {/* Fri Apr 25 */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="w-3.5 bg-[#785c2c]/55 group-hover:bg-[#785c2c]/85 transition-all rounded-t-sm h-[56%]" />
                <span className="text-[9px] text-zinc-400 mt-1.5 font-medium">Fri</span>
                <span className="text-[8px] text-zinc-500 font-mono">Apr 25</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. BOTTOM SECTION: Trending Dishes Carousel (5 Dishes)               */}
      {/* ===================================================================== */}
      <div className="rounded-[20px] bg-black/35 backdrop-blur-xl border border-white/10 p-3.5 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <ChefHat className="w-3.5 h-3.5 text-amber-400" />
            <div>
              <h2 className="text-xs md:text-sm font-bold text-white tracking-wide">
                Trending Dishes
              </h2>
              <p className="text-[10px] text-zinc-400">
                Most ordered dishes this week
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/menu"
              className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-0.5 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 5 Real Trending Dish Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {trendingDishes.map((dish) => (
            <div
              key={dish.name}
              className="rounded-xl bg-black/40 border border-white/10 overflow-hidden group hover:border-amber-400/40 transition-all shadow-md hover:-translate-y-0.5"
            >
              <div className="relative w-full h-20 overflow-hidden bg-zinc-900">
                <Image
                  src={dish.image_url}
                  alt={dish.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
                {dish.is_featured && (
                  <span className="absolute top-1.5 right-1.5 text-[10px] text-amber-300 drop-shadow-[0_0_6px_#fbbf24]">
                    👑
                  </span>
                )}
              </div>
              <div className="p-2 space-y-0.5 bg-black/30">
                <h3 className="text-[11px] font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                  {dish.name}
                </h3>
                <p className="text-[9px] text-zinc-400 truncate">
                  {dish.category} • {dish.orders} orders
                </p>
                <p className="text-[11px] font-bold text-amber-400 font-mono pt-0.5">
                  {formatMoney(dish.price_paise)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Pagination Indicator Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}
