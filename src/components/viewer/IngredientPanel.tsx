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
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        role="dialog"
        aria-modal={isOpen}
        aria-label="Dish Ingredients"
        className={`fixed bottom-0 left-0 right-0 z-[65] transition-transform duration-300 ease-out transform sm:max-w-xl sm:mx-auto ${
          isOpen ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'
        }`}
      >
        <div className="bg-obsidian/95 backdrop-blur-xl border-t sm:border-x border-[#F0C36B]/30 rounded-t-3xl p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.65)] max-h-[60dvh] flex flex-col">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <div className="flex items-center space-x-2 text-primary">
              <Leaf size={18} />
              <h3 className="font-heading text-lg font-semibold tracking-wider text-text-primary">
                Artisanal Ingredients
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close ingredients"
              className="min-w-[44px] min-h-[44px] rounded-full bg-white/5 hover:bg-white/10 transition-colors text-text-primary/70 hover:text-text-primary flex items-center justify-center cursor-pointer touch-manipulation"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="overflow-y-auto overflow-x-hidden flex-1 pr-1 hide-scrollbar">
            {ingredients.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-2">
                {ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl p-3"
                  >
                    <Circle size={8} className="fill-primary text-primary shrink-0" />
                    <span className="text-sm text-text-primary/90 capitalize truncate">{ingredient}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-primary/60 py-4 text-center">
                Handcrafted fresh per order by The Golden Oak culinary kitchen.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
