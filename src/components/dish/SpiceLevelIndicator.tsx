'use client';

import { Flame } from 'lucide-react';
import type { SpiceLevel } from '@/types/menu';

interface SpiceLevelIndicatorProps {
  level: SpiceLevel;
}

export function SpiceLevelIndicator({ level }: SpiceLevelIndicatorProps) {
  let indicatorLevel = 1;
  if (level === 'medium') indicatorLevel = 2;
  if (level === 'hot') indicatorLevel = 3;
  if (level === 'extra-hot') indicatorLevel = 4;

  const labels = {
    'mild': 'Mild',
    'medium': 'Medium',
    'hot': 'Hot',
    'extra-hot': 'Extra Hot'
  };

  return (
    <div className="px-4 py-4 border-t border-white/5 flex items-center justify-between">
      <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-widest">
        Spice Level
      </h3>
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-primary/70 font-medium">
          {labels[level]}
        </span>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3].map((idx) => (
            <Flame 
              key={idx} 
              className={`w-3.5 h-3.5 ${
                idx <= indicatorLevel 
                  ? 'text-red-500 fill-red-500' 
                  : 'text-text-primary/20'
              }`} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
