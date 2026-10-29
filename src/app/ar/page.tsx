import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Camera, Sparkles, ArrowRight, Layers } from 'lucide-react';
import { getAllDishes } from '@/lib/services/menu.service';
import { resolveDishImageUrl } from '@/lib/utils/dish-images';

export const metadata: Metadata = {
  title: '3D Food Lounge & AR Experience | The Golden Oak',
  description:
    'Explore our artisanal wood-fired sourdough pizzas, smash burgers, and signature fusion cuisine in photorealistic 3D. Inspect 1:1 portion scales and view dishes on your table using Augmented Reality.',
};

export default async function ARPage() {
  const dishes = await getAllDishes();
  const arDishes = dishes;

  return (
    <div className="relative min-h-screen bg-[#0D0A08] text-[#FAF5EC] overflow-x-hidden selection:bg-[#E2A84B] selection:text-[#0D0A08]">
      {/* Background prefetch 3D model & decoder for instantaneous 0ms transition into 3D Inspect view */}
      <link rel="prefetch" href="/models/warrior_model.glb" as="fetch" crossOrigin="anonymous" />
      <link rel="prefetch" href="/draco/draco_decoder.wasm" as="fetch" crossOrigin="anonymous" />
      <link rel="prefetch" href="/draco/draco_wasm_wrapper.js" as="script" />
      {/* Background Layer 2: Top Ambient Spotlight Behind Header */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[650px] z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 10%, rgba(226, 168, 75, 0.15) 0%, rgba(13, 10, 8, 0.95) 60%)',
        }}
      />

      {/* Background Layer 3: Fine Paper Grain Texture (Tactile Film Noise Overlay) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Container with Architectural Margin Lines */}
      <div className="max-w-[1360px] mx-auto border-l border-r border-[#E2A84B]/[0.07] min-h-screen relative z-10 px-4 sm:px-6 lg:px-8 py-12 flex flex-col justify-between">
        <div>
          {/* 1. Spatial 3D Hero Banner (Clean Editorial Header — No yellow circle, No prototype warning) */}
          <div className="text-center max-w-3xl mx-auto pt-6 pb-12">
            {/* Overline — SPATIAL GASTRONOMY LOUNGE — */}
            <div className="flex items-center justify-center gap-3 mb-3.5">
              <span className="w-8 h-[1px] bg-[#E2A84B]/40" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-[#E2A84B] font-bold">
                — SPATIAL GASTRONOMY LOUNGE —
              </span>
              <span className="w-8 h-[1px] bg-[#E2A84B]/40" />
            </div>

            {/* Main Heading: Cormorant Garamond 48px */}
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-[48px] font-bold text-[#FAF5EC] mb-4 tracking-tight leading-[1.1]">
              Immersive 3D &amp;{' '}
              <span className="italic text-[#E2A84B] font-normal block sm:inline">
                Augmented Reality
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-sm sm:text-[15px] text-[#9A9286] max-w-[580px] mx-auto leading-relaxed font-light">
              Explore our signature dishes in photorealistic 3D. Inspect textures, true portion scales, and place them in your physical space using AR.
            </p>
          </div>

          {/* 2. The 3D Grid Layout & Cards (Spatial Interactive Stage) */}
          {arDishes.length === 0 ? (
            <p className="text-[#9A9286] text-center py-20">No dishes available at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full items-stretch pb-16">
              {arDishes.map((dish) => {
                const resolvedImage = resolveDishImageUrl(dish.slug, dish.image_url);
                const categoryName =
                  dish.categories?.slug === 'pizza'
                    ? 'Wood-Fired Sourdough'
                    : dish.categories?.slug === 'burger'
                    ? 'Artisanal Brioche'
                    : dish.categories?.slug === 'chinese'
                    ? 'Wok & Oriental'
                    : 'Signature Small Plate';

                return (
                  <div
                    key={dish.id}
                    className="group relative flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-2 rounded-2xl border"
                    style={{
                      background: 'linear-gradient(180deg, #181310 0%, #120E0B 100%)',
                      borderTop: '1px solid rgba(246, 211, 134, 0.32)',
                      borderLeft: '1px solid rgba(226, 168, 75, 0.18)',
                      borderRight: '1px solid rgba(226, 168, 75, 0.18)',
                      borderBottom: '1px solid rgba(226, 168, 75, 0.18)',
                      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75)',
                    }}
                  >
                    {/* Top Image Stage with Radial Amber Glow on High-Tech Turntable */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/70">
                      {/* Subtle Radial Amber Glow Turntable Light */}
                      <div
                        className="pointer-events-none absolute inset-0 z-0"
                        style={{
                          background:
                            'radial-gradient(circle at 50% 60%, rgba(226, 168, 75, 0.16) 0%, transparent 65%)',
                        }}
                      />

                      <Image
                        src={resolvedImage}
                        alt={dish.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                      />

                      {/* Soft dark bottom fade */}
                      <div
                        className="pointer-events-none absolute inset-0 z-10"
                        style={{
                          background:
                            'linear-gradient(to top, #181310 8%, rgba(24, 19, 16, 0.35) 35%, transparent 65%)',
                        }}
                      />

                      {/* Top-Left: Model Status Badge */}
                      <div
                        className="absolute top-3.5 left-3.5 z-20 px-2.5 py-1 rounded-md text-[10px] font-serif font-bold tracking-wider text-[#E2A84B] flex items-center gap-1.5 shadow-lg border border-[#E2A84B]/35"
                        style={{
                          background: 'rgba(13, 10, 8, 0.85)',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E2A84B] animate-pulse" />
                        <span>360° MODEL READY</span>
                      </div>

                      {/* Top-Right: Veg/Non-Veg Indicator */}
                      <div
                        className="absolute top-3.5 right-3.5 z-20 px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-lg border border-white/10"
                        style={{
                          background: 'rgba(13, 10, 8, 0.85)',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dish.is_veg ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span className="text-white/80">{dish.is_veg ? 'Veg' : 'Non-Veg'}</span>
                      </div>
                    </div>

                    {/* Card Body & Information */}
                    <div className="p-5 flex flex-col justify-between flex-1">
                      <div className="space-y-2 mb-4">
                        <span className="text-[10px] uppercase tracking-wider text-[#E2A84B]/80 font-bold block">
                          {categoryName}
                        </span>
                        <h3 className="font-serif text-xl font-bold text-[#FAF5EC] leading-snug line-clamp-1 group-hover:text-[#E2A84B] transition-colors">
                          {dish.name}
                        </h3>
                        <p className="text-xs text-[#A6A095] font-light leading-relaxed line-clamp-2 min-h-[34px]">
                          {dish.description}
                        </p>
                      </div>

                      {/* Spatial Dual Action Bar */}
                      <div className="pt-4 border-t border-white/[0.08] flex items-center gap-2.5">
                        {/* Left Button: Solid Gold Inspect in 3D */}
                        <Link
                          href={`/3d/${dish.slug}`}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-[6px] text-xs font-bold text-[#0D0A08] transition-all duration-300 hover:brightness-110 active:scale-95 shadow-md group/btn"
                          style={{
                            background:
                              'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                          }}
                        >
                          <Box className="w-3.5 h-3.5 text-[#0D0A08] group-hover/btn:rotate-45 transition-transform duration-300" />
                          <span>Inspect in 3D</span>
                        </Link>

                        {/* Right Button: AR Camera View */}
                        <Link
                          href={`/ar/${dish.slug}`}
                          title="Place dish in your room with Augmented Reality"
                          className="flex items-center justify-center p-2.5 rounded-[6px] border border-[#E2A84B]/35 bg-[#16120E] text-[#E2A84B] hover:text-[#0D0A08] hover:bg-[#E2A84B] active:scale-95 transition-all shadow-md"
                        >
                          <Camera className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 3. Apple-Grade Spatial WebXR & LiDAR Suite Showcase Card (Fills Grid Hole in Row 4) */}
              <div
                className="col-span-1 md:col-span-2 rounded-2xl p-6 sm:p-8 flex flex-col justify-between border relative overflow-hidden group shadow-2xl transition-all duration-300 hover:border-[#E2A84B]/40"
                style={{
                  background: 'linear-gradient(135deg, #181310 0%, #120E0B 100%)',
                  borderColor: 'rgba(226, 168, 75, 0.28)',
                }}
              >
                {/* Ambient glow */}
                <div className="pointer-events-none absolute -right-16 -top-16 w-52 h-52 bg-[#E2A84B]/10 rounded-full blur-2xl group-hover:bg-[#E2A84B]/15 transition-all" />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#22C58B] animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#22C58B] font-bold">
                      WEBXR &amp; LIDAR CALIBRATION ACTIVE
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF5EC] leading-snug">
                    Apple-Grade Spatial Dining On Any Device
                  </h3>

                  <p className="text-xs sm:text-sm text-[#A6A095] font-light leading-relaxed max-w-xl">
                    Calibrate full 1:1 culinary portions directly onto your dining table. Powered by WebXR with real-time room lighting estimation, gravity plane collision, and photorealistic 4K sub-millimeter textures.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-[#FAF5EC]">
                      <Box className="w-3.5 h-3.5 text-[#E2A84B]" />
                      <span>Sub-mm True Scale</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-[#FAF5EC]">
                      <Layers className="w-3.5 h-3.5 text-[#22C58B]" />
                      <span>Zero App Required</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-[#FAF5EC]">
                      <Camera className="w-3.5 h-3.5 text-[#E0532B]" />
                      <span>Direct AR Camera</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <span className="text-xs font-serif italic text-[#E2A84B] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#E2A84B]" />
                    <span>Compatible with iOS QuickLook, Android Scene Viewer &amp; WebGL</span>
                  </span>

                  <Link
                    href={`/3d/${arDishes[0]?.slug || 'tandoori-paneer-pizza'}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[6px] text-xs font-bold text-[#0D0A08] transition-all hover:brightness-110 active:scale-95 shadow-md shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #F6D386 0%, #D49432 50%, #9E6818 100%)',
                    }}
                  >
                    <span>Launch Flagship 3D Model</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
