'use client';

import { AlertTriangle } from 'lucide-react';

interface AllergenInfoProps {
  allergens?: string[];
}

export function AllergenInfo({ allergens }: AllergenInfoProps) {
  if (!allergens || allergens.length === 0) return null;

  return (
    <div className="px-4 py-4 border-t border-white/5">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest mb-1">
            Contains Allergens
          </h3>
          <p className="text-xs text-text-primary/70 leading-relaxed">
            {allergens.join(', ')}
          </p>
        </div>
      </div>
    </div>
  );
}
