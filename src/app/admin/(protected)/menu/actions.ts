'use server';

import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/../convex/_generated/api';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { sb } from '@/lib/supabase/typed';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { revalidatePath } from 'next/cache';
import { invalidateMenuCache } from '@/lib/services/menu.service';

export async function updateDishAvailability(dishId: string, isAvailable: boolean) {
  try {
    const admin = await requireAdmin();
    const sessionToken = admin.sessionToken;

    // 1. Primary: Convex Mutation
    try {
      const res = await fetchMutation(api.menu.toggleDishAvailability, {
        id: dishId,
        isAvailable,
        sessionToken,
      });
      if (res && res.success) {
        invalidateMenuCache();
        revalidatePath('/menu');
        revalidatePath('/admin/menu');
        return { success: true };
      }
      if (res && res.error) {
        return { error: res.error };
      }
    } catch (err) {
    }

    // 2. Supabase Fallback
    if (!isSupabaseConfigured()) {
      throw new Error('Failed to update dish availability in Convex and Supabase is not configured');
    }
    const db = sb(await createClient());
    const { error } = await db.from('dishes').update({ is_available: isAvailable }).eq('id', dishId);
    if (error) throw new Error(error.message);
    
    invalidateMenuCache();
    revalidatePath('/menu');
    revalidatePath('/admin/menu');
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to update dish availability' };
  }
}

export async function updateDishFeatured(dishId: string, isFeatured: boolean) {
  try {
    const admin = await requireAdmin();
    const sessionToken = admin.sessionToken;

    // 1. Primary: Convex Mutation
    try {
      const res = await fetchMutation(api.menu.toggleDishFeatured, {
        id: dishId,
        isFeatured,
        sessionToken,
      });
      if (res && res.success) {
        invalidateMenuCache();
        revalidatePath('/menu');
        revalidatePath('/admin/menu');
        return { success: true };
      }
      if (res && res.error) {
        return { error: res.error };
      }
    } catch (err) {
      console.warn('[menu/actions] Convex toggleDishFeatured failed, trying Supabase:', err);
    }

    // 2. Supabase Fallback
    if (!isSupabaseConfigured()) {
      throw new Error('Failed to update dish featured status in Convex and Supabase is not configured');
    }
    const db = sb(await createClient());
    const { error } = await db.from('dishes').update({ is_featured: isFeatured }).eq('id', dishId);
    if (error) throw new Error(error.message);
    
    invalidateMenuCache();
    revalidatePath('/menu');
    revalidatePath('/admin/menu');
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to update featured status' };
  }
}

export async function updateDishPrice(dishId: string, pricePaise: number) {
  try {
    const admin = await requireAdmin();
    const sessionToken = admin.sessionToken;

    // 1. Primary: Convex Mutation
    try {
      const res = await fetchMutation(api.menu.updateDishPrice, {
        id: dishId,
        pricePaise,
        sessionToken,
      });
      if (res && res.success) {
        invalidateMenuCache();
        revalidatePath('/menu');
        revalidatePath('/admin/menu');
        return { success: true };
      }
      if (res && res.error) {
        return { error: res.error };
      }
    } catch (err) {
      console.warn('[menu/actions] Convex updateDishPrice failed, trying Supabase:', err);
    }

    // 2. Supabase Fallback
    if (!isSupabaseConfigured()) {
      throw new Error('Failed to update dish price in Convex and Supabase is not configured');
    }
    const db = sb(await createClient());
    const { error } = await db.from('dishes').update({ price_paise: pricePaise }).eq('id', dishId);
    if (error) throw new Error(error.message);
    
    invalidateMenuCache();
    revalidatePath('/menu');
    revalidatePath('/admin/menu');
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to update dish price' };
  }
}

