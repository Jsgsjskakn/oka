import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';

test('Camera Presets & Transitions Specialist: Verification & Audit', async (t) => {
  const root = path.resolve('.');
  const floorplanPath = path.join(root, 'src/components/booking/Restaurant3DFloorplan.tsx');
  const mappingPath = path.join(root, 'src/lib/constants/restaurant3DMapping.ts');
  const controllerPath = path.join(root, 'src/components/3d/DemandFrameloopController.tsx');

  assert.ok(fs.existsSync(floorplanPath), 'Restaurant3DFloorplan.tsx must exist');
  assert.ok(fs.existsSync(mappingPath), 'restaurant3DMapping.ts must exist');
  assert.ok(fs.existsSync(controllerPath), 'DemandFrameloopController.tsx must exist');

  const floorplanSrc = fs.readFileSync(floorplanPath, 'utf8');
  const mappingSrc = fs.readFileSync(mappingPath, 'utf8');
  const controllerSrc = fs.readFileSync(controllerPath, 'utf8');

  await t.test('1. Verify All 6 Camera Presets Exist & Are Fully Configured', () => {
    const requiredPresets = ['eyelevel', 'perspective', 'overview', 'topdown', 'rotunda', 'bar', 'vip'];
    for (const preset of requiredPresets) {
      assert.ok(
        floorplanSrc.includes(`${preset}:`),
        `Preset '${preset}' must be defined in CAMERA_PRESETS`
      );
    }

    // Verify FOVs are defined
    assert.ok(floorplanSrc.includes('fov: 46'), 'eyelevel/rotunda must have calibrated FOV of 46');
    assert.ok(floorplanSrc.includes('fov: 42'), 'overview must have calibrated FOV of 42');
    assert.ok(floorplanSrc.includes('fov: 40'), 'topdown must have calibrated FOV of 40');
    assert.ok(floorplanSrc.includes('fov: 48'), 'bar must have calibrated FOV of 48');
    assert.ok(floorplanSrc.includes('fov: 44'), 'vip must have calibrated FOV of 44');
  });

  await t.test('2. Coordinate & LookAt Spatial Alignment Verification', () => {
    // Eyelevel: Authentic human dining height [1.8, 1.25, 6.2] -> [0.0, 1.15, 0.0]
    assert.ok(
      floorplanSrc.includes('position: [1.8, 1.25, 6.2]') &&
        floorplanSrc.includes('target: [0.0, 1.15, 0.0]'),
      'Eyelevel preset must match human eye height looking towards dining floor'
    );

    // Overview: High-angle isometric [28.0, 24.0, 30.0] -> [0.0, 1.0, 0.0]
    assert.ok(
      floorplanSrc.includes('position: [28.0, 24.0, 30.0]') &&
        floorplanSrc.includes('target: [0.0, 1.0, 0.0]'),
      'Overview preset must provide isometric view covering entire restaurant interior'
    );

    // Topdown: True plan view [0.0, 36.0, 1.85] -> [0.0, 0.0, 0.0]
    assert.ok(
      floorplanSrc.includes('position: [0.0, 36.0, 1.85]') &&
        floorplanSrc.includes('target: [0.0, 0.0, 0.0]'),
      'Topdown preset must point directly down at origin from Y=36m'
    );

    // Rotunda: Centerpiece fountain & chandelier [0.0, 3.5, 8.2] -> [0.0, 1.2, -0.6]
    assert.ok(
      floorplanSrc.includes('position: [0.0, 3.5, 8.2]') &&
        floorplanSrc.includes('target: [0.0, 1.2, -0.6]'),
      'Rotunda preset must aim at Grand Rotunda centerpiece'
    );

    // Bar: Cocktail lounge perspective [-5.0, 3.6, 6.2] -> [-11.0, 1.2, 0.0]
    assert.ok(
      floorplanSrc.includes('position: [-5.0, 3.6, 6.2]') &&
        floorplanSrc.includes('target: [-11.0, 1.2, 0.0]'),
      'Bar preset must frame the west cocktail bar'
    );

    // VIP: North royal suites [0.0, 5.8, 22.0] -> [0.0, 1.5, 13.5]
    assert.ok(
      floorplanSrc.includes('position: [0.0, 5.8, 22.0]') &&
        floorplanSrc.includes('target: [0.0, 1.5, 13.5]'),
      'VIP preset must aim at the northern VIP suites at Z=13.5m'
    );
  });

  await t.test('3. Camera Animation Loop & Damping Verification', () => {
    // Damping implementation using THREE.MathUtils.damp
    assert.ok(
      controllerSrc.includes('THREE.MathUtils.damp(camera.position.x, targetPos.x, lambda, clampedDelta)') &&
        controllerSrc.includes('THREE.MathUtils.damp(camera.position.y, targetPos.y, lambda, clampedDelta)') &&
        controllerSrc.includes('THREE.MathUtils.damp(camera.position.z, targetPos.z, lambda, clampedDelta)'),
      'Controller must damp camera.position using THREE.MathUtils.damp'
    );

    assert.ok(
      controllerSrc.includes('THREE.MathUtils.damp(controls.target.x, targetLook.x, lambda, clampedDelta)') &&
        controllerSrc.includes('THREE.MathUtils.damp(controls.target.y, targetLook.y, lambda, clampedDelta)') &&
        controllerSrc.includes('THREE.MathUtils.damp(controls.target.z, targetLook.z, lambda, clampedDelta)'),
      'Controller must damp controls.target using THREE.MathUtils.damp'
    );

    // FOV Damping and projection matrix update
    assert.ok(
      controllerSrc.includes('perspCam.fov = THREE.MathUtils.damp(perspCam.fov, target.fov, lambda, clampedDelta)') &&
        controllerSrc.includes('perspCam.updateProjectionMatrix()'),
      'Controller must damp camera.fov and update projection matrix'
    );
  });

  await t.test('4. Reduced Motion Instant Snapping Verification', () => {
    // Checks prefersReducedMotion and passes dampingLambda: 999
    assert.ok(
      floorplanSrc.includes('quality.prefersReducedMotion'),
      'handleSwitchPreset must check quality.prefersReducedMotion'
    );
    assert.ok(
      floorplanSrc.includes('dampingLambda: 999'),
      'handleSwitchPreset must set dampingLambda: 999 for reduced motion'
    );

    // Controller handles lambda >= 900 by snapping instantly in frame 1 without multi-frame gliding
    assert.ok(
      controllerSrc.includes('if (lambda >= 900)'),
      'Controller must detect reduced motion high lambda and snap instantly'
    );
    assert.ok(
      controllerSrc.includes('camera.position.copy(targetPos)'),
      'Controller must copy exact targetPos immediately'
    );
  });

  await t.test('5. Clean Transition Cancellation & Override', () => {
    // User manual interaction cancels active camera glide
    assert.ok(
      controllerSrc.includes('handleStart') &&
        controllerSrc.includes('cancelTransition()'),
      'User dragging OrbitControls must cancel active camera glide immediately'
    );

    // TargetCamera state updates create fresh object references
    assert.ok(
      floorplanSrc.includes('setTargetCamera({\n          ...target,') ||
        floorplanSrc.includes('setTargetCamera({') && floorplanSrc.includes('...target'),
      'handleSwitchPreset must clone target to guarantee fresh object reference and avoid React bailout'
    );

    // Reset Camera button
    assert.ok(
      floorplanSrc.includes('RotateCcw') &&
        floorplanSrc.includes("title=\"Reset Camera Orientation\"") &&
        floorplanSrc.includes("handleSwitchPreset('eyelevel')"),
      'Reset Camera Orientation button must use RotateCcw icon and reset to eyelevel'
    );
  });

  await t.test('6. Normal and Fullscreen Mode Preset Usability', () => {
    // Normal mode & Fullscreen mode both render the presets header
    assert.ok(
      floorplanSrc.includes("viewMode === 'eyelevel'") &&
        floorplanSrc.includes("viewMode === 'perspective'") &&
        floorplanSrc.includes("viewMode === 'rotunda'") &&
        floorplanSrc.includes("viewMode === 'bar'") &&
        floorplanSrc.includes("viewMode === 'vip'") &&
        floorplanSrc.includes("viewMode === 'topdown'"),
      'All 6 presets must have active viewMode states'
    );

    // Focus on table in Fullscreen dock
    assert.ok(
      floorplanSrc.includes('focusOnTable') &&
        floorplanSrc.includes('handleSelectTable'),
      'Floorplan must provide focusOnTable for table tracking in both normal and fullscreen modes'
    );
  });

  await t.test('7. Mathematical Simulation: Damp Formula Verification', () => {
    // Verify mathematical behavior of MathUtils.damp:
    // With normal damping lambda = 5.5, dt = 0.016:
    const normalLambda = 5.5;
    const dt = 0.016;
    const startPos = new THREE.Vector3(1.8, 1.25, 6.2);
    const targetPos = new THREE.Vector3(28.0, 24.0, 30.0);

    // After 1 frame with normal lambda:
    const frame1X = THREE.MathUtils.damp(startPos.x, targetPos.x, normalLambda, dt);
    assert.ok(frame1X > startPos.x && frame1X < targetPos.x, 'Normal damping must glide smoothly');

    // With reduced motion lambda = 999, dt = 0.016:
    const reducedLambda = 999;
    const snapX = THREE.MathUtils.damp(startPos.x, targetPos.x, reducedLambda, dt);
    assert.ok(
      Math.abs(snapX - targetPos.x) < 0.0001,
      'Reduced motion lambda 999 must mathematically snap to target in single frame'
    );
  });
});
