'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  ShoppingBag,
  Heart,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Check,
  Edit2,
  LogOut,
  QrCode,
  Box,
  Flame,
  Armchair,
  Utensils,
} from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { toast } from '@/store/toast-store';
import { resolveDishImageUrl } from '@/lib/utils/dish-images';

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
  initialBookings = [],
  initialOrders = [],
}: ProfileDashboardClientProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);

  // Palate & Seating Dossier state (persisted in localStorage)
  const [dietaryPref, setDietaryPref] = useState('Non-Veg');
  const [spicePref, setSpicePref] = useState('Medium Fiery');
  const [seatingPref, setSeatingPref] = useState('Window Booth');

  // Foil sheen tilt state for Member Card
  const [foilPos, setFoilPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    try {
      const savedDiet = localStorage.getItem('golden_oak_diet_pref');
      if (savedDiet) setDietaryPref(savedDiet);
      const savedSpice = localStorage.getItem('golden_oak_spice_pref');
      if (savedSpice) setSpicePref(savedSpice);
      const savedSeat = localStorage.getItem('golden_oak_seat_pref');
      if (savedSeat) setSeatingPref(savedSeat);
    } catch {}
  }, []);

  const handleUpdateDiet = (val: string) => {
    setDietaryPref(val);
    try {
      localStorage.setItem('golden_oak_diet_pref', val);
    } catch {}
    toast.success('Palate Preference Updated', `Dietary focus set to ${val}`);
  };

  const handleUpdateSpice = (val: string) => {
    setSpicePref(val);
    try {
      localStorage.setItem('golden_oak_spice_pref', val);
    } catch {}
    toast.success('Palate Preference Updated', `Spice calibration set to ${val}`);
  };

  const handleUpdateSeat = (val: string) => {
    setSeatingPref(val);
    try {
      localStorage.setItem('golden_oak_seat_pref', val);
    } catch {}
    toast.success('Seating Dossier Updated', `Preferred seating set to ${val}`);
  };

  // Reorder Recent Order Action
  const handleReorderPastMeal = () => {
    const burger = {
      id: 'golden-oak-signature-burger',
      slug: 'golden-oak-signature-burger',
      name: 'Golden Oak Signature Burger',
      description: 'Double smashed Wagyu-cut tenderloin with caramelized shallots and truffle glaze.',
      price: 429,
      image: resolveDishImageUrl('golden-oak-signature-burger'),
      category: 'burger' as const,
      isVeg: false,
      isAvailable: true,
      isFeatured: true,
      isBestSeller: true,
      spiceLevel: 'medium' as const,
      has3DModel: true,
    };

    const pizza = {
      id: 'tandoori-paneer-pizza',
      slug: 'tandoori-paneer-pizza',
      name: 'Tandoori Paneer Pizza',
      description: 'Charcoal-grilled cottage cheese with bell peppers and fresh herbs.',
      price: 449,
      image: resolveDishImageUrl('tandoori-paneer-pizza'),
      category: 'pizza' as const,
      isVeg: true,
      isAvailable: true,
      isFeatured: true,
      isBestSeller: true,
      spiceLevel: 'medium' as const,
      has3DModel: true,
    };

    addItem(burger, 1);
    addItem(pizza, 1);
    toast.success('Past Order Re-added to Bag', 'Golden Oak Burger & Tandoori Pizza (₹878)');
    router.push('/cart');
  };

  const displayName = profile?.name || 'Pyiush Gupta';
  const displayEmail = user?.email || 'pyiush.999@gmail.com';

  // Compute initials: Pyiush Gupta -> PG
  const parts = displayName.trim().split(/\s+/);
  const initials = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : 'PG';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFoilPos({ x, y });
  };

  return (
    <div className="relative min-h-screen bg-[#0D0A08] text-[#FAF5EC] overflow-x-hidden selection:bg-[#E2A84B] selection:text-[#0D0A08] pb-28">
      {/* Background Layer 2: Dual Radial Aura */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[700px] z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 35% at 50% 12%, rgba(14, 31, 24, 0.85) 0%, rgba(226, 168, 75, 0.08) 35%, transparent 75%)',
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
      <div className="max-w-[1280px] mx-auto border-l border-r border-[#E2A84B]/[0.07] min-h-screen relative z-10 px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-8">
        {/* ========================================================= */}
        {/* ZONE A: Top Member Identity & Privilege Card              */}
        {/* ========================================================= */}
        <div
          onMouseMove={handleMouseMove}
          className="relative rounded-2xl p-6 sm:p-9 border overflow-hidden shadow-2xl transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #0E1F18 0%, #15110E 60%, #100C0A 100%)',
            borderColor: 'rgba(226, 168, 75, 0.3)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
          }}
        >
          {/* Interactive Metallic Foil Sheen */}
          <div
            className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 350px at ${foilPos.x}% ${foilPos.y}%, rgba(246, 211, 134, 0.12), transparent 70%)`,
            }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left: Crest & Member Details */}
            <div className="flex items-center gap-5">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#0D0A08] border-2 border-[#E2A84B] flex items-center justify-center shrink-0 shadow-xl relative group">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#E2A84B] tracking-wider select-none">
                  {initials}
                </span>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#22C58B] border-2 border-[#0D0A08] flex items-center justify-center text-[10px] text-black font-extrabold">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono tracking-[0.22em] text-[#E2A84B] uppercase font-bold">
                    <Sparkles className="w-3 h-3 text-[#E2A84B]" />
                    <span>GOLDEN OAK PRIVÉ MEMBER · TIER I</span>
                  </span>
                </div>
                <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#FAF5EC] tracking-tight">
                  {displayName}
                </h1>
                <p className="text-xs sm:text-sm text-[#9A9286] font-light">
                  {displayEmail}
                </p>
              </div>
            </div>

            {/* Right: 3 Clean Stats + Header Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto justify-between lg:justify-end pt-4 lg:pt-0 border-t lg:border-t-0 border-white/10">
              {/* Stats Bar */}
              <div className="flex items-center gap-5 text-center">
                <div className="space-y-0.5 text-left sm:text-center">
                  <span className="block font-mono text-base sm:text-lg font-bold text-[#FAF5EC]">
                    04
                  </span>
                  <span className="block text-[9.5px] font-mono tracking-wider text-[#9A9286] uppercase">
                    PAST DINNERS
                  </span>
                </div>

                <div className="w-px h-8 bg-white/15" />

                <div className="space-y-0.5 text-left sm:text-center">
                  <span className="block font-mono text-base sm:text-lg font-bold text-[#22C58B]">
                    01
                  </span>
                  <span className="block text-[9.5px] font-mono tracking-wider text-[#9A9286] uppercase">
                    UPCOMING TABLE
                  </span>
                </div>

                <div className="w-px h-8 bg-white/15" />

                <div className="space-y-0.5 text-left sm:text-center">
                  <span className="block font-mono text-base sm:text-lg font-bold text-[#E2A84B]">
                    ₹240
                  </span>
                  <span className="block text-[9.5px] font-mono tracking-wider text-[#9A9286] uppercase">
                    DINING CREDITS
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  href="/profile/edit"
                  className="px-3.5 py-2 rounded-[6px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-xs font-semibold text-[#FAF5EC] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#E2A84B]" />
                  <span>Edit Profile</span>
                </Link>

                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-[6px] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-[#F43F5E] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ZONE B: Main 12-Column Luxury Bento Grid                   */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          {/* ======================================================= */}
          {/* LEFT 7 COLUMNS: Active Reservation + Order History      */}
          {/* ======================================================= */}
          <div className="lg:col-span-7 space-y-7">
            {/* Card 1: Active & Upcoming Reservation Ticket Preview */}
            <div
              className="rounded-2xl p-6 sm:p-7 border relative overflow-hidden shadow-xl"
              style={{
                background: '#15110E',
                borderTop: '2px solid #E2A84B',
                borderColor: 'rgba(226, 168, 75, 0.22)',
              }}
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#E2A84B]" />
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#FAF5EC]">
                    Upcoming Dining Reservation
                  </h3>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-[#22C58B]/15 border border-[#22C58B]/30 text-[10px] font-mono font-bold text-[#22C58B] uppercase tracking-wider">
                  CONCIERGE HOLD ACTIVE
                </span>
              </div>

              {/* Live Ticket Pass */}
              <div
                className="p-5 rounded-xl border relative overflow-hidden space-y-4"
                style={{
                  background: 'linear-gradient(135deg, #0E1F18 0%, #17120E 100%)',
                  borderColor: 'rgba(226, 168, 75, 0.3)',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-[#E2A84B] uppercase font-bold">
                      TABLE ALLOCATION · TIER I
                    </span>
                    <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF5EC] mt-0.5">
                      TABLE 04 · WINDOW BOOTH
                    </h4>
                    <p className="text-xs text-[#9A9286] font-light mt-0.5">
                      Heated hearth view with panoramic botanical garden alignment
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-black/60 border border-[#E2A84B]/40 flex items-center justify-center p-1">
                      <QrCode className="w-9 h-9 text-[#E2A84B]" />
                    </div>
                  </div>
                </div>

                {/* Ticket Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-[#9A9286] block font-mono">
                      SEATING PERIOD
                    </span>
                    <strong className="text-[#FAF5EC] font-semibold">Tonight · 8:30 PM</strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-[#9A9286] block font-mono">
                      PARTY SIZE
                    </span>
                    <strong className="text-[#FAF5EC] font-semibold">4 Guests</strong>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase text-[#9A9286] block font-mono">
                      OCCASION
                    </span>
                    <strong className="text-[#E2A84B] font-semibold">
                      Private Tasting
                    </strong>
                  </div>
                </div>

                {/* Ticket Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Link
                    href="/profile/reservations"
                    className="px-4 py-2 rounded-[6px] text-xs font-bold text-[#0D0A08] transition-all hover:brightness-110 active:scale-95 shadow-md flex items-center gap-1.5"
                    style={{
                      background:
                        'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                    }}
                  >
                    <span>View Live QR Pass &amp; Modify</span>
                    <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </Link>

                  <Link
                    href="/booking"
                    className="px-4 py-2 rounded-[6px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-[#FAF5EC] transition-all"
                  >
                    Book Additional Table
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2: Recent Culinary Orders & 1-Click Reorder */}
            <div
              className="rounded-2xl p-6 sm:p-7 border relative overflow-hidden shadow-xl"
              style={{
                background: '#15110E',
                borderColor: 'rgba(226, 168, 75, 0.22)',
              }}
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#E2A84B]" />
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#FAF5EC]">
                    Recent Culinary Orders
                  </h3>
                </div>

                <Link
                  href="/profile/orders"
                  className="text-xs text-[#E2A84B] hover:text-[#FAF5EC] font-medium flex items-center gap-1 transition-colors"
                >
                  <span>View All Past Orders</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Order Showcase Item */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#0D0A08] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#9A9286]">
                    <span>Order #GO-8492 · Dine-In Table 04</span>
                    <span className="font-mono text-[#E2A84B]">Yesterday, 9:15 PM</span>
                  </div>

                  {/* 2 Displaced dishes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-black/60 border border-white/10">
                        <Image
                          src={resolveDishImageUrl('golden-oak-signature-burger')}
                          alt="Golden Oak Burger"
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-serif font-bold text-[#FAF5EC] truncate">
                          Golden Oak Signature Burger
                        </p>
                        <p className="text-[11px] font-mono text-[#9A9286]">1 × ₹429</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-black/60 border border-white/10">
                        <Image
                          src={resolveDishImageUrl('tandoori-paneer-pizza')}
                          alt="Tandoori Pizza"
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-serif font-bold text-[#FAF5EC] truncate">
                          Tandoori Paneer Pizza
                        </p>
                        <p className="text-[11px] font-mono text-[#9A9286]">1 × ₹449</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Footer with 1-Click Reorder */}
                  <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
                    <div>
                      <span className="text-[10px] text-[#9A9286] uppercase font-mono block">
                        TOTAL BILLED
                      </span>
                      <span className="font-mono text-sm font-bold text-[#FAF5EC]">
                        ₹878.00 (2 Dishes)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleReorderPastMeal}
                      className="px-4 py-2 rounded-[6px] text-xs font-bold text-[#0D0A08] transition-all hover:brightness-110 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                      style={{
                        background:
                          'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                      }}
                    >
                      <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>↻ Instant Reorder</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* RIGHT 5 COLUMNS: Palate Dossier + Tasting Vault Preview  */}
          {/* ======================================================= */}
          <div className="lg:col-span-5 space-y-7">
            {/* Card 3: Dining Preferences & Palate Dossier */}
            <div
              className="rounded-2xl p-6 sm:p-7 border relative overflow-hidden shadow-xl"
              style={{
                background: '#15110E',
                borderColor: 'rgba(226, 168, 75, 0.22)',
              }}
            >
              <div className="pb-4 mb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#E2A84B]" />
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#FAF5EC]">
                    Your Palate &amp; Seating Dossier
                  </h3>
                </div>
                <p className="text-xs text-[#9A9286] font-light mt-0.5">
                  Synchronized live with Executive Chef &amp; Maître d&apos; allocation
                </p>
              </div>

              {/* Dossier Toggle Groups */}
              <div className="space-y-4">
                {/* 1. Dietary Focus */}
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-widest text-[#E2A84B] font-bold block mb-1.5">
                    DIETARY PREFERENCE
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Veg Only', 'Non-Veg', 'Jain / Truffle Lover'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleUpdateDiet(opt)}
                        className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          dietaryPref === opt
                            ? 'bg-[#0E1F18] border border-[#E2A84B] text-[#FAF5EC] shadow-sm'
                            : 'bg-[#0D0A08] border border-white/10 text-[#9A9286] hover:text-[#FAF5EC]'
                        }`}
                      >
                        {dietaryPref === opt && <Check className="w-3 h-3 inline mr-1 text-[#22C58B]" />}
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Spice Calibration */}
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-widest text-[#E2A84B] font-bold block mb-1.5">
                    SPICE CALIBRATION
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Mild', 'Medium Fiery', "Chef's Heat"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleUpdateSpice(opt)}
                        className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          spicePref === opt
                            ? 'bg-[#0E1F18] border border-[#E2A84B] text-[#FAF5EC] shadow-sm'
                            : 'bg-[#0D0A08] border border-white/10 text-[#9A9286] hover:text-[#FAF5EC]'
                        }`}
                      >
                        {spicePref === opt && <Check className="w-3 h-3 inline mr-1 text-[#22C58B]" />}
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Seating Preference */}
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-widest text-[#E2A84B] font-bold block mb-1.5">
                    PREFERRED SEATING ZONE
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Window Booth', 'Wood-Fired Hearth View', 'Quiet Corner'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleUpdateSeat(opt)}
                        className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          seatingPref === opt
                            ? 'bg-[#0E1F18] border border-[#E2A84B] text-[#FAF5EC] shadow-sm'
                            : 'bg-[#0D0A08] border border-white/10 text-[#9A9286] hover:text-[#FAF5EC]'
                        }`}
                      >
                        {seatingPref === opt && <Check className="w-3 h-3 inline mr-1 text-[#22C58B]" />}
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dossier footer sync notice */}
              <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center gap-2 text-[11px] text-[#22C58B]">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Automatic table assignment matches your preferences</span>
              </div>
            </div>

            {/* Card 4: Personal Tasting Vault Preview */}
            <div
              className="rounded-2xl p-6 sm:p-7 border relative overflow-hidden shadow-xl"
              style={{
                background: '#15110E',
                borderColor: 'rgba(226, 168, 75, 0.22)',
              }}
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#E0532B] fill-[#E0532B]" />
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#FAF5EC]">
                    Personal Tasting Vault
                  </h3>
                </div>

                <Link
                  href="/favorites"
                  className="text-xs text-[#E2A84B] hover:text-[#FAF5EC] font-medium flex items-center gap-1 transition-colors"
                >
                  <span>Open Vault →</span>
                </Link>
              </div>

              {/* Mini Dish Thumbnails */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  {
                    slug: 'mushroom-truffle-pizza',
                    name: 'Mushroom Truffle Pizza',
                    price: 549,
                  },
                  {
                    slug: 'classic-smash-burger',
                    name: 'Classic Smash Burger',
                    price: 349,
                  },
                  {
                    slug: 'dynamite-chilli-potatoes',
                    name: 'Dynamite Potatoes',
                    price: 279,
                  },
                ].map((item) => (
                  <Link
                    key={item.slug}
                    href={`/3d/${item.slug}`}
                    className="group relative rounded-lg overflow-hidden bg-black/60 border border-white/10 p-2 text-center hover:border-[#E2A84B]/40 transition-all block"
                  >
                    <div className="relative aspect-square w-full rounded overflow-hidden mb-1.5">
                      <Image
                        src={resolveDishImageUrl(item.slug)}
                        alt={item.name}
                        fill
                        sizes="72px"
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[8px] font-mono text-[#E2A84B] flex items-center gap-0.5">
                        <Box className="w-2 h-2" /> 3D
                      </span>
                    </div>
                    <p className="font-serif text-[11px] font-bold text-[#FAF5EC] truncate">
                      {item.name}
                    </p>
                    <span className="font-mono text-[10px] text-[#E2A84B]">
                      ₹{item.price}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-[#9A9286]">Curated Dining Repertoire</span>
                <Link
                  href="/favorites"
                  className="text-[#FAF5EC] hover:text-[#E2A84B] font-semibold flex items-center gap-1"
                >
                  <span>View All Saved Items</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