export async function updateFullDishDetails(dishId: string, payload: any) {
  try {
    const admin = await requireAdmin();
    const sessionToken = admin.sessionToken;

    const {
      sizes,
      addOns,
      category_id,
      price_paise,
      spice_level,
      has_3d_model,
      is_veg,
      is_available,
      is_featured,
      is_best_seller,
      ...rest
    } = payload;

    let resolvedCategorySlug = rest.categorySlug;
    if (!resolvedCategorySlug && category_id) {
      try {
        const cats = await fetchQuery(api.menu.getCategories, {});
        const matchedCat = Array.isArray(cats)
          ? cats.find(
              (c: any) =>
                c.id === category_id ||
                c.slug === category_id ||
                `cat-${c.slug}` === category_id
            )
          : null;
        if (matchedCat?.slug) {
          resolvedCategorySlug = matchedCat.slug;
        }
      } catch {
        // Ignore category slug resolution errors; fallback handles remaining fields
      }
    }

    const convexPayload: Record<string, any> = {
      ...(rest.name !== undefined ? { name: rest.name } : {}),
      ...(rest.description !== undefined ? { description: rest.description } : {}),
      ...(price_paise !== undefined
        ? { pricePaise: price_paise }
        : rest.pricePaise !== undefined
          ? { pricePaise: rest.pricePaise }
          : {}),
      ...(resolvedCategorySlug !== undefined ? { categorySlug: resolvedCategorySlug } : {}),
      ...(spice_level !== undefined
        ? { spiceLevel: spice_level }
        : rest.spiceLevel !== undefined
          ? { spiceLevel: rest.spiceLevel }
          : {}),
      ...(has_3d_model !== undefined
        ? { has3DModel: has_3d_model }
        : rest.has3DModel !== undefined
          ? { has3DModel: rest.has3DModel }
          : {}),
      ...(is_veg !== undefined
        ? { isVeg: is_veg }
        : rest.isVeg !== undefined
          ? { isVeg: rest.isVeg }
          : {}),
      ...(is_available !== undefined
        ? { isAvailable: is_available }
        : rest.isAvailable !== undefined
          ? { isAvailable: rest.isAvailable }
          : {}),
      ...(is_featured !== undefined
        ? { isFeatured: is_featured }
        : rest.isFeatured !== undefined
          ? { isFeatured: rest.isFeatured }
          : {}),
      ...(is_best_seller !== undefined
        ? { isBestSeller: is_best_seller }
        : rest.isBestSeller !== undefined
          ? { isBestSeller: rest.isBestSeller }
          : {}),
      ...(sizes !== undefined
        ? {
            sizes: sizes.map((s: any, idx: number) => ({
              id: s.id || `size-${idx}-${Date.now()}`,
              name: s.name,
              priceModifierPaise:
                typeof s.price_modifier_paise === 'number'
                  ? s.price_modifier_paise
                  : typeof s.priceModifierPaise === 'number'
                    ? s.priceModifierPaise
                    : Math.round((s.price_modifier || 0) * 100),
            })),
          }
        : {}),
      ...(addOns !== undefined
        ? {
            addOns: addOns.map((a: any, idx: number) => ({
              id: a.id || `addon-${idx}-${Date.now()}`,
              name: a.name,
              pricePaise:
                typeof a.price_paise === 'number'
                  ? a.price_paise
                  : typeof a.pricePaise === 'number'
                    ? a.pricePaise
                    : Math.round((a.price || 0) * 100),
            })),
          }
        : {}),
    };

    // 1. Primary: Convex Mutation
    try {
      const res = await fetchMutation(api.menu.updateFullDishDetails, {
        id: dishId,
        payload: convexPayload,
        sessionToken,
      });
      if (res && res.success) {
        invalidateMenuCache();
        revalidatePath('/menu');
        revalidatePath('/admin/menu');
        revalidatePath(`/admin/menu/dishes/${dishId}`);
        return { success: true };
      }
      if (res && res.error) {
        return { error: res.error };
      }
    } catch (err) {
      console.warn('[menu/actions] Convex updateFullDishDetails failed, trying Supabase:', err);
    }

    // 2. Supabase Fallback
    if (!isSupabaseConfigured()) {
      throw new Error('Failed to update dish details in Convex and Supabase is not configured');
    }
    const supabase = await createClient();
    const db = sb(supabase);
    
    const dishData = {
      ...rest,
      ...(category_id !== undefined ? { category_id } : {}),
      ...(price_paise !== undefined ? { price_paise } : {}),
      ...(spice_level !== undefined ? { spice_level } : {}),
      ...(has_3d_model !== undefined ? { has_3d_model } : {}),
      ...(is_veg !== undefined ? { is_veg } : {}),
      ...(is_available !== undefined ? { is_available } : {}),
      ...(is_featured !== undefined ? { is_featured } : {}),
      ...(is_best_seller !== undefined ? { is_best_seller } : {}),
    };
    const { error: dishError } = await db.from('dishes').update(dishData).eq('id', dishId);
    if (dishError) throw new Error(dishError.message);
    
    await supabase.from('dish_sizes').delete().eq('dish_id', dishId);
    if (sizes && sizes.length > 0) {
      const { error: sizeError } = await (supabase as any).from('dish_sizes').insert(
        sizes.map((s: any, idx: number) => ({
          dish_id: dishId,
          name: s.name,
          price_modifier_paise:
            typeof s.price_modifier_paise === 'number'
              ? s.price_modifier_paise
              : Math.round((s.price_modifier || 0) * 100),
          sort_order: idx + 1,
        }))
      );
      if (sizeError) throw new Error(sizeError.message);
    }
    
    await supabase.from('dish_addons').delete().eq('dish_id', dishId);
    if (addOns && addOns.length > 0) {
      const { error: addonError } = await (supabase as any).from('dish_addons').insert(
        addOns.map((a: any) => ({
          dish_id: dishId,
          name: a.name,
          price_paise:
            typeof a.price_paise === 'number'
              ? a.price_paise
              : Math.round((a.price || 0) * 100),
        }))
      );
      if (addonError) throw new Error(addonError.message);
    }
    
    invalidateMenuCache();
    revalidatePath('/menu');
    revalidatePath('/admin/menu');
    revalidatePath(`/admin/menu/dishes/${dishId}`);
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to update dish details' };
  }
}

