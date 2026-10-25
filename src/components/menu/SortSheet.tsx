'use client';

import { X, Check } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

export type SortOption = 'recommended' | 'priceAsc' | 'priceDesc' | 'popular';

interface SortSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentSort: SortOption;
  onApply: (sort: SortOption) => void;
}

export function SortSheet({ isOpen, onClose, currentSort, onApply }: SortSheetProps) {
  if (!isOpen) return null;

  const options: { id: SortOption; label: string }[] = [
    { id: 'recommended', label: 'Recommended' },
    { id: 'priceAsc', label: 'Price: Low to High' },
    { id: 'priceDesc', label: 'Price: High to Low' },
    { id: 'popular', label: 'Popular' },
  ];

  return (
    <>
      <div 
        className="fixed inset-0 bg-obsidian/60 backdrop-blur-sm z-50 transition-opacity" 
        onClick={onClose}
      />
      
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] rounded-t-3xl z-50 border-t border-border-subtle p-6 animate-in slide-in-from-bottom-full duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-heading text-xl font-semibold text-text-primary">Sort By</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-8">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                onApply(option.id);
                onClose();
              }}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
                currentSort === option.id
                  ? 'bg-champagne/10 border-champagne/50 text-text-primary'
                  : 'bg-[#1a1a1a] border-white/5 text-text-primary/70 hover:bg-white/5'
              }`}
            >
              <span className="font-medium">{option.label}</span>
              {currentSort === option.id && <Check className="w-5 h-5 text-champagne" />}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
