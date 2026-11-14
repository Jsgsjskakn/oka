/**
 * THE GOLDEN OAK — PHASE 3.2 PLACEMENT & DIMENSION MATH
 * Sub-Agent 2 (Table Placement & Dimension Engineer)
 *
 * Pure, dependency-free mathematical foundations for:
 * 1. Physical dish placement transforms (real-world scale factor, ground contact y=0, footprint centering).
 * 2. Surface normal validation (horizontal table surface detection threshold).
 * 3. User scale clamping (0.5x to 2.0x, default 1.0x real size).
 * 4. Hit-test reticle position smoothing (exponential moving average / lerp).
 *
 * Invariant: Real size must NEVER depend on DPR, viewport, innerWidth, or quality tier.
 * 1 world unit === 1 metre. +Y is up.
 *
 * Designed for dual compatibility:
 * - Type-only import from spatial-contract ensures zero runtime module resolution errors under
 *   Node.js ESM test runner while maintaining strict Next.js bundler / TypeScript conformance.
 */

import type { DishPhysicalSpec } from './spatial-contract';

// Canonical constants matching spatial-contract.ts
export const CENTIMETRES_PER_METRE = 100 as const;
export const USER_SCALE_MIN = 0.5 as const;
export const USER_SCALE_MAX = 2.0 as const;
export const REAL_SIZE_USER_SCALE = 1 as const;
export const HORIZONTAL_SURFACE_MIN_NORMAL_Y = Math.cos((15 * Math.PI) / 180);
export const GROUND_CONTACT_TOLERANCE_M = 0.002 as const;

export type Vec3Tuple = [number, number, number];
export type Vec3Like = Vec3Tuple | { x: number; y: number; z: number };

export interface DishPlacementInput {
  /** Raw model bounding-box minimum [minX, minY, minZ] in model space (metres). */
  bboxMin: Vec3Like;
  /** Raw model bounding-box maximum [maxX, maxY, maxZ] in model space (metres). */
  bboxMax: Vec3Like;
  /** Real-world physical specification of the dish (dimensions in cm). */
  spec: DishPhysicalSpec;
  /** User-controlled scale multiplier (1.0 = 100% real life). Clamped to [0.5, 2.0]. */
  userScale?: number;
}

export interface DishPlacementTransform {
  /** Uniform scale factor to apply to the dish model/group. */
  uniformScale: number;
  /**
   * Translation offset [x, y, z] in metres (parent/anchor space) to apply to the model
   * so that its footprint is centred at (0, 0) in XZ and its lowest point touches the
   * table surface at y = 0.
   */
  offset: Vec3Tuple;
  /** Model raw bounding box extent in metres. */
  modelDimensionsM: { width: number; depth: number; height: number };
  /** Target real dimensions in metres. */
  realDimensionsM: { width: number; depth: number; height: number };
  /** Fractional height deviation vs real target height ((scaledHeight - realHeight) / realHeight). */
  heightDeviationRatio: number;
  /** Post-scale Y offset applied to seat base at table level (metres). */
  groundContactOffsetM: number;
}

export function cmToMetres(cm: number): number {
  return cm / CENTIMETRES_PER_METRE;
}

export function computeRealWorldScaleFactor(
  bbox: { width: number; depth: number; height: number },
  dims: { widthCm: number; depthCm: number; heightCm: number }
): { scaleFactor: number; heightDeviationRatio: number } {
  const modelFootprint = Math.max(bbox.width, bbox.depth);
  const realFootprint = cmToMetres(Math.max(dims.widthCm, dims.depthCm));
  if (!(modelFootprint > 0) || !(realFootprint > 0)) {
    return { scaleFactor: 1, heightDeviationRatio: Number.NaN };
  }
  const scaleFactor = realFootprint / modelFootprint;
  const scaledHeight = bbox.height * scaleFactor;
  const realHeight = cmToMetres(dims.heightCm);
  const heightDeviationRatio = realHeight > 0 ? (scaledHeight - realHeight) / realHeight : Number.NaN;
  return { scaleFactor, heightDeviationRatio };
}

function parseVec3(v: Vec3Like): Vec3Tuple {
  if (Array.isArray(v)) {
    return [
      Number.isFinite(v[0]) ? v[0] : 0,
      Number.isFinite(v[1]) ? v[1] : 0,
      Number.isFinite(v[2]) ? v[2] : 0,
    ];
  }
  return [
    Number.isFinite(v.x) ? v.x : 0,
    Number.isFinite(v.y) ? v.y : 0,
    Number.isFinite(v.z) ? v.z : 0,
  ];
}

/**
 * Clamps user-controlled pinch/zoom scale to safe bounds [0.5, 2.0].
 * Non-finite, negative or NaN values reset safely to 1.0 (real size).
 */
