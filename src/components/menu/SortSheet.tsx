'use client';

import { X, Check } from 'lucide-react';
import { useSheetModal } from './useSheetModal';

export type SortOption = 'recommended' | 'priceAsc' | 'priceDesc' | 'popular';

interface SortSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentSort: SortOption;
  onApply: (sort: SortOption) => void;
}

export function SortSheet({ isOpen, onClose, currentSort, onApply }: SortSheetProps) {
  useSheetModal(isOpen, onClose);

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
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[70] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sort By"
        className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full bg-[#0E0A08] rounded-t-3xl sm:rounded-3xl z-[70] border-t sm:border border-[#E2A84B]/30 p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6 max-h-[88dvh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] sm:shadow-[0_24px_70px_rgba(0,0,0,0.95)]"
      >
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/[0.08]">
          <h2 className="font-serif text-xl font-bold text-[#FAF5EC]">Sort By</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sort options"
            className="w-11 h-11 -mr-2 rounded-full bg-white/5 flex items-center justify-center text-[#9A9286] hover:text-[#FAF5EC] hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onApply(option.id);
                onClose();
              }}
              className={`w-full min-h-[48px] flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors text-left ${
                currentSort === option.id
                  ? 'bg-[#E2A84B]/15 border-[#E2A84B] text-[#FAF5EC]'
                  : 'bg-[#17120E] border-white/10 text-[#FAF5EC]/75 hover:bg-white/5'
              }`}
            >
              <span className="font-medium text-sm">{option.label}</span>
              {currentSort === option.id && <Check className="w-5 h-5 text-[#E2A84B] shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
