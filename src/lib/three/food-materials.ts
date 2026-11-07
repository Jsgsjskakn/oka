import * as THREE from 'three';

/**
 * Rendering quality profile aligned with The Golden Oak's 3-tier mobile-first budget.
 */
export type FoodRenderProfile = 'ultra-light' | 'balanced' | 'high-fidelity';

/**
 * Canonical culinary PBR material categories (Specification Section 7).
 * Includes all 9 culinary surface classes, with tableware explicitly split into
 * `glass-container` and `ceramic-plate` for accurate optical behavior.
 */
export type FoodMaterialCategory =
  | 'fried-food'
  | 'bread-crust'
  | 'melted-cheese'
  | 'grilled-meat'
  | 'fresh-vegetables'
  | 'glossy-sauce'
  | 'dessert'
  | 'beverage'
  | 'glass-container'
  | 'ceramic-plate';

export const FOOD_MATERIAL_CATEGORIES: readonly FoodMaterialCategory[] = [
  'fried-food',
  'bread-crust',
  'melted-cheese',
  'grilled-meat',
  'fresh-vegetables',
  'glossy-sauce',
  'dessert',
  'beverage',
  'glass-container',
  'ceramic-plate',
] as const;

export interface FoodMaterialPreset {
  category: FoodMaterialCategory;
  label: string;
  /** Natural culinary albedo hex when no diffuse texture map is bound */
  color: string;
  /** Subtle warm scatter tint applied to textured meshes so shadows never turn cold grey */
  texturedTint: string;
  /** Calibrated default roughness within [roughnessRange[0], roughnessRange[1]] */
  roughness: number;
  /** Physically calibrated roughness bounds preventing plastic or chalky artifacts */
  roughnessRange: readonly [number, number];
  /** Dielectric food surfaces are strictly 0.0 metalness (0.04 max for specular glass rim) */
  metalness: number;
  /** Calibrated IBL reflection multiplier under RoomEnvironment */
  envMapIntensity: number;
  /** Ambient occlusion cavity contrast multiplier */
  aoMapIntensity: number;
  /** Normal map micro-relief scale */
  normalScale: number;
  /** Ultra-subtle warm internal scatter approximation (disabled in AR) */
  warmScatterHex?: string;
  warmScatterIntensity?: number;
  /** Transparency fast-path for liquids and glassware on mobile TBDR GPUs */
  transparent?: boolean;
  opacity?: number;
  depthWrite?: boolean;
  /** Optional secondary physical lobes ONLY enabled on `high-fidelity` when `secondaryEffects !== false` */
  highFidelityPhysical?: {
    clearcoat?: number;
    clearcoatRoughness?: number;
    sheen?: number;
    sheenRoughness?: number;
    sheenColor?: string;
    transmission?: number;
    ior?: number;
    thickness?: number;
    attenuationColor?: string;
    attenuationDistance?: number;
  };
}

/**
 * Physically calibrated culinary PBR material presets.
 * Tuned so food surfaces look warm, organic, and appetizing — never plastic-like.
 */
