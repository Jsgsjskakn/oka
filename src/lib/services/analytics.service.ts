import { fetchQuery } from 'convex/nextjs';
import { api } from '@/../convex/_generated/api';
import { createClient } from '@/lib/supabase/server';

export interface AnalyticsFilters {
  restaurantId: string;
  dateFrom: string;
  dateTo: string;
  categoryId?: string;
  dishId?: string;
}

export interface DishAnalytics {
  dishId: string;
  dishName: string;
  categoryName: string;
  quantitySold: number;
  orderCount: number;
  revenuePaise: number;
}

export interface CategoryAnalytics {
  categoryId: string;
  categoryName: string;
  quantitySold: number;
  orderCount: number;
  revenuePaise: number;
  topDishes: DishAnalytics[];
}

export interface OrderTypeAnalytics {
  type: string;
  count: number;
  revenuePaise: number;
  percentage: number;
}

export interface AnalyticsSummary {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenuePaise: number;
  totalTipsPaise: number;
  totalQuantitySold: number;
  fulfillmentRate: number;
  averageOrderValuePaise: number;
  topDishes: DishAnalytics[];
  categoryBreakdown: CategoryAnalytics[];
  orderTypeBreakdown: OrderTypeAnalytics[];
  revenueByDay: Array<{ date: string; revenuePaise: number; orderCount: number }>;
}

interface OrderRow {
  id: string;
  status: string;
  order_type: string | null;
  total_paise: number;
  tip_paise: number;
  created_at: string;
  order_items: Array<{
    quantity: number;
    line_total_paise: number;
    dishes: { id: string; name: string; category_id: string; categories: { id: string; name: string } } | null;
  }>;
}

export async function getAnalyticsSummary(filters: AnalyticsFilters): Promise<AnalyticsSummary> {
  const empty: AnalyticsSummary = {
    totalOrders: 0, 
    completedOrders: 0, 
    cancelledOrders: 0,
    totalRevenuePaise: 0, 
    totalTipsPaise: 0, 
    totalQuantitySold: 0,
    fulfillmentRate: 100,
    averageOrderValuePaise: 0,
    topDishes: [], 
    categoryBreakdown: [], 
    orderTypeBreakdown: [],
    revenueByDay: [],
  };

  // 1. Primary: Convex Analytics Query
  try {
    const summary = await fetchQuery(api.analytics.getAnalyticsSummary, {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      categoryId: filters.categoryId,
      dishId: filters.dishId,
    });

    if (summary) {
      return summary as AnalyticsSummary;
    }
  } catch (err) {
    console.warn('[analytics.service] Convex getAnalyticsSummary failed, trying Supabase:', err);
  }

  // 2. Supabase Fallback
  try {
    const supabase = await createClient();

    const { data: rawOrders, error } = await supabase
      .from('orders')
      .select('id, status, order_type, total_paise, tip_paise, created_at, order_items(quantity, line_total_paise, dishes(id, name, category_id, categories(id, name)))')
      .eq('restaurant_id', filters.restaurantId)
      .gte('created_at', filters.dateFrom)
      .lte('created_at', filters.dateTo) as { data: OrderRow[] | null; error: unknown };

    if (error || !rawOrders) throw error ?? new Error('No data');

    const summary = { ...empty, totalOrders: rawOrders.length };
    const dishStats = new Map<string, DishAnalytics>();
    const catStats = new Map<string, CategoryAnalytics>();
    const revByDay = new Map<string, { revenuePaise: number; orderCount: number }>();
    const orderTypesMap = new Map<string, { count: number; revenuePaise: number }>();

    for (const order of rawOrders) {
      const typeKey = (order.order_type || 'dine-in').toLowerCase();
      const typeStat = orderTypesMap.get(typeKey) ?? { count: 0, revenuePaise: 0 };
      typeStat.count++;
      typeStat.revenuePaise += (order.status !== 'cancelled' ? (order.total_paise ?? 0) : 0);
      orderTypesMap.set(typeKey, typeStat);

      if (order.status === 'cancelled') {
        summary.cancelledOrders++;
        continue;
      }
      summary.completedOrders++;
      summary.totalRevenuePaise += order.total_paise ?? 0;
      summary.totalTipsPaise += order.tip_paise ?? 0;

      const dateKey = order.created_at.split('T')[0];
      const dayStat = revByDay.get(dateKey) ?? { revenuePaise: 0, orderCount: 0 };
      dayStat.revenuePaise += order.total_paise ?? 0;
      dayStat.orderCount++;
      revByDay.set(dateKey, dayStat);

      for (const item of order.order_items ?? []) {
        const dish = item.dishes;
        if (!dish) continue;
        const cat = dish.categories;
        if (!cat) continue;
        if (filters.categoryId && cat.id !== filters.categoryId) continue;
        if (filters.dishId && dish.id !== filters.dishId) continue;

        summary.totalQuantitySold += item.quantity;

        const dStat = dishStats.get(dish.id) ?? { dishId: dish.id, dishName: dish.name, categoryName: cat.name, quantitySold: 0, orderCount: 0, revenuePaise: 0 };
        dStat.quantitySold += item.quantity;
        dStat.orderCount++;
        dStat.revenuePaise += item.line_total_paise ?? 0;
        dishStats.set(dish.id, dStat);

        const cStat = catStats.get(cat.id) ?? { categoryId: cat.id, categoryName: cat.name, quantitySold: 0, orderCount: 0, revenuePaise: 0, topDishes: [] };
        cStat.quantitySold += item.quantity;
        cStat.orderCount++;
        cStat.revenuePaise += item.line_total_paise ?? 0;
        catStats.set(cat.id, cStat);
      }
    }

    summary.fulfillmentRate = summary.totalOrders > 0 
      ? Math.round((summary.completedOrders / summary.totalOrders) * 100) 
      : 100;

    summary.averageOrderValuePaise = summary.completedOrders > 0 
      ? Math.round(summary.totalRevenuePaise / summary.completedOrders) 
      : 0;

    summary.topDishes = Array.from(dishStats.values())
      .sort((a, b) => b.revenuePaise - a.revenuePaise)
      .slice(0, 10);

    summary.categoryBreakdown = Array.from(catStats.values())
      .map(cat => ({
        ...cat,
        topDishes: Array.from(dishStats.values())
          .filter(d => d.categoryName === cat.categoryName)
          .sort((a, b) => b.revenuePaise - a.revenuePaise)
          .slice(0, 5)
      }));

    summary.orderTypeBreakdown = Array.from(orderTypesMap.entries()).map(([type, stat]) => ({
      type,
      count: stat.count,
      revenuePaise: stat.revenuePaise,
      percentage: summary.totalOrders > 0 ? Math.round((stat.count / summary.totalOrders) * 100) : 0,
    }));

    summary.revenueByDay = Array.from(revByDay.entries())
      .map(([date, stat]) => ({ date, revenuePaise: stat.revenuePaise, orderCount: stat.orderCount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return summary;
  } catch {
    return empty;
  }
}
