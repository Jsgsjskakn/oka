'use client';

import { Download } from 'lucide-react';
import type { AnalyticsSummary } from '@/lib/services/analytics.service';

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function ExportCsvButton({
  summary,
  rangeLabel,
}: {
  summary: AnalyticsSummary;
  rangeLabel: string;
}) {
  const handleExport = () => {
    const lines: string[] = [
      'Section,Metric/Name,Value/Orders,Quantity,Revenue (INR)',
      `Summary,Total Orders,${summary.totalOrders},,${(summary.totalRevenuePaise / 100).toFixed(2)}`,
      `Summary,Completed Orders,${summary.completedOrders},,${(summary.totalRevenuePaise / 100).toFixed(2)}`,
      `Summary,Cancelled Orders,${summary.cancelledOrders},,`,
      `Summary,Average Order Value (INR),${(summary.averageOrderValuePaise / 100).toFixed(2)},,`,
      `Summary,Fulfillment Rate (%),${summary.fulfillmentRate.toFixed(1)},,`,
      `Summary,Dishes Prepared,,${summary.totalQuantitySold},`,
    ];

    for (const day of summary.revenueByDay || []) {
      lines.push(
        `Daily Revenue,${csvEscape(day.date)},${day.orderCount},,${(day.revenuePaise / 100).toFixed(2)}`
      );
    }

    for (const cat of summary.categoryBreakdown || []) {
      lines.push(
        `Category,${csvEscape(cat.categoryName)},${cat.orderCount},${cat.quantitySold},${(cat.revenuePaise / 100).toFixed(2)}`
      );
    }

    for (const dish of summary.topDishes || []) {
      lines.push(
        `Top Dish,${csvEscape(dish.dishName)},${dish.orderCount},${dish.quantitySold},${(dish.revenuePaise / 100).toFixed(2)}`
      );
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `golden-oak-analytics-${rangeLabel || 'report'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="flex items-center justify-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg text-[11px] transition-colors border border-white/15 cursor-pointer"
    >
      <Download className="w-3 h-3" />
      <span>Export CSV</span>
    </button>
  );
}
