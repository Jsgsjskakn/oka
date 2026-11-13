import { query, mutation, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { authenticateCaller, ADMIN_ROLES } from "./authUtils";

type SpiceLevel = "mild" | "medium" | "hot" | "extra-hot";

function normalizeSpiceLevel(val: string | undefined): SpiceLevel {
  if (val === "medium" || val === "hot" || val === "extra-hot") return val;
  return "mild";
}

function mapDishDto(d: Doc<"dishes">) {
  return {
    id: d._id,
    slug: d.slug,
    name: d.name,
    description: d.description || "",
    price: Math.round(d.pricePaise / 100),
    originalPrice: d.originalPricePaise
      ? Math.round(d.originalPricePaise / 100)
      : undefined,
    image: d.imageUrl || "/images/dishes/placeholder.jpg",
    category: d.categorySlug,
    isVeg: d.isVeg,
    isAvailable: d.isAvailable,
    isFeatured: d.isFeatured,
    isBestSeller: d.isBestSeller,
    spiceLevel: normalizeSpiceLevel(d.spiceLevel),
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
    sortOrder: d.sortOrder,
  };
}

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

    return dishes.map(mapDishDto);
  },
});

// Get a single dish by slug (with Convex ID fallback for admin edit routes)
export const getDishBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    let d = await ctx.db
      .query("dishes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!d) {
      const normId = ctx.db.normalizeId("dishes", args.slug);
      if (normId) {
        d = await ctx.db.get(normId);
      }
    }

    if (!d) return null;
    return mapDishDto(d);
  },
});

// Get all dishes (for menu listing & search)
export const getAllDishes = query({
  args: {},
  handler: async (ctx) => {
    const dishes = await ctx.db.query("dishes").collect();
    return dishes.map(mapDishDto);
  },
});

// Helper to resolve dish ID, slug, or legacyId
async function resolveDish(
  ctx: QueryCtx | MutationCtx,
  identifier: string
): Promise<Doc<"dishes"> | null> {
  const normId = ctx.db.normalizeId("dishes", identifier);
  if (normId) {
    const doc = await ctx.db.get(normId);
    if (doc) return doc;
  }

  const bySlug = await ctx.db
    .query("dishes")
    .withIndex("by_slug", (q) => q.eq("slug", identifier))
    .first();
  if (bySlug) return bySlug;

  return await ctx.db
    .query("dishes")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", identifier))
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

    if (!Number.isFinite(args.pricePaise) || args.pricePaise <= 0) {
      return { error: "Dish price must be a positive number in paise" };
    }

    const dish = await resolveDish(ctx, args.id);
    if (!dish) return { error: "Dish not found" };
    await ctx.db.patch(dish._id, { pricePaise: Math.round(args.pricePaise) });
    return { success: true };
  },
});

interface DishSizeInput {
  id?: unknown;
  name?: unknown;
  priceModifierPaise?: unknown;
  price_modifier_paise?: unknown;
  priceModifier?: unknown;
  price_modifier?: unknown;
}

interface DishAddonInput {
  id?: unknown;
  name?: unknown;
  pricePaise?: unknown;
  price_paise?: unknown;
  price?: unknown;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string");
}

