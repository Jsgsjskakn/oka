import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import our TypeScript source via ESM or dynamic resolution
// Since this is node:test, let's import the compiled or tested exports
// Let's test the pure logic functions from useQualityTier
import {
  QUALITY_TIER_CONFIGS,
  getTierSettings,
  calculateQualityTier,
  detectDeviceCapabilities,
} from '../src/hooks/useQualityTier.ts';

describe('Agent 9: Adaptive Device Quality & DPR Tier Controller', () => {
  describe('1. Calibrated Quality Tiers Verification', () => {
    it('provides high tier calibrated for Desktop with discrete GPU', () => {
      const high = getTierSettings('high');
      assert.equal(high.qualityTier, 'high');
      assert.deepEqual(high.dpr, [1, 1.5], 'High tier DPR must be clamped to [1, 1.5]');
      assert.equal(high.shadowsEnabled, true, 'High tier must enable shadows');
      assert.equal(high.maxShadowMapSize, 1024, 'High tier shadow map must be clamped to 1024');
      assert.equal(high.contactShadowFrames, 1, 'High tier contact shadows must use baked frames = 1');
      assert.equal(high.transmissionEnabled, true, 'High tier must have transmission enabled');
      assert.equal(high.simplifyTransmission, false);
      assert.equal(high.antialias, true);
      assert.equal(high.powerPreference, 'high-performance');
    });

    it('provides medium tier calibrated for mid-range laptops and tablets', () => {
      const medium = getTierSettings('medium');
      assert.equal(medium.qualityTier, 'medium');
      assert.deepEqual(medium.dpr, [1, 1.25], 'Medium tier DPR must be clamped to [1, 1.25]');
      assert.equal(medium.shadowsEnabled, true, 'Medium tier enables standard shadows');
      assert.equal(medium.maxShadowMapSize, 1024, 'Medium tier shadow map must be 1024');
      assert.equal(medium.contactShadowFrames, 1, 'Medium tier contact shadows must be baked once (frames=1)');
      assert.equal(medium.transmissionEnabled, true);
      assert.equal(medium.simplifyTransmission, false);
      assert.equal(medium.antialias, true);
      assert.equal(medium.powerPreference, 'default');
    });

    it('provides low tier calibrated for mobile phones and low-concurrency devices', () => {
      const low = getTierSettings('low');
      assert.equal(low.qualityTier, 'low');
      assert.equal(low.dpr, 1.0, 'Low tier DPR must be strictly 1.0 to prevent mobile Retina overdraw stalls');
      assert.equal(low.shadowsEnabled, false, 'Low tier must disable heavy dynamic shadow maps');
      assert.equal(low.maxShadowMapSize, 512, 'Low tier shadow map size clamped to 512');
      assert.equal(low.contactShadowFrames, 1);
      assert.equal(low.transmissionEnabled, false, 'Low tier must disable transmission');
      assert.equal(low.simplifyTransmission, true, 'Low tier must simplify transmission to transparent alpha to prevent TBDR blits');
      assert.equal(low.antialias, false, 'Low tier disables MSAA to save fill-rate');
      assert.equal(low.powerPreference, 'low-power');
    });
  });

  describe('2. Hardware Capability Classification Heuristics', () => {
    it('classifies Desktop with discrete GPU (>=8 cores, NVIDIA RTX) as high', () => {
      const caps = {
        devicePixelRatio: 2,
        hardwareConcurrency: 16,
        deviceMemory: 16,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        prefersReducedMotion: false,
        isLowPower: false,
        gpuRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        isDiscreteGpu: true,
        isSoftwareGpu: false,
      };

      const tier = calculateQualityTier(caps);
      assert.equal(tier, 'high');
    });

    it('classifies Apple Silicon Desktop with high concurrency as high', () => {
      const caps = {
        devicePixelRatio: 2,
        hardwareConcurrency: 10,
        deviceMemory: 16,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        prefersReducedMotion: false,
        isLowPower: false,
        gpuRenderer: 'Apple M2 Pro',
        isDiscreteGpu: true,
        isSoftwareGpu: false,
      };

      const tier = calculateQualityTier(caps);
      assert.equal(tier, 'high');
    });

    it('classifies tablets as medium tier', () => {
      const caps = {
        devicePixelRatio: 2,
        hardwareConcurrency: 8,
        deviceMemory: 6,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        isTouch: true,
        prefersReducedMotion: false,
        isLowPower: false,
        isDiscreteGpu: false,
        isSoftwareGpu: false,
      };

      const tier = calculateQualityTier(caps);
      assert.equal(tier, 'medium');
    });

    it('classifies mid-range laptops (6 cores, integrated GPU) as medium', () => {
      const caps = {
        devicePixelRatio: 1.5,
        hardwareConcurrency: 6,
        deviceMemory: 8,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        prefersReducedMotion: false,
        isLowPower: false,
        gpuRenderer: 'Intel(R) Iris(R) Xe Graphics',
        isDiscreteGpu: false,
        isSoftwareGpu: false,
      };

      const tier = calculateQualityTier(caps);
      assert.equal(tier, 'medium');
    });

    it('classifies mobile phones strictly as low tier regardless of high screen DPR', () => {
      const mobileCaps = {
        devicePixelRatio: 3.5, // 3.5x Retina display on high-end phone
        hardwareConcurrency: 8,
        deviceMemory: 8,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouch: true,
        prefersReducedMotion: false,
        isLowPower: false,
        gpuRenderer: 'Apple GPU',
        isDiscreteGpu: false,
        isSoftwareGpu: false,
      };

      const tier = calculateQualityTier(mobileCaps);
      assert.equal(tier, 'low', 'Mobile phones must strictly use low tier to clamp DPR to 1.0 and prevent TBDR stalls');
    });

    it('classifies low concurrency devices (<= 4 cores) as low tier', () => {
      const caps = {
        devicePixelRatio: 1,
        hardwareConcurrency: 4,
        deviceMemory: 4,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        prefersReducedMotion: false,
        isLowPower: false,
        isDiscreteGpu: false,
        isSoftwareGpu: false,
      };

      const tier = calculateQualityTier(caps);
      assert.equal(tier, 'low');
    });

    it('downgrades to low tier when prefersReducedMotion is enabled', () => {
      const caps = {
        devicePixelRatio: 1,
        hardwareConcurrency: 16,
        deviceMemory: 32,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        prefersReducedMotion: true, // Accessibility setting
        isLowPower: false,
        isDiscreteGpu: true,
        isSoftwareGpu: false,
      };

      const tier = calculateQualityTier(caps);
      assert.equal(tier, 'low', 'Reduced motion preference must downgrade to low tier');
    });

    it('downgrades to low tier when battery saver / low-power mode is active', () => {
      const caps = {
        devicePixelRatio: 1.5,
        hardwareConcurrency: 12,
        deviceMemory: 16,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        prefersReducedMotion: false,
        isLowPower: true, // Battery saver active
        isDiscreteGpu: true,
        isSoftwareGpu: false,
      };

      const tier = calculateQualityTier(caps);
      assert.equal(tier, 'low', 'Low-power mode must downgrade to low tier');
    });

    it('downgrades to low tier on software rasterizers (SwiftShader / llvmpipe)', () => {
      const caps = {
        devicePixelRatio: 1,
        hardwareConcurrency: 8,
        deviceMemory: 16,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        prefersReducedMotion: false,
        isLowPower: false,
        gpuRenderer: 'Google SwiftShader',
        isDiscreteGpu: false,
        isSoftwareGpu: true,
      };

      const tier = calculateQualityTier(caps);
      assert.equal(tier, 'low', 'Software rasterizers must be forced to low tier');
    });

    it('downgrades to low tier on low memory devices (<= 2GB RAM)', () => {
      const caps = {
        devicePixelRatio: 1,
        hardwareConcurrency: 8,
        deviceMemory: 2,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        prefersReducedMotion: false,
        isLowPower: false,
        isDiscreteGpu: false,
        isSoftwareGpu: false,
      };

      const tier = calculateQualityTier(caps);
      assert.equal(tier, 'low');
    });
  });

  describe('3. SSR & Environment Safety', () => {
    it('detectDeviceCapabilities handles SSR without throwing', () => {
      // In node environment, window and navigator are undefined
      const caps = detectDeviceCapabilities();
      assert.ok(caps);
      assert.equal(typeof caps.devicePixelRatio, 'number');
      assert.equal(typeof caps.hardwareConcurrency, 'number');
      assert.equal(typeof caps.isMobile, 'boolean');
      assert.equal(typeof caps.isTablet, 'boolean');
      assert.equal(typeof caps.isDesktop, 'boolean');
    });
  });
});