export const FOOD_MATERIAL_PRESETS: Record<FoodMaterialCategory, FoodMaterialPreset> = {
  'fried-food': {
    category: 'fried-food',
    label: 'Crispy Fried Coating & Golden Tempura',
    color: '#D8923B',
    texturedTint: '#FFF9F0',
    roughness: 0.62,
    roughnessRange: [0.58, 0.68],
    metalness: 0.0,
    envMapIntensity: 0.85,
    aoMapIntensity: 0.95,
    normalScale: 1.15,
    warmScatterHex: '#3B1C04',
    warmScatterIntensity: 0.06,
  },
  'bread-crust': {
    category: 'bread-crust',
    label: 'Artisan Baked Crust & Brioche',
    color: '#C68642',
    texturedTint: '#FFFBF4',
    roughness: 0.78,
    roughnessRange: [0.72, 0.84],
    metalness: 0.0,
    envMapIntensity: 0.55,
    aoMapIntensity: 1.15,
    normalScale: 1.1,
    warmScatterHex: '#2A1405',
    warmScatterIntensity: 0.04,
  },
  'melted-cheese': {
    category: 'melted-cheese',
    label: 'Velvety Melted Cheddar & Mozzarella Emulsion',
    color: '#F2C14E',
    texturedTint: '#FFFDF6',
    roughness: 0.32,
    roughnessRange: [0.28, 0.36],
    metalness: 0.0,
    envMapIntensity: 0.95,
    aoMapIntensity: 0.8,
    normalScale: 0.75,
    warmScatterHex: '#4A2F06',
    warmScatterIntensity: 0.05,
    highFidelityPhysical: {
      sheen: 0.22,
      sheenRoughness: 0.45,
      sheenColor: '#FFF3D1',
      ior: 1.46,
    },
  },
  'grilled-meat': {
    category: 'grilled-meat',
    label: 'Seared Maillard Char & Juicy Glaze',
    color: '#6E3219',
    texturedTint: '#FFF8F2',
    roughness: 0.40,
    roughnessRange: [0.34, 0.46],
    metalness: 0.0,
    envMapIntensity: 1.08,
    aoMapIntensity: 1.05,
    normalScale: 1.2,
    warmScatterHex: '#240903',
    warmScatterIntensity: 0.05,
    highFidelityPhysical: {
      clearcoat: 0.28,
      clearcoatRoughness: 0.24,
      ior: 1.45,
    },
  },
  'fresh-vegetables': {
    category: 'fresh-vegetables',
    label: 'Hydrated Leafy Greens & Crisp Produce',
    color: '#4F8A38',
    texturedTint: '#FAFFF8',
    roughness: 0.44,
    roughnessRange: [0.38, 0.52],
    metalness: 0.0,
    envMapIntensity: 0.88,
    aoMapIntensity: 0.85,
    normalScale: 0.95,
    warmScatterHex: '#0E2407',
    warmScatterIntensity: 0.04,
    highFidelityPhysical: {
      sheen: 0.15,
      sheenRoughness: 0.55,
      sheenColor: '#E4F7D8',
    },
  },
  'glossy-sauce': {
    category: 'glossy-sauce',
    label: 'Reduction Glaze, Chutney & Rich Jus',
    color: '#8F2412',
    texturedTint: '#FFF7F4',
    roughness: 0.14,
    roughnessRange: [0.10, 0.18],
    metalness: 0.0,
    envMapIntensity: 1.35,
    aoMapIntensity: 0.7,
    normalScale: 0.65,
    warmScatterHex: '#2E0702',
    warmScatterIntensity: 0.05,
    highFidelityPhysical: {
      clearcoat: 0.6,
      clearcoatRoughness: 0.12,
      ior: 1.48,
    },
  },
  dessert: {
    category: 'dessert',
    label: 'Dark Chocolate Ganache, Pastry & Sugar Dust',
    color: '#3D1E12',
    texturedTint: '#FFF9F4',
    roughness: 0.36,
    roughnessRange: [0.26, 0.65],
    metalness: 0.0,
    envMapIntensity: 1.0,
    aoMapIntensity: 0.95,
    normalScale: 0.9,
    warmScatterHex: '#170803',
    warmScatterIntensity: 0.04,
    highFidelityPhysical: {
      sheen: 0.24,
      sheenRoughness: 0.48,
      sheenColor: '#FFE8D4',
    },
  },
  beverage: {
    category: 'beverage',
    label: 'Botanical Mocktail, Wine & Crafted Beverage',
    color: '#A8381B',
    texturedTint: '#FFFFFF',
    roughness: 0.08,
    roughnessRange: [0.05, 0.14],
    metalness: 0.0,
    envMapIntensity: 1.35,
    aoMapIntensity: 0.5,
    normalScale: 0.5,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
    highFidelityPhysical: {
      transmission: 0.32,
      ior: 1.34,
      thickness: 0.55,
      attenuationColor: '#7A1C08',
      attenuationDistance: 0.45,
    },
  },
  'glass-container': {
    category: 'glass-container',
    label: 'Crystal Glassware & Beverage Tumbler',
    color: '#F4F8FA',
    texturedTint: '#FFFFFF',
    roughness: 0.06,
    roughnessRange: [0.04, 0.12],
    metalness: 0.04,
    envMapIntensity: 1.45,
    aoMapIntensity: 0.4,
    normalScale: 0.5,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    highFidelityPhysical: {
      transmission: 0.62,
      ior: 1.5,
      thickness: 0.22,
      clearcoat: 0.35,
      clearcoatRoughness: 0.06,
    },
  },
  'ceramic-plate': {
    category: 'ceramic-plate',
    label: 'Fine Glazed Bone Porcelain & Stoneware',
    color: '#F7F4EE',
    texturedTint: '#FFFFFF',
    roughness: 0.16,
    roughnessRange: [0.12, 0.22],
    metalness: 0.0,
    envMapIntensity: 1.05,
    aoMapIntensity: 0.85,
    normalScale: 0.6,
    highFidelityPhysical: {
      clearcoat: 0.32,
      clearcoatRoughness: 0.14,
      ior: 1.52,
    },
  },
};

