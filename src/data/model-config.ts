export type CulinaryMaterialCategory =
  | 'fried-food'
  | 'bread-crust'
  | 'melted-cheese'
  | 'grilled-meat'
  | 'fresh-vegetables'
  | 'glossy-sauce'
  | 'dessert'
  | 'beverage'
  | 'glass-container';

export type DeviceRenderProfileName = 'ultra-light' | 'balanced' | 'high-fidelity';

export interface LodPathSet {
  high: string;
  balanced: string;
  ultraLight: string;
  /** Compatibility alias for balanced tier */
  medium?: string;
  /** Compatibility alias for ultra-light tier */
  low?: string;
}

export interface TextureSizeBudget {
  high: number;
  balanced: number;
  ultraLight: number;
}

export interface DishModelConfig {
  dishSlug: string;
  modelPath: string;
  initialScale: number;
  initialRotation: [number, number, number];
  cameraDistance: number;
  isSharedPlaceholder?: boolean;
  modelName?: string;
  notes?: string;
  /** Primary culinary surface category used for adaptive PBR lighting & roughness tuning */
  culinaryCategory?: CulinaryMaterialCategory;
  /** Additional culinary surface categories present in the plated dish */
  secondaryCategories?: CulinaryMaterialCategory[];
  /** Hardware-calibrated Draco multi-LOD paths (high-fidelity / balanced / ultra-light) */
  lodPaths?: LodPathSet;
  /** Dedicated procedural culinary dish/platter multi-LOD GLB derivatives */
  culinaryAssetLodPaths?: LodPathSet;
  /** Verified on-disk USDZ path for iOS Safari AR Quick Look (null when unavailable) */
  usdzPath?: string | null;
  /** Dedicated 1:1 tabletop culinary USDZ path for iOS AR Quick Look */
  culinaryUsdzPath?: string | null;
  /** Truthful flag indicating whether usdzPath points to a verified USDZ archive */
  usdzAvailable?: boolean;
  /** Per-profile GPU texture dimension cap in pixels */
  recommendedMaxTextureSize?: TextureSizeBudget;
  /** Tabletop physical scale multiplier for WebXR / AR placement */
  arScale?: number;
  /** Whether AR mode should retain dynamic environment/directional specular response */
  preserveDynamicARLighting?: boolean;
}

/** Backward-compatible type alias used across existing viewer & AR components */
export type ModelConfig = DishModelConfig;

export interface CulinaryDishProfile {
  culinaryCategory: CulinaryMaterialCategory;
  secondaryCategories: CulinaryMaterialCategory[];
  culinaryArchetype:
    | 'golden-oak-burger'
    | 'classic-smash-burger'
    | 'tandoori-paneer-pizza'
    | 'chicken-tikka-pizza'
    | 'gourmet-wok-bowl'
    | 'kaffir-lime-mocktail';
  arScale: number;
  preserveDynamicARLighting: boolean;
}

export interface ResolvedAdaptiveModelConfig extends DishModelConfig {
  profile: DeviceRenderProfileName;
  /** Resolved GLB path matching the active device render profile */
  resolvedModelPath: string;
  /** Alias for resolvedModelPath */
  lodPath: string;
  /** Resolved culinary dish/platter GLB path for the active profile */
  culinaryLodPath: string;
  /** Resolved maximum texture dimension (px) for the active profile */
  maxTextureSize: number;
  /** Alias for maxTextureSize */
  textureBudget: number;
  /** Resolved base 3D viewer scale */
  scale: number;
  /** Local Draco WASM decoder directory (zero external CDN dependency) */
  dracoDecoderPath: string;
  /** Adaptive HDR environment map matching device tier */
  environmentHdrPath: string;
  /** Exact post-batching draw call count for the resolved LOD asset */
  estimatedDrawCalls: number;
  /** Exact triangle count for the resolved LOD asset */
  estimatedTriangles: number;
}

export const SHARED_DEFAULT_MODEL_PATH = '/models/warrior_model.glb';
export const LOCAL_DRACO_DECODER_PATH = '/draco/';

