'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  ArrowRight,
  Sparkles,
  UtensilsCrossed,
  Plus,
  Clock,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { CartSummary } from '@/components/cart/CartSummary';
import { resolveDishImageUrl } from '@/lib/utils/dish-images';
import { toast } from '@/store/toast-store';

import type { Dish } from '@/types/menu';

type DiningMode = 'dine-in' | 'pre-order' | 'takeaway';

const PAIRING_SUGGESTIONS: Dish[] = [
  {
    id: 'dynamite-chilli-potatoes',
    slug: 'dynamite-chilli-potatoes',
    name: 'Dynamite Chilli Potatoes',
    description: 'Crisp hand-cut potatoes wok-tossed in fiery chili glaze & spring greens.',
    price: 279,
    image: resolveDishImageUrl('dynamite-chilli-potatoes'),
    category: 'starters',
    isVeg: true,
    isAvailable: true,
    isFeatured: true,
    isBestSeller: true,
    spiceLevel: 'hot',
    ingredients: [],
    allergens: [],
    sizes: [],
    addOns: [],
    removableIngredients: [],
    has3DModel: true,
  },
  {
    id: 'peri-peri-fiesta-pizza',
    slug: 'peri-peri-fiesta-pizza',
    name: 'Peri Peri Fiesta Pizza',
    description: 'Charred wood-fired crust with spicy peri-peri drizzle, corn & charred peppers.',
    price: 429,
    image: resolveDishImageUrl('peri-peri-fiesta-pizza'),
    category: 'pizza',
    isVeg: true,
    isAvailable: true,
    isFeatured: false,
    isBestSeller: false,
    spiceLevel: 'medium',
    ingredients: [],
    allergens: [],
    sizes: [],
    addOns: [],
    removableIngredients: [],
    has3DModel: true,
  },
];

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems, addItem } =
    useCartStore();
  const [taxRate, setTaxRate] = useState(0.05);
  const [isMounted, setIsMounted] = useState(false);
  const [diningMode, setDiningMode] = useState<DiningMode>('dine-in');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((s) => {
        if (s.tax_rate_percent) setTaxRate(Number(s.tax_rate_percent) / 100);
      })
      .catch(() => {});
  }, []);

  const subtotal = getTotalPrice();
  const totalItems = getTotalItems();
  const taxes = Math.round(subtotal * taxRate);
  const totalPayable = subtotal + taxes;

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0D0A08] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E2A84B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Empty Cart State
  if (items.length === 0) {
    return (
      <div className="relative min-h-screen bg-[#0D0A08] text-[#FAF5EC] overflow-x-hidden flex items-center justify-center px-4 py-20">
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(circle at 50% 35%, rgba(14, 31, 24, 0.8) 0%, rgba(226, 168, 75, 0.08) 35%, rgba(13, 10, 8, 1) 70%)',
          }}
        />

        <div
          className="relative z-10 max-w-lg w-full p-8 sm:p-12 rounded-2xl border text-center shadow-2xl"
          style={{
            background: 'linear-gradient(145deg, #16120E 0%, #0E1F18 100%)',
            borderColor: 'rgba(226, 168, 75, 0.25)',
          }}
        >
          {/* Rotating Double-Ring Gold Crest */}
          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-dashed border-[#E2A84B]/40 animate-[spin_24s_linear_infinite]" />
            <div className="absolute inset-2 rounded-full bg-[#E2A84B]/10 blur-sm animate-pulse" />
            <div className="relative w-14 h-14 rounded-full bg-[#14100D] border border-[#E2A84B]/60 flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-6 h-6 text-[#E2A84B]" />
            </div>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF5EC] mb-2.5">
            Your Dining Cart is Empty
          </h2>
          <p className="text-xs sm:text-sm text-[#B5ADA2] font-light leading-relaxed max-w-sm mx-auto mb-8">
            Explore our curated culinary collection to add artisanal wood-fired pizzas, gourmet brioche burgers, or signature small plates.
          </p>

          <Link
            href="/menu"
            className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-[6px] text-xs font-extrabold text-[#0D0A08] transition-all hover:brightness-110 active:scale-95 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
            }}
          >
            <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none animate-shimmer" />
            <span className="relative z-10">Explore Culinary Menu</span>
            <ArrowRight className="w-3.5 h-3.5 relative z-10 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    );
  }

  const itemsBadgeFormatted =
    totalItems < 10 ? `0${totalItems}` : `${totalItems}`;

  return (
    <div className="relative min-h-screen bg-[#0D0A08] text-[#FAF5EC] overflow-x-hidden selection:bg-[#E2A84B] selection:text-[#0D0A08] pb-28">
      {/* Background Layer 2: Dual Radial Aura */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[700px] z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 35% at 50% 12%, rgba(226, 168, 75, 0.12) 0%, rgba(14, 31, 24, 0.6) 40%, transparent 80%)',
        }}
      />

      {/* Background Layer 3: Tactile Film Noise Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Container with Margin Lines */}
      <div className="max-w-[1280px] mx-auto border-l border-r border-[#E2A84B]/[0.07] min-h-screen relative z-10 flex flex-col justify-between">
        <div>
          {/* ========================================================= */}
          {/* SECTION 1: Concierge Order Header                         */}
          {/* ========================================================= */}
          <div className="px-4 sm:px-6 lg:px-8 pt-10 pb-6 border-b border-[rgba(226,168,75,0.14)]">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              {/* Left Side: Return Link + Royal Heading + Dynamic Badge */}
              <div>
                <Link
                  href="/menu"
                  className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#E2A84B] font-bold mb-3 hover:text-[#FAF5EC] transition-colors"
                >
                  <span className="transition-transform duration-300 group-hover:-translate-x-1">
                    ←
                  </span>
                  <span>RETURN TO MENU</span>
                </Link>

                <div className="flex items-baseline gap-3.5 flex-wrap">
                  <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#FAF5EC] leading-tight">
                    Your Culinary Selection
                  </h1>

                  <span className="font-mono text-xs sm:text-sm font-bold text-[#E2A84B] px-2.5 py-1 rounded-[5px] bg-[#17120E] border border-[#E2A84B]/30 tracking-wider">
                    {itemsBadgeFormatted} {totalItems === 1 ? 'ITEM' : 'ITEMS'}
                  </span>
                </div>
              </div>

              {/* Right Side: Futuristic 3-Option Dining Mode Toggle */}
              <div className="flex items-center p-1 rounded-lg bg-[#14100D] border border-[#E2A84B]/25 overflow-x-auto hide-scrollbar">
                <button
                  type="button"
                  onClick={() => setDiningMode('dine-in')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    diningMode === 'dine-in'
                      ? 'bg-[#0E1F18] border border-[#E2A84B] text-[#FAF5EC] shadow-md'
                      : 'text-[#9A9286] hover:text-[#FAF5EC]'
                  }`}
                >
                  <span>🍽️</span>
                  <span>Dine-In Table Order</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDiningMode('pre-order')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    diningMode === 'pre-order'
                      ? 'bg-[#0E1F18] border border-[#E2A84B] text-[#FAF5EC] shadow-md'
                      : 'text-[#9A9286] hover:text-[#FAF5EC]'
                  }`}
                >
                  <span>📅</span>
                  <span>Pre-Order with Reservation</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDiningMode('takeaway')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    diningMode === 'takeaway'
                      ? 'bg-[#0E1F18] border border-[#E2A84B] text-[#FAF5EC] shadow-md'
                      : 'text-[#9A9286] hover:text-[#FAF5EC]'
                  }`}
                >
                  <span>🛍️</span>
                  <span>Luxury Takeaway</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 2: 2-Column Responsive Workspace                  */}
          {/* ========================================================= */}
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 7 Columns: Dish Cards + Telemetry + Pairings */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Cart Items List */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItemCard
                      key={item.cartItemId}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </div>

                {/* 2. Live Kitchen Telemetry Strip (KDS Real-Time Sync) */}
                <div
                  className="p-3.5 sm:p-4 rounded-lg flex items-center gap-3 border shadow-md"
                  style={{
                    background: 'rgba(14, 31, 24, 0.65)',
                    borderLeft: '3px solid #22C58B',
                    borderColor: 'rgba(34, 197, 139, 0.25)',
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22C58B] animate-pulse shrink-0" />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs">
                    <span className="font-mono font-bold text-[#22C58B] tracking-wide uppercase">
                      LIVE KITCHEN TELEMETRY:
                    </span>
                    <span className="text-[#FAF5EC] font-light">
                      Wood-Fired Station Active · Est. Kitchen Prep Time 14–16 Mins
                    </span>
                  </div>
                </div>

                {/* 3. Complete Your Tasting: 1-Click Chef Pairing Row */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#E2A84B]" />
                    <h3 className="text-xs uppercase tracking-[0.2em] text-[#E2A84B] font-bold">
                      FREQUENTLY PAIRED WITH YOUR SELECTION
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {PAIRING_SUGGESTIONS.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3 rounded-xl border flex items-center justify-between gap-3 shadow-md transition-all hover:border-[#E2A84B]/40"
                        style={{
                          background: '#15110E',
                          borderColor: 'rgba(226, 168, 75, 0.2)',
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-black/60 border border-white/10">
                            <Image
                              src={rec.image}
                              alt={rec.name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-serif text-sm font-bold text-[#FAF5EC] truncate">
                              {rec.name}
                            </h4>
                            <span className="font-mono text-xs font-semibold text-[#E2A84B]">
                              ₹{rec.price}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            addItem(rec, 1);
                            toast.success('Pairing Added', `${rec.name} (₹${rec.price})`);
                          }}
                          className="px-3 py-1.5 rounded-[5px] text-[11px] font-bold text-[#0D0A08] transition-all hover:brightness-110 active:scale-95 shadow-sm shrink-0 cursor-pointer"
                          style={{
                            background:
                              'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                          }}
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 5 Columns: Bespoke Bill Folio & Actions */}
              <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
                <CartSummary
                  subtotal={subtotal}
                  taxRate={taxRate}
                  totalItems={totalItems}
                />

                {/* Primary Checkout CTA */}
                <button
                  type="button"
                  onClick={() => router.push('/checkout')}
                  className="group relative overflow-hidden w-full h-14 rounded-[6px] text-xs sm:text-[13px] font-extrabold tracking-[0.14em] text-[#0D0A08] transition-all duration-300 hover:brightness-110 active:scale-[0.98] shadow-2xl flex items-center justify-center gap-2 cursor-pointer uppercase"
                  style={{
                    background:
                      'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                  }}
                >
                  <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none animate-shimmer" />
                  <span className="relative z-10 font-bold">
                    PROCEED TO SECURE CHECKOUT · ₹{totalPayable}
                  </span>
                  <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1.5 stroke-[2.5]" />
                </button>

                {/* Monochrome Payment Trust Badges */}
                <div className="pt-2 text-center space-y-1.5">
                  <p className="text-[10px] font-mono tracking-widest text-[#9A9286] uppercase">
                    UPI · VISA · MASTERCARD · AMEX · PAY AT TABLE CONCIERGE
                  </p>
                  <p className="text-[10.5px] text-[#9A9286]/70 font-light">
                    Instant Table Dispatch to Kitchen via Point-of-Sale Relay
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