export async function updateCategoryDetails(categoryId: string, payload: any) {
  try {
    const admin = await requireAdmin();
    const sessionToken = admin.sessionToken;

    const convexPayload: Record<string, any> = {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.slug !== undefined ? { slug: payload.slug } : {}),
      ...(payload.icon !== undefined ? { icon: payload.icon } : {}),
      ...(payload.is_active !== undefined
        ? { isActive: payload.is_active }
        : payload.isActive !== undefined
          ? { isActive: payload.isActive }
          : {}),
      ...(payload.sort_order !== undefined
        ? { sortOrder: payload.sort_order }
        : payload.sortOrder !== undefined
          ? { sortOrder: payload.sortOrder }
          : {}),
    };

    // 1. Primary: Convex Mutation
    try {
      const res = await fetchMutation(api.menu.updateCategoryDetails, {
        id: categoryId,
        payload: convexPayload,
        sessionToken,
      });
      if (res && res.success) {
        invalidateMenuCache();
        revalidatePath('/menu');
        revalidatePath('/admin/menu');
        revalidatePath(`/admin/menu/categories/${categoryId}`);
        return { success: true };
      }
      if (res && res.error) {
        return { error: res.error };
      }
    } catch (err) {
      console.warn('[menu/actions] Convex updateCategoryDetails failed, trying Supabase:', err);
    }

    // 2. Supabase Fallback
    if (!isSupabaseConfigured()) {
      throw new Error('Failed to update category details in Convex and Supabase is not configured');
    }
    const supabase = await createClient();
    const db = sb(supabase);
    
    const { error } = await db.from('categories').update(payload).eq('id', categoryId);
    if (error) throw new Error(error.message);
    
    invalidateMenuCache();
    revalidatePath('/menu');
    revalidatePath('/admin/menu');
    revalidatePath(`/admin/menu/categories/${categoryId}`);
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to update category details' };
  }
}

export async function createCategory(payload: any) {
  try {
    const admin = await requireAdmin();
    const sessionToken = admin.sessionToken;

    // 1. Primary: Convex Mutation
    try {
      const res = await fetchMutation(api.menu.createCategory, {
        name: payload.name,
        slug: payload.slug,
        icon: payload.icon,
        sortOrder: payload.sort_order ?? payload.sortOrder,
        sessionToken,
      });
      if (res && res.success) {
        invalidateMenuCache();
        revalidatePath('/menu');
        revalidatePath('/admin/menu');
        return { success: true };
      }
      if (res && res.error) {
        return { error: res.error };
      }
    } catch (err) {
      console.warn('[menu/actions] Convex createCategory failed, trying Supabase:', err);
    }

    // 2. Supabase Fallback
    if (!isSupabaseConfigured()) {
      throw new Error('Failed to create category in Convex and Supabase is not configured');
    }
    const supabase = await createClient();
    const db = sb(supabase);
    const { data: restaurant } = await supabase.from('restaurants').select('id').limit(1).single() as { data: any };
    
    const { error } = await db.from('categories').insert({
      ...payload,
      restaurant_id: restaurant?.id
    });
    if (error) throw new Error(error.message);
    
    invalidateMenuCache();
    revalidatePath('/menu');
    revalidatePath('/admin/menu');
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to create category' };
  }
}
