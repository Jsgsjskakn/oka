'use client';

import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 mb-6 max-w-2xl mx-auto w-full">
      <div className="relative flex items-center w-full h-12 rounded-2xl bg-[#09150d]/90 border border-white/10 focus-within:border-[#d4af37]/60 transition-all shadow-inner">
        <div className="pl-4 pr-3 text-white/45">
          <Search className="w-4 h-4 text-[#d4af37]" />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by dish name, spice level, or ingredients (e.g. Paneer, Makhani)..."
          aria-label="Search dishes"
          className="flex-1 h-full bg-transparent text-xs sm:text-sm text-white placeholder:text-white/40 outline-none pr-3"
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="pr-4 text-white/45 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
