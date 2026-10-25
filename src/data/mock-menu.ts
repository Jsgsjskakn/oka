import { Category, Dish, DishCategory, Restaurant } from '../types/menu';

export const restaurantInfo: Restaurant = {
  name: 'The Golden Oak',
  tagline: 'Gourmet Indian Fusion & Artisanal Dining',
  description:
    'Experience luxury dining with premium Indian fusion flavors, hand-stretched wood-fired pizzas, handcrafted burgers, and signature street fare made from organic local ingredients.',
  address: '45 Golden Oak Boulevard, Indiranagar, Bengaluru, Karnataka 560038',
  phone: '+91 99907 74565',
  email: 'contact@thegoldenoak.in',
  openingHours: '12:00 PM - 11:30 PM (Daily)',
  rating: 4.8,
  reviewCount: 1240,
};

export const categories: Category[] = [
  {
    id: 'cat-pizza',
    name: 'Pizzas',
    slug: 'pizza',
    icon: 'pizza',
    dishCount: 5,
  },
  {
    id: 'cat-burger',
    name: 'Burgers',
    slug: 'burger',
    icon: 'burger',
    dishCount: 3,
  },
  {
    id: 'cat-chinese',
    name: 'Chinese',
    slug: 'chinese',
    icon: 'utensils',
    dishCount: 1,
  },
  {
    id: 'cat-starters',
    name: 'Starters',
    slug: 'starters',
    icon: 'flame',
    dishCount: 1,
  },
  {
    id: 'cat-desserts',
    name: 'Desserts',
    slug: 'desserts',
    icon: 'ice-cream',
    dishCount: 0,
  },
];

