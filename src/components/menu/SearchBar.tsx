'use client';

import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="px-4 mb-4">
      <div className="relative flex items-center w-full h-12 rounded-full bg-[#1a1a1a] border border-border-subtle focus-within:border-champagne/50 transition-colors shadow-inner">
        <div className="pl-4 pr-3 text-muted-foreground">
          <Search className="w-5 h-5" />
        </div>
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search dishes, ingredients..."
          className="flex-1 h-full bg-transparent text-sm text-text-primary placeholder:text-muted-foreground outline-none"
        />
        
        {value && (
          <button
            onClick={() => onChange('')}
            className="px-4 text-muted-foreground hover:text-text-primary transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
