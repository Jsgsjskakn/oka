'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateCategoryDetails, createCategory } from '@/app/admin/(protected)/menu/actions';
import { Save, ArrowLeft, Tag, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export function EditCategoryForm({ category, isNew = false }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState(category?.name || '');
  const [slug, setSlug] = useState(category?.slug || '');
  const [icon, setIcon] = useState(category?.icon || '');
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(category?.sort_order || 0);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        name,
        slug,
        icon,
        is_active: isActive,
        sort_order: sortOrder
      };
      
      if (isNew) {
        await createCategory(payload);
      } else {
        await updateCategoryDetails(category.id, payload);
      }
      router.push('/admin/menu');
    } catch (err) {
      console.error(err);
      alert('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <Link 
          href="/admin/menu" 
          className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Menu</span>
        </Link>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-champagne to-platinum hover:from-[#d8b85b] hover:to-[#f0db99] text-zinc-950 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg shadow-[#c9a84c]/20 hover:shadow-[#c9a84c]/30 hover:-translate-y-0.5 disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-zinc-950 stroke-[2.5]" /> 
          <span>{loading ? 'Saving...' : isNew ? 'Create Category' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle/80 p-8 rounded-2xl shadow-2xl shadow-black/50 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border-subtle/80">
          <div className="w-10 h-10 rounded-xl bg-champagne/10 border border-champagne/20 flex items-center justify-center text-champagne">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-serif text-text-primary tracking-wide">
              {isNew ? 'New Category Specs' : 'Category Details'}
            </h2>
            <p className="text-xs text-text-secondary">Configure catalog taxonomy and route identifier</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              Category Name
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={e => {
                setName(e.target.value);
                if (isNew) {
                  setSlug(e.target.value.toLowerCase().trim().replace(/\s+/g, '-'));
                }
              }}
              placeholder="e.g. Artisanal Pizzas"
              className="w-full bg-obsidian/80 border border-border-strong/80 rounded-xl p-3 text-zinc-100 placeholder-zinc-600 outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              URL Slug
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/70 font-mono text-xs">/</span>
              <input 
                type="text" 
                value={slug} 
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="pizza"
                className="w-full bg-obsidian/80 border border-border-strong/80 rounded-xl py-3 pr-3 pl-7 text-zinc-100 placeholder-zinc-600 outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all shadow-inner font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                Icon Key
              </label>
              <input 
                type="text" 
                value={icon} 
                onChange={e => setIcon(e.target.value)}
                placeholder="e.g. pizza"
                className="w-full bg-obsidian/80 border border-border-strong/80 rounded-xl p-3 text-zinc-100 placeholder-zinc-600 outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all shadow-inner text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                Display Order
              </label>
              <input 
                type="number" 
                value={sortOrder} 
                onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
                className="w-full bg-obsidian/80 border border-border-strong/80 rounded-xl p-3 text-zinc-100 placeholder-zinc-600 outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all shadow-inner text-sm font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle/80">
            <label className="flex items-center justify-between p-3.5 bg-obsidian/50 border border-border-subtle rounded-xl cursor-pointer hover:border-border-strong transition-colors">
              <div>
                <span className="text-sm font-medium text-zinc-200">Catalog Visibility</span>
                <p className="text-xs text-text-secondary/70 mt-0.5">Active categories are visible to customers on the live menu.</p>
              </div>
              <input 
                type="checkbox" 
                checked={isActive} 
                onChange={e => setIsActive(e.target.checked)} 
                className="w-5 h-5 accent-[#c9a84c] cursor-pointer rounded" 
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
