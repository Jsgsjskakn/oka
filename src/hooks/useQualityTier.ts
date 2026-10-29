'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

export type QualityTier = 'high' | 'medium' | 'low';

export interface DeviceCapabilities {
  devicePixelRatio: number;
  hardwareConcurrency: number;
  deviceMemory?: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  prefersReducedMotion: boolean;
  isLowPower: boolean;
  gpuRenderer?: string;
  isDiscreteGpu: boolean;
  isSoftwareGpu: boolean;
}

export interface QualityTierSettings {
  /** Calibrated quality tier identifier */
  qualityTier: QualityTier;
  /** Short tier alias */
  tier: QualityTier;
  /** DPR clamped to prevent fill-rate overload (e.g. 1.0 for low, [1, 1.25] for medium, [1, 1.5] for high) */
  dpr: number | [number, number];
  /** Whether dynamic shadow maps are enabled */
  shadowsEnabled: boolean;
  /** Maximum shadow map resolution (width/height in pixels) */
  maxShadowMapSize: number;
  /** Contact shadow frame update frequency (1 = bake once, Infinity = continuous dynamic) */
  contactShadowFrames: number;
  /** Whether physically simulated transmission (glass refraction) is enabled */
  transmissionEnabled: boolean;
  /** Convenience flag: true when transmission should be replaced by transparent alpha */
  simplifyTransmission: boolean;
  /** Hardware antialiasing (MSAA) */
  antialias: boolean;
  /** Intensity of environment reflections / HDR maps */
  environmentIntensity: number;
  /** Default tone mapping exposure adjustment */
  toneMappingExposure: number;
  /** WebGL power preference hint */
  powerPreference: 'high-performance' | 'default' | 'low-power';
  /** Max texture anisotropy */
  maxAnisotropy: number;
}

export interface UseQualityTierResult extends QualityTierSettings, DeviceCapabilities {
  /** Indicates whether client-side hardware capability detection has completed */
  isHydrated: boolean;
  /** Programmatically override tier or reset to automatic ('auto' or null) */
  setTierOverride: (tier: QualityTier | 'auto' | null) => void;
  /** Currently active override, or null if automatic */
  tierOverride: QualityTier | null;
}

export interface UseQualityTierOptions {
  /** Initial fallback tier before hydration (defaults to 'high' for rich initial paint) */
  initialTier?: QualityTier;
  /** Forced tier override (for testing or user settings) */
  overrideTier?: QualityTier | null;
}

/**
 * Calibrated Tier Configurations
 *
 * HIGH (Desktop with discrete GPU):
 * - DPR clamped to [1, 1.5]
 * - Clamped 1024x1024 dynamic directional shadows
 * - Single-frame contact shadows (frames = 1) with on-demand refresh
 * - Physical PBR transmission with accurate IOR refraction
 * - Tone mapping exposure 1.15, environment intensity 0.85
 *
 * MEDIUM (Mid-range laptops, tablets):
 * - DPR clamped to [1, 1.25]
 * - 1024x1024 directional shadows
 * - Contact shadows baked once (frames = 1)
 * - Standard PBR with selective transmission
 * - Tone mapping exposure 1.10, environment intensity 0.75
 *
 * LOW (Mobile phones, low concurrency devices, battery saver):
 * - DPR strictly 1.0 (prevents 3x/4x mobile Retina overdraw stalls)
 * - Dynamic shadows disabled (maxShadowMapSize = 512, shadowsEnabled = false)
 * - Transmission simplified to transparent alpha (prevents costly TBDR framebuffer blits)
 * - Contact shadows baked once (frames = 1)
 * - Tone mapping exposure 1.05, environment intensity 0.65
 */
export const QUALITY_TIER_CONFIGS: Record<QualityTier, QualityTierSettings> = {
  high: {
    qualityTier: 'high',
    tier: 'high',
    dpr: [1, 1.5],
    shadowsEnabled: true,
    maxShadowMapSize: 1024,
    contactShadowFrames: 1,
    transmissionEnabled: true,
    simplifyTransmission: false,
    antialias: true,
    environmentIntensity: 1.25,
    toneMappingExposure: 1.48,
    powerPreference: 'high-performance',
    maxAnisotropy: 8,
  },
  medium: {
    qualityTier: 'medium',
    tier: 'medium',
    dpr: [1, 1.25],
    shadowsEnabled: true,
    maxShadowMapSize: 1024,
    contactShadowFrames: 1,
    transmissionEnabled: true,
    simplifyTransmission: false,
    antialias: true,
    environmentIntensity: 1.15,
    toneMappingExposure: 1.42,
    powerPreference: 'default',
    maxAnisotropy: 4,
  },
  low: {
    qualityTier: 'low',
    tier: 'low',
    dpr: 1.0,
    shadowsEnabled: false,
    maxShadowMapSize: 512,
    contactShadowFrames: 1,
    transmissionEnabled: false,
    simplifyTransmission: true,
    antialias: false,
    environmentIntensity: 1.05,
    toneMappingExposure: 1.38,
    powerPreference: 'low-power',
    maxAnisotropy: 1,
  },
};

