'use client';

import { Check } from 'lucide-react';
import type { SizeOption, AddOn } from '@/types/menu';

interface CustomizationControlsProps {
  sizes?: SizeOption[];
  addOns?: AddOn[];
  removables?: string[];
  selectedSize?: SizeOption;
  selectedAddOns: Set<string>;
  removedIngredients: Set<string>;
  specialInstructions: string;
  onSizeSelect: (size: SizeOption) => void;
  onAddOnToggle: (addOnId: string) => void;
  onRemoveToggle: (ingredient: string) => void;
  onInstructionsChange: (text: string) => void;
}

export function CustomizationControls({
  sizes,
  addOns,
  removables,
  selectedSize,
  selectedAddOns,
  removedIngredients,
  specialInstructions,
  onSizeSelect,
  onAddOnToggle,
  onRemoveToggle,
  onInstructionsChange,
}: CustomizationControlsProps) {
  
  return (
    <div className="flex flex-col gap-6 px-4 py-6 border-t border-white/5">
      
      {/* SIZE SELECTOR */}
      {sizes && sizes.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-3">
            Choose Size
          </h3>
          <div className="flex flex-col gap-2">
            {sizes.map((size) => {
              const isSelected = selectedSize?.id === size.id;
              return (
                <button
                  key={size.id}
                  onClick={() => onSizeSelect(size)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    isSelected 
                      ? 'bg-primary/10 border-primary' 
                      : 'bg-[#1a1a1a] border-white/5'
                  }`}
                >
                  <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                    {size.name}
                  </span>
                  <span className="text-sm text-text-primary/70">
                    {size.priceModifier > 0 ? `+₹${size.priceModifier}` : size.priceModifier < 0 ? `-₹${Math.abs(size.priceModifier)}` : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD-ONS */}
      {addOns && addOns.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-3">
            Add-ons
          </h3>
          <div className="flex flex-col gap-2">
            {addOns.map((addon) => {
              const isSelected = selectedAddOns.has(addon.id);
              return (
                <button
                  key={addon.id}
                  onClick={() => onAddOnToggle(addon.id)}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a] border border-white/5 active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                      isSelected ? 'bg-primary border-primary text-black' : 'border-border-strong'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-sm font-medium text-text-primary">
                      {addon.name}
                    </span>
                  </div>
                  <span className="text-sm text-text-primary/70">
                    +₹{addon.price}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* REMOVABLE INGREDIENTS */}
      {removables && removables.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-3">
            Remove Ingredients
          </h3>
          <div className="flex flex-wrap gap-2">
            {removables.map((item) => {
              const isRemoved = removedIngredients.has(item);
              return (
                <button
                  key={item}
                  onClick={() => onRemoveToggle(item)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                    isRemoved 
                      ? 'bg-red-500/10 border-red-500/50 text-red-400 line-through decoration-red-400/50' 
                      : 'bg-[#1a1a1a] border-border-subtle text-text-primary/80'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SPECIAL INSTRUCTIONS */}
      <div>
        <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-3">
          Special Instructions
        </h3>
        <div className="relative">
          <textarea
            value={specialInstructions}
            onChange={(e) => onInstructionsChange(e.target.value.slice(0, 200))}
            placeholder="E.g. Less spicy, extra crispy..."
            className="w-full bg-[#1a1a1a] border border-border-subtle rounded-lg p-3 text-sm text-text-primary placeholder-white/30 resize-none focus:outline-none focus:border-primary/50 transition-colors"
            rows={3}
            maxLength={200}
          />
          <span className="absolute bottom-3 right-3 text-[10px] text-text-primary/30">
            {specialInstructions.length}/200
          </span>
        </div>
      </div>
    </div>
  );
}
