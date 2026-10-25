import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authenticateCaller, ADMIN_ROLES, STAFF_ROLES } from "./authUtils";

export const getAllTables = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tables")
      .withIndex("by_table_number")
      .collect();
  },
});

export const createTable = mutation({
  args: {
    tableNumber: v.number(),
    capacity: v.number(),
    status: v.union(
      v.literal("available"),
      v.literal("occupied"),
      v.literal("reserved"),
      v.literal("maintenance")
    ),
    notes: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
    if (!auth.authorized) return { error: auth.error };

    // Check for duplicate table number
    const existing = await ctx.db
      .query("tables")
      .withIndex("by_table_number", (q) => q.eq("tableNumber", args.tableNumber))
      .first();

    if (existing) {
      return { error: `Table number ${args.tableNumber} already exists.` };
    }

    const tableId = await ctx.db.insert("tables", {
      tableNumber: args.tableNumber,
      capacity: args.capacity,
      status: args.status,
      notes: args.notes,
      createdAt: Date.now(),
    });

    return { success: true, tableId };
  },
});

export const updateTableStatus = mutation({
  args: {
    tableId: v.string(),
    status: v.union(
      v.literal("available"),
      v.literal("occupied"),
      v.literal("reserved"),
      v.literal("maintenance")
    ),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, STAFF_ROLES);
    if (!auth.authorized) return { error: auth.error };

    const id = ctx.db.normalizeId("tables", args.tableId);
    if (!id) return { error: "Invalid table ID" };

    const table = await ctx.db.get(id);
    if (!table) return { error: "Table not found" };

    await ctx.db.patch(id, { status: args.status });
    return { success: true };
  },
});

export const updateTableCapacity = mutation({
  args: {
    tableId: v.string(),
    capacity: v.number(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
    if (!auth.authorized) return { error: auth.error };

    const id = ctx.db.normalizeId("tables", args.tableId);
    if (!id) return { error: "Invalid table ID" };

    await ctx.db.patch(id, { capacity: args.capacity });
    return { success: true };
  },
});

export const deleteTable = mutation({
  args: {
    tableId: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
    if (!auth.authorized) return { error: auth.error };

    const id = ctx.db.normalizeId("tables", args.tableId);
    if (!id) return { error: "Invalid table ID" };

    await ctx.db.delete(id);
    return { success: true };
  },
});
