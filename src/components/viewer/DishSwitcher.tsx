'use client';

import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DishSwitcherItem {
  id: string;
  name: string;
  image: string;
  price?: number;
  category?: string;
  isVeg?: boolean;
}

interface DishSwitcherProps {
  dishes: DishSwitcherItem[];
  currentDishId: string;
  onSwitchDish: (dishId: string) => void;
}

export function DishSwitcher({ dishes, currentDishId, onSwitchDish }: DishSwitcherProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed bottom-[185px] sm:bottom-[160px] left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[95vw] sm:max-w-4xl">
      {/* Floating Frosted Glass Tray */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[rgba(13,10,8,0.85)] backdrop-blur-xl border border-[rgba(226,168,75,0.18)] shadow-[0_16px_40px_rgba(0,0,0,0.7)]">
        {/* Left Scroll Arrow */}
        <button
          onClick={() => scroll('left')}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] text-[#E2A84B] border border-white/5 active:scale-90 transition-all shrink-0"
          aria-label="Scroll dishes left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Filmstrip */}
        <div
          ref={scrollRef}
          className="overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-2.5 py-1 px-1 max-w-[78vw] sm:max-w-3xl"
        >
          {dishes.map((dish) => {
            const isActive = dish.id === currentDishId;
            const isHovered = hoveredId === dish.id;
            const showExpanded = isActive || isHovered;

            return (
              <button
                key={dish.id}
                onClick={() => onSwitchDish(dish.id)}
                onMouseEnter={() => setHoveredId(dish.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`transition-all duration-300 shrink-0 text-left cursor-pointer focus:outline-none ${
                  showExpanded
                    ? 'flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-[#1B140F] border-[1.5px] border-[#E2A84B] shadow-[0_0_18px_rgba(226,168,75,0.35)] -translate-y-1 opacity-100 z-10'
                    : 'w-14 h-14 rounded-lg overflow-hidden border border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                }`}
                title={dish.name}
              >
                {/* Dish Photo */}
                <div
                  className={`overflow-hidden rounded-lg shrink-0 bg-dark ${
                    showExpanded ? 'w-10 h-10' : 'w-full h-full'
                  }`}
                >
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Expanded Dish Name & Price (No truncation!) */}
                {showExpanded && (
                  <div className="flex flex-col min-w-[120px] max-w-[200px] pr-2">
                    <span className="text-xs font-semibold text-[#FAF5EC] whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                      {dish.name}
                    </span>
                    {dish.price !== undefined && dish.price > 0 && (
                      <span className="text-[11px] font-mono font-bold text-[#E2A84B] mt-0.5">
                        ₹{dish.price}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Scroll Arrow */}
        <button
          onClick={() => scroll('right')}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] text-[#E2A84B] border border-white/5 active:scale-90 transition-all shrink-0"
          aria-label="Scroll dishes right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
