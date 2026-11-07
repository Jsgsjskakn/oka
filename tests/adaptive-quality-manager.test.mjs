import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  detectExtendedDeviceCapabilities,
  classifyGpuRenderer,
  resolvePreferredCompressedFormat,
  resetWebGLProbeCache,
  observeThermalPressure,
} from '../src/lib/three/device-capabilities.ts';

import {
  RENDERING_PROFILES,
  QualityManager,
  computeEffectiveQualitySettings,
  profileToLegacyTier,
  legacyTierToProfile,
  resetGlobalQualityManager,
} from '../src/lib/three/quality-manager.ts';

import {
  QUALITY_TIER_CONFIGS,
  getTierSettings,
  calculateQualityTier,
  calculateRenderingProfile,
  detectDeviceCapabilities,
} from '../src/hooks/useQualityTier.ts';

describe('Agent 2: Adaptive Quality & Multi-Signal Device Capability Architecture', () => {
  beforeEach(() => {
    resetWebGLProbeCache();
    resetGlobalQualityManager({ persistOverride: false });
  });

  // ===========================================================================
  // 1. MULTI-SIGNAL DEVICE CAPABILITY DETECTION & CLASSIFICATION
  // ===========================================================================
  describe('1. Multi-Signal Capability Detection & Android / iOS / Desktop Tiers', () => {
    it('classifies Low-end 2GB Android (Adreno 610) as low-end -> ultra-light', () => {
      const caps = detectExtendedDeviceCapabilities({
        userAgent:
          'Mozilla/5.0 (Linux; Android 12; Redmi Note 11) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36',
        devicePixelRatio: 2.25,
        viewportWidth: 360,
        viewportHeight: 800,
        hardwareConcurrency: 8,
        deviceMemory: 2,
        isTouch: true,
        webgpuAvailable: false,
        webglProbe: {
          webgl2Available: true,
          webgl1Available: true,
          gpuVendor: 'Qualcomm',
          gpuRenderer: 'Adreno (TM) 610',
          maxTextureSize: 8192,
          compressedTextures: {
            astc: true,
            etc2: true,
            etc1: true,
            s3tc: false,
            bptc: false,
            pvrtc: false,
          },
        },
      });

      assert.equal(caps.environment, 'phone');
      assert.equal(caps.platform, 'android');
      assert.equal(caps.gpuVendorFamily, 'adreno');
      assert.equal(caps.gpuTier, 'low-end');
      assert.equal(caps.logicalTier, 'low-end');
      assert.equal(caps.androidTier, 'low-end');
      assert.equal(caps.recommendedProfile, 'ultra-light');
      assert.equal(caps.ktx2Supported, true);
      assert.equal(caps.astcSupported, true);
      assert.equal(caps.etc2Supported, true);
    });

    it('PROVES RAM ALONE NEVER DECIDES: 8GB marketing-RAM Android with entry Adreno 610 / Mali-G52 stays ultra-light', () => {
      const budget8GbAdreno = detectExtendedDeviceCapabilities({
        userAgent:
          'Mozilla/5.0 (Linux; Android 13; RMX3630) AppleWebKit/537.36 Chrome/125.0.0.0 Mobile Safari/537.36',
        devicePixelRatio: 2.75,
        viewportWidth: 393,
        viewportHeight: 873,
        hardwareConcurrency: 8,
        deviceMemory: 8, // High advertised RAM!
        isTouch: true,
        webglProbe: {
          webgl2Available: true,
          gpuRenderer: 'Adreno (TM) 610',
          maxTextureSize: 8192,
          compressedTextures: { astc: true, etc2: true },
        },
      });

      assert.equal(budget8GbAdreno.gpuTier, 'low-end');
      assert.equal(
        budget8GbAdreno.recommendedProfile,
        'ultra-light',
        'Weak entry GPU must not be promoted to high-fidelity solely due to 8GB deviceMemory'
      );

      const budgetMaliG52 = detectExtendedDeviceCapabilities({
        userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-A145F) Mobile',
        devicePixelRatio: 2.5,
        viewportWidth: 384,
        viewportHeight: 854,
        hardwareConcurrency: 8,
        deviceMemory: 6,
        isTouch: true,
        webglProbe: {
          webgl2Available: true,
          gpuRenderer: 'Mali-G52 MC2',
          maxTextureSize: 8192,
          compressedTextures: { astc: true, etc2: true },
        },
      });

      assert.equal(budgetMaliG52.gpuTier, 'low-end');
      assert.equal(budgetMaliG52.androidTier, 'low-end');
      assert.equal(budgetMaliG52.recommendedProfile, 'ultra-light');
    });

    it('classifies Mid-range 6GB Android (Adreno 642L & Mali-G78) as mid-range -> balanced', () => {
      const snapdragon778G = detectExtendedDeviceCapabilities({
        userAgent:
          'Mozilla/5.0 (Linux; Android 14; SM-A528B) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36',
        devicePixelRatio: 2.625,
        viewportWidth: 412,
        viewportHeight: 915,
        hardwareConcurrency: 8,
        deviceMemory: 6,
        isTouch: true,
        webgpuAvailable: true,
        webglProbe: {
          webgl2Available: true,
          gpuRenderer: 'Adreno (TM) 642L',
          maxTextureSize: 16384,
          compressedTextures: { astc: true, etc2: true },
        },
      });

      assert.equal(snapdragon778G.environment, 'phone');
      assert.equal(snapdragon778G.platform, 'android');
      assert.equal(snapdragon778G.gpuTier, 'mid-range');
      assert.equal(snapdragon778G.logicalTier, 'mid-range');
      assert.equal(snapdragon778G.androidTier, 'mid-range');
      assert.equal(snapdragon778G.recommendedProfile, 'balanced');

      const tensorMaliG78 = detectExtendedDeviceCapabilities({
        userAgent:
          'Mozilla/5.0 (Linux; Android 14; Pixel 6a) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36',
        devicePixelRatio: 2.625,
        viewportWidth: 412,
        viewportHeight: 915,
        hardwareConcurrency: 8,
        deviceMemory: 6,
        isTouch: true,
        webglProbe: {
          webgl2Available: true,
          gpuRenderer: 'Mali-G78',
          maxTextureSize: 16384,
          compressedTextures: { astc: true, etc2: true },
        },
      });

      assert.equal(tensorMaliG78.gpuTier, 'mid-range');
      assert.equal(tensorMaliG78.androidTier, 'mid-range');
      assert.equal(tensorMaliG78.recommendedProfile, 'balanced');
    });

    it('classifies Flagship 12GB Android (Adreno 750 & Immortalis-G720) as high-end -> high-fidelity', () => {
      const galaxyS24Ultra = detectExtendedDeviceCapabilities({
        userAgent:
          'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 Chrome/127.0.0.0 Mobile Safari/537.36',
        devicePixelRatio: 3.0,
        viewportWidth: 412,
        viewportHeight: 915,
        hardwareConcurrency: 8,
        deviceMemory: 8, // Chromium clamps 12GB/16GB to 8
        isTouch: true,
        webgpuAvailable: true,
        webglProbe: {
          webgl2Available: true,
          gpuRenderer: 'Adreno (TM) 750',
          maxTextureSize: 16384,
          maxRenderbufferSize: 16384,
          compressedTextures: { astc: true, etc2: true },
        },
      });

      assert.equal(galaxyS24Ultra.environment, 'phone');
      assert.equal(galaxyS24Ultra.platform, 'android');
      assert.equal(galaxyS24Ultra.gpuTier, 'high-end');
      assert.equal(galaxyS24Ultra.logicalTier, 'high-end');
      assert.equal(galaxyS24Ultra.androidTier, 'high-end');
      assert.equal(galaxyS24Ultra.recommendedProfile, 'high-fidelity');

      const immortalisFlagship = classifyGpuRenderer('Immortalis-G720 MC12');
      assert.equal(immortalisFlagship.vendorFamily, 'immortalis');
      assert.equal(immortalisFlagship.gpuTier, 'high-end');
    });

    it('PROVES MISSING deviceMemory NEVER PENALIZES SAFARI: iPhone 15 Pro (Apple GPU, deviceMemory: undefined) -> high-fidelity', () => {
      const iphone15Pro = detectExtendedDeviceCapabilities({
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        devicePixelRatio: 3.0,
        viewportWidth: 393,
        viewportHeight: 852,
        hardwareConcurrency: 6,
        deviceMemory: undefined, // Safari NEVER exposes navigator.deviceMemory!
        isTouch: true,
        webgpuAvailable: false,
        webglProbe: {
          webgl2Available: true,
          gpuVendor: 'Apple Inc.',
          gpuRenderer: 'Apple GPU',
          maxTextureSize: 16384,
          maxRenderbufferSize: 16384,
          compressedTextures: { astc: true, etc2: true, pvrtc: true },
        },
      });

      assert.equal(iphone15Pro.environment, 'phone');
      assert.equal(iphone15Pro.platform, 'ios');
      assert.equal(iphone15Pro.androidTier, null);
      assert.equal(iphone15Pro.classification.ramSignalPresent, false);
      assert.equal(iphone15Pro.logicalTier, 'high-end');
      assert.equal(iphone15Pro.recommendedProfile, 'high-fidelity');

      // Also verify older 2x DPR iPhone (e.g. iPhone 11) with undefined deviceMemory lands on balanced
      const iphone11 = detectExtendedDeviceCapabilities({
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
        devicePixelRatio: 2.0,
        viewportWidth: 414,
        viewportHeight: 896,
        hardwareConcurrency: 6,
        deviceMemory: undefined,
        isTouch: true,
        webgpuAvailable: false,
        webglProbe: {
          webgl2Available: true,
          gpuRenderer: 'Apple GPU',
          maxTextureSize: 16384,
          compressedTextures: { astc: true, etc2: true },
        },
      });

      assert.equal(iphone11.recommendedProfile, 'balanced');
    });

    it('enforces software GPU, Data Saver, 2G/3G, low battery, reduced-motion, and thermal overrides', () => {
      const flagshipBase = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/127.0.0.0',
        devicePixelRatio: 1.5,
        viewportWidth: 1920,
        viewportHeight: 1080,
        hardwareConcurrency: 16,
        deviceMemory: 8,
        isTouch: false,
        webgpuAvailable: true,
        webglProbe: {
          webgl2Available: true,
          gpuRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11)',
          maxTextureSize: 16384,
          maxRenderbufferSize: 16384,
          compressedTextures: { bptc: true, s3tc: true },
        },
      };

      assert.equal(detectExtendedDeviceCapabilities(flagshipBase).recommendedProfile, 'high-fidelity');

      // 1. Software rasterizer -> ultra-light
      const swiftShader = detectExtendedDeviceCapabilities({
        ...flagshipBase,
        webglProbe: {
          webgl2Available: true,
          gpuRenderer: 'Google SwiftShader',
          maxTextureSize: 8192,
        },
      });
      assert.equal(swiftShader.isSoftwareGpu, true);
      assert.equal(swiftShader.recommendedProfile, 'ultra-light');

      // 2. Network saveData -> ultra-light
      const dataSaver = detectExtendedDeviceCapabilities({
        ...flagshipBase,
        saveData: true,
      });
      assert.equal(dataSaver.recommendedProfile, 'ultra-light');

      // 3. 3G network -> caps high-fidelity down to balanced
      const network3g = detectExtendedDeviceCapabilities({
        ...flagshipBase,
        effectiveType: '3g',
      });
      assert.equal(network3g.recommendedProfile, 'balanced');

      // 4. Low discharging battery (<= 20%) -> ultra-light
      const lowBattery = detectExtendedDeviceCapabilities({
        ...flagshipBase,
        batteryCharging: false,
        batteryLevel: 0.18,
      });
      assert.equal(lowBattery.isLowPower, true);
      assert.equal(lowBattery.recommendedProfile, 'ultra-light');

      // 5. Accessibility prefers-reduced-motion -> ultra-light
      const reducedMotion = detectExtendedDeviceCapabilities({
        ...flagshipBase,
        prefersReducedMotion: true,
      });
      assert.equal(reducedMotion.recommendedProfile, 'ultra-light');

      // 6. Thermal pressure states
      const seriousThermal = detectExtendedDeviceCapabilities({
        ...flagshipBase,
        thermalState: 'serious',
      });
      assert.equal(seriousThermal.recommendedProfile, 'balanced');

      const criticalThermal = detectExtendedDeviceCapabilities({
        ...flagshipBase,
        thermalState: 'critical',
      });
      assert.equal(criticalThermal.recommendedProfile, 'ultra-light');

      // 7. Node environment honestly reports PressureObserver as 'unsupported'
      let observedState = null;
      const stopThermal = observeThermalPressure((st) => {
        observedState = st;
      });
      assert.equal(observedState, 'unsupported');
      stopThermal();
    });

    it('resolves optimal KTX2 GPU-compressed texture transcode priority', () => {
      assert.equal(
        resolvePreferredCompressedFormat({
          astc: true,
          etc2: true,
          etc1: true,
          s3tc: false,
          bptc: false,
          pvrtc: false,
        }),
        'astc'
      );
      assert.equal(
        resolvePreferredCompressedFormat({
          astc: false,
          etc2: false,
          etc1: false,
          s3tc: true,
          bptc: true,
          pvrtc: false,
        }),
        'bptc'
      );
      assert.equal(
        resolvePreferredCompressedFormat({
          astc: false,
          etc2: true,
          etc1: true,
          s3tc: false,
          bptc: false,
          pvrtc: false,
        }),
        'etc2'
      );
      assert.equal(
        resolvePreferredCompressedFormat({
          astc: false,
          etc2: false,
          etc1: false,
          s3tc: false,
          bptc: false,
          pvrtc: false,
        }),
        'rgba8'
      );
    });
  });

  // ===========================================================================
  // 2. THREE RENDERING PROFILES & 6-STEP PROGRESSIVE DEGRADATION SEQUENCE
  // ===========================================================================
  describe('2. Calibrated 3-Profile Architecture & Exact 6-Step Degradation Order', () => {
    it('defines ultra-light, balanced, and high-fidelity profiles matching Section 8 budgets', () => {
      const ultra = RENDERING_PROFILES['ultra-light'];
      assert.equal(ultra.legacyTier, 'low');
      assert.equal(ultra.dpr, 1.0);
      assert.equal(ultra.minScaledDpr, 0.75);
      assert.equal(ultra.maxTextureDimension, 512);
      assert.equal(ultra.shadowsEnabled, false);
      assert.equal(ultra.postProcessingEnabled, false);
      assert.equal(ultra.secondaryMaterialEffects, false);
      assert.equal(ultra.lodLevel, 2);
      assert.equal(ultra.antialias, false);
      assert.equal(ultra.powerPreference, 'low-power');

      const balanced = RENDERING_PROFILES.balanced;
      assert.equal(balanced.legacyTier, 'medium');
      assert.deepEqual(balanced.dpr, [1.0, 1.35]);
      assert.equal(balanced.maxTextureDimension, 1024);
      assert.equal(balanced.shadowsEnabled, true);
      assert.equal(balanced.maxShadowMapSize, 512);
      assert.equal(balanced.secondaryMaterialEffects, true);
      assert.equal(balanced.postProcessingEnabled, false);
      assert.equal(balanced.lodLevel, 1);
      assert.equal(balanced.antialias, true);

      const high = RENDERING_PROFILES['high-fidelity'];
      assert.equal(high.legacyTier, 'high');
      assert.deepEqual(high.dpr, [1.0, 1.75]);
      assert.equal(high.maxTextureDimension, 2048);
      assert.equal(high.shadowsEnabled, true);
      assert.equal(high.maxShadowMapSize, 1024);
      assert.equal(high.secondaryMaterialEffects, true);
      assert.equal(high.postProcessingEnabled, true);
      assert.equal(high.lodLevel, 0);
      assert.equal(high.maxAnisotropy, 8);
    });

    it('steps down through Steps 1 -> 2 -> 3 -> 4 -> 5 -> 6 in exact Section 8 order', () => {
      const mgr = new QualityManager({
        initialProfile: 'high-fidelity',
        environment: 'phone',
        devicePixelRatio: 3.0,
        minSampleFrames: 45,
        stepDownCooldownMs: 1500,
        persistOverride: false,
      });

      let now = 1000;
      const feedFrames = (count, deltaSec, memUtil = 0.45) => {
        for (let i = 0; i < count; i++) {
          now += deltaSec * 1000;
          mgr.recordFrameDelta(deltaSec, now, memUtil);
        }
      };

      // Baseline Step 0
      let snap = mgr.getSnapshot();
      assert.equal(snap.degradationStep, 0);
      assert.equal(snap.effective.effectiveDpr, 1.75);
      assert.equal(snap.effective.dprScale, 1.0);
      assert.equal(snap.effective.shadowsEnabled, true);
      assert.equal(snap.effective.postProcessingEnabled, true);
      assert.equal(snap.effective.secondaryMaterialEffects, true);
      assert.equal(snap.effective.lodLevel, 0);
      assert.equal(snap.effective.maxTextureDimension, 2048);
      assert.equal(snap.effective.evictSecondaryMaps, false);

      // Trigger Step 1: 45 frames at ~31 FPS (32ms > 28ms p90, < 38 FPS) -> Render resolution scale reduced
      feedFrames(45, 0.032);
      snap = mgr.getSnapshot();
      assert.equal(snap.degradationStep, 1);
      assert.equal(snap.effective.dprScale, 0.85);
      assert.ok(snap.effective.effectiveDpr < 1.75);
      assert.equal(snap.effective.shadowsEnabled, true, 'Step 1 keeps shadows enabled');
      assert.equal(snap.effective.postProcessingEnabled, true, 'Step 1 keeps post-processing');

      // Advance past stepDownCooldownMs and feed 45 unstable frames -> Step 2: Shadows disabled & dprScale 0.75
      now += 2000;
      feedFrames(45, 0.032);
      snap = mgr.getSnapshot();
      assert.equal(snap.degradationStep, 2);
      assert.equal(snap.effective.dprScale, 0.75);
      assert.equal(snap.effective.shadowsEnabled, false, 'Step 2 disables real-time shadows');
      assert.equal(snap.effective.postProcessingEnabled, true, 'Step 2 still has post-processing');

      // Advance -> Step 3: Post-processing disabled
      now += 2000;
      feedFrames(45, 0.032);
      snap = mgr.getSnapshot();
      assert.equal(snap.degradationStep, 3);
      assert.equal(snap.effective.postProcessingEnabled, false, 'Step 3 disables post-processing');
      assert.equal(snap.effective.secondaryMaterialEffects, true, 'Step 3 keeps secondary materials');

      // Advance -> Step 4: Secondary material effects disabled & env reflection reduced
      now += 2000;
      feedFrames(45, 0.032);
      snap = mgr.getSnapshot();
      assert.equal(snap.degradationStep, 4);
      assert.equal(snap.effective.secondaryMaterialEffects, false, 'Step 4 disables secondary material effects');
      assert.equal(snap.effective.simplifyTransmission, true);
      assert.equal(snap.effective.lodLevel, 0, 'Step 4 has not yet lowered geometry LOD');

      // Advance -> Step 5: Geometry LOD switched to lower level (0 -> 1)
      now += 2000;
      feedFrames(45, 0.032);
      snap = mgr.getSnapshot();
      assert.equal(snap.degradationStep, 5);
      assert.equal(snap.effective.lodLevel, 1, 'Step 5 lowers LOD level');
      assert.equal(snap.effective.maxTextureDimension, 2048);
      assert.equal(snap.effective.evictSecondaryMaps, false);

      // Gate check for Step 6: mild instability (33 FPS >= 28 FPS) + healthy heap (45% <= 80%) stays at Step 5
      now += 2000;
      feedFrames(45, 0.030, 0.45);
      assert.equal(
        mgr.getSnapshot().degradationStep,
        5,
        'Step 6 must not evict textures unless memory > 80% or FPS < 28'
      );

      // Now simulate JS heap pressure > 80% (85%) -> advances to Step 6 (texture residency halved + secondary map eviction)
      now += 2000;
      feedFrames(45, 0.030, 0.85);
      snap = mgr.getSnapshot();
      assert.equal(snap.degradationStep, 6);
      assert.equal(snap.effective.maxTextureDimension, 1024, 'Step 6 halves maxTextureDimension');
      assert.equal(snap.effective.evictSecondaryMaps, true, 'Step 6 flags secondary maps for eviction');
      assert.equal(snap.effective.lodLevel, 2);
      assert.equal(snap.effective.maxAnisotropy, 1);
    });
  });

  // ===========================================================================
  // 3. HYSTERESIS, OSCILLATION CIRCUIT-BREAKER, & DEMAND FRAMELOOP IMMUNITY
  // ===========================================================================
  describe('3. Hysteresis Cooldowns, Oscillation Lock, & frameloop="demand" Idle Immunity', () => {
    it('ignores frameloop="demand" idle sleep gaps (>= 200ms) without false degradation or premature recovery', () => {
      const mgr = new QualityManager({
        initialProfile: 'balanced',
        devicePixelRatio: 2.5,
        minSampleFrames: 45,
        persistOverride: false,
      });

      let now = 1000;

      // Simulate 10 orbit bursts separated by 3-second and 8-second demand sleep pauses!
      for (let burst = 0; burst < 10; burst++) {
        for (let f = 0; f < 12; f++) {
          now += 16;
          mgr.recordFrameDelta(0.016, now, 0.35);
        }
        // User stops dragging -> demand loop sleeps for 3.5 seconds!
        now += 3500;
        mgr.recordFrameDelta(3.5, now, 0.35);
      }

      const snap = mgr.getSnapshot();
      assert.equal(
        snap.degradationStep,
        0,
        'Idle pauses in frameloop="demand" must NEVER be misinterpreted as 0.3 FPS lag spikes'
      );
      assert.equal(snap.metrics.idleGapsIgnored, 10);
      assert.equal(snap.metrics.isIdle, true);

      // Also verify that 20 seconds of idle sleep while degraded does NOT falsely trigger immediate recovery!
      mgr.setDegradationStep(2, now, 'test-drop');
      for (let f = 0; f < 50; f++) {
        now += 16;
        mgr.recordFrameDelta(0.016, now, 0.35);
      }
      // Demand sleep for 20 seconds (delta = 20.0s)
      now += 20000;
      mgr.recordFrameDelta(20.0, now, 0.35);
      // 2 active frames after waking up
      now += 16;
      mgr.recordFrameDelta(0.016, now, 0.35);
      assert.equal(
        mgr.getSnapshot().degradationStep,
        2,
        '0-FPS sleep time must pause the sustained-smooth stopwatch rather than counting as 20s of 60 FPS rendering'
      );
    });

    it('recovers 1 step at a time after 8s cooldown + 12s sustained >55 FPS and locks ceiling for 60s on oscillation', () => {
      const mgr = new QualityManager({
        initialProfile: 'high-fidelity',
        devicePixelRatio: 2.0,
        minSampleFrames: 45,
        stepDownCooldownMs: 1500,
        recoveryCooldownMs: 8000,
        sustainedSmoothDurationMs: 12000,
        oscillationWindowMs: 15000,
        oscillationLockDurationMs: 60000,
        persistOverride: false,
      });

      let now = 1000;
      const runBurst = (durationMs, deltaSec = 0.016, mem = 0.4) => {
        const frames = Math.ceil(durationMs / (deltaSec * 1000));
        for (let i = 0; i < frames; i++) {
          now += deltaSec * 1000;
          mgr.recordFrameDelta(deltaSec, now, mem);
        }
      };

      // Degrade twice to Step 2
      runBurst(1600, 0.033); // -> Step 1
      assert.equal(mgr.getSnapshot().degradationStep, 1);
      now += 2000;
      runBurst(1600, 0.033); // -> Step 2
      assert.equal(mgr.getSnapshot().degradationStep, 2);

      // Smooth 62.5 FPS (16ms) for 6 seconds (< 12s sustained requirement) -> stays at Step 2
      runBurst(6000, 0.016);
      assert.equal(mgr.getSnapshot().degradationStep, 2);

      // Continue smooth 62.5 FPS for another 7.5 seconds (total > 12s smooth & > 8s post-drop) -> steps up 1 notch to Step 1!
      runBurst(7500, 0.016);
      assert.equal(
        mgr.getSnapshot().degradationStep,
        1,
        'Must step up gradually by exactly 1 step (2 -> 1), never jumping straight to 0'
      );

      // OSCILLATION TEST: Within 15s of stepping up to Step 1, FPS collapses again (30 FPS) -> drops back to Step 2 AND locks ceiling for 60s!
      now += 2000;
      runBurst(1600, 0.033);
      const lockedSnap = mgr.getSnapshot();
      assert.equal(lockedSnap.degradationStep, 2);
      assert.equal(lockedSnap.oscillationLocked, true, 'Oscillation circuit-breaker must engage');
      assert.equal(lockedSnap.oscillationCeilingStep, 2);

      // Even after 25 seconds of smooth 62.5 FPS, Step 2 remains locked (< 60s oscillation lock)
      runBurst(25000, 0.016);
      assert.equal(
        mgr.getSnapshot().degradationStep,
        2,
        'Oscillation lock must prevent bouncing back to Step 1 during the 60s lock window'
      );

      // Once total elapsed time exceeds 60s lock + 12s smooth stability, oscillation lock lifts and steps up to Step 1
      runBurst(40000, 0.016);
      const unlockedSnap = mgr.getSnapshot();
      assert.equal(unlockedSnap.oscillationLocked, false);
      assert.ok(unlockedSnap.degradationStep <= 1, 'Must allow step-up once 60s oscillation lock expires');
    });
  });

  // ===========================================================================
  // 4. BACKWARD COMPATIBILITY & CONTROLLER TELEMETRY CONTRACT
  // ===========================================================================
  describe('4. Legacy Hook Backward Compatibility & Controller Telemetry Contract', () => {
    it('preserves 100% of legacy useQualityTier exports alongside new 3-profile helpers', () => {
      assert.equal(profileToLegacyTier('ultra-light'), 'low');
      assert.equal(profileToLegacyTier('balanced'), 'medium');
      assert.equal(profileToLegacyTier('high-fidelity'), 'high');
      assert.equal(legacyTierToProfile('low'), 'ultra-light');
      assert.equal(legacyTierToProfile('medium'), 'balanced');
      assert.equal(legacyTierToProfile('high'), 'high-fidelity');

      const high = getTierSettings('high');
      assert.equal(high.profile, 'high-fidelity');
      assert.deepEqual(high.dpr, [1, 1.5]);
      assert.equal(QUALITY_TIER_CONFIGS.high.toneMappingExposure, 1.48);

      const ssrCaps = detectDeviceCapabilities();
      assert.equal(typeof ssrCaps.devicePixelRatio, 'number');
      assert.equal(ssrCaps.environment, 'web-desktop');

      const desktopTier = calculateQualityTier({
        devicePixelRatio: 2,
        hardwareConcurrency: 12,
        deviceMemory: 16,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        prefersReducedMotion: false,
        isLowPower: false,
        isDiscreteGpu: true,
        isSoftwareGpu: false,
      });
      assert.equal(desktopTier, 'high');

      const profileFromRecommended = calculateRenderingProfile({
        devicePixelRatio: 3,
        hardwareConcurrency: 8,
        deviceMemory: undefined,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouch: true,
        prefersReducedMotion: false,
        isLowPower: false,
        isDiscreteGpu: false,
        isSoftwareGpu: false,
        recommendedProfile: 'high-fidelity',
      });
      assert.equal(profileFromRecommended, 'high-fidelity');
    });

    it('verifies AdaptiveQualityController exposes __GOLDEN_OAK_3D_TELEMETRY__ and cleans up listeners', () => {
      const controllerPath = path.resolve('src/components/3d/AdaptiveQualityController.tsx');
      assert.ok(fs.existsSync(controllerPath), 'AdaptiveQualityController.tsx must exist');
      const src = fs.readFileSync(controllerPath, 'utf8');

      assert.ok(src.includes('__GOLDEN_OAK_3D_TELEMETRY__'), 'Must publish global 3D telemetry map');
      assert.ok(src.includes('gl.setPixelRatio'), 'Must dynamically update gl.setPixelRatio');
      assert.ok(src.includes("addEventListener('visibilitychange'"), 'Must listen for tab visibility');
      assert.ok(src.includes("removeEventListener('visibilitychange'"), 'Must clean up visibilitychange listener');
      assert.ok(src.includes('gl.info?.render?.calls'), 'Must track draw calls from gl.info.render');
      assert.ok(src.includes('gl.info?.render?.triangles'), 'Must track triangles from gl.info.render');
      assert.ok(src.includes('gl.info?.memory?.geometries'), 'Must track geometries from gl.info.memory');
      assert.ok(src.includes('gl.info?.memory?.textures'), 'Must track textures from gl.info.memory');
    });
  });
});
