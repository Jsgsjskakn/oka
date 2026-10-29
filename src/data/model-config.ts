export interface ModelConfig {
  dishSlug: string;
  modelPath: string;
  initialScale: number;
  initialRotation: [number, number, number];
  cameraDistance: number;
  isSharedPlaceholder?: boolean;
  modelName?: string;
  notes?: string;
}

export const SHARED_DEFAULT_MODEL_PATH = '/models/warrior_model.glb';

export const DEFAULT_MODEL_CONFIG: Omit<ModelConfig, 'dishSlug'> = {
  modelPath: SHARED_DEFAULT_MODEL_PATH,
  initialScale: 0.8,
  initialRotation: [0, 0, 0],
  cameraDistance: 4.5,
  isSharedPlaceholder: true,
  modelName: '3D Interactive Model Showcase [Prototype Asset]',
  notes: 'Shared 3D prototype model rendered for demonstration across menu items until authentic dish-specific food models are modeled.',
};

/**
 * Dish-specific overrides.
 * If a dish gets an authentic food model or custom framing later, add its override here.
 * That dish will immediately use its custom model/framing without affecting the other dishes.
 */
export const dishModelOverrides: Record<string, Partial<ModelConfig>> = {
  // Future dish-specific models or custom camera framing can be declared here.
};

/**
 * Known menu dish slugs (supporting live Convex, mock menu, and audit checklist).
 */
export const KNOWN_DISH_SLUGS = [
  // Live Convex Database (10 dishes)
  'tandoori-paneer-pizza',
  'chicken-tikka-pizza',
  'mushroom-truffle-pizza',
  'peri-peri-fiesta-pizza',
  'bbq-chicken-overload',
  'classic-smash-burger',
  'golden-oak-signature-burger',
  'crispy-paneer-burger',
  'wok-tossed-chow-mein',
  'dynamite-chilli-potatoes',
  // Mock Menu & Audit query slugs
  'keema-masala-pizza',
  'farmhouse-supreme-pizza',
  'paneer-royale-burger',
  'truffle-mushroom-cheese-burger',
  'hakka-street-chow-mein',
  'golden-chilli-potato',
  'truffle-mushroom-risotto',
  'butter-chicken-bao',
  'dahi-ke-kebab',
  'crispy-chilli-babycorn',
  'dim-sum-platter',
  'kaffir-lime-mocktail',
];

/**
 * Centralized list of model configs for all dishes.
 */
export const modelConfigs: ModelConfig[] = KNOWN_DISH_SLUGS.map((slug) => {
  const override = dishModelOverrides[slug] || {};
  return {
    dishSlug: slug,
    modelPath: override.modelPath ?? DEFAULT_MODEL_CONFIG.modelPath,
    initialScale: override.initialScale ?? DEFAULT_MODEL_CONFIG.initialScale,
    initialRotation: override.initialRotation ?? DEFAULT_MODEL_CONFIG.initialRotation,
    cameraDistance: override.cameraDistance ?? DEFAULT_MODEL_CONFIG.cameraDistance,
    isSharedPlaceholder: override.isSharedPlaceholder ?? DEFAULT_MODEL_CONFIG.isSharedPlaceholder,
    modelName: override.modelName ?? DEFAULT_MODEL_CONFIG.modelName,
    notes: override.notes ?? DEFAULT_MODEL_CONFIG.notes,
  };
});

/**
 * Resolves the 3D model configuration for a given dish slug.
 * Always resolves to either the dish-specific override or the default shared model.
 */
export function getModelConfig(dishSlug: string): ModelConfig {
  const override = dishModelOverrides[dishSlug] || {};
  return {
    dishSlug,
    modelPath: override.modelPath ?? DEFAULT_MODEL_CONFIG.modelPath,
    initialScale: override.initialScale ?? DEFAULT_MODEL_CONFIG.initialScale,
    initialRotation: override.initialRotation ?? DEFAULT_MODEL_CONFIG.initialRotation,
    cameraDistance: override.cameraDistance ?? DEFAULT_MODEL_CONFIG.cameraDistance,
    isSharedPlaceholder: override.isSharedPlaceholder ?? DEFAULT_MODEL_CONFIG.isSharedPlaceholder,
    modelName: override.modelName ?? DEFAULT_MODEL_CONFIG.modelName,
    notes: override.notes ?? DEFAULT_MODEL_CONFIG.notes,
  };
}

/**
 * Returns whether 3D model viewing is supported for this dish.
 * Returns true for all dishes since the shared model is active.
 */
export function hasModel(dishSlug: string): boolean {
  if (!dishSlug || typeof dishSlug !== 'string') return false;
  return KNOWN_DISH_SLUGS.includes(dishSlug) || dishSlug in dishModelOverrides;
}
