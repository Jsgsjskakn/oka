/**
 * THE GOLDEN OAK — PHYSICAL DISH DIMENSIONS SPECIFICATIONS
 * Sub-Agent 2 (Table Placement & Dimension Engineer)
 *
 * Ground truth physical dimension definitions for all 22 menu items (+ signature burger).
 *
 * Strict Honesty Invariant (Phase 3.2 Contract):
 * All values currently represent estimated typical restaurant portions.
 * Until measured with physical calipers on plated restaurant samples, every entry MUST
 * declare `dimensionSource: 'estimated-typical-portion'` and `scaleValidated: false`.
 *
 * Dimensions:
 * - widthCm, depthCm, heightCm: physical centimetres.
 * - units: 'meters' (glTF 2.0 / WebXR convention).
 * - modelBoundingBoxM, modelScaleFactor, groundContactOffsetM: build-time measured parameters from GLB assets.
 */

import type { DishPhysicalSpec } from '../lib/xr/spatial-contract.ts';

/**
 * Physical specifications for all audited menu dishes.
 * Keyed by normalized dish slug.
 */
export const DISH_PHYSICAL_SPECS: Record<string, DishPhysicalSpec> = {
  'tandoori-paneer-pizza': {
    dishId: 'tandoori-paneer-pizza',
    dimensions: { widthCm: 30, depthCm: 30, heightCm: 3.5 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 2.398388,
      depth: 2.4,
      height: 0.118404,
    },
    modelScaleFactor: 0.125,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'chicken-tikka-pizza': {
    dishId: 'chicken-tikka-pizza',
    dimensions: { widthCm: 30, depthCm: 30, heightCm: 3.5 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 2.394152,
      depth: 2.390352,
      height: 0.055674,
    },
    modelScaleFactor: 0.125305,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'mushroom-truffle-pizza': {
    dishId: 'mushroom-truffle-pizza',
    dimensions: { widthCm: 30, depthCm: 30, heightCm: 3.5 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 2.390555,
      depth: 2.390409,
      height: 0.055455,
    },
    modelScaleFactor: 0.125494,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'peri-peri-fiesta-pizza': {
    dishId: 'peri-peri-fiesta-pizza',
    dimensions: { widthCm: 30, depthCm: 30, heightCm: 3.5 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 2.398388,
      depth: 2.4,
      height: 0.118404,
    },
    modelScaleFactor: 0.125,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'bbq-chicken-overload': {
    dishId: 'bbq-chicken-overload',
    dimensions: { widthCm: 30, depthCm: 30, heightCm: 3.5 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 2.367918,
      depth: 2.366013,
      height: 0.211368,
    },
    modelScaleFactor: 0.126694,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'classic-smash-burger': {
    dishId: 'classic-smash-burger',
    dimensions: { widthCm: 12, depthCm: 12, heightCm: 9.5 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 1.976292,
      depth: 2.000001,
      height: 1.210954,
    },
    modelScaleFactor: 0.06,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'golden-oak-signature-burger': {
    dishId: 'golden-oak-signature-burger',
    dimensions: { widthCm: 12.5, depthCm: 12.5, heightCm: 10.5 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 1.976292,
      depth: 2.000001,
      height: 1.210954,
    },
    modelScaleFactor: 0.0625,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'golden-oak-burger': {
    dishId: 'golden-oak-burger',
    dimensions: { widthCm: 12.5, depthCm: 12.5, heightCm: 10.5 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 1.976292,
      depth: 2.000001,
      height: 1.210954,
    },
    modelScaleFactor: 0.0625,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'crispy-paneer-burger': {
    dishId: 'crispy-paneer-burger',
    dimensions: { widthCm: 12, depthCm: 12, heightCm: 10 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 1.962156,
      depth: 1.975218,
      height: 1.461271,
    },
    modelScaleFactor: 0.060753,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'wok-tossed-chow-mein': {
    dishId: 'wok-tossed-chow-mein',
    dimensions: { widthCm: 18, depthCm: 18, heightCm: 8 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 2.199194,
      depth: 2.198388,
      height: 1.478444,
    },
    modelScaleFactor: 0.081848,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'dynamite-chilli-potatoes': {
    dishId: 'dynamite-chilli-potatoes',
    dimensions: { widthCm: 20, depthCm: 20, heightCm: 5.5 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 2.19624,
      depth: 2.196106,
      height: 1.313555,
    },
    modelScaleFactor: 0.091065,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'keema-masala-pizza': {
    dishId: 'keema-masala-pizza',
    dimensions: { widthCm: 30, depthCm: 30, heightCm: 3.5 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 2.394152,
      depth: 2.390352,
      height: 0.055674,
    },
    modelScaleFactor: 0.125305,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'farmhouse-supreme-pizza': {
    dishId: 'farmhouse-supreme-pizza',
    dimensions: { widthCm: 30, depthCm: 30, heightCm: 3.5 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 2.398388,
      depth: 2.4,
      height: 0.118404,
    },
    modelScaleFactor: 0.125,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'paneer-royale-burger': {
    dishId: 'paneer-royale-burger',
    dimensions: { widthCm: 12, depthCm: 12, heightCm: 10 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 1.976292,
      depth: 2.000001,
      height: 1.210954,
    },
    modelScaleFactor: 0.06,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'truffle-mushroom-cheese-burger': {
    dishId: 'truffle-mushroom-cheese-burger',
    dimensions: { widthCm: 12, depthCm: 12, heightCm: 10 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 1.976292,
      depth: 2.000001,
      height: 1.210954,
    },
    modelScaleFactor: 0.06,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'hakka-street-chow-mein': {
    dishId: 'hakka-street-chow-mein',
    dimensions: { widthCm: 18, depthCm: 18, heightCm: 8 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 0.244,
      depth: 0.244,
      height: 0.08592,
    },
    modelScaleFactor: 0.737705,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'golden-chilli-potato': {
    dishId: 'golden-chilli-potato',
    dimensions: { widthCm: 20, depthCm: 20, heightCm: 5.5 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 0.244,
      depth: 0.244,
      height: 0.08592,
    },
    modelScaleFactor: 0.819672,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'truffle-mushroom-risotto': {
    dishId: 'truffle-mushroom-risotto',
    dimensions: { widthCm: 19, depthCm: 19, heightCm: 7 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 0.244,
      depth: 0.244,
      height: 0.08592,
    },
    modelScaleFactor: 0.778689,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'butter-chicken-bao': {
    dishId: 'butter-chicken-bao',
    dimensions: { widthCm: 18, depthCm: 18, heightCm: 7 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 0.244,
      depth: 0.244,
      height: 0.08592,
    },
    modelScaleFactor: 0.737705,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'dahi-ke-kebab': {
    dishId: 'dahi-ke-kebab',
    dimensions: { widthCm: 22, depthCm: 16, heightCm: 4.5 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 0.244,
      depth: 0.244,
      height: 0.08592,
    },
    modelScaleFactor: 0.901639,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'crispy-chilli-babycorn': {
    dishId: 'crispy-chilli-babycorn',
    dimensions: { widthCm: 20, depthCm: 20, heightCm: 5.5 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 0.244,
      depth: 0.244,
      height: 0.08592,
    },
    modelScaleFactor: 0.819672,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'dim-sum-platter': {
    dishId: 'dim-sum-platter',
    dimensions: { widthCm: 21, depthCm: 21, heightCm: 6 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 0.244,
      depth: 0.244,
      height: 0.08592,
    },
    modelScaleFactor: 0.860656,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
  'kaffir-lime-mocktail': {
    dishId: 'kaffir-lime-mocktail',
    dimensions: { widthCm: 8, depthCm: 8, heightCm: 16 },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    modelBoundingBoxM: {
      width: 0.136,
      depth: 0.136,
      height: 0.166007,
    },
    modelScaleFactor: 0.588235,
    groundContactOffsetM: 0,
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: true,
  },
};

/**
 * Safe category defaults for dynamic / unlisted dishes.
 */
export const DEFAULT_CATEGORY_PHYSICAL_SPECS: Record<
  string,
  { widthCm: number; depthCm: number; heightCm: number }
> = {
  pizza: { widthCm: 30.0, depthCm: 30.0, heightCm: 3.5 },
  burger: { widthCm: 12.0, depthCm: 12.0, heightCm: 10.0 },
  bowl: { widthCm: 18.0, depthCm: 18.0, heightCm: 8.0 },
  starter: { widthCm: 20.0, depthCm: 20.0, heightCm: 5.5 },
  beverage: { widthCm: 8.0, depthCm: 8.0, heightCm: 16.0 },
  dessert: { widthCm: 14.0, depthCm: 14.0, heightCm: 6.0 },
  default: { widthCm: 18.0, depthCm: 18.0, heightCm: 8.0 },
};

/**
 * Retrieves the physical specification for any dish slug.
 *
 * If the dish slug is unknown, infers an appropriate category default based on slug heuristics.
 * Guaranteed to return a valid DishPhysicalSpec with units: 'meters' and scaleValidated: false.
 */
export function getDishPhysicalSpec(dishSlug: string): DishPhysicalSpec {
  const normalized = (dishSlug || '').trim().toLowerCase();

  if (DISH_PHYSICAL_SPECS[normalized]) {
    return DISH_PHYSICAL_SPECS[normalized];
  }

  // Heuristic category inference
  let dims = DEFAULT_CATEGORY_PHYSICAL_SPECS.default;
  if (/(pizza|flatbread|calzone)/.test(normalized)) {
    dims = DEFAULT_CATEGORY_PHYSICAL_SPECS.pizza;
  } else if (/(burger|sandwich|slider|bun)/.test(normalized)) {
    dims = DEFAULT_CATEGORY_PHYSICAL_SPECS.burger;
  } else if (/(noodle|chow-mein|rice|risotto|pasta|curry|dal|gravy|bowl)/.test(normalized)) {
    dims = DEFAULT_CATEGORY_PHYSICAL_SPECS.bowl;
  } else if (/(mocktail|cocktail|beverage|drink|cooler|juice|shake|tea|coffee|glass)/.test(normalized)) {
    dims = DEFAULT_CATEGORY_PHYSICAL_SPECS.beverage;
  } else if (/(cake|brownie|dessert|tiramisu|ice-cream|pastry|pudding)/.test(normalized)) {
    dims = DEFAULT_CATEGORY_PHYSICAL_SPECS.dessert;
  } else if (/(potato|kebab|tikka|fry|fries|starter|appetizer|corn|platter|bao|dim-sum)/.test(normalized)) {
    dims = DEFAULT_CATEGORY_PHYSICAL_SPECS.starter;
  }

  return {
    dishId: normalized || 'unknown-dish',
    dimensions: { ...dims },
    dimensionSource: 'estimated-typical-portion',
    units: 'meters',
    assetVersion: '1.0.0',
    scaleValidated: false,
    groundContactValidated: false,
  };
}