export const SHARED_WARRIOR_LOD_PATHS: LodPathSet = {
  high: '/models/optimized/warrior-lod0-high.glb',
  balanced: '/models/optimized/warrior-lod1-balanced.glb',
  ultraLight: '/models/optimized/warrior-lod2-ultralight.glb',
  medium: '/models/optimized/warrior-lod1-balanced.glb',
  low: '/models/optimized/warrior-lod2-ultralight.glb',
};

export const SHARED_WARRIOR_USDZ_PATH = '/models/optimized/warrior-showcase.usdz';

export const DEFAULT_TEXTURE_BUDGET: TextureSizeBudget = {
  high: 2048,
  balanced: 1024,
  ultraLight: 512,
};

export const INTERIOR_MODEL_PATHS = {
  uncompressedSource: '/models/the_golden_oak_interior.glb',
  desktopHigh: '/models/the_golden_oak_interior.optimized.glb',
  mobileBalanced: '/models/optimized/the_golden_oak_interior.mobile-balanced.glb',
} as const;

export const ENVIRONMENT_HDR_PATHS = {
  high: '/textures/forest_env.hdr',
  optimized: '/textures/forest_env.optimized.hdr',
} as const;

function buildCulinaryArchetypeLods(
  archetype: CulinaryDishProfile['culinaryArchetype']
): { lods: LodPathSet; usdz: string } {
  const high = `/models/optimized/${archetype}-high.glb`;
  const balanced = `/models/optimized/${archetype}-balanced.glb`;
  const ultraLight = `/models/optimized/${archetype}-ultralight.glb`;
  return {
    lods: {
      high,
      balanced,
      ultraLight,
      medium: balanced,
      low: ultraLight,
    },
    usdz: `/models/optimized/${archetype}.usdz`,
  };
}

/**
 * Culinary surface material profiles for all 22 audited menu items.
 * Drives category-accurate specular roughness, clearcoat glaze, and AR lighting.
 */
