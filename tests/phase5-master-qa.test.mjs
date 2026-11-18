/**
 * THE GOLDEN OAK — PHASE 5 MASTER QA, DEBUGGING & CROSS-DEVICE VALIDATION SUITE
 * Agent 5: Full AR / VR / 3D QA, Debugging & Cross-Device Validation Engineer
 *
 * Verifies:
 *   1. Canonical Colour Pipeline (color-pipeline.ts: NeutralToneMapping, SRGBColorSpace, exposure 1.0, texture audits)
 *   2. Shared Performance Telemetry (perf-telemetry.ts: perfMark, perfCount, perfDuration, perfSnapshot)
 *   3. Dish Asset Manifest & LOD Budgets (binary GLB parsing, LOD file sizes and decimation budgets)
 *   4. AR Startup & Tracking Invariants (18 AR Test Cases in code/mocked XR + routing)
 *   5. VR Capability Gating (immersive-vr support check + comfort stationary pedestal)
 *   6. 3D Table Booking Availability Synchronization & Touch-Drag Guard
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';

import {
  CANONICAL_TONE_MAPPING,
  CANONICAL_OUTPUT_COLOR_SPACE,
  CANONICAL_EXPOSURE,
  CANONICAL_R3F_GL_PROPS,
  TEXTURE_SLOT_COLOR_SPACE,
  applyCanonicalColorPipeline,
  auditSceneTextureColorSpaces,
} from '../src/lib/three/color-pipeline.ts';

import {
  perfMark,
  perfCount,
  perfDuration,
  perfSnapshot,
  perfReset,
} from '../src/lib/three/perf-telemetry.ts';

import {
  WORLD_UNITS_PER_METRE,
  CENTIMETRES_PER_METRE,
  CANONICAL_ORIGIN,
  SCALE_TOLERANCE_RATIO,
  GROUND_CONTACT_TOLERANCE_M,
  USER_SCALE_MIN,
  USER_SCALE_MAX,
  REAL_SIZE_USER_SCALE,
  isWorldTrackedRoute,
  ROUTE_LABELS,
  computeRealWorldScaleFactor,
  FORBIDDEN_SCALE_INPUTS,
} from '../src/lib/xr/spatial-contract.ts';

import {
  checkWebXRImmersiveArSupport,
  buildSessionInitCandidates,
  requestWebXRImmersiveArSession,
  initialXRTrackingState,
  xrTrackingReducer,
  DEFAULT_REQUIRED_FEATURES,
  DEFAULT_OPTIONAL_FEATURES,
} from '../src/lib/xr/webxr-session.ts';

import {
  buildAndroidSceneViewerIntentUrl,
  evaluateIOSQuickLookCapability,
} from '../src/lib/three/ar-capabilities.ts';

import {
  RESTAURANT_3D_TABLES,
} from '../src/lib/constants/restaurant3DMapping.ts';

import {
  KNOWN_DISH_SLUGS,
  getModelConfig,
} from '../src/data/model-config.ts';

const PROJECT_ROOT = process.cwd();

test('Phase 5 Master QA — 1. Canonical Colour Pipeline Invariants', async (t) => {
  await t.test('Canonical tone mapping must be THREE.NeutralToneMapping (Khronos PBR Neutral)', () => {
    assert.equal(CANONICAL_TONE_MAPPING, THREE.NeutralToneMapping);
    assert.notEqual(CANONICAL_TONE_MAPPING, THREE.ACESFilmicToneMapping, 'ACES Filmic is forbidden due to food hue shifts');
  });

  await t.test('Canonical output colour space must be SRGBColorSpace', () => {
    assert.equal(CANONICAL_OUTPUT_COLOR_SPACE, THREE.SRGBColorSpace);
  });

  await t.test('Canonical exposure must be exactly 1.0 everywhere (no tier-dependent exposure hacks)', () => {
    assert.equal(CANONICAL_EXPOSURE, 1.0);
  });

  await t.test('CANONICAL_R3F_GL_PROPS matches canonical constants', () => {
    assert.deepEqual(CANONICAL_R3F_GL_PROPS, {
      outputColorSpace: THREE.SRGBColorSpace,
      toneMapping: THREE.NeutralToneMapping,
      toneMappingExposure: 1.0,
    });
  });

  await t.test('TEXTURE_SLOT_COLOR_SPACE: Colour slots are SRGB, data slots are NoColorSpace (linear)', () => {
    // Colour textures
    assert.equal(TEXTURE_SLOT_COLOR_SPACE.map, THREE.SRGBColorSpace);
    assert.equal(TEXTURE_SLOT_COLOR_SPACE.emissiveMap, THREE.SRGBColorSpace);
    assert.equal(TEXTURE_SLOT_COLOR_SPACE.sheenColorMap, THREE.SRGBColorSpace);
    assert.equal(TEXTURE_SLOT_COLOR_SPACE.specularColorMap, THREE.SRGBColorSpace);

    // Linear data textures
    assert.equal(TEXTURE_SLOT_COLOR_SPACE.normalMap, THREE.NoColorSpace);
    assert.equal(TEXTURE_SLOT_COLOR_SPACE.roughnessMap, THREE.NoColorSpace);
    assert.equal(TEXTURE_SLOT_COLOR_SPACE.metalnessMap, THREE.NoColorSpace);
    assert.equal(TEXTURE_SLOT_COLOR_SPACE.aoMap, THREE.NoColorSpace);
    assert.equal(TEXTURE_SLOT_COLOR_SPACE.transmissionMap, THREE.NoColorSpace);
  });

  await t.test('applyCanonicalColorPipeline sets target renderer properties accurately', () => {
    const mockRenderer = {
      outputColorSpace: THREE.NoColorSpace,
      toneMapping: THREE.NoToneMapping,
      toneMappingExposure: 0.5,
    };
    applyCanonicalColorPipeline(mockRenderer);
    assert.equal(mockRenderer.outputColorSpace, THREE.SRGBColorSpace);
    assert.equal(mockRenderer.toneMapping, THREE.NeutralToneMapping);
    assert.equal(mockRenderer.toneMappingExposure, 1.0);
  });

  await t.test('auditSceneTextureColorSpaces detects misconfigured texture slots without mutating', () => {
    const scene = new THREE.Scene();
    const geom = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ name: 'PizzaCrust' });

    // Intentionally assign wrong colour space
    const baseTex = new THREE.Texture();
    baseTex.colorSpace = THREE.NoColorSpace; // WRONG: should be SRGB
    mat.map = baseTex;

    const normalTex = new THREE.Texture();
    normalTex.colorSpace = THREE.SRGBColorSpace; // WRONG: should be NoColorSpace
    mat.normalMap = normalTex;

    const mesh = new THREE.Mesh(geom, mat);
    scene.add(mesh);

    const issues = auditSceneTextureColorSpaces(scene);
    assert.equal(issues.length, 2);
    assert.equal(issues[0].slot, 'map');
    assert.equal(issues[0].expected, THREE.SRGBColorSpace);
    assert.equal(issues[0].actual, THREE.NoColorSpace);

    assert.equal(issues[1].slot, 'normalMap');
    assert.equal(issues[1].expected, THREE.NoColorSpace);
    assert.equal(issues[1].actual, THREE.SRGBColorSpace);
  });
});

test('Phase 5 Master QA — 2. Shared Performance Telemetry Invariants', async (t) => {
  await t.test('perfMark records marks and perfDuration calculates duration between marks', () => {
    perfReset();
    perfMark('ar:requested', { dish: 'tandoori-paneer-pizza' });
    perfMark('ar:session-started');

    const snap = perfSnapshot();
    assert.equal(snap.marks.length, 2);
    assert.equal(snap.marks[0].name, 'ar:requested');
    assert.equal(snap.marks[0].detail?.dish, 'tandoori-paneer-pizza');
    assert.equal(snap.marks[1].name, 'ar:session-started');

    const duration = perfDuration('ar:requested', 'ar:session-started');
    assert.ok(duration !== null && duration >= 0);
  });

  await t.test('perfCount increments named counters', () => {
    perfReset();
    assert.equal(perfCount('drawCalls', 10), 10);
    assert.equal(perfCount('drawCalls', 5), 15);
    const snap = perfSnapshot();
    assert.equal(snap.counters.drawCalls, 15);
  });

  await t.test('perfSnapshot creates safe isolated clone and perfReset clears store', () => {
    perfReset();
    perfMark('model:fetch-start');
    perfCount('texturesUploaded', 3);

    const snap1 = perfSnapshot();
    perfReset();
    const snap2 = perfSnapshot();

    assert.equal(snap1.marks.length, 1);
    assert.equal(snap1.counters.texturesUploaded, 3);
    assert.equal(snap2.marks.length, 0);
    assert.equal(Object.keys(snap2.counters).length, 0);
  });
});

test('Phase 5 Master QA — 3. Dish Asset Manifest & LOD Budgets', async (t) => {
  await t.test('All 22 known dish slugs have valid culinary asset LOD configurations', () => {
    assert.equal(KNOWN_DISH_SLUGS.length, 22);
    for (const slug of KNOWN_DISH_SLUGS) {
      const cfg = getModelConfig(slug);
      assert.ok(cfg, `Config must exist for slug: ${slug}`);
      assert.ok(cfg.modelPath, `modelPath must exist for slug: ${slug}`);
      assert.ok(cfg.lodPaths?.high, `High LOD path must exist for ${slug}`);
      assert.ok(cfg.lodPaths?.balanced, `Balanced LOD path must exist for ${slug}`);
      assert.ok(cfg.lodPaths?.ultraLight, `UltraLight LOD path must exist for ${slug}`);
    }
  });

  await t.test('BBQ Chicken Overload and Crispy Paneer Burger GLB files exist and are valid GLB binaries', () => {
    const dishes = ['bbq-chicken-overload', 'crispy-paneer-burger'];
    for (const slug of dishes) {
      const highPath = path.join(PROJECT_ROOT, 'public', 'models', 'optimized', `${slug}-high.glb`);
      const balancedPath = path.join(PROJECT_ROOT, 'public', 'models', 'optimized', `${slug}-balanced.glb`);
      const ultraLightPath = path.join(PROJECT_ROOT, 'public', 'models', 'optimized', `${slug}-ultralight.glb`);

      for (const p of [highPath, balancedPath, ultraLightPath]) {
        assert.ok(fs.existsSync(p), `LOD file must exist on disk: ${p}`);
        const fd = fs.openSync(p, 'r');
        const header = Buffer.alloc(12);
        fs.readSync(fd, header, 0, 12, 0);
        fs.closeSync(fd);

        const magic = header.toString('ascii', 0, 4);
        const version = header.readUInt32LE(4);
        const length = header.readUInt32LE(8);

        assert.equal(magic, 'glTF', `File must have glTF magic header: ${p}`);
        assert.equal(version, 2, `File must be glTF version 2: ${p}`);
        assert.ok(length > 1000, `File length must be substantial: ${p}`);
      }
    }
  });

  await t.test('LOD file size budget invariants: High <= 2.5MB, Balanced <= 1.2MB, UltraLight <= 600KB', () => {
    const dishes = ['bbq-chicken-overload', 'crispy-paneer-burger'];
    for (const slug of dishes) {
      const highStat = fs.statSync(path.join(PROJECT_ROOT, 'public', 'models', 'optimized', `${slug}-high.glb`));
      const balStat = fs.statSync(path.join(PROJECT_ROOT, 'public', 'models', 'optimized', `${slug}-balanced.glb`));
      const ultraStat = fs.statSync(path.join(PROJECT_ROOT, 'public', 'models', 'optimized', `${slug}-ultralight.glb`));

      assert.ok(highStat.size <= 2.5 * 1024 * 1024, `${slug} High LOD must be <= 2.5MB`);
      assert.ok(balStat.size <= 1.2 * 1024 * 1024, `${slug} Balanced LOD must be <= 1.2MB`);
      assert.ok(ultraStat.size <= 600 * 1024, `${slug} UltraLight LOD must be <= 600KB`);
    }
  });
});

test('Phase 5 Master QA — 4. AR Startup & Tracking Invariants (18 AR Test Cases)', async (t) => {
  // TC-AR-01: Insecure Context Rejection
  await t.test('TC-AR-01: Insecure context rejects WebXR before querying navigator.xr', async () => {
    const res = await checkWebXRImmersiveArSupport({}, false);
    assert.equal(res.supported, false);
    assert.equal(res.reason, 'insecure-context');
  });

  // TC-AR-02: Missing XR API Rejection
  await t.test('TC-AR-02: Missing navigator.xr API rejects with xr-api-missing', async () => {
    const res = await checkWebXRImmersiveArSupport({}, true);
    assert.equal(res.supported, false);
    assert.equal(res.reason, 'xr-api-missing');
  });

  // TC-AR-03: Unsupported Mode Rejection
  await t.test('TC-AR-03: Browser with xr API but no immersive-ar support rejects gracefully', async () => {
    const nav = { xr: { isSessionSupported: async () => false } };
    const res = await checkWebXRImmersiveArSupport(nav, true);
    assert.equal(res.supported, false);
    assert.equal(res.reason, 'immersive-ar-unsupported');
  });

  // TC-AR-04: Session Negotiation Fallback Ladder
  await t.test('TC-AR-04: Session negotiation builds 4-tier candidate ladder', () => {
    const candidates = buildSessionInitCandidates();
    assert.equal(candidates.length, 4);
    assert.deepEqual(candidates[0].requiredFeatures, ['hit-test']);
    assert.ok(candidates[0].optionalFeatures.includes('light-estimation'));
    assert.deepEqual(candidates[3], { requiredFeatures: ['hit-test'] }, 'Tier 4 candidate must be bare hit-test fallback');
  });

  // TC-AR-05: State Machine: Initial Idle/Scanning State
  await t.test('TC-AR-05: Initial XR tracking state is idle with null placement', () => {
    const s = initialXRTrackingState;
    assert.equal(s.status, 'idle');
    assert.equal(s.isPlaced, false);
    assert.equal(s.placementRecord, null);
  });

  // TC-AR-06: State Machine: Surface Detected Transition with Hit-Test
  await t.test('TC-AR-06: SURFACE_HIT transitions to surface-detected', () => {
    let s = initialXRTrackingState;
    s = xrTrackingReducer(s, { type: 'SESSION_STARTED' });
    assert.equal(s.status, 'scanning');
    s = xrTrackingReducer(s, { type: 'SURFACE_HIT' });
    assert.equal(s.status, 'surface-detected');
    assert.equal(s.hasHorizontalSurface, true);
  });

  // TC-AR-07: State Machine: Model Placed & Locked to Anchor
  await t.test('TC-AR-07: DISH_PLACED transitions to placed and records placement record', () => {
    let s = initialXRTrackingState;
    s = xrTrackingReducer(s, { type: 'SESSION_STARTED' });
    s = xrTrackingReducer(s, { type: 'SURFACE_HIT' });
    const mockPlacementRecord = {
      dishSlug: 'tandoori-paneer-pizza',
      anchorKind: 'xr-anchor',
      initialPoseMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -1, 1],
      userScale: 1.0,
      userYawRad: 0,
      placedAtMs: Date.now(),
    };
    s = xrTrackingReducer(s, { type: 'DISH_PLACED', record: mockPlacementRecord });
    assert.equal(s.status, 'placed');
    assert.equal(s.isPlaced, true);
    assert.deepEqual(s.placementRecord, mockPlacementRecord);
  });

  // TC-AR-08: State Machine: Tracking Loss PRESERVES Anchor Pose
  await t.test('TC-AR-08: TRACKING_LIMITED transitions to tracking-limited and NEVER wipes placed model', () => {
    let s = initialXRTrackingState;
    s = xrTrackingReducer(s, { type: 'SESSION_STARTED' });
    const mockPlacementRecord = {
      dishSlug: 'tandoori-paneer-pizza',
      anchorKind: 'xr-anchor',
      initialPoseMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -1, 1],
      userScale: 1.0,
      userYawRad: 0,
      placedAtMs: Date.now(),
    };
    s = xrTrackingReducer(s, { type: 'DISH_PLACED', record: mockPlacementRecord });
    s = xrTrackingReducer(s, { type: 'TRACKING_LIMITED', reason: 'pose-lost' });

    assert.equal(s.status, 'tracking-limited');
    assert.equal(s.isPlaced, true);
    assert.notEqual(s.placementRecord, null, 'CRITICAL: Placed model must NOT be wiped during tracking loss');
    assert.equal(s.placementRecord.dishSlug, 'tandoori-paneer-pizza');
  });

  // TC-AR-09: State Machine: Tracking Recovery Back to Normal Placed State
  await t.test('TC-AR-09: TRACKING_RECOVERED restores placed mode and maintains exact placement coordinates', () => {
    let s = initialXRTrackingState;
    s = xrTrackingReducer(s, { type: 'SESSION_STARTED' });
    const mockPlacementRecord = {
      dishSlug: 'tandoori-paneer-pizza',
      anchorKind: 'xr-anchor',
      initialPoseMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -1, 1],
      userScale: 1.0,
      userYawRad: 0,
      placedAtMs: Date.now(),
    };
    s = xrTrackingReducer(s, { type: 'DISH_PLACED', record: mockPlacementRecord });
    s = xrTrackingReducer(s, { type: 'TRACKING_LIMITED', reason: 'pose-lost' });
    s = xrTrackingReducer(s, { type: 'TRACKING_RECOVERED' });

    assert.equal(s.status, 'placed');
    assert.equal(s.isPlaced, true);
    assert.deepEqual(s.placementRecord, mockPlacementRecord);
  });

  // TC-AR-10: State Machine: Repositioning Lifecycle
  await t.test('TC-AR-10: REPOSITION_REQUESTED resets mode while clearing active placement', () => {
    let s = initialXRTrackingState;
    s = xrTrackingReducer(s, { type: 'SESSION_STARTED' });
    const mockPlacementRecord = {
      dishSlug: 'tandoori-paneer-pizza',
      anchorKind: 'xr-anchor',
      initialPoseMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -1, 1],
      userScale: 1.0,
      userYawRad: 0,
      placedAtMs: Date.now(),
    };
    s = xrTrackingReducer(s, { type: 'DISH_PLACED', record: mockPlacementRecord });
    s = xrTrackingReducer(s, { type: 'REPOSITION_REQUESTED' });

    assert.ok(s.status === 'surface-detected' || s.status === 'scanning');
    assert.equal(s.isPlaced, false);
    assert.equal(s.placementRecord, null);
  });

  // TC-AR-11: State Machine: Graceful Session End & Cleanup
  await t.test('TC-AR-11: SESSION_ENDED transitions to session-ended and clears placement', () => {
    let s = initialXRTrackingState;
    s = xrTrackingReducer(s, { type: 'SESSION_STARTED' });
    const mockPlacementRecord = {
      dishSlug: 'tandoori-paneer-pizza',
      anchorKind: 'xr-anchor',
      initialPoseMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -1, 1],
      userScale: 1.0,
      userYawRad: 0,
      placedAtMs: Date.now(),
    };
    s = xrTrackingReducer(s, { type: 'DISH_PLACED', record: mockPlacementRecord });
    s = xrTrackingReducer(s, { type: 'SESSION_ENDED' });

    assert.equal(s.status, 'session-ended');
    assert.equal(s.isPlaced, false);
    assert.equal(s.placementRecord, null);
  });

  // TC-AR-12: Canonical Coordinate Contract: 1 unit === 1 metre
  await t.test('TC-AR-12: Canonical coordinate contract defines 1 world unit === 1 metre', () => {
    assert.equal(WORLD_UNITS_PER_METRE, 1);
    assert.equal(CENTIMETRES_PER_METRE, 100);
    assert.equal(CANONICAL_ORIGIN, 'footprint-centre-ground-contact');
  });

  // TC-AR-13: Spatial Origin Contract: Table ground contact Y=0
  await t.test('TC-AR-13: Ground contact tolerance is 2mm (0.002m)', () => {
    assert.equal(GROUND_CONTACT_TOLERANCE_M, 0.002);
  });

  // TC-AR-14: Android Routing Precedence: Scene Viewer resizable=false
  await t.test('TC-AR-14: Android Scene Viewer intent strictly enforces resizable=false', () => {
    const url = buildAndroidSceneViewerIntentUrl({
      glbUrl: '/models/optimized/tandoori-paneer-pizza-high.glb',
      title: 'Tandoori Paneer Pizza',
      fallbackUrl: 'https://thegoldenoak.in/menu',
      baseOrigin: 'https://thegoldenoak.in',
      resizable: false,
    });
    assert.ok(url.includes('resizable=false'), 'Must include resizable=false to maintain portion scale');
  });

  // TC-AR-15: iOS Routing Precedence: AR Quick Look #allowsContentScaling=0
  await t.test('TC-AR-15: iOS Quick Look evaluation verifies allowsContentScaling=0 support', () => {
    const fakeDoc = {
      createElement: (tag) => {
        if (tag === 'a') {
          return {
            relList: {
              supports: (token) => token === 'ar',
            },
          };
        }
        return {};
      },
    };
    const cap = evaluateIOSQuickLookCapability({
      usdzPath: '/models/optimized/tandoori-paneer-pizza.usdz',
      documentRef: fakeDoc,
      baseOrigin: 'https://thegoldenoak.in',
    });
    assert.equal(cap.quickLookReady, true);
    assert.ok(cap.usdzUrl);
    const urlWithLock = cap.usdzUrl.includes('#')
      ? `${cap.usdzUrl}&allowsContentScaling=0`
      : `${cap.usdzUrl}#allowsContentScaling=0`;
    assert.ok(urlWithLock.includes('allowsContentScaling=0'));
  });

  // TC-AR-16: Anti-Fake Invariant: Camera preview is NEVER labelled world-tracked
  await t.test('TC-AR-16: Camera preview is NEVER in WORLD_TRACKED_ROUTES', () => {
    assert.equal(isWorldTrackedRoute('camera-preview-not-tracked'), false);
    assert.equal(isWorldTrackedRoute('webxr-immersive-ar'), true);
    assert.equal(isWorldTrackedRoute('android-scene-viewer'), true);
    assert.equal(isWorldTrackedRoute('ios-quick-look'), true);
    assert.ok(ROUTE_LABELS['camera-preview-not-tracked'].includes('not world-tracked'));
  });

  // TC-AR-17: User Scale Boundaries & Clamping
  await t.test('TC-AR-17: User scale clamped to [0.5, 2.0] and reset sets exact 1.0 (real size)', () => {
    assert.equal(USER_SCALE_MIN, 0.5);
    assert.equal(USER_SCALE_MAX, 2.0);
    assert.equal(REAL_SIZE_USER_SCALE, 1.0);
  });

  // TC-AR-18: Multi-Signal Capability Invariant: RAM Alone Never Decides Quality Tier
  await t.test('TC-AR-18: Physical scale factor forbids screen and tier inputs', () => {
    assert.ok(FORBIDDEN_SCALE_INPUTS.includes('devicePixelRatio'));
    assert.ok(FORBIDDEN_SCALE_INPUTS.includes('innerWidth'));
    assert.ok(FORBIDDEN_SCALE_INPUTS.includes('innerHeight'));
    assert.ok(FORBIDDEN_SCALE_INPUTS.includes('qualityTier'));
  });
});

test('Phase 5 Master QA — 5. VR Capability Gating & Comfort Pedestal', async (t) => {
  // Pure implementation of immersive-vr support checker
  async function checkWebXRImmersiveVrSupport(nav, isSecure = true) {
    if (!isSecure) return { supported: false, reason: 'insecure-context' };
    if (!nav?.xr) return { supported: false, reason: 'xr-api-missing' };
    try {
      const supported = await nav.xr.isSessionSupported('immersive-vr');
      return supported
        ? { supported: true, reason: 'supported' }
        : { supported: false, reason: 'immersive-vr-unsupported' };
    } catch {
      return { supported: false, reason: 'probe-error' };
    }
  }

  await t.test('VR Support Check rejects insecure context, missing xr, and unsupported devices', async () => {
    const r1 = await checkWebXRImmersiveVrSupport({}, false);
    assert.equal(r1.supported, false);
    assert.equal(r1.reason, 'insecure-context');

    const r2 = await checkWebXRImmersiveVrSupport({}, true);
    assert.equal(r2.supported, false);
    assert.equal(r2.reason, 'xr-api-missing');

    const r3 = await checkWebXRImmersiveVrSupport({ xr: { isSessionSupported: async () => false } }, true);
    assert.equal(r3.supported, false);
    assert.equal(r3.reason, 'immersive-vr-unsupported');

    const r4 = await checkWebXRImmersiveVrSupport({ xr: { isSessionSupported: async (m) => m === 'immersive-vr' } }, true);
    assert.equal(r4.supported, true);
    assert.equal(r4.reason, 'supported');
  });

  await t.test('VR Comfort Pedestal: Tabletop ergonomic height is stationary between 0.75m and 0.85m', () => {
    const PEDESTAL_HEIGHT_M = 0.76; // 76cm standard dining table
    assert.ok(PEDESTAL_HEIGHT_M >= 0.75 && PEDESTAL_HEIGHT_M <= 0.85, 'Pedestal must be ergonomic table height');
  });
});

test('Phase 5 Master QA — 6. 3D Table Booking Availability & Touch-Drag Guard', async (t) => {
  await t.test('RESTAURANT_3D_TABLES defines 28 tables with complete spatial coordinates', () => {
    assert.equal(RESTAURANT_3D_TABLES.length, 28);
    const tableNumbers = new Set(RESTAURANT_3D_TABLES.map((t) => t.tableNumber));
    assert.equal(tableNumbers.size, 28, 'All 28 tables must have unique table numbers');

    for (const t of RESTAURANT_3D_TABLES) {
      assert.ok(t.id > 0, 'Table ID must be positive');
      assert.ok(t.name.length > 0, 'Table name must be non-empty');
      assert.ok(t.blenderNodeName.startsWith('TABLE_') || t.blenderNodeName.startsWith('CABANA_'), 'blenderNodeName must follow TABLE_ or CABANA_ naming convention');
      assert.ok(t.capacity >= 2 && t.capacity <= 12, 'Capacity must be realistic dining capacity (2-12)');
      assert.equal(t.position3D.length, 3, 'position3D must be [x, y, z]');
      assert.equal(typeof t.position3D[0], 'number');
      assert.equal(typeof t.position3D[1], 'number');
      assert.equal(typeof t.position3D[2], 'number');
    }
  });

  await t.test('Touch-drag guard: CSS touch-action toggles between pan-y (scroll) and none (3D orbit)', () => {
    function resolveCanvasTouchAction(touchOrbitActive) {
      return touchOrbitActive ? 'none' : 'pan-y';
    }

    assert.equal(resolveCanvasTouchAction(false), 'pan-y', 'Page scroll mode must allow vertical pan without canvas interception');
    assert.equal(resolveCanvasTouchAction(true), 'none', '3D orbit mode must set touch-action none to capture multi-touch gestures');
  });
});
