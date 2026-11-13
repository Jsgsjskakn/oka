import { getHotspots } from '@/data/ar-config';
import { getModelConfig, hasInteractive3DModel } from '@/data/model-config';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/../convex/_generated/api';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Category, DishWithCategory, DishSize, DishAddon, DishModel, DishHotspot } from '@/lib/db/types';
import { categories as mockCategories, dishes as mockDishes } from '@/data/mock-menu';
import { resolveDishImageUrl, DISH_IMAGE_MAP } from '@/lib/utils/dish-images';

export { resolveDishImageUrl, DISH_IMAGE_MAP };

const RESTAURANT_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

// Format mock categories to match DB schema
function getFallbackCategories(): Category[] {
  return mockCategories.map((c, idx) => ({
    id: c.id,
    restaurant_id: RESTAURANT_ID,
    name: c.name,
    slug: c.slug,
    icon: c.icon || null,
    sort_order: idx + 1,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }));
}

// Format mock dishes to match DB schema
function getFallbackDishes(): DishWithCategory[] {
  const cats = getFallbackCategories();
  return mockDishes.map((d, idx) => {
    const matchedCat = cats.find((c) => c.slug === d.category) || cats[0];
    return {
      id: d.id,
      restaurant_id: RESTAURANT_ID,
      category_id: matchedCat.id,
      name: d.name,
      slug: d.slug,
      description: d.description || null,
      price_paise: Math.round(d.price * 100),
      original_price_paise: d.originalPrice ? Math.round(d.originalPrice * 100) : null,
      image_url: resolveDishImageUrl(d.slug, d.image),
      thumbnail_url: resolveDishImageUrl(d.slug, d.image),
      is_veg: d.isVeg ?? true,
      is_available: d.isAvailable ?? true,
      is_featured: d.isFeatured ?? false,
      is_best_seller: d.isBestSeller ?? false,
      spice_level: d.spiceLevel || 'mild',
      calories: d.calories || null,
      preparation_time: d.preparationTime || null,
      allergens: d.allergens || null,
      has_3d_model: d.has3DModel ?? false,
      sort_order: idx + 1,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      categories: matchedCat,
    };
  });
}

// Map a Convex dish item to DishWithCategory
function mapConvexDish(d: any, category?: Category): DishWithCategory {
  const cat = category || {
    id: `cat-${d.category || d.categorySlug}`,
    restaurant_id: RESTAURANT_ID,
    name: d.category || d.categorySlug,
    slug: d.category || d.categorySlug,
    icon: null,
    sort_order: 1,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  return {
    id: d.id || d._id,
    restaurant_id: RESTAURANT_ID,
    category_id: cat.id,
    name: d.name,
    slug: d.slug,
    description: d.description || null,
    price_paise: d.pricePaise ?? (typeof d.price === 'number' ? Math.round(d.price * 100) : 0),
    original_price_paise: d.originalPricePaise ?? (typeof d.originalPrice === 'number' ? Math.round(d.originalPrice * 100) : null),
    image_url: resolveDishImageUrl(d.slug, d.image || d.imageUrl),
    thumbnail_url: resolveDishImageUrl(d.slug, d.thumbnailUrl || d.image),
    is_veg: d.isVeg ?? true,
    is_available: d.isAvailable ?? true,
    is_featured: d.isFeatured ?? false,
    is_best_seller: d.isBestSeller ?? false,
    spice_level: d.spiceLevel || 'mild',
    calories: d.calories || null,
    preparation_time: d.preparationTime || null,
    allergens: d.allergens || null,
    has_3d_model: d.has3DModel ?? false,
    sort_order: d.sortOrder || 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    categories: cat,
  };
}

function withTimeout<T>(promise: Promise<T>, ms = 3500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function resolveConvexDishByIdOrSlug(dishId: string): Promise<any | null> {
  try {
    const bySlug = await withTimeout(fetchQuery(api.menu.getDishBySlug, { slug: dishId }), 3500);
    if (bySlug) return bySlug;

    const all = await withTimeout(fetchQuery(api.menu.getAllDishes, {}), 3500);
    if (Array.isArray(all)) {
      const matched = all.find((d: any) => d.id === dishId || d._id === dishId || d.slug === dishId);
      if (matched) {
        const detailed = await withTimeout(fetchQuery(api.menu.getDishBySlug, { slug: matched.slug }), 3500);
        return detailed || matched;
      }
    }
  } catch {
    // Let callers fall back cleanly
  }
  return null;
}

export {
  invalidateMenuCache,
  getMenuCacheStats,
  getCachedOrFetch,
  DEFAULT_MENU_CACHE_TTL_MS,
  MAX_CACHE_ENTRIES,
  resetMenuCacheState,
} from './menu-cache';
import { getCachedOrFetch } from './menu-cache';

export async function getCategories(): Promise<Category[]> {
  const cacheKey = `menu:categories:${RESTAURANT_ID}`;
  return getCachedOrFetch(cacheKey, async () => {
    // 1. Primary: Try Convex
    try {
      const data = await withTimeout(fetchQuery(api.menu.getCategories, {}), 3500);
      if (data && data.length > 0) {
        return data.map((c: any) => ({
          id: c.id,
          restaurant_id: RESTAURANT_ID,
          name: c.name,
          slug: c.slug,
          icon: c.icon,
          sort_order: c.sort_order,
          is_active: c.is_active,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        }));
      }
    } catch (convexError) {
      console.warn('[menu.service] Convex getCategories failed, falling back to Supabase:', convexError);
    }

    // 2. Secondary Fallback: Supabase
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');
        if (!error && data && data.length > 0) return data;
      } catch (supabaseError) {
        console.warn('[menu.service] Supabase categories query failed:', supabaseError);
      }
    }

    // 3. Final Fallback: Local Data
    return getFallbackCategories();
  });
}

