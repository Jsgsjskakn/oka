import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/convex-auth-actions';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getOrdersByPhone } from '@/lib/services/order.service';
import { getAllDishes } from '@/lib/services/menu.service';
import { resolveDishImageUrl } from '@/lib/utils/dish-images';
import type { DishWithCategory } from '@/lib/db/types';
import type { ExploredDishItem } from '@/store/recently-viewed-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {

    let user: { id: string; name: string; email: string; phone?: string; role?: string } | null = null;
    let isAuthenticated = false;

    // 1. Check Convex Session
    try {
      const convexUser = await getCurrentUser();
      if (convexUser) {
        user = {
          id: convexUser.userId || convexUser._id,
          name: convexUser.name || 'Valued Guest',
          email: convexUser.email || '',
          phone: convexUser.phone || '',
          role: convexUser.role || 'customer',
        };
        isAuthenticated = true;
      }
    } catch {
      // Convex unavailable
    }

    // 2. Check Supabase Session if not found
    if (!user && isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (sbUser) {
          const { data: profile } = (await supabase
            .from('profiles')
            .select('*')
            .eq('id', sbUser.id)
            .single()) as { data: any; error: any };

          user = {
            id: sbUser.id,
            name: profile?.name || sbUser.email?.split('@')[0] || 'Customer',
            email: sbUser.email || '',
            phone: profile?.phone || '',
            role: profile?.role || 'customer',
          };
          isAuthenticated = true;
        }
      } catch {
        // Supabase unavailable
      }
    }

    // 3. Do not expose hardcoded PII or query other customers' order history when unauthenticated
    if (!isAuthenticated || !user) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        user: null,
        pastDishes: [],
        lastOrderedDish: null,
        totalPastOrders: 0,
      });
    }

    // 4. Fetch orders for this authenticated customer only
    const allCatalogDishes = await getAllDishes();
    const dishMap = new Map<string, DishWithCategory>();
    for (const d of allCatalogDishes) {
      dishMap.set(d.id, d);
      dishMap.set(d.slug, d);
    }

    const rawOrders =
      user.phone || user.email
        ? await getOrdersByPhone(user.phone || '', user.email || undefined)
        : [];

    const pastDishesList: ExploredDishItem[] = [];
    const seenDishIds = new Set<string>();

    if (rawOrders && rawOrders.length > 0) {
      for (const order of rawOrders) {
        const items = (order as any).order_items || [];
        for (const item of items) {
          const dishId = item.dish_id;
          if (dishId && !seenDishIds.has(dishId)) {
            seenDishIds.add(dishId);
            const catalogDish = dishMap.get(dishId);
            if (catalogDish) {
              pastDishesList.push({
                ...catalogDish,
                category: (catalogDish.categories?.slug || 'pizza') as string,
                source: 'order_history',
                exploredAt: (order as any).created_at,
              });
            } else {
              pastDishesList.push({
                id: dishId,
                slug: dishId,
                name: item.dish_name || 'Artisanal Dish',
                price_paise: item.dish_price_paise || 49900,
                image_url: resolveDishImageUrl(dishId),
                category: 'pizza',
                is_veg: true,
                is_available: true,
                source: 'order_history',
                exploredAt: (order as any).created_at,
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user,
      pastDishes: pastDishesList,
      lastOrderedDish: pastDishesList[0] || null,
      totalPastOrders: rawOrders.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch customer history' },
      { status: 500 }
    );
  }
}
