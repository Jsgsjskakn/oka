import Link from 'next/link';
import { getOrderById } from '@/lib/services/order.service';
import { OrderConfirmationCard } from '@/components/checkout/OrderConfirmationCard';
import { OrderStatusSummary } from '@/components/checkout/OrderStatusSummary';
import { OrderSuccessClientFallback } from './OrderSuccessClientFallback';
import type { OrderStatus } from '@/types/order';
import type { StoredOrderDetails } from '@/store/order-store';

export const dynamic = 'force-dynamic';

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  if (!id) {
    return <OrderSuccessClientFallback />;
  }

  const order = await getOrderById(id);

  if (!order) {
    return <OrderSuccessClientFallback orderId={id} />;
  }

  const mappedStatus =
    order.status === 'pending' || order.status === 'confirmed'
      ? 'received'
      : order.status;

  const orderDetails: StoredOrderDetails = {
    id: order.id,
    orderType: order.order_type as 'dine-in' | 'takeaway',
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    customerEmail: order.customer_email || '',
    pickupTime: order.pickup_time || undefined,
    orderNotes: order.notes || undefined,
    paymentMethod: order.payment_method as 'upi' | 'cash',
    items: (order.order_items || []).map((item: any, idx: number) => ({
      cartItemId: item.id || `item-${idx}`,
      dish: {
        id: item.dish_id,
        slug: item.dish_id,
        name: item.dish_name,
        price: item.dish_price_paise / 100,
      } as any,
      size: item.size_name
        ? {
            id: item.size_name.toLowerCase(),
            name: item.size_name,
            priceModifier: (item.size_price_modifier_paise || 0) / 100,
          }
        : undefined,
      quantity: item.quantity,
    })),
    subtotal: order.subtotal_paise / 100,
    tax: order.tax_paise / 100,
    tip: (order.tip_paise || 0) / 100,
    total: order.total_paise / 100,
    status: mappedStatus as OrderStatus,
    estimatedPrepTime:
      order.order_type === 'takeaway' ? order.pickup_time || '30 min' : '25-30 mins',
    createdAt: order.created_at,
  };

  return (
    <div className="min-h-screen bg-obsidian text-text-primary pb-12">
      <OrderConfirmationCard order={orderDetails} />
      <OrderStatusSummary currentStatus={mappedStatus} orderId={orderDetails.id} />

      <div className="mt-2 px-4 max-w-md lg:max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
        <Link
          href="/profile/orders"
          className="flex-1 min-h-[48px] py-3 px-5 flex items-center justify-center text-sm font-semibold text-black bg-primary hover:brightness-110 rounded-xl transition-all"
        >
          Track in Order History
        </Link>
        <Link
          href="/menu"
          className="flex-1 min-h-[48px] py-3 px-5 flex items-center justify-center text-sm font-medium text-text-primary/80 hover:text-text-primary border border-border-subtle rounded-xl bg-[#1a1a1a] hover:bg-white/5 transition-colors"
        >
          Return to Menu
        </Link>
      </div>
    </div>
  );
}
