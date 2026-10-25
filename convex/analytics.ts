import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAnalyticsSummary = query({
  args: {
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    dishId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_created_at")
      .order("desc")
      .collect();

    const fromTime = args.dateFrom ? new Date(args.dateFrom).getTime() : 0;
    const toTime = args.dateTo ? new Date(args.dateTo).getTime() : Date.now() + 86400000;

    const filteredOrders = orders.filter(
      (o) => o.createdAt >= fromTime && o.createdAt <= toTime
    );

    const summary = {
      totalOrders: filteredOrders.length,
      completedOrders: 0,
      cancelledOrders: 0,
      totalRevenuePaise: 0,
      totalTipsPaise: 0,
      totalQuantitySold: 0,
      fulfillmentRate: 100,
      averageOrderValuePaise: 0,
      topDishes: [] as any[],
      categoryBreakdown: [] as any[],
      orderTypeBreakdown: [] as any[],
      revenueByDay: [] as any[],
    };

    const dishStats = new Map<string, any>();
    const revByDay = new Map<string, { revenuePaise: number; orderCount: number }>();
    const orderTypesMap = new Map<string, { count: number; revenuePaise: number }>();

    for (const order of filteredOrders) {
      const typeKey = (order.orderType || "dine-in").toLowerCase();
      const typeStat = orderTypesMap.get(typeKey) ?? { count: 0, revenuePaise: 0 };
      typeStat.count++;
      typeStat.revenuePaise += order.status !== "cancelled" ? (order.totalPaise ?? 0) : 0;
      orderTypesMap.set(typeKey, typeStat);

      if (order.status === "cancelled") {
        summary.cancelledOrders++;
        continue;
      }

      summary.completedOrders++;
      summary.totalRevenuePaise += order.totalPaise ?? 0;
      summary.totalTipsPaise += order.tipPaise ?? 0;

      const dateKey = new Date(order.createdAt).toISOString().split("T")[0];
      const dayStat = revByDay.get(dateKey) ?? { revenuePaise: 0, orderCount: 0 };
      dayStat.revenuePaise += order.totalPaise ?? 0;
      dayStat.orderCount++;
      revByDay.set(dateKey, dayStat);

      for (const item of order.items || []) {
        if (args.dishId && item.dishId !== args.dishId) continue;

        summary.totalQuantitySold += item.quantity;

        const dStat = dishStats.get(item.dishId) ?? {
          dishId: item.dishId,
          dishName: item.dishName,
          categoryName: "General",
          quantitySold: 0,
          orderCount: 0,
          revenuePaise: 0,
        };
        dStat.quantitySold += item.quantity;
        dStat.orderCount++;
        dStat.revenuePaise += item.lineTotalPaise || 0;
        dishStats.set(item.dishId, dStat);
      }
    }

    summary.fulfillmentRate =
      summary.totalOrders > 0
        ? Math.round((summary.completedOrders / summary.totalOrders) * 100)
        : 100;

    summary.averageOrderValuePaise =
      summary.completedOrders > 0
        ? Math.round(summary.totalRevenuePaise / summary.completedOrders)
        : 0;

    summary.topDishes = Array.from(dishStats.values())
      .sort((a, b) => b.revenuePaise - a.revenuePaise)
      .slice(0, 10);

    summary.orderTypeBreakdown = Array.from(orderTypesMap.entries()).map(
      ([type, stat]) => ({
        type,
        count: stat.count,
        revenuePaise: stat.revenuePaise,
        percentage:
          summary.totalOrders > 0
            ? Math.round((stat.count / summary.totalOrders) * 100)
            : 0,
      })
    );

    summary.revenueByDay = Array.from(revByDay.entries())
      .map(([date, stat]) => ({
        date,
        revenuePaise: stat.revenuePaise,
        orderCount: stat.orderCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return summary;
  },
});
