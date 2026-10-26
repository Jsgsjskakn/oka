import Link from 'next/link';
import { 
  Plus, 
  UtensilsCrossed, 
  Tag, 
  Sparkles, 
  Box, 
  Layers, 
  Edit3, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  Flame,
  Star
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
    <div className="relative min-h-screen p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Background Futuristic Ambient Glow Orbs */}
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-champagne/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-2 border-b border-border-subtle/60">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-champagne/10 text-platinum border border-champagne/20 shadow-[0_0_15px_rgba(201,168,76,0.1)]">
              <Sparkles className="w-3 h-3 text-champagne" />
              Catalog Intelligence
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl heading-ui text-text-primary text-2xl text-transparent bg-clip-text bg-gradient-to-r from-champagne via-platinum to-champagne drop-shadow-[0_0_20px_rgba(201,168,76,0.3)]">
              Menu Management
            </h1>
            <p className="text-champagne/80 text-[13px] font-medium tracking-[0.05em] uppercase">
              Curate categories, dish specifications, dynamic pricing, and live inventory status.
            </p>
          </div>
        </div>

        {/* Quick Action */}
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/menu/categories/new"
            className="group relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-champagne to-platinum hover:from-[#d8b85b] hover:to-[#f0db99] text-zinc-950 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg shadow-[#c9a84c]/20 hover:shadow-[#c9a84c]/30 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 text-zinc-950 stroke-[2.5] group-hover:scale-110 transition-transform" />
            <span className="tracking-wide">Add Category</span>
          </Link>
        </div>
      </div>

      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-border-subtle transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Categories</span>
            <Layers className="w-4 h-4 text-champagne" />
          </div>
          <p className="text-3xl font-black text-text-primary mt-2">{totalCategories}</p>
        </div>

        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-border-subtle transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Total Dishes</span>
            <UtensilsCrossed className="w-4 h-4 text-warning" />
          </div>
          <p className="text-3xl font-black text-text-primary mt-2">{totalDishes}</p>
        </div>

        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-success">Available</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 mt-2">
            {availableDishes}
          </p>
        </div>

        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border border-border-subtle p-5 rounded-2xl shadow-[0_15px_40px_rgba(201,168,76,0.15)] hover:shadow-[0_20px_50px_rgba(201,168,76,0.25)] hover:-translate-y-1 hover:border-champagne/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-platinum">3D AR Ready</span>
            <Box className="w-4 h-4 text-platinum" />
          </div>
          <p className="text-3xl font-black text-platinum mt-2">{arDishes}</p>
        </div>
      </div>

      {/* Categories Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-champagne shadow-[0_0_8px_#c9a84c]" />
            <h2 className="text-xl font-serif text-text-primary tracking-wide">Menu Categories</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-elevated text-text-secondary border border-border-strong/50">
              {totalCategories} Active
            </span>
          </div>
        </div>
        
        <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(201,168,76,0.15)] hover:shadow-[0_25px_70px_rgba(201,168,76,0.25)] hover:-translate-y-1 transition-all duration-500 hover:border-champagne/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-obsidian/90 text-text-secondary border-b border-border-subtle backdrop-blur-xl">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Category Name</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">URL Slug</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Dishes</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-text-secondary">
                {categories?.map((cat: any) => {
                  const dishCount = menuItems?.filter((m: any) => m.category_id === cat.id)?.length ?? 0;
                  return (
                    <tr key={cat.id} className="group hover:bg-elevated/40 transition-all duration-300">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-champagne/10 border border-champagne/20 flex items-center justify-center text-champagne group-hover:scale-105 transition-transform">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-100 group-hover:text-platinum transition-colors">
                              {cat.name}
                            </span>
                            {cat.icon && (
                              <span className="ml-2 text-xs text-text-secondary/70">({cat.icon})</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-text-secondary bg-elevated/80 px-2.5 py-1 rounded-md border border-border-strong/50">
                          /{cat.slug}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-elevated/80 text-text-secondary border border-border-strong/50">
                          {dishCount} {dishCount === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/admin/menu/categories/${cat.id}`} 
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-border-subtle bg-champagne/10 text-platinum hover:bg-champagne/20 hover:border-champagne/50 hover:shadow-[0_0_12px_rgba(201,168,76,0.2)] transition-all duration-300 shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
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

      {/* Dishes Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
            <h2 className="text-xl font-serif text-text-primary tracking-wide">Culinary Dishes</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-elevated text-text-secondary border border-border-strong/50">
              {totalDishes} Dishes Configured
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(201,168,76,0.15)] hover:shadow-[0_25px_70px_rgba(201,168,76,0.25)] hover:-translate-y-1 transition-all duration-500 hover:border-champagne/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-obsidian/90 text-text-secondary border-b border-border-subtle backdrop-blur-xl">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Dish Details</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Category</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Pricing</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-center">Status</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-text-secondary">
                {menuItems?.map((item: any) => {
                  const categoryName = categories?.find((c: any) => c.id === item.category_id)?.name || 'General';
                  return (
                    <tr key={item.id} className="group hover:bg-elevated/40 transition-all duration-300">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Veg / Non-Veg Indicator */}
                          <div className={`w-4 h-4 rounded-sm border flex items-center justify-center p-0.5 ${
                            item.is_veg 
                              ? 'border-green-500' 
                              : 'border-rose-500'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              item.is_veg ? 'bg-green-500' : 'bg-rose-500'
                            }`} />
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Link href={`/3d/${item.slug}`} target="_blank" title="Open 3D Studio" className="font-semibold text-zinc-100 hover:text-[#E2A84B] transition-colors">
                                {item.name}
                              </Link>
                              {item.has_3d_model && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-platinum/5 text-platinum border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                                  <Box className="w-2.5 h-2.5" />
                                  3D AR
                                </span>
                              )}
                              {item.is_best_seller && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-warning border border-amber-500/20">
                                  <Star className="w-2.5 h-2.5 fill-amber-300" />
                                  Top
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-text-secondary/70 truncate max-w-xs">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-elevated/80 text-text-secondary border border-border-strong/40">
                          {categoryName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-bold text-zinc-100">
                          {formatMoney(item.price_paise)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border shadow-sm backdrop-blur-sm ${
                          item.is_available 
                            ? 'bg-emerald-500/10 text-success border-emerald-500/25 shadow-emerald-500/10' 
                            : 'bg-rose-500/10 text-danger border-rose-500/25 shadow-rose-500/10'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.is_available 
                              ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' 
                              : 'bg-rose-400'
                          }`} />
                          {item.is_available ? 'Available' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/3d/${item.slug}`} target="_blank" title="Open 3D Studio" className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[rgba(226,168,75,0.3)] bg-champagne/5 text-[#E2A84B] hover:bg-[#E2A84B]/15 hover:border-[#E2A84B] transition-all shadow-sm">
                            <Box className="w-3.5 h-3.5" />
                            <span>3D</span>
                          </Link>
                          <Link 
                            href={`/admin/menu/dishes/${item.id}`} 
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-border-subtle bg-champagne/10 text-platinum hover:bg-champagne/20 hover:border-champagne/50 hover:shadow-[0_0_12px_rgba(201,168,76,0.2)] transition-all duration-300 shadow-sm"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

