'use client';

import { Wine, Gift, Briefcase, Sparkles, Ban, LucideIcon } from 'lucide-react';

interface OccasionChipsProps {
  selected: string;
  onSelect: (occasion: string) => void;
}

const occasions: Array<{ label: string; icon: LucideIcon }> = [
  { label: 'None', icon: Ban },
  { label: 'Anniversary', icon: Wine },
  { label: 'Birthday', icon: Gift },
  { label: 'Business Dining', icon: Briefcase },
  { label: 'Date Night', icon: Sparkles },
];

export function OccasionChips({ selected, onSelect }: OccasionChipsProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2.5">
        <Sparkles className="w-3.5 h-3.5 text-[#F0C36B]" />
        <h3 className="text-xs font-semibold text-[#F0C36B] tracking-[0.2em] uppercase font-mono">
          SPECIAL OCCASION (OPTIONAL)
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {occasions.map((occ) => {
          const isSelected = selected === occ.label;
          const Icon = occ.icon;
          return (
            <button
              key={occ.label}
              type="button"
              onClick={() => onSelect(occ.label)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 ${
                isSelected
                  ? 'bg-[#F0C36B]/20 border-[1.5px] border-[#F0C36B] text-[#FFE3A5] shadow-[0_0_12px_rgba(240,195,107,0.3)]'
                  : 'bg-white/[0.04] backdrop-blur-md border-white/[0.08] text-[#A99A88] hover:text-[#F8F2E8] hover:border-[#F0C36B]/40 hover:bg-white/[0.07]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#F0C36B]' : 'text-[#A99A88]'}`} />
              <span className="truncate">{occ.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
