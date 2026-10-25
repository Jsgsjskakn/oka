'use server';

import { fetchMutation } from 'convex/nextjs';
import { api } from '@/../convex/_generated/api';
import { createClient } from '@/lib/supabase/server';
import { sb } from '@/lib/supabase/typed';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { revalidatePath } from 'next/cache';

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
        revalidatePath('/menu');
        revalidatePath('/admin/menu');
        return { success: true };
      }
    } catch (err) {
      console.warn('[menu/actions] Convex toggleDishAvailability failed, trying Supabase:', err);
    }

    // 2. Supabase Fallback
    const db = sb(await createClient());
    const { error } = await db.from('dishes').update({ is_available: isAvailable }).eq('id', dishId);
    if (error) throw new Error(error.message);
    
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
        revalidatePath('/menu');
        revalidatePath('/admin/menu');
        return { success: true };
      }
    } catch (err) {
      console.warn('[menu/actions] Convex toggleDishFeatured failed, trying Supabase:', err);
    }

    // 2. Supabase Fallback
    const db = sb(await createClient());
    const { error } = await db.from('dishes').update({ is_featured: isFeatured }).eq('id', dishId);
    if (error) throw new Error(error.message);
    
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
        revalidatePath('/menu');
        revalidatePath('/admin/menu');
        return { success: true };
      }
    } catch (err) {
      console.warn('[menu/actions] Convex updateDishPrice failed, trying Supabase:', err);
    }

    // 2. Supabase Fallback
    const db = sb(await createClient());
    const { error } = await db.from('dishes').update({ price_paise: pricePaise }).eq('id', dishId);
    if (error) throw new Error(error.message);
    
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

    // 1. Primary: Convex Mutation
    try {
      const res = await fetchMutation(api.menu.updateFullDishDetails, {
        id: dishId,
        payload,
        sessionToken,
      });
      if (res && res.success) {
        revalidatePath('/menu');
        revalidatePath('/admin/menu');
        revalidatePath(`/admin/menu/dishes/${dishId}`);
        return { success: true };
      }
    } catch (err) {
      console.warn('[menu/actions] Convex updateFullDishDetails failed, trying Supabase:', err);
    }

    // 2. Supabase Fallback
    const supabase = await createClient();
    const db = sb(supabase);
    
    const { sizes, addOns, ...dishData } = payload;
    const { error: dishError } = await db.from('dishes').update(dishData).eq('id', dishId);
    if (dishError) throw new Error(dishError.message);
    
    await supabase.from('dish_sizes').delete().eq('dish_id', dishId);
    if (sizes && sizes.length > 0) {
      const { error: sizeError } = await supabase.from('dish_sizes').insert(
        sizes.map((s: any) => ({
          dish_id: dishId,
          name: s.name,
          price_modifier: s.price_modifier
        }))
      );
      if (sizeError) throw new Error(sizeError.message);
    }
    
    await supabase.from('dish_addons').delete().eq('dish_id', dishId);
    if (addOns && addOns.length > 0) {
      const { error: addonError } = await supabase.from('dish_addons').insert(
        addOns.map((a: any) => ({
          dish_id: dishId,
          name: a.name,
          price: a.price
        }))
      );
      if (addonError) throw new Error(addonError.message);
    }
    
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

    // 1. Primary: Convex Mutation
    try {
      const res = await fetchMutation(api.menu.updateCategoryDetails, {
        id: categoryId,
        payload,
        sessionToken,
      });
      if (res && res.success) {
        revalidatePath('/menu');
        revalidatePath('/admin/menu');
        revalidatePath(`/admin/menu/categories/${categoryId}`);
        return { success: true };
      }
    } catch (err) {
      console.warn('[menu/actions] Convex updateCategoryDetails failed, trying Supabase:', err);
    }

    // 2. Supabase Fallback
    const supabase = await createClient();
    const db = sb(supabase);
    
    const { error } = await db.from('categories').update(payload).eq('id', categoryId);
    if (error) throw new Error(error.message);
    
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
        sortOrder: payload.sort_order || payload.sortOrder,
        sessionToken,
      });
      if (res && res.success) {
        revalidatePath('/menu');
        revalidatePath('/admin/menu');
        return { success: true };
      }
    } catch (err) {
      console.warn('[menu/actions] Convex createCategory failed, trying Supabase:', err);
    }

    // 2. Supabase Fallback
    const supabase = await createClient();
    const db = sb(supabase);
    const { data: restaurant } = await supabase.from('restaurants').select('id').limit(1).single() as { data: any };
    
    const { error } = await db.from('categories').insert({
      ...payload,
      restaurant_id: restaurant?.id
    });
    if (error) throw new Error(error.message);
    
    revalidatePath('/menu');
    revalidatePath('/admin/menu');
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to create category' };
  }
}
