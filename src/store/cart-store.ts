import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Dish, SizeOption, AddOn } from '@/types/menu';

export const MAX_ITEM_QUANTITY = 50;

export type CartDiningMode = 'dine-in' | 'pre-order' | 'takeaway';

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
  diningMode: CartDiningMode;
  tableNumber: string;
  setDiningMode: (mode: CartDiningMode) => void;
  setTableNumber: (tableNumber: string) => void;
  addItem: (
    dish: Dish,
    quantity?: number,
    customizations?: {
      size?: SizeOption;
      selectedAddOns?: AddOn[];
      removedIngredients?: string[];
      specialInstructions?: string;
    }
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateItemInstructions: (cartItemId: string, specialInstructions: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getTotalPricePaise: () => number;
}

export function getItemUnitPaise(item: CartItem): number {
  const basePaise = (item.dish as any)?.price_paise !== undefined && !item.dish?.price
    ? Math.max(0, Math.round(Number((item.dish as any).price_paise) || 0))
    : Math.max(0, Math.round((Number(item.dish?.price) || 0) * 100));
  const sizePaise = item.size ? Math.round((Number(item.size.priceModifier) || 0) * 100) : 0;
  const addonsPaise = item.selectedAddOns
    ? item.selectedAddOns.reduce(
        (sum, addon) => sum + Math.max(0, Math.round((Number(addon.price) || 0) * 100)),
        0
      )
    : 0;
  return Math.max(0, basePaise + sizePaise + addonsPaise);
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

// Helper to generate a unique ID based on canonical dish key and customizations
const generateCartItemId = (
  dishKey: string,
  sizeId?: string,
  addOnIds?: string[],
  removed?: string[],
  notes?: string
) => {
  const parts = [dishKey];
  if (sizeId) parts.push(`s-${sizeId}`);
  if (addOnIds?.length) parts.push(`a-${[...addOnIds].sort().join(',')}`);
  if (removed?.length) parts.push(`r-${[...removed].sort().join(',')}`);
  const trimmedNotes = notes?.trim();
  if (trimmedNotes) parts.push(`n-${safeHash(trimmedNotes)}`);
  return parts.join('_');
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      diningMode: 'dine-in',
      tableNumber: '',
      setDiningMode: (mode) => set({ diningMode: mode }),
      setTableNumber: (tableNumber) =>
        set({ tableNumber: tableNumber.replace(/\D/g, '').slice(0, 2) }),
      addItem: (dish, rawQuantity = 1, customizations = {}) => {
        const parsedQty = Number.isFinite(rawQuantity) ? Math.floor(rawQuantity) : 1;
        const safeQuantity = Math.max(1, Math.min(MAX_ITEM_QUANTITY, parsedQty));
        const { size, selectedAddOns, removedIngredients } = customizations;
        const specialInstructions = customizations.specialInstructions?.trim() || undefined;

        const canonicalKey = dish.slug || dish.id;
        const addOnIds = selectedAddOns?.map((a) => a.id);
        const cartItemId = generateCartItemId(
          canonicalKey,
          size?.id,
          addOnIds,
          removedIngredients,
          specialInstructions
        );
        const legacyCartItemId = generateCartItemId(
          dish.id,
          size?.id,
          addOnIds,
          removedIngredients,
          specialInstructions
        );

        const items = get().items;
        const existingIndex = items.findIndex(
          (item) => item.cartItemId === cartItemId || item.cartItemId === legacyCartItemId
        );

        if (existingIndex >= 0) {
          const newItems = [...items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: Math.min(MAX_ITEM_QUANTITY, newItems[existingIndex].quantity + safeQuantity),
          };
          set({ items: newItems });
        } else {
          set({
            items: [
              ...items,
              {
                cartItemId,
                dish,
                quantity: safeQuantity,
                size,
                selectedAddOns,
                removedIngredients,
                specialInstructions,
              },
            ],
          });
        }
      },
      removeItem: (cartItemId) => set({ items: get().items.filter((item) => item.cartItemId !== cartItemId) }),
      updateQuantity: (cartItemId, rawQuantity) => {
        if (!Number.isFinite(rawQuantity)) return;
        const quantity = Math.floor(rawQuantity);
        if (quantity <= 0) {
          set({ items: get().items.filter((item) => item.cartItemId !== cartItemId) });
        } else {
          const clamped = Math.min(MAX_ITEM_QUANTITY, quantity);
          set({
            items: get().items.map((item) =>
              item.cartItemId === cartItemId ? { ...item, quantity: clamped } : item
            ),
          });
        }
      },
      updateItemInstructions: (cartItemId, rawInstructions) => {
        const items = get().items;
        const currentIndex = items.findIndex((item) => item.cartItemId === cartItemId);
        if (currentIndex < 0) return;

        const targetItem = items[currentIndex];
        const trimmedNotes = rawInstructions.trim() || undefined;
        const canonicalKey = targetItem.dish.slug || targetItem.dish.id;
        const newCartItemId = generateCartItemId(
          canonicalKey,
          targetItem.size?.id,
          targetItem.selectedAddOns?.map((a) => a.id),
          targetItem.removedIngredients,
          trimmedNotes
        );

        const mergeIndex = items.findIndex(
          (item, idx) => idx !== currentIndex && item.cartItemId === newCartItemId
        );

        if (mergeIndex >= 0) {
          const mergedQty = Math.min(
            MAX_ITEM_QUANTITY,
            items[mergeIndex].quantity + targetItem.quantity
          );
          const nextItems = items
            .map((item, idx) =>
              idx === mergeIndex ? { ...item, quantity: mergedQty } : item
            )
            .filter((_, idx) => idx !== currentIndex);
          set({ items: nextItems });
        } else {
          const nextItems = [...items];
          nextItems[currentIndex] = {
            ...targetItem,
            cartItemId: newCartItemId,
            specialInstructions: trimmedNotes,
          };
          set({ items: nextItems });
        }
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () =>
        get().items.reduce((total, item) => {
          const q = Number.isFinite(item.quantity) ? Math.max(0, Math.floor(item.quantity)) : 0;
          return total + q;
        }, 0),
      getTotalPricePaise: () => {
        return get().items.reduce((total, item) => {
          const qty = Number.isFinite(item.quantity) ? Math.max(0, Math.floor(item.quantity)) : 0;
          const unitPaise = getItemUnitPaise(item);
          return total + unitPaise * qty;
        }, 0);
      },
      getTotalPrice: () => {
        return get().getTotalPricePaise() / 100;
      },
    }),
    {
      name: 'golden-oak-cart',
    }
  )
);
