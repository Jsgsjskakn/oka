import { getOrderById } from '@/lib/services/order.service';
import { redirect } from 'next/navigation';
import { OrderConfirmationCard } from '@/components/checkout/OrderConfirmationCard';
import { OrderStatusSummary } from '@/components/checkout/OrderStatusSummary';
import Link from 'next/link';
import type { OrderDetails, OrderStatus } from '@/types/order';

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  if (!id) {
    return (
      <div className="min-h-screen bg-obsidian text-text-primary flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Order Not Found</h1>
          <Link href="/" className="text-primary hover:underline">Return to Home</Link>
        </div>
      </div>
    );
  }

  const order = await getOrderById(id);

  if (!order) {
    redirect('/');
  }

  const orderDetails: OrderDetails = {
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
      dish: { id: item.dish_id, name: item.dish_name, price: item.dish_price_paise / 100 } as any,
      quantity: item.quantity
    })),
    subtotal: order.subtotal_paise / 100,
    tax: order.tax_paise / 100,
    total: order.total_paise / 100,
    status: (order.status === 'pending' || order.status === 'confirmed' ? 'received' : order.status) as OrderStatus,
    estimatedPrepTime: order.order_type === 'takeaway' ? (order.pickup_time || '30 min') : '25-30 mins',
    createdAt: order.created_at
  };

  return (
    <div className="min-h-screen bg-obsidian text-text-primary pb-8">
      <OrderConfirmationCard order={orderDetails} />
      <OrderStatusSummary currentStatus={orderDetails.status} orderId={orderDetails.id} />

      <div className="mt-4 text-center px-6">
        <Link 
          href="/"
          className="inline-block w-full max-w-md py-3 text-center text-sm font-medium text-text-secondary hover:text-text-primary border border-border-subtle rounded-xl bg-card-bg/50 transition-colors"
        >
          Return to Menu
        </Link>
      </div>
    </div>
  );
}
