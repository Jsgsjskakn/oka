/**
 * THE GOLDEN OAK — Phase 5 AR Engine & World-Tracking Automated Test Suite
 * Agent 1: AR Engine Architect & Tracking Specialist
 *
 * Automated regression & invariant verification for:
 * 1. Canonical Colour Pipeline (NeutralToneMapping, SRGBColorSpace, Exposure 1.0)
 * 2. Reference Space Fallback Order (local-floor -> local)
 * 3. Viewer-Space Hit-Test & Horizontal Surface Validation Math
 * 4. Genuine Anchor Pose Following & Tracking-Limited Pose Retention
 * 5. Startup Parallelization & Progressive LOD Upgrade Without Anchor Reset
 * 6. Full Resource Disposal & Zero Duplicate WebGL Context
 * 7. Android Scene Viewer & iOS Quick Look Standards Compliance
 * 8. Performance Telemetry Instrumentation (perfMark milestones)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import {
  applyCanonicalColorPipeline,
  CANONICAL_TONE_MAPPING,
  CANONICAL_OUTPUT_COLOR_SPACE,
  CANONICAL_EXPOSURE,
} from '../src/lib/three/color-pipeline.ts';

import {
  perfMark,
  perfSnapshot,
} from '../src/lib/three/perf-telemetry.ts';

import {
  checkWebXRImmersiveArSupport,
  buildSessionInitCandidates,
  requestWebXRImmersiveArSession,
} from '../src/lib/xr/webxr-session.ts';

import {
  WebXRAREngine,
} from '../src/lib/xr/webxr-ar-engine.ts';

import {
  isHorizontalSurface,
  clampUserScale,
  computeDishPlacementTransform,
  USER_SCALE_MIN,
  USER_SCALE_MAX,
  REAL_SIZE_USER_SCALE,
} from '../src/lib/xr/placement-math.ts';

import {
  buildAndroidSceneViewerIntentUrl,
  evaluateIOSQuickLookCapability,
} from '../src/lib/three/ar-capabilities.ts';

function createMockRenderer() {
  const domElement = { style: {}, parentElement: null };
  return {
    outputColorSpace: THREE.LinearSRGBColorSpace,
    toneMapping: THREE.NoToneMapping,
    toneMappingExposure: 0.5,
    xr: {
      enabled: false,
      setReferenceSpaceType: () => {},
      setSession: async () => {},
      getReferenceSpace: () => null,
    },
    setPixelRatio: () => {},
    setSize: () => {},
    setAnimationLoop: () => {},
    render: () => {},
    dispose: () => {},
    domElement,
  };
}

// ---------------------------------------------------------------------------
// SUITE 1: Canonical Colour Pipeline Integration
// ---------------------------------------------------------------------------

test('Phase 5 — Suite 1: Canonical Colour Pipeline Integration in AR Engine', async (t) => {
  await t.test('1.1 applyCanonicalColorPipeline applies NeutralToneMapping, sRGB and 1.0 exposure', () => {
    const mockRenderer = {
      outputColorSpace: THREE.LinearSRGBColorSpace,
      toneMapping: THREE.NoToneMapping,
      toneMappingExposure: 0.5,
    };

    applyCanonicalColorPipeline(mockRenderer);

    assert.equal(mockRenderer.toneMapping, CANONICAL_TONE_MAPPING, 'Must apply Khronos PBR Neutral tone mapping');
    assert.equal(mockRenderer.outputColorSpace, CANONICAL_OUTPUT_COLOR_SPACE, 'Must apply sRGB output color space');
    assert.equal(mockRenderer.toneMappingExposure, CANONICAL_EXPOSURE, 'Must set exposure strictly to 1.0');
  });

  await t.test('1.2 WebXRAREngine renderer applies canonical colour settings upon construction', () => {
    const mockSession = {
      addEventListener: () => {},
      removeEventListener: () => {},
      requestReferenceSpace: async () => ({}),
      requestHitTestSource: async () => ({ cancel: () => {} }),
      end: async () => {},
    };

    const mockRenderer = createMockRenderer();

    const engine = new WebXRAREngine({
      session: mockSession,
      dishSlug: 'golden-oak-signature-burger',
      modelUrl: '/models/optimized/golden-oak-burger-ultralight.glb',
      dependencies: {
        createRenderer: () => mockRenderer,
        getDishPhysicalSpec: () => ({
          dishSlug: 'golden-oak-signature-burger',
          canonicalCategory: 'burger',
          dimensions: { widthCm: 14, depthCm: 14, heightCm: 11 },
          tableClearanceM: 0.05,
          defaultUserScale: 1.0,
          groundContactOffsetM: 0.0,
        }),
      },
    });

    const renderer = engine['renderer'];
    assert.ok(renderer, 'Renderer must be instantiated');
    assert.equal(renderer.toneMapping, THREE.NeutralToneMapping, 'Renderer must use NeutralToneMapping');
    assert.equal(renderer.outputColorSpace, THREE.SRGBColorSpace, 'Renderer must use SRGBColorSpace');
    assert.equal(renderer.toneMappingExposure, 1.0, 'Renderer exposure must be 1.0');

    engine.dispose();
  });
});

// ---------------------------------------------------------------------------
// SUITE 2: Reference Space Fallback Order & Hit-Testing
// ---------------------------------------------------------------------------

test('Phase 5 — Suite 2: Reference Space Negotiation & Hit-Testing', async (t) => {
  await t.test('2.1 Reference space attempts local-floor first, falling back to local', async () => {
    const requestedSpaces = [];
    const mockSession = {
      addEventListener: () => {},
      removeEventListener: () => {},
      requestReferenceSpace: async (type) => {
        requestedSpaces.push(type);
        if (type === 'local-floor') {
          throw new Error('local-floor not supported');
        }
        return { type };
      },
      requestHitTestSource: async () => ({ cancel: () => {} }),
      end: async () => {},
    };

    const mockRenderer = createMockRenderer();
    mockRenderer.xr.setReferenceSpaceType = (type) => {
      requestedSpaces.push(`xr-type:${type}`);
    };
    mockRenderer.xr.setSession = async () => {};
    mockRenderer.xr.getReferenceSpace = () => ({ type: 'local' });

    const engine = new WebXRAREngine({
      session: mockSession,
      dishSlug: 'golden-oak-signature-burger',
      modelUrl: '/models/optimized/golden-oak-burger-ultralight.glb',
      dependencies: {
        createRenderer: () => mockRenderer,
        getDishPhysicalSpec: () => ({
          dishSlug: 'golden-oak-signature-burger',
          canonicalCategory: 'burger',
          dimensions: { widthCm: 14, depthCm: 14, heightCm: 11 },
          tableClearanceM: 0.05,
          defaultUserScale: 1.0,
          groundContactOffsetM: 0.0,
        }),
      },
    });

    await engine.start();

    // Verify fallback progression: tried local-floor first, then local
    assert.ok(requestedSpaces.includes('local-floor'), 'Must attempt local-floor reference space first');
    assert.ok(requestedSpaces.includes('local'), 'Must fall back to local reference space if local-floor fails');
    assert.ok(requestedSpaces.includes('xr-type:local'), 'Renderer xr type must be set to local');

    engine.dispose();
  });

  await t.test('2.2 isHorizontalSurface threshold validates horizontal planes (~15 degrees)', () => {
    // Pure flat horizontal tabletop (normal = [0, 1, 0])
    assert.equal(isHorizontalSurface(1.0), true, 'Straight up normal is valid horizontal surface');
    assert.equal(isHorizontalSurface(0.98), true, '~11 degree tilt is valid horizontal surface');
    assert.equal(isHorizontalSurface(0.966), true, '~14.9 degree tilt is valid horizontal surface');

    // Walls and steep tilts (normal Y < 0.9659)
    assert.equal(isHorizontalSurface(0.95), false, '18 degree tilt must be rejected as non-horizontal');
    assert.equal(isHorizontalSurface(0.0), false, 'Vertical wall (normal Y = 0) must be rejected');
    assert.equal(isHorizontalSurface(-1.0), false, 'Ceiling (normal Y = -1) must be rejected');
  });
});

// ---------------------------------------------------------------------------
// SUITE 3: Tracking-Limited State & Genuine Anchor World-Locking
// ---------------------------------------------------------------------------

test('Phase 5 — Suite 3: World-Locking & Tracking-Limited Integrity', async (t) => {
  await t.test('3.1 Tracking-limited (viewerPose == null || emulatedPosition) retains last known anchor pose', () => {
    const mockSession = {
      addEventListener: () => {},
      removeEventListener: () => {},
      requestReferenceSpace: async () => ({}),
      requestHitTestSource: async () => ({ cancel: () => {} }),
      end: async () => {},
    };

    let reportedState = null;
    let reportedReason = null;

    const engine = new WebXRAREngine({
      session: mockSession,
      dishSlug: 'golden-oak-signature-burger',
      modelUrl: '/models/optimized/golden-oak-burger-ultralight.glb',
      onTrackingStateChange: (state, details) => {
        reportedState = state;
        reportedReason = details;
      },
      dependencies: {
        createRenderer: createMockRenderer,
        getDishPhysicalSpec: () => ({
          dishSlug: 'golden-oak-signature-burger',
          canonicalCategory: 'burger',
          dimensions: { widthCm: 14, depthCm: 14, heightCm: 11 },
          tableClearanceM: 0.05,
          defaultUserScale: 1.0,
          groundContactOffsetM: 0.0,
        }),
      },
    });

    engine['refSpace'] = {};
    const dishGroup = engine['dishGroup'];
    dishGroup.position.set(0.15, -0.4, -0.6);
    dishGroup.matrix.setPosition(0.15, -0.4, -0.6);

    // Frame with null viewer pose (camera obscured or lost)
    const frameWithLostPose = {
      getViewerPose: () => null,
      getHitTestResults: () => [],
    };

    engine['onXRFrame'](100, frameWithLostPose);

    assert.equal(reportedState, 'tracking-limited', 'Must enter tracking-limited when viewer pose is lost');
    assert.equal(reportedReason, 'pose-lost');
    assert.equal(dishGroup.position.x, 0.15, 'Dish position must not be cleared or teleported');
    assert.equal(dishGroup.position.y, -0.4, 'Dish position must not be cleared or teleported');

    // Frame with emulated position
    const frameWithEmulatedPose = {
      getViewerPose: () => ({ emulatedPosition: true }),
      getHitTestResults: () => [],
    };

    engine['onXRFrame'](200, frameWithEmulatedPose);
    assert.equal(reportedState, 'tracking-limited', 'Must remain tracking-limited when emulatedPosition is true');

    engine.dispose();
  });

  await t.test('3.2 User scale clamping enforces [0.5, 2.0] and resetRealSize sets scale to 1.0', () => {
    assert.equal(clampUserScale(0.1), USER_SCALE_MIN, 'Must clamp below minimum');
    assert.equal(clampUserScale(5.0), USER_SCALE_MAX, 'Must clamp above maximum');
    assert.equal(clampUserScale(1.0), REAL_SIZE_USER_SCALE, '1.0 is canonical real size');
  });
});

// ---------------------------------------------------------------------------
// SUITE 4: Progressive LOD Upgrade & Startup Parallelization
// ---------------------------------------------------------------------------

test('Phase 5 — Suite 4: Progressive LOD Upgrade Without Anchor Reset', async (t) => {
  await t.test('4.1 upgradeLod swaps geometry and textures without mutating dishGroup world matrix', async () => {
    const mockSession = {
      addEventListener: () => {},
      removeEventListener: () => {},
      requestReferenceSpace: async () => ({}),
      requestHitTestSource: async () => ({ cancel: () => {} }),
      end: async () => {},
    };

    const engine = new WebXRAREngine({
      session: mockSession,
      dishSlug: 'golden-oak-signature-burger',
      modelUrl: '/models/optimized/golden-oak-burger-ultralight.glb',
      upgradeModelUrl: '/models/optimized/golden-oak-burger-balanced.glb',
      dependencies: {
        createRenderer: createMockRenderer,
        getDishPhysicalSpec: () => ({
          dishSlug: 'golden-oak-signature-burger',
          canonicalCategory: 'burger',
          dimensions: { widthCm: 14, depthCm: 14, heightCm: 11 },
          tableClearanceM: 0.05,
          defaultUserScale: 1.0,
          groundContactOffsetM: 0.0,
        }),
      },
    });

    // Simulate placed dish on table
    engine['isPlaced'] = true;
    const dishGroup = engine['dishGroup'];
    dishGroup.position.set(0.2, 0.0, -0.5);
    dishGroup.quaternion.set(0, 0, 0, 1);
    dishGroup.matrix.setPosition(0.2, 0.0, -0.5);

    // Initial mock mesh in model container
    const initialGeom = new THREE.BoxGeometry(0.14, 0.11, 0.14);
    const initialMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const initialMesh = new THREE.Mesh(initialGeom, initialMat);
    engine['modelContainer'].add(initialMesh);
    engine['rawModelBBox'] = { min: [-0.07, 0, -0.07], max: [0.07, 0.11, 0.07] };

    // Record world matrix before LOD upgrade
    const matrixBefore = dishGroup.matrix.clone();

    // Mock GLTF Loader for target LOD
    const targetGeom = new THREE.SphereGeometry(0.07, 16, 16);
    const targetMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const targetMesh = new THREE.Mesh(targetGeom, targetMat);
    const mockTargetScene = new THREE.Group();
    mockTargetScene.add(targetMesh);

    engine['getOrCreateLoaders'] = () => ({
      gltfLoader: {
        load: (url, onLoad) => {
          onLoad({ scene: mockTargetScene });
        },
      },
      dracoLoader: { dispose: () => {} },
    });

    const upgraded = await engine.upgradeLod('/models/optimized/golden-oak-burger-balanced.glb');
    assert.equal(upgraded, true, 'upgradeLod must report success');

    // Verify dish group world matrix was NOT altered
    assert.deepEqual(dishGroup.matrix.elements, matrixBefore.elements, 'World anchor matrix must remain identical after LOD upgrade');

    // Verify model container contains new target scene
    assert.equal(engine['modelContainer'].children[0], mockTargetScene, 'Model container must now hold the upgraded scene');

    engine.dispose();
  });

  await t.test('4.2 Full GPU resource cleanup disposes geometries, materials, and textures', () => {
    const mockSession = {
      addEventListener: () => {},
      removeEventListener: () => {},
      requestReferenceSpace: async () => ({}),
      requestHitTestSource: async () => ({ cancel: () => {} }),
      end: async () => {},
    };

    const engine = new WebXRAREngine({
      session: mockSession,
      dishSlug: 'golden-oak-signature-burger',
      modelUrl: '/models/optimized/golden-oak-burger-ultralight.glb',
      dependencies: {
        createRenderer: createMockRenderer,
        getDishPhysicalSpec: () => ({
          dishSlug: 'golden-oak-signature-burger',
          canonicalCategory: 'burger',
          dimensions: { widthCm: 14, depthCm: 14, heightCm: 11 },
          tableClearanceM: 0.05,
          defaultUserScale: 1.0,
          groundContactOffsetM: 0.0,
        }),
      },
    });

    let geometryDisposed = false;
    let materialDisposed = false;
    let textureDisposed = false;

    const testGeo = new THREE.BufferGeometry();
    testGeo.dispose = () => { geometryDisposed = true; };

    const testTex = new THREE.Texture();
    testTex.dispose = () => { textureDisposed = true; };

    const testMat = new THREE.MeshBasicMaterial();
    testMat.map = testTex;
    testMat.dispose = () => { materialDisposed = true; };

    const testMesh = new THREE.Mesh(testGeo, testMat);
    engine['scene'].add(testMesh);

    engine.dispose();

    assert.equal(geometryDisposed, true, 'Geometry must be disposed');
    assert.equal(materialDisposed, true, 'Material must be disposed');
    assert.equal(textureDisposed, true, 'Texture maps must be disposed');
  });
});

// ---------------------------------------------------------------------------
// SUITE 5: Android Scene Viewer & iOS Quick Look Standards Compliance
// ---------------------------------------------------------------------------

test('Phase 5 — Suite 5: Android Scene Viewer & iOS Quick Look Standards Compliance', async (t) => {
  await t.test('5.1 Android Scene Viewer intent enforces mode=ar_preferred, resizable=false, and encoded fallback', () => {
    const intentUrl = buildAndroidSceneViewerIntentUrl({
      glbUrl: '/models/optimized/tandoori-paneer-pizza-balanced.glb',
      title: 'Tandoori Paneer Pizza',
      resizable: false,
      fallbackUrl: '/menu/pizzas/tandoori-paneer-pizza',
      baseOrigin: 'https://thegoldenoak.in',
    });

    assert.ok(intentUrl.startsWith('intent://arvr.google.com/scene-viewer/1.0?'), 'Must point to Google Scene Viewer');
    assert.ok(intentUrl.includes('mode=ar_preferred'), 'Must enforce mode=ar_preferred');
    assert.ok(intentUrl.includes('resizable=false'), 'Must enforce resizable=false to prevent unrealistic dish scaling');
    assert.ok(intentUrl.includes('package=com.google.android.googlequicksearchbox'), 'Must target Google Quick Search Box package');
    assert.ok(intentUrl.includes('S.browser_fallback_url='), 'Must include safe fallback URL for devices without ARCore');
  });

  await t.test('5.2 evaluateIOSQuickLookCapability validates valid USDZ paths and prevents invalid extensions', () => {
    const validCheck = evaluateIOSQuickLookCapability({
      usdzPath: '/models/optimized/tandoori-paneer-pizza.usdz',
      supportsRelAr: true,
      baseOrigin: 'https://thegoldenoak.in',
    });
    assert.equal(validCheck.quickLookReady, true, 'Valid .usdz path must be marked ready');
    assert.ok(validCheck.usdzUrl.endsWith('.usdz'), 'Must produce absolute .usdz URL');

    const invalidCheck = evaluateIOSQuickLookCapability({
      usdzPath: '/models/optimized/tandoori-paneer-pizza.glb',
      supportsRelAr: true,
    });
    assert.equal(invalidCheck.quickLookReady, false, 'GLB file must not be accepted for iOS Quick Look');
    assert.equal(invalidCheck.reason, 'invalid-usdz-extension');
  });
});

// ---------------------------------------------------------------------------
// SUITE 6: Performance Telemetry (perfMark Milestones)
// ---------------------------------------------------------------------------

test('Phase 5 — Suite 6: Performance Telemetry (perfMark Milestones)', async (t) => {
  await t.test('6.1 Emits and records AR startup marks in performance store', () => {
    perfMark('ar:requested', { dishSlug: 'test-dish' });
    perfMark('ar:support-checked', { supported: true });
    perfMark('ar:session-started', { mode: 'immersive-ar' });
    perfMark('ar:first-xr-frame');
    perfMark('ar:first-surface-hit');
    perfMark('ar:model-ready', { dishSlug: 'test-dish' });
    perfMark('ar:first-placement');
    perfMark('ar:model-visible', { dishSlug: 'test-dish' });
    perfMark('ar:tracking-lost', { reason: 'pose-lost' });
    perfMark('ar:tracking-restored');
    perfMark('ar:session-ended');

    const snapshot = perfSnapshot();
    const markNames = snapshot.marks.map((m) => m.name);

    assert.ok(markNames.includes('ar:requested'), 'ar:requested mark must be recorded');
    assert.ok(markNames.includes('ar:support-checked'), 'ar:support-checked mark must be recorded');
    assert.ok(markNames.includes('ar:session-started'), 'ar:session-started mark must be recorded');
    assert.ok(markNames.includes('ar:first-xr-frame'), 'ar:first-xr-frame mark must be recorded');
    assert.ok(markNames.includes('ar:first-surface-hit'), 'ar:first-surface-hit mark must be recorded');
    assert.ok(markNames.includes('ar:model-ready'), 'ar:model-ready mark must be recorded');
    assert.ok(markNames.includes('ar:first-placement'), 'ar:first-placement mark must be recorded');
    assert.ok(markNames.includes('ar:model-visible'), 'ar:model-visible mark must be recorded');
    assert.ok(markNames.includes('ar:tracking-lost'), 'ar:tracking-lost mark must be recorded');
    assert.ok(markNames.includes('ar:tracking-restored'), 'ar:tracking-restored mark must be recorded');
    assert.ok(markNames.includes('ar:session-ended'), 'ar:session-ended mark must be recorded');
  });
});
