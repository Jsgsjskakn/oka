import { 
  Download, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  UtensilsCrossed, 
} from 'lucide-react';
import { formatMoney } from '@/lib/db/types';
import { getAnalyticsSummary } from '@/lib/services/analytics.service';
import { RESTAURANT_ID } from '@/lib/config';
import { requireAdmin } from '@/lib/auth/admin-auth';
import AnalyticsCharts from './AnalyticsCharts';
import DateRangePicker from './DateRangePicker';

export const metadata = {
  title: 'Analytics | Admin | The Golden Oak',
};

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await requireAdmin();
  const params = await searchParams;
  const range = typeof params.range === 'string' ? params.range : '30d';
  const customFrom = typeof params.from === 'string' ? params.from : null;
  const customTo = typeof params.to === 'string' ? params.to : null;

  let dateTo = new Date();
  let dateFrom = new Date();
  
  if (customFrom && customTo) {
    dateFrom = new Date(customFrom);
    dateFrom.setHours(0, 0, 0, 0);
    dateTo = new Date(customTo);
    dateTo.setHours(23, 59, 59, 999);
  } else if (range === 'today') {
    dateFrom.setHours(0, 0, 0, 0);
  } else if (range === '7d') {
    dateFrom.setDate(dateFrom.getDate() - 7);
    dateFrom.setHours(0, 0, 0, 0);
  } else if (range === '90d') {
    dateFrom.setDate(dateFrom.getDate() - 90);
    dateFrom.setHours(0, 0, 0, 0);
  } else {
    dateFrom.setDate(dateFrom.getDate() - 30);
    dateFrom.setHours(0, 0, 0, 0);
  }

  const summary = await getAnalyticsSummary({
    restaurantId: RESTAURANT_ID,
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
  });

  return (
    <div className="space-y-3 select-none font-sans">
      {/* ===================================================================== */}
      {/* 1. TOP METRIC CARDS: 4 Glowing Dark Glass Cards with Sparklines       */}
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
              {formatMoney(summary.totalRevenuePaise)}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="emeraldGradA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 35 Q 20 28, 35 30 T 60 18 T 80 12 T 100 5 L 100 40 L 0 40 Z" fill="url(#emeraldGradA)" />
              <path d="M 0 35 Q 20 28, 35 30 T 60 18 T 80 12 T 100 5" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#34d399]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold relative z-10">
            <TrendingUp className="w-3 h-3" /> Net Sales Yield
          </div>
        </div>

        {/* Card 2: Completed Orders (Amber Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-amber-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Completed Orders</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {summary.completedOrders}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="amberGradA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 32 Q 25 35, 45 22 T 75 18 T 100 8 L 100 40 L 0 40 Z" fill="url(#amberGradA)" />
              <path d="M 0 32 Q 25 35, 45 22 T 75 18 T 100 8" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#fbbf24]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold relative z-10">
            <TrendingUp className="w-3 h-3" /> Fulfilled Covers
          </div>
        </div>

        {/* Card 3: Avg Ticket Size (Purple Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-purple-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-purple-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Avg Ticket Size</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {formatMoney(summary.averageOrderValuePaise)}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="purpleGradA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 25 Q 25 32, 50 20 T 75 14 T 100 10 L 100 40 L 0 40 Z" fill="url(#purpleGradA)" />
              <path d="M 0 25 Q 25 32, 50 20 T 75 14 T 100 10" fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#c084fc]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-purple-400 font-bold relative z-10">
            Per Order Value
          </div>
        </div>

        {/* Card 4: Dishes Prepared (Rose Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-rose-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-rose-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
              <UtensilsCrossed className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Dishes Prepared</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {summary.totalQuantitySold}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="roseGradA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 35 Q 25 30, 45 32 T 75 16 T 100 10 L 100 40 L 0 40 Z" fill="url(#roseGradA)" />
              <path d="M 0 35 Q 25 30, 45 32 T 75 16 T 100 10" fill="none" stroke="#fb7185" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#fb7185]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-bold relative z-10">
            Total Kitchen Output
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. MAIN CHARTS BOX                                                    */}
      {/* ===================================================================== */}
      <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-white/10 p-4 shadow-lg space-y-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <h2 className="text-sm md:text-base font-bold text-white tracking-wide">
                Analytics & Insights
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Data
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Financial velocity, sales breakdown, culinary product rankings, and channel volume insights.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker />
            <button className="flex items-center justify-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg text-[11px] transition-colors border border-white/15 cursor-pointer">
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <AnalyticsCharts summary={summary} />
      </div>
    </div>
  );
}
