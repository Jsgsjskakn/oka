'use client';

import { X } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

export type FilterState = {
  vegOnly: boolean;
  nonVegOnly: boolean;
  priceRange: 'all' | 'under300' | '300to500' | 'above500';
  popularOnly: boolean;
};

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}

export function FilterSheet({ isOpen, onClose, filters, onApply }: FilterSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-obsidian/60 backdrop-blur-sm z-50 transition-opacity" 
        onClick={onClose}
      />
      
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] rounded-t-3xl z-50 border-t border-border-subtle p-6 animate-in slide-in-from-bottom-full duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-heading text-xl font-semibold text-text-primary">Filters</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Dietary Preferences */}
          <div>
            <h3 className="text-sm font-medium text-text-primary/80 mb-3">Dietary Preference</h3>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => onApply({ ...filters, vegOnly: !filters.vegOnly, nonVegOnly: false })}
                className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                  filters.vegOnly 
                    ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                    : 'bg-[#1a1a1a] border-border-subtle text-text-primary hover:bg-white/5'
                }`}
              >
                Vegetarian
              </button>
              <button 
                onClick={() => onApply({ ...filters, nonVegOnly: !filters.nonVegOnly, vegOnly: false })}
                className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                  filters.nonVegOnly 
                    ? 'bg-red-500/20 border-red-500/50 text-red-400' 
                    : 'bg-[#1a1a1a] border-border-subtle text-text-primary hover:bg-white/5'
                }`}
              >
                Non-Vegetarian
              </button>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-sm font-medium text-text-primary/80 mb-3">Price Range</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'Any Price' },
                { id: 'under300', label: 'Under ₹300' },
                { id: '300to500', label: '₹300 - ₹500' },
                { id: 'above500', label: 'Above ₹500' },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => onApply({ ...filters, priceRange: range.id as FilterState['priceRange'] })}
                  className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                    filters.priceRange === range.id
                      ? 'bg-champagne/20 border-champagne text-champagne'
                      : 'bg-[#1a1a1a] border-border-subtle text-text-primary hover:bg-white/5'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Other */}
          <div>
            <h3 className="text-sm font-medium text-text-primary/80 mb-3">Other</h3>
            <button 
              onClick={() => onApply({ ...filters, popularOnly: !filters.popularOnly })}
              className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                filters.popularOnly 
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' 
                  : 'bg-[#1a1a1a] border-border-subtle text-text-primary hover:bg-white/5'
              }`}
            >
              Popular Only
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-8 pb-safe">
          <SecondaryButton 
            className="flex-1"
            onClick={() => onApply({ vegOnly: false, nonVegOnly: false, priceRange: 'all', popularOnly: false })}
          >
            Clear All
          </SecondaryButton>
          <PrimaryButton className="flex-1" onClick={onClose}>
            Apply
          </PrimaryButton>
        </div>
      </div>
    </>
  );
}
