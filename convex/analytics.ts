import { query } from "./_generated/server";
import { v } from "convex/values";

interface DishAnalyticsItem {
  dishId: string;
  dishName: string;
  categoryName: string;
  quantitySold: number;
  orderCount: number;
  revenuePaise: number;
}

interface CategoryAnalyticsItem {
  categoryId: string;
  categoryName: string;
  quantitySold: number;
  orderCount: number;
  revenuePaise: number;
  topDishes: DishAnalyticsItem[];
}

interface OrderTypeAnalyticsItem {
  type: string;
  count: number;
  revenuePaise: number;
  percentage: number;
}

interface RevenueByDayItem {
  date: string;
  revenuePaise: number;
  orderCount: number;
}

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseDateBound(raw: string | undefined, isEnd: boolean, fallback: number): number {
  if (!raw || !raw.trim()) return fallback;
  const trimmed = raw.trim();
  if (DATE_ONLY_REGEX.test(trimmed)) {
    const base = new Date(`${trimmed}T00:00:00.000Z`).getTime();
    if (!Number.isFinite(base)) return fallback;
    return isEnd ? base + 86_399_999 : base;
  }
  const parsed = new Date(trimmed).getTime();
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const getAnalyticsSummary = query({
  args: {
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    dishId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const fromTime = parseDateBound(args.dateFrom, false, 0);
    const toTime = parseDateBound(args.dateTo, true, Date.now() + 86_400_000);

    const [filteredOrders, allDishes, allCategories] = await Promise.all([
      ctx.db
        .query("orders")
        .withIndex("by_created_at", (q) =>
          q.gte("createdAt", fromTime).lte("createdAt", toTime)
        )
        .order("desc")
        .collect(),
      ctx.db.query("dishes").collect(),
      ctx.db.query("categories").collect(),
    ]);

    const categoryBySlug = new Map<string, { id: string; name: string; slug: string; legacyId?: string }>();
    for (const cat of allCategories) {
      categoryBySlug.set(cat.slug, {
        id: cat._id,
        name: cat.name,
        slug: cat.slug,
        legacyId: cat.legacyId,
      });
    }

    const dishCategoryLookup = new Map<
      string,
      { categoryId: string; categoryName: string; categorySlug: string; categoryLegacyId?: string }
    >();
    for (const dish of allDishes) {
      const cat = categoryBySlug.get(dish.categorySlug);
      const info = {
        categoryId: cat?.id ?? dish.categorySlug,
        categoryName: cat?.name ?? dish.categorySlug,
        categorySlug: dish.categorySlug,
        categoryLegacyId: cat?.legacyId,
      };
      dishCategoryLookup.set(dish._id, info);
      dishCategoryLookup.set(dish.slug, info);
      if (dish.legacyId) dishCategoryLookup.set(dish.legacyId, info);
    }

    const summary = {
      totalOrders: filteredOrders.length,
      completedOrders: 0,
      cancelledOrders: 0,
      totalRevenuePaise: 0,
      totalTipsPaise: 0,
      totalQuantitySold: 0,
      fulfillmentRate: 100,
      averageOrderValuePaise: 0,
      topDishes: [] as DishAnalyticsItem[],
      categoryBreakdown: [] as CategoryAnalyticsItem[],
      orderTypeBreakdown: [] as OrderTypeAnalyticsItem[],
      revenueByDay: [] as RevenueByDayItem[],
    };

    const dishStats = new Map<string, DishAnalyticsItem>();
    const dishOrdersSeen = new Map<string, Set<string>>();
    const catStats = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        quantitySold: number;
        orderIds: Set<string>;
        revenuePaise: number;
        dishes: Map<string, DishAnalyticsItem>;
      }
    >();
    const revByDay = new Map<string, { revenuePaise: number; orderCount: number }>();
    const orderTypesMap = new Map<string, { count: number; revenuePaise: number }>();

    const filterCategory = args.categoryId?.trim();
    const filterDish = args.dishId?.trim();

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
        if (filterDish && item.dishId !== filterDish) continue;

        const catInfo = dishCategoryLookup.get(item.dishId) ?? {
          categoryId: "uncategorized",
          categoryName: "General",
          categorySlug: "uncategorized",
        };

        if (
          filterCategory &&
          catInfo.categoryId !== filterCategory &&
          catInfo.categorySlug !== filterCategory &&
          catInfo.categoryLegacyId !== filterCategory
        ) {
          continue;
        }

        summary.totalQuantitySold += item.quantity;

        const dStat = dishStats.get(item.dishId) ?? {
          dishId: item.dishId,
          dishName: item.dishName,
          categoryName: catInfo.categoryName,
          quantitySold: 0,
          orderCount: 0,
          revenuePaise: 0,
        };
        dStat.quantitySold += item.quantity;
        const dOrderSet = dishOrdersSeen.get(item.dishId) ?? new Set<string>();
        if (!dOrderSet.has(order._id)) {
          dOrderSet.add(order._id);
          dStat.orderCount++;
          dishOrdersSeen.set(item.dishId, dOrderSet);
        }
        dStat.revenuePaise += item.lineTotalPaise || 0;
        dishStats.set(item.dishId, dStat);

        const cStat = catStats.get(catInfo.categoryId) ?? {
          categoryId: catInfo.categoryId,
          categoryName: catInfo.categoryName,
          quantitySold: 0,
          orderIds: new Set<string>(),
          revenuePaise: 0,
          dishes: new Map<string, DishAnalyticsItem>(),
        };
        cStat.quantitySold += item.quantity;
        cStat.orderIds.add(order._id);
        cStat.revenuePaise += item.lineTotalPaise || 0;
        const cDish = cStat.dishes.get(item.dishId) ?? {
          dishId: item.dishId,
          dishName: item.dishName,
          categoryName: catInfo.categoryName,
          quantitySold: 0,
          orderCount: 0,
          revenuePaise: 0,
        };
        cDish.quantitySold += item.quantity;
        cDish.orderCount = dOrderSet.size;
        cDish.revenuePaise += item.lineTotalPaise || 0;
        cStat.dishes.set(item.dishId, cDish);
        catStats.set(catInfo.categoryId, cStat);
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

    summary.categoryBreakdown = Array.from(catStats.values())
      .map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        quantitySold: c.quantitySold,
        orderCount: c.orderIds.size,
        revenuePaise: c.revenuePaise,
        topDishes: Array.from(c.dishes.values())
          .sort((a, b) => b.revenuePaise - a.revenuePaise)
          .slice(0, 5),
      }))
      .sort((a, b) => b.revenuePaise - a.revenuePaise);

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
