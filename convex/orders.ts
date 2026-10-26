import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authenticateCaller, STAFF_ROLES } from "./authUtils";

// Place a new order (Dine-in or Takeaway)
export const placeOrder = mutation({
  args: {
    customerName: v.string(),
    customerPhone: v.string(),
    customerEmail: v.optional(v.string()),
    orderType: v.union(v.literal("dine-in"), v.literal("takeaway")),
    tableNumber: v.optional(v.number()),
    paymentMethod: v.union(v.literal("upi"), v.literal("cash")),
    pickupTime: v.optional(v.string()),
    notes: v.optional(v.string()),
    tipPaise: v.number(),
    idempotencyKey: v.optional(v.string()),
    accessTokenHash: v.optional(v.string()),
    items: v.array(
      v.object({
        dishId: v.string(),
        dishName: v.string(),
        dishPricePaise: v.number(),
        quantity: v.number(),
        sizeName: v.optional(v.string()),
        sizePriceModifierPaise: v.optional(v.number()),
        lineTotalPaise: v.number(),
        specialInstructions: v.optional(v.string()),
        addons: v.optional(
          v.array(
            v.object({
              name: v.string(),
              pricePaise: v.number(),
            })
          )
        ),
        removedIngredients: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    // 1. Idempotency check with index
    if (args.idempotencyKey) {
      const existing = await ctx.db
        .query("orders")
        .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey!))
        .first();
      if (existing) {
        return { orderId: existing._id, success: true };
      }
    }

    // 2. Validate prices against dishes in DB
    let calculatedSubtotalPaise = 0;
    const validatedItems = [];

    for (const item of args.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 50) {
        return { error: `Invalid quantity ${item.quantity} for item "${item.dishName || item.dishId}"` };
      }

      // Find dish by ID, slug, or name
      let dish = null;
      const normalizedId = ctx.db.normalizeId("dishes", item.dishId);
      if (normalizedId) {
        dish = await ctx.db.get(normalizedId);
      }
      if (!dish) {
        dish = await ctx.db
          .query("dishes")
          .withIndex("by_slug", (q) => q.eq("slug", item.dishId))
          .first();
      }
      if (!dish) {
        dish = await ctx.db
          .query("dishes")
          .filter((q) => q.eq(q.field("name"), item.dishName))
          .first();
      }

      if (!dish) {
        return { error: `Dish not found: "${item.dishName || item.dishId}"` };
      }

      if (!dish.isAvailable) {
        return { error: `Dish "${dish.name}" is currently unavailable` };
      }

      const unitPricePaise = dish.pricePaise;

      // Validate Size Modifier against DB
      let validatedSizeModifierPaise = 0;
      let validatedSizeName: string | undefined = undefined;
      if (item.sizeName) {
        const matchedSize = dish.sizes?.find((s) => s.name.toLowerCase() === item.sizeName?.toLowerCase());
        if (!matchedSize) {
          return { error: `Invalid size "${item.sizeName}" for dish "${dish.name}"` };
        }
        validatedSizeModifierPaise = matchedSize.priceModifierPaise;
        validatedSizeName = matchedSize.name;
      }

      // Validate Add-ons against DB
      let addonsTotalPaise = 0;
      const validatedAddons: Array<{ name: string; pricePaise: number }> = [];
      if (item.addons && item.addons.length > 0) {
        const availableAddOns = dish.addOns || [];
        for (const addonReq of item.addons) {
          const matchedAddon = availableAddOns.find(
            (a) => a.name.toLowerCase() === addonReq.name.toLowerCase()
          );
          if (!matchedAddon) {
            return { error: `Invalid add-on "${addonReq.name}" for dish "${dish.name}"` };
          }
          addonsTotalPaise += matchedAddon.pricePaise;
          validatedAddons.push({
            name: matchedAddon.name,
            pricePaise: matchedAddon.pricePaise,
          });
        }
      }

      const lineUnitPricePaise = unitPricePaise + validatedSizeModifierPaise + addonsTotalPaise;
      if (lineUnitPricePaise < 0) {
        return { error: `Invalid price calculation for dish "${dish.name}"` };
      }

      const lineTotalPaise = lineUnitPricePaise * item.quantity;
      calculatedSubtotalPaise += lineTotalPaise;

      validatedItems.push({
        dishId: dish._id,
        dishName: dish.name,
        dishPricePaise: unitPricePaise,
        quantity: item.quantity,
        sizeName: validatedSizeName,
        sizePriceModifierPaise: validatedSizeModifierPaise,
        lineTotalPaise,
        specialInstructions: item.specialInstructions,
        addons: validatedAddons.length > 0 ? validatedAddons : undefined,
        removedIngredients: item.removedIngredients,
      });
    }

    // 3. Tax calculation from settings (default 5%)
    const taxSetting = await ctx.db
      .query("restaurant_settings")
      .withIndex("by_key", (q) => q.eq("key", "tax_rate_percent"))
      .first();
    const taxPercent = taxSetting ? Number(taxSetting.value) || 5 : 5;
    const calculatedTaxPaise = Math.round(
      calculatedSubtotalPaise * (taxPercent / 100)
    );
    const sanitizedTipPaise = Math.max(0, Math.round(args.tipPaise || 0));
    const calculatedTotalPaise =
      calculatedSubtotalPaise + calculatedTaxPaise + sanitizedTipPaise;

    // 4. Insert order
    const orderId = await ctx.db.insert("orders", {
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      customerEmail: args.customerEmail,
      orderType: args.orderType,
      tableNumber: args.tableNumber,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: args.paymentMethod,
      pickupTime: args.pickupTime,
      notes: args.notes,
      subtotalPaise: calculatedSubtotalPaise,
      taxPaise: calculatedTaxPaise,
      tipPaise: sanitizedTipPaise,
      totalPaise: calculatedTotalPaise,
      idempotencyKey: args.idempotencyKey,
      accessTokenHash: args.accessTokenHash,
      items: validatedItems,
      createdAt: Date.now(),
    });

    return { orderId, success: true };
  },
});

