import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authenticateCaller, ADMIN_ROLES } from "./authUtils";

export const getEmployees = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("employees")
      .collect();
  },
});

export const addEmployee = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    isActive: v.boolean(),
    hiredAt: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
    if (!auth.authorized) return { error: auth.error };

    const employeeId = await ctx.db.insert("employees", {
      name: args.name.trim(),
      role: args.role,
      email: args.email?.trim() || undefined,
      phone: args.phone?.trim() || undefined,
      isActive: args.isActive,
      hiredAt: args.hiredAt || new Date().toISOString(),
    });

    return { success: true, employeeId };
  },
});

export const updateEmployee = mutation({
  args: {
    employeeId: v.string(),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
    if (!auth.authorized) return { error: auth.error };

    const id = ctx.db.normalizeId("employees", args.employeeId);
    if (!id) return { error: "Invalid employee ID" };

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.role !== undefined) patch.role = args.role;
    if (args.email !== undefined) patch.email = args.email;
    if (args.phone !== undefined) patch.phone = args.phone;
    if (args.isActive !== undefined) patch.isActive = args.isActive;

    await ctx.db.patch(id, patch);
    return { success: true };
  },
});

export const removeEmployee = mutation({
  args: {
    employeeId: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
    if (!auth.authorized) return { error: auth.error };

    const id = ctx.db.normalizeId("employees", args.employeeId);
    if (!id) return { error: "Invalid employee ID" };

    await ctx.db.delete(id);
    return { success: true };
  },
});
