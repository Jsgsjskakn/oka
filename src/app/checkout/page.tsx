'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart-store';
import { useOrderStore } from '@/store/order-store';
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader';
import { OrderTypeSelector } from '@/components/checkout/OrderTypeSelector';
import { PickupTimeChips } from '@/components/checkout/PickupTimeChips';
import { CustomerCheckoutForm } from '@/components/checkout/CustomerCheckoutForm';
import { DiningSummaryCard } from '@/components/checkout/DiningSummaryCard';
import { OrderNotesField } from '@/components/checkout/OrderNotesField';
import { PriceBreakdownCard } from '@/components/checkout/PriceBreakdownCard';
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector';
import { PlaceOrderButton } from '@/components/checkout/PlaceOrderButton';
import type { OrderType, PaymentMethod } from '@/types/order';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const placeOrder = useOrderStore((state) => state.placeOrder);

  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [pickupTime, setPickupTime] = useState<string | null>(null);
  const [details, setDetails] = useState({ name: '', phone: '', email: '' });
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const orderSuccessRef = useRef(false);
  const [idempotencyKey] = useState(() => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'idemp-' + Date.now()));
  const [isMounted, setIsMounted] = useState(false);

  const [taxRate, setTaxRate] = useState(0.05);
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [tipPresets, setTipPresets] = useState<number[]>([10, 15, 20]);

  useEffect(() => {
    setIsMounted(true);
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s.tax_rate_percent) setTaxRate(Number(s.tax_rate_percent) / 100);
      if (s.tip_presets_percent && Array.isArray(s.tip_presets_percent)) {
        setTipPresets(s.tip_presets_percent);
      }
    }).catch(() => {});

    // Check user & prefill details from Convex (primary) or Supabase (fallback)
    import('@/lib/auth/convex-auth-actions').then(({ getCurrentUser }) => {
      getCurrentUser().then(user => {
        if (user) {
          setDetails(prev => ({
            name: prev.name || user.name || '',
            email: prev.email || user.email || '',
            phone: prev.phone || user.phone || '',
          }));
        } else {
          import('@/lib/supabase/client').then(({ createClient }) => {
            const supabase = createClient();
            supabase.auth.getUser().then(({ data: { user: sbUser } }) => {
              if (sbUser) {
                setDetails(prev => ({
                  name: prev.name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || '',
                  email: prev.email || sbUser.email || '',
                  phone: prev.phone || sbUser.user_metadata?.phone || '',
                }));
              }
            }).catch(() => {});
          }).catch(() => {});
        }
      }).catch(() => {});
    });
  }, []);

  useEffect(() => {
    if (isMounted && !orderSuccessRef.current && items.length === 0) {
      router.replace('/cart');
    }
  }, [isMounted, items.length, router]);

  const subtotal = getTotalPrice();
  const tax = Math.round(subtotal * taxRate);
  const tipAmount = Math.round(subtotal * tipPercent / 100);
  const total = subtotal + tax + tipAmount;

  const validate = () => {
    const newErrors: { name?: string; phone?: string; email?: string } = {};
    if (!details.name.trim()) newErrors.name = 'Name is required';
    if (!details.phone || details.phone.length < 10) newErrors.phone = 'Valid 10-digit phone required';
    if (!details.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      newErrors.email = 'Enter a valid email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (isSubmittingRef.current) return;
    if (!validate()) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      let isAuthenticated = false;
      const { getCurrentUser } = await import('@/lib/auth/convex-auth-actions');
      const convexUser = await getCurrentUser();
      if (convexUser) {
        isAuthenticated = true;
      } else {
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session) isAuthenticated = true;
        } catch {
          // ignore
        }
      }
      
      if (!isAuthenticated) {
        setIsSubmitting(false);
        router.push(`/auth/login?returnUrl=${encodeURIComponent('/checkout')}`);
        return;
      }

      const { placeOrderAction } = await import('@/lib/actions/order-actions');

      const orderItemsPayload = items.map(item => ({
        dishId: item.dish.id,
        dishName: item.dish.name,
        dishPricePaise: Math.round(item.dish.price * 100),
        quantity: item.quantity,
        sizeName: item.size?.name,
        sizePriceModifierPaise: item.size ? Math.round(item.size.priceModifier * 100) : 0,
        specialInstructions: item.specialInstructions,
        addons: item.selectedAddOns?.map(a => ({ name: a.name, pricePaise: Math.round(a.price * 100) })),
        removedIngredients: item.removedIngredients,
      }));

      const result = await placeOrderAction({
        customerName: details.name,
        customerPhone: details.phone,
        customerEmail: details.email,
        orderType,
        paymentMethod,
        pickupTime: orderType === 'takeaway' ? (pickupTime || '30 min') : undefined,
        notes: orderNotes,
        items: orderItemsPayload,
        subtotalPaise: Math.round(subtotal * 100),
        taxPaise: Math.round(tax * 100),
        tipPaise: Math.round(tipAmount * 100),
        totalPaise: Math.round(total * 100),
        idempotencyKey,
      });

      if (result.error) {
        console.error('Order failed:', result.error);
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        if (result.error === 'AUTH_REQUIRED') {
          router.push(`/auth/login?returnUrl=${encodeURIComponent('/checkout')}`);
        } else {
          alert(result.error);
        }
        return;
      }

      placeOrder({
        orderType,
        customerName: details.name,
        customerPhone: details.phone,
        customerEmail: details.email,
        pickupTime: orderType === 'takeaway' ? (pickupTime || '30 min') : undefined,
        orderNotes,
        paymentMethod,
        items: [...items],
        subtotal,
        tax,
        total,
      });

      orderSuccessRef.current = true;
      clearCart();
      router.push(`/order/success?id=${result.orderId}`);
    } catch (err) {
      console.error('Order placement error:', err);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (!isMounted || items.length === 0) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-text-primary pb-4">
      <CheckoutHeader />

      <div className="max-w-md mx-auto w-full">
        <OrderTypeSelector selected={orderType} onSelect={setOrderType} />

        {orderType === 'dine-in' ? (
          <DiningSummaryCard />
        ) : (
          <PickupTimeChips selectedTime={pickupTime} onSelect={setPickupTime} />
        )}

        <CustomerCheckoutForm details={details} onChange={setDetails} errors={errors} />

        <OrderNotesField value={orderNotes} onChange={setOrderNotes} />

        <PriceBreakdownCard subtotal={subtotal} taxRate={taxRate} tip={tipAmount} />

        <div className="px-4 py-6 border-b border-white/5">
          <h3 className="font-heading text-sm font-bold mb-4">Add a Tip</h3>
          <div className="flex gap-3 mb-2">
            <button
              onClick={() => setTipPercent(0)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                tipPercent === 0 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border-subtle bg-[#1a1a1a] text-text-primary/60 hover:bg-white/5'
              }`}
            >
              No Tip
            </button>
            {tipPresets.map(preset => (
              <button
                key={preset}
                onClick={() => setTipPercent(preset)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  tipPercent === preset 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border-subtle bg-[#1a1a1a] text-text-primary/60 hover:bg-white/5'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>

        <div className="pb-24">
          <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />
        </div>
      </div>

      <PlaceOrderButton
        disabled={!details.name || !details.phone || !details.email}
        isLoading={isSubmitting}
        total={total}
        onClick={handlePlaceOrder}
      />
    </div>
  );
}
