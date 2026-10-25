'use client';

const iconMap: Record<string, string> = {
  'pizza': '🍕',
  'burger': '🍔',
  'utensils': '🍜',
  'flame': '🔥',
  'ice-cream': '🍨',
  'coffee': '☕',
  'chinese': '🥡',
  'starters': '🍤',
  'desserts': '🍰',
  'drinks': '🍹'
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
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${
        isActive 
          ? 'bg-obsidian border border-primary text-primary shadow-[0_0_10px_rgba(201,168,76,0.2)]' 
          : 'bg-[#111] border border-white/5 text-muted-foreground hover:bg-[#1a1a1a] hover:text-text-primary'
      }`}
    >
      <span className="text-lg">{displayIcon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
