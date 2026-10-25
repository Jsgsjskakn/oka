import { 
  Download, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Sparkles, 
  Heart, 
  UtensilsCrossed, 
  CheckCircle2, 
  Layers,
  Activity
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
    // default 30d
    dateFrom.setDate(dateFrom.getDate() - 30);
    dateFrom.setHours(0, 0, 0, 0);
  }

  const summary = await getAnalyticsSummary({
    restaurantId: RESTAURANT_ID,
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
  });


  return (
    <div className="relative min-h-screen p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Background Futuristic Ambient Glow Orbs */}
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-champagne/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-2 border-b border-border-subtle/60">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-emerald-500/10 text-success border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Activity className="w-3 h-3 text-success animate-pulse" />
              AI Business Intelligence & Revenue Engine
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl heading-ui text-text-primary text-2xl text-transparent bg-clip-text bg-gradient-to-r from-champagne via-platinum to-champagne drop-shadow-[0_0_20px_rgba(201,168,76,0.3)]">
              Executive Analytics
            </h1>
            <p className="text-champagne/80 text-[13px] font-medium tracking-[0.05em] uppercase">
              Financial velocity, sales breakdown, culinary product rankings, and channel volume insights.
            </p>
          </div>
        </div>
        
        {/* Date Selector & Export Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <DateRangePicker />
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 text-text-primary font-semibold rounded-xl text-sm transition-all duration-300 shadow-lg shadow-black/30 border border-border-strong/60 hover:border-zinc-600 group">
            <Download className="w-4 h-4 text-champagne group-hover:-translate-y-0.5 transition-transform" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Multi-Colored Analytical Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
        {/* 1. Total Revenue - Glowing Emerald Green */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-2 bg-gradient-to-b from-zinc-900/90 via-zinc-950/90 to-zinc-950 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-500/15 rounded-full blur-2xl group-hover:bg-emerald-500/25 transition-all" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-success">Gross Settled Revenue</span>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <p className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200 mt-2 relative z-10 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
            {formatMoney(summary.totalRevenuePaise)}
          </p>
          <p className="text-[11px] text-success/80 mt-1 font-mono relative z-10">
            {summary.completedOrders} orders collected
          </p>
        </div>
        
        {/* 2. Total Completed Orders - Glowing Cyan */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-platinum/5 rounded-full blur-xl group-hover:bg-platinum/10 transition-all" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-platinum">Completed Orders</span>
            <ShoppingBag className="w-4 h-4 text-platinum" />
          </div>
          <p className="text-3xl font-black text-text-primary mt-2 relative z-10">{summary.completedOrders}</p>
          <p className="text-[11px] text-platinum/80 mt-1 font-mono relative z-10">
            {summary.cancelledOrders} cancelled
          </p>
        </div>

        {/* 3. Average Order Value (AOV) - Luxury Gold */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-champagne/10 rounded-full blur-xl group-hover:bg-champagne/20 transition-all" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-platinum">Avg Ticket Size (AOV)</span>
            <Sparkles className="w-4 h-4 text-champagne" />
          </div>
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-champagne to-platinum mt-2 relative z-10">
            {formatMoney(summary.averageOrderValuePaise)}
          </p>
          <p className="text-[11px] text-text-secondary mt-1 font-mono relative z-10">
            Per fulfilled guest check
          </p>
        </div>
        
        {/* 4. Tips & Gratuity - Glowing Purple */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Staff Tips</span>
            <Heart className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300 mt-2 relative z-10">
            {formatMoney(summary.totalTipsPaise)}
          </p>
          <p className="text-[11px] text-purple-400/80 mt-1 font-mono relative z-10">
            Direct server gratuity
          </p>
        </div>

        {/* 5. Total Portions Dispatched - Glowing Amber */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl group-hover:bg-warning/10 transition-all" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-warning">Dishes Cooked</span>
            <UtensilsCrossed className="w-4 h-4 text-warning" />
          </div>
          <p className="text-3xl font-black text-warning mt-2 relative z-10">
            {summary.totalQuantitySold}
          </p>
          <p className="text-[11px] text-warning/80 mt-1 font-mono relative z-10">
            Portions prepared
          </p>
        </div>
      </div>

      {/* Modern Interactive Charts and Analytics Matrix */}
      <AnalyticsCharts summary={summary} />
    </div>
  );
}

