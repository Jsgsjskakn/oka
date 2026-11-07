'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Users,
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
  ChevronLeft,
  BellRing,
  Phone,
  FileText,
  LogOut,
  ShieldCheck,
  Box,
  Layers,
  ArrowUpRight,
  Edit2,
} from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
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

export function ProfileDashboardClient({
  user,
  profile,
}: ProfileDashboardClientProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  // Active Tab Filter (Phone-First Quick Switching)
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  // Active Preferences State
  const [selectedDiet, setSelectedDiet] = useState<string>('veg');
  const [activeCuisines, setActiveCuisines] = useState<string[]>([
    'Italian',
    'Asian',
    'Indian',
  ]);
  const [vaultIndex, setVaultIndex] = useState(0);

  const displayName = profile?.name || 'Pyiush Gupta';
  const displayEmail = user?.email || 'pyiush.999@gmail.com';
  const displayPhone = profile?.phone || '+91 98765 43210';

  const parts = displayName.trim().split(/\s+/);
  const initials =
    parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : 'PG';

  // Toggle Cuisine Tag
  const toggleCuisine = (c: string) => {
    setActiveCuisines((prev) => {
      const next = prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c];
      toast.info('Preference Updated', `${c} ${prev.includes(c) ? 'removed from' : 'added to'} your taste profile.`);
      return next;
    });
  };

  const handleDietChange = (dietId: string, label: string) => {
    setSelectedDiet(dietId);
    toast.success('Taste Profile Updated', `Primary preference set to ${label}.`);
  };

  // Quick Reorder Action
  const handleReorder = () => {
    const dish1 = {
      id: 'mushroom-truffle-pizza',
      slug: 'mushroom-truffle-pizza',
      name: 'Wood-Fired Pizza',
      description: 'Artisan truffle sourdough pizza with wild mushrooms.',
      price: 549,
      image: '/images/dishes/mushroom-truffle-pizza.webp',
      category: 'pizza' as const,
      isVeg: true,
      isAvailable: true,
      isFeatured: true,
      isBestSeller: true,
      spiceLevel: 'medium' as const,
      has3DModel: true,
    };
    const dish2 = {
      id: 'tandoori-paneer-pizza',
      slug: 'tandoori-paneer-pizza',
      name: 'Tandoori Paneer Pizza',
      description: 'Wood-fired sourdough with smoked paneer and fior di latte.',
      price: 449,
      image: '/images/dishes/tandoori-paneer-pizza.webp',
      category: 'pizza' as const,
      isVeg: true,
      isAvailable: true,
      isFeatured: true,
      isBestSeller: true,
      spiceLevel: 'medium' as const,
      has3DModel: true,
    };
    addItem(dish1, 1);
    addItem(dish2, 1);
    toast.success('Order Added to Cart', 'Wood-Fired Pizza & Tandoori Paneer Pizza');
    router.push('/cart');
  };

  // Tasting Vault Items
  const vaultDishes = [
    {
      id: 'mushroom-truffle-pizza',
      slug: 'mushroom-truffle-pizza',
      name: 'Mushroom Truffle Pizza',
      price: 549,
      image: '/images/dishes/mushroom-truffle-pizza.webp',
      category: 'Wood-Fired Pizza',
    },
    {
      id: 'classic-smash-burger',
      slug: 'classic-smash-burger',
      name: 'Classic Smash Burger',
      price: 449,
      image: '/images/dishes/classic-smash-burger.webp',
      category: 'Artisanal Brioche',
    },
    {
      id: 'dynamite-chilli-potatoes',
      slug: 'dynamite-chilli-potatoes',
      name: 'Dynamite Potatoes',
      price: 279,
      image: '/images/dishes/dynamite-chilli-potatoes.webp',
      category: 'Small Plates',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#0B0907] text-[#F8F2E8] select-none pb-28 pt-18 sm:pt-22">
      {/* 1. Photorealistic Luxury Ambient Restaurant Background */}
      <div
        className="fixed inset-0 pointer-events-none bg-cover bg-center transition-opacity duration-700 z-0 opacity-40"
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
            'radial-gradient(ellipse at 50% 30%, rgba(11, 9, 7, 0.65) 0%, rgba(11, 9, 7, 0.88) 60%, rgba(11, 9, 7, 0.98) 100%)',
        }}
      />

      {/* 3. Main Phone-Optimized Content Container */}
      <div className="relative z-10 max-w-xl mx-auto px-3.5 sm:px-6 space-y-3.5 sm:space-y-4">

        {/* ========================================================= */}
        {/* PHONE-FIRST VIP MEMBER PASS CARD                          */}
        {/* ========================================================= */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#1C1611]/95 via-[#130E0A]/95 to-[#0D0A08]/95 border border-[#F0C36B]/35 shadow-[0_12px_32px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,235,185,0.2)]">
          {/* Subtle Golden Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#E2A84B]/15 blur-2xl pointer-events-none" />

          {/* Top Row: Avatar + Details + Edit */}
          <div className="flex items-center gap-3.5">
            {/* Double Gold Ring Avatar */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#F0C36B] via-[#DDA33E] to-[#FFE1A0] shadow-[0_0_16px_rgba(240,195,107,0.35)]">
                <div className="w-full h-full rounded-full bg-[#120D09] flex items-center justify-center border border-[#F0C36B]/40">
                  <span className="font-serif text-lg sm:text-xl font-bold text-[#F8F2E8] tracking-wider">
                    {initials}
                  </span>
                </div>
              </div>
              {/* Green Verified Checkmark */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-[#22C58B] border-2 border-[#120D09] flex items-center justify-center text-[#120D09] shadow-sm">
                <Check className="w-2.5 h-2.5 stroke-[3.5]" />
              </div>
            </div>

            {/* Member Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0C36B]/15 border border-[#F0C36B]/40 text-[#FFE1A0] text-[9.5px] font-bold tracking-wider uppercase font-mono">
                  <Crown className="w-2.5 h-2.5 text-[#F0C36B]" />
                  <span>Gold Member</span>
                </span>
                <span className="text-[9.5px] text-[#22C58B] font-mono font-medium">● Active VIP</span>
              </div>

              <h1 className="font-serif text-lg sm:text-xl font-bold text-[#F8F2E8] tracking-tight truncate mt-0.5">
                {displayName}
              </h1>

              <div className="flex items-center gap-1.5 text-[11px] text-[#A99A88] truncate mt-0.5">
                <Mail className="w-3 h-3 text-[#F0C36B] shrink-0" />
                <span className="truncate">{displayEmail}</span>
              </div>
            </div>

            {/* Edit Profile Action */}
            <Link
              href="/profile/edit"
              aria-label="Edit Profile"
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-[#F0C36B]/50 flex items-center justify-center text-[#A99A88] hover:text-[#FAF5EC] active:scale-95 transition-all shrink-0"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#F0C36B]" />
            </Link>
          </div>

          {/* Middle Row: 3-Metric Stats Bar (Clean 1-Row Compact Grid) */}
          <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-white/[0.08] text-center">
            <div className="flex flex-col items-center">
              <span className="font-mono text-base sm:text-lg font-bold text-[#F8F2E8] leading-tight">
                125
              </span>
              <span className="text-[9px] font-mono tracking-wider text-[#A99A88] uppercase mt-0.5">
                Dining Visits
              </span>
            </div>

            <div className="flex flex-col items-center border-x border-white/[0.08]">
              <div className="flex items-center gap-1 font-serif text-base sm:text-lg font-bold text-[#F0C36B] leading-tight">
                <span>Gold</span>
                <Crown className="w-3 h-3 text-[#F0C36B]" />
              </div>
              <span className="text-[9px] font-mono tracking-wider text-[#A99A88] uppercase mt-0.5">
                Member Tier
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="font-mono text-base sm:text-lg font-bold text-[#F8F2E8] leading-tight">
                ₹12,480
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
              <span className="font-medium truncate">10% Luxury Privilege &amp; Priority Seating</span>
            </div>
            <Link
              href="/menu"
              className="text-[10.5px] font-semibold text-[#FFE1A0] hover:underline shrink-0 flex items-center gap-0.5 ml-2"
            >
              <span>Explore</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PHONE QUICK HUB: 4 TOUCH TARGETS                          */}
        {/* ========================================================= */}
        <div className="grid grid-cols-4 gap-2">
          {/* 1. Bookings */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'reservation' ? 'all' : 'reservation')}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              activeTab === 'reservation'
                ? 'bg-[#E2A84B]/20 border-[#E2A84B] shadow-[0_0_12px_rgba(226,168,75,0.25)]'
                : 'bg-[#140F0B]/85 border-white/10 hover:border-white/20'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#F0C36B] mb-1" />
            <span className="text-[11px] font-bold text-[#F8F2E8] leading-none">Bookings</span>
            <span className="text-[9px] text-[#22C58B] font-mono mt-1 font-semibold leading-none">Tonight</span>
          </button>

          {/* 2. Past Orders */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'orders' ? 'all' : 'orders')}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#E2A84B]/20 border-[#E2A84B] shadow-[0_0_12px_rgba(226,168,75,0.25)]'
                : 'bg-[#140F0B]/85 border-white/10 hover:border-white/20'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#F0C36B] mb-1" />
            <span className="text-[11px] font-bold text-[#F8F2E8] leading-none">Orders</span>
            <span className="text-[9px] text-[#A99A88] font-mono mt-1 leading-none">1 Recent</span>
          </button>

          {/* 3. Tasting Vault */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'vault' ? 'all' : 'vault')}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-[#E2A84B]/20 border-[#E2A84B] shadow-[0_0_12px_rgba(226,168,75,0.25)]'
                : 'bg-[#140F0B]/85 border-white/10 hover:border-white/20'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 mb-1" />
            <span className="text-[11px] font-bold text-[#F8F2E8] leading-none">Vault</span>
            <span className="text-[9px] text-[#A99A88] font-mono mt-1 leading-none">3 Saved</span>
          </button>

          {/* 4. Taste Profile */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'preferences' ? 'all' : 'preferences')}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              activeTab === 'preferences'
                ? 'bg-[#E2A84B]/20 border-[#E2A84B] shadow-[0_0_12px_rgba(226,168,75,0.25)]'
                : 'bg-[#140F0B]/85 border-white/10 hover:border-white/20'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 text-[#F0C36B] mb-1" />
            <span className="text-[11px] font-bold text-[#F8F2E8] leading-none">Taste</span>
            <span className="text-[9px] text-[#F0C36B] font-mono mt-1 font-semibold leading-none">Veg·Mild</span>
          </button>
        </div>

        {/* Filter View Reset Banner (Only if a tab is selected) */}
        {activeTab !== 'all' && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#E2A84B]/10 border border-[#E2A84B]/30 text-xs">
            <span className="text-[11px] text-[#FAF5EC]/80">
              Showing filtered view: <strong className="text-[#E2A84B] capitalize">{activeTab}</strong>
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className="text-[11px] text-[#E2A84B] font-semibold hover:underline"
            >
              Show All
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 1: UPCOMING DINING RESERVATION (COMPACT)          */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'reservation') && (
          <div className="rounded-2xl p-3.5 sm:p-4 bg-[rgba(20,15,11,0.88)] backdrop-blur-xl border border-[rgba(240,195,107,0.28)] shadow-[0_8px_24px_rgba(0,0,0,0.65)] space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#F0C36B]" />
                <h2 className="font-serif text-sm sm:text-base font-bold text-[#F8F2E8]">
                  Upcoming Reservation
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#22C58B]/15 border border-[#22C58B]/50 text-[#22C58B] text-[10px] font-bold font-mono tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C58B] animate-pulse" />
                CONFIRMED
              </span>
            </div>

            {/* Compact Horizontal Body: Thumbnail + Info */}
            <div className="flex items-center gap-3">
              {/* Compact 64x64 Table Photo */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#F0C36B]/30 shrink-0 bg-black/60">
                <img
                  src="/images/profile-bg.jpg"
                  alt="Table 04 Preview"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/75 text-[8px] font-mono text-[#F0C36B] font-bold">
                  T-04
                </span>
              </div>

              {/* Table Info & Booking Chips */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] uppercase font-mono tracking-widest text-[#F0C36B] font-bold">
                    WINDOW BOOTH
                  </span>
                  <span className="text-[10px] text-[#A99A88] font-mono">4 Guests</span>
                </div>

                <h3 className="font-serif text-sm sm:text-base font-bold text-[#F8F2E8] leading-tight truncate">
                  Table 04 - Window Booth
                </h3>

                {/* Inline Schedule Badges */}
                <div className="flex items-center gap-2 text-[10.5px] text-[#A99A88] pt-0.5">
                  <span className="text-[#FAF5EC] font-semibold">Tonight, Oct 26</span>
                  <span>·</span>
                  <span className="text-[#F0C36B] font-mono font-medium">8:30 PM (2h)</span>
                </div>
              </div>
            </div>

            {/* Compact Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.08]">
              <Link
                href="/booking"
                className="py-2 px-3 rounded-lg font-bold text-xs text-[#17100C] text-center transition-all duration-300 hover:brightness-110 active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
                style={{
                  background: 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
                }}
              >
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#17100C]" />
              </Link>

              <Link
                href="/booking"
                className="py-2 px-3 rounded-lg font-semibold text-xs text-[#F8F2E8] bg-white/[0.05] border border-white/10 hover:border-[#F0C36B]/40 transition-all text-center"
              >
                Modify / Cancel
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 2: RECENT CULINARY ORDERS (COMPACT)               */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'orders') && (
          <div className="rounded-2xl p-3.5 sm:p-4 bg-[rgba(20,15,11,0.88)] backdrop-blur-xl border border-[rgba(240,195,107,0.28)] shadow-[0_8px_24px_rgba(0,0,0,0.65)] space-y-3">
            {/* Header */}
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
                <span>View All (1)</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Order Content Row */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#F0C36B] text-[11.5px]">
                    #GO-8492
                  </span>
                  <span className="text-[10px] text-[#A99A88]">· Oct 24 · Dine-In</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#22C58B]/15 border border-[#22C58B]/40 text-[#22C58B] text-[9.5px] font-bold">
                  Delivered
                </span>
              </div>

              {/* Dishes Micro Row */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-black/40 border border-white/10">
                  <img
                    src="/images/dishes/mushroom-truffle-pizza.webp"
                    alt="Wood-Fired Pizza"
                    className="w-7 h-7 rounded-md object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="text-[11px] font-medium text-[#F8F2E8] truncate">Wood-Fired Pizza</p>
                    <p className="font-mono text-[#F0C36B] text-[10px]">₹549 × 1</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-black/40 border border-white/10">
                  <img
                    src="/images/dishes/tandoori-paneer-pizza.webp"
                    alt="Tandoori Paneer Pizza"
                    className="w-7 h-7 rounded-md object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="text-[11px] font-medium text-[#F8F2E8] truncate">Tandoori Paneer</p>
                    <p className="font-mono text-[#F0C36B] text-[10px]">₹449 × 1</p>
                  </div>
                </div>
              </div>

              {/* Total + 1-Tap Reorder */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div>
                  <span className="text-[10.5px] text-[#A99A88]">Total Amount: </span>
                  <span className="font-mono font-bold text-[#F8F2E8] text-xs">₹878.00</span>
                </div>

                <button
                  type="button"
                  onClick={handleReorder}
                  className="py-1.5 px-3 rounded-lg font-bold text-xs text-[#17100C] transition-all hover:brightness-110 active:scale-95 shadow-sm flex items-center gap-1.5 cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
                  }}
                >
                  <RotateCcw className="w-3 h-3 text-[#17100C]" />
                  <span>Reorder (₹878)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 3: YOUR DINING PREFERENCES (COMPACT TASTE PROFILE)*/}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'preferences') && (
          <div className="rounded-2xl p-3.5 sm:p-4 bg-[rgba(20,15,11,0.88)] backdrop-blur-xl border border-[rgba(240,195,107,0.28)] shadow-[0_8px_24px_rgba(0,0,0,0.65)] space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-[#F0C36B]" />
                <h2 className="font-serif text-sm sm:text-base font-bold text-[#F8F2E8]">
                  Dining Preferences
                </h2>
              </div>
              <span className="text-[10px] text-[#A99A88] font-mono">Taste Profile</span>
            </div>

            {/* 4 Compact Touch Pills (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-2">
              {/* 1: Veg Preferred */}
              <button
                type="button"
                onClick={() => handleDietChange('veg', 'Vegetarian')}
                className={`p-2.5 rounded-xl flex items-center gap-2.5 transition-all text-left cursor-pointer border ${
                  selectedDiet === 'veg'
                    ? 'bg-[#F0C36B]/20 border-[#F0C36B] shadow-[0_0_12px_rgba(240,195,107,0.25)]'
                    : 'bg-black/40 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="text-xs font-bold text-[#F8F2E8] truncate">Veg Preferred</p>
                  <p className="text-[9.5px] text-[#A99A88] truncate">Mostly Vegetarian</p>
                </div>
                {selectedDiet === 'veg' && <Check className="w-3 h-3 text-[#F0C36B] shrink-0" />}
              </button>

              {/* 2: Medium Spicy */}
              <button
                type="button"
                onClick={() => handleDietChange('medium', 'Medium Spicy')}
                className={`p-2.5 rounded-xl flex items-center gap-2.5 transition-all text-left cursor-pointer border ${
                  selectedDiet === 'medium'
                    ? 'bg-[#F0C36B]/20 border-[#F0C36B] shadow-[0_0_12px_rgba(240,195,107,0.25)]'
                    : 'bg-black/40 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="text-xs font-bold text-[#F8F2E8] truncate">Medium Spicy</p>
                  <p className="text-[9.5px] text-[#A99A88] truncate">Balanced spice</p>
                </div>
                {selectedDiet === 'medium' && <Check className="w-3 h-3 text-[#F0C36B] shrink-0" />}
              </button>

              {/* 3: Non-Veg */}
              <button
                type="button"
                onClick={() => handleDietChange('non-veg', 'Non-Vegetarian')}
                className={`p-2.5 rounded-xl flex items-center gap-2.5 transition-all text-left cursor-pointer border ${
                  selectedDiet === 'non-veg'
                    ? 'bg-[#F0C36B]/20 border-[#F0C36B] shadow-[0_0_12px_rgba(240,195,107,0.25)]'
                    : 'bg-black/40 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="text-xs font-bold text-[#F8F2E8] truncate">Non-Veg</p>
                  <p className="text-[9.5px] text-[#A99A88] truncate">Also Enjoy</p>
                </div>
                {selectedDiet === 'non-veg' && <Check className="w-3 h-3 text-[#F0C36B] shrink-0" />}
              </button>

              {/* 4: Jain Friendly */}
              <button
                type="button"
                onClick={() => handleDietChange('jain', 'Jain Friendly')}
                className={`p-2.5 rounded-xl flex items-center gap-2.5 transition-all text-left cursor-pointer border ${
                  selectedDiet === 'jain'
                    ? 'bg-[#F0C36B]/20 border-[#F0C36B] shadow-[0_0_12px_rgba(240,195,107,0.25)]'
                    : 'bg-black/40 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-purple-500/15 flex items-center justify-center shrink-0">
                  <Crown className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="text-xs font-bold text-[#F8F2E8] truncate">Jain Friendly</p>
                  <p className="text-[9.5px] text-[#A99A88] truncate">No Onion/Garlic</p>
                </div>
                {selectedDiet === 'jain' && <Check className="w-3 h-3 text-[#F0C36B] shrink-0" />}
              </button>
            </div>

            {/* Cuisine Interests Chips */}
            <div className="space-y-1.5 pt-1">
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
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? 'bg-[#F0C36B]/25 border border-[#F0C36B] text-[#FFE1A0]'
                          : 'bg-black/40 border border-white/10 text-[#A99A88] hover:text-[#F8F2E8]'
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

        {/* ========================================================= */}
        {/* SECTION 4: PERSONAL TASTING VAULT (COMPACT FAVORITES)     */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'vault') && (
          <div className="rounded-2xl p-3.5 sm:p-4 bg-[rgba(20,15,11,0.88)] backdrop-blur-xl border border-[rgba(240,195,107,0.28)] shadow-[0_8px_24px_rgba(0,0,0,0.65)] space-y-3">
            {/* Header */}
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
                <span>Open Vault (3)</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* 3-Dish Micro Grid (Phone-Optimized) */}
            <div className="grid grid-cols-3 gap-2">
              {vaultDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="group flex flex-col p-1.5 rounded-xl bg-black/45 border border-white/10 hover:border-[#F0C36B]/50 transition-all text-left"
                >
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black/50 border border-white/10">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        toggleFavorite(dish.id);
                        toast.info('Vault Updated', `${dish.name}`);
                      }}
                      className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center cursor-pointer"
                      aria-label="Toggle favorite"
                    >
                      <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                    </button>
                  </div>

                  <span className="font-serif text-[11px] font-bold text-[#F8F2E8] truncate group-hover:text-[#F0C36B] transition-colors mt-1.5 leading-tight">
                    {dish.name}
                  </span>

                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-[11px] font-bold text-[#F0C36B]">
                      ₹{dish.price}
                    </span>
                    <Link
                      href={`/3d/${dish.slug}`}
                      className="px-1 py-0.2 rounded bg-[#E2A84B]/20 text-[#E2A84B] text-[8.5px] font-mono font-bold flex items-center gap-0.5"
                    >
                      <Box className="w-2.5 h-2.5" />
                      <span>3D</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 5: HOSPITALITY & ACCOUNT SERVICES (PHONE LIST)    */}
        {/* ========================================================= */}
        <div className="rounded-2xl p-2.5 sm:p-3 bg-[rgba(20,15,11,0.88)] backdrop-blur-xl border border-white/10 space-y-1">
          <a
            href="tel:+919876543210"
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-xs"
          >
            <div className="flex items-center gap-2.5">
              <Phone className="w-3.5 h-3.5 text-[#F0C36B]" />
              <span className="font-medium text-[#F8F2E8]">VIP Table Concierge (+91 98765 43210)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#A99A88]" />
          </a>

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
            href="/auth/login"
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-xs text-rose-400"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-medium">Sign Out / Switch Account</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#A99A88]" />
          </Link>
        </div>

      </div>
    </div>
  );
}
