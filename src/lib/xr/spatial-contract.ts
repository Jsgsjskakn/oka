/**
 * THE GOLDEN OAK — PHASE 3.2 SHARED SPATIAL CONTRACT (Lead Orchestrator owned)
 *
 * Single source of truth for every AR sub-system. All five Phase 3.2 work-streams
 * (tracking, placement/dimensions, food assets, performance, QA) MUST import their
 * coordinate conventions, state machines and metadata shapes from this file.
 *
 * DO NOT fork these definitions. Extend them here (with orchestrator review) instead.
 *
 * This module is intentionally dependency-free (no three.js, no React) so it can be
 * imported by Node's native `node --test` runner and by build-time asset scripts.
 */

// ---------------------------------------------------------------------------
// 1. Canonical coordinate system
// ---------------------------------------------------------------------------

/**
 * 1 world unit === 1 metre (glTF 2.0 spec, WebXR spec, ARCore & ARKit convention).
 * +Y is up, right-handed, dish faces +Z.
 */
export const WORLD_UNITS_PER_METRE = 1 as const;
export const CENTIMETRES_PER_METRE = 100 as const;

/**
 * Canonical dish model origin convention.
 * - X/Z: centre of the dish footprint (bounding-box centre in the XZ plane).
 * - Y: the LOWEST point of the dish/plate (ground contact). y = 0 touches the table.
 * Runtime code must apply `groundContactOffsetM` when an asset does not yet satisfy this.
 */
export const CANONICAL_ORIGIN = 'footprint-centre-ground-contact' as const;

/** Allowed physical scale error vs validated reference dimensions (±5%). */
export const SCALE_TOLERANCE_RATIO = 0.05;

/** Allowed residual gap / penetration between dish base and detected plane (metres). */
export const GROUND_CONTACT_TOLERANCE_M = 0.002;

export function cmToMetres(cm: number): number {
  return cm / CENTIMETRES_PER_METRE;
}

export function metresToCm(m: number): number {
  return m * CENTIMETRES_PER_METRE;
}

// ---------------------------------------------------------------------------
// 2. Spatial experience routing (never conflate these)
// ---------------------------------------------------------------------------

export type ARExperienceRoute =
  /** In-browser WebXR `immersive-ar` with `hit-test` (Android Chrome + ARCore). World-tracked. */
  | 'webxr-immersive-ar'
  /** Hand-off to Google Scene Viewer (ARCore). World-tracked, Google-owned UI & gestures. */
  | 'android-scene-viewer'
  /** Hand-off to Apple AR Quick Look (ARKit, USDZ). World-tracked, Apple-owned UI & gestures. */
  | 'ios-quick-look'
  /** Orbit 3D viewer (no camera). NOT AR. */
  | 'ordinary-3d-viewer'
  /** getUserMedia video behind a WebGL canvas. NOT AR, NOT world-tracked. Last-resort preview only. */
  | 'camera-preview-not-tracked';

export const WORLD_TRACKED_ROUTES: readonly ARExperienceRoute[] = [
  'webxr-immersive-ar',
  'android-scene-viewer',
  'ios-quick-look',
];

export function isWorldTrackedRoute(route: ARExperienceRoute): boolean {
  return WORLD_TRACKED_ROUTES.includes(route);
}

/** Human-facing labels. The camera preview must never contain the word "AR" alone. */
export const ROUTE_LABELS: Record<ARExperienceRoute, string> = {
  'webxr-immersive-ar': 'AR on your table',
  'android-scene-viewer': 'View in your space (Google Scene Viewer)',
  'ios-quick-look': 'View in your space (Apple AR Quick Look)',
  'ordinary-3d-viewer': '3D Viewer',
  'camera-preview-not-tracked': 'Camera Preview (not world-tracked)',
};

// ---------------------------------------------------------------------------
// 3. Tracking state machine (WebXR in-app session)
// ---------------------------------------------------------------------------