// Get single order by ID
export const getOrderById = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});

// Realtime Active Orders feed for kitchen & employee dashboard
export const getActiveOrders = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_created_at")
      .order("asc")
      .collect();

    // Active orders are pending, confirmed, preparing, or ready
    return orders.filter((o) =>
      ["pending", "confirmed", "preparing", "ready"].includes(o.status)
    );
  },
});

// Get order history (completed / cancelled or customer past orders)
export const getOrderHistory = query({
  args: { phone: v.optional(v.string()), email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_created_at")
      .order("desc")
      .take(100);

    if (args.phone || args.email) {
      return orders.filter(
        (o) =>
          (args.phone && o.customerPhone === args.phone) ||
          (args.email && o.customerEmail && o.customerEmail.toLowerCase() === args.email.toLowerCase())
      );
    }
    return orders;
  },
});

// State Machine allowed transitions for order lifecycle
const ALLOWED_FORWARD_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

// Update order status (Staff / Kitchen action)
export const updateOrderStatus = mutation({
  args: {
    orderId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, STAFF_ROLES);
    if (!auth.authorized) return { error: auth.error };

    const id = ctx.db.normalizeId("orders", args.orderId);
    if (!id) return { error: "Invalid order ID" };
    const order = await ctx.db.get(id);
    if (!order) return { error: "Order not found" };

    if (order.status === args.status) {
      return { success: true };
    }

    const allowed = ALLOWED_FORWARD_TRANSITIONS[order.status] || [];
    if (!allowed.includes(args.status)) {
      return {
        error: `Illegal state transition from "${order.status}" to "${args.status}"`,
      };
    }

    await ctx.db.patch(id, { status: args.status });
    return { success: true };
  },
});

// Customer cancels order
export const cancelOrderByCustomer = mutation({
  args: {
    orderId: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("orders", args.orderId);
    if (!id) return { error: "Invalid order ID" };
    const order = await ctx.db.get(id);
    if (!order) return { error: "Order not found" };

    if (order.customerPhone !== args.phone) {
      return { error: "Unauthorized" };
    }

    if (["preparing", "ready", "completed", "cancelled"].includes(order.status)) {
      return { error: "Order is already in preparation or completed and cannot be cancelled" };
    }

    // Check cancellation window
    const windowSetting = await ctx.db
      .query("restaurant_settings")
      .withIndex("by_key", (q) => q.eq("key", "cancellation_window_minutes"))
      .first();
    const windowMinutes = windowSetting ? Number(windowSetting.value) || 10 : 10;

    const diffMinutes = (Date.now() - order.createdAt) / 60000;
    if (diffMinutes > windowMinutes) {
      return { error: `Cancellation window of ${windowMinutes} mins has passed` };
    }

    await ctx.db.patch(id, {
      status: "cancelled",
      cancelledAt: Date.now(),
      cancelledBy: "customer",
      cancellationReason: "Cancelled by customer",
    });

    return { success: true };
  },
});
