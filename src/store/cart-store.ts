import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Dish, SizeOption, AddOn } from '@/types/menu';

export const MAX_ITEM_QUANTITY = 50;

export interface CartItem {
  cartItemId: string;
  dish: Dish;
  quantity: number;
  size?: SizeOption;
  selectedAddOns?: AddOn[];
  removedIngredients?: string[];
  specialInstructions?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (
    dish: Dish,
    quantity: number,
    customizations?: {
      size?: SizeOption;
      selectedAddOns?: AddOn[];
      removedIngredients?: string[];
      specialInstructions?: string;
    }
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

function safeHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Helper to generate a unique ID based on dish and customizations
const generateCartItemId = (
  dishId: string,
  sizeId?: string,
  addOnIds?: string[],
  removed?: string[],
  notes?: string
) => {
  const parts = [dishId];
  if (sizeId) parts.push(`s-${sizeId}`);
  if (addOnIds?.length) parts.push(`a-${addOnIds.sort().join(',')}`);
  if (removed?.length) parts.push(`r-${[...removed].sort().join(',')}`);
  if (notes) parts.push(`n-${safeHash(notes)}`);
  return parts.join('_');
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (dish, rawQuantity = 1, customizations = {}) => {
        const safeQuantity = Math.max(1, Math.min(MAX_ITEM_QUANTITY, Math.floor(rawQuantity)));
        const { size, selectedAddOns, removedIngredients, specialInstructions } = customizations;
        
        const cartItemId = generateCartItemId(
          dish.id,
          size?.id,
          selectedAddOns?.map(a => a.id),
          removedIngredients,
          specialInstructions
        );

        const items = get().items;
        const existingIndex = items.findIndex((item) => item.cartItemId === cartItemId);

        if (existingIndex >= 0) {
          const newItems = [...items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: Math.min(MAX_ITEM_QUANTITY, newItems[existingIndex].quantity + safeQuantity),
          };
          set({ items: newItems });
        } else {
          set({ 
            items: [...items, { 
              cartItemId, 
              dish, 
              quantity: safeQuantity, 
              size, 
              selectedAddOns, 
              removedIngredients, 
              specialInstructions 
            }] 
          });
        }
      },
      removeItem: (cartItemId) => set({ items: get().items.filter((item) => item.cartItemId !== cartItemId) }),
      updateQuantity: (cartItemId, rawQuantity) => {
        const quantity = Math.floor(rawQuantity);
        if (quantity <= 0) {
          set({ items: get().items.filter((item) => item.cartItemId !== cartItemId) });
        } else {
          const clamped = Math.min(MAX_ITEM_QUANTITY, quantity);
          set({ items: get().items.map((item) => item.cartItemId === cartItemId ? { ...item, quantity: clamped } : item) });
        }
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getTotalPrice: () => get().items.reduce((total, item) => {
        let itemPrice = item.dish.price;
        if (item.size) itemPrice += item.size.priceModifier;
        if (item.selectedAddOns) {
          itemPrice += item.selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
        }
        return total + (itemPrice * item.quantity);
      }, 0),
    }),
    {
      name: 'golden-oak-cart',
    }
  )
);
