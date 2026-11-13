'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import {
  Calendar,
  Clock,
  UtensilsCrossed,
  Crown,
  Mail,
  Heart,
  RotateCcw,
  Check,
  Sparkles,
  ShoppingBag,
  Flame,
  Leaf,
  ChevronRight,
  Phone,
  FileText,
  LogOut,
  Box,
  ArrowUpRight,
  Edit2,
  Settings,
  Loader2,
} from 'lucide-react';
import { dishes } from '@/data/mock-menu';
import { RESTAURANT_CONFIG } from '@/lib/config';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { useAuthStore } from '@/store/user-store';
import { toast } from '@/store/toast-store';

interface ProfileDashboardClientProps {
  user: {
    id: string;
    email: string;
  };
  profile: {
    name?: string;
    phone?: string;
    avatar_url?: string;
  };
  initialBookings?: any[];
  initialOrders?: any[];
}

type TabKey = 'all' | 'reservation' | 'orders' | 'preferences' | 'vault';
type DietPreference = 'veg' | 'non-veg' | 'jain';
type SpicePreference = 'mild' | 'medium' | 'hot';

function parseBookingDateTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr) return null;
  const base = new Date(dateStr);
  if (isNaN(base.getTime())) return null;

  if (timeStr) {
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const mins = parseInt(match[2], 10);
      const meridiem = match[3]?.toUpperCase();
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      base.setHours(hours, mins, 0, 0);
      return base;
    }
  }
  base.setHours(23, 59, 59, 999);
  return base;
}

function safeFormatDate(dateStr?: string, fmt = 'MMM d, yyyy'): string {
  if (!dateStr) return '';
  try {
    const parsed = parseISO(dateStr);
    if (!isNaN(parsed.getTime())) return format(parsed, fmt);
    const fallback = new Date(dateStr);
    if (!isNaN(fallback.getTime())) return format(fallback, fmt);
  } catch {
    // ignore malformed dates
  }
  return dateStr;
}

