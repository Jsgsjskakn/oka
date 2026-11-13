import { query, mutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import {
  authenticateCaller,
  buildPhoneCandidates,
  normalizePhone,
  phonesMatch,
  STAFF_ROLES,
} from "./authUtils";

// Place a new order (Dine-in or Takeaway)
export const placeOrder = mutation({
  args: {
    customerName: v.string(),
    customerPhone: v.string(),
    customerEmail: v.optional(v.string()),
    orderType: v.union(v.literal("dine-in"), v.literal("takeaway"), v.literal("delivery")),
    tableNumber: v.optional(v.number()),
    deliveryAddress: v.optional(v.string()),
    paymentMethod: v.union(v.literal("upi"), v.literal("cash")),
    pickupTime: v.optional(v.string()),
    notes: v.optional(v.string()),
    tipPaise: v.number(),
    promoCode: v.optional(v.string()),
    discountPaise: v.optional(v.number()),
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
    // 1. Basic validation & Idempotency check with index
    const trimmedName = args.customerName.trim();
    const trimmedPhone = args.customerPhone.trim();
    if (!trimmedName || !trimmedPhone) {
      return { error: "Customer name and phone are required" };
    }
    if (args.items.length === 0) {
      return { error: "Order must contain at least one item" };
    }
    if (
      args.tableNumber !== undefined &&
      (!Number.isInteger(args.tableNumber) || args.tableNumber < 1)
    ) {
      return { error: "Invalid table number" };
    }

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

      // Find dish by ID, slug, legacyId, or name
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
          .withIndex("by_legacy_id", (q) => q.eq("legacyId", item.dishId))
          .first();
      }
      if (!dish && item.dishName.trim()) {
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

    // 3. Tax calculation from settings (default 5%, honoring 0%)
    const taxSetting = await ctx.db
      .query("restaurant_settings")
      .withIndex("by_key", (q) => q.eq("key", "tax_rate_percent"))
      .first();
    const parsedTax = taxSetting ? Number(taxSetting.value) : NaN;
    const taxPercent = Number.isFinite(parsedTax) && parsedTax >= 0 ? parsedTax : 5;
    const sanitizedDiscountPaise = Number.isFinite(args.discountPaise)
      ? Math.max(0, Math.min(calculatedSubtotalPaise, Math.round(args.discountPaise!)))
      : 0;
    const effectiveSubtotalPaise = Math.max(0, calculatedSubtotalPaise - sanitizedDiscountPaise);
    const calculatedTaxPaise = Math.round(
      effectiveSubtotalPaise * (taxPercent / 100)
    );
    const sanitizedTipPaise = Number.isFinite(args.tipPaise)
      ? Math.max(0, Math.round(args.tipPaise))
      : 0;
    const calculatedTotalPaise =
      effectiveSubtotalPaise + calculatedTaxPaise + sanitizedTipPaise;

    const normalizedEmail = args.customerEmail?.trim().toLowerCase() || undefined;

    // 4. Insert order
    const orderId = await ctx.db.insert("orders", {
      customerName: trimmedName,
      customerPhone: trimmedPhone,
      customerEmail: normalizedEmail,
      orderType: args.orderType,
      tableNumber: args.tableNumber,
      deliveryAddress: args.deliveryAddress,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: args.paymentMethod,
      pickupTime: args.pickupTime,
      notes: args.notes,
      subtotalPaise: calculatedSubtotalPaise,
      discountPaise: sanitizedDiscountPaise > 0 ? sanitizedDiscountPaise : undefined,
      promoCode: args.promoCode,
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

// Get single order by ID (handles non-Convex IDs gracefully)
export const getOrderById = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("orders", args.orderId);
    if (!id) return null;
    return await ctx.db.get(id);
  },
});

// Realtime Active Orders feed for kitchen & employee dashboard (indexed by status)
export const getActiveOrders = query({
  args: {},
  handler: async (ctx) => {
    const activeStatuses = ["pending", "confirmed", "preparing", "ready"] as const;
    const buckets = await Promise.all(
      activeStatuses.map((status) =>
        ctx.db
          .query("orders")
          .withIndex("by_status_created", (q) => q.eq("status", status))
          .order("asc")
          .take(100)
      )
    );

    return buckets.flat().sort((a, b) => a.createdAt - b.createdAt);
  },
});

// Get order history (completed / cancelled or customer past orders via indexes)
export const getOrderHistory = query({
  args: { phone: v.optional(v.string()), email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const hasPhone = Boolean(args.phone && args.phone.trim());
    const hasEmail = Boolean(args.email && args.email.trim());

    if (!hasPhone && !hasEmail) {
      return await ctx.db
        .query("orders")
        .withIndex("by_created_at")
        .order("desc")
        .take(100);
    }

    const seen = new Map<string, Doc<"orders">>();

    if (hasPhone && args.phone) {
      const candidates = buildPhoneCandidates(args.phone);
      const exactList = candidates.length > 0 ? candidates : [args.phone.trim()];
      for (const candidate of exactList) {
        const matches = await ctx.db
          .query("orders")
          .withIndex("by_phone", (q) => q.eq("customerPhone", candidate))
          .order("desc")
          .take(50);
        for (const o of matches) {
          seen.set(o._id, o);
        }
      }
      if (normalizePhone(args.phone) && seen.size === 0) {
        const recent = await ctx.db
          .query("orders")
          .withIndex("by_created_at")
          .order("desc")
          .take(100);
        for (const o of recent) {
          if (phonesMatch(o.customerPhone, args.phone)) {
            seen.set(o._id, o);
          }
        }
      }
    }

    if (hasEmail && args.email) {
      const trimmedEmail = args.email.trim();
      const lowerEmail = trimmedEmail.toLowerCase();
      const emailCandidates =
        trimmedEmail === lowerEmail ? [lowerEmail] : [lowerEmail, trimmedEmail];
      for (const emailVal of emailCandidates) {
        const matches = await ctx.db
          .query("orders")
          .withIndex("by_email", (q) => q.eq("customerEmail", emailVal))
          .order("desc")
          .take(50);
        for (const o of matches) {
          seen.set(o._id, o);
        }
      }
    }

    return Array.from(seen.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 100);
  },
});

// State Machine allowed transitions for order lifecycle
const ALLOWED_FORWARD_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "preparing", "cancelled"],
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

    const patch: {
      status: typeof args.status;
      cancelledAt?: number;
      cancelledBy?: string;
      cancellationReason?: string;
    } = { status: args.status };
    if (args.status === "cancelled") {
      patch.cancelledAt = Date.now();
      patch.cancelledBy = auth.user.name || auth.user.role || "staff";
      patch.cancellationReason = "Cancelled by staff";
    }

    await ctx.db.patch(id, patch);
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

    const trimmedPhone = args.phone.trim();
    const isPhoneAuthorized =
      Boolean(trimmedPhone) &&
      (phonesMatch(order.customerPhone, trimmedPhone) ||
        order.customerPhone.trim() === trimmedPhone);
    if (!isPhoneAuthorized) {
      return { error: "Unauthorized" };
    }

    const enabledSetting = await ctx.db
      .query("restaurant_settings")
      .withIndex("by_key", (q) => q.eq("key", "customer_cancellation_enabled"))
      .first();
    if (
      enabledSetting &&
      (enabledSetting.value === false || String(enabledSetting.value) === "false")
    ) {
      return { error: "Customer order cancellation is currently disabled." };
    }

    if (["preparing", "ready", "completed", "cancelled"].includes(order.status)) {
      return { error: "Order is already in preparation or completed and cannot be cancelled" };
    }

    // Check cancellation window (honor 0 explicitly)
    const windowSetting = await ctx.db
      .query("restaurant_settings")
      .withIndex("by_key", (q) => q.eq("key", "cancellation_window_minutes"))
      .first();
    const parsedWindow = windowSetting ? Number(windowSetting.value) : NaN;
    const windowMinutes =
      Number.isFinite(parsedWindow) && parsedWindow >= 0 ? parsedWindow : 10;

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