/**
 * Returns calibrated settings for a given QualityTier
 */
export function getTierSettings(tier: QualityTier): QualityTierSettings {
  return QUALITY_TIER_CONFIGS[tier] || QUALITY_TIER_CONFIGS.medium;
}

/**
 * Detect client hardware capabilities safely (SSR-compatible)
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      devicePixelRatio: 1,
      hardwareConcurrency: 4,
      deviceMemory: undefined,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouch: false,
      prefersReducedMotion: false,
      isLowPower: false,
      gpuRenderer: undefined,
      isDiscreteGpu: false,
      isSoftwareGpu: false,
    };
  }

  const dpr = typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : 1;
  const hardwareConcurrency = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 4;
  const deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;

  const ua = navigator.userAgent || '';
  const isTouch =
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    'ontouchstart' in window;

  const screenWidth = typeof window.innerWidth === 'number' ? window.innerWidth : 1024;
  const screenHeight = typeof window.innerHeight === 'number' ? window.innerHeight : 768;
  const minDimension = Math.min(screenWidth, screenHeight);

  // Mobile and tablet UA detection
  const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTabletUA = /iPad|tablet|(android(?!.*mobile))/i.test(ua);

  // Tablets: explicit tablet UA OR touch screen with tablet-class dimensions (600px - 1024px min dimension)
  const isTablet = isTabletUA || (isTouch && minDimension >= 600 && minDimension <= 1024 && !isMobileUA);
  // Phones: mobile UA OR touch screen with phone-class dimensions (< 600px)
  const isMobile = !isTablet && (isMobileUA || (isTouch && minDimension < 600));
  const isDesktop = !isMobile && !isTablet;

  // Accessibility & low-power preference detection
  let prefersReducedMotion = false;
  try {
    if (typeof window.matchMedia === 'function') {
      prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  } catch {
    prefersReducedMotion = false;
  }

  // GPU info via WebGL debug extension
  let gpuRenderer: string | undefined;
  let isDiscreteGpu = false;
  let isSoftwareGpu = false;

  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      } else {
        gpuRenderer = gl.getParameter(gl.RENDERER) || '';
      }

      if (gpuRenderer) {
        const lower = gpuRenderer.toLowerCase();

        // Software rasterizers (VMs, SwiftShader, Mesa llvmpipe)
        if (
          lower.includes('swiftshader') ||
          lower.includes('llvmpipe') ||
          lower.includes('software') ||
          lower.includes('microsoft basic render')
        ) {
          isSoftwareGpu = true;
        }

        // Discrete desktop GPUs (NVIDIA GeForce/RTX, AMD Radeon, Apple M Pro/Max)
        if (
          lower.includes('nvidia') ||
          lower.includes('geforce') ||
          lower.includes('rtx') ||
          lower.includes('gtx') ||
          lower.includes('quadro') ||
          lower.includes('radeon') ||
          (lower.includes('apple') && isDesktop)
        ) {
          isDiscreteGpu = true;
        }
      }

      // Dispose context
      const loseContext = gl.getExtension('WEBGL_lose_context');
      loseContext?.loseContext();
    }
  } catch {
    // WebGL disabled or restricted
  }

  return {
    devicePixelRatio: dpr,
    hardwareConcurrency,
    deviceMemory,
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    prefersReducedMotion,
    isLowPower: false,
    gpuRenderer,
    isDiscreteGpu,
    isSoftwareGpu,
  };
}

/**
 * Calculates the calibrated QualityTier from device capabilities
 */
