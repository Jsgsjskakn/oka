'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, Sparkles, Box, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useFavoritesStore } from '@/store/favorites-store';
import { useCartStore } from '@/store/cart-store';
import { toast } from '@/store/toast-store';
import { FavoriteDishCard } from '@/components/favorites/FavoriteDishCard';
import { resolveDishImageUrl } from '@/lib/utils/dish-images';
import type { Dish } from '@/types/menu';

export function FavoritesClient({ allDishes }: { allDishes: Dish[] }) {
  const router = useRouter();
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const addItem = useCartStore((s) => s.addItem);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const favoriteDishes = useMemo(() => {
    return allDishes.filter((dish) => favoriteIds.includes(dish.id));
  }, [allDishes, favoriteIds]);

  const totalVaultPrice = useMemo(() => {
    return favoriteDishes.reduce((sum, d) => sum + d.price, 0);
  }, [favoriteDishes]);

  // Curate 4 Signature Dishes for 1-Tap Discovery Row
  const recommendedDishes = useMemo(() => {
    const targets = [
      'tandoori-paneer-pizza',
      'classic-smash-burger',
      'mushroom-truffle-pizza',
      'dynamite-chilli-potatoes',
    ];
    const found: Dish[] = [];
    for (const target of targets) {
      const match = allDishes.find(
        (d) =>
          d.slug === target ||
          d.id === target ||
          (target === 'classic-smash-burger' && d.slug.includes('burger')) ||
          (target === 'dynamite-chilli-potatoes' &&
            (d.slug.includes('chilli') || d.slug.includes('potato') || d.category === 'starters'))
      );
      if (match && !found.some((f) => f.id === match.id)) {
        found.push(match);
      }
    }
    for (const d of allDishes) {
      if (found.length >= 4) break;
      if (!found.some((f) => f.id === d.id)) {
        found.push(d);
      }
    }
    return found;
  }, [allDishes]);

  const handleAddAllToBag = () => {
    if (favoriteDishes.length === 0) return;
    for (const dish of favoriteDishes) {
      addItem(dish, 1);
    }
    toast.success(
      'All Favorites Added to Bag',
      `${favoriteDishes.length} creations added to your order (₹${totalVaultPrice}).`
    );
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0D0A08] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E2A84B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const savedCountFormatted =
    favoriteDishes.length < 10 ? `0${favoriteDishes.length}` : `${favoriteDishes.length}`;

  return (
    <div className="relative min-h-screen bg-[#0D0A08] text-[#FAF5EC] overflow-x-hidden selection:bg-[#E2A84B] selection:text-[#0D0A08] pb-28">
      {/* Background Layer 2: Dual Radial Aura (Deep Emerald & Molten Gold) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[750px] z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 32%, rgba(14, 31, 24, 0.85) 0%, rgba(226, 168, 75, 0.08) 35%, rgba(13, 10, 8, 1) 70%)',
        }}
      />

      {/* Background Layer 3: Tactile Film Noise Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Container with Architectural Margin Lines */}
      <div className="max-w-[1320px] mx-auto border-l border-r border-[#E2A84B]/[0.07] min-h-screen relative z-10 flex flex-col justify-between">
        <div>
          {/* ========================================================= */}
          {/* SECTION 1: Vault Architectural Header                     */}
          {/* ========================================================= */}
          <div className="px-4 sm:px-6 lg:px-8 pt-10 pb-8 border-b border-[rgba(226,168,75,0.14)]">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              {/* Left Side: Minimal Back Link + Royal Heading */}
              <div>
                <Link
                  href="/menu"
                  className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#E2A84B] font-bold mb-3 hover:text-[#FAF5EC] transition-colors"
                >
                  <span className="transition-transform duration-300 group-hover:-translate-x-1">
                    ←
                  </span>
                  <span>BACK TO CULINARY MENU</span>
                </Link>

                <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#FAF5EC] leading-tight">
                  Personal <span className="italic text-[#E2A84B]">Tasting Vault</span>
                </h1>

                <p className="text-sm text-[#9A9286] font-light mt-1.5">
                  Your personally curated collection of signature dishes
                </p>
              </div>

              {/* Right Side: Vault Summary Badge & Bulk Order CTA */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-[6px] bg-[#15110E] border border-[#E2A84B]/25 shadow-inner">
                  <span className="text-[11px] font-mono tracking-wider text-[#9A9286] uppercase">
                    SAVED ITEMS:
                  </span>
                  <span className="font-mono text-sm font-bold text-[#E2A84B]">
                    {savedCountFormatted}
                  </span>
                </div>

                {favoriteDishes.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAddAllToBag}
                    className="px-5 py-2.5 rounded-[6px] text-xs font-bold text-[#0D0A08] transition-all hover:brightness-110 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                    style={{
                      background:
                        'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                    }}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add All to Bag →</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 2: Body Content (Empty State vs Populated Vault)   */}
          {/* ========================================================= */}
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {favoriteDishes.length === 0 ? (
              <div>
                {/* --------------------------------------------------- */}
                {/* PART A: The Velvet Cloche Card (Top Compact Card)   */}
                {/* --------------------------------------------------- */}
                <div
                  className="max-w-[680px] mx-auto p-8 sm:p-12 rounded-2xl border text-center shadow-2xl relative overflow-hidden mt-4 sm:mt-6"
                  style={{
                    background: 'linear-gradient(145deg, #16120E 0%, #0E1F18 100%)',
                    borderColor: 'rgba(226, 168, 75, 0.25)',
                    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75)',
                  }}
                >
                  {/* Subtle top ambient chandelier glow */}
                  <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-36 bg-[#E2A84B]/10 rounded-full blur-2xl" />

                  {/* Double-Ringed Rotating Gold Crest */}
                  <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-dashed border-[#E2A84B]/40 animate-[spin_24s_linear_infinite]" />
                    <div className="absolute inset-2 rounded-full bg-[#E2A84B]/10 blur-sm animate-pulse" />
                    <div className="relative w-14 h-14 rounded-full bg-[#14100D] border border-[#E2A84B]/60 flex items-center justify-center shadow-lg transition-transform duration-500 hover:scale-105">
                      <Heart className="w-6 h-6 text-[#E2A84B] fill-[#E2A84B]/20" />
                    </div>
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF5EC] mb-2.5">
                    Your Tasting Vault is Awaiting Its First Dish
                  </h2>

                  <p className="text-xs sm:text-sm text-[#B5ADA2] font-light max-w-[460px] mx-auto leading-relaxed mb-8">
                    Tap the heart emblem on any creation across our menu or 3D lounge to build
                    your personal dining repertoire for instant one-click ordering.
                  </p>

                  {/* Dual Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                    {/* Primary CTA with Shimmer Sweep */}
                    <Link
                      href="/menu"
                      className="group relative overflow-hidden w-full sm:w-auto px-7 py-3 rounded-[6px] text-xs font-extrabold text-[#0D0A08] transition-all hover:brightness-110 active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      style={{
                        background:
                          'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                      }}
                    >
                      {/* Shimmer sweep animation */}
                      <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none animate-shimmer" />
                      <span className="relative z-10">Explore Culinary Menu</span>
                      <ArrowRight className="w-3.5 h-3.5 relative z-10 transition-transform group-hover:translate-x-1" />
                    </Link>

                    {/* Secondary CTA: 3D Lounge */}
                    <Link
                      href="/ar"
                      className="w-full sm:w-auto px-6 py-3 rounded-[6px] bg-white/[0.04] hover:bg-white/[0.08] border border-[rgba(226,168,75,0.3)] text-xs font-semibold text-[#FAF5EC] flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Box className="w-3.5 h-3.5 text-[#E2A84B]" />
                      <span>Launch 3D Lounge</span>
                    </Link>
                  </div>
                </div>

                {/* --------------------------------------------------- */}
                {/* PART B: 1-Click Discovery Row (Chef's Recommendations) */}
                {/* --------------------------------------------------- */}
                <div className="mt-14 pt-8 border-t border-[rgba(226,168,75,0.14)]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#E2A84B]" />
                      <h3 className="text-xs uppercase tracking-[0.25em] text-[#E2A84B] font-bold">
                        START YOUR COLLECTION — MOST LOVED SIGNATURES
                      </h3>
                    </div>
                    <span className="text-xs text-[#9A9286] italic hidden sm:block">
                      Tap ♡ to Save Instantly to Vault
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {recommendedDishes.map((rec) => {
                      const isFav = favoriteIds.includes(rec.id);
                      return (
                        <div
                          key={rec.id}
                          className="group relative flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1.5 rounded-2xl border"
                          style={{
                            background: 'linear-gradient(180deg, #181310 0%, #120E0B 100%)',
                            borderColor: 'rgba(226, 168, 75, 0.2)',
                            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                          }}
                        >
                          {/* Image Frame */}
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/70">
                            <Link href={`/3d/${rec.slug}`}>
                              <Image
                                src={resolveDishImageUrl(rec.slug, rec.image)}
                                alt={rec.name}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                className="object-cover group-hover:scale-108 transition-transform duration-500"
                              />
                              <div
                                className="pointer-events-none absolute inset-0 z-10"
                                style={{
                                  background:
                                    'linear-gradient(to top, #181310 5%, transparent 60%)',
                                }}
                              />
                            </Link>

                            {/* Instant Save to Vault Heart Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(rec.id);
                                if (!isFav) {
                                  toast.success('Saved to Tasting Vault', rec.name);
                                } else {
                                  toast.info('Removed from Vault', rec.name);
                                }
                              }}
                              aria-label="Save to Vault"
                              title={isFav ? 'Remove from Vault' : 'Save to Tasting Vault'}
                              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-125 shadow-xl bg-[rgba(13,10,8,0.85)] backdrop-blur-md border border-[rgba(226,168,75,0.35)] hover:border-[#E2A84B]"
                            >
                              <Heart
                                className={`w-4 h-4 transition-colors ${
                                  isFav
                                    ? 'fill-[#E0532B] text-[#E0532B]'
                                    : 'text-[#FAF5EC] hover:text-[#E2A84B]'
                                }`}
                              />
                            </button>
                          </div>

                          {/* Card Content */}
                          <div className="p-4 flex flex-col justify-between flex-1 space-y-2">
                            <div>
                              <Link
                                href={`/3d/${rec.slug}`}
                                className="font-serif text-base font-bold text-[#FAF5EC] line-clamp-1 hover:text-[#E2A84B] transition-colors"
                              >
                                {rec.name}
                              </Link>
                              <p className="text-[11.5px] text-[#A6A095] line-clamp-2 font-light mt-0.5">
                                {rec.description}
                              </p>
                            </div>

                            <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
                              <span className="font-mono text-sm font-bold text-[#FAF5EC]">
                                ₹{rec.price}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  addItem(rec, 1);
                                  toast.success('Added to Cart', `${rec.name} (₹${rec.price})`);
                                }}
                                className="px-3 py-1.5 rounded-[5px] text-[11px] font-bold text-[#0D0A08] transition-all hover:brightness-110 active:scale-95 shadow-sm"
                                style={{
                                  background:
                                    'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                                }}
                              >
                                Add +
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* --------------------------------------------------- */}
                {/* POPULATED VAULT: Concierge Action Strip             */}
                {/* --------------------------------------------------- */}
                <div className="mb-6 p-4 rounded-xl bg-[#14100D] border border-[rgba(226,168,75,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-xs text-[#FAF5EC]">
                    <span className="w-2 h-2 rounded-full bg-[#22C58B] animate-pulse" />
                    <span>
                      Total Curated Selection:{' '}
                      <strong className="font-mono text-[#E2A84B] text-sm font-bold">
                        ₹{totalVaultPrice}
                      </strong>{' '}
                      · {favoriteDishes.length} {favoriteDishes.length === 1 ? 'Dish' : 'Dishes'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Link
                      href="/menu"
                      className="text-xs text-[#9A9286] hover:text-[#FAF5EC] transition-colors px-3 py-1.5"
                    >
                      Browse More Dishes →
                    </Link>
                    <button
                      type="button"
                      onClick={handleAddAllToBag}
                      className="px-4 py-2 rounded-[6px] text-xs font-bold text-[#0D0A08] transition-all hover:brightness-110 active:scale-95 shadow-md flex items-center gap-1.5"
                      style={{
                        background:
                          'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Add All Favorites to Bag</span>
                    </button>
                  </div>
                </div>

                {/* Bespoke Collector Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {favoriteDishes.map((dish) => (
                    <FavoriteDishCard key={dish.id} dish={dish} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
