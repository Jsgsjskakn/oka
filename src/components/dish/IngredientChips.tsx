'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface IngredientChipsProps {
  ingredients?: string[];
}

export function IngredientChips({ ingredients }: IngredientChipsProps) {
  const [expanded, setExpanded] = useState(false);

  if (!ingredients || ingredients.length === 0) return null;

  const displayIngredients = expanded ? ingredients : ingredients.slice(0, 3);
  const hasMore = ingredients.length > 3;

  return (
    <div className="px-4 py-4 border-t border-white/5">
      <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-3">
        Key Ingredients
      </h3>
      <div className="flex flex-wrap gap-2">
        {displayIngredients.map((ingredient, idx) => (
          <span 
            key={idx}
            className="px-3 py-1.5 bg-[#141414] rounded-full text-xs text-text-primary/80 border border-white/5 shadow-inner"
          >
            {ingredient}
          </span>
        ))}
        {hasMore && !expanded && (
          <button 
            onClick={() => setExpanded(true)}
            className="px-3 py-1.5 bg-[#1a1a1a] rounded-full text-xs text-primary font-medium border border-primary/20 flex items-center gap-1 active:scale-95 transition-transform"
          >
            +{ingredients.length - 3} more
            <ChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>
      {expanded && (
        <button 
          onClick={() => setExpanded(false)}
          className="mt-3 text-xs text-primary/70 flex items-center gap-1 font-medium p-1 -ml-1 active:scale-95 transition-transform"
        >
          Show less
          <ChevronUp className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
