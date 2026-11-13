import Link from 'next/link';
import { 
  Plus, 
  UtensilsCrossed, 
  Tag, 
  Box, 
  Layers, 
  Edit3, 
  CheckCircle2, 
  Star,
  TrendingUp,
} from 'lucide-react';
import { formatMoney } from '@/lib/db/types';
import { getAllDishes, getCategories } from '@/lib/services/menu.service';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const metadata = {
  title: 'Menu Management | Admin | The Golden Oak',
};

export const dynamic = 'force-dynamic';

export default async function MenuAdminPage() {
  await requireAdmin();
  const categories = await getCategories();
  const menuItems = await getAllDishes();

  const totalCategories = categories?.length ?? 0;
  const totalDishes = menuItems?.length ?? 0;
  const availableDishes = menuItems?.filter((d: any) => d.is_available)?.length ?? 0;
  const arDishes = menuItems?.filter((d: any) => d.has_3d_model)?.length ?? 0;

  return (
    <div className="space-y-3 select-none font-sans">
      {/* ===================================================================== */}
      {/* 1. TOP METRIC CARDS: 4 Glowing Dark Glass Cards with Sparklines       */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Live Available (Emerald Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-emerald-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Live Available</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {availableDishes}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="emeraldGradM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 35 Q 20 28, 35 30 T 60 18 T 80 12 T 100 5 L 100 40 L 0 40 Z" fill="url(#emeraldGradM)" />
              <path d="M 0 35 Q 20 28, 35 30 T 60 18 T 80 12 T 100 5" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#34d399]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold relative z-10">
            <TrendingUp className="w-3 h-3" /> Ready for Kitchen Order
          </div>
        </div>

        {/* Card 2: Total Dishes (Amber Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-amber-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
              <UtensilsCrossed className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Total Dishes</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {totalDishes}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="amberGradM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 32 Q 25 35, 45 22 T 75 18 T 100 8 L 100 40 L 0 40 Z" fill="url(#amberGradM)" />
              <path d="M 0 32 Q 25 35, 45 22 T 75 18 T 100 8" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#fbbf24]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold relative z-10">
            <TrendingUp className="w-3 h-3" /> Menu Portfolio
          </div>
        </div>

        {/* Card 3: Active Categories (Purple Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-purple-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-purple-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">Active Categories</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {totalCategories}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="purpleGradM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 25 Q 25 32, 50 20 T 75 14 T 100 10 L 100 40 L 0 40 Z" fill="url(#purpleGradM)" />
              <path d="M 0 25 Q 25 32, 50 20 T 75 14 T 100 10" fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#c084fc]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-purple-400 font-bold relative z-10">
            Catalog Sections
          </div>
        </div>

        {/* Card 4: 3D & AR Ready (Rose Glow) */}
        <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-rose-500/25 p-3.5 relative overflow-hidden shadow-lg flex flex-col justify-between group hover:border-rose-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xs shadow-inner">
              <Box className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] text-zinc-300 font-medium">3D & AR Ready</span>
          </div>

          <div className="flex items-end justify-between my-1.5 relative z-10">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {arDishes}
            </span>
            <svg className="w-20 h-8 overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="roseGradM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 35 Q 25 30, 45 32 T 75 16 T 100 10 L 100 40 L 0 40 Z" fill="url(#roseGradM)" />
              <path d="M 0 35 Q 25 30, 45 32 T 75 16 T 100 10" fill="none" stroke="#fb7185" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#fb7185]" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-bold relative z-10">
            Interactive Models
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. CATEGORIES SECTION                                                 */}
      {/* ===================================================================== */}
      <div className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-white/10 p-4 shadow-lg space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
            <h2 className="text-sm md:text-base font-bold text-white tracking-wide">
              Menu Categories
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white border border-white/15">
              {totalCategories} Active
            </span>
          </div>
          <Link 
            href="/admin/menu/categories/new"
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[11px] font-medium text-amber-200 transition-colors border border-[#d4af37]/40"
          >
            <Plus className="w-3 h-3" />
            <span>Add Category</span>
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="text-zinc-400 border-b border-white/10 text-[10px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Category Name</th>
                <th className="px-4 py-3">URL Slug</th>
                <th className="px-4 py-3">Dishes</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {categories?.map((cat: any) => {
                const dishCount =
                  menuItems?.filter(
                    (m: any) => m.category_id === cat.id || m.categories?.slug === cat.slug
                  )?.length ?? 0;
                return (
                  <tr key={cat.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-semibold text-white text-xs">
                            {cat.name}
                          </span>
                          {cat.icon && (
                            <span className="ml-1.5 text-[10px] text-zinc-400">({cat.icon})</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        /{cat.slug}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white">
                        {dishCount} {dishCount === 1 ? 'item' : 'items'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link 
                        href={`/admin/menu/categories/${cat.id}`} 
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. DISHES & INVENTORY SECTION                                         */}
      {/* ===================================================================== */}
      <div id="inventory" className="rounded-[18px] bg-black/35 backdrop-blur-xl border border-white/10 p-4 shadow-lg space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <h2 className="text-sm md:text-base font-bold text-white tracking-wide">
              Culinary Dishes
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white border border-white/15">
              {totalDishes} Configured
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="text-zinc-400 border-b border-white/10 text-[10px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Dish Details</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Base Price</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">3D / AR</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {menuItems?.map((dish: any) => {
                const category = categories?.find(
                  (c: any) => c.id === dish.category_id || c.slug === dish.categories?.slug
                );
                return (
                  <tr key={dish.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {dish.image_url ? (
                          <img 
                            src={dish.image_url} 
                            alt={dish.name}
                            className="w-8 h-8 rounded-lg object-cover border border-white/15 bg-zinc-900"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-zinc-400">
                            <UtensilsCrossed className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white text-xs">
                              {dish.name}
                            </span>
                            {dish.is_featured && (
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 max-w-xs truncate">
                            {dish.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10">
                        {category ? category.name : 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-white font-mono text-xs">
                      {formatMoney(dish.price_paise)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border ${
                        dish.is_available 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${dish.is_available ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {dish.is_available ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {dish.has_3d_model ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">
                          <Box className="w-3 h-3 text-indigo-400" />
                          <span>3D</span>
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-[10px]">Standard</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link 
                        href={`/admin/menu/dishes/${dish.id}`} 
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