function toFinitePaise(paiseVal: unknown, rupeeVal: unknown): number {
  if (typeof paiseVal === "number" && Number.isFinite(paiseVal)) {
    return Math.round(paiseVal);
  }
  if (typeof rupeeVal === "number" && Number.isFinite(rupeeVal)) {
    return Math.round(rupeeVal * 100);
  }
  return 0;
}

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

    if (!args.payload || typeof args.payload !== "object" || Array.isArray(args.payload)) {
      return { error: "Invalid dish update payload" };
    }

    const dish = await resolveDish(ctx, args.id);
    if (!dish) return { error: "Dish not found" };

    const raw = args.payload as Record<string, unknown>;
    const patch: Partial<Doc<"dishes">> = {};

    if (typeof raw.name === "string" && raw.name.trim()) {
      patch.name = raw.name.trim();
    }
    if (typeof raw.slug === "string" && raw.slug.trim()) {
      const nextSlug = raw.slug.trim().toLowerCase();
      if (nextSlug !== dish.slug) {
        const conflict = await ctx.db
          .query("dishes")
          .withIndex("by_slug", (q) => q.eq("slug", nextSlug))
          .first();
        if (conflict && conflict._id !== dish._id) {
          return { error: `Another dish already uses slug "${nextSlug}"` };
        }
      }
      patch.slug = nextSlug;
    }
    if (typeof raw.description === "string") {
      patch.description = raw.description;
    }

    const rawPricePaise = raw.pricePaise ?? raw.price_paise;
    if (typeof rawPricePaise === "number") {
      if (!Number.isFinite(rawPricePaise) || rawPricePaise <= 0) {
        return { error: "Dish price must be positive" };
      }
      patch.pricePaise = Math.round(rawPricePaise);
    }

    const rawOrigPaise = raw.originalPricePaise ?? raw.original_price_paise;
    if (typeof rawOrigPaise === "number" && Number.isFinite(rawOrigPaise) && rawOrigPaise >= 0) {
      patch.originalPricePaise = Math.round(rawOrigPaise);
    }

    const rawCatSlug = raw.categorySlug ?? raw.category_slug;
    if (typeof rawCatSlug === "string" && rawCatSlug.trim()) {
      patch.categorySlug = rawCatSlug.trim();
    } else if (typeof raw.category_id === "string" && raw.category_id.trim()) {
      const catIdentifier = raw.category_id.trim();
      const catId = ctx.db.normalizeId("categories", catIdentifier);
      const catDoc = catId
        ? await ctx.db.get(catId)
        : await ctx.db
            .query("categories")
            .withIndex("by_slug", (q) => q.eq("slug", catIdentifier))
            .first();
      if (catDoc) {
        patch.categorySlug = catDoc.slug;
      }
    }

    const imageUrl = raw.imageUrl ?? raw.image_url;
    if (typeof imageUrl === "string") patch.imageUrl = imageUrl;

    const thumbnailUrl = raw.thumbnailUrl ?? raw.thumbnail_url;
    if (typeof thumbnailUrl === "string") patch.thumbnailUrl = thumbnailUrl;

    const isVeg = raw.isVeg ?? raw.is_veg;
    if (typeof isVeg === "boolean") patch.isVeg = isVeg;

    const isAvailable = raw.isAvailable ?? raw.is_available;
    if (typeof isAvailable === "boolean") patch.isAvailable = isAvailable;

    const isFeatured = raw.isFeatured ?? raw.is_featured;
    if (typeof isFeatured === "boolean") patch.isFeatured = isFeatured;

    const isBestSeller = raw.isBestSeller ?? raw.is_best_seller;
    if (typeof isBestSeller === "boolean") patch.isBestSeller = isBestSeller;

    const has3DModel = raw.has3DModel ?? raw.has_3d_model;
    if (typeof has3DModel === "boolean") patch.has3DModel = has3DModel;

    const spiceLevel = raw.spiceLevel ?? raw.spice_level;
    if (typeof spiceLevel === "string" && spiceLevel.trim()) {
      patch.spiceLevel = spiceLevel.trim();
    }

    if (typeof raw.calories === "number" && Number.isFinite(raw.calories) && raw.calories >= 0) {
      patch.calories = Math.round(raw.calories);
    }

    const preparationTime = raw.preparationTime ?? raw.preparation_time;
    if (typeof preparationTime === "string") patch.preparationTime = preparationTime;

    const modelUrl = raw.modelUrl ?? raw.model_url;
    if (typeof modelUrl === "string") patch.modelUrl = modelUrl;

    const sortOrder = raw.sortOrder ?? raw.sort_order;
    if (typeof sortOrder === "number" && Number.isFinite(sortOrder)) {
      patch.sortOrder = sortOrder;
    }

    const ingredients = asStringArray(raw.ingredients);
    if (ingredients) patch.ingredients = ingredients;

    const allergens = asStringArray(raw.allergens);
    if (allergens) patch.allergens = allergens;

    const removable = asStringArray(raw.removableIngredients ?? raw.removable_ingredients);
    if (removable) patch.removableIngredients = removable;

    if (Array.isArray(raw.sizes)) {
      patch.sizes = (raw.sizes as DishSizeInput[])
        .filter((s) => s && typeof s.name === "string" && s.name.trim() !== "")
        .map((s, idx) => ({
          id:
            typeof s.id === "string" && s.id.trim()
              ? s.id.trim()
              : `size-${Date.now()}-${idx}`,
          name: (s.name as string).trim(),
          priceModifierPaise: toFinitePaise(
            s.priceModifierPaise ?? s.price_modifier_paise,
            s.priceModifier ?? s.price_modifier
          ),
        }));
    }

    if (Array.isArray(raw.addOns)) {
      patch.addOns = (raw.addOns as DishAddonInput[])
        .filter((a) => a && typeof a.name === "string" && a.name.trim() !== "")
        .map((a, idx) => ({
          id:
            typeof a.id === "string" && a.id.trim()
              ? a.id.trim()
              : `addon-${Date.now()}-${idx}`,
          name: (a.name as string).trim(),
          pricePaise: Math.max(
            0,
            toFinitePaise(a.pricePaise ?? a.price_paise, a.price)
          ),
        }));
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(dish._id, patch);
    }
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

    const trimmedName = args.name.trim();
    const trimmedSlug = args.slug.trim().toLowerCase();
    if (!trimmedName || !trimmedSlug) {
      return { error: "Category name and slug are required" };
    }

    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", trimmedSlug))
      .first();
    if (existing) {
      return { error: `Category with slug "${trimmedSlug}" already exists` };
    }

    const categoryId = await ctx.db.insert("categories", {
      name: trimmedName,
      slug: trimmedSlug,
      icon: args.icon?.trim() || undefined,
      sortOrder:
        typeof args.sortOrder === "number" && Number.isFinite(args.sortOrder)
          ? args.sortOrder
          : 99,
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

    if (!args.payload || typeof args.payload !== "object" || Array.isArray(args.payload)) {
      return { error: "Invalid category update payload" };
    }

    const normId = ctx.db.normalizeId("categories", args.id);
    let category = normId ? await ctx.db.get(normId) : null;
    if (!category) {
      category = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", args.id))
        .first();
    }
    if (!category) return { error: "Category not found" };

    const raw = args.payload as Record<string, unknown>;
    const patch: Partial<Doc<"categories">> = {};

    if (typeof raw.name === "string" && raw.name.trim()) {
      patch.name = raw.name.trim();
    }
    if (typeof raw.slug === "string" && raw.slug.trim()) {
      const nextSlug = raw.slug.trim().toLowerCase();
      if (nextSlug !== category.slug) {
        const conflict = await ctx.db
          .query("categories")
          .withIndex("by_slug", (q) => q.eq("slug", nextSlug))
          .first();
        if (conflict && conflict._id !== category._id) {
          return { error: `Category with slug "${nextSlug}" already exists` };
        }
      }
      patch.slug = nextSlug;
    }
    if (typeof raw.icon === "string") {
      patch.icon = raw.icon.trim() || undefined;
    }
    const isActive = raw.isActive ?? raw.is_active;
    if (typeof isActive === "boolean") {
      patch.isActive = isActive;
    }
    const sortOrder = raw.sortOrder ?? raw.sort_order;
    if (typeof sortOrder === "number" && Number.isFinite(sortOrder)) {
      patch.sortOrder = sortOrder;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(category._id, patch);
    }
    return { success: true };
  },
});

// Delete dish by slug or ID (Admin only)
export const deleteDish = mutation({
  args: {
    idOrSlug: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
    if (!auth.authorized) return { error: auth.error, success: false };

    const dish = await resolveDish(ctx, args.idOrSlug);
    if (!dish) return { error: "Dish not found", success: false };
    await ctx.db.delete(dish._id);
    return { success: true, deletedSlug: dish.slug };
  },
});