export const DISH_CULINARY_PROFILES: Record<string, CulinaryDishProfile> = {
  // Live Convex Database (10 dishes)
  'tandoori-paneer-pizza': {
    culinaryCategory: 'melted-cheese',
    secondaryCategories: ['bread-crust', 'glossy-sauce', 'fresh-vegetables'],
    culinaryArchetype: 'tandoori-paneer-pizza',
    arScale: 0.18,
    preserveDynamicARLighting: true,
  },
  'chicken-tikka-pizza': {
    culinaryCategory: 'grilled-meat',
    secondaryCategories: ['melted-cheese', 'bread-crust', 'fresh-vegetables'],
    culinaryArchetype: 'chicken-tikka-pizza',
    arScale: 0.18,
    preserveDynamicARLighting: true,
  },
  'mushroom-truffle-pizza': {
    culinaryCategory: 'melted-cheese',
    secondaryCategories: ['bread-crust', 'fresh-vegetables', 'glossy-sauce'],
    culinaryArchetype: 'tandoori-paneer-pizza',
    arScale: 0.18,
    preserveDynamicARLighting: true,
  },
  'peri-peri-fiesta-pizza': {
    culinaryCategory: 'melted-cheese',
    secondaryCategories: ['bread-crust', 'glossy-sauce', 'fresh-vegetables'],
    culinaryArchetype: 'tandoori-paneer-pizza',
    arScale: 0.18,
    preserveDynamicARLighting: true,
  },
  'bbq-chicken-overload': {
    culinaryCategory: 'grilled-meat',
    secondaryCategories: ['glossy-sauce', 'melted-cheese', 'bread-crust'],
    culinaryArchetype: 'chicken-tikka-pizza',
    arScale: 0.18,
    preserveDynamicARLighting: true,
  },
  'classic-smash-burger': {
    culinaryCategory: 'grilled-meat',
    secondaryCategories: ['melted-cheese', 'bread-crust', 'fresh-vegetables'],
    culinaryArchetype: 'classic-smash-burger',
    arScale: 0.16,
    preserveDynamicARLighting: true,
  },
  'golden-oak-signature-burger': {
    culinaryCategory: 'grilled-meat',
    secondaryCategories: ['bread-crust', 'melted-cheese', 'glossy-sauce', 'fresh-vegetables'],
    culinaryArchetype: 'golden-oak-burger',
    arScale: 0.16,
    preserveDynamicARLighting: true,
  },
  'crispy-paneer-burger': {
    culinaryCategory: 'fried-food',
    secondaryCategories: ['bread-crust', 'melted-cheese', 'fresh-vegetables', 'glossy-sauce'],
    culinaryArchetype: 'golden-oak-burger',
    arScale: 0.16,
    preserveDynamicARLighting: true,
  },
  'wok-tossed-chow-mein': {
    culinaryCategory: 'glossy-sauce',
    secondaryCategories: ['fresh-vegetables'],
    culinaryArchetype: 'gourmet-wok-bowl',
    arScale: 0.16,
    preserveDynamicARLighting: true,
  },
  'dynamite-chilli-potatoes': {
    culinaryCategory: 'fried-food',
    secondaryCategories: ['glossy-sauce', 'fresh-vegetables'],
    culinaryArchetype: 'gourmet-wok-bowl',
    arScale: 0.16,
    preserveDynamicARLighting: true,
  },

  // Mock Menu & Audit query slugs (12 dishes)
  'keema-masala-pizza': {
    culinaryCategory: 'grilled-meat',
    secondaryCategories: ['melted-cheese', 'bread-crust', 'fresh-vegetables'],
    culinaryArchetype: 'chicken-tikka-pizza',
    arScale: 0.18,
    preserveDynamicARLighting: true,
  },
  'farmhouse-supreme-pizza': {
    culinaryCategory: 'fresh-vegetables',
    secondaryCategories: ['melted-cheese', 'bread-crust', 'glossy-sauce'],
    culinaryArchetype: 'tandoori-paneer-pizza',
    arScale: 0.18,
    preserveDynamicARLighting: true,
  },
  'paneer-royale-burger': {
    culinaryCategory: 'fried-food',
    secondaryCategories: ['bread-crust', 'melted-cheese', 'fresh-vegetables'],
    culinaryArchetype: 'golden-oak-burger',
    arScale: 0.16,
    preserveDynamicARLighting: true,
  },
  'truffle-mushroom-cheese-burger': {
    culinaryCategory: 'melted-cheese',
    secondaryCategories: ['bread-crust', 'glossy-sauce', 'fried-food'],
    culinaryArchetype: 'classic-smash-burger',
    arScale: 0.16,
    preserveDynamicARLighting: true,
  },
  'hakka-street-chow-mein': {
    culinaryCategory: 'glossy-sauce',
    secondaryCategories: ['fresh-vegetables'],
    culinaryArchetype: 'gourmet-wok-bowl',
    arScale: 0.16,
    preserveDynamicARLighting: true,
  },
  'golden-chilli-potato': {
    culinaryCategory: 'fried-food',
    secondaryCategories: ['glossy-sauce', 'fresh-vegetables'],
    culinaryArchetype: 'gourmet-wok-bowl',
    arScale: 0.16,
    preserveDynamicARLighting: true,
  },
  'truffle-mushroom-risotto': {
    culinaryCategory: 'melted-cheese',
    secondaryCategories: ['glossy-sauce', 'fresh-vegetables'],
    culinaryArchetype: 'gourmet-wok-bowl',
    arScale: 0.16,
    preserveDynamicARLighting: true,
  },
  'butter-chicken-bao': {
    culinaryCategory: 'bread-crust',
    secondaryCategories: ['grilled-meat', 'glossy-sauce'],
    culinaryArchetype: 'gourmet-wok-bowl',
    arScale: 0.15,
    preserveDynamicARLighting: true,
  },
  'dahi-ke-kebab': {
    culinaryCategory: 'fried-food',
    secondaryCategories: ['melted-cheese', 'fresh-vegetables'],
    culinaryArchetype: 'gourmet-wok-bowl',
    arScale: 0.15,
    preserveDynamicARLighting: true,
  },
  'crispy-chilli-babycorn': {
    culinaryCategory: 'fried-food',
    secondaryCategories: ['glossy-sauce', 'fresh-vegetables'],
    culinaryArchetype: 'gourmet-wok-bowl',
    arScale: 0.16,
    preserveDynamicARLighting: true,
  },
  'dim-sum-platter': {
    culinaryCategory: 'bread-crust',
    secondaryCategories: ['glossy-sauce', 'fresh-vegetables'],
    culinaryArchetype: 'gourmet-wok-bowl',
    arScale: 0.16,
    preserveDynamicARLighting: true,
  },
  'kaffir-lime-mocktail': {
    culinaryCategory: 'beverage',
    secondaryCategories: ['glass-container', 'fresh-vegetables'],
    culinaryArchetype: 'kaffir-lime-mocktail',
    arScale: 0.16,
    preserveDynamicARLighting: true,
  },
};

