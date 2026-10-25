'use client';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSlotGridProps {
  selectedTime: string | null;
  onSelect: (time: string) => void;
  slots?: TimeSlot[];
}

export function TimeSlotGrid({ selectedTime, onSelect, slots }: TimeSlotGridProps) {
  // Generate default slots if none provided
  const timeSlots = slots || Array.from({ length: 24 }).map((_, i) => {
    const hour = Math.floor(i / 2) + 12; // 12 PM to 11:30 PM
    const isHalf = i % 2 === 1;
    const date = new Date();
    date.setHours(hour, isHalf ? 30 : 0);
    return {
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      available: true
    };
  });

  return (
    <div className="px-4 py-6 border-b border-white/5">
      <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-4">
        Select Time
      </h3>
      
      <div className="grid grid-cols-3 gap-3">
        {timeSlots.map(({ time, available }) => {
          const isSelected = selectedTime === time;
          
          return (
            <button
              key={time}
              disabled={!available}
              onClick={() => onSelect(time)}
              className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                !available 
                  ? 'bg-white/5 text-text-primary/20 cursor-not-allowed border border-transparent' 
                  : isSelected
                    ? 'bg-primary text-black border border-primary shadow-[0_0_15px_rgba(201,168,76,0.3)]'
                    : 'bg-[#1a1a1a] text-text-primary/80 border border-border-subtle hover:border-white/30 active:scale-95'
              }`}
            >
              {available ? time : 'Full'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
