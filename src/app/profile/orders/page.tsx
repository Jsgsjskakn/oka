import { getCurrentUser } from '@/lib/auth/convex-auth-actions';
import { getOrdersByPhone } from '@/lib/services/order.service';
import { OrdersListClient } from './OrdersListClient';
import { EmptyState } from '@/components/shared/EmptyState';
import { ChevronLeft, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import type { OrderDetails, OrderStatus } from '@/types/order';
import type { OrderWithItems } from '@/lib/db/types';

function mapOrderToOrderDetails(order: OrderWithItems): OrderDetails {
  let uiStatus: OrderStatus = 'received';
  if (order.status === 'preparing') {
    uiStatus = 'preparing';
  } else if (order.status === 'ready' || order.status === 'completed') {
    uiStatus = 'ready';
  }

  return {
    id: order.id,
    orderType: order.order_type as 'dine-in' | 'takeaway',
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    customerEmail: order.customer_email || '',
    pickupTime: order.pickup_time || undefined,
    orderNotes: order.notes || undefined,
    paymentMethod: (order.payment_method || 'upi') as 'upi' | 'cash',
    items: (order.order_items || []).map((item, idx) => ({
      cartItemId: item.id || `item-${idx}`,
      dish: {
        id: item.dish_id,
        slug: item.dish_id,
        name: item.dish_name,
        price: item.dish_price_paise / 100,
        image: '/images/dishes/placeholder.jpg',
        category: 'starters',
        isVeg: true,
        isAvailable: true,
        isFeatured: false,
        isBestSeller: false,
        spiceLevel: 'medium' as const,
        has3DModel: false,
        description: '',
      },
      quantity: item.quantity,
      size: item.size_name
        ? {
            id: item.size_name.toLowerCase(),
            name: item.size_name,
            priceModifier: (item.size_price_modifier_paise || 0) / 100,
          }
        : undefined,
      selectedAddOns: item.order_item_customizations?.map((a) => ({
        id: a.name.toLowerCase().replace(/\s+/g, '-'),
        name: a.name,
        price: a.price_paise / 100,
      })),
      specialInstructions: item.special_instructions || undefined,
    })),
    subtotal: order.subtotal_paise / 100,
    tax: order.tax_paise / 100,
    total: order.total_paise / 100,
    status: uiStatus,
    estimatedPrepTime: order.order_type === 'takeaway' ? (order.pickup_time || '30 mins') : '25-35 mins',
    createdAt: order.created_at,
  };
}

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-obsidian text-text-primary pb-24">
        <div className="px-4 py-5 flex items-center gap-3 border-b border-white/5 sticky top-0 bg-obsidian z-40">
          <Link
            href="/profile"
            className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-heading text-lg font-bold">My Orders</h1>
        </div>
        <div className="px-4 py-8">
          <EmptyState
            icon={<ShoppingBag className="w-7 h-7 text-text-primary/30" />}
            title="No Orders Found"
            description="Please sign in to view your order history and track active orders."
            actionLabel="Sign In"
            actionHref="/auth/login?redirectTo=/profile/orders"
          />
        </div>
      </div>
    );
  }

  const rawOrders = (user.phone || user.email) ? await getOrdersByPhone(user.phone, user.email) : [];
  const orders: OrderDetails[] = rawOrders.map(mapOrderToOrderDetails);

  return <OrdersListClient initialOrders={orders} />;
}
