'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Star,
  Award,
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

export function ProfileDashboardClient({
  user,
  profile,
}: ProfileDashboardClientProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

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

  const parts = displayName.trim().split(/\s+/);
  const initials =
    parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : 'PG';

  // Toggle Cuisine Tag
  const toggleCuisine = (c: string) => {
    setActiveCuisines((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
    );
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
    },
    {
      id: 'classic-smash-burger',
      slug: 'classic-smash-burger',
      name: 'Classic Smash Burger',
      price: 449,
      image: '/images/dishes/classic-smash-burger.webp',
    },
    {
      id: 'dynamite-chilli-potatoes',
      slug: 'dynamite-chilli-potatoes',
      name: 'Dynamite Potatoes',
      price: 279,
      image: '/images/dishes/dynamite-chilli-potatoes.webp',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#0B0907] text-[#F8F2E8] select-none pb-20">
      {/* 1. Photorealistic Luxury Restaurant Background */}
      <div
        className="fixed inset-0 pointer-events-none bg-cover bg-center transition-opacity duration-700 z-0"
        style={{
          backgroundImage: "url('/images/profile-bg.jpg')",
          backgroundPosition: 'center 40%',
          backgroundSize: 'cover',
          opacity: 0.95,
        }}
      />

      {/* 2. Soft Ambient Vignette Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(11, 9, 7, 0.45) 20%, rgba(11, 9, 7, 0.75) 75%, rgba(11, 9, 7, 0.95) 100%)',
        }}
      />

      {/* 3. Main Glassmorphic Dashboard Layout */}
      <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* ========================================================= */}
        {/* TOP HERO CARD: Member Identity, Stats & Exclusive Perks */}
        {/* ========================================================= */}
        <div className="rounded-3xl p-5 sm:p-7 xl:p-8 bg-[rgba(20,15,11,0.82)] backdrop-blur-2xl border border-[rgba(240,195,107,0.30)] shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5 sm:gap-6 overflow-hidden">
          {/* Left Zone: Member Crest & Details */}
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            {/* Double Gold Concentric Ring Avatar */}
            <div className="relative shrink-0">
              <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full p-1 bg-gradient-to-tr from-[#F0C36B] via-[#DDA33E] to-[#FFE1A0] shadow-[0_0_24px_rgba(240,195,107,0.35)]">
                <div className="w-full h-full rounded-full bg-[#120D09] flex items-center justify-center border border-[#F0C36B]/40">
                  <span className="font-serif text-xl sm:text-2xl font-bold text-[#F8F2E8] tracking-wider">
                    {initials}
                  </span>
                </div>
              </div>
              {/* Green Verified Checkmark Badge */}
              <div className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#22C58B] border-2 border-[#120D09] flex items-center justify-center text-[#120D09] shadow-md">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </div>

            {/* Name, Tier & Quote */}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F0C36B]/15 border border-[#F0C36B]/40 text-[#FFE1A0] text-[10px] font-semibold tracking-wider uppercase font-mono">
                  <Crown className="w-3 h-3 text-[#F0C36B]" />
                  <span>LOYAL DINER · GOLD MEMBER</span>
                </div>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F2E8] tracking-tight truncate">
                {displayName}
              </h1>

              <div className="flex items-center gap-2 text-xs sm:text-[13px] text-[#A99A88]">
                <Mail className="w-3.5 h-3.5 text-[#F0C36B] shrink-0" />
                <span className="truncate">{displayEmail}</span>
              </div>

              <p className="font-serif italic text-xs text-[#F0C36B]/90 pt-0.5 hidden sm:block">
                “Good food is not just a meal, it’s an experience.”
              </p>
            </div>
          </div>

          {/* Center Zone: 3 Precision Dining Stats */}
          <div className="flex items-center justify-around sm:justify-center gap-4 sm:gap-6 xl:gap-8 w-full xl:w-auto py-3 xl:py-0 border-y xl:border-y-0 xl:border-x border-white/10 xl:px-6 2xl:px-8 shrink-0">
            {/* Stat 1: Total Dining Visits */}
            <div className="flex flex-col items-center text-center">
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#F8F2E8]">
                125
              </span>
              <span className="text-[9.5px] sm:text-[10.5px] font-mono tracking-wider text-[#A99A88] uppercase font-semibold mt-0.5">
                TOTAL DINING VISITS
              </span>
            </div>

            <div className="w-[1px] h-8 bg-white/10 hidden sm:block" />

            {/* Stat 2: Member Tier */}
            <div className="flex items-center gap-1 font-serif text-xl sm:text-2xl font-bold text-[#F0C36B]">
              <span>Gold</span>
              <Crown className="w-4 h-4 text-[#F0C36B]" />
            </div>

            <div className="w-[1px] h-8 bg-white/10 hidden sm:block" />

            {/* Stat 3: Total Spent */}
            <div className="flex flex-col items-center text-center">
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#F8F2E8]">
                ₹12,480
              </span>
              <span className="text-[9.5px] sm:text-[10.5px] font-mono tracking-wider text-[#A99A88] uppercase font-semibold mt-0.5">
                TOTAL SPENT
              </span>
            </div>
          </div>

          {/* Right Zone: Exclusive Member Perks Card Widget (Fits neatly inside container) */}
          <Link
            href="/menu"
            className="group flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-black/45 border border-[#F0C36B]/30 hover:border-[#F0C36B] hover:shadow-[0_0_20px_rgba(240,195,107,0.25)] transition-all shrink-0 w-full xl:w-auto xl:max-w-[270px]"
          >
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-[#F0C36B]/40 shrink-0">
              <img
                src="/images/dishes/mushroom-truffle-pizza.webp"
                alt="Member Perks Preview"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col min-w-0 pr-1">
              <span className="font-serif italic text-sm sm:text-[15px] font-bold text-[#F0C36B] leading-snug truncate">
                Exclusive Member Perks
              </span>
              <span className="text-[11px] text-[#A99A88] leading-tight mt-0.5 line-clamp-2">
                Special menus, early access &amp; more
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#F0C36B] group-hover:translate-x-1 transition-transform ml-auto shrink-0" />
          </Link>
        </div>

        {/* ========================================================= */}
        {/* MIDDLE ROW: Upcoming Reservation + Dining Preferences     */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card 1: Upcoming Dining Reservation (7 Columns) */}
          <div className="lg:col-span-7 rounded-3xl p-6 sm:p-7 bg-[rgba(20,15,11,0.82)] backdrop-blur-2xl border border-[rgba(240,195,107,0.30)] shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-[#F0C36B]" />
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#F8F2E8]">
                  Upcoming Dining Reservation
                </h2>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#22C58B]/15 border border-[#22C58B]/50 text-[#22C58B] text-xs font-bold font-mono tracking-wider">
                CONFIRMED
              </span>
            </div>

            {/* Content Body */}
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 py-5">
              {/* Table Photo Preview */}
              <div className="relative w-full sm:w-44 h-44 rounded-2xl overflow-hidden border border-[#F0C36B]/35 shrink-0 bg-black/50">
                <img
                  src="/images/profile-bg.jpg"
                  alt="Table 04 - Window Booth"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Reservation Details */}
              <div className="flex-1 space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#F0C36B] font-bold">
                    TABLE 04 · WINDOW BOOTH
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#F8F2E8] leading-tight mt-0.5">
                    Table 04 - Window Booth
                  </h3>
                  <p className="text-xs text-[#A99A88] font-light leading-relaxed mt-1">
                    A serene corner with panoramic garden views, perfect for intimate dining.
                  </p>
                </div>

                {/* 4 Detail Badges Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/10 text-[#F8F2E8]">
                    <Calendar className="w-3.5 h-3.5 text-[#F0C36B]" />
                    <div className="flex flex-col leading-tight">
                      <span className="font-bold">Tonight</span>
                      <span className="text-[10px] text-[#A99A88]">Oct 26, 2026</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/10 text-[#F8F2E8]">
                    <Clock className="w-3.5 h-3.5 text-[#F0C36B]" />
                    <div className="flex flex-col leading-tight">
                      <span className="font-bold">8:30 PM</span>
                      <span className="text-[10px] text-[#A99A88]">(2 Hours)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/10 text-[#F8F2E8]">
                    <Users className="w-3.5 h-3.5 text-[#F0C36B]" />
                    <div className="flex flex-col leading-tight">
                      <span className="font-bold">4 Guests</span>
                      <span className="text-[10px] text-[#A99A88]">Private Booth</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/10 text-[#F8F2E8]">
                    <BellRing className="w-3.5 h-3.5 text-[#F0C36B]" />
                    <div className="flex flex-col leading-tight">
                      <span className="font-bold">Private Tasting</span>
                      <span className="text-[10px] text-[#A99A88]">(Seasonal Menu)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Pair */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-white/10">
              <Link
                href="/booking"
                className="w-full sm:flex-1 py-3 px-5 rounded-xl font-bold text-xs sm:text-sm text-[#17100C] text-center transition-all duration-300 hover:brightness-110 active:scale-95 shadow-md flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
                }}
              >
                <span>View Reservation Details →</span>
              </Link>

              <Link
                href="/booking"
                className="w-full sm:w-auto py-3 px-6 rounded-xl font-semibold text-xs sm:text-sm text-[#F8F2E8] bg-black/45 border border-[#F0C36B]/30 hover:border-[#F0C36B] transition-all text-center"
              >
                <span>Modify / Cancel</span>
              </Link>
            </div>
          </div>

          {/* Card 2: Your Dining Preferences (5 Columns) */}
          <div className="lg:col-span-5 rounded-3xl p-6 sm:p-7 bg-[rgba(20,15,11,0.82)] backdrop-blur-2xl border border-[rgba(240,195,107,0.30)] shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-[#F0C36B]" />
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-[#F8F2E8]">
                    Your Dining Preferences
                  </h2>
                </div>
                <p className="text-xs text-[#A99A88] mt-1 font-light">
                  We craft your experience, your way.
                </p>
              </div>

              <button
                type="button"
                onClick={() => toast.info('Preference Editor', 'Select your taste profile below.')}
                className="text-xs font-semibold text-[#F0C36B] hover:text-[#FFE1A0] transition-colors shrink-0 cursor-pointer"
              >
                Edit Preferences →
              </button>
            </div>

            {/* 4 Interactive Preference Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-4">
              {/* 1: Veg Preferred */}
              <button
                type="button"
                onClick={() => setSelectedDiet('veg')}
                className={`p-3 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer ${
                  selectedDiet === 'veg'
                    ? 'bg-[#F0C36B]/20 border border-[#F0C36B] shadow-[0_0_15px_rgba(240,195,107,0.3)]'
                    : 'bg-black/45 border border-white/10 hover:border-white/20'
                }`}
              >
                <Leaf className="w-4 h-4 text-[#F0C36B] mb-1.5" />
                <span className="text-xs font-bold text-[#F8F2E8] leading-tight">
                  Veg Preferred
                </span>
                <span className="text-[10px] text-[#A99A88] leading-tight mt-0.5">
                  Mostly Vegetarian
                </span>
              </button>

              {/* 2: Medium Spicy */}
              <button
                type="button"
                onClick={() => setSelectedDiet('medium')}
                className={`p-3 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer ${
                  selectedDiet === 'medium'
                    ? 'bg-[#F0C36B]/20 border border-[#F0C36B] shadow-[0_0_15px_rgba(240,195,107,0.3)]'
                    : 'bg-black/45 border border-white/10 hover:border-white/20'
                }`}
              >
                <Flame className="w-4 h-4 text-[#F0C36B] mb-1.5" />
                <span className="text-xs font-bold text-[#F8F2E8] leading-tight">
                  Medium Spicy
                </span>
                <span className="text-[10px] text-[#A99A88] leading-tight mt-0.5">
                  Your Spice Level
                </span>
              </button>

              {/* 3: Non-Veg */}
              <button
                type="button"
                onClick={() => setSelectedDiet('non-veg')}
                className={`p-3 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer ${
                  selectedDiet === 'non-veg'
                    ? 'bg-[#F0C36B]/20 border border-[#F0C36B] shadow-[0_0_15px_rgba(240,195,107,0.3)]'
                    : 'bg-black/45 border border-white/10 hover:border-white/20'
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#F0C36B] mb-1.5" />
                <span className="text-xs font-bold text-[#F8F2E8] leading-tight">
                  Non-Veg
                </span>
                <span className="text-[10px] text-[#A99A88] leading-tight mt-0.5">
                  Also Enjoy
                </span>
              </button>

              {/* 4: Jain Friendly */}
              <button
                type="button"
                onClick={() => setSelectedDiet('jain')}
                className={`p-3 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer ${
                  selectedDiet === 'jain'
                    ? 'bg-[#F0C36B]/20 border border-[#F0C36B] shadow-[0_0_15px_rgba(240,195,107,0.3)]'
                    : 'bg-black/45 border border-white/10 hover:border-white/20'
                }`}
              >
                <Award className="w-4 h-4 text-[#F0C36B] mb-1.5" />
                <span className="text-xs font-bold text-[#F8F2E8] leading-tight">
                  Jain Friendly
                </span>
                <span className="text-[10px] text-[#A99A88] leading-tight mt-0.5">
                  No Onion / Garlic
                </span>
              </button>
            </div>

            {/* Cuisine Interests Tags */}
            <div className="space-y-2 pt-1 border-t border-white/10">
              <span className="text-[10.5px] uppercase font-mono tracking-wider text-[#F0C36B] font-bold">
                Cuisine Interests
              </span>
              <div className="flex flex-wrap gap-2">
                {['Italian', 'Mediterranean', 'Asian', 'Continental', 'Indian'].map((cuisine) => {
                  const isActive = activeCuisines.includes(cuisine);
                  return (
                    <button
                      key={cuisine}
                      type="button"
                      onClick={() => toggleCuisine(cuisine)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#F0C36B]/25 border border-[#F0C36B] text-[#FFE1A0]'
                          : 'bg-black/40 border border-white/10 text-[#A99A88] hover:text-[#F8F2E8]'
                      }`}
                    >
                      {cuisine}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Tip */}
            <div className="flex items-center gap-2 pt-3 text-[11px] text-[#A99A88]">
              <Leaf className="w-3.5 h-3.5 text-[#F0C36B] shrink-0" />
              <span>Your preferences help us curate a better dining experience.</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM ROW: Recent Orders + Personal Tasting Vault        */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card 3: Recent Culinary Orders (7 Columns) */}
          <div className="lg:col-span-7 rounded-3xl p-6 sm:p-7 bg-[rgba(20,15,11,0.82)] backdrop-blur-2xl border border-[rgba(240,195,107,0.30)] shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#F0C36B]" />
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#F8F2E8]">
                  Recent Culinary Orders
                </h2>
              </div>
              <Link
                href="/profile/orders"
                className="text-xs font-semibold text-[#F0C36B] hover:text-[#FFE1A0] transition-colors"
              >
                View All Orders →
              </Link>
            </div>

            {/* Order Card Item */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
              {/* Order Dish Photo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-[#F0C36B]/35 bg-black/50 shrink-0">
                <img
                  src="/images/dishes/pizza.jpg"
                  alt="Recent Order Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Order Meta + Dishes */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#F0C36B]">
                    Order #GO-8492
                  </span>
                  <span className="text-xs text-[#A99A88]">· Oct 24, 2026 · Dine-In</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#22C58B]/15 border border-[#22C58B]/40 text-[#22C58B] text-[10px] font-bold">
                    Delivered
                  </span>
                </div>

                {/* Ordered Items Mini Thumbnails */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 p-1.5 px-2 rounded-xl bg-black/40 border border-white/10">
                    <img
                      src="/images/dishes/mushroom-truffle-pizza.webp"
                      alt="Wood-Fired Pizza"
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <div className="flex flex-col text-xs leading-none">
                      <span className="font-medium text-[#F8F2E8]">Wood-Fired Pizza</span>
                      <span className="font-mono text-[#F0C36B] text-[10px] mt-0.5">₹549 × 1</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-1.5 px-2 rounded-xl bg-black/40 border border-white/10">
                    <img
                      src="/images/dishes/tandoori-paneer-pizza.webp"
                      alt="Tandoori Paneer Pizza"
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <div className="flex flex-col text-xs leading-none">
                      <span className="font-medium text-[#F8F2E8]">Tandoori Paneer Pizza</span>
                      <span className="font-mono text-[#F0C36B] text-[10px] mt-0.5">₹449 × 1</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-[#A99A88]">
                  <span>Total Amount: </span>
                  <span className="font-mono font-bold text-[#F8F2E8]">₹878.00 (2 Dishes)</span>
                </div>
              </div>

              {/* Reorder Button */}
              <button
                type="button"
                onClick={handleReorder}
                className="py-2.5 px-5 rounded-xl font-bold text-xs text-[#17100C] transition-all duration-300 hover:brightness-110 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
                }}
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#17100C]" />
                <span>Reorder</span>
              </button>
            </div>
          </div>

          {/* Card 4: Personal Tasting Vault (5 Columns) */}
          <div className="lg:col-span-5 rounded-3xl p-6 sm:p-7 bg-[rgba(20,15,11,0.82)] backdrop-blur-2xl border border-[rgba(240,195,107,0.30)] shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-[#F8F2E8]">
                    Personal Tasting Vault
                  </h2>
                </div>
                <p className="text-xs text-[#A99A88] mt-1 font-light">
                  Save your favorite dishes for later.
                </p>
              </div>

              <Link
                href="/favorites"
                className="text-xs font-semibold text-[#F0C36B] hover:text-[#FFE1A0] transition-colors shrink-0"
              >
                Open Vault →
              </Link>
            </div>

            {/* Dishes Carousel */}
            <div className="relative py-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setVaultIndex((i) => Math.max(0, i - 1))}
                disabled={vaultIndex === 0}
                className="w-7 h-7 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-[#F0C36B] disabled:opacity-30 disabled:pointer-events-none cursor-pointer shrink-0"
                aria-label="Previous dish"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-3 gap-2.5 flex-1">
                {vaultDishes.map((dish) => (
                  <Link
                    key={dish.id}
                    href={`/3d/${dish.slug}`}
                    className="group flex flex-col p-2 rounded-2xl bg-black/45 border border-white/10 hover:border-[#F0C36B]/50 transition-all"
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/50 border border-white/10">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center">
                        <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                      </div>
                    </div>
                    <span className="font-serif text-xs font-bold text-[#F8F2E8] truncate group-hover:text-[#F0C36B] transition-colors mt-2">
                      {dish.name}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#F0C36B] mt-0.5">
                      ₹{dish.price}
                    </span>
                  </Link>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setVaultIndex((i) => Math.min(vaultDishes.length - 1, i + 1))}
                className="w-7 h-7 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-[#F0C36B] disabled:opacity-30 disabled:pointer-events-none cursor-pointer shrink-0"
                aria-label="Next dish"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Pagination Dots */}
            <div className="flex items-center justify-center gap-1.5 pt-2">
              <span className="w-2 h-2 rounded-full bg-[#F0C36B]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM FEATURE STRIP: 4 Luxury Member Privileges           */}
        {/* ========================================================= */}
        <div className="py-4 px-6 rounded-2xl bg-[rgba(20,15,11,0.70)] backdrop-blur-xl border border-white/10 flex flex-wrap items-center justify-around gap-4 text-xs text-[#F8F2E8]/85">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-[#F0C36B]" />
            <span className="font-medium">Exclusive Member Benefits</span>
          </div>

          <div className="w-[1px] h-4 bg-white/15 hidden md:block" />

          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#F0C36B]" />
            <span className="font-medium">Priority Table Access</span>
          </div>

          <div className="w-[1px] h-4 bg-white/15 hidden md:block" />

          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-[#F0C36B]" />
            <span className="font-medium">Special Events &amp; Tastings</span>
          </div>

          <div className="w-[1px] h-4 bg-white/15 hidden md:block" />

          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-[#F0C36B]" />
            <span className="font-medium">Personalized Recommendations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
