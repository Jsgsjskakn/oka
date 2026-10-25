import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authenticateCaller, ADMIN_ROLES } from "./authUtils";

// Get active categories sorted by sortOrder
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_sort_order")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return categories.map((c) => ({
      id: c._id,
      name: c.name,
      slug: c.slug,
      icon: c.icon || null,
      sort_order: c.sortOrder,
      is_active: c.isActive,
      dishCount: 0, // Computed in frontend or enriched
    }));
  },
});

// Get all dishes for a specific category slug
export const getDishesByCategory = query({
  args: { categorySlug: v.string() },
  handler: async (ctx, args) => {
    const dishes = await ctx.db
      .query("dishes")
      .withIndex("by_category", (q) => q.eq("categorySlug", args.categorySlug))
      .filter((q) => q.eq(q.field("isAvailable"), true))
      .collect();

    return dishes.map((d) => ({
      id: d._id,
      slug: d.slug,
      name: d.name,
      description: d.description || "",
      price: Math.round(d.pricePaise / 100),
      originalPrice: d.originalPricePaise ? Math.round(d.originalPricePaise / 100) : undefined,
      image: d.imageUrl || "/images/dishes/placeholder.jpg",
      category: d.categorySlug,
      isVeg: d.isVeg,
      isAvailable: d.isAvailable,
      isFeatured: d.isFeatured,
      isBestSeller: d.isBestSeller,
      spiceLevel: (d.spiceLevel as "mild" | "medium" | "hot" | "extra-hot") || "mild",
      calories: d.calories || undefined,
      preparationTime: d.preparationTime || undefined,
      allergens: d.allergens || undefined,
      has3DModel: d.has3DModel,
      modelUrl: d.modelUrl || undefined,
      sizes: d.sizes?.map((s) => ({
        id: s.id,
        name: s.name,
        priceModifier: Math.round(s.priceModifierPaise / 100),
      })),
      addOns: d.addOns?.map((a) => ({
        id: a.id,
        name: a.name,
        price: Math.round(a.pricePaise / 100),
      })),
      ingredients: d.ingredients || undefined,
      removableIngredients: d.removableIngredients || undefined,
    }));
  },
});

// Get a single dish by slug
export const getDishBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const d = await ctx.db
      .query("dishes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!d) return null;

    return {
      id: d._id,
      slug: d.slug,
      name: d.name,
      description: d.description || "",
      price: Math.round(d.pricePaise / 100),
      originalPrice: d.originalPricePaise ? Math.round(d.originalPricePaise / 100) : undefined,
      image: d.imageUrl || "/images/dishes/placeholder.jpg",
      category: d.categorySlug,
      isVeg: d.isVeg,
      isAvailable: d.isAvailable,
      isFeatured: d.isFeatured,
      isBestSeller: d.isBestSeller,
      spiceLevel: (d.spiceLevel as "mild" | "medium" | "hot" | "extra-hot") || "mild",
      calories: d.calories || undefined,
      preparationTime: d.preparationTime || undefined,
      allergens: d.allergens || undefined,
      has3DModel: d.has3DModel,
      modelUrl: d.modelUrl || undefined,
      sizes: d.sizes?.map((s) => ({
        id: s.id,
        name: s.name,
        priceModifier: Math.round(s.priceModifierPaise / 100),
      })),
      addOns: d.addOns?.map((a) => ({
        id: a.id,
        name: a.name,
        price: Math.round(a.pricePaise / 100),
      })),
      ingredients: d.ingredients || undefined,
      removableIngredients: d.removableIngredients || undefined,
    };
  },
});

// Get all dishes (for menu listing & search)
export const getAllDishes = query({
  args: {},
  handler: async (ctx) => {
    const dishes = await ctx.db.query("dishes").collect();
    return dishes.map((d) => ({
      id: d._id,
      slug: d.slug,
      name: d.name,
      description: d.description || "",
      price: Math.round(d.pricePaise / 100),
      originalPrice: d.originalPricePaise ? Math.round(d.originalPricePaise / 100) : undefined,
      image: d.imageUrl || "/images/dishes/placeholder.jpg",
      category: d.categorySlug,
      isVeg: d.isVeg,
      isAvailable: d.isAvailable,
      isFeatured: d.isFeatured,
      isBestSeller: d.isBestSeller,
      spiceLevel: (d.spiceLevel as "mild" | "medium" | "hot" | "extra-hot") || "mild",
      calories: d.calories || undefined,
      preparationTime: d.preparationTime || undefined,
      allergens: d.allergens || undefined,
      has3DModel: d.has3DModel,
      modelUrl: d.modelUrl || undefined,
    }));
  },
});

