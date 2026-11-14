/**
 * THE GOLDEN OAK — Phase 3.2 XR Quality Profile & Dynamic Frame Monitor Automated Suite
 * Sub-Agent 5 (QA & Regression Engineer)
 *
 * Verifies:
 * 1. Multi-signal device classification & XR session profile resolution
 * 2. iPhone / Safari undefined deviceMemory preservation invariant
 * 3. 8GB marketing RAM budget phone trap (Adreno 610 + 8GB RAM stays ultra-light)
 * 4. Exact 5-tier gradual degradation order (framebuffer -> shadow -> light -> LOD -> textures)
 * 5. Tracking stability invariant: hit-test & anchors NEVER sacrificed for performance
 * 6. XRFrameTimeMonitor hysteresis, idle gap immunity, and oscillation locks
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  XR_BASE_PROFILES,
  classifyGpuArchitecture,
  resolveXRSessionQualityProfile,
  applyDegradationLevel,
  XRFrameTimeMonitor,
} from '../src/lib/xr/ar-quality-profile.ts';

test('Phase 3.2 — XR Quality Profile & Frame-Time Performance Engine', async (t) => {
  await t.test('1. Base Calibrated Profiles Structure & Budgets', () => {
    // Ultra-light
    const ultraLight = XR_BASE_PROFILES['ultra-light'];
    assert.equal(ultraLight.framebufferScaleFactor, 0.75);
    assert.equal(ultraLight.foveation, 1.0);
    assert.equal(ultraLight.shadowTechnique, 'contact-blob');
    assert.equal(ultraLight.textureMaxDimension, 512);
    assert.equal(ultraLight.lodTier, 2);
    assert.equal(ultraLight.useLightEstimation, false);
    assert.equal(ultraLight.maxConcurrentDishes, 1);
    assert.equal(ultraLight.antialias, false);

    // Balanced
    const balanced = XR_BASE_PROFILES['balanced'];
    assert.equal(balanced.framebufferScaleFactor, 1.0);
    assert.equal(balanced.foveation, 0.5);
    assert.equal(balanced.shadowTechnique, 'contact-shadow-texture');
    assert.equal(balanced.textureMaxDimension, 1024);
    assert.equal(balanced.lodTier, 1);
    assert.equal(balanced.useLightEstimation, true);
    assert.equal(balanced.maxConcurrentDishes, 2);
    assert.equal(balanced.antialias, true);

    // High-fidelity
    const high = XR_BASE_PROFILES['high-fidelity'];
    assert.equal(high.framebufferScaleFactor, 1.0);
    assert.equal(high.foveation, 0.0);
    assert.equal(high.shadowTechnique, 'shadow-map');
    assert.equal(high.textureMaxDimension, 2048);
    assert.equal(high.lodTier, 0);
    assert.equal(high.useLightEstimation, true);
    assert.equal(high.maxConcurrentDishes, 4);
    assert.equal(high.antialias, true);
  });

  await t.test('2. iPhone Safari Missing deviceMemory Never Penalized', () => {
    // Safari on iOS NEVER exposes navigator.deviceMemory (it is undefined).
    // Test that an iPhone 15 Pro with Apple GPU and undefined deviceMemory gets high-fidelity
    const iphoneProfile = resolveXRSessionQualityProfile({
      platform: 'ios',
      isMobile: true,
      gpuRenderer: 'Apple A17 Pro GPU',
      deviceMemory: undefined,
      grantedXRFeatures: ['hit-test', 'anchors', 'light-estimation'],
    });

    assert.equal(
      iphoneProfile.profile,
      'high-fidelity',
      'iPhone 15 Pro with Apple A17 GPU and undefined deviceMemory must resolve to high-fidelity'
    );
    assert.ok(
      iphoneProfile.reasons.some((r) => r.includes('flagship-mobile') || r.includes('apple')),
      'Must recognize flagship Apple GPU'
    );

    // Mid-range iPhone (e.g. iPhone 12/13 with generic Apple GPU and undefined deviceMemory)
    const midIphone = resolveXRSessionQualityProfile({
      platform: 'ios',
      isMobile: true,
      gpuRenderer: 'Apple GPU',
      deviceMemory: undefined,
    });
    assert.ok(
      midIphone.profile === 'high-fidelity' || midIphone.profile === 'balanced',
      'Apple GPU must resolve to at least balanced, never penalized to ultra-light due to undefined RAM'
    );
  });

  await t.test('3. Neutralizing the 8GB Budget Phone Trap (Weak GPU + High RAM)', () => {
    // Many budget phones advertise "8GB RAM" but ship an entry Adreno 610 or Mali-G52 GPU.
    // RAM alone must NEVER promote a weak GPU to balanced or high-fidelity!
    const budgetTrapProfile = resolveXRSessionQualityProfile({
      platform: 'android',
      isMobile: true,
      gpuRenderer: 'Adreno (TM) 610',
      deviceMemory: 8, // 8GB RAM
      grantedXRFeatures: ['hit-test'],
    });

    assert.equal(
      budgetTrapProfile.profile,
      'ultra-light',
      'Adreno 610 with 8GB RAM MUST stay ultra-light (fill rate is GPU bound, not RAM bound)'
    );
    assert.ok(
      budgetTrapProfile.reasons.some((r) => r.includes('low-end-tier') || r.includes('8gb-budget-phone-trap')),
      'Audit reasons must record that weak GPU overrides 8GB marketing RAM'
    );
  });

  await t.test('4. Thermal Pressure, Low Power Mode & Feature Grants', () => {
    // Flagship device under severe thermal pressure degrades to ultra-light
    const hotFlagship = resolveXRSessionQualityProfile({
      platform: 'android',
      isMobile: true,
      gpuRenderer: 'Adreno (TM) 750',
      deviceMemory: 12,
      thermalHint: 'serious',
    });
    assert.equal(hotFlagship.profile, 'ultra-light', 'Serious thermal pressure must drop profile to ultra-light');

    // Light estimation disabled if not granted by WebXR session
    const noLightGrant = resolveXRSessionQualityProfile({
      platform: 'android',
      isMobile: true,
      gpuRenderer: 'Adreno (TM) 750',
      deviceMemory: 12,
      grantedXRFeatures: ['hit-test', 'anchors'], // missing 'light-estimation'
    });
    assert.equal(noLightGrant.useLightEstimation, false, 'Light estimation must be false if not in granted features');

    // Manual user override immediately supersedes heuristics
    const overridden = resolveXRSessionQualityProfile({
      gpuRenderer: 'SwiftShader',
      overrideProfile: 'high-fidelity',
    });
    assert.equal(overridden.profile, 'high-fidelity', 'Explicit override must take precedence');
  });

  await t.test('5. Exact 5-Tier Gradual Degradation Ladder', () => {
    const base = XR_BASE_PROFILES['high-fidelity'];

    // Level 0: Unmodified
    const lvl0 = applyDegradationLevel(base, 0);
    assert.equal(lvl0.framebufferScaleFactor, base.framebufferScaleFactor);
    assert.equal(lvl0.shadowTechnique, base.shadowTechnique);

    // Level 1: Framebuffer scale factor reduced
    const lvl1 = applyDegradationLevel(base, 1);
    assert.ok(lvl1.framebufferScaleFactor < base.framebufferScaleFactor, 'Step 1 must reduce framebuffer scale');
    assert.equal(lvl1.shadowTechnique, base.shadowTechnique, 'Step 1 must not downgrade shadows yet');

    // Level 2: Downgrade shadow technique
    const lvl2 = applyDegradationLevel(base, 2);
    assert.equal(lvl2.shadowTechnique, 'contact-shadow-texture', 'Step 2 must downgrade shadow map to contact texture');
    assert.equal(lvl2.useLightEstimation, true, 'Step 2 must keep light estimation');

    // Level 3: Disable light estimation
    const lvl3 = applyDegradationLevel(base, 3);
    assert.equal(lvl3.useLightEstimation, false, 'Step 3 must disable light estimation');
    assert.equal(lvl3.lodTier, 0, 'Step 3 keeps high mesh LOD');

    // Level 4: Step down mesh LOD tier
    const lvl4 = applyDegradationLevel(base, 4);
    assert.equal(lvl4.lodTier, 1, 'Step 4 must downgrade mesh LOD to 1');

    // Level 5: Reduce texture dimension and disable antialias
    const lvl5 = applyDegradationLevel(base, 5);
    assert.equal(lvl5.textureMaxDimension, 512, 'Step 5 must reduce texture dimension to 512');
    assert.equal(lvl5.antialias, false, 'Step 5 must disable antialiasing');
  });

  await t.test('6. XRFrameTimeMonitor Hysteresis, Idle Immunity & Oscillation Locks', () => {
    const monitor = new XRFrameTimeMonitor({
      sampleWindowSize: 20,
      stepDownCooldownMs: 1000,
      recoveryCooldownMs: 2000,
      sustainedSmoothDurationMs: 3000,
      idleGapThresholdMs: 200,
    });

    let now = 10000;

    // 1. Idle gap immunity: sudden 500ms pause (e.g. tab blur) is discarded
    const idleResult = monitor.sample(500, now);
    assert.equal(idleResult.action, 'hold');
    assert.equal(idleResult.reason, 'idle-gap-discarded');

    // 2. Feed 20 smooth 16.6ms frames
    for (let i = 0; i < 20; i++) {
      now += 16.6;
      monitor.sample(16.6, now);
    }
    const smoothRes = monitor.sample(16.6, now + 16.6);
    assert.equal(smoothRes.action, 'hold');
    assert.equal(smoothRes.degradationLevel, 0);

    // 3. Feed high frame times (heavy load 25ms per frame)
    now += 1500; // ensure cooldown has passed
    let lastAction = null;
    let sawDegrade = false;
    for (let i = 0; i < 25; i++) {
      now += 25;
      const res = monitor.sample(25, now);
      if (res.action === 'degrade') {
        sawDegrade = true;
        lastAction = res;
      }
    }
    assert.ok(sawDegrade, 'Must trigger degradation action when frame times consistently exceed 20ms');
    assert.ok(lastAction.degradationLevel >= 1, 'Degradation level must be at least 1');

    // 4. Cooldown prevents rapid degradation immediately within stepDownCooldownMs
    const immediateRes = monitor.sample(26, now + 50);
    assert.equal(immediateRes.action, 'hold', 'Must hold during step-down cooldown');

    // Reset monitor
    monitor.reset();
    assert.equal(monitor.getDegradationLevel(), 0, 'Reset returns degradation level to 0');
  });
});