export type XRTrackingState =
  | 'idle'
  | 'checking-support'
  | 'unsupported'
  | 'requesting-session'
  | 'session-denied'
  /** Session running, viewer pose available, no surface hit yet. */
  | 'scanning'
  /** Hit-test returns a horizontal surface; reticle snapped. */
  | 'surface-detected'
  /** Dish attached to a world anchor (or fixed reference-space pose). */
  | 'placed'
  /** Viewer pose lost or `emulatedPosition === true`; keep last anchor, do not move dish. */
  | 'tracking-limited'
  | 'session-ended'
  | 'error';

export type PlacementAnchorKind =
  /** `XRAnchor` created via `hitTestResult.createAnchor()` / `frame.createAnchor()`. Preferred. */
  | 'xr-anchor'
  /** Fixed pose in the session's `local` / `local-floor` reference space (anchors unsupported). Still world-tracked. */
  | 'reference-space-pose';

export interface PlacementRecord {
  dishSlug: string;
  anchorKind: PlacementAnchorKind;
  /** Column-major 4x4 matrix in reference space at placement time (metres). */
  initialPoseMatrix: readonly number[];
  /** User-controlled multiplier on top of validated real size. 1 = real size. */
  userScale: number;
  /** User-controlled yaw rotation (radians) about +Y. Never driven by the camera. */
  userYawRad: number;
  placedAtMs: number;
}

/** Hard limits for deliberate pinch-to-scale. Reset always returns to 1. */
export const USER_SCALE_MIN = 0.5;
export const USER_SCALE_MAX = 2.0;
export const REAL_SIZE_USER_SCALE = 1;

/** Max cosine deviation of a hit-test surface normal from +Y to accept as horizontal (~15°). */
export const HORIZONTAL_SURFACE_MIN_NORMAL_Y = Math.cos((15 * Math.PI) / 180);

// ---------------------------------------------------------------------------
// 4. Dish physical-dimension metadata
// ---------------------------------------------------------------------------

export type DimensionSource =
  /** Measured with a ruler / calipers on the actual plated dish. Only this may be called "validated". */
  | 'physically-measured'
  /** Derived from the restaurant's portion/plate specification sheet. */
  | 'kitchen-spec-sheet'
  /** Typical restaurant portion estimate. MUST be replaced before production sign-off. */
  | 'estimated-typical-portion';

export interface DishPhysicalSpec {
  dishId: string;
  /** Real-world target dimensions in centimetres (footprint incl. plate/board if modelled). */
  dimensions: { widthCm: number; depthCm: number; heightCm: number };
  dimensionSource: DimensionSource;
  units: 'meters';
  /** Measured from the GLB at build time (metres, in the file's own units after node transforms). */
  modelBoundingBoxM?: { width: number; depth: number; height: number };
  /** Uniform factor that maps the raw GLB to real size (realWidth / modelWidth, etc.). */
  modelScaleFactor?: number;
  /** Translation (metres, post-scale) to put the lowest point at y = 0. */
  groundContactOffsetM?: number;
  assetVersion: string;
  scaleValidated: boolean;
  groundContactValidated: boolean;
}

/**
 * Computes the uniform scale factor that maps a model bounding box (metres) to its real
 * footprint. Uses the largest horizontal extent so round/square dishes match the plate
 * diameter. Height is reported as a deviation, never used to squash geometry.
 */
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

/**
 * Real size must NEVER depend on screen resolution, devicePixelRatio, viewport or device tier.
 * This guard exists so tests can assert that callers do not pass such inputs.
 */
export const FORBIDDEN_SCALE_INPUTS = [
  'devicePixelRatio',
  'innerWidth',
  'innerHeight',
  'screen.width',
  'qualityTier',
] as const;

// ---------------------------------------------------------------------------
// 5. Result provenance labels (every report & benchmark row)
// ---------------------------------------------------------------------------

export type EvidenceLabel =
  | 'physically-measured'
  | 'browser-or-device-emulated'
  | 'automated-test'
  | 'estimated'
  | 'not-tested';
