import { getOrderById } from '@/lib/services/order.service';
import { dishes } from '@/data/mock-menu';
import { format, parseISO } from 'date-fns';
import { ChevronLeft } from 'lucide-react';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { ReorderButton } from './ReorderButton';
import Link from 'next/link';
import type { OrderStatus } from '@/types/order';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const rawOrder = await getOrderById(orderId);

  if (!rawOrder) {
    return (
      <div className="min-h-screen bg-obsidian text-text-primary flex flex-col items-center justify-center px-8">
        <p className="text-lg font-semibold mb-2">Order Not Found</p>
        <p className="text-sm text-text-primary/40 mb-6">This order could not be found.</p>
        <Link href="/profile/orders" className="text-primary text-sm font-medium">
          Go Back
        </Link>
      </div>
    );
  }

  let uiStatus: OrderStatus = 'received';
  if (rawOrder.status === 'preparing') {
    uiStatus = 'preparing';
  } else if (rawOrder.status === 'ready' || rawOrder.status === 'completed') {
    uiStatus = 'ready';
  }

  const items = (rawOrder.order_items || []).map((item, idx) => {
    const matchedDish = dishes.find((d) => d.id === item.dish_id || d.slug === item.dish_id);
    const dish = matchedDish || {
      id: item.dish_id,
      slug: item.dish_id,
      name: item.dish_name,
      description: '',
      price: item.dish_price_paise / 100,
      image: '/images/dishes/placeholder.jpg',
      category: 'starters',
      isVeg: true,
      isAvailable: true,
      isFeatured: false,
      isBestSeller: false,
      spiceLevel: 'medium' as const,
      has3DModel: false,
    };

    const size = item.size_name
      ? {
          id: item.size_name.toLowerCase(),
          name: item.size_name,
          priceModifier: (item.size_price_modifier_paise || 0) / 100,
        }
      : undefined;

    const selectedAddOns = item.order_item_customizations?.map((a) => ({
      id: a.name.toLowerCase().replace(/\s+/g, '-'),
      name: a.name,
      price: a.price_paise / 100,
    }));

    return {
      cartItemId: item.id || `item-${idx}`,
      dish,
      quantity: item.quantity,
      size,
      selectedAddOns,
      specialInstructions: item.special_instructions || undefined,
      lineTotalRupees: item.line_total_paise / 100,
    };
  });

  const subtotalRupees = rawOrder.subtotal_paise / 100;
  const taxRupees = rawOrder.tax_paise / 100;
  const totalRupees = rawOrder.total_paise / 100;

  return (
    <div className="min-h-screen bg-obsidian text-text-primary pb-8">
      <div className="px-4 py-5 flex items-center gap-3 border-b border-white/5 sticky top-0 bg-obsidian z-40">
        <Link
          href="/profile/orders"
          className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <h1 className="font-heading text-lg font-bold">{rawOrder.id}</h1>
          <p className="text-[10px] text-text-primary/40">
            {format(parseISO(rawOrder.created_at), 'MMM d, yyyy · h:mm a')}
          </p>
        </div>
        <OrderStatusBadge status={uiStatus} />
      </div>

      <div className="max-w-md mx-auto w-full">
        {/* Order Type */}
        <div className="px-4 py-5 border-b border-white/5">
          <p className="text-[10px] text-text-primary/40 uppercase tracking-widest mb-1">Order Type</p>
          <p className="text-sm text-text-primary font-medium capitalize">
            {rawOrder.order_type === 'dine-in' ? 'Dine In' : 'Takeaway'}
          </p>
        </div>

        {/* Items */}
        <div className="px-4 py-5 border-b border-white/5">
          <p className="text-[10px] text-text-primary/40 uppercase tracking-widest mb-4">Items Ordered</p>
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.cartItemId}
                className="flex items-start justify-between gap-3 bg-[#111] rounded-xl p-3 border border-white/5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-medium">{item.dish.name}</p>
                  {item.size && (
                    <p className="text-[10px] text-text-primary/40 mt-0.5">Size: {item.size.name}</p>
                  )}
                  {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                    <p className="text-[10px] text-text-primary/40">
                      Add-ons: {item.selectedAddOns.map((a) => a.name).join(', ')}
                    </p>
                  )}
                  <p className="text-[10px] text-text-primary/30 mt-1">Qty: {item.quantity}</p>
                </div>
                <span className="text-sm text-primary font-medium shrink-0">
                  ₹{item.lineTotalRupees}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Price Summary */}
        <div className="px-4 py-5 border-b border-white/5">
          <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm text-text-primary/70">
              <span>Subtotal</span>
              <span>₹{subtotalRupees}</span>
            </div>
            <div className="flex justify-between text-sm text-text-primary/70">
              <span>Tax</span>
              <span>₹{taxRupees}</span>
            </div>
            <div className="border-t border-border-subtle pt-3 flex justify-between">
              <span className="text-sm font-semibold text-text-primary">Total</span>
              <span className="text-base font-bold text-primary">₹{totalRupees}</span>
            </div>
          </div>
        </div>

        {/* Reorder Button */}
        <div className="px-4 py-6">
          <ReorderButton items={items} />
        </div>
      </div>
    </div>
  );
}
