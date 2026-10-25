'use client';

import React from 'react';
import { X, Leaf, Circle } from 'lucide-react';

interface IngredientPanelProps {
  ingredients: string[];
  isOpen: boolean;
  onClose: () => void;
}

export function IngredientPanel({ ingredients, isOpen, onClose }: IngredientPanelProps) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-in-out transform ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-obsidian/90 backdrop-blur-lg border-t border-primary/20 rounded-t-3xl p-6 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] max-h-[50vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center space-x-2 text-primary">
            <Leaf size={18} />
            <h3 className="font-heading text-lg font-semibold tracking-wider text-text-primary">Ingredients</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-text-primary/70 hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="overflow-y-auto overflow-x-hidden flex-1 pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 gap-3 pb-4">
            {ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-white/5 border border-white/5 rounded-xl p-3"
              >
                <Circle size={8} className="fill-primary text-primary shrink-0" />
                <span className="text-sm text-text-primary/80 capitalize truncate">{ingredient}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
