'use client';

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';
import { useState, useEffect } from 'react';
import { formatMoney } from '@/lib/db/types';
import type { AnalyticsSummary } from '@/lib/services/analytics.service';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  Flame, 
  Utensils, 
  Sparkles, 
  Medal, 
  Coffee, 
  ShoppingBag, 
  Clock,
  Layers
} from 'lucide-react';

const CATEGORY_COLORS = [
  '#10b981', // Emerald
  '#c9a84c', // Gold
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#3b82f6', // Blue
];

export default function AnalyticsCharts({ summary }: { summary: AnalyticsSummary }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const formattedRevenue = summary.revenueByDay.map(day => ({
    ...day,
    revenue: day.revenuePaise / 100,
    orders: day.orderCount,
    dateFormatted: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  const formattedCategories = summary.categoryBreakdown.map((cat, idx) => ({
    ...cat,
    revenue: cat.revenuePaise / 100,
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
  }));

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-96 animate-pulse bg-surface/60 rounded-2xl border border-border-subtle" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 animate-pulse bg-surface/60 rounded-2xl border border-border-subtle" />
          <div className="h-80 animate-pulse bg-surface/60 rounded-2xl border border-border-subtle" />
        </div>
      </div>
    );
  }

  const maxDishRevenue = Math.max(...summary.topDishes.map(d => d.revenuePaise), 1);

  return (
    <div className="space-y-8">
      {/* 1. Main Revenue Velocity Area Chart */}
      <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle rounded-2xl p-6 lg:p-7 shadow-[0_20px_60px_rgba(201,168,76,0.15)] hover:shadow-[0_25px_70px_rgba(201,168,76,0.25)] hover:-translate-y-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-success">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif text-text-primary tracking-wide">Daily Revenue & Order Velocity</h2>
              <p className="text-xs text-text-secondary">Real-time daily transaction curve & inflow telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-success">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span>Revenue (₹)</span>
            </div>
            <div className="flex items-center gap-1.5 text-platinum">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 " />
              <span>Daily Orders</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          {formattedRevenue.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-secondary/70 space-y-2">
              <TrendingUp className="w-8 h-8 opacity-30" />
              <p className="text-sm font-semibold">No order revenue data recorded for this time range</p>
              <p className="text-xs">Adjust your date filter to view broader historic analytics</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.6} />
                <XAxis 
                  dataKey="dateFormatted" 
                  stroke="#71717a" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#3f3f46', opacity: 0.3 }} 
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#09090b', 
                    borderColor: 'rgba(52, 211, 153, 0.3)', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.8)'
                  }}
                  itemStyle={{ color: '#34d399', fontWeight: 600 }}
                  formatter={(value: any, name: any) => [
                    name === 'revenue' ? `₹${Number(value).toLocaleString()}` : `${value} tickets`,
                    name === 'revenue' ? 'Gross Revenue' : 'Order Count'
                  ]}
                  labelStyle={{ color: '#e4e4e7', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#emeraldRevGrad)" 
                  activeDot={{ r: 6, fill: '#34d399', stroke: '#064e3b', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Middle Section: Category Bar Chart + Order Type Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Revenue Distribution */}
        <div className="lg:col-span-2 bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle rounded-2xl p-6 lg:p-7 shadow-[0_20px_60px_rgba(201,168,76,0.15)] hover:shadow-[0_25px_70px_rgba(201,168,76,0.25)] hover:-translate-y-1 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-border-subtle">
            <div className="w-9 h-9 rounded-xl bg-champagne/10 border border-champagne/20 flex items-center justify-center text-champagne">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif text-text-primary tracking-wide">Category Revenue Matrix</h3>
              <p className="text-xs text-text-secondary">Sales volume distributed across menu categories</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {formattedCategories.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-secondary/70 text-sm">
                No category sales recorded
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedCategories} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />
                  <XAxis 
                    dataKey="categoryName" 
                    stroke="#71717a" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#3f3f46', opacity: 0.3 }} 
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ 
                      backgroundColor: '#09090b', 
                      borderColor: '#3f3f46', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.8)'
                    }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                    labelStyle={{ color: '#e4e4e7', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {formattedCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Order Channel & Dining Mode Split */}
        <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle rounded-2xl p-6 lg:p-7 shadow-[0_20px_60px_rgba(201,168,76,0.15)] hover:shadow-[0_25px_70px_rgba(201,168,76,0.25)] hover:-translate-y-1 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-3 border-b border-border-subtle">
              <div className="w-9 h-9 rounded-xl bg-platinum/5 border border-cyan-500/20 flex items-center justify-center text-platinum">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-serif text-text-primary tracking-wide">Channel Mix</h3>
                <p className="text-xs text-text-secondary">Dine-in vs digital takeaway ratio</p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {summary.orderTypeBreakdown.length === 0 ? (
                <p className="text-xs text-text-secondary/70 italic">No channel statistics available</p>
              ) : (
                summary.orderTypeBreakdown.map((item) => (
                  <div key={item.type} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-zinc-200 capitalize flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.type === 'dine-in' ? 'bg-champagne' : 'bg-cyan-400'}`} />
                        {item.type} Orders
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-text-secondary">{item.count} tickets</span>
                        <span className="text-text-primary font-bold">{item.percentage}%</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-elevated overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          item.type === 'dine-in'
                            ? 'bg-gradient-to-r from-champagne to-platinum' 
                            : 'bg-gradient-to-r from-cyan-400 to-blue-400'
                        }`}
                        style={{ width: `${Math.max(item.percentage, 5)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-text-secondary/70 font-mono text-right">
                      Total: {formatMoney(item.revenuePaise)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-obsidian/60 border border-border-subtle mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">Kitchen Fulfillment Rate</span>
              <span className="text-success font-black font-mono text-sm">{summary.fulfillmentRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top Dishes Culinary Leaderboard */}
      <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(201,168,76,0.15)] hover:shadow-[0_25px_70px_rgba(201,168,76,0.25)] hover:-translate-y-1">
        <div className="p-6 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-warning">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif text-text-primary tracking-wide">Culinary Revenue Leaderboard</h3>
              <p className="text-xs text-text-secondary">Top-performing menu items ranked by gross revenue and order frequency</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-obsidian/90 text-text-secondary border-b border-border-subtle text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold text-center w-16">Rank</th>
                <th className="px-6 py-4 font-semibold">Dish & Culinary Name</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold text-center">Portions Sold</th>
                <th className="px-6 py-4 font-semibold">Revenue Contribution</th>
                <th className="px-6 py-4 font-semibold text-right">Gross Inflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-text-secondary">
              {summary.topDishes.map((dish, index) => {
                const pct = Math.round((dish.revenuePaise / maxDishRevenue) * 100);

                return (
                  <tr key={dish.dishId} className="group hover:bg-elevated/40 transition-colors">
                    {/* Rank */}
                    <td className="px-6 py-4 text-center">
                      {index === 0 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-warning/10 text-warning border border-warning/30 text-xs font-black shadow-lg shadow-amber-500/10">
                          🥇
                        </span>
                      ) : index === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 text-xs font-black">
                          🥈
                        </span>
                      ) : index === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-warning border border-amber-700/40 text-xs font-black">
                          🥉
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-text-secondary/70 font-bold">
                          #{index + 1}
                        </span>
                      )}
                    </td>

                    {/* Dish Name */}
                    <td className="px-6 py-4">
                      <span className="font-semibold text-zinc-100 group-hover:text-platinum transition-colors">
                        {dish.dishName}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-elevated/80 border border-border-strong/50 text-text-secondary">
                        {dish.categoryName}
                      </span>
                    </td>

                    {/* Quantity Sold */}
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-elevated text-zinc-200">
                        {dish.quantitySold} units
                      </span>
                    </td>

                    {/* Visual Progress Bar */}
                    <td className="px-6 py-4 min-w-[180px]">
                      <div className="space-y-1">
                        <div className="w-full h-1.5 rounded-full bg-elevated overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-text-secondary/70 font-mono">{pct}% of top seller</span>
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="px-6 py-4 text-right font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 text-sm">
                      {formatMoney(dish.revenuePaise)}
                    </td>
                  </tr>
                );
              })}
              {summary.topDishes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary/70 italic">
                    No culinary transaction data recorded for this period.
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

