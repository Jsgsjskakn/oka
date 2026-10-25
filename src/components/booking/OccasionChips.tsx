'use client';

interface OccasionChipsProps {
  selected: string;
  onSelect: (occasion: string) => void;
}

const occasions = ['None', 'Birthday', 'Anniversary', 'Business', 'Family', 'Other'];

export function OccasionChips({ selected, onSelect }: OccasionChipsProps) {
  return (
    <div className="px-4 py-6 border-b border-white/5">
      <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-4">
        Occasion
      </h3>
      <div className="flex flex-wrap gap-2">
        {occasions.map((occasion) => {
          const isSelected = selected === occasion;
          return (
            <button
              key={occasion}
              onClick={() => onSelect(occasion)}
              className={`px-4 py-2 rounded-full border text-xs font-medium transition-all active:scale-95 ${
                isSelected 
                  ? 'bg-primary border-primary text-black shadow-[0_0_15px_rgba(201,168,76,0.2)]' 
                  : 'bg-[#1a1a1a] border-border-subtle text-text-primary/70 hover:border-white/30'
              }`}
            >
              {occasion}
            </button>
          );
        })}
      </div>
    </div>
  );
}
