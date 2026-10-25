export interface IngredientHotspot {
  id: string;
  name: string;
  description: string;
  /** Normalized position relative to dish center: x, y, z in range [-1, 1] */
  position: [number, number, number];
}

export interface ARModelConfig {
  dishSlug: string;
  hotspots: IngredientHotspot[];
}

export const DEFAULT_AR_HOTSPOTS: IngredientHotspot[] = [
  {
    id: 'h-flavor',
    name: 'Artisanal Flavors',
    description: 'Crafted with premium organic spices and chef-crafted seasonings',
    position: [0.2, 0.2, 0.1],
  },
  {
    id: 'h-prep',
    name: 'Gourmet Preparation',
    description: 'Prepared fresh to order using signature culinary techniques',
    position: [-0.2, 0.15, -0.1],
  },
  {
    id: 'h-presentation',
    name: 'Luxury Plating',
    description: 'Finished with bespoke garnishes for an immersive dining aesthetic',
    position: [0, 0.25, -0.2],
  },
];

export const arModelConfigs: ARModelConfig[] = [
  {
    dishSlug: 'tandoori-paneer-pizza',
    hotspots: [
      { id: 'h1', name: 'Tandoori Paneer', description: 'Charcoal-grilled cottage cheese with aromatic spices', position: [0.3, 0.15, 0.1] },
      { id: 'h2', name: 'Smoked Mozzarella', description: 'Artisan smoked mozzarella, melted to perfection', position: [-0.2, 0.12, -0.25] },
      { id: 'h3', name: 'Makhani Glaze', description: 'Signature creamy butter sauce glaze', position: [0, 0.1, 0.3] },
      { id: 'h4', name: 'Bell Peppers', description: 'Fresh tri-color bell peppers, thinly sliced', position: [-0.35, 0.13, 0.15] },
    ],
  },
  {
    dishSlug: 'chicken-tikka-pizza',
    hotspots: [
      { id: 'h1', name: 'Chicken Tikka', description: 'Tandoor-smoked chicken in yogurt marinade', position: [0.25, 0.14, -0.1] },
      { id: 'h2', name: 'Aged Cheddar', description: 'Sharp aged cheddar with mozzarella blend', position: [-0.15, 0.12, 0.2] },
      { id: 'h3', name: 'Pickled Onions', description: 'House-pickled red onion rings', position: [0.1, 0.13, 0.35] },
    ],
  },
  {
    dishSlug: 'golden-oak-signature-burger',
    hotspots: [
      { id: 'h1', name: 'Grilled Angus Patty', description: 'Premium wagyu beef, flame-grilled', position: [0, 0.15, 0] },
      { id: 'h2', name: 'Truffle Aioli', description: 'Black truffle and garlic aioli', position: [0.2, 0.25, 0.1] },
      { id: 'h3', name: 'Brioche Bun', description: 'Toasted artisan brioche bun', position: [0, 0.35, 0] },
    ],
  },
];

export function getARConfig(dishSlug: string): ARModelConfig {
  const custom = arModelConfigs.find((c) => c.dishSlug === dishSlug);
  if (custom) return custom;
  return {
    dishSlug,
    hotspots: DEFAULT_AR_HOTSPOTS,
  };
}

export function getHotspots(dishSlug: string): IngredientHotspot[] {
  const config = getARConfig(dishSlug);
  return config.hotspots;
}