export interface CreateFoodMaterialOptions {
  profile?: FoodRenderProfile;
  secondaryEffects?: boolean;
  isAR?: boolean;
  /** Optional custom roughness clamped safely inside the category's natural range */
  roughnessOverride?: number;
  /** Optional custom albedo hex override */
  colorOverride?: string;
}

export interface ApplyFoodMaterialProfileOptions {
  category?: FoodMaterialCategory | string;
  profile: FoodRenderProfile;
  secondaryEffects?: boolean;
  isAR?: boolean;
  maxAnisotropy?: number;
}

export interface FoodMaterialApplicationSummary {
  clonedMaterials: number;
  downgradedPhysicalMaterials: number;
  styledMaterials: number;
  profile: FoodRenderProfile;
  resolvedCategory: FoodMaterialCategory;
}

const TEXTURE_SLOTS_FOR_COPY = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'emissiveMap',
  'alphaMap',
  'bumpMap',
  'lightMap',
] as const;

/**
 * Maps legacy `QualityTier` ('low' | 'medium' | 'high') or profile strings
 * into a canonical `FoodRenderProfile`.
 */
export function resolveFoodRenderProfile(
  tierOrProfile?: FoodRenderProfile | 'low' | 'medium' | 'high' | string | null
): FoodRenderProfile {
  switch (tierOrProfile) {
    case 'ultra-light':
    case 'low':
      return 'ultra-light';
    case 'high-fidelity':
    case 'high':
      return 'high-fidelity';
    case 'balanced':
    case 'medium':
    default:
      return 'balanced';
  }
}

/**
 * Resolves an arbitrary dish slug, menu category name, or glTF mesh/material identifier
 * into the closest physically calibrated `FoodMaterialCategory`.
 */
