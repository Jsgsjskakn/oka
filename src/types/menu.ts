export type DishCategory = 'pizza' | 'burger' | 'chinese' | 'starters' | 'desserts';

export type SpiceLevel = 'mild' | 'medium' | 'hot' | 'extra-hot';

export interface SizeOption {
  id: string;
  name: string;
  priceModifier: number;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
}

export interface Dish {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: DishCategory;
  isVeg: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  spiceLevel: SpiceLevel;
  calories?: number;
  preparationTime?: string;
  ingredients?: string[];
  allergens?: string[];
  sizes?: SizeOption[];
  addOns?: AddOn[];
  removableIngredients?: string[];
  has3DModel: boolean;
  modelUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  dishCount: number;
}

export interface Restaurant {
  name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  rating: number;
  reviewCount: number;
}
