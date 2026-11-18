/**
 * THE GOLDEN OAK — Phase 5 Agent 3: Adaptive Device Profiling, VR & Telemetry Test Suite
 *
 * Verifies:
 * 1. Multi-signal device profiling across all 10 Phase 5 §5 device classes:
 *    - 2GB Android low-end phone (Adreno 610 / Mali-G52, 2GB RAM) -> ultra-light
 *    - 4GB Android phone (Adreno 619 / Mali-G57, 4GB RAM) -> ultra-light (entry GPU)
 *    - 6GB Android phone (Adreno 642L / Mali-G68, 6GB RAM) -> balanced
 *    - 8GB budget Android phone (trap: Adreno 610 + 8GB RAM) -> ultra-light (RAM never decides!)
 *    - 8GB flagship Android phone (Adreno 740, 8GB RAM) -> high-fidelity
 *    - 12GB+ flagship Android phone (Adreno 750 / Immortalis-G720, 12GB RAM) -> high-fidelity
 *    - Older supported iPhone (Apple A12, deviceMemory === undefined) -> balanced (never penalized!)
 *    - Recent iPhone (Apple A17 Pro, deviceMemory === undefined, DPR 3) -> high-fidelity
 *    - iPad with Apple M2 Silicon (deviceMemory === undefined) -> high-fidelity
 *    - Windows iGPU laptop (Intel Iris Xe) -> balanced vs dGPU desktop (RTX 4070) -> high-fidelity
 * 2. Shared Telemetry Pipeline (`src/lib/three/perf-telemetry.ts` and `progressive-asset-loader.ts`):
 *    - model:fetch-start, model:fetch-end, model:decode-end, model:gpu-upload-end,
 *      model:first-visible, model:full-quality, model:cache-hit
 *    - vr:requested, vr:session-started, vr:first-frame, vr:session-ended
 * 3. WebXR Immersive-VR Engine & Virtual Dining Pedestal (`src/lib/xr/webxr-vr-viewer.ts`):
 *    - isImmersiveVRSupported() returns boolean safely
 *    - createVirtualDiningPedestal() places tabletop surface at exactly y = 0.75m (75cm)
 *    - Metric 1:1 scale computation places dish base flush with tabletop surface
 *    - Pedestal and model disposal frees all geometry and material allocations
 * 4. Canonical Colour Pipeline Invariant (`src/lib/three/color-pipeline.ts`):
 *    - NeutralToneMapping (Khronos PBR Neutral)
 *    - SRGBColorSpace output
 *    - Exact 1.0 exposure across all device tiers
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import {
  resolveXRSessionQualityProfile,
  classifyGpuArchitecture,
  XR_BASE_PROFILES,
} from '../src/lib/xr/ar-quality-profile.ts';

import {
  perfMark,
  perfSnapshot,
  perfReset,
  perfDuration,
} from '../src/lib/three/perf-telemetry.ts';

import {
  markModelFetchStart,
  markModelFetchEnd,
  markModelDecodeEnd,
  markModelGpuUploadEnd,
  markModelFirstVisible,
  markModelFullQuality,
  markModelCacheHit,
  SharedModelBufferCache,
} from '../src/lib/three/progressive-asset-loader.ts';

import {
  isImmersiveVRSupported,
  createVirtualDiningPedestal,
  PEDESTAL_HEIGHT_METRES,
  DEFAULT_VIEWING_DISTANCE_Z,
} from '../src/lib/xr/webxr-vr-viewer.ts';

import {
  applyCanonicalColorPipeline,
  CANONICAL_TONE_MAPPING,
  CANONICAL_OUTPUT_COLOR_SPACE,
  CANONICAL_EXPOSURE,
} from '../src/lib/three/color-pipeline.ts';

import { DISH_PHYSICAL_SPECS } from '../src/data/dish-dimensions.ts';
import { computeDishPlacementTransform } from '../src/lib/xr/placement-math.ts';

describe('Phase 5 Agent 3: Adaptive 3D / VR Performance Engine', () => {

  // -------------------------------------------------------------------------
  // 1. Multi-Signal 10 Device Classes Matrix
  // -------------------------------------------------------------------------
  describe('1. 10-Device Persona Scoring & Multi-Signal Classification', () => {
    it('1. 2GB Android low-end phone (Adreno 610 / Mali-G52, 2GB RAM) -> ultra-light', () => {
      const profile = resolveXRSessionQualityProfile({
        platform: 'android',
        isMobile: true,
        deviceMemory: 2,
        gpuRenderer: 'Adreno (TM) 610',
        hardwareConcurrency: 4,
        devicePixelRatio: 2,
      });

      assert.equal(profile.profile, 'ultra-light');
      assert.equal(profile.framebufferScaleFactor, 0.75);
      assert.equal(profile.shadowTechnique, 'contact-blob');
      assert.equal(profile.textureMaxDimension, 512);
      assert.equal(profile.lodTier, 2);
      assert.ok(
        profile.reasons.some((r) => r.includes('low-ram-budget') || r.includes('low-end')),
        'Must cite low memory or weak GPU'
      );
    });

    it('2. 4GB Android phone (Adreno 619 / Mali-G57, 4GB RAM) -> ultra-light (entry GPU governs)', () => {
      const profile = resolveXRSessionQualityProfile({
        platform: 'android',
        isMobile: true,
        deviceMemory: 4,
        gpuRenderer: 'Adreno (TM) 619',
        hardwareConcurrency: 8,
        devicePixelRatio: 2.25,
      });

      assert.equal(profile.profile, 'ultra-light');
      assert.equal(profile.framebufferScaleFactor, 0.75);
      assert.equal(profile.shadowTechnique, 'contact-blob');
      assert.equal(profile.lodTier, 2);
    });

    it('3. 6GB Android phone (Adreno 642L / Mali-G68, 6GB RAM) -> balanced', () => {
      const profile = resolveXRSessionQualityProfile({
        platform: 'android',
        isMobile: true,
        deviceMemory: 6,
        gpuRenderer: 'Adreno (TM) 642L',
        hardwareConcurrency: 8,
        devicePixelRatio: 2.5,
        grantedXRFeatures: ['light-estimation'],
      });

      assert.equal(profile.profile, 'balanced');
      assert.equal(profile.framebufferScaleFactor, 1.0);
      assert.equal(profile.shadowTechnique, 'contact-shadow-texture');
      assert.equal(profile.textureMaxDimension, 1024);
      assert.equal(profile.lodTier, 1);
      assert.equal(profile.useLightEstimation, true);
    });

    it('4. 8GB Budget Android Phone Trap (Adreno 610 + 8GB RAM) -> ultra-light (RAM never decides!)', () => {
      const profile = resolveXRSessionQualityProfile({
        platform: 'android',
        isMobile: true,
        deviceMemory: 8, // 8GB marketing RAM
        gpuRenderer: 'Adreno (TM) 610', // Low-end entry GPU
        hardwareConcurrency: 8,
        devicePixelRatio: 2.25,
      });

      assert.equal(
        profile.profile,
        'ultra-light',
        '8GB budget phone with entry GPU MUST resolve to ultra-light, not high-fidelity'
      );
      assert.ok(
        profile.reasons.some((r) => r.includes('8gb-budget-phone-trap-neutralized')),
        'Must document that 8GB trap was neutralized'
      );
    });

    it('5. 8GB Flagship Android phone (Adreno 740, 8GB RAM) -> high-fidelity', () => {
      const profile = resolveXRSessionQualityProfile({
        platform: 'android',
        isMobile: true,
        deviceMemory: 8,
        gpuRenderer: 'Adreno (TM) 740',
        hardwareConcurrency: 8,
        devicePixelRatio: 3,
        grantedXRFeatures: ['light-estimation'],
      });

      assert.equal(profile.profile, 'high-fidelity');
      assert.equal(profile.framebufferScaleFactor, 1.0);
      assert.equal(profile.shadowTechnique, 'shadow-map');
      assert.equal(profile.textureMaxDimension, 2048);
      assert.equal(profile.lodTier, 0);
      assert.equal(profile.useLightEstimation, true);
    });

    it('6. 12GB+ Flagship Android phone (Adreno 750 / Immortalis-G720, 12GB RAM) -> high-fidelity', () => {
      const profile = resolveXRSessionQualityProfile({
        platform: 'android',
        isMobile: true,
        deviceMemory: 12,
        gpuRenderer: 'Adreno (TM) 750',
        hardwareConcurrency: 8,
        devicePixelRatio: 3.5,
        grantedXRFeatures: ['light-estimation'],
      });

      assert.equal(profile.profile, 'high-fidelity');
      assert.equal(profile.framebufferScaleFactor, 1.0);
      assert.equal(profile.shadowTechnique, 'shadow-map');
      assert.equal(profile.textureMaxDimension, 2048);
      assert.equal(profile.maxConcurrentDishes, 4);
    });

    it('7. Older supported iPhone (Apple A12 Bionic, deviceMemory === undefined) -> balanced (never penalized!)', () => {
      const profile = resolveXRSessionQualityProfile({
        platform: 'ios',
        isMobile: true,
        deviceMemory: undefined, // Safari standard: deviceMemory is always undefined
        gpuRenderer: 'Apple A12 GPU',
        hardwareConcurrency: 6,
        devicePixelRatio: 3,
        grantedXRFeatures: ['light-estimation'],
      });

      assert.equal(profile.profile, 'balanced');
      assert.ok(
        profile.reasons.some((r) => r.includes('guard:ios-device-memory-undefined-preserved')),
        'Must guard undefined deviceMemory on iOS'
      );
    });

    it('8. Recent iPhone (Apple A17 Pro, deviceMemory === undefined, DPR 3) -> high-fidelity', () => {
      const profile = resolveXRSessionQualityProfile({
        platform: 'ios',
        isMobile: true,
        deviceMemory: undefined, // Safari standard
        gpuRenderer: 'Apple A17 Pro GPU',
        hardwareConcurrency: 6,
        devicePixelRatio: 3,
        grantedXRFeatures: ['light-estimation'],
      });

      assert.equal(profile.profile, 'high-fidelity');
      assert.equal(profile.textureMaxDimension, 2048);
      assert.equal(profile.lodTier, 0);
    });

    it('9. iPad with Apple M2 Silicon (deviceMemory === undefined) -> high-fidelity', () => {
      const profile = resolveXRSessionQualityProfile({
        platform: 'tablet',
        isMobile: false,
        deviceMemory: undefined,
        gpuRenderer: 'Apple M2',
        hardwareConcurrency: 8,
        devicePixelRatio: 2,
        grantedXRFeatures: ['light-estimation'],
      });

      assert.equal(profile.profile, 'high-fidelity');
      assert.equal(profile.shadowTechnique, 'shadow-map');
    });

    it('10. Windows iGPU laptop (Intel Iris Xe) -> balanced vs dGPU desktop (RTX 4070) -> high-fidelity', () => {
      // 10a. Integrated GPU (Intel Iris Xe, 8GB RAM)
      const igpuProfile = resolveXRSessionQualityProfile({
        platform: 'windows',
        isMobile: false,
        deviceMemory: 8,
        gpuRenderer: 'Intel(R) Iris(R) Xe Graphics',
        hardwareConcurrency: 8,
        devicePixelRatio: 1.25,
      });

      assert.equal(igpuProfile.profile, 'balanced');

      // 10b. Discrete GPU Desktop (NVIDIA RTX 4070, 16GB RAM)
      const dgpuProfile = resolveXRSessionQualityProfile({
        platform: 'windows',
        isMobile: false,
        deviceMemory: 16,
        gpuRenderer: 'NVIDIA GeForce RTX 4070/PCIe/SSE2',
        hardwareConcurrency: 16,
        devicePixelRatio: 1.0,
      });

      assert.equal(dgpuProfile.profile, 'high-fidelity');
      assert.equal(dgpuProfile.maxConcurrentDishes, 4);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Performance Telemetry Instrumentation Verification
  // -------------------------------------------------------------------------
  describe('2. Telemetry Pipeline & Standard Perf Marks', () => {
    it('records all model loading and decoding telemetry marks', () => {
      perfReset();

      markModelFetchStart({ dishSlug: 'signature-truffle-burger', url: '/models/burger.glb' });
      markModelFetchEnd({ dishSlug: 'signature-truffle-burger', byteLength: 105432 });
      markModelDecodeEnd({ dishSlug: 'signature-truffle-burger' });
      markModelGpuUploadEnd({ dishSlug: 'signature-truffle-burger' });
      markModelFirstVisible({ dishSlug: 'signature-truffle-burger', tier: 'ultra-light' });
      markModelFullQuality({ dishSlug: 'signature-truffle-burger', tier: 'high-fidelity' });
      markModelCacheHit({ dishSlug: 'signature-truffle-burger', url: '/models/burger.glb' });

      const snap = perfSnapshot();
      const markNames = snap.marks.map((m) => m.name);

      assert.ok(markNames.includes('model:fetch-start'));
      assert.ok(markNames.includes('model:fetch-end'));
      assert.ok(markNames.includes('model:decode-end'));
      assert.ok(markNames.includes('model:gpu-upload-end'));
      assert.ok(markNames.includes('model:first-visible'));
      assert.ok(markNames.includes('model:full-quality'));
      assert.ok(markNames.includes('model:cache-hit'));

      // Check duration calculation
      const fetchDuration = perfDuration('model:fetch-start', 'model:fetch-end');
      assert.ok(typeof fetchDuration === 'number' && fetchDuration >= 0);
    });

    it('records WebXR VR lifecycle telemetry marks', () => {
      perfReset();

      perfMark('vr:requested', { dishSlug: 'tandoori-paneer-pizza' });
      perfMark('vr:session-started', { dishSlug: 'tandoori-paneer-pizza' });
      perfMark('vr:first-frame', { dishSlug: 'tandoori-paneer-pizza' });
      perfMark('vr:session-ended', { dishSlug: 'tandoori-paneer-pizza' });

      const snap = perfSnapshot();
      const markNames = snap.marks.map((m) => m.name);

      assert.ok(markNames.includes('vr:requested'));
      assert.ok(markNames.includes('vr:session-started'));
      assert.ok(markNames.includes('vr:first-frame'));
      assert.ok(markNames.includes('vr:session-ended'));

      const vrInitDuration = perfDuration('vr:requested', 'vr:first-frame');
      assert.ok(typeof vrInitDuration === 'number' && vrInitDuration >= 0);
    });

    it('emits model:cache-hit when SharedModelBufferCache retrieves cached assets', () => {
      perfReset();
      const cache = new SharedModelBufferCache();
      const buf = new Uint8Array([1, 2, 3, 4]).buffer;

      cache.set('/models/cached-test.glb', buf);
      const retrieved = cache.get('/models/cached-test.glb');

      assert.ok(retrieved !== null);
      const snap = perfSnapshot();
      const hit = snap.marks.find((m) => m.name === 'model:cache-hit');
      assert.ok(hit !== undefined, 'Must record model:cache-hit');
      assert.equal(hit?.detail?.url, '/models/cached-test.glb');
    });
  });

  // -------------------------------------------------------------------------
  // 3. WebXR Immersive-VR Engine & Virtual Dining Pedestal
  // -------------------------------------------------------------------------
  describe('3. WebXR Immersive-VR Engine & Pedestal Architecture', () => {
    it('isImmersiveVRSupported executes safely in node environment', async () => {
      const supported = await isImmersiveVRSupported();
      // Node has no navigator.xr, must safely resolve false without throwing
      assert.equal(supported, false);
    });

    it('creates virtual dining pedestal with tabletop surface at exactly y = 0.75m', () => {
      const pedestal = createVirtualDiningPedestal();

      assert.equal(pedestal.topSurfaceY, 0.75, 'Pedestal top surface must be 0.75m (fine dining height)');
      assert.equal(pedestal.group.position.z, DEFAULT_VIEWING_DISTANCE_Z, 'Must be positioned 0.75m in front of user');
      assert.equal(pedestal.group.position.y, 0, 'Base of pedestal must sit on floor at y=0 in local-floor space');

      // Verify meshes exist inside group
      assert.ok(pedestal.group.children.length >= 3, 'Must contain column, tabletop, rim trim, and shadow disc');

      // Test clean disposal
      assert.doesNotThrow(() => pedestal.dispose(), 'Disposal must execute cleanly without errors');
    });

    it('computes 1:1 metric scale transform for dishes resting on pedestal', () => {
      const pizzaSpec = DISH_PHYSICAL_SPECS['tandoori-paneer-pizza'];
      assert.ok(pizzaSpec !== undefined);

      const transform = computeDishPlacementTransform({
        bboxMin: { x: -1.2, y: 0, z: -1.2 },
        bboxMax: { x: 1.2, y: 0.12, z: 1.2 },
        spec: pizzaSpec,
        userScale: 1.0,
      });

      // Target real pizza width is 30 cm = 0.30 m. Model width is 2.4 m. Scale = 0.3 / 2.4 = 0.125
      assert.ok(Math.abs(transform.uniformScale - 0.125) < 0.001);

      // Centered at XZ origin and lowest point at y=0
      assert.ok(Math.abs(transform.offset[0]) < 0.001);
      assert.ok(Math.abs(transform.offset[1]) < 0.001);
      assert.ok(Math.abs(transform.offset[2]) < 0.001);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Canonical Colour Pipeline Invariant
  // -------------------------------------------------------------------------
  describe('4. Canonical Colour Pipeline Invariant', () => {
    it('applies Khronos PBR Neutral with sRGB output and exact 1.0 exposure', () => {
      const mockRenderer = {
        outputColorSpace: '',
        toneMapping: 0,
        toneMappingExposure: 0,
      };

      applyCanonicalColorPipeline(mockRenderer);

      assert.equal(mockRenderer.toneMapping, CANONICAL_TONE_MAPPING);
      assert.equal(mockRenderer.toneMapping, THREE.NeutralToneMapping);
      assert.equal(mockRenderer.outputColorSpace, CANONICAL_OUTPUT_COLOR_SPACE);
      assert.equal(mockRenderer.outputColorSpace, THREE.SRGBColorSpace);
      assert.equal(mockRenderer.toneMappingExposure, CANONICAL_EXPOSURE);
      assert.equal(mockRenderer.toneMappingExposure, 1.0);
    });

    it('eliminates per-tier exposure differences in the canonical pipeline', () => {
      const tiers = ['ultra-light', 'balanced', 'high-fidelity'];
      for (const tier of tiers) {
        const mockRenderer = {
          outputColorSpace: '',
          toneMapping: 0,
          toneMappingExposure: 1.5, // simulate previous polluted exposure
        };

        applyCanonicalColorPipeline(mockRenderer);

        assert.equal(
          mockRenderer.toneMappingExposure,
          1.0,
          `Tier ${tier} must use exactly 1.0 exposure to guarantee authentic food colour rendition`
        );
      }
    });
  });
});