// Helper to resolve dish ID
async function resolveDish(ctx: any, identifier: string) {
  const normId = ctx.db.normalizeId("dishes", identifier);
  if (normId) {
    const doc = await ctx.db.get(normId);
    if (doc) return doc;
  }
  // Try by slug
  const bySlug = await ctx.db
    .query("dishes")
    .withIndex("by_slug", (q: any) => q.eq("slug", identifier))
    .first();
  if (bySlug) return bySlug;

  // Try by legacyId
  return await ctx.db
    .query("dishes")
    .filter((q: any) => q.eq(q.field("legacyId"), identifier))
    .first();
}

// Admin toggle dish availability
export const toggleDishAvailability = mutation({
  args: {
    id: v.string(),
    isAvailable: v.boolean(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
    if (!auth.authorized) return { error: auth.error };

    const dish = await resolveDish(ctx, args.id);
    if (!dish) return { error: "Dish not found" };
    await ctx.db.patch(dish._id, { isAvailable: args.isAvailable });
    return { success: true };
  },
});

// Admin toggle dish featured
export const toggleDishFeatured = mutation({
  args: {
    id: v.string(),
    isFeatured: v.boolean(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
    if (!auth.authorized) return { error: auth.error };

    const dish = await resolveDish(ctx, args.id);
    if (!dish) return { error: "Dish not found" };
    await ctx.db.patch(dish._id, { isFeatured: args.isFeatured });
    return { success: true };
  },
});

// Admin update dish price
export const updateDishPrice = mutation({
  args: {
    id: v.string(),
    pricePaise: v.number(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
    if (!auth.authorized) return { error: auth.error };

    const dish = await resolveDish(ctx, args.id);
    if (!dish) return { error: "Dish not found" };
    await ctx.db.patch(dish._id, { pricePaise: args.pricePaise });
    return { success: true };
  },
});

// Admin update full dish details
export const updateFullDishDetails = mutation({
  args: {
    id: v.string(),
    payload: v.any(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
    if (!auth.authorized) return { error: auth.error };

    const dish = await resolveDish(ctx, args.id);
    if (!dish) return { error: "Dish not found" };

    const { sizes, addOns, ...fields } = args.payload;
    const patch: Record<string, unknown> = { ...fields };

    if (sizes !== undefined) {
      patch.sizes = sizes.map((s: any) => ({
        id: s.id || `size-${Date.now()}-${Math.random()}`,
        name: s.name,
        priceModifierPaise: s.price_modifier ? Math.round(s.price_modifier * 100) : (s.priceModifierPaise || 0),
      }));
    }

    if (addOns !== undefined) {
      patch.addOns = addOns.map((a: any) => ({
        id: a.id || `addon-${Date.now()}-${Math.random()}`,
        name: a.name,
        pricePaise: a.price ? Math.round(a.price * 100) : (a.pricePaise || 0),
      }));
    }

    await ctx.db.patch(dish._id, patch);
    return { success: true };
  },
});

// Admin create category
export const createCategory = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    icon: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
    if (!auth.authorized) return { error: auth.error };

    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      slug: args.slug,
      icon: args.icon,
      sortOrder: args.sortOrder ?? 99,
      isActive: true,
    });
    return { success: true, categoryId };
  },
});

// Admin update category
export const updateCategoryDetails = mutation({
  args: {
    id: v.string(),
    payload: v.any(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
    if (!auth.authorized) return { error: auth.error };

    const normId = ctx.db.normalizeId("categories", args.id);
    let category = normId ? await ctx.db.get(normId) : null;
    if (!category) {
      category = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", args.id))
        .first();
    }
    if (!category) return { error: "Category not found" };

    await ctx.db.patch(category._id, args.payload);
    return { success: true };
  },
});

