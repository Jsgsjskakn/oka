'use client';

interface PickupTimeChipsProps {
  selectedTime: string | null;
  onSelect: (time: string) => void;
}

const pickupSlots = [
  '15 min', '30 min', '45 min', '1 hr', '1.5 hr', '2 hr',
];

export function PickupTimeChips({ selectedTime, onSelect }: PickupTimeChipsProps) {
  return (
    <div className="px-4 py-6 border-b border-white/5">
      <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-4">
        Pickup Time
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {pickupSlots.map((slot) => {
          const isSelected = selectedTime === slot;
          return (
            <button
              key={slot}
              onClick={() => onSelect(slot)}
              className={`py-3 rounded-xl border text-xs font-medium transition-all active:scale-95 ${
                isSelected
                  ? 'bg-primary border-primary text-black shadow-[0_0_15px_rgba(201,168,76,0.2)]'
                  : 'bg-[#1a1a1a] border-border-subtle text-text-primary/70 hover:border-white/30'
              }`}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}
