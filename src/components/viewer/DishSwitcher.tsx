'use client';

import React, { useRef, useState, useCallback } from 'react';
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
  currentCategory?: string;
  onSwitchDish: (dishId: string) => void;
}

export function DishSwitcher({
  dishes,
  currentDishId,
  currentCategory,
  onSwitchDish,
}: DishSwitcherProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setMouseX(e.clientX);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouseX(null);
    setHoveredIdx(null);
  }, []);

  // Compute magnetic scale & translateY for a given item index
  const getTransformStyle = (idx: number) => {
    const isActive = dishes[idx].id === currentDishId;

    if (mouseX === null) {
      // Resting default state
      return {
        transform: isActive ? 'scale(1.1) translateY(-2px)' : 'scale(1) translateY(0px)',
        zIndex: isActive ? 10 : 1,
        transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease',
      };
    }

    const el = itemRefs.current[idx];
    if (!el) {
      return {
        transform: isActive ? 'scale(1.1) translateY(-2px)' : 'scale(1) translateY(0px)',
        zIndex: isActive ? 10 : 1,
      };
    }

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const dist = Math.abs(mouseX - centerX);
    const radius = 95; // Magnetic attraction boundary in pixels

    if (dist < radius) {
      // Smooth cosine curve for magnetic magnification
      const intensity = Math.cos((dist / radius) * (Math.PI / 2));
      const scale = 1.0 + (isActive ? 0.38 : 0.45) * intensity;
      const translateY = -14 * intensity;

      return {
        transform: `scale(${scale.toFixed(3)}) translateY(${translateY.toFixed(1)}px)`,
        zIndex: Math.round(20 + intensity * 10),
        transition: 'transform 0.08s ease-out',
      };
    }

    return {
      transform: isActive ? 'scale(1.08) translateY(-2px)' : 'scale(1) translateY(0px)',
      zIndex: isActive ? 10 : 1,
      transition: 'transform 0.15s ease-out',
    };
  };

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-35 pointer-events-auto max-w-[95vw] sm:max-w-4xl select-none"
      style={{ bottom: 0 }}
    >
      {/* Curved Dark Glass Rail with Magnetic Track touching bottom */}
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative flex items-center gap-2 px-3.5 pt-2 pb-2 sm:pb-3 rounded-t-2xl rounded-b-none bg-[rgba(16,12,9,0.92)] backdrop-blur-2xl border-t border-x border-[#F0C36B]/40 border-b-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.18),0_-8px_32px_rgba(0,0,0,0.9)]"
      >
        {/* Category Pill Tag */}
        {currentCategory && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F0C36B]/15 border border-[#F0C36B]/30 text-[#F0C36B] shrink-0 text-[10px] uppercase font-bold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F0C36B] animate-pulse" />
            <span>{currentCategory} ({dishes.length})</span>
          </div>
        )}

        {/* Left Scroll Arrow */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.1] text-[#F0C36B] border border-white/5 active:scale-90 transition-all shrink-0 cursor-pointer"
          aria-label="Previous dishes"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Scrollable Filmstrip of Dishes with Magnetic Scale */}
        <div
          ref={scrollRef}
          className="overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-2.5 py-3 px-1 max-w-[78vw] sm:max-w-3xl overflow-y-visible"
        >
          {dishes.map((dish, idx) => {
            const isActive = dish.id === currentDishId;
            const isHovered = hoveredIdx === idx;
            const style = getTransformStyle(idx);

            return (
              <div key={dish.id} className="relative shrink-0 flex items-center justify-center">
                {/* Magnetic Hover Tooltip */}
                {isHovered && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#120E0B]/95 border border-[#F0C36B]/60 shadow-[0_4px_20px_rgba(0,0,0,0.85)] backdrop-blur-md flex items-center gap-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        dish.isVeg ? 'bg-emerald-400' : 'bg-amber-500'
                      }`}
                    />
                    <span className="font-serif text-[11px] font-semibold text-[#FAF5EC]">
                      {dish.name}
                    </span>
                    {dish.price !== undefined && (
                      <span className="font-mono text-[10px] font-bold text-[#F0C36B]">
                        ₹{Math.round(dish.price)}
                      </span>
                    )}
                  </div>
                )}

                {/* Dish Thumb Button with Magnetic Transform */}
                <button
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  type="button"
                  onClick={() => onSwitchDish(dish.id)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  style={style}
                  className={`relative shrink-0 rounded-xl overflow-hidden cursor-pointer focus:outline-none will-change-transform ${
                    isActive
                      ? 'w-12 h-12 sm:w-14 sm:h-14 border-2 border-[#F0C36B] shadow-[0_0_22px_rgba(240,195,107,0.7)] ring-2 ring-[#F0C36B]/30'
                      : 'w-11 h-11 sm:w-12 sm:h-12 border border-white/15 opacity-80 hover:opacity-100 hover:border-[#F0C36B]/60 shadow-[0_4px_16px_rgba(0,0,0,0.4)]'
                  }`}
                  title={dish.name}
                >
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover pointer-events-none"
                    loading="lazy"
                  />
                  {/* Active Gold Indicator Underlay */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-t from-[#F0C36B]/30 via-transparent to-transparent pointer-events-none" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Right Scroll Arrow */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.1] text-[#F0C36B] border border-white/5 active:scale-90 transition-all shrink-0 cursor-pointer"
          aria-label="Next dishes"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