export async function getDishesByCategory(categorySlug: string): Promise<DishWithCategory[]> {
  // 1. Primary: Try Convex
  try {
    const [data, cats] = await Promise.all([
      withTimeout(fetchQuery(api.menu.getDishesByCategory, { categorySlug }), 3500),
      getCategories().catch(() => [] as Category[]),
    ]);
    if (data && data.length > 0) {
      const catBySlug = new Map(cats.map((c) => [c.slug, c]));
      return data.map((d: any) => mapConvexDish(d, catBySlug.get(d.categorySlug || d.category)));
    }
  } catch (convexError) {
    console.warn('[menu.service] Convex getDishesByCategory failed, trying Supabase:', convexError);
  }

  // 2. Secondary Fallback: Supabase
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('dishes')
        .select('*, categories(*)')
        .eq('categories.slug', categorySlug)
        .eq('is_available', true);
      if (!error && data && data.length > 0) {
        return (data as any[]).map((d) => ({
          ...d,
          image_url: resolveDishImageUrl(d.slug, d.image_url),
          thumbnail_url: resolveDishImageUrl(d.slug, d.thumbnail_url || d.image_url),
        })) as DishWithCategory[];
      }
    } catch (supabaseError) {
      console.warn('[menu.service] Supabase dishes query failed:', supabaseError);
    }
  }

  // 3. Final Fallback: Local Data
  return getFallbackDishes().filter((d) => d.categories?.slug === categorySlug);
}

export async function getDishBySlug(categorySlug: string, dishSlug: string): Promise<DishWithCategory | null> {
  // 1. Primary: Try Convex
  try {
    const [dish, cats] = await Promise.all([
      fetchQuery(api.menu.getDishBySlug, { slug: dishSlug }),
      getCategories().catch(() => [] as Category[]),
    ]);
    if (dish) {
      const matchedCat = cats.find((c) => c.slug === ((dish as any).categorySlug || dish.category));
      return mapConvexDish(dish, matchedCat);
    }
  } catch (convexError) {
    console.warn('[menu.service] Convex getDishBySlug failed, trying Supabase:', convexError);
  }

  // 2. Secondary Fallback: Supabase
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('dishes')
        .select('*, categories(*)')
        .eq('categories.slug', categorySlug)
        .eq('slug', dishSlug)
        .eq('is_available', true)
        .single();
      if (!error && data) {
        const d = data as any;
        return {
          ...d,
          image_url: resolveDishImageUrl(d.slug, d.image_url),
          thumbnail_url: resolveDishImageUrl(d.slug, d.thumbnail_url || d.image_url),
        } as DishWithCategory;
      }
    } catch {
      // continue to fallback
    }
  }

  return getFallbackDishes().find((d) => d.slug === dishSlug && (categorySlug === 'all' || d.categories?.slug === categorySlug)) || null;
}

