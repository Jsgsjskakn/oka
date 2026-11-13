import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
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

    const trimmedName = args.name.trim();
    const trimmedRole = args.role.trim();
    if (!trimmedName || !trimmedRole) {
      return { error: "Employee name and role are required" };
    }

    const employeeId = await ctx.db.insert("employees", {
      name: trimmedName,
      role: trimmedRole,
      email: args.email?.trim().toLowerCase() || undefined,
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

    const existing = await ctx.db.get(id);
    if (!existing) return { error: "Employee not found" };

    const patch: Partial<Doc<"employees">> = {};
    if (args.name !== undefined) {
      const trimmed = args.name.trim();
      if (!trimmed) return { error: "Employee name cannot be empty" };
      patch.name = trimmed;
    }
    if (args.role !== undefined) {
      const trimmedRole = args.role.trim();
      if (!trimmedRole) return { error: "Employee role cannot be empty" };
      patch.role = trimmedRole;
    }
    if (args.email !== undefined) patch.email = args.email.trim().toLowerCase() || undefined;
    if (args.phone !== undefined) patch.phone = args.phone.trim() || undefined;
    if (args.isActive !== undefined) patch.isActive = args.isActive;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(id, patch);
    }
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

    const existing = await ctx.db.get(id);
    if (!existing) return { error: "Employee not found" };

    await ctx.db.delete(id);
    return { success: true };
  },
});