export function inferFoodCategoryFromHint(hint?: string | null): FoodMaterialCategory {
  if (!hint) return 'grilled-meat';
  const normalized = hint.trim().toLowerCase();

  if (normalized in FOOD_MATERIAL_PRESETS) {
    return normalized as FoodMaterialCategory;
  }

  // Split CamelCase + snake_case + kebab-case into clean word tokens to prevent substring collisions (e.g. "cola" in "chocolate" or "tea" in "steak")
  const spaced = hint
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const tokens = new Set(spaced.split(/\s+/).filter(Boolean));
  const hasAny = (words: readonly string[]): boolean => words.some((w) => tokens.has(w));

  // Tableware & containers first so plates/glasses in multi-mesh food scenes match accurately
  if (hasAny(['glass', 'tumbler', 'goblet', 'chalice', 'carafe', 'crystal', 'jar'])) {
    return 'glass-container';
  }
  if (hasAny(['plate', 'porcelain', 'ceramic', 'platter', 'bowl', 'saucer', 'stoneware', 'crockery', 'dishware'])) {
    return 'ceramic-plate';
  }

  // Desserts & pastry
  if (hasAny(['dessert', 'desserts', 'chocolate', 'ganache', 'lava', 'cake', 'brownie', 'tiramisu', 'tart', 'pastry', 'sugar', 'sweet', 'custard'])) {
    return 'dessert';
  }

  // Beverages
  if (hasAny(['beverage', 'beverages', 'drink', 'drinks', 'mojito', 'mocktail', 'cocktail', 'wine', 'juice', 'tea', 'coffee', 'soda', 'cola', 'lime', 'liquid', 'syrup'])) {
    return 'beverage';
  }

  // Glossy sauces, glazes, chutneys, and noodle tossed sauces
  if (
    hasAny(['sauce', 'glaze', 'chutney', 'jus', 'gravy', 'ketchup', 'mayo', 'aioli', 'drizzle', 'reduction', 'chowmein']) ||
    normalized.includes('chow-mein') ||
    normalized.includes('peri-peri')
  ) {
    return 'glossy-sauce';
  }

  // Melted cheese & dairy
  if (hasAny(['cheese', 'cheddar', 'mozzarella', 'parmesan', 'gouda', 'burrata', 'fondue', 'paneer', 'dahi', 'curd', 'risotto'])) {
    return 'melted-cheese';
  }

  // Crispy fried items
  if (hasAny(['fried', 'fries', 'crispy', 'tempura', 'pakora', 'fritter', 'potato', 'potatoes', 'babycorn', 'nugget', 'nuggets', 'schnitzel', 'katsu', 'crunch'])) {
    return 'fried-food';
  }

  // Artisan bread, pizza crust, burger buns, bao, dim sum dough
  if (
    hasAny(['bread', 'crust', 'bun', 'brioche', 'pizza', 'pizzas', 'dough', 'naan', 'kulcha', 'bao', 'dumpling', 'toast', 'baguette', 'croissant']) ||
    normalized.includes('dim-sum')
  ) {
    return 'bread-crust';
  }

  // Fresh vegetables, herbs & salads
  if (hasAny(['veg', 'vegetable', 'vegetables', 'lettuce', 'salad', 'greens', 'basil', 'mint', 'cilantro', 'coriander', 'tomato', 'onion', 'cucumber', 'avocado', 'herb', 'herbs', 'spinach', 'farmhouse'])) {
    return 'fresh-vegetables';
  }

  // Default hearty culinary category (steaks, burgers, grilled proteins, kebabs)
  return 'grilled-meat';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function shouldUsePhysicalShader(
  preset: FoodMaterialPreset,
  profile: FoodRenderProfile,
  secondaryEffects: boolean,
  isAR: boolean
): boolean {
  if (profile !== 'high-fidelity' || !secondaryEffects || isAR) {
    return false;
  }
  return Boolean(preset.highFidelityPhysical);
}

/**
 * Constructs a brand-new calibrated culinary PBR material for a given food category.
 * Automatically selects lightweight `MeshStandardMaterial` on `ultra-light` and `balanced`
 * tiers, only promoting to `MeshPhysicalMaterial` on `high-fidelity` when secondary lobes apply.
 */
export function createFoodMaterial(
  category: FoodMaterialCategory,
  options: CreateFoodMaterialOptions = {}
): THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial {
  const preset = FOOD_MATERIAL_PRESETS[category] ?? FOOD_MATERIAL_PRESETS['grilled-meat'];
  const profile = options.profile ?? 'balanced';
  const secondaryEffects = options.secondaryEffects ?? (profile === 'high-fidelity');
  const isAR = options.isAR ?? false;

  const [minR, maxR] = preset.roughnessRange;
  const targetRoughness = clamp(options.roughnessOverride ?? preset.roughness, minR, maxR);
  const colorHex = options.colorOverride ?? preset.color;

  const envScale = isAR
    ? 0.6
    : profile === 'ultra-light'
      ? 0.78
      : profile === 'balanced'
        ? 0.95
        : 1.05;

  const usePhysical = shouldUsePhysicalShader(preset, profile, secondaryEffects, isAR);

  const baseParams: THREE.MeshStandardMaterialParameters = {
    name: `GoldenOak_${preset.category}`,
    color: new THREE.Color(colorHex),
    roughness: targetRoughness,
    metalness: preset.metalness,
    envMapIntensity: Number((preset.envMapIntensity * envScale).toFixed(3)),
    aoMapIntensity: profile === 'ultra-light' ? Math.min(0.75, preset.aoMapIntensity) : preset.aoMapIntensity,
    transparent: Boolean(preset.transparent),
    opacity: preset.transparent ? (preset.opacity ?? 1.0) : 1.0,
    depthWrite: preset.depthWrite ?? !preset.transparent,
  };

  if (!isAR && preset.warmScatterHex && preset.warmScatterIntensity) {
    baseParams.emissive = new THREE.Color(preset.warmScatterHex);
    baseParams.emissiveIntensity =
      profile === 'ultra-light'
        ? preset.warmScatterIntensity * 1.15
        : preset.warmScatterIntensity;
  }

  if (usePhysical && preset.highFidelityPhysical) {
    const phys = preset.highFidelityPhysical;
    const physParams: THREE.MeshPhysicalMaterialParameters = {
      ...baseParams,
      clearcoat: phys.clearcoat ?? 0,
      clearcoatRoughness: phys.clearcoatRoughness ?? 0,
      sheen: phys.sheen ?? 0,
      sheenRoughness: phys.sheenRoughness ?? 0,
      transmission: phys.transmission ?? 0,
      ior: phys.ior ?? 1.45,
      thickness: phys.thickness ?? 0,
      attenuationDistance: phys.attenuationDistance ?? Infinity,
    };
    if (phys.sheenColor) {
      physParams.sheenColor = new THREE.Color(phys.sheenColor);
    }
    if (phys.attenuationColor) {
      physParams.attenuationColor = new THREE.Color(phys.attenuationColor);
    }
    const mat = new THREE.MeshPhysicalMaterial(physParams);
    mat.normalScale.set(preset.normalScale, preset.normalScale);
    return mat;
  }

  const stdMat = new THREE.MeshStandardMaterial(baseParams);
  stdMat.normalScale.set(preset.normalScale, preset.normalScale);
  return stdMat;
}

/**
 * Clones materials across `root` per-instance so mutating a cloned glTF scene NEVER
 * mutates shared `useGLTF` cache materials. Deduplicates shared materials within `root`
 * so meshes sharing a material inside the same dish still share one cloned material.
 *
 * Tags every cloned material with `userData.__clonedForInstance = true` so cleanup
 * helpers know it is safe to `.dispose()`.
 */
export function cloneMaterialsForInstance(root: THREE.Object3D): THREE.Material[] {
  const cloneMap = new Map<THREE.Material, THREE.Material>();
  const createdClones: THREE.Material[] = [];

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh || !mesh.isMesh || !mesh.material) return;

    const replaceOne = (mat: THREE.Material): THREE.Material => {
      if (!mat) return mat;
      if (mat.userData?.__clonedForInstance === true || mat.userData?.__isInstanceClone === true) {
        mat.userData.__clonedForInstance = true;
        mat.userData.__isInstanceClone = true;
        return mat;
      }
      const existing = cloneMap.get(mat);
      if (existing) return existing;

      const cloned = mat.clone();
      cloned.userData = {
        ...(mat.userData || {}),
        __clonedForInstance: true,
        __isInstanceClone: true,
        __sourceMaterialUuid: mat.uuid,
      };
      cloneMap.set(mat, cloned);
      createdClones.push(cloned);
      return cloned;
    };

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(replaceOne);
    } else {
      mesh.material = replaceOne(mesh.material);
    }
  });

  return createdClones;
}

