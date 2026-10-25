'use client';

const iconMap: Record<string, string> = {
  pizza: '🍕',
  burger: '🍔',
  utensils: '🍜',
  flame: '🔥',
  'ice-cream': '🍨',
  coffee: '☕',
  chinese: '🥡',
  starters: '🍤',
  desserts: '🍰',
  drinks: '🍹',
};

interface CategoryChipProps {
  icon: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function CategoryChip({ icon, label, isActive = false, onClick }: CategoryChipProps) {
  const displayIcon = iconMap[icon] || icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-2xl whitespace-nowrap text-xs sm:text-sm transition-all duration-200 select-none ${
        isActive
          ? 'bg-gradient-to-r from-[#d4af37] to-[#b38936] text-black font-bold shadow-[0_6px_20px_rgba(212,175,55,0.25)] scale-[1.02]'
          : 'bg-[#09150d]/80 border border-white/10 text-white/70 hover:text-white hover:border-white/25 hover:bg-[#0c1a10]'
      }`}
    >
      <span className="text-base">{displayIcon}</span>
      <span className="tracking-tight">{label}</span>
    </button>
  );
}