export function calculateQualityTier(caps: DeviceCapabilities): QualityTier {
  // 1. Accessibility / Battery / Software Rendering override -> strictly 'low'
  if (caps.isSoftwareGpu || caps.prefersReducedMotion || caps.isLowPower) {
    return 'low';
  }

  // 2. Severe memory constraint (<= 2GB RAM)
  if (typeof caps.deviceMemory === 'number' && caps.deviceMemory <= 2) {
    return 'low';
  }

  // 3. Mobile Phones: strictly 'low'
  // Prevents 3x/4x mobile Retina overdraw stalls & heavy TBDR framebuffer blits
  if (caps.isMobile) {
    return 'low';
  }

  // 4. Low concurrency devices (<= 4 logical cores)
  if (caps.hardwareConcurrency <= 4) {
    return 'low';
  }

  // 5. Tablets: calibrated to 'medium'
  if (caps.isTablet) {
    return 'medium';
  }

  // 6. Mid-range laptops (concurrency between 5 and 7, or <= 4GB RAM without discrete GPU)
  if (caps.hardwareConcurrency < 8 && !caps.isDiscreteGpu) {
    return 'medium';
  }

  if (typeof caps.deviceMemory === 'number' && caps.deviceMemory <= 4 && !caps.isDiscreteGpu) {
    return 'medium';
  }

  // 7. Desktop with discrete GPU or high concurrency (>= 8 cores): 'high'
  if (caps.isDesktop && (caps.isDiscreteGpu || caps.hardwareConcurrency >= 8)) {
    return 'high';
  }

  // Fallback to medium
  return 'medium';
}

/**
 * Adaptive Quality & DPR Tier Controller Hook
 *
 * Detects device hardware (DPR, CPU concurrency, memory, GPU, battery, reduced motion)
 * and dynamically provides calibrated rendering parameters for Three.js / R3F canvases.
 */
export function useQualityTier(options?: UseQualityTierOptions): UseQualityTierResult {
  const initialTier = options?.initialTier ?? 'high';
  const externalOverride = options?.overrideTier ?? null;

  const [tierOverride, setInternalOverride] = useState<QualityTier | null>(externalOverride);
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(() => detectDeviceCapabilities());
  const [isHydrated, setIsHydrated] = useState(false);

  // Sync external override prop if it changes
  useEffect(() => {
    if (externalOverride !== undefined) {
      setInternalOverride(externalOverride);
    }
  }, [externalOverride]);

  // Client-side detection & event listeners
  useEffect(() => {
    const caps = detectDeviceCapabilities();
    setCapabilities(caps);
    setIsHydrated(true);

    let isMounted = true;

    // Battery status listener (low-power detection)
    let batteryCleanup: (() => void) | undefined;
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as unknown as { getBattery: () => Promise<any> })
        .getBattery()
        .then((battery) => {
          if (!isMounted) return;
          const updateBattery = () => {
            if (!isMounted) return;
            const isLowPower = !battery.charging && battery.level <= 0.2;
            setCapabilities((prev) => (prev.isLowPower !== isLowPower ? { ...prev, isLowPower } : prev));
          };
          updateBattery();
          battery.addEventListener('levelchange', updateBattery);
          battery.addEventListener('chargingchange', updateBattery);
          batteryCleanup = () => {
            battery.removeEventListener('levelchange', updateBattery);
            battery.removeEventListener('chargingchange', updateBattery);
          };
        })
        .catch(() => {});
    }

    // Media query listener for prefers-reduced-motion
    let motionCleanup: (() => void) | undefined;
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handleMotionChange = (e: MediaQueryListEvent) => {
        if (!isMounted) return;
        setCapabilities((prev) => ({ ...prev, prefersReducedMotion: e.matches }));
      };
      if (motionQuery.addEventListener) {
        motionQuery.addEventListener('change', handleMotionChange);
        motionCleanup = () => motionQuery.removeEventListener('change', handleMotionChange);
      }
    }

    // Window resize listener to recheck screen bounds / orientation
    const handleResize = () => {
      if (!isMounted) return;
      setCapabilities((prev) => {
        const next = detectDeviceCapabilities();
        if (
          prev.isMobile !== next.isMobile ||
          prev.isTablet !== next.isTablet ||
          prev.devicePixelRatio !== next.devicePixelRatio
        ) {
          return { ...prev, ...next };
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      batteryCleanup?.();
      motionCleanup?.();
    };
  }, []);

  const activeTier: QualityTier = useMemo(() => {
    if (tierOverride) {
      return tierOverride;
    }
    if (!isHydrated) {
      return initialTier;
    }
    return calculateQualityTier(capabilities);
  }, [tierOverride, isHydrated, initialTier, capabilities]);

  const tierSettings = useMemo(() => getTierSettings(activeTier), [activeTier]);

  const setTierOverride = useCallback((tier: QualityTier | 'auto' | null) => {
    if (tier === 'auto' || tier === null) {
      setInternalOverride(null);
    } else {
      setInternalOverride(tier);
    }
  }, []);

  return {
    ...tierSettings,
    ...capabilities,
    qualityTier: activeTier,
    tier: activeTier,
    isHydrated,
    setTierOverride,
    tierOverride,
  };
}