/**
 * Safely disposes ONLY per-instance cloned materials (`userData.__clonedForInstance === true`),
 * leaving shared `useGLTF` geometries and cached textures 100% intact.
 */
export function disposeClonedInstanceMaterials(root: THREE.Object3D): number {
  const disposed = new Set<THREE.Material>();

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh || !mesh.isMesh || !mesh.material) return;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of list) {
      if (mat && mat.userData?.__clonedForInstance === true && !disposed.has(mat)) {
        disposed.add(mat);
        mat.dispose();
      }
    }
  });

  return disposed.size;
}

/**
 * Converts a heavy `MeshPhysicalMaterial` into a single-lobe `MeshStandardMaterial`
 * while preserving all primary PBR maps, UV transforms, transparency, and userData.
 */
function downgradePhysicalToStandard(phys: THREE.MeshPhysicalMaterial): THREE.MeshStandardMaterial {
  const std = new THREE.MeshStandardMaterial({
    name: phys.name,
    color: phys.color.clone(),
    roughness: phys.roughness,
    metalness: phys.metalness,
    emissive: phys.emissive.clone(),
    emissiveIntensity: phys.emissiveIntensity,
    aoMapIntensity: phys.aoMapIntensity,
    envMapIntensity: phys.envMapIntensity,
    transparent: phys.transparent,
    opacity: phys.opacity,
    alphaTest: phys.alphaTest,
    depthWrite: phys.depthWrite,
    depthTest: phys.depthTest,
    side: phys.side,
    vertexColors: phys.vertexColors,
    flatShading: phys.flatShading,
  });

  for (const slot of TEXTURE_SLOTS_FOR_COPY) {
    const tex = phys[slot];
    if (tex) {
      (std as unknown as Record<string, unknown>)[slot] = tex;
    }
  }

  if (phys.normalScale) {
    std.normalScale.copy(phys.normalScale);
  }

  std.userData = {
    ...(phys.userData || {}),
    __clonedForInstance: true,
    __isInstanceClone: true,
    __downgradedFromPhysical: true,
  };

  if (phys.userData?.__clonedForInstance === true || phys.userData?.__isInstanceClone === true) {
    phys.dispose();
  }

  return std;
}

