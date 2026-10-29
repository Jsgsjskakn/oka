import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/convex-auth-actions';
import { createClient } from '@/lib/supabase/server';
import { getOrdersByPhone } from '@/lib/services/order.service';
import { getAllDishes } from '@/lib/services/menu.service';
import { mockOrders } from '@/data/mock-orders';
import type { DishWithCategory } from '@/lib/db/types';
import type { ExploredDishItem } from '@/store/recently-viewed-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryPhone = searchParams.get('phone');
    const queryEmail = searchParams.get('email');

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
    if (!user) {
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

    // 3. Fallback Member Profile for seamless demo/preview if unauthenticated
    const effectivePhone = user?.phone || queryPhone || '+91 98765 43210';
    const effectiveEmail = user?.email || queryEmail || 'pyiush.999@gmail.com';

    if (!user) {
      user = {
        id: 'member-pg',
        name: 'Pyiush Gupta',
        email: effectiveEmail,
        phone: effectivePhone,
        role: 'customer',
      };
    }

    // 4. Fetch orders for this customer from database / service
    const allCatalogDishes = await getAllDishes();
    const dishMap = new Map<string, DishWithCategory>();
    for (const d of allCatalogDishes) {
      dishMap.set(d.id, d);
      dishMap.set(d.slug, d);
    }

    let rawOrders = await getOrdersByPhone(effectivePhone, effectiveEmail);

    // Fallback to mockOrders if no orders in database yet
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
                image_url: '/images/dishes/placeholder.jpg',
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

    // If still empty, populate from mockOrders
    if (pastDishesList.length === 0) {
      for (const mo of mockOrders) {
        for (const item of mo.items) {
          const d = item.dish;
          if (!seenDishIds.has(d.id)) {
            seenDishIds.add(d.id);
            const catalogDish = dishMap.get(d.id) || dishMap.get(d.slug);
            if (catalogDish) {
              pastDishesList.push({
                ...catalogDish,
                category: (catalogDish.categories?.slug || 'pizza') as string,
                source: 'order_history',
                exploredAt: mo.createdAt,
              });
            } else {
              pastDishesList.push({
                id: d.id,
                slug: d.slug,
                name: d.name,
                description: d.description,
                price_paise: Math.round(d.price * 100),
                image_url: d.image,
                category: (d.category as string) || 'pizza',
                is_veg: d.isVeg,
                is_available: true,
                source: 'order_history',
                exploredAt: mo.createdAt,
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      authenticated: isAuthenticated,
      user,
      pastDishes: pastDishesList,
      lastOrderedDish: pastDishesList[0] || null,
      totalPastOrders: rawOrders.length || mockOrders.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch customer history' },
      { status: 500 }
    );
  }
}