/**
 * Infer a culinary profile for dynamic/newly-created menu slugs not yet in DISH_CULINARY_PROFILES.
 */
export function inferCulinaryProfile(dishSlug: string): CulinaryDishProfile {
  const normalized = (dishSlug || '').toLowerCase();
  if (DISH_CULINARY_PROFILES[normalized]) {
    return DISH_CULINARY_PROFILES[normalized];
  }
  if (/(mocktail|cocktail|mojito|beverage|drink|cooler|tea|coffee|juice|glass)/.test(normalized)) {
    return {
      culinaryCategory: 'beverage',
      secondaryCategories: ['glass-container', 'fresh-vegetables'],
      culinaryArchetype: 'kaffir-lime-mocktail',
      arScale: 0.16,
      preserveDynamicARLighting: true,
    };
  }
  if (/(cake|lava|brownie|dessert|tiramisu|gelato|ice-cream|pastry|tart|pudding)/.test(normalized)) {
    return {
      culinaryCategory: 'dessert',
      secondaryCategories: ['glossy-sauce', 'bread-crust'],
      culinaryArchetype: 'gourmet-wok-bowl',
      arScale: 0.15,
      preserveDynamicARLighting: true,
    };
  }
  if (/(pizza|flatbread|calzone)/.test(normalized)) {
    return {
      culinaryCategory: 'melted-cheese',
      secondaryCategories: ['bread-crust', 'glossy-sauce', 'fresh-vegetables'],
      culinaryArchetype: 'tandoori-paneer-pizza',
      arScale: 0.18,
      preserveDynamicARLighting: true,
    };
  }
  if (/(burger|slider|sandwich)/.test(normalized)) {
    return {
      culinaryCategory: 'grilled-meat',
      secondaryCategories: ['bread-crust', 'melted-cheese', 'fresh-vegetables'],
      culinaryArchetype: 'golden-oak-burger',
      arScale: 0.16,
      preserveDynamicARLighting: true,
    };
  }
  if (/(crispy|fried|potato|tempura|fries|kebab|pakora|wings)/.test(normalized)) {
    return {
      culinaryCategory: 'fried-food',
      secondaryCategories: ['glossy-sauce', 'fresh-vegetables'],
      culinaryArchetype: 'gourmet-wok-bowl',
      arScale: 0.16,
      preserveDynamicARLighting: true,
    };
  }
  return {
    culinaryCategory: 'glossy-sauce',
    secondaryCategories: ['fresh-vegetables', 'grilled-meat'],
    culinaryArchetype: 'gourmet-wok-bowl',
    arScale: 0.16,
    preserveDynamicARLighting: true,
  };
}

export const DEFAULT_MODEL_CONFIG: Omit<DishModelConfig, 'dishSlug'> = {
  modelPath: SHARED_DEFAULT_MODEL_PATH,
  initialScale: 0.8,
  initialRotation: [0, 0, 0],
  cameraDistance: 4.5,
  isSharedPlaceholder: true,
  modelName: '3D Interactive Model Showcase [Prototype Asset]',
  notes:
    'Shared 3D prototype model rendered for demonstration across menu items until authentic dish-specific food models are modeled.',
  culinaryCategory: 'grilled-meat',
  secondaryCategories: ['bread-crust', 'melted-cheese', 'glossy-sauce'],
  lodPaths: SHARED_WARRIOR_LOD_PATHS,
  usdzPath: SHARED_WARRIOR_USDZ_PATH,
  usdzAvailable: true,
  recommendedMaxTextureSize: DEFAULT_TEXTURE_BUDGET,
  arScale: 0.16,
  preserveDynamicARLighting: true,
};

/**
 * Dish-specific overrides.
 * If a dish gets an authentic food model or custom framing later, add its override here.
 * That dish will immediately use its custom model/framing without affecting the other dishes.
 */