export const dishes: Dish[] = [
  // PIZZAS
  {
    id: 'tandoori-paneer-pizza',
    slug: 'tandoori-paneer-pizza',
    name: 'Tandoori Paneer Pizza',
    description:
      'Charcoal-grilled cottage cheese marinated in aromatic spices, topped with bell peppers, smoked mozzarella, and signature makhani glaze on artisan sourdough crust.',
    price: 449,
    originalPrice: 499,
    image: '/images/dishes/placeholder.jpg',
    category: 'pizza',
    isVeg: true,
    isAvailable: true,
    isFeatured: true,
    isBestSeller: true,
    spiceLevel: 'medium',
    calories: 780,
    preparationTime: '20-25 mins',
    ingredients: [
      'Sourdough Base',
      'Marinated Paneer',
      'Smoked Mozzarella',
      'Bell Peppers',
      'Red Onion',
      'Makhani Sauce Glaze',
      'Fresh Cilantro',
    ],
    allergens: ['Dairy', 'Gluten'],
    sizes: [
      { id: 'small', name: 'Small (8")', priceModifier: -50 },
      { id: 'medium', name: 'Medium (10")', priceModifier: 0 },
      { id: 'large', name: 'Large (12")', priceModifier: 150 }
    ],
    addOns: [
      { id: 'extra-cheese', name: 'Extra Cheese', price: 50 },
      { id: 'jalapenos', name: 'Jalapeños', price: 40 }
    ],
    removableIngredients: ['Red Onion', 'Bell Peppers'],
    has3DModel: true,
    modelUrl: '/models/tandoori-paneer-pizza.glb',
  },
  {
    id: 'chicken-tikka-pizza',
    slug: 'chicken-tikka-pizza',
    name: 'Chicken Tikka Pizza',
    description:
      'Tender clay-oven roasted chicken tikka morsels, caramelized onions, pickled jalapenos, aged cheddar, and freshly torn mint leaves on hand-stretched base.',
    price: 499,
    originalPrice: 549,
    image: '/images/dishes/placeholder.jpg',
    category: 'pizza',
    isVeg: false,
    isAvailable: true,
    isFeatured: true,
    isBestSeller: false,
    spiceLevel: 'medium',
    calories: 850,
    preparationTime: '20-25 mins',
    ingredients: [
      'Hand-stretched Crust',
      'Roasted Chicken Tikka',
      'Aged Cheddar',
      'Caramelized Onions',
      'Pickled Jalapenos',
      'Mint Chutney Drizzle',
    ],
    allergens: ['Dairy', 'Gluten'],
    sizes: [
      { id: 'small', name: 'Small (8")', priceModifier: -50 },
      { id: 'medium', name: 'Medium (10")', priceModifier: 0 },
      { id: 'large', name: 'Large (12")', priceModifier: 150 }
    ],
    addOns: [
      { id: 'extra-cheese', name: 'Extra Cheese', price: 50 },
      { id: 'jalapenos', name: 'Jalapeños', price: 40 }
    ],
    removableIngredients: ['Caramelized Onions', 'Pickled Jalapenos'],
    has3DModel: true,
    modelUrl: '/models/chicken-tikka-pizza.glb',
  },
  {
    id: 'mushroom-truffle-pizza',
    slug: 'mushroom-truffle-pizza',
    name: 'Mushroom Truffle Pizza',
    description:
      'Wild button & shiitake mushrooms sautéed in garlic butter, rich truffle cream base, creamy fontina cheese, thyme, and cold-pressed extra virgin olive oil.',
    price: 429,
    image: '/images/dishes/placeholder.jpg',
    category: 'pizza',
    isVeg: true,
    isAvailable: true,
    isFeatured: false,
    isBestSeller: false,
    spiceLevel: 'mild',
    calories: 720,
    preparationTime: '18-22 mins',
    ingredients: [
      'Sourdough Base',
      'Wild Mushrooms',
      'Truffle Cream Base',
      'Fontina Cheese',
      'Garlic',
      'Thyme',
      'Extra Virgin Olive Oil',
    ],
    allergens: ['Dairy', 'Gluten'],
    sizes: [
      { id: 'small', name: 'Small (8")', priceModifier: -50 },
      { id: 'medium', name: 'Medium (10")', priceModifier: 0 },
      { id: 'large', name: 'Large (12")', priceModifier: 150 }
    ],
    addOns: [
      { id: 'extra-cheese', name: 'Extra Cheese', price: 50 },
      { id: 'truffle-oil', name: 'Extra Truffle Oil', price: 60 }
    ],
    removableIngredients: ['Garlic', 'Thyme'],
    has3DModel: false,
  },
  {
    id: 'keema-masala-pizza',
    slug: 'keema-masala-pizza',
    name: 'Keema Masala Pizza',
    description:
      'Slow-cooked spiced minced lamb infused with whole cardamom and clove, layered with green chillies, smoked provolone, and fresh ginger juliennes.',
    price: 479,
    originalPrice: 529,
    image: '/images/dishes/placeholder.jpg',
    category: 'pizza',
    isVeg: false,
    isAvailable: true,
    isFeatured: false,
    isBestSeller: true,
    spiceLevel: 'hot',
    calories: 890,
    preparationTime: '22-25 mins',
    ingredients: [
      'Crisp Thin Crust',
      'Spiced Minced Lamb',
      'Smoked Provolone',
      'Green Chillies',
      'Ginger Juliennes',
      'Fresh Coriander',
    ],
    allergens: ['Dairy', 'Gluten'],
    sizes: [
      { id: 'small', name: 'Small (8")', priceModifier: -50 },
      { id: 'medium', name: 'Medium (10")', priceModifier: 0 },
      { id: 'large', name: 'Large (12")', priceModifier: 150 }
    ],
    addOns: [
      { id: 'extra-cheese', name: 'Extra Cheese', price: 50 },
      { id: 'extra-meat', name: 'Extra Keema', price: 80 }
    ],
    removableIngredients: ['Green Chillies', 'Ginger Juliennes'],
    has3DModel: false,
  },
  {
    id: 'farmhouse-supreme-pizza',
    slug: 'farmhouse-supreme-pizza',
    name: 'Farmhouse Supreme Pizza',
    description:
      'Garden-fresh crisp capsicum, golden sweet corn, sliced black olives, vine-ripened tomatoes, crisp onions, and rich mozzarella on classic San Marzano sauce.',
    price: 399,
    image: '/images/dishes/placeholder.jpg',
    category: 'pizza',
    isVeg: true,
    isAvailable: true,
    isFeatured: false,
    isBestSeller: false,
    spiceLevel: 'mild',
    calories: 650,
    preparationTime: '15-20 mins',
    ingredients: [
      'Classic Crust',
      'San Marzano Tomato Sauce',
      'Mozzarella Cheese',
      'Sweet Corn',
      'Capsicum',
      'Black Olives',
      'Tomatoes',
      'Onions',
    ],
    allergens: ['Dairy', 'Gluten'],
    sizes: [
      { id: 'small', name: 'Small (8")', priceModifier: -50 },
      { id: 'medium', name: 'Medium (10")', priceModifier: 0 },
      { id: 'large', name: 'Large (12")', priceModifier: 150 }
    ],
    addOns: [
      { id: 'extra-cheese', name: 'Extra Cheese', price: 50 },
      { id: 'jalapenos', name: 'Jalapeños', price: 40 }
    ],
    removableIngredients: ['Onions', 'Tomatoes', 'Capsicum'],
    has3DModel: false,
  },

  // BURGERS
  {
    id: 'golden-oak-signature-burger',
    slug: 'golden-oak-signature-burger',
    name: 'The Golden Oak Signature Burger',
    description:
      'Flame-grilled black angus patty stacked with smoked cheddar, truffle aioli, crisp butterhead lettuce, heirloom tomato, and caramelized bacon-onion jam in butter-toasted brioche.',
    price: 499,
    originalPrice: 549,
    image: '/images/dishes/placeholder.jpg',
    category: 'burger',
    isVeg: false,
    isAvailable: true,
    isFeatured: true,
    isBestSeller: true,
    spiceLevel: 'medium',
    calories: 920,
    preparationTime: '15-18 mins',
    ingredients: [
      'Toasted Brioche Bun',
      'Grilled Angus Patty',
      'Smoked Cheddar',
      'Truffle Aioli',
      'Bacon Onion Jam',
      'Butterhead Lettuce',
    ],
    allergens: ['Dairy', 'Gluten', 'Eggs'],
    addOns: [
      { id: 'extra-cheese', name: 'Extra Cheese', price: 40 },
      { id: 'extra-patty', name: 'Extra Patty', price: 150 },
      { id: 'truffle-fries', name: 'Truffle Fries (Side)', price: 120 }
    ],
    removableIngredients: ['Bacon Onion Jam', 'Butterhead Lettuce'],
    has3DModel: true,
    modelUrl: '/models/golden-oak-burger.glb',
  },
  {
    id: 'paneer-royale-burger',
    slug: 'paneer-royale-burger',
    name: 'Paneer Royale Burger',
    description:
      'Herb-crusted crispy cottage cheese steak dusted with peri-peri rub, dressed with spicy mint mayonnaise, crunchy red cabbage slaw, and melted Swiss cheese.',
    price: 299,
    image: '/images/dishes/placeholder.jpg',
    category: 'burger',
    isVeg: true,
    isAvailable: true,
    isFeatured: false,
    isBestSeller: false,
    spiceLevel: 'medium',
    calories: 750,
    preparationTime: '15-18 mins',
    ingredients: [
      'Sesame Brioche Bun',
      'Crispy Paneer Steak',
      'Swiss Cheese',
      'Mint Mayo',
      'Red Cabbage Slaw',
      'Peri-Peri Seasoning',
    ],
    allergens: ['Dairy', 'Gluten'],
    addOns: [
      { id: 'extra-cheese', name: 'Extra Cheese', price: 40 },
      { id: 'fries', name: 'Classic Fries (Side)', price: 90 }
    ],
    removableIngredients: ['Red Cabbage Slaw'],
    has3DModel: false,
  },
  {
    id: 'truffle-mushroom-cheese-burger',
    slug: 'truffle-mushroom-cheese-burger',
    name: 'Truffle Mushroom & Cheese Burger',
    description:
      'A rich blend of wild mushrooms and melted premium cheddar, topped with truffle aioli and crispy onion strings on a toasted artisanal bun.',
    price: 329,
    originalPrice: 369,
    image: '/images/dishes/placeholder.jpg',
    category: 'burger',
    isVeg: true,
    isAvailable: true,
    isFeatured: false,
    isBestSeller: false,
    spiceLevel: 'mild',
    calories: 840,
    preparationTime: '15-20 mins',
    ingredients: [
      'Artisanal Bun',
      'Wild Mushroom Patty',
      'Premium Cheddar',
      'Truffle Aioli',
      'Crispy Onion Strings',
      'Arugula',
    ],
    allergens: ['Dairy', 'Gluten'],
    addOns: [
      { id: 'extra-cheese', name: 'Extra Cheese', price: 40 },
      { id: 'fries', name: 'Classic Fries (Side)', price: 90 }
    ],
    removableIngredients: ['Crispy Onion Strings', 'Arugula'],
    has3DModel: false,
  },

  // NOODLES
  {
    id: 'hakka-street-chow-mein',
    slug: 'hakka-street-chow-mein',
    name: 'Hakka Street Chow Mein',
    description:
      'Wok-tossed hand-pulled noodles with smoky charred garlic, crisp tri-color bell peppers, tender baby corn, spring onions, dark soy sauce, and aromatic sesame oil.',
    price: 249,
    originalPrice: 279,
    image: '/images/dishes/placeholder.jpg',
    category: 'chinese',
    isVeg: true,
    isAvailable: true,
    isFeatured: false,
    isBestSeller: true,
    spiceLevel: 'medium',
    calories: 580,
    preparationTime: '12-15 mins',
    ingredients: [
      'Hand-pulled Noodles',
      'Charred Garlic',
      'Tri-color Bell Peppers',
      'Baby Corn',
      'Dark Soy Sauce',
      'Sesame Oil',
      'Spring Onions',
    ],
    allergens: ['Gluten', 'Soy', 'Sesame'],
    addOns: [
      { id: 'extra-veggies', name: 'Extra Veggies', price: 40 }
    ],
    removableIngredients: ['Spring Onions'],
    has3DModel: false,
  },

  // STARTERS
  {
    id: 'golden-chilli-potato',
    slug: 'golden-chilli-potato',
    name: 'Golden Chilli Potato',
    description:
      'Crispy double-fried potato wedges coated in a glossy honey chili reduction, garnished with toasted white sesame seeds and freshly sliced scallions.',
    price: 199,
    image: '/images/dishes/placeholder.jpg',
    category: 'starters',
    isVeg: true,
    isAvailable: true,
    isFeatured: true,
    isBestSeller: false,
    spiceLevel: 'medium',
    calories: 420,
    preparationTime: '10-14 mins',
    ingredients: [
      'Potato Wedges',
      'Honey Chili Glaze',
      'Sautéed Garlic',
      'Toasted Sesame Seeds',
      'Scallions',
    ],
    allergens: ['Sesame'],
    removableIngredients: ['Toasted Sesame Seeds', 'Scallions'],
    has3DModel: false,
  },
];

// HELPER FUNCTIONS
export const getFeaturedDishes = (): Dish[] => {
  return dishes.filter((dish) => dish.isFeatured);
};

export const getBestSellers = (): Dish[] => {
  return dishes.filter((dish) => dish.isBestSeller);
};

export const getDishesByCategory = (category: DishCategory): Dish[] => {
  return dishes.filter((dish) => dish.category === category);
};