export function clampUserScale(userScale: number | undefined): number {
  if (typeof userScale !== 'number' || !Number.isFinite(userScale) || userScale <= 0) {
    return REAL_SIZE_USER_SCALE;
  }
  return Math.max(USER_SCALE_MIN, Math.min(USER_SCALE_MAX, userScale));
}

/**
 * Verifies whether a surface hit normal represents an upward-facing horizontal plane
 * (e.g. tabletop) within ~15 degrees of vertical.
 */
export function isHorizontalSurface(
  normal: number | Vec3Like
): boolean {
  let ny: number;
  if (typeof normal === 'number') {
    ny = normal;
  } else if (Array.isArray(normal)) {
    ny = normal[1];
  } else if (normal && typeof normal === 'object' && 'y' in normal) {
    ny = normal.y;
  } else {
    return false;
  }

  if (!Number.isFinite(ny)) {
    return false;
  }
  return ny >= HORIZONTAL_SURFACE_MIN_NORMAL_Y;
}

/**
 * Computes the uniform scale and translation offset for placing a dish in world-tracked AR.
 *
 * Mathematical guarantee:
 * - When `model.scale.setScalar(uniformScale)` and `model.position.set(...offset)` are applied
 *   inside an anchored group sitting at the detected table hit pose:
 *   1. The lowest vertex of the dish geometry will sit at y = 0 (table plane).
 *   2. The horizontal centroid of the dish footprint will sit at x = 0, z = 0.
 *   3. The horizontal extent of the dish will exactly match the target footprint in metres.
 */
export function computeDishPlacementTransform(
  input: DishPlacementInput
): DishPlacementTransform {
  const min = parseVec3(input.bboxMin);
  const max = parseVec3(input.bboxMax);

  const modelWidth = Math.max(0, max[0] - min[0]);
  const modelHeight = Math.max(0, max[1] - min[1]);
  const modelDepth = Math.max(0, max[2] - min[2]);

  const modelDims = {
    width: modelWidth,
    height: modelHeight,
    depth: modelDepth,
  };

  const realDimsM = {
    width: cmToMetres(input.spec.dimensions.widthCm),
    height: cmToMetres(input.spec.dimensions.heightCm),
    depth: cmToMetres(input.spec.dimensions.depthCm),
  };

  // Base scale mapping model footprint to real footprint
  const { scaleFactor: baseScale, heightDeviationRatio } = computeRealWorldScaleFactor(
    modelDims,
    input.spec.dimensions
  );

  const safeBaseScale = Number.isFinite(baseScale) && baseScale > 0 ? baseScale : 1.0;
  const clampedUserScale = clampUserScale(input.userScale);
  const uniformScale = safeBaseScale * clampedUserScale;

  // Canonical footprint centre in X and Z
  const centreX = (min[0] + max[0]) / 2;
  const centreZ = (min[2] + max[2]) / 2;

  // Ground contact: lowest point is min[1].
  // In parent space, vertex Y = offsetY + rawY * uniformScale.
  // For rawY = min[1], we want vertex Y = 0 => offsetY = -min[1] * uniformScale.
  const groundContactOffsetM = -min[1] * uniformScale;

  const offset: Vec3Tuple = [
    -centreX * uniformScale,
    groundContactOffsetM,
    -centreZ * uniformScale,
  ];

  return {
    uniformScale,
    offset,
    modelDimensionsM: modelDims,
    realDimensionsM: realDimsM,
    heightDeviationRatio,
    groundContactOffsetM,
  };
}

/**
 * Smooths hit-test reticle position to eliminate jitter from high-frequency sensor noise.
 * Uses an exponential moving average (alpha in [0, 1]).
 */
export function smoothReticlePosition(
  prev: Vec3Tuple,
  next: Vec3Tuple,
  alpha = 0.2
): Vec3Tuple {
  const a = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 0.2));
  const invA = 1 - a;
  return [
    prev[0] * invA + next[0] * a,
    prev[1] * invA + next[1] * a,
    prev[2] * invA + next[2] * a,
  ];
}

/**
 * Checks whether the residual gap between the bottom of the dish and the table is
 * within the strict 2mm tolerance.
 */
export function isGroundContactWithinTolerance(residualGapM: number): boolean {
  return Math.abs(residualGapM) <= GROUND_CONTACT_TOLERANCE_M;
}

/**
 * Evaluates the residual ground contact error (metres) given the model's lowest vertex,
 * the applied scale, and the applied offset. Zero means ideal contact.
 */
export function computeGroundContactResidual(
  rawMinY: number,
  uniformScale: number,
  appliedOffsetY: number
): number {
  return appliedOffsetY + rawMinY * uniformScale;
}
