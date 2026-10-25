'use client';

import React from 'react';

interface DishSwitcherProps {
  dishes: Array<{ id: string; name: string; image: string }>;
  currentDishId: string;
  onSwitchDish: (dishId: string) => void;
}

export function DishSwitcher({ dishes, currentDishId, onSwitchDish }: DishSwitcherProps) {
  return (
    <div className="fixed bottom-[90px] left-0 right-0 z-30 pointer-events-none mb-2">
      <div className="overflow-x-auto no-scrollbar pointer-events-auto">
        <div className="flex items-center space-x-3 px-4 pb-2 w-max mx-auto">
          {dishes.map((dish) => {
            const isActive = dish.id === currentDishId;
            return (
              <button
                key={dish.id}
                onClick={() => onSwitchDish(dish.id)}
                className={`flex flex-col items-center space-y-1.5 transition-all duration-300 ${
                  isActive ? 'scale-110 opacity-100' : 'scale-100 opacity-60 hover:opacity-80'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                    isActive ? 'border-primary shadow-[0_0_10px_rgba(201,168,76,0.5)]' : 'border-border-subtle'
                  }`}
                >
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover bg-dark"
                    loading="lazy"
                  />
                </div>
                <span
                  className={`text-[8px] font-medium text-center max-w-[48px] truncate ${
                    isActive ? 'text-primary' : 'text-text-primary/60'
                  }`}
                >
                  {dish.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
