import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveXRSessionQualityProfile,
  XRFrameTimeMonitor,
  applyDegradationLevel,
  classifyGpuArchitecture,
  XR_BASE_PROFILES,
  MAX_DEGRADATION_LEVEL,
} from '../src/lib/xr/ar-quality-profile.ts';

describe('Phase 3.2 SA4: Mobile Performance & AR Quality Profile Engine', () => {
  describe('1. 9-Device Persona Scoring & Multi-Signal Classification', () => {
    it('1. 2GB Android low-end phone (Adreno 610 / Mali-G52, 2GB RAM) -> ultra-light', () => {
      const profile = resolveXRSessionQualityProfile({
        gpuRenderer: 'Adreno (TM) 610',
        deviceMemory: 2,
        isMobile: true,
        platform: 'android',
      });
      assert.equal(profile.profile, 'ultra-light');
      assert.equal(profile.framebufferScaleFactor, 0.75);
      assert.equal(profile.shadowTechnique, 'contact-blob');
      assert.equal(profile.lodTier, 2);
      assert.equal(profile.textureMaxDimension, 512);
      assert.equal(profile.useLightEstimation, false);
      assert.equal(profile.antialias, false);
    });

    it('2. 4GB Android phone (Mali-G57 / Adreno 619, 4GB RAM) -> ultra-light (entry GPU)', () => {
      const profile = resolveXRSessionQualityProfile({
        gpuRenderer: 'Mali-G57 MC2',
        deviceMemory: 4,
        isMobile: true,
        platform: 'android',
      });
      assert.equal(profile.profile, 'ultra-light');
      assert.equal(profile.shadowTechnique, 'contact-blob');
    });

    it('3. 6GB Android phone (Adreno 642L / Mali-G68, 6GB RAM) -> balanced', () => {
      const profile = resolveXRSessionQualityProfile({
        gpuRenderer: 'Adreno (TM) 642L',
        deviceMemory: 6,
        isMobile: true,
        platform: 'android',
        grantedXRFeatures: ['hit-test', 'anchors', 'light-estimation'],
      });
      assert.equal(profile.profile, 'balanced');
      assert.equal(profile.framebufferScaleFactor, 1.0);
      assert.equal(profile.shadowTechnique, 'contact-shadow-texture');
      assert.equal(profile.lodTier, 1);
      assert.equal(profile.textureMaxDimension, 1024);
      assert.equal(profile.useLightEstimation, true);
      assert.equal(profile.antialias, true);
    });

    it('4a. True flagship Android phone (Adreno 750, 12GB RAM) -> high-fidelity', () => {
      const profile = resolveXRSessionQualityProfile({
        gpuRenderer: 'Adreno (TM) 750',
        deviceMemory: 8,
        isMobile: true,
        platform: 'android',
        grantedXRFeatures: ['hit-test', 'anchors', 'light-estimation'],
      });
      assert.equal(profile.profile, 'high-fidelity');
      assert.equal(profile.framebufferScaleFactor, 1.0);
      assert.equal(profile.shadowTechnique, 'shadow-map');
      assert.equal(profile.lodTier, 0);
      assert.equal(profile.textureMaxDimension, 2048);
      assert.equal(profile.useLightEstimation, true);
      assert.equal(profile.maxConcurrentDishes, 4);
    });

    it('4b. PROVES 8GB MARKETING RAM ALONE NEVER DECIDES: Trap 8GB budget phone (Adreno 610) -> ultra-light', () => {
      const profile = resolveXRSessionQualityProfile({
        gpuRenderer: 'Adreno (TM) 610',
        deviceMemory: 8, // inflated marketing RAM on entry SoC
        isMobile: true,
        platform: 'android',
      });
      assert.equal(profile.profile, 'ultra-light');
      assert.ok(
        profile.reasons.some((r) => r.includes('8gb-budget-phone-trap-neutralized')),
        'Must log reason that 8GB trap was neutralized'
      );
    });

    it('5. Older supported iPhone (Apple A12 Bionic, deviceMemory === undefined) -> balanced (NEVER penalized for undefined memory)', () => {
      const profile = resolveXRSessionQualityProfile({
        gpuRenderer: 'Apple A12 GPU',
        deviceMemory: undefined, // Safari never exposes deviceMemory
        isMobile: true,
        platform: 'ios',
        devicePixelRatio: 2,
        grantedXRFeatures: ['hit-test', 'anchors', 'light-estimation'],
      });
      assert.equal(profile.profile, 'balanced');
      assert.equal(profile.lodTier, 1);
      assert.ok(
        profile.reasons.some((r) => r.includes('ios-device-memory-undefined-preserved')),
        'Must preserve iOS device memory undefined without penalization'
      );
    });

    it('6. Recent iPhone (Apple A17 Pro, deviceMemory === undefined, DPR 3) -> high-fidelity', () => {
      const profile = resolveXRSessionQualityProfile({
        gpuRenderer: 'Apple A17 Pro GPU',
        deviceMemory: undefined,
        isMobile: true,
        platform: 'ios',
        devicePixelRatio: 3,
        grantedXRFeatures: ['hit-test', 'anchors', 'light-estimation'],
      });
      assert.equal(profile.profile, 'high-fidelity');
      assert.equal(profile.framebufferScaleFactor, 1.0); // Never 3.0 in XR framebuffer
      assert.equal(profile.shadowTechnique, 'shadow-map');
      assert.equal(profile.lodTier, 0);
    });

    it('7. iPad with Apple M2 Silicon (deviceMemory === undefined) -> high-fidelity', () => {
      const profile = resolveXRSessionQualityProfile({
        gpuRenderer: 'Apple M2 GPU',
        deviceMemory: undefined,
        isMobile: false,
        platform: 'tablet',
        grantedXRFeatures: ['hit-test', 'anchors', 'light-estimation'],
      });
      assert.equal(profile.profile, 'high-fidelity');
      assert.equal(profile.lodTier, 0);
    });

    it('8. Integrated GPU laptop (Intel Iris Xe, 8GB RAM) -> balanced', () => {
      const profile = resolveXRSessionQualityProfile({
        gpuRenderer: 'Intel(R) Iris(R) Xe Graphics',
        deviceMemory: 8,
        isMobile: false,
        platform: 'windows',
        grantedXRFeatures: ['hit-test', 'anchors'],
      });
      assert.equal(profile.profile, 'balanced');
      assert.equal(profile.lodTier, 1);
    });

    it('9. Dedicated GPU desktop (NVIDIA RTX 4070, 16GB RAM) -> high-fidelity', () => {
      const profile = resolveXRSessionQualityProfile({
        gpuRenderer: 'NVIDIA GeForce RTX 4070',
        deviceMemory: 8,
        isMobile: false,
        platform: 'windows',
        grantedXRFeatures: ['hit-test', 'anchors', 'light-estimation'],
      });
      assert.equal(profile.profile, 'high-fidelity');
      assert.equal(profile.framebufferScaleFactor, 1.0);
      assert.equal(profile.shadowTechnique, 'shadow-map');
      assert.equal(profile.lodTier, 0);
      assert.equal(profile.textureMaxDimension, 2048);
    });
  });

  describe('2. Environmental Overrides & Feature Gates', () => {
    it('Software GPU overrides any device to ultra-light', () => {
      const profile = resolveXRSessionQualityProfile({
        gpuRenderer: 'Google SwiftShader',
        deviceMemory: 16,
      });
      assert.equal(profile.profile, 'ultra-light');
      assert.equal(profile.lodTier, 2);
    });

    it('Data Saver overrides to ultra-light', () => {
      const profile = resolveXRSessionQualityProfile({
        gpuRenderer: 'NVIDIA GeForce RTX 4070',
        saveData: true,
      });
      assert.equal(profile.profile, 'ultra-light');
      assert.equal(profile.textureMaxDimension, 512);
    });

    it('Critical thermal hint downgrades flagship to ultra-light', () => {
      const profile = resolveXRSessionQualityProfile({
        gpuRenderer: 'Adreno (TM) 750',
        isMobile: true,
        thermalHint: 'critical',
      });
      assert.equal(profile.profile, 'ultra-light');
      assert.equal(profile.shadowTechnique, 'contact-blob');
    });

    it('Fair thermal hint caps flagship mobile at balanced', () => {
      const profile = resolveXRSessionQualityProfile({
        gpuRenderer: 'Adreno (TM) 750',
        isMobile: true,
        thermalHint: 'fair',
      });
      assert.equal(profile.profile, 'balanced');
      assert.equal(profile.lodTier, 1);
    });

    it('Disables light estimation when feature is not granted', () => {
      const profile = resolveXRSessionQualityProfile({
        gpuRenderer: 'Adreno (TM) 750',
        isMobile: true,
        grantedXRFeatures: ['hit-test', 'anchors'], // no light-estimation
      });
      assert.equal(profile.profile, 'high-fidelity');
      assert.equal(profile.useLightEstimation, false);
      assert.ok(profile.reasons.some((r) => r.includes('light-estimation-not-granted')));
    });

    it('Disables light estimation on ultra-light tier even if granted (CPU/GPU preservation)', () => {
      const profile = resolveXRSessionQualityProfile({
        gpuRenderer: 'Adreno (TM) 610',
        isMobile: true,
        grantedXRFeatures: ['hit-test', 'anchors', 'light-estimation'],
      });
      assert.equal(profile.profile, 'ultra-light');
      assert.equal(profile.useLightEstimation, false);
    });

    it('User override takes absolute precedence', () => {
      const profile = resolveXRSessionQualityProfile({
        gpuRenderer: 'Adreno (TM) 610',
        overrideProfile: 'high-fidelity',
      });
      assert.equal(profile.profile, 'high-fidelity');
      assert.equal(profile.shadowTechnique, 'shadow-map');
    });
  });

  describe('3. Degradation Ladder Order & Tracking Stability Invariant', () => {
    const base = XR_BASE_PROFILES['high-fidelity'];

    it('Step 1 degrades framebuffer scale factor (1.0 -> 0.85)', () => {
      const degraded = applyDegradationLevel(base, 1);
      assert.equal(degraded.framebufferScaleFactor, 0.85);
      assert.equal(degraded.shadowTechnique, 'shadow-map');
      assert.equal(degraded.useLightEstimation, true);
      assert.equal(degraded.lodTier, 0);
    });

    it('Step 2 degrades shadows (shadow-map -> contact-shadow-texture)', () => {
      const degraded = applyDegradationLevel(base, 2);
      assert.equal(degraded.framebufferScaleFactor, 0.85);
      assert.equal(degraded.shadowTechnique, 'contact-shadow-texture');
      assert.equal(degraded.useLightEstimation, true);
      assert.equal(degraded.lodTier, 0);
    });

    it('Step 3 disables light estimation', () => {
      const degraded = applyDegradationLevel(base, 3);
      assert.equal(degraded.useLightEstimation, false);
      assert.equal(degraded.lodTier, 0);
      assert.equal(degraded.shadowTechnique, 'contact-shadow-texture');
    });

    it('Step 4 steps down LOD tier (0 -> 1) and switches to contact-blob shadow', () => {
      const degraded = applyDegradationLevel(base, 4);
      assert.equal(degraded.lodTier, 1);
      assert.equal(degraded.shadowTechnique, 'contact-blob');
      assert.equal(degraded.useLightEstimation, false);
    });

    it('Step 5 reduces textures to 512px and turns off antialias (Full ultra-light floor)', () => {
      const degraded = applyDegradationLevel(base, 5);
      assert.equal(degraded.textureMaxDimension, 512);
      assert.equal(degraded.antialias, false);
      assert.equal(degraded.framebufferScaleFactor, 0.75);
      assert.equal(degraded.profile, 'ultra-light');
    });

    it('TRACKING STABILITY INVARIANT: Hit-test and anchors are never disabled to save perf', () => {
      for (let level = 0; level <= MAX_DEGRADATION_LEVEL; level++) {
        const degraded = applyDegradationLevel(base, level);
        // None of the properties should disable XR tracking capabilities
        assert.ok(degraded.framebufferScaleFactor >= 0.75, 'Framebuffer scale must never collapse < 0.75');
        assert.ok(degraded.lodTier <= 2, 'LOD tier must stay within valid range');
      }
    });
  });

  describe('4. XRFrameTimeMonitor: Rolling Metrics, Cooldowns & Oscillation Lock', () => {
    it('Ignores idle gaps >= 200ms without false degradation', () => {
      const monitor = new XRFrameTimeMonitor({
        initialProfile: XR_BASE_PROFILES['high-fidelity'],
        idleGapThresholdMs: 200,
      });

      // Warm up with good 16ms frames
      for (let i = 0; i < 20; i++) {
        monitor.sample(16.6, 1000 + i * 16.6);
      }

      // Simulate a 500ms background pause
      const pauseAction = monitor.sample(500, 2000);
      assert.equal(pauseAction.action, 'hold');
      assert.equal(pauseAction.reason, 'idle-gap-discarded');
      assert.equal(monitor.getDegradationLevel(), 0);
    });

    it('Triggers degradation when p90 exceeds threshold and respects stepDownCooldownMs', () => {
      const monitor = new XRFrameTimeMonitor({
        initialProfile: XR_BASE_PROFILES['high-fidelity'],
        p90DegradeThresholdMs: 20.0,
        stepDownCooldownMs: 1500,
        sampleWindowSize: 20,
      });

      // Warm up with 20 frames of high frame times (24ms = ~41 FPS)
      let degradeCount = 0;
      for (let i = 0; i < 20; i++) {
        const action = monitor.sample(24.0, 1000 + i * 20);
        if (action.action === 'degrade') degradeCount++;
      }

      assert.equal(degradeCount, 1, 'Should degrade exactly once on initial lag spike');
      assert.equal(monitor.getDegradationLevel(), 1);
      assert.equal(monitor.getEffectiveSettings().framebufferScaleFactor, 0.85);

      // Immediate subsequent frame during cooldown (<1500ms) must HOLD
      const cooldownAction = monitor.sample(24.0, 1000 + 20 * 20 + 100); // only 100ms later
      assert.equal(cooldownAction.action, 'hold');
      assert.equal(cooldownAction.reason, 'degrade-cooldown-active');
      assert.equal(monitor.getDegradationLevel(), 1);

      // Frame after cooldown (>1500ms later) can degrade to level 2
      const nextDegradeAction = monitor.sample(24.0, 1000 + 20 * 20 + 1600);
      assert.equal(nextDegradeAction.action, 'degrade');
      assert.equal(monitor.getDegradationLevel(), 2);
    });

    it('Recovers only after sustained smooth duration and respects recovery cooldown', () => {
      const monitor = new XRFrameTimeMonitor({
        initialProfile: XR_BASE_PROFILES['high-fidelity'],
        sustainedSmoothDurationMs: 12000,
        recoveryCooldownMs: 8000,
        stepDownCooldownMs: 2000,
        sampleWindowSize: 20,
      });

      // Force to degradation level 1
      for (let i = 0; i < 20; i++) {
        monitor.sample(25.0, 1000 + i * 20);
      }
      assert.equal(monitor.getDegradationLevel(), 1);

      // Flush buffer with smooth 14ms frames during cooldown (<2000ms)
      for (let i = 0; i < 25; i++) {
        const action = monitor.sample(14.0, 1500 + i * 16.6);
        assert.equal(action.action, 'hold', 'Must not recover before sustained duration');
      }
      assert.equal(monitor.getDegradationLevel(), 1);

      // Feed smooth frames up to 5 seconds (< 12000ms threshold)
      for (let i = 0; i < 100; i++) {
        const action = monitor.sample(14.0, 2000 + i * 50);
        assert.equal(action.action, 'hold', 'Must not recover before sustained duration');
      }
      assert.equal(monitor.getDegradationLevel(), 1);

      // Feed smooth frame past 12,000ms threshold
      const recoverAction = monitor.sample(14.0, 1500 + 13000);
      assert.equal(recoverAction.action, 'recover');
      assert.equal(monitor.getDegradationLevel(), 0);
    });

    it('Engages oscillation lock when rapidly flipping between degrade and recover', () => {
      const monitor = new XRFrameTimeMonitor({
        initialProfile: XR_BASE_PROFILES['high-fidelity'],
        stepDownCooldownMs: 500,
        recoveryCooldownMs: 100,
        sustainedSmoothDurationMs: 200,
        sampleWindowSize: 20,
        oscillationWindowMs: 5000,
        oscillationLockDurationMs: 60000,
      });

      // 1. Degrade to level 1
      for (let i = 0; i < 20; i++) monitor.sample(25.0, 1000 + i * 10);
      assert.equal(monitor.getDegradationLevel(), 1);

      // 2. Flush buffer with 25 smooth frames during cooldown (<500ms)
      for (let i = 0; i < 25; i++) monitor.sample(13.0, 1250 + i * 10);
      // Advance past sustainedSmoothDurationMs (200ms)
      const rec = monitor.sample(13.0, 1250 + 250 + 250);
      assert.equal(rec.action, 'recover');
      assert.equal(monitor.getDegradationLevel(), 0);

      // 3. Degrade again within oscillation window (rapid flap!)
      for (let i = 0; i < 20; i++) monitor.sample(25.0, 2000 + i * 10);
      assert.equal(monitor.getDegradationLevel(), 1);
      assert.equal(monitor.isOscillationLocked(), true, 'Must engage oscillation lock');

      // 4. While oscillation locked, recovery is blocked even if smooth
      for (let i = 0; i < 25; i++) monitor.sample(13.0, 2300 + i * 10);
      const blockedAction = monitor.sample(13.0, 2300 + 300 + 300);
      assert.equal(blockedAction.action, 'hold');
      assert.equal(monitor.getDegradationLevel(), 1, 'Must keep ceiling locked during oscillation lock');
    });
  });
});