function formatPhoneDisplay(raw?: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    return `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
  }
  return raw;
}

export function ProfileDashboardClient({
  user,
  profile,
  initialBookings = [],
  initialOrders = [],
}: ProfileDashboardClientProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const [mounted, setMounted] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Active Tab Filter (Phone-First Quick Switching)
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  // Persisted Taste Profile State
  const [selectedDiet, setSelectedDiet] = useState<DietPreference>('veg');
  const [selectedSpice, setSelectedSpice] = useState<SpicePreference>('medium');
  const [activeCuisines, setActiveCuisines] = useState<string[]>([
    'Italian',
    'Asian',
    'Indian',
  ]);

  const storageKey = `golden_oak_taste_${user?.id || 'guest'}`;

  const displayName =
    profile?.name?.trim() ||
    user?.email?.split('@')[0] ||
    'Valued Guest';
  const displayEmail = user?.email || '';
  const displayPhone = profile?.phone || '';

  useEffect(() => {
    setMounted(true);
    if (user?.id) {
      useAuthStore
        .getState()
        .setAuth(user.id, displayName, displayEmail, displayPhone || null);
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.diet) setSelectedDiet(parsed.diet);
        if (parsed.spice) setSelectedSpice(parsed.spice);
        if (Array.isArray(parsed.cuisines)) setActiveCuisines(parsed.cuisines);
      }
    } catch {
      // Ignore invalid JSON in localStorage
    }
  }, [storageKey, user?.id, displayName, displayEmail, displayPhone]);

  const persistTasteProfile = (
    diet: DietPreference,
    spice: SpicePreference,
    cuisines: string[]
  ) => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ diet, spice, cuisines })
      );
    } catch {
      // Ignore storage quota issues
    }
  };

  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : 'GO';

  const dishLookup = useMemo(() => {
    const map = new Map<string, (typeof dishes)[number]>();
    for (const d of dishes) {
      map.set(d.id, d);
      map.set(d.slug, d);
      map.set(d.name.toLowerCase(), d);
    }
    return map;
  }, []);

  // Derive Real Stats from DB Records
  const totalOrdersCount = initialOrders.length;
  const totalBookingsCount = initialBookings.length;
  const totalActivityCount = totalOrdersCount + totalBookingsCount;
  const totalSpentRupees = useMemo(() => {
    return initialOrders.reduce((sum, order) => {
      if (order?.status === 'cancelled') return sum;
      return sum + Number(order?.total_paise || 0) / 100;
    }, 0);
  }, [initialOrders]);

  const memberTier =
    totalSpentRupees >= 10000 || totalActivityCount >= 10
      ? 'Gold'
      : totalSpentRupees >= 2500 || totalActivityCount >= 3
      ? 'Silver'
      : 'Classic';

  // Upcoming or most recent active reservation
  const highlightedBooking = useMemo(() => {
    if (!initialBookings.length) return null;
    const now = new Date();
    const upcoming = initialBookings
      .filter((b) => {
        if (!b || b.status === 'cancelled' || b.status === 'completed') return false;
        const dt = parseBookingDateTime(b.booking_date, b.booking_time);
        return dt ? dt >= now : false;
      })
      .sort((a, b) => {
        const da = parseBookingDateTime(a.booking_date, a.booking_time)?.getTime() || 0;
        const db = parseBookingDateTime(b.booking_date, b.booking_time)?.getTime() || 0;
        return da - db;
      });
    return upcoming[0] || initialBookings[0];
  }, [initialBookings]);

  const latestOrder = initialOrders[0] || null;

  // Vault favorites resolved from real favorites store + catalog dishes
  const vaultDishes = useMemo(() => {
    if (!mounted) return [];
    const matched = dishes.filter(
      (d) => favoriteIds.includes(d.id) || favoriteIds.includes(d.slug)
    );
    return matched;
  }, [mounted, favoriteIds]);

  const toggleCuisine = (c: string) => {
    setActiveCuisines((prev) => {
      const exists = prev.includes(c);
      const next = exists ? prev.filter((item) => item !== c) : [...prev, c];
      persistTasteProfile(selectedDiet, selectedSpice, next);
      toast.info(
        'Preference Updated',
        `${c} ${exists ? 'removed from' : 'added to'} your taste profile.`
      );
      return next;
    });
  };

  const handleDietChange = (dietId: DietPreference, label: string) => {
    setSelectedDiet(dietId);
    persistTasteProfile(dietId, selectedSpice, activeCuisines);
    toast.success('Taste Profile Updated', `Dietary preference set to ${label}.`);
  };

  const handleSpiceChange = (spiceId: SpicePreference, label: string) => {
    setSelectedSpice(spiceId);
    persistTasteProfile(selectedDiet, spiceId, activeCuisines);
    toast.success('Spice Level Updated', `Preferred spice set to ${label}.`);
  };

  const handleReorder = (order: any) => {
    const orderItems = order?.order_items || [];
    if (!orderItems.length) {
      router.push('/menu');
      return;
    }

    let added = 0;
    for (const item of orderItems) {
      const catalogDish =
        dishLookup.get(item.dish_id) ||
        dishLookup.get((item.dish_name || '').toLowerCase());

      const dishObj = catalogDish || {
        id: item.dish_id || item.dish_name,
        slug: item.dish_id || 'dish',
        name: item.dish_name || 'Signature Dish',
        description: '',
        price: Number(item.dish_price_paise || 0) / 100,
        image: '/images/dishes/placeholder.jpg',
        category: 'starters' as const,
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
            priceModifier: Number(item.size_price_modifier_paise || 0) / 100,
          }
        : undefined;

      const selectedAddOns = item.order_item_customizations?.map((a: any) => ({
        id: String(a.name || '').toLowerCase().replace(/\s+/g, '-'),
        name: a.name,
        price: Number(a.price_paise || 0) / 100,
      }));

      addItem(dishObj, Number(item.quantity || 1), {
        size,
        selectedAddOns,
        specialInstructions: item.special_instructions || undefined,
      });
      added += 1;
    }

    if (added > 0) {
      toast.success('Order Added to Cart', `${added} dish group${added > 1 ? 's' : ''} added for quick checkout.`);
      router.push('/cart');
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    useAuthStore.getState().clearAuth();
    try {
      const { createClient } = await import('@/lib/supabase/client');
      await createClient().auth.signOut();
    } catch {
      // ignore Supabase client cleanup errors
    }
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch {
      // ignore network error
    }
    toast.info('Signed Out', 'You have been signed out cleanly.');
    router.push('/auth/login?switch=1');
    router.refresh();
  };

  const dietSummaryLabel =
    selectedDiet === 'veg' ? 'Veg' : selectedDiet === 'jain' ? 'Jain' : 'Non-Veg';
  const spiceSummaryLabel =
    selectedSpice === 'mild' ? 'Mild' : selectedSpice === 'hot' ? 'Hot' : 'Med';

  const highlightedBookingDateLabel = highlightedBooking
    ? safeFormatDate(highlightedBooking.booking_date, 'EEE, MMM d')
    : null;
  const highlightedBookingTimeLabel = highlightedBooking?.booking_time || '';
  const highlightedStatus = String(highlightedBooking?.status || 'confirmed').toUpperCase();

  const conciergeTel = `+91${RESTAURANT_CONFIG.phone.replace(/\D/g, '').slice(-10)}`;

  return (
    <div className="relative min-h-[calc(100vh-76px)] sm:min-h-[calc(100vh-84px)] bg-[#0B0907] text-[#F8F2E8] pb-24 md:pb-12 pt-4 sm:pt-6">
      {/* 1. Photorealistic Luxury Ambient Restaurant Background */}
      <div
        className="fixed inset-0 pointer-events-none bg-cover bg-center transition-opacity duration-700 z-0 opacity-35"
        style={{
          backgroundImage: "url('/images/profile-bg.jpg')",
          backgroundPosition: 'center 30%',
          backgroundSize: 'cover',
        }}
      />

      {/* 2. Soft Ambient Radial Vignette Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(11, 9, 7, 0.68) 0%, rgba(11, 9, 7, 0.90) 60%, rgba(11, 9, 7, 0.98) 100%)',
        }}
      />

      {/* 3. Main Responsive Content Container (Phone Stacked + Desktop 12-Col Dashboard) */}
      <div className="relative z-10 max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          {/* ========================================================= */}
          {/* LEFT COLUMN (Desktop Sticky Sidebar / Mobile Top Card)    */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 space-y-3.5 sm:space-y-4 lg:sticky lg:top-24">
            {/* VIP MEMBER PASS CARD */}
            <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#1C1611]/95 via-[#130E0A]/95 to-[#0D0A08]/95 border border-[#F0C36B]/35 shadow-[0_12px_32px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,235,185,0.2)]">
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#E2A84B]/15 blur-2xl pointer-events-none" />

              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#F0C36B] via-[#DDA33E] to-[#FFE1A0] shadow-[0_0_16px_rgba(240,195,107,0.35)]">
                    <div className="w-full h-full rounded-full bg-[#120D09] flex items-center justify-center border border-[#F0C36B]/40">
                      <span className="font-serif text-lg sm:text-xl font-bold text-[#F8F2E8] tracking-wider">
                        {initials}
                      </span>
                    </div>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-[#22C58B] border-2 border-[#120D09] flex items-center justify-center text-[#120D09] shadow-sm">
                    <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0C36B]/15 border border-[#F0C36B]/40 text-[#FFE1A0] text-[9.5px] font-bold tracking-wider uppercase font-mono">
                      <Crown className="w-2.5 h-2.5 text-[#F0C36B]" />
                      <span>{memberTier} Member</span>
                    </span>
                    <span className="text-[9.5px] text-[#22C58B] font-mono font-medium">● Active Guest</span>
                  </div>

                  <h1 className="font-serif text-lg sm:text-xl font-bold text-[#F8F2E8] tracking-tight truncate mt-0.5">
                    {displayName}
                  </h1>

                  {displayEmail && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#A99A88] truncate mt-0.5">
                      <Mail className="w-3 h-3 text-[#F0C36B] shrink-0" />
                      <span className="truncate">{displayEmail}</span>
                    </div>
                  )}
                  {displayPhone && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#A99A88] truncate mt-0.5">
                      <Phone className="w-3 h-3 text-[#F0C36B] shrink-0" />
                      <span className="truncate">{formatPhoneDisplay(displayPhone)}</span>
                    </div>
                  )}
                </div>

                <Link
                  href="/profile/edit"
                  aria-label="Edit Profile"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:border-[#F0C36B]/50 flex items-center justify-center text-[#A99A88] hover:text-[#FAF5EC] active:scale-95 transition-all shrink-0"
                >
                  <Edit2 className="w-4 h-4 text-[#F0C36B]" />
                </Link>
              </div>

              {/* 3-Metric Real Stats Bar */}
              <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-white/[0.08] text-center">
                <div className="flex flex-col items-center">
                  <span className="font-mono text-base sm:text-lg font-bold text-[#F8F2E8] leading-tight">
                    {totalActivityCount}
                  </span>
                  <span className="text-[9px] font-mono tracking-wider text-[#A99A88] uppercase mt-0.5">
                    Bookings &amp; Orders
                  </span>
                </div>

                <div className="flex flex-col items-center border-x border-white/[0.08]">
                  <div className="flex items-center gap-1 font-serif text-base sm:text-lg font-bold text-[#F0C36B] leading-tight">
                    <span>{memberTier}</span>
                    <Crown className="w-3 h-3 text-[#F0C36B]" />
                  </div>
                  <span className="text-[9px] font-mono tracking-wider text-[#A99A88] uppercase mt-0.5">
                    Member Tier
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="font-mono text-base sm:text-lg font-bold text-[#F8F2E8] leading-tight">
                    ₹{Math.round(totalSpentRupees).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] font-mono tracking-wider text-[#A99A88] uppercase mt-0.5">
                    Total Spent
                  </span>
                </div>
              </div>

              {/* Bottom Privilege Strip */}
              <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-[#E2A84B]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium truncate">Priority 3D Table Selection &amp; Lounge Access</span>
                </div>
                <Link
                  href="/menu"
                  className="text-[10.5px] font-semibold text-[#FFE1A0] hover:underline shrink-0 flex items-center gap-0.5 ml-2"
                >
                  <span>Menu</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* PHONE QUICK HUB: 4 TOUCH TARGETS */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'reservation' ? 'all' : 'reservation')}
                className={`flex flex-col items-center justify-center p-2 sm:p-2.5 min-h-[60px] rounded-xl border text-center transition-all cursor-pointer ${
                  activeTab === 'reservation'
                    ? 'bg-[#E2A84B]/20 border-[#E2A84B] shadow-[0_0_12px_rgba(226,168,75,0.25)]'
                    : 'bg-[#140F0B]/85 border-white/10 hover:border-white/20'
                }`}
              >
                <Calendar className="w-4 h-4 text-[#F0C36B] mb-1" />
                <span className="text-[11px] font-bold text-[#F8F2E8] leading-none">Bookings</span>
                <span className="text-[9px] text-[#22C58B] font-mono mt-1 font-semibold leading-none truncate max-w-full">
                  {totalBookingsCount} Saved
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'orders' ? 'all' : 'orders')}
                className={`flex flex-col items-center justify-center p-2 sm:p-2.5 min-h-[60px] rounded-xl border text-center transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-[#E2A84B]/20 border-[#E2A84B] shadow-[0_0_12px_rgba(226,168,75,0.25)]'
                    : 'bg-[#140F0B]/85 border-white/10 hover:border-white/20'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-[#F0C36B] mb-1" />
                <span className="text-[11px] font-bold text-[#F8F2E8] leading-none">Orders</span>
                <span className="text-[9px] text-[#A99A88] font-mono mt-1 leading-none truncate max-w-full">
                  {totalOrdersCount} Recent
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'vault' ? 'all' : 'vault')}
                className={`flex flex-col items-center justify-center p-2 sm:p-2.5 min-h-[60px] rounded-xl border text-center transition-all cursor-pointer ${
                  activeTab === 'vault'
                    ? 'bg-[#E2A84B]/20 border-[#E2A84B] shadow-[0_0_12px_rgba(226,168,75,0.25)]'
                    : 'bg-[#140F0B]/85 border-white/10 hover:border-white/20'
                }`}
              >
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500 mb-1" />
                <span className="text-[11px] font-bold text-[#F8F2E8] leading-none">Vault</span>
                <span className="text-[9px] text-[#A99A88] font-mono mt-1 leading-none truncate max-w-full">
                  {vaultDishes.length} Saved
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'preferences' ? 'all' : 'preferences')}
                className={`flex flex-col items-center justify-center p-2 sm:p-2.5 min-h-[60px] rounded-xl border text-center transition-all cursor-pointer ${
                  activeTab === 'preferences'
                    ? 'bg-[#E2A84B]/20 border-[#E2A84B] shadow-[0_0_12px_rgba(226,168,75,0.25)]'
                    : 'bg-[#140F0B]/85 border-white/10 hover:border-white/20'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4 text-[#F0C36B] mb-1" />
                <span className="text-[11px] font-bold text-[#F8F2E8] leading-none">Taste</span>
                <span className="text-[9px] text-[#F0C36B] font-mono mt-1 font-semibold leading-none truncate max-w-full">
                  {dietSummaryLabel}·{spiceSummaryLabel}
                </span>
              </button>
            </div>

            {/* Filter View Reset Banner */}
            {activeTab !== 'all' && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#E2A84B]/10 border border-[#E2A84B]/30 text-xs">
                <span className="text-[11px] text-[#FAF5EC]/80">
                  Showing section: <strong className="text-[#E2A84B] capitalize">{activeTab}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className="text-[11px] text-[#E2A84B] font-semibold hover:underline cursor-pointer"
                >
                  Show All
                </button>
              </div>
            )}

            {/* Desktop Account Services Card (shown here on lg+, moved bottom on mobile) */}
            <div className="hidden lg:block rounded-2xl p-3 bg-[rgba(20,15,11,0.88)] backdrop-blur-xl border border-white/10 space-y-1">
              <a
                href={`tel:${conciergeTel}`}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="w-3.5 h-3.5 text-[#F0C36B]" />
                  <span className="font-medium text-[#F8F2E8]">
                    VIP Table Concierge ({RESTAURANT_CONFIG.phone})
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#A99A88]" />
              </a>

              <Link
                href="/profile/reservations"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-3.5 h-3.5 text-[#F0C36B]" />
                  <span className="font-medium text-[#F8F2E8]">My Reservations &amp; Table Passes</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#A99A88]" />
              </Link>

              <Link
                href="/profile/orders"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-3.5 h-3.5 text-[#F0C36B]" />
                  <span className="font-medium text-[#F8F2E8]">Tax Invoices &amp; Order History</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#A99A88]" />
              </Link>

              <Link
                href="/settings"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-3.5 h-3.5 text-[#F0C36B]" />
                  <span className="font-medium text-[#F8F2E8]">Account Settings &amp; Privacy</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#A99A88]" />
              </Link>

              <button
                type="button"
                disabled={signingOut}
                onClick={handleSignOut}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-xs text-rose-400 cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center gap-2.5">
                  {signingOut ? (
                    <Loader2 className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span className="font-medium">
                    {signingOut ? 'Signing Out...' : 'Sign Out / Switch Account'}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#A99A88]" />
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN (Reservations, Orders, Taste, Tasting Vault) */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
            {/* SECTION 1: RESERVATION */}
            {(activeTab === 'all' || activeTab === 'reservation') && (
              <div className="rounded-2xl p-3.5 sm:p-5 bg-[rgba(20,15,11,0.88)] backdrop-blur-xl border border-[rgba(240,195,107,0.28)] shadow-[0_8px_24px_rgba(0,0,0,0.65)] space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#F0C36B]" />
                    <h2 className="font-serif text-sm sm:text-base font-bold text-[#F8F2E8]">
                      Table Reservation
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {highlightedBooking && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#22C58B]/15 border border-[#22C58B]/50 text-[#22C58B] text-[10px] font-bold font-mono tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C58B]" />
                        {highlightedStatus}
                      </span>
                    )}
                    <Link
                      href="/profile/reservations"
                      className="text-[11px] font-semibold text-[#F0C36B] hover:text-[#FFE1A0] transition-colors flex items-center gap-0.5"
                    >
                      <span>View All ({totalBookingsCount})</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {highlightedBooking ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#F0C36B]/30 shrink-0 bg-black/60">
                        <img
                          src="/images/profile-bg.jpg"
                          alt="Reserved Table Preview"
                          className="w-full h-full object-cover"
                        />
                        {highlightedBooking.table_number && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-[#F0C36B] font-bold">
                            T-{String(highlightedBooking.table_number).padStart(2, '0')}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9.5px] uppercase font-mono tracking-widest text-[#F0C36B] font-bold truncate">
                            {highlightedBooking.table_preference || 'Main Dining Floor'}
                          </span>
                          <span className="text-[10px] text-[#A99A88] font-mono shrink-0">
                            {highlightedBooking.guests} {highlightedBooking.guests === 1 ? 'Guest' : 'Guests'}
                          </span>
                        </div>

                        <h3 className="font-serif text-sm sm:text-base font-bold text-[#F8F2E8] leading-tight truncate">
                          {highlightedBooking.table_number
                            ? `Table ${highlightedBooking.table_number} Reservation`
                            : `Reservation ${highlightedBooking.id}`}
                        </h3>

                        <div className="flex items-center gap-2 text-[11px] text-[#A99A88] pt-0.5 flex-wrap">
                          <span className="text-[#FAF5EC] font-semibold">{highlightedBookingDateLabel}</span>
                          {highlightedBookingTimeLabel && (
                            <>
                              <span>·</span>
                              <span className="text-[#F0C36B] font-mono font-medium inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {highlightedBookingTimeLabel}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.08]">
                      <Link
                        href={`/profile/reservations/${highlightedBooking.id}`}
                        className="py-2.5 px-3 rounded-lg font-bold text-xs text-[#17100C] text-center transition-all duration-300 hover:brightness-110 active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
                        style={{
                          background: 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
                        }}
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#17100C]" />
                      </Link>

                      <Link
                        href="/booking"
                        className="py-2.5 px-3 rounded-lg font-semibold text-xs text-[#F8F2E8] bg-white/[0.05] border border-white/10 hover:border-[#F0C36B]/40 transition-all text-center flex items-center justify-center"
                      >
                        Book Another Table
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-[#F8F2E8]">No upcoming table bookings</p>
                      <p className="text-xs text-[#A99A88] mt-0.5">
                        Explore the 3D floorplan to lock your preferred table in advance.
                      </p>
                    </div>
                    <Link
                      href="/booking"
                      className="py-2.5 px-4 rounded-xl font-bold text-xs text-[#17100C] text-center shrink-0 transition-all hover:brightness-110 active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
                      }}
                    >
                      Book a Table →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: RECENT CULINARY ORDER */}
            {(activeTab === 'all' || activeTab === 'orders') && (
              <div className="rounded-2xl p-3.5 sm:p-5 bg-[rgba(20,15,11,0.88)] backdrop-blur-xl border border-[rgba(240,195,107,0.28)] shadow-[0_8px_24px_rgba(0,0,0,0.65)] space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#F0C36B]" />
                    <h2 className="font-serif text-sm sm:text-base font-bold text-[#F8F2E8]">
                      Recent Culinary Order
                    </h2>
                  </div>
                  <Link
                    href="/profile/orders"
                    className="text-[11px] font-semibold text-[#F0C36B] hover:text-[#FFE1A0] transition-colors flex items-center gap-0.5"
                  >
                    <span>View All ({totalOrdersCount})</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                {latestOrder ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <Link
                        href={`/profile/orders/${latestOrder.id}`}
                        className="flex items-center gap-2 hover:underline min-w-0"
                      >
                        <span className="font-mono font-bold text-[#F0C36B] text-[11.5px] truncate">
                          #{latestOrder.id}
                        </span>
                        <span className="text-[10px] text-[#A99A88] shrink-0">
                          · {safeFormatDate(latestOrder.created_at, 'MMM d')} · {latestOrder.order_type === 'dine-in' ? 'Dine-In' : 'Takeaway'}
                        </span>
                      </Link>
                      <span className="px-2 py-0.5 rounded-full bg-[#22C58B]/15 border border-[#22C58B]/40 text-[#22C58B] text-[9.5px] font-bold uppercase shrink-0">
                        {latestOrder.status || 'Received'}
                      </span>
                    </div>

                    {Array.isArray(latestOrder.order_items) && latestOrder.order_items.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                        {latestOrder.order_items.slice(0, 4).map((item: any, idx: number) => {
                          const matched =
                            dishLookup.get(item.dish_id) ||
                            dishLookup.get((item.dish_name || '').toLowerCase());
                          const thumb = matched?.image || '/images/dishes/placeholder.jpg';
                          return (
                            <div
                              key={item.id || `${item.dish_id}-${idx}`}
                              className="flex items-center gap-2.5 p-2 rounded-lg bg-black/40 border border-white/10"
                            >
                              <img
                                src={thumb}
                                alt={item.dish_name || 'Dish'}
                                className="w-9 h-9 rounded-md object-cover shrink-0"
                              />
                              <div className="min-w-0 flex-1 leading-tight">
                                <p className="text-xs font-medium text-[#F8F2E8] truncate">
                                  {item.dish_name}
                                </p>
                                <p className="font-mono text-[#F0C36B] text-[10.5px]">
                                  ₹{Math.round(Number(item.dish_price_paise || 0) / 100)} × {item.quantity}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.08] text-xs">
                      <div>
                        <span className="text-[10.5px] text-[#A99A88]">Total Paid: </span>
                        <span className="font-mono font-bold text-[#F8F2E8] text-xs">
                          ₹{(Number(latestOrder.total_paise || 0) / 100).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile/orders/${latestOrder.id}`}
                          className="py-1.5 px-3 rounded-lg text-xs font-semibold text-[#F8F2E8] bg-white/[0.05] border border-white/10 hover:border-[#F0C36B]/40 transition-colors"
                        >
                          Receipt
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleReorder(latestOrder)}
                          className="py-1.5 px-3 rounded-lg font-bold text-xs text-[#17100C] transition-all hover:brightness-110 active:scale-95 shadow-sm flex items-center gap-1.5 cursor-pointer"
                          style={{
                            background: 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
                          }}
                        >
                          <RotateCcw className="w-3 h-3 text-[#17100C]" />
                          <span>Reorder</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-[#F8F2E8]">No recent culinary orders</p>
                      <p className="text-xs text-[#A99A88] mt-0.5">
                        Your past orders, GST invoices, and 1-tap reorders will appear here.
                      </p>
                    </div>
                    <Link
                      href="/menu"
                      className="py-2.5 px-4 rounded-xl font-bold text-xs text-[#17100C] text-center shrink-0 transition-all hover:brightness-110 active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
                      }}
                    >
                      Explore Menu →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 3: YOUR DINING PREFERENCES */}
            {(activeTab === 'all' || activeTab === 'preferences') && (
              <div className="rounded-2xl p-3.5 sm:p-5 bg-[rgba(20,15,11,0.88)] backdrop-blur-xl border border-[rgba(240,195,107,0.28)] shadow-[0_8px_24px_rgba(0,0,0,0.65)] space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-[#F0C36B]" />
                    <h2 className="font-serif text-sm sm:text-base font-bold text-[#F8F2E8]">
                      Dining Preferences
                    </h2>
                  </div>
                  <span className="text-[10px] text-[#A99A88] font-mono">Saved Taste Profile</span>
                </div>

                {/* Dietary Choice */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#F0C36B] font-bold">
                    Dietary Preference
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDietChange('veg', 'Vegetarian')}
                      className={`p-2.5 rounded-xl flex items-center gap-2.5 transition-all text-left cursor-pointer border ${
                        selectedDiet === 'veg'
                          ? 'bg-[#F0C36B]/20 border-[#F0C36B] shadow-[0_0_12px_rgba(240,195,107,0.2)]'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="text-xs font-bold text-[#F8F2E8]">Vegetarian</p>
                        <p className="text-[9.5px] text-[#A99A88]">Plant-forward</p>
                      </div>
                      {selectedDiet === 'veg' && <Check className="w-3.5 h-3.5 text-[#F0C36B] shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDietChange('non-veg', 'Non-Vegetarian')}
                      className={`p-2.5 rounded-xl flex items-center gap-2.5 transition-all text-left cursor-pointer border ${
                        selectedDiet === 'non-veg'
                          ? 'bg-[#F0C36B]/20 border-[#F0C36B] shadow-[0_0_12px_rgba(240,195,107,0.2)]'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="text-xs font-bold text-[#F8F2E8]">All / Non-Veg</p>
                        <p className="text-[9.5px] text-[#A99A88]">Full tasting menu</p>
                      </div>
                      {selectedDiet === 'non-veg' && <Check className="w-3.5 h-3.5 text-[#F0C36B] shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDietChange('jain', 'Jain Friendly')}
                      className={`p-2.5 rounded-xl flex items-center gap-2.5 transition-all text-left cursor-pointer border ${
                        selectedDiet === 'jain'
                          ? 'bg-[#F0C36B]/20 border-[#F0C36B] shadow-[0_0_12px_rgba(240,195,107,0.2)]'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-purple-500/15 flex items-center justify-center shrink-0">
                        <Crown className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="text-xs font-bold text-[#F8F2E8]">Jain Friendly</p>
                        <p className="text-[9.5px] text-[#A99A88]">No Onion/Garlic</p>
                      </div>
                      {selectedDiet === 'jain' && <Check className="w-3.5 h-3.5 text-[#F0C36B] shrink-0" />}
                    </button>
                  </div>
                </div>

                {/* Spice Level */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#F0C36B] font-bold">
                    Spice Preference
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'mild' as const, label: 'Mild' },
                      { id: 'medium' as const, label: 'Medium' },
                      { id: 'hot' as const, label: 'Fiery' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSpiceChange(s.id, s.label)}
                        className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                          selectedSpice === s.id
                            ? 'bg-[#F0C36B]/20 border-[#F0C36B] text-[#FFE1A0]'
                            : 'bg-black/40 border-white/10 text-[#A99A88] hover:text-[#F8F2E8]'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cuisine Interests Chips */}
                <div className="space-y-1.5 pt-0.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#F0C36B] font-bold">
                    Cuisine Interests
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Italian', 'Mediterranean', 'Asian', 'Continental', 'Indian'].map((cuisine) => {
                      const isActive = activeCuisines.includes(cuisine);
                      return (
                        <button
                          key={cuisine}
                          type="button"
                          onClick={() => toggleCuisine(cuisine)}
                          className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 border ${
                            isActive
                              ? 'bg-[#F0C36B]/25 border-[#F0C36B] text-[#FFE1A0]'
                              : 'bg-black/40 border-white/10 text-[#A99A88] hover:text-[#F8F2E8]'
                          }`}
                        >
                          {isActive && <Check className="w-2.5 h-2.5 text-[#F0C36B]" />}
                          <span>{cuisine}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: PERSONAL TASTING VAULT (LIVE FAVORITES SYNCED) */}
            {(activeTab === 'all' || activeTab === 'vault') && (
              <div className="rounded-2xl p-3.5 sm:p-5 bg-[rgba(20,15,11,0.88)] backdrop-blur-xl border border-[rgba(240,195,107,0.28)] shadow-[0_8px_24px_rgba(0,0,0,0.65)] space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <h2 className="font-serif text-sm sm:text-base font-bold text-[#F8F2E8]">
                      Personal Tasting Vault
                    </h2>
                  </div>
                  <Link
                    href="/favorites"
                    className="text-[11px] font-semibold text-[#F0C36B] hover:text-[#FFE1A0] transition-colors flex items-center gap-0.5"
                  >
                    <span>Open Vault ({vaultDishes.length})</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                {vaultDishes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {vaultDishes.slice(0, 6).map((dish) => {
                      const isFav =
                        mounted &&
                        (favoriteIds.includes(dish.id) || favoriteIds.includes(dish.slug));
                      return (
                        <div
                          key={dish.id}
                          className="group flex items-center gap-3 p-2.5 rounded-xl bg-black/45 border border-white/10 hover:border-[#F0C36B]/50 transition-all"
                        >
                          <Link
                            href={`/menu/${dish.category}/${dish.slug}`}
                            className="relative w-16 h-16 rounded-lg overflow-hidden bg-black/50 border border-white/10 shrink-0"
                          >
                            <img
                              src={dish.image}
                              alt={dish.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </Link>

                          <div className="min-w-0 flex-1 flex flex-col justify-between gap-1">
                            <Link
                              href={`/menu/${dish.category}/${dish.slug}`}
                              className="font-serif text-xs sm:text-[13px] font-bold text-[#F8F2E8] line-clamp-2 group-hover:text-[#F0C36B] transition-colors leading-snug"
                            >
                              {dish.name}
                            </Link>

                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-[#F0C36B]">
                                ₹{dish.price}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {dish.has3DModel && (
                                  <Link
                                    href={`/3d/${dish.slug}`}
                                    className="px-1.5 py-0.5 rounded bg-[#E2A84B]/20 text-[#E2A84B] text-[9px] font-mono font-bold flex items-center gap-0.5 hover:bg-[#E2A84B]/30"
                                  >
                                    <Box className="w-2.5 h-2.5" />
                                    <span>3D</span>
                                  </Link>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    toggleFavorite(dish.id);
                                    toast.info(
                                      isFav ? 'Removed from Vault' : 'Added to Vault',
                                      dish.name
                                    );
                                  }}
                                  aria-label={isFav ? `Remove ${dish.name} from favorites` : `Save ${dish.name} to favorites`}
                                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
                                >
                                  <Heart
                                    className={`w-3.5 h-3.5 ${
                                      isFav
                                        ? 'text-rose-500 fill-rose-500'
                                        : 'text-white/40'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-[#F8F2E8]">Your Tasting Vault is empty</p>
                      <p className="text-xs text-[#A99A88] mt-0.5">
                        Tap the heart icon on any menu dish to save your favorites here.
                      </p>
                    </div>
                    <Link
                      href="/menu"
                      className="py-2 px-4 rounded-xl text-xs font-semibold text-[#F0C36B] bg-[#F0C36B]/10 border border-[#F0C36B]/30 hover:bg-[#F0C36B]/20 text-center shrink-0 transition-colors"
                    >
                      Browse Menu →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hospitality & Account Services Card (below sections on < lg) */}
            <div className="lg:hidden rounded-2xl p-2.5 sm:p-3 bg-[rgba(20,15,11,0.88)] backdrop-blur-xl border border-white/10 space-y-1">
              <a
                href={`tel:${conciergeTel}`}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="w-3.5 h-3.5 text-[#F0C36B]" />
                  <span className="font-medium text-[#F8F2E8]">
                    VIP Table Concierge ({RESTAURANT_CONFIG.phone})
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#A99A88]" />
              </a>

              <Link
                href="/profile/reservations"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-3.5 h-3.5 text-[#F0C36B]" />
                  <span className="font-medium text-[#F8F2E8]">My Reservations &amp; Table Passes</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#A99A88]" />
              </Link>

              <Link
                href="/profile/orders"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-3.5 h-3.5 text-[#F0C36B]" />
                  <span className="font-medium text-[#F8F2E8]">Tax Invoices &amp; Order History</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#A99A88]" />
              </Link>

              <Link
                href="/settings"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-3.5 h-3.5 text-[#F0C36B]" />
                  <span className="font-medium text-[#F8F2E8]">Account Settings &amp; Privacy</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#A99A88]" />
              </Link>

              <button
                type="button"
                disabled={signingOut}
                onClick={handleSignOut}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-xs text-rose-400 cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center gap-2.5">
                  {signingOut ? (
                    <Loader2 className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span className="font-medium">
                    {signingOut ? 'Signing Out...' : 'Sign Out / Switch Account'}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#A99A88]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
