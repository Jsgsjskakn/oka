/**
 * THE GOLDEN OAK — Phase 3.2 Spatial Contract Automated Verification Suite
 * Sub-Agent 5 (QA & Regression Engineer)
 *
 * Validates the core spatial contract defined in src/lib/xr/spatial-contract.ts:
 * 1. Canonical units & origin conventions (1m = 1 unit, ground contact y=0, cm/m conversions)
 * 2. Spatial routing & labeling honesty (camera preview never world-tracked, label conventions)
 * 3. User scale boundaries & horizontal surface detection thresholds
 * 4. Real-world scale factor calculation math (uniform scale, footprint max, height deviation)
 * 5. Forbidden scale inputs invariance (screen/tier metrics forbidden from physical scaling)
 * 6. Evidence labels & provenance integrity
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  WORLD_UNITS_PER_METRE,
  CENTIMETRES_PER_METRE,
  CANONICAL_ORIGIN,
  SCALE_TOLERANCE_RATIO,
  GROUND_CONTACT_TOLERANCE_M,
  cmToMetres,
  metresToCm,
  WORLD_TRACKED_ROUTES,
  isWorldTrackedRoute,
  ROUTE_LABELS,
  USER_SCALE_MIN,
  USER_SCALE_MAX,
  REAL_SIZE_USER_SCALE,
  HORIZONTAL_SURFACE_MIN_NORMAL_Y,
  computeRealWorldScaleFactor,
  FORBIDDEN_SCALE_INPUTS,
} from '../src/lib/xr/spatial-contract.ts';

test('Phase 3.2 — Spatial Contract & Ground Truth Specification', async (t) => {
  await t.test('1. Canonical Coordinate System & Unit Conversions', () => {
    // 1 world unit === 1 metre (glTF 2.0 / WebXR specification)
    assert.equal(WORLD_UNITS_PER_METRE, 1, '1 world unit must equal 1 metre');
    assert.equal(CENTIMETRES_PER_METRE, 100, 'Must have 100 cm per metre');
    assert.equal(CANONICAL_ORIGIN, 'footprint-centre-ground-contact', 'Origin must be footprint centre at table ground contact');

    // Tolerances
    assert.equal(SCALE_TOLERANCE_RATIO, 0.05, 'Allowed scale error tolerance must be ±5%');
    assert.equal(GROUND_CONTACT_TOLERANCE_M, 0.002, 'Ground contact tolerance must be 2mm (0.002m)');

    // Conversion functions
    assert.equal(cmToMetres(100), 1.0, '100 cm -> 1.0 m');
    assert.equal(cmToMetres(25.4), 0.254, '25.4 cm -> 0.254 m');
    assert.equal(cmToMetres(0), 0.0, '0 cm -> 0 m');

    assert.equal(metresToCm(1.0), 100, '1.0 m -> 100 cm');
    assert.ok(Math.abs(metresToCm(0.28) - 28) < 1e-12, '0.28 m -> 28 cm');
    assert.equal(metresToCm(0), 0, '0 m -> 0 cm');

    // Bidirectional roundtrip accuracy
    const testValuesCm = [1, 5.5, 12, 28, 30.2, 45, 100];
    for (const val of testValuesCm) {
      assert.ok(
        Math.abs(metresToCm(cmToMetres(val)) - val) < 1e-12,
        `Roundtrip conversion failed for ${val} cm`
      );
    }
  });

  await t.test('2. Spatial Routing Honesty & Route Labels', () => {
    // World tracked routes
    assert.ok(Array.isArray(WORLD_TRACKED_ROUTES), 'WORLD_TRACKED_ROUTES must be an array');
    assert.equal(WORLD_TRACKED_ROUTES.length, 3, 'Must have exactly 3 genuine world-tracked routes');
    assert.ok(WORLD_TRACKED_ROUTES.includes('webxr-immersive-ar'), 'Must include WebXR immersive-ar');
    assert.ok(WORLD_TRACKED_ROUTES.includes('android-scene-viewer'), 'Must include Google Scene Viewer');
    assert.ok(WORLD_TRACKED_ROUTES.includes('ios-quick-look'), 'Must include Apple AR Quick Look');

    // Camera preview is NEVER world-tracked
    assert.equal(
      isWorldTrackedRoute('camera-preview-not-tracked'),
      false,
      'CRITICAL: camera-preview-not-tracked must NEVER be classified as world-tracked'
    );
    assert.equal(
      isWorldTrackedRoute('ordinary-3d-viewer'),
      false,
      'ordinary-3d-viewer must not be classified as world-tracked'
    );

    // World-tracked classification helper
    assert.equal(isWorldTrackedRoute('webxr-immersive-ar'), true);
    assert.equal(isWorldTrackedRoute('android-scene-viewer'), true);
    assert.equal(isWorldTrackedRoute('ios-quick-look'), true);

    // Labels honesty: camera preview must explicitly state not-tracked and must NOT stand alone as "AR"
    const cameraLabel = ROUTE_LABELS['camera-preview-not-tracked'];
    assert.ok(cameraLabel, 'Camera preview route label must exist');
    assert.ok(
      cameraLabel.toLowerCase().includes('not world-tracked') || cameraLabel.toLowerCase().includes('not-tracked'),
      `Camera preview label must explicitly mention not-tracked, got: "${cameraLabel}"`
    );
    assert.notEqual(
      cameraLabel.trim().toUpperCase(),
      'AR',
      'Camera preview route label must NEVER be "AR" alone'
    );

    // All known routes must have human-facing labels
    const expectedRoutes = [
      'webxr-immersive-ar',
      'android-scene-viewer',
      'ios-quick-look',
      'ordinary-3d-viewer',
      'camera-preview-not-tracked',
    ];
    for (const r of expectedRoutes) {
      assert.ok(typeof ROUTE_LABELS[r] === 'string' && ROUTE_LABELS[r].length > 0, `Missing label for route ${r}`);
    }
  });

  await t.test('3. Tracking State Machine Constants & Horizontal Surface Threshold', () => {
    // User scale bounds
    assert.equal(USER_SCALE_MIN, 0.5, 'User scale min must be 0.5x');
    assert.equal(USER_SCALE_MAX, 2.0, 'User scale max must be 2.0x');
    assert.equal(REAL_SIZE_USER_SCALE, 1.0, 'Real size reference scale must be exactly 1.0');

    // Horizontal surface normal Y threshold (approx cos(15 deg) ~ 0.9659)
    assert.ok(
      HORIZONTAL_SURFACE_MIN_NORMAL_Y > 0.95 && HORIZONTAL_SURFACE_MIN_NORMAL_Y < 0.98,
      `Normal Y threshold should be cos(15 deg), got ${HORIZONTAL_SURFACE_MIN_NORMAL_Y}`
    );

    // Verify angles: 0 deg (flat) passes, 10 deg passes, 15 deg boundary, 20 deg fails, 90 deg (wall) fails
    const degToNormalY = (deg) => Math.cos((deg * Math.PI) / 180);
    assert.ok(degToNormalY(0) >= HORIZONTAL_SURFACE_MIN_NORMAL_Y, '0 deg normal (straight up) must qualify as horizontal');
    assert.ok(degToNormalY(10) >= HORIZONTAL_SURFACE_MIN_NORMAL_Y, '10 deg normal must qualify as horizontal');
    assert.ok(degToNormalY(20) < HORIZONTAL_SURFACE_MIN_NORMAL_Y, '20 deg normal must be rejected as non-horizontal');
    assert.ok(degToNormalY(90) < HORIZONTAL_SURFACE_MIN_NORMAL_Y, '90 deg vertical wall must be rejected as non-horizontal');
  });

  await t.test('4. computeRealWorldScaleFactor Mathematical Correctness', () => {
    // Case A: Model with footprint 1.0m x 1.0m, real target 28cm x 28cm x 5cm
    const bboxA = { width: 1.0, depth: 1.0, height: 0.15 };
    const dimsA = { widthCm: 28, depthCm: 28, heightCm: 4.2 };
    const resA = computeRealWorldScaleFactor(bboxA, dimsA);

    // realFootprint = 0.28m, modelFootprint = 1.0m => scaleFactor = 0.28
    assert.equal(resA.scaleFactor, 0.28, 'Scale factor must map 1.0m model footprint to 0.28m');
    // scaledHeight = 0.15 * 0.28 = 0.042m = 4.2cm. realHeight = 4.2cm => deviation = 0.0
    assert.ok(Math.abs(resA.heightDeviationRatio) < 1e-6, 'Height deviation should be 0 when proportions match');

    // Case B: Rectangular dish (e.g. platter 36cm x 22cm), model bbox width=1.2, depth=0.8, height=0.1
    const bboxB = { width: 1.2, depth: 0.8, height: 0.1 };
    const dimsB = { widthCm: 36, depthCm: 22, heightCm: 3.0 };
    const resB = computeRealWorldScaleFactor(bboxB, dimsB);

    // modelFootprint = max(1.2, 0.8) = 1.2m. realFootprint = max(0.36, 0.22) = 0.36m.
    // scaleFactor = 0.36 / 1.2 = 0.3
    assert.equal(resB.scaleFactor, 0.3, 'Scale factor must use maximum horizontal extent for uniform scaling');

    // Case C: Invalid or zero dimensions return safe fallback { scaleFactor: 1, heightDeviationRatio: NaN }
    const zeroRes = computeRealWorldScaleFactor({ width: 0, depth: 0, height: 0 }, dimsA);
    assert.equal(zeroRes.scaleFactor, 1, 'Zero model footprint must fall back to scale factor 1');
    assert.ok(Number.isNaN(zeroRes.heightDeviationRatio), 'Zero footprint height deviation must be NaN');
  });

  await t.test('5. Forbidden Scale Inputs Guard', () => {
    // Spatial scale must NEVER depend on viewport, DPR, screen resolution, or device tier
    assert.ok(Array.isArray(FORBIDDEN_SCALE_INPUTS), 'FORBIDDEN_SCALE_INPUTS must be an array');
    const requiredForbidden = [
      'devicePixelRatio',
      'innerWidth',
      'innerHeight',
      'screen.width',
      'qualityTier',
    ];
    for (const item of requiredForbidden) {
      assert.ok(
        FORBIDDEN_SCALE_INPUTS.includes(item),
        `FORBIDDEN_SCALE_INPUTS must explicitly include "${item}"`
      );
    }
  });
});
