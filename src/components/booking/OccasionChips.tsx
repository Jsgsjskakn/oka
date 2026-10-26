'use client';

import { Wine, Gift, Briefcase, Sparkles, LucideIcon } from 'lucide-react';

interface OccasionChipsProps {
  selected: string;
  onSelect: (occasion: string) => void;
}

const occasions: Array<{ label: string; icon?: LucideIcon }> = [
  { label: 'None' },
  { label: 'Anniversary', icon: Wine },
  { label: 'Birthday', icon: Gift },
  { label: 'Business Dining', icon: Briefcase },
  { label: 'Date Night', icon: Sparkles },
];

export function OccasionChips({ selected, onSelect }: OccasionChipsProps) {
  return (
    <div className="w-full">
      <h3 className="text-xs font-semibold text-[#E2A84B] tracking-[0.2em] uppercase mb-2.5">
        Special Occasion (Optional)
      </h3>
      <div className="flex flex-wrap gap-2">
        {occasions.map((occ) => {
          const isSelected = selected === occ.label;
          const Icon = occ.icon;
          return (
            <button
              key={occ.label}
              type="button"
              onClick={() => onSelect(occ.label)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#0E1F18] border-[1.5px] border-[#E2A84B] text-[#F6D386] shadow-[0_0_12px_rgba(226,168,75,0.25)]'
                  : 'bg-[#16110E] border-white/[0.07] text-[#9A9286] hover:text-[#FAF5EC] hover:border-white/20'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5 text-[#E2A84B]" />}
              <span>{occ.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
