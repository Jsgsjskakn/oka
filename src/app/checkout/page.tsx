'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useOrderStore } from '@/store/order-store';
import { useRecentlyViewedStore } from '@/store/recently-viewed-store';
import { toast } from '@/store/toast-store';
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader';
import { OrderTypeSelector } from '@/components/checkout/OrderTypeSelector';
import { PickupTimeChips } from '@/components/checkout/PickupTimeChips';
import { DeliveryAddressCard } from '@/components/checkout/DeliveryAddressCard';
import { CustomerCheckoutForm } from '@/components/checkout/CustomerCheckoutForm';
import { DiningSummaryCard } from '@/components/checkout/DiningSummaryCard';
import { OrderNotesField } from '@/components/checkout/OrderNotesField';
import { PromoCodeSection } from '@/components/checkout/PromoCodeSection';
import { PriceBreakdownCard } from '@/components/checkout/PriceBreakdownCard';
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector';
import { PlaceOrderButton } from '@/components/checkout/PlaceOrderButton';
import type { OrderType, PaymentMethod } from '@/types/order';

function normalizeIndianPhone(raw?: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length > 10 && digits.startsWith('91')) {
    return digits.slice(-10);
  }
  return digits.slice(0, 10);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, diningMode, tableNumber: storedTableNumber, setTableNumber: setStoredTableNumber, getTotalPrice, clearCart } =
    useCartStore();
  const placeOrder = useOrderStore((state) => state.placeOrder);

  const [orderType, setOrderType] = useState<OrderType>(() =>
    diningMode === 'takeaway' ? 'takeaway' : 'dine-in'
  );
  const [pickupTime, setPickupTime] = useState<string | null>(() =>
    diningMode === 'takeaway' ? '30 min' : null
  );
  const [tableNumberInput, setTableNumberInput] = useState<string>(storedTableNumber || '');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryLandmark, setDeliveryLandmark] = useState<string>('');
  const [deliveryPincode, setDeliveryPincode] = useState<string>('');
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPaise: number;
    description: string;
  } | null>(null);
  const [details, setDetails] = useState({ name: '', phone: '', email: '' });
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    tableNumber?: string;
    deliveryAddress?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const orderSuccessRef = useRef(false);
  const [idempotencyKey] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'idemp-' + Date.now()
  );
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [taxRate, setTaxRate] = useState(0.05);
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [tipPresets, setTipPresets] = useState<number[]>([10, 15, 20]);

  useEffect(() => {
    setIsMounted(true);
    let cancelled = false;

    fetch('/api/settings')
      .then((r) => r.json())
      .then((s) => {
        if (cancelled) return;
        if (s.tax_rate_percent) setTaxRate(Number(s.tax_rate_percent) / 100);
        if (s.tip_presets_percent && Array.isArray(s.tip_presets_percent)) {
          setTipPresets(s.tip_presets_percent);
        }
      })
      .catch(() => {});

    // Mandatory Customer Authentication for Checkout & Payment
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.authenticated && data.user) {
          const cleanPhone = normalizeIndianPhone(data.user.phone);
          setDetails((prev) => ({
            name: prev.name || data.user.name || '',
            email: prev.email || data.user.email || '',
            phone: prev.phone || cleanPhone,
          }));
          setIsAuthChecking(false);
        } else {
          router.replace('/auth/login?redirectTo=/checkout');
        }
      })
      .catch(() => {
        if (!cancelled) {
          router.replace('/auth/login?redirectTo=/checkout');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (isMounted && storedTableNumber && !tableNumberInput) {
      setTableNumberInput(storedTableNumber);
    }
  }, [isMounted, storedTableNumber, tableNumberInput]);

  useEffect(() => {
    if (isMounted && !orderSuccessRef.current && items.length === 0) {
      router.replace('/cart');
    }
  }, [isMounted, items.length, router]);

  const subtotal = getTotalPrice();
  const subtotalPaise = Math.round(subtotal * 100);
  const discountPaise = appliedPromo ? Math.min(subtotalPaise, appliedPromo.discountPaise) : 0;
  const effectiveSubtotalPaise = Math.max(0, subtotalPaise - discountPaise);
  const taxPaise = Math.round(effectiveSubtotalPaise * taxRate);
  const tipPaise = Math.round((effectiveSubtotalPaise * tipPercent) / 100);
  const totalPaise = effectiveSubtotalPaise + taxPaise + tipPaise;

  const discount = discountPaise / 100;
  const tax = taxPaise / 100;
  const tipAmount = tipPaise / 100;
  const total = totalPaise / 100;

  const handleOrderTypeChange = (type: OrderType) => {
    setOrderType(type);
    if (type === 'takeaway' && !pickupTime) {
      setPickupTime('30 min');
    }
    setErrors((prev) => ({
      ...prev,
      tableNumber: type === 'dine-in' ? prev.tableNumber : undefined,
      deliveryAddress: type === 'delivery' ? prev.deliveryAddress : undefined,
    }));
  };

  const handleTableNumberChange = (value: string) => {
    setTableNumberInput(value);
    setStoredTableNumber(value);
    if (errors.tableNumber) {
      setErrors((prev) => ({ ...prev, tableNumber: undefined }));
    }
  };

  const validate = () => {
    const newErrors: {
      name?: string;
      phone?: string;
      email?: string;
      tableNumber?: string;
      deliveryAddress?: string;
    } = {};
    const trimmedName = details.name.trim();
    const cleanPhone = details.phone.replace(/\D/g, '');
    const trimmedEmail = details.email.trim();

    if (trimmedName.length < 2) {
      newErrors.name = 'Please enter your full name (at least 2 characters)';
    }
    if (!/^\d{10}$/.test(cleanPhone)) {
      newErrors.phone = 'Valid 10-digit mobile number required';
    }
    if (!trimmedEmail) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (orderType === 'dine-in' && tableNumberInput.trim() !== '') {
      const parsedTable = Number(tableNumberInput.trim());
      if (!Number.isInteger(parsedTable) || parsedTable < 1 || parsedTable > 30) {
        newErrors.tableNumber = 'Table number must be between 1 and 30';
      }
    }
    if (orderType === 'delivery') {
      if (deliveryAddress.trim().length < 5) {
        newErrors.deliveryAddress = 'Please enter complete delivery address (at least 5 characters)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (isSubmittingRef.current) return;
    setSubmitError(null);
    if (!validate()) {
      toast.error('Check Form Details', 'Please fix the highlighted checkout fields.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json().catch(() => ({ authenticated: false }));
      if (!authData.authenticated) {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        router.push('/auth/login?redirectTo=/checkout');
        return;
      }

      const parsedTable =
        orderType === 'dine-in' && tableNumberInput.trim() !== ''
          ? Number(tableNumberInput.trim())
          : undefined;
      const fullDeliveryAddress =
        orderType === 'delivery'
          ? [
              deliveryAddress.trim(),
              deliveryLandmark.trim() ? `Near ${deliveryLandmark.trim()}` : '',
              deliveryPincode.trim() ? `PIN: ${deliveryPincode.trim()}` : '',
              deliveryInstructions.trim() ? `Note: ${deliveryInstructions.trim()}` : '',
            ]
              .filter(Boolean)
              .join(', ')
          : undefined;

      const finalPickupTime =
        orderType === 'takeaway'
          ? pickupTime || '30 min'
          : orderType === 'delivery'
          ? '35-45 min'
          : undefined;
      const trimmedNotes = orderNotes.trim();
      const combinedNotes =
        orderType === 'dine-in' && diningMode === 'pre-order'
          ? ['[Pre-Order with Reservation]', trimmedNotes].filter(Boolean).join(' · ')
          : trimmedNotes || undefined;

      const cleanPhone = details.phone.replace(/\D/g, '');
      const cleanName = details.name.trim();
      const cleanEmail = details.email.trim();

      const orderItemsPayload = items.map((item) => ({
        dishId: item.dish.id || item.dish.slug,
        dishName: item.dish.name,
        dishPricePaise: Math.round(item.dish.price * 100),
        quantity: item.quantity,
        sizeName: item.size?.name,
        sizePriceModifierPaise: item.size ? Math.round(item.size.priceModifier * 100) : 0,
        specialInstructions: item.specialInstructions,
        addons: item.selectedAddOns?.map((a) => ({
          name: a.name,
          pricePaise: Math.round(a.price * 100),
        })),
        removedIngredients: item.removedIngredients,
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: cleanName,
          customerPhone: cleanPhone,
          customerEmail: cleanEmail,
          orderType,
          tableNumber: parsedTable,
          deliveryAddress: fullDeliveryAddress,
          paymentMethod,
          pickupTime: finalPickupTime,
          notes: combinedNotes,
          promoCode: appliedPromo?.code,
          discountPaise: discountPaise > 0 ? discountPaise : undefined,
          items: orderItemsPayload,
          subtotalPaise,
          taxPaise,
          tipPaise,
          totalPaise,
          idempotencyKey,
        }),
      });

      const result = await response.json().catch(() => ({
        error: 'Unable to parse server response. Please try again.',
      }));

      if (!response.ok || result.error || !result.orderId) {
        const errMsg = result.error || 'Failed to place order. Please try again.';
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        if (errMsg === 'AUTH_REQUIRED' || response.status === 401) {
          router.push('/auth/login?redirectTo=/checkout');
          return;
        }
        setSubmitError(errMsg);
        toast.error('Order Failed', errMsg);
        return;
      }

      placeOrder({
        id: result.orderId,
        orderType,
        tableNumber: parsedTable,
        deliveryAddress: fullDeliveryAddress,
        promoCode: appliedPromo?.code,
        discount,
        customerName: cleanName,
        customerPhone: cleanPhone,
        customerEmail: cleanEmail,
        pickupTime: finalPickupTime,
        orderNotes: combinedNotes,
        paymentMethod,
        items: [...items],
        subtotal,
        tax,
        tip: tipAmount,
        total,
      });

      // Link newly ordered dishes to customer past history
      try {
        const addRecent = useRecentlyViewedStore.getState().addRecentDish;
        items.forEach((item) => {
          if (item?.dish) {
            addRecent(
              {
                id: item.dish.id,
                slug: item.dish.slug,
                name: item.dish.name,
                description: item.dish.description,
                price_paise: Math.round(item.dish.price * 100),
                image_url: item.dish.image,
                category: item.dish.category,
                is_veg: item.dish.isVeg,
                is_available: true,
                is_featured: item.dish.isFeatured,
                is_best_seller: item.dish.isBestSeller,
                spice_level: item.dish.spiceLevel,
                has_3d_model: item.dish.has3DModel,
              },
              'order_history'
            );
          }
        });
      } catch (e) {
        console.warn('Could not record ordered dishes in history store:', e);
      }

      orderSuccessRef.current = true;
      clearCart();
      router.push(`/order/success?id=${encodeURIComponent(result.orderId)}`);
    } catch (err) {
      console.error('Order placement error:', err);
      const fallbackMsg =
        err instanceof Error && err.message
          ? err.message
          : 'Network error while submitting your order. Please try again.';
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setSubmitError(fallbackMsg);
      toast.error('Order Failed', fallbackMsg);
    }
  };

  if (!isMounted || isAuthChecking || items.length === 0) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-text-primary pb-36">
      <CheckoutHeader />

      <div className="max-w-md lg:max-w-5xl mx-auto w-full lg:px-6 lg:pt-6">
        {submitError && (
          <div
            role="alert"
            className="mx-4 lg:mx-0 mt-4 lg:mt-0 lg:mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-100">Unable to Complete Order</p>
              <p className="mt-0.5 text-rose-200/85">{submitError}</p>
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
          {/* Left Column: Dining Mode, Guest Info & Kitchen Notes */}
          <div className="lg:col-span-7 lg:rounded-2xl lg:border lg:border-white/5 lg:bg-[#111]/60 lg:overflow-hidden">
            <OrderTypeSelector selected={orderType} onSelect={handleOrderTypeChange} />

            {orderType === 'dine-in' ? (
              <DiningSummaryCard
                tableNumber={tableNumberInput}
                onTableNumberChange={handleTableNumberChange}
                error={errors.tableNumber}
                isPreOrder={diningMode === 'pre-order'}
              />
            ) : orderType === 'takeaway' ? (
              <PickupTimeChips
                selectedTime={pickupTime}
                onSelect={(time) => setPickupTime(time)}
              />
            ) : (
              <DeliveryAddressCard
                address={deliveryAddress}
                landmark={deliveryLandmark}
                pincode={deliveryPincode}
                instructions={deliveryInstructions}
                onAddressChange={setDeliveryAddress}
                onLandmarkChange={setDeliveryLandmark}
                onPincodeChange={setDeliveryPincode}
                onInstructionsChange={setDeliveryInstructions}
                error={errors.deliveryAddress}
              />
            )}

            <CustomerCheckoutForm details={details} onChange={setDetails} errors={errors} />

            <OrderNotesField value={orderNotes} onChange={setOrderNotes} />
          </div>

          {/* Right Column: Promo Code, Price Summary, Tip & Payment */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 lg:rounded-2xl lg:border lg:border-white/5 lg:bg-[#111]/60 lg:overflow-hidden">
            <PromoCodeSection
              subtotal={subtotal}
              appliedPromo={appliedPromo}
              onApplyPromo={setAppliedPromo}
              onRemovePromo={() => setAppliedPromo(null)}
            />

            <PriceBreakdownCard
              subtotal={subtotal}
              taxRate={taxRate}
              tip={tipAmount}
              discount={discount}
              promoCode={appliedPromo?.code}
            />

            <div className="px-4 py-6 border-b border-white/5">
              <h3 className="font-heading text-sm font-bold mb-4">Add a Tip</h3>
              <div className="grid grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTipPercent(0)}
                  aria-pressed={tipPercent === 0}
                  className={`min-h-[48px] py-2.5 px-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors touch-manipulation cursor-pointer ${
                    tipPercent === 0
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border-subtle bg-[#1a1a1a] text-text-primary/60 hover:bg-white/5'
                  }`}
                >
                  No Tip
                </button>
                {tipPresets.map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setTipPercent(preset)}
                    aria-pressed={tipPercent === preset}
                    className={`min-h-[48px] py-2.5 px-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors touch-manipulation cursor-pointer ${
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

            <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />
          </div>
        </div>
      </div>

      <PlaceOrderButton
        disabled={false}
        isLoading={isSubmitting}
        total={total}
        onClick={handlePlaceOrder}
      />
    </div>
  );
}
