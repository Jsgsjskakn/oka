'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart-store';
import type { Dish, SizeOption, AddOn } from '@/types/menu';

import { DishDetailHero } from '@/components/dish/DishDetailHero';
import { DishInfoSection } from '@/components/dish/DishInfoSection';
import { IngredientChips } from '@/components/dish/IngredientChips';
import { AllergenInfo } from '@/components/dish/AllergenInfo';
import { SpiceLevelIndicator } from '@/components/dish/SpiceLevelIndicator';
import { CustomizationControls } from '@/components/dish/CustomizationControls';
import { Future3DARTeaser } from '@/components/dish/Future3DARTeaser';
import { FixedAddToCartBar } from '@/components/dish/FixedAddToCartBar';
import { RecommendationCarousel } from '@/components/dish/RecommendationCarousel';

interface DishDetailClientProps {
  dish: Dish;
  recommendations: Dish[];
}

export function DishDetailClient({ dish, recommendations }: DishDetailClientProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<SizeOption | undefined>(
    dish.sizes && dish.sizes.length > 0 ? dish.sizes[1] || dish.sizes[0] : undefined // Default to medium if available
  );
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [removedIngredients, setRemovedIngredients] = useState<Set<string>>(new Set());
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Calculate Total Price in integer paise to prevent float precision drift
  const basePaise = Math.round((dish.price + (selectedSize?.priceModifier || 0)) * 100);
  const addOnsPaise = Array.from(selectedAddOns).reduce((total, id) => {
    const addon = dish.addOns?.find((a) => a.id === id);
    return total + Math.round((addon?.price || 0) * 100);
  }, 0);
  const totalPrice = ((basePaise + addOnsPaise) * quantity) / 100;

  const handleAddOnToggle = (id: string) => {
    const next = new Set(selectedAddOns);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAddOns(next);
  };

  const handleRemoveToggle = (item: string) => {
    const next = new Set(removedIngredients);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    setRemovedIngredients(next);
  };

  const handleAddToCart = () => {
    const addOns = Array.from(selectedAddOns)
      .map(id => dish.addOns?.find(a => a.id === id))
      .filter((a): a is AddOn => a !== undefined);

    addItem(dish, quantity, {
      size: selectedSize,
      selectedAddOns: addOns,
      removedIngredients: Array.from(removedIngredients),
      specialInstructions: specialInstructions.trim()
    });

    // Optionally show a mini toast or redirect
    router.push('/cart');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      <div className="max-w-3xl mx-auto w-full">
        <DishDetailHero dish={dish} />
        <DishInfoSection dish={dish} />
        <IngredientChips ingredients={dish.ingredients} />
        <AllergenInfo allergens={dish.allergens} />
        {dish.spiceLevel && <SpiceLevelIndicator level={dish.spiceLevel} />}

        <CustomizationControls
          sizes={dish.sizes}
          addOns={dish.addOns}
          removables={dish.removableIngredients}
          selectedSize={selectedSize}
          selectedAddOns={selectedAddOns}
          removedIngredients={removedIngredients}
          specialInstructions={specialInstructions}
          onSizeSelect={setSelectedSize}
          onAddOnToggle={handleAddOnToggle}
          onRemoveToggle={handleRemoveToggle}
          onInstructionsChange={setSpecialInstructions}
        />

        <Future3DARTeaser dish={dish} />

        <RecommendationCarousel dishes={recommendations} />
      </div>

      <FixedAddToCartBar
        quantity={quantity}
        totalPrice={totalPrice}
        onQuantityChange={setQuantity}
        onAdd={handleAddToCart}
      />
    </div>
  );
}