const KNOWN_METALLIC_HINT_RE = /(gold|brass|bronze|steel|iron|blade|silver|chrome|copper|metal|armor|cutlery|fork|knife|spoon)/i;

/**
 * Applies tier-calibrated culinary PBR tuning across an entire 3D dish hierarchy.
 *
 * Guarantees:
 * 1. Non-destructive per-instance material cloning (`__clonedForInstance = true`).
 * 2. Eliminates plastic shine by clamping roughness into organic culinary ranges.
 * 3. Strips multi-pass `transmission`, `clearcoat`, `sheen`, and `anisotropy` on
 *    `ultra-light` and `balanced` tiers (or when `secondaryEffects === false`),
 *    downgrading `MeshPhysicalMaterial` to single-pass `MeshStandardMaterial`.
 * 4. In `isAR === true`, strips static baked `envMap` color tinting and glow so
 *    dishes blend naturally with dynamic real-world table lighting.
 */
export function applyFoodMaterialProfile(
  root: THREE.Object3D,
  options: ApplyFoodMaterialProfileOptions
): FoodMaterialApplicationSummary {
  const profile = resolveFoodRenderProfile(options.profile);
  const secondaryEffects =
    options.secondaryEffects !== undefined
      ? options.secondaryEffects
      : profile === 'high-fidelity';
  const isAR = Boolean(options.isAR);
  const maxAnisotropy =
    options.maxAnisotropy ??
    (profile === 'ultra-light' ? 1 : profile === 'balanced' ? 4 : 8);

  const fallbackCategory = inferFoodCategoryFromHint(options.category);

  // Step 1: Clone shared glTF materials per-instance so cache is never poisoned
  const newlyCloned = cloneMaterialsForInstance(root);

  let downgradedCount = 0;
  const processedMaterials = new Set<THREE.Material>();
  const downgradedMap = new Map<THREE.Material, THREE.MeshStandardMaterial>();

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh || !mesh.isMesh || !mesh.material) return;

    const transformMaterial = (mat: THREE.Material): THREE.Material => {
      if (!mat) return mat;
      if (downgradedMap.has(mat)) {
        return downgradedMap.get(mat)!;
      }

      const combinedName = `${mat.name || ''} ${mesh.name || ''}`.trim();
      const hasSpecificSubpartHint =
        /(glass|tumbler|plate|porcelain|ceramic|sauce|glaze|cheese|mozzarella|cheddar|paneer|crust|bun|bread|fried|fries|crispy|veg|lettuce|tomato|herb|meat|patty|steak|chicken|dessert|chocolate|drink|beverage|liquid|cornea)/i.test(
          combinedName
        );

      const category = hasSpecificSubpartHint
        ? inferFoodCategoryFromHint(combinedName)
        : fallbackCategory;
      const preset = FOOD_MATERIAL_PRESETS[category];
      const isMetallicPart = KNOWN_METALLIC_HINT_RE.test(combinedName);

      const allowPhysical =
        !isAR &&
        profile === 'high-fidelity' &&
        secondaryEffects &&
        Boolean(preset.highFidelityPhysical) &&
        !isMetallicPart;

      let targetMat: THREE.Material = mat;

      // Downgrade MeshPhysicalMaterial on ultra-light & balanced (or when secondaryEffects === false)
      if ((mat as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial && !allowPhysical) {
        const std = downgradePhysicalToStandard(mat as THREE.MeshPhysicalMaterial);
        downgradedMap.set(mat, std);
        targetMat = std;
        downgradedCount++;
      }

      if (processedMaterials.has(targetMat)) {
        return targetMat;
      }
      processedMaterials.add(targetMat);

      const stdMat = targetMat as THREE.MeshStandardMaterial;
      if (!stdMat.isMeshStandardMaterial) {
        return targetMat;
      }

      if (isMetallicPart) {
        // Preserve gleaming cutlery / brass trim / warrior metal without turning into dielectric food
        stdMat.roughness = clamp(stdMat.roughness || 0.28, 0.16, 0.55);
        stdMat.metalness = clamp(stdMat.metalness || 0.75, 0.4, 0.92);
        stdMat.envMapIntensity = isAR ? 0.65 : profile === 'ultra-light' ? 0.9 : 1.2;
      } else {
        // Dielectric culinary calibration
        const [minR, maxR] = preset.roughnessRange;
        // If explicit category was passed and material had default/uncalibrated roughness (e.g. 0.5 or 1.0 or 0.0), snap to preset
        const incomingR = typeof stdMat.roughness === 'number' ? stdMat.roughness : preset.roughness;
        const calibratedR =
          incomingR < minR || incomingR > maxR
            ? preset.roughness
            : incomingR * 0.5 + preset.roughness * 0.5;

        stdMat.roughness = Number(clamp(calibratedR, minR, maxR).toFixed(4));
        stdMat.metalness = preset.metalness;

        // Preserve painted BaseColor maps while applying gentle appetite warmth;
        // if untextured and carrying default white/placeholder albedo, apply culinary preset color
        if (stdMat.map) {
          stdMat.color.set(preset.texturedTint);
        } else if (options.category && (!mat.name || mat.name === 'unnamed' || mat.name.startsWith('GoldenOak_'))) {
          stdMat.color.set(preset.color);
        }

        // Safe TBDR mobile fast-path for transparent glass & beverages
        if (preset.transparent || combinedName.toLowerCase().includes('cornea')) {
          stdMat.transparent = true;
          stdMat.opacity = combinedName.toLowerCase().includes('cornea')
            ? 0.28
            : (preset.opacity ?? 0.85);
          stdMat.depthWrite = preset.depthWrite ?? false;
        }

        // Normal & AO calibration
        if (stdMat.normalMap && stdMat.normalScale) {
          const ns = profile === 'ultra-light' ? Math.min(1.0, preset.normalScale) : preset.normalScale;
          stdMat.normalScale.set(ns, ns);
        }
        stdMat.aoMapIntensity =
          profile === 'ultra-light'
            ? Math.min(0.7, preset.aoMapIntensity)
            : preset.aoMapIntensity;

        // Environment & warm scatter calibration
        const envScale = isAR
          ? 0.55
          : profile === 'ultra-light'
            ? 0.75
            : profile === 'balanced'
              ? 0.95
              : 1.05;
        stdMat.envMapIntensity = Number((preset.envMapIntensity * envScale).toFixed(3));

        if (isAR) {
          // Zero static baked environment color tinting or self-illumination in real-world AR
          stdMat.envMap = null;
          stdMat.emissiveIntensity = 0;
        } else if (!stdMat.emissiveMap && preset.warmScatterHex && preset.warmScatterIntensity) {
          stdMat.emissive.set(preset.warmScatterHex);
          stdMat.emissiveIntensity = preset.warmScatterIntensity;
        }
      }

      // Enforce physical secondary lobe rules if still MeshPhysicalMaterial
      if ((stdMat as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial) {
        const physMat = stdMat as THREE.MeshPhysicalMaterial;
        if (!allowPhysical) {
          physMat.clearcoat = 0;
          physMat.transmission = 0;
          physMat.sheen = 0;
          physMat.anisotropy = 0;
        } else if (preset.highFidelityPhysical) {
          const hp = preset.highFidelityPhysical;
          physMat.clearcoat = hp.clearcoat ?? 0;
          physMat.clearcoatRoughness = hp.clearcoatRoughness ?? 0;
          physMat.sheen = hp.sheen ?? 0;
          physMat.sheenRoughness = hp.sheenRoughness ?? 0;
          if (hp.sheenColor) physMat.sheenColor.set(hp.sheenColor);
          physMat.transmission = hp.transmission ?? 0;
          if (hp.ior) physMat.ior = hp.ior;
          if (hp.thickness !== undefined) physMat.thickness = hp.thickness;
        }
      }

      // Clamp texture anisotropy across active slots
      for (const slot of TEXTURE_SLOTS_FOR_COPY) {
        const tex = stdMat[slot];
        if (tex && tex.isTexture) {
          tex.anisotropy = profile === 'ultra-light' ? 1 : Math.max(1, maxAnisotropy);
        }
      }

      // On ultra-light, detach optional secondary normal/AO maps if desired?
      // Note: Spec preserves Base Color + crisp roughness/color balance on ultra-light,
      // and keeps primary normal map on balanced+.
      if (profile === 'ultra-light') {
        if (stdMat.bumpMap) stdMat.bumpMap = null;
        if (stdMat.displacementMap) stdMat.displacementMap = null;
      }

      stdMat.needsUpdate = true;
      return stdMat;
    };

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(transformMaterial);
    } else {
      mesh.material = transformMaterial(mesh.material);
    }
  });

  return {
    clonedMaterials: newlyCloned.length,
    downgradedPhysicalMaterials: downgradedCount,
    styledMaterials: processedMaterials.size,
    profile,
    resolvedCategory: fallbackCategory,
  };
}
