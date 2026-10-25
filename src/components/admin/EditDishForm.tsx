'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateFullDishDetails } from '@/app/admin/(protected)/menu/actions';
import { 
  Save, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  UtensilsCrossed, 
  Box, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  Layers,
  DollarSign,
  ChevronDown,
  Check
} from 'lucide-react';
import Link from 'next/link';

export function EditDishForm({ dish, categories, initialSizes, initialAddOns }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Basic info state
  const [name, setName] = useState(dish.name);
  const [description, setDescription] = useState(dish.description || '');
  const [pricePaise, setPricePaise] = useState(dish.price_paise);
  const [categoryId, setCategoryId] = useState(dish.category_id);
  const [spiceLevel, setSpiceLevel] = useState(dish.spice_level || 'mild');
  const [has3dModel, setHas3dModel] = useState(dish.has_3d_model);
  const [isVeg, setIsVeg] = useState(dish.is_veg);
  const [isAvailable, setIsAvailable] = useState(dish.is_available);
  const [isFeatured, setIsFeatured] = useState(dish.is_featured);
  const [isBestSeller, setIsBestSeller] = useState(dish.is_best_seller);

  // Lists state
  const [sizes, setSizes] = useState<{name: string, price_modifier: number}[]>(
    initialSizes.map((s: any) => ({ name: s.name, price_modifier: s.price_modifier }))
  );
  const [addOns, setAddOns] = useState<{name: string, price: number}[]>(
    initialAddOns.map((a: any) => ({ name: a.name, price: a.price }))
  );

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateFullDishDetails(dish.id, {
        name,
        description,
        price_paise: pricePaise,
        category_id: categoryId,
        spice_level: spiceLevel,
        has_3d_model: has3dModel,
        is_veg: isVeg,
        is_available: isAvailable,
        is_featured: isFeatured,
        is_best_seller: isBestSeller,
        sizes,
        addOns
      });
      router.push('/admin/menu');
    } catch (err) {
      console.error(err);
      alert('Failed to save dish');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto animate-in fade-in duration-500">
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
          <span>{loading ? 'Saving Changes...' : 'Save Dish Specs'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Details Panel */}
        <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle/80 p-7 rounded-2xl shadow-2xl shadow-black/50 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-border-subtle/80">
            <div className="w-9 h-9 rounded-xl bg-champagne/10 border border-champagne/20 flex items-center justify-center text-champagne">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif text-text-primary tracking-wide">Culinary Identity</h2>
              <p className="text-xs text-text-secondary">Core dish metadata and pricing specs</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                Dish Title
              </label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full bg-obsidian/80 border border-border-strong/80 rounded-xl p-3 text-zinc-100 placeholder-zinc-600 outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                Gastronomic Description
              </label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-obsidian/80 border border-border-strong/80 rounded-xl p-3 text-zinc-100 placeholder-zinc-600 outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all shadow-inner resize-y text-sm leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                  Base Price (Paise)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary/70 font-mono">₹</span>
                  <input 
                    type="number" 
                    value={pricePaise} 
                    onChange={e => setPricePaise(parseInt(e.target.value) || 0)}
                    className="w-full bg-obsidian/80 border border-border-strong/80 rounded-xl py-3 pr-3 pl-7 text-zinc-100 font-mono text-sm outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all shadow-inner"
                  />
                </div>
                <span className="text-[10px] text-text-secondary/70 mt-1 block">{(pricePaise / 100).toFixed(2)} INR</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                  Category
                </label>
                <CategoryCustomDropdown 
                  categories={categories} 
                  value={categoryId} 
                  onChange={setCategoryId} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Toggles & Attributes Panel */}
        <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle/80 p-7 rounded-2xl shadow-2xl shadow-black/50 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-border-subtle/80">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-warning">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif text-text-primary tracking-wide">Attributes & 3D Telemetry</h2>
              <p className="text-xs text-text-secondary">Flags, dietary tags, and spice matrix</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CustomToggle label="Is Available" checked={isAvailable} onChange={setIsAvailable} />
            <CustomToggle label="Is Vegetarian" checked={isVeg} onChange={setIsVeg} />
            <CustomToggle label="Featured Dish" checked={isFeatured} onChange={setIsFeatured} />
            <CustomToggle label="Best Seller" checked={isBestSeller} onChange={setIsBestSeller} />
            <div className="sm:col-span-2 mt-2">
              <CustomToggle 
                label={
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-platinum" />
                    <span className="text-platinum">Has 3D AR Model</span>
                  </div>
                }
                checked={has3dModel} 
                onChange={setHas3dModel} 
                isGlow={true} 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              Spice Heat Level
            </label>
            <SpiceLevelSelector value={spiceLevel} onChange={setSpiceLevel} />
          </div>
        </div>

        {/* Sizes Configuration */}
        <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle/80 p-7 rounded-2xl shadow-2xl shadow-black/50 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-border-subtle/80">
            <div>
              <h2 className="text-base font-serif text-text-primary tracking-wide">Portion Sizes</h2>
              <p className="text-xs text-text-secondary">Alternative size modifiers</p>
            </div>
            <button 
              onClick={() => setSizes([...sizes, { name: 'Large', price_modifier: 5000 }])}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border-subtle bg-champagne/10 text-platinum hover:bg-champagne/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> 
              <span>Add Size</span>
            </button>
          </div>
          
          <div className="space-y-2.5">
            {sizes.length === 0 && (
              <p className="text-xs text-text-secondary/70 italic py-4 text-center">No portion sizes configured.</p>
            )}
            {sizes.map((size, idx) => (
              <div key={idx} className="flex gap-2.5 items-center p-2.5 bg-obsidian/50 border border-border-subtle rounded-xl">
                <input 
                  type="text" 
                  value={size.name} 
                  onChange={e => {
                    const newSizes = [...sizes];
                    newSizes[idx].name = e.target.value;
                    setSizes(newSizes);
                  }}
                  className="flex-1 bg-obsidian/80 border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all shadow-inner"
                  placeholder="e.g. Regular / Large"
                />
                <div className="relative w-32">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-text-secondary/70 font-mono">+₹</span>
                  <input 
                    type="number" 
                    value={size.price_modifier} 
                    onChange={e => {
                      const newSizes = [...sizes];
                      newSizes[idx].price_modifier = parseInt(e.target.value) || 0;
                      setSizes(newSizes);
                    }}
                    className="w-full bg-obsidian/80 border border-border-subtle rounded-lg pl-7 pr-2 py-2 text-xs text-text-primary font-mono outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all shadow-inner"
                    placeholder="Modifier"
                  />
                </div>
                <button 
                  onClick={() => setSizes(sizes.filter((_, i) => i !== idx))}
                  className="p-2 text-text-secondary/70 hover:text-danger hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add-ons Configuration */}
        <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-border-subtle/80 p-7 rounded-2xl shadow-2xl shadow-black/50 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-border-subtle/80">
            <div>
              <h2 className="text-base font-serif text-text-primary tracking-wide">Culinary Add-ons</h2>
              <p className="text-xs text-text-secondary">Customizations & extra toppings</p>
            </div>
            <button 
              onClick={() => setAddOns([...addOns, { name: 'Extra Cheese', price: 4900 }])}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border-subtle bg-champagne/10 text-platinum hover:bg-champagne/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> 
              <span>Add Extra</span>
            </button>
          </div>
          
          <div className="space-y-2.5">
            {addOns.length === 0 && (
              <p className="text-xs text-text-secondary/70 italic py-4 text-center">No culinary add-ons configured.</p>
            )}
            {addOns.map((addon, idx) => (
              <div key={idx} className="flex gap-2.5 items-center p-2.5 bg-obsidian/50 border border-border-subtle rounded-xl">
                <input 
                  type="text" 
                  value={addon.name} 
                  onChange={e => {
                    const newAddons = [...addOns];
                    newAddons[idx].name = e.target.value;
                    setAddOns(newAddons);
                  }}
                  className="flex-1 bg-obsidian/80 border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all shadow-inner"
                  placeholder="e.g. Truffle Drizzle"
                />
                <div className="relative w-32">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-text-secondary/70 font-mono">+₹</span>
                  <input 
                    type="number" 
                    value={addon.price} 
                    onChange={e => {
                      const newAddons = [...addOns];
                      newAddons[idx].price = parseInt(e.target.value) || 0;
                      setAddOns(newAddons);
                    }}
                    className="w-full bg-obsidian/80 border border-border-subtle rounded-lg pl-7 pr-2 py-2 text-xs text-text-primary font-mono outline-none focus:border-champagne/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all shadow-inner"
                    placeholder="Price"
                  />
                </div>
                <button 
                  onClick={() => setAddOns(addOns.filter((_, i) => i !== idx))}
                  className="p-2 text-text-secondary/70 hover:text-danger hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Custom UI Components ---

function CategoryCustomDropdown({ 
  categories, 
  value, 
  onChange 
}: { 
  categories: any[]; 
  value: string; 
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const activeCategory = categories.find(c => c.id === value) || categories[0];

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-obsidian/80 border border-border-strong/80 hover:border-champagne/50 rounded-xl p-3 text-zinc-100 text-sm outline-none transition-all shadow-inner"
      >
        <span>{activeCategory?.name || 'Select Category'}</span>
        <ChevronDown className={`w-4 h-4 text-text-secondary/70 transition-transform duration-200 ${isOpen ? 'rotate-180 text-text-primary' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-obsidian/95 border border-border-subtle rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.9)] backdrop-blur-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
            {categories.map((c) => {
              const isSelected = c.id === value;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onChange(c.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-champagne/20 to-transparent text-platinum border border-champagne/20 shadow-inner'
                      : 'text-text-secondary hover:bg-surface hover:text-text-primary border border-transparent'
                  }`}
                >
                  <span>{c.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-champagne" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SpiceLevelSelector({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const levels = [
    { id: 'mild', label: '🌿 Mild', color: 'text-green-400', bg: 'bg-green-500/10 hover:bg-green-500/20', border: 'border-green-500/30 hover:border-green-400/50', active: 'bg-green-500/20 border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]' },
    { id: 'medium', label: '🌶️ Medium', color: 'text-warning', bg: 'bg-amber-500/10 hover:bg-warning/10', border: 'border-warning/20 hover:border-amber-400/50', active: 'bg-warning/10 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]' },
    { id: 'hot', label: '🌶️🌶️ Hot', color: 'text-orange-400', bg: 'bg-orange-500/10 hover:bg-orange-500/20', border: 'border-orange-500/30 hover:border-orange-400/50', active: 'bg-orange-500/20 border-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.2)]' },
    { id: 'extra-hot', label: '🔥 Extra Hot', color: 'text-danger', bg: 'bg-rose-500/10 hover:bg-danger/10', border: 'border-danger/20 hover:border-rose-400/50', active: 'bg-danger/10 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {levels.map((level) => {
        const isSelected = value === level.id;
        return (
          <button
            key={level.id}
            type="button"
            onClick={() => onChange(level.id)}
            className={`flex items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${level.color} ${
              isSelected ? level.active : `${level.bg} ${level.border}`
            }`}
          >
            {level.label}
          </button>
        );
      })}
    </div>
  );
}

function CustomToggle({ 
  checked, 
  onChange, 
  label, 
  isGlow = false 
}: { 
  checked: boolean; 
  onChange: (val: boolean) => void; 
  label: React.ReactNode; 
  isGlow?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
        checked
          ? isGlow 
            ? 'bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
            : 'bg-surface border-border-subtle'
          : 'bg-obsidian/50 border-border-subtle/80 hover:border-border-strong hover:bg-surface/50'
      }`}
    >
      <div className="text-xs font-semibold text-zinc-200">
        {label}
      </div>
      <div className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 ease-in-out ${
        checked ? (isGlow ? 'bg-cyan-500' : 'bg-champagne') : 'bg-zinc-700'
      }`}>
        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`} />
      </div>
    </button>
  );
}