export async function getDishById(dishId: string): Promise<DishWithCategory | null> {
  // 1. Try matching slug or ID in Convex
  try {
    const [dish, cats] = await Promise.all([
      resolveConvexDishByIdOrSlug(dishId),
      getCategories().catch(() => [] as Category[]),
    ]);
    if (dish) {
      const matchedCat = cats.find((c) => c.slug === (dish.categorySlug || dish.category));
      return mapConvexDish(dish, matchedCat);
    }
  } catch {
    // continue to Supabase
  }

  // 2. Supabase Fallback
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('dishes')
        .select('*, categories(*)')
        .eq('id', dishId)
        .single();
      if (!error && data) {
        const d = data as any;
        return {
          ...d,
          image_url: resolveDishImageUrl(d.slug, d.image_url),
          thumbnail_url: resolveDishImageUrl(d.slug, d.thumbnail_url || d.image_url),
        } as DishWithCategory;
      }
    } catch {
      // fallback to mock
    }
  }

  return getFallbackDishes().find((d) => d.id === dishId || d.slug === dishId) || null;
}

export async function getAllDishes(): Promise<DishWithCategory[]> {
  const cacheKey = `menu:all_dishes:${RESTAURANT_ID}`;
  return getCachedOrFetch(cacheKey, async () => {
    // 1. Primary: Try Convex
    try {
      const [data, cats] = await Promise.all([
        withTimeout(fetchQuery(api.menu.getAllDishes, {}), 3500),
        getCategories().catch(() => [] as Category[]),
      ]);
      if (data && data.length > 0) {
        const catBySlug = new Map(cats.map((c) => [c.slug, c]));
        return data.map((d: any) => mapConvexDish(d, catBySlug.get(d.categorySlug || d.category)));
      }
    } catch (convexError) {
      console.warn('[menu.service] Convex getAllDishes failed, trying Supabase:', convexError);
    }

    // 2. Secondary: Supabase
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from('dishes')
          .select('*, categories(*)')
          .eq('is_available', true);
        if (!error && data && data.length > 0) {
          return (data as any[]).map((d) => ({
            ...d,
            image_url: resolveDishImageUrl(d.slug, d.image_url),
            thumbnail_url: resolveDishImageUrl(d.slug, d.thumbnail_url || d.image_url),
          })) as DishWithCategory[];
        }
      } catch {
        // fallback to mock
      }
    }

    return getFallbackDishes();
  });
}

export async function getFeaturedDishes(): Promise<DishWithCategory[]> {
  const all = await getAllDishes();
  return all.filter((d) => d.is_featured);
}

export async function getCategoryById(categoryId: string): Promise<any> {
  const categories = await getCategories();
  return categories.find((c) => c.id === categoryId || c.slug === categoryId) || null;
}

export async function getDishSizes(dishId: string): Promise<DishSize[]> {
  try {
    const dish = await resolveConvexDishByIdOrSlug(dishId);
    if (dish?.sizes && dish.sizes.length > 0) {
      return dish.sizes.map((s: any, idx: number) => ({
        id: s.id,
        dish_id: dishId,
        name: s.name,
        price_modifier_paise: s.priceModifierPaise ?? Math.round((s.priceModifier || 0) * 100),
        sort_order: idx + 1,
      }));
    }
  } catch {
    // fallback
  }

  const mockDish = mockDishes.find((d) => d.id === dishId || d.slug === dishId);
  if (mockDish?.sizes) {
    return mockDish.sizes.map((s, idx) => ({
      id: `${dishId}-${s.id}`,
      dish_id: dishId,
      name: s.name,
      price_modifier_paise: Math.round(s.priceModifier * 100),
      sort_order: idx + 1,
    }));
  }
  return [];
}

