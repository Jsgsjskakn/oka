'use client';

interface TablePreferenceSelectorProps {
  selected: string;
  onSelect: (preference: string) => void;
}

const preferences = ['No preference', 'Indoor', 'Outdoor'];

export function TablePreferenceSelector({ selected, onSelect }: TablePreferenceSelectorProps) {
  return (
    <div className="px-4 py-6 border-b border-white/5 pb-32">
      <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-4">
        Table Preference
      </h3>
      <div className="flex gap-2">
        {preferences.map((pref) => {
          const isSelected = selected === pref;
          return (
            <button
              key={pref}
              onClick={() => onSelect(pref)}
              className={`flex-1 py-3 rounded-xl border text-xs font-medium transition-all active:scale-95 ${
                isSelected 
                  ? 'bg-primary border-primary text-black shadow-[0_0_15px_rgba(201,168,76,0.2)]' 
                  : 'bg-[#1a1a1a] border-border-subtle text-text-primary/70 hover:border-white/30'
              }`}
            >
              {pref}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-text-primary/30 mt-3 text-center">
        Preferences are subject to availability.
      </p>
    </div>
  );
}
