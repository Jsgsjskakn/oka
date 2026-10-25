import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authenticateCaller, ADMIN_ROLES } from "./authUtils";

// Get restaurant profile information
export const getRestaurantInfo = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("restaurants").first();
  },
});

// Get a setting by key
export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("restaurant_settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    return setting?.value ?? null;
  },
});

// Get all restaurant settings as an object
export const getAllSettings = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("restaurant_settings").collect();
    const result: Record<string, unknown> = {};
    for (const item of all) {
      result[item.key] = item.value;
    }
    return result;
  },
});

// Update or insert a setting (Requires Admin)
export const updateSetting = mutation({
  args: {
    key: v.string(),
    value: v.any(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
    if (!auth.authorized) return { error: auth.error };

    const existing = await ctx.db
      .query("restaurant_settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("restaurant_settings", {
        key: args.key,
        value: args.value,
      });
    }
    return { success: true };
  },
});