export async function getDishAddons(dishId: string): Promise<DishAddon[]> {
  try {
    const dish = await resolveConvexDishByIdOrSlug(dishId);
    if (dish?.addOns && dish.addOns.length > 0) {
      return dish.addOns.map((a: any) => ({
        id: a.id,
        dish_id: dishId,
        name: a.name,
        price_paise: a.pricePaise ?? Math.round((a.price || 0) * 100),
        is_available: true,
      }));
    }
  } catch {
    // fallback
  }

  const mockDish = mockDishes.find((d) => d.id === dishId || d.slug === dishId);
  if (mockDish?.addOns) {
    return mockDish.addOns.map((a) => ({
      id: `${dishId}-${a.id}`,
      dish_id: dishId,
      name: a.name,
      price_paise: Math.round(a.price * 100),
      is_available: true,
    }));
  }
  return [];
}

export async function getDishModel(dishId: string): Promise<DishModel | null> {
  try {
    const dish = await resolveConvexDishByIdOrSlug(dishId);
    if (dish?.has3DModel) {
      const hasConfig = hasInteractive3DModel(dish.slug);
      const modelCfg = hasConfig ? getModelConfig(dish.slug) : null;
      const modelPath = dish.modelUrl || modelCfg?.modelPath;
      if (!modelPath) return null;
      return {
        id: `model-${dishId}`,
        dish_id: dishId,
        model_path: modelPath,
        initial_scale: modelCfg?.initialScale ?? 1,
        initial_rotation_x: modelCfg?.initialRotation?.[0] ?? 0,
        initial_rotation_y: modelCfg?.initialRotation?.[1] ?? 0,
        initial_rotation_z: modelCfg?.initialRotation?.[2] ?? 0,
        camera_distance: modelCfg?.cameraDistance ?? 1.5,
        is_active: true,
        version: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };
    }
  } catch {
    // fallback
  }

  const mockDish = mockDishes.find((d) => d.id === dishId || d.slug === dishId);
  if (mockDish?.has3DModel) {
    const hasConfig = hasInteractive3DModel(mockDish.slug);
    const modelCfg = hasConfig ? getModelConfig(mockDish.slug) : null;
    const modelPath = mockDish.modelUrl || modelCfg?.modelPath;
    if (!modelPath) return null;
    return {
      id: `model-${dishId}`,
      dish_id: dishId,
      model_path: modelPath,
      initial_scale: modelCfg?.initialScale ?? 1,
      initial_rotation_x: modelCfg?.initialRotation?.[0] ?? 0,
      initial_rotation_y: modelCfg?.initialRotation?.[1] ?? 0,
      initial_rotation_z: modelCfg?.initialRotation?.[2] ?? 0,
      camera_distance: modelCfg?.cameraDistance ?? 1.5,
      is_active: true,
      version: 1,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
  }
  return null;
}

export async function getDishHotspots(dishId: string): Promise<DishHotspot[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('dish_hotspots')
        .select('*')
        .eq('dish_id', dishId);
      if (!error && data && data.length > 0) return data;
    } catch {
      // continue
    }
  }

  // Fallback to curated 3D AR Hotspots in ar-config.ts
  const matchedDish = mockDishes.find((d) => d.id === dishId || d.slug === dishId);
  const targetSlug = matchedDish?.slug || dishId;
  const fallbackHotspots = getHotspots(targetSlug);

  return fallbackHotspots.map((h, idx) => ({
    id: `${dishId}-${h.id}`,
    dish_id: dishId,
    ingredient_id: null,
    label: h.name,
    description: h.description || null,
    pos_x: h.position[0],
    pos_y: h.position[1],
    pos_z: h.position[2],
    is_active: true,
    sort_order: idx + 1,
    created_at: '2026-01-01T00:00:00Z',
  }));
}
