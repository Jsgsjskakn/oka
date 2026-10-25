'use client';

import Image from 'next/image';
import { Plus } from 'lucide-react';
import type { Dish } from '@/types/menu';

interface VerticalDishCardProps {
  dish: Dish;
  onAdd?: (dish: Dish) => void;
  rank?: number;
}

export function VerticalDishCard({ dish, onAdd, rank }: VerticalDishCardProps) {
  return (
    <div className="flex-none w-[180px] glass-card rounded-2xl overflow-hidden group transition-transform hover:scale-[1.02] relative">
      {rank && (
        <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-gradient-to-br from-champagne to-[#a88a3d] flex items-center justify-center text-black font-bold z-10 text-sm shadow-lg">
          {rank}
        </div>
      )}
      
      <div className="relative aspect-square w-full">
        <Image
          src={dish.image || '/images/dishes/placeholder.jpg'}
          alt={dish.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-3 relative flex flex-col h-[110px]">
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 className="font-heading text-sm font-semibold text-text-primary line-clamp-2 leading-tight flex-1">
            {dish.name}
          </h3>
          <div className="flex items-center justify-center w-3 h-3 rounded-[2px] bg-white p-[2px] mt-0.5 shrink-0">
            <div className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>
        
        <div className="mt-auto flex items-center justify-between">
          <span className="text-sm font-medium text-primary">₹{dish.price}</span>
          <button 
            onClick={() => onAdd?.(dish)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-text-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