export const dishModelOverrides: Record<string, Partial<DishModelConfig>> = {
  'golden-oak-signature-burger': {
    modelPath: '/models/optimized/golden-oak-burger-high.glb',
    modelName: 'Golden Oak Signature Burger',
    isSharedPlaceholder: false,
    initialScale: 0.65,
    cameraDistance: 4.5,
    notes:
      'Authentic 3D model featuring realistic brioche bun, flame-grilled Angus patty, crisp ruffled lettuce, and gourmet toppings.',
    lodPaths: {
      high: '/models/optimized/golden-oak-burger-high.glb',
      balanced: '/models/optimized/golden-oak-burger-balanced.glb',
      ultraLight: '/models/optimized/golden-oak-burger-ultralight.glb',
      medium: '/models/optimized/golden-oak-burger-balanced.glb',
      low: '/models/optimized/golden-oak-burger-ultralight.glb',
    },
    culinaryAssetLodPaths: {
      high: '/models/optimized/golden-oak-burger-high.glb',
      balanced: '/models/optimized/golden-oak-burger-balanced.glb',
      ultraLight: '/models/optimized/golden-oak-burger-ultralight.glb',
      medium: '/models/optimized/golden-oak-burger-balanced.glb',
      low: '/models/optimized/golden-oak-burger-ultralight.glb',
    },
    usdzPath: '/models/optimized/golden-oak-burger.usdz',
    culinaryUsdzPath: '/models/optimized/golden-oak-burger.usdz',
    usdzAvailable: true,
    arScale: 0.16,
    preserveDynamicARLighting: true,
  },
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
 * Resolves the 3D model configuration for a given dish slug.
 * Always resolves to either the dish-specific override or the default shared model,
 * enriched with culinary material metadata, multi-LOD paths, and verified USDZ support.
 */
export function getModelConfig(dishSlug: string): DishModelConfig {
  const override = dishModelOverrides[dishSlug] || {};
  const culinary = inferCulinaryProfile(dishSlug);
  const culinaryAssets = buildCulinaryArchetypeLods(culinary.culinaryArchetype);

  return {
    dishSlug,
    modelPath: override.modelPath ?? DEFAULT_MODEL_CONFIG.modelPath,
    initialScale: override.initialScale ?? DEFAULT_MODEL_CONFIG.initialScale,
    initialRotation: override.initialRotation ?? DEFAULT_MODEL_CONFIG.initialRotation,
    cameraDistance: override.cameraDistance ?? DEFAULT_MODEL_CONFIG.cameraDistance,
    isSharedPlaceholder: override.isSharedPlaceholder ?? DEFAULT_MODEL_CONFIG.isSharedPlaceholder,
    modelName: override.modelName ?? DEFAULT_MODEL_CONFIG.modelName,
    notes: override.notes ?? DEFAULT_MODEL_CONFIG.notes,
    culinaryCategory: override.culinaryCategory ?? culinary.culinaryCategory,
    secondaryCategories: override.secondaryCategories ?? culinary.secondaryCategories,
    lodPaths: override.lodPaths ?? DEFAULT_MODEL_CONFIG.lodPaths,
    culinaryAssetLodPaths: override.culinaryAssetLodPaths ?? culinaryAssets.lods,
    usdzPath: override.usdzPath !== undefined ? override.usdzPath : SHARED_WARRIOR_USDZ_PATH,
    culinaryUsdzPath:
      override.culinaryUsdzPath !== undefined ? override.culinaryUsdzPath : culinaryAssets.usdz,
    usdzAvailable:
      override.usdzAvailable ??
      Boolean(override.usdzPath !== undefined ? override.usdzPath : SHARED_WARRIOR_USDZ_PATH),
    recommendedMaxTextureSize:
      override.recommendedMaxTextureSize ?? DEFAULT_MODEL_CONFIG.recommendedMaxTextureSize,
    arScale: override.arScale ?? culinary.arScale,
    preserveDynamicARLighting:
      override.preserveDynamicARLighting ?? culinary.preserveDynamicARLighting,
  };
}

/**
 * Centralized array of model configs for all known dishes (legacy compatible).
 */
export const modelConfigs: DishModelConfig[] = KNOWN_DISH_SLUGS.map((slug) =>
  getModelConfig(slug)
);

/**
 * Indexed dictionary of DishModelConfig keyed by dishSlug.
 */
export const MODEL_CONFIGS: Record<string, DishModelConfig> = Object.fromEntries(
  modelConfigs.map((cfg) => [cfg.dishSlug, cfg])
);

/**
 * Maps quality tier labels ('low' | 'medium' | 'high') or DeviceRenderProfileName
 * to a canonical DeviceRenderProfileName.
 */
export function normalizeRenderProfile(
  profileOrTier?: DeviceRenderProfileName | 'low' | 'medium' | 'high' | string | null
): DeviceRenderProfileName {
  if (profileOrTier === 'ultra-light' || profileOrTier === 'low') {
    return 'ultra-light';
  }
  if (profileOrTier === 'high-fidelity' || profileOrTier === 'high') {
    return 'high-fidelity';
  }
  return 'balanced';
}

const WARRIOR_LOD_METRICS: Record<
  DeviceRenderProfileName,
  { drawCalls: number; triangles: number }
> = {
  'high-fidelity': { drawCalls: 14, triangles: 217074 },
  balanced: { drawCalls: 14, triangles: 123039 },
  'ultra-light': { drawCalls: 14, triangles: 43499 },
};

/**
 * Resolves the hardware-adaptive 3D model configuration for any dish slug across
 * 'ultra-light', 'balanced', and 'high-fidelity' device render profiles.
 */
export function resolveAdaptiveModelConfig(
  dishSlug: string,
  profile: DeviceRenderProfileName | 'low' | 'medium' | 'high' = 'balanced'
): ResolvedAdaptiveModelConfig {
  const resolvedProfile = normalizeRenderProfile(profile);
  const base = getModelConfig(dishSlug);
  const lodPaths = base.lodPaths ?? SHARED_WARRIOR_LOD_PATHS;
  const culinaryLods =
    base.culinaryAssetLodPaths ??
    buildCulinaryArchetypeLods(inferCulinaryProfile(dishSlug).culinaryArchetype).lods;
  const texBudget = base.recommendedMaxTextureSize ?? DEFAULT_TEXTURE_BUDGET;

  let resolvedModelPath: string;
  let culinaryLodPath: string;
  let maxTextureSize: number;

  if (resolvedProfile === 'high-fidelity') {
    resolvedModelPath = lodPaths.high;
    culinaryLodPath = culinaryLods.high;
    maxTextureSize = texBudget.high;
  } else if (resolvedProfile === 'ultra-light') {
    resolvedModelPath = lodPaths.ultraLight;
    culinaryLodPath = culinaryLods.ultraLight;
    maxTextureSize = texBudget.ultraLight;
  } else {
    resolvedModelPath = lodPaths.balanced;
    culinaryLodPath = culinaryLods.balanced;
    maxTextureSize = texBudget.balanced;
  }

  const metrics = WARRIOR_LOD_METRICS[resolvedProfile];

  return {
    ...base,
    profile: resolvedProfile,
    resolvedModelPath,
    lodPath: resolvedModelPath,
    culinaryLodPath,
    maxTextureSize,
    textureBudget: maxTextureSize,
    scale: base.initialScale,
    dracoDecoderPath: LOCAL_DRACO_DECODER_PATH,
    environmentHdrPath:
      resolvedProfile === 'high-fidelity'
        ? ENVIRONMENT_HDR_PATHS.high
        : ENVIRONMENT_HDR_PATHS.optimized,
    estimatedDrawCalls: metrics.drawCalls,
    estimatedTriangles: metrics.triangles,
  };
}

/**
 * Returns whether 3D model viewing is supported for this dish.
 * Returns true for all known or overridden dishes since the shared model is active.
 */
export function hasModel(dishSlug: string): boolean {
  if (!dishSlug || typeof dishSlug !== 'string') return false;
  return KNOWN_DISH_SLUGS.includes(dishSlug) || dishSlug in dishModelOverrides;
}

/**
 * Alias for hasModel verifying interactive 3D showcase support for a dish slug.
 */
export function hasInteractive3DModel(dishSlug: string): boolean {
  return hasModel(dishSlug);
}
