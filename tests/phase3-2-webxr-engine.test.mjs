/**
 * THE GOLDEN OAK — WebXR AR Placement & Math Unit Test Suite
 * Sub-Agent 1: AR Tracking & Spatial Architect (Phase 3.2)
 *
 * Verifies:
 * 1. Horizontal surface normal filtering (cos 15° threshold).
 * 2. User scale clamping [0.5, 2.0] and 100% real size reset.
 * 3. Physical dish specification retrieval & portion dimensions.
 * 4. computeDishPlacementTransform footprint and ground contact math.
 * 5. Residual ground contact evaluation within 2mm tolerance.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isHorizontalSurface,
  clampUserScale,
  computeDishPlacementTransform,
  isGroundContactWithinTolerance,
  computeGroundContactResidual,
} from '../src/lib/xr/placement-math.ts';

import { getDishPhysicalSpec } from '../src/data/dish-dimensions.ts';

import {
  USER_SCALE_MIN,
  USER_SCALE_MAX,
  REAL_SIZE_USER_SCALE,
  HORIZONTAL_SURFACE_MIN_NORMAL_Y,
} from '../src/lib/xr/spatial-contract.ts';

test('Phase 3.2 — WebXR AR Engine Subsystem Tests', async (t) => {
  await t.test('1. Horizontal Surface Validation Threshold', () => {
    // Normal facing directly up (+Y = 1.0) must be accepted
    assert.equal(isHorizontalSurface(1.0), true);

    // Normal at cos(10 deg) ~ 0.9848 must be accepted
    assert.equal(isHorizontalSurface(Math.cos((10 * Math.PI) / 180)), true);

    // Normal at exactly 15 deg threshold ~ 0.9659 must be accepted
    assert.equal(isHorizontalSurface(HORIZONTAL_SURFACE_MIN_NORMAL_Y), true);

    // Normal at 20 deg tilt (~0.9396) must be rejected as non-horizontal
    assert.equal(isHorizontalSurface(Math.cos((20 * Math.PI) / 180)), false);

    // Vertical wall (+X = 1, +Y = 0) must be rejected
    assert.equal(isHorizontalSurface(0.0), false);

    // Downward ceiling (-Y = -1) must be rejected
    assert.equal(isHorizontalSurface(-1.0), false);
  });

  await t.test('2. User Scale Clamping & Real-Size Reset Bounds', () => {
    // Standard 100% real size
    assert.equal(clampUserScale(1.0), REAL_SIZE_USER_SCALE);

    // User scales down to 0.5x minimum
    assert.equal(clampUserScale(0.5), USER_SCALE_MIN);

    // User attempts to pinch smaller than 0.5x -> clamped to 0.5x
    assert.equal(clampUserScale(0.2), USER_SCALE_MIN);

    // User scales up to 2.0x maximum
    assert.equal(clampUserScale(2.0), USER_SCALE_MAX);

    // User attempts to zoom larger than 2.0x -> clamped to 2.0x
    assert.equal(clampUserScale(3.5), USER_SCALE_MAX);

    // Invalid / NaN / negative values reset safely to 1.0
    assert.equal(clampUserScale(Number.NaN), REAL_SIZE_USER_SCALE);
    assert.equal(clampUserScale(-0.5), REAL_SIZE_USER_SCALE);
  });

  await t.test('3. Physical Dish Specification Retrieval & Real-World Dimensions', () => {
    // Audit pizza dimensions
    const pizzaSpec = getDishPhysicalSpec('tandoori-paneer-pizza');
    assert.ok(pizzaSpec);
    assert.equal(pizzaSpec.units, 'meters');
    assert.ok(pizzaSpec.dimensions.widthCm >= 25 && pizzaSpec.dimensions.widthCm <= 35);
    assert.equal(pizzaSpec.scaleValidated, false); // Strict honesty invariant

    // Audit burger dimensions
    const burgerSpec = getDishPhysicalSpec('royal-oak-signature-burger');
    assert.ok(burgerSpec);
    assert.equal(burgerSpec.units, 'meters');
    assert.ok(burgerSpec.dimensions.widthCm >= 10 && burgerSpec.dimensions.widthCm <= 16);

    // Unknown dish fallback
    const unknownSpec = getDishPhysicalSpec('mystery-exotic-dish');
    assert.ok(unknownSpec);
    assert.equal(unknownSpec.units, 'meters');
    assert.ok(unknownSpec.dimensions.widthCm > 0);
  });

  await t.test('4. computeDishPlacementTransform Footprint & Ground Contact Math', () => {
    const spec = {
      dishId: 'test-pizza',
      dimensions: { widthCm: 30, depthCm: 30, heightCm: 4 },
      dimensionSource: 'estimated-typical-portion',
      units: 'meters',
      scaleValidated: false,
      groundContactValidated: false,
      assetVersion: '1.0.0',
    };

    // Raw model with bounding box [-0.5, 0.0, -0.5] to [0.5, 0.2, 0.5] (1.0m wide raw)
    const transform = computeDishPlacementTransform({
      bboxMin: [-0.5, 0.0, -0.5],
      bboxMax: [0.5, 0.2, 0.5],
      spec,
      userScale: 1.0,
    });

    // 30cm = 0.30m real width. Raw width = 1.0m. Expected scale = 0.30
    assert.ok(Math.abs(transform.uniformScale - 0.30) < 0.001);

    // Footprint is already centered in XZ: offset should be [0, 0, 0]
    assert.ok(Math.abs(transform.offset[0]) < 0.001);
    assert.ok(Math.abs(transform.offset[1]) < 0.001); // min y was 0.0, so offset y is 0.0
    assert.ok(Math.abs(transform.offset[2]) < 0.001);

    // Offset test: if model base min Y was -0.1, offset Y must compensate by +0.1 * scale
    const transformOffset = computeDishPlacementTransform({
      bboxMin: [-0.5, -0.1, -0.5],
      bboxMax: [0.5, 0.1, 0.5],
      spec,
      userScale: 1.0,
    });
    // offset Y should be -(-0.1) * 0.30 = +0.03
    assert.ok(Math.abs(transformOffset.offset[1] - 0.03) < 0.001);
  });

  await t.test('5. Ground Contact Residual Verification', () => {
    // 0 gap is within tolerance
    assert.equal(isGroundContactWithinTolerance(0.0), true);

    // 1mm gap is within 2mm tolerance
    assert.equal(isGroundContactWithinTolerance(0.001), true);

    // Exactly 2mm is within tolerance
    assert.equal(isGroundContactWithinTolerance(0.002), true);

    // 3mm gap exceeds 2mm tolerance
    assert.equal(isGroundContactWithinTolerance(0.003), false);

    // Residual computation
    const residual = computeGroundContactResidual(-0.1, 0.3, 0.03);
    assert.ok(Math.abs(residual) < 0.0001);
  });
});
