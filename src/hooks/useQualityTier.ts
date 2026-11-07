'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  CompressedTextureSupport,
  DeviceLogicalTier,
  DevicePlatform,
  EffectiveNetworkType,
  PrimaryEnvironment,
  RenderingProfileName,
  ThermalPressureState,
} from '../lib/three/device-capabilities';
import type {
  DegradationStep,
  LodLevel,
  QualityManager,
  QualityManagerState,
  QualityOverrideInput,
} from '../lib/three/quality-manager';

export type QualityTier = 'high' | 'medium' | 'low';

export type {
  RenderingProfileName,
  DeviceLogicalTier,
  PrimaryEnvironment,
  DevicePlatform,
  ThermalPressureState,
  DegradationStep,
  LodLevel,
};

export const QUALITY_OVERRIDE_STORAGE_KEY = 'golden-oak:quality-override';

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

  // Extended multi-signal fields (optional on input interface for backward compatibility)
  environment?: PrimaryEnvironment;
  platform?: DevicePlatform;
  logicalTier?: DeviceLogicalTier;
  androidTier?: DeviceLogicalTier | null;
  recommendedProfile?: RenderingProfileName;
  webgl2Available?: boolean;
  webgl1Available?: boolean;
  webgpuAvailable?: boolean;
  maxTextureSize?: number;
  ktx2Supported?: boolean;
  astcSupported?: boolean;
  etc2Supported?: boolean;
  compressedTextures?: CompressedTextureSupport;
  saveData?: boolean;
  effectiveNetworkType?: EffectiveNetworkType;
  thermalState?: ThermalPressureState;
}

export interface QualityTierSettings {
  /** Calibrated quality tier identifier */
  qualityTier: QualityTier;
  /** Short tier alias */
  tier: QualityTier;
  /** 3-profile rendering strategy identifier */
  profile: RenderingProfileName;
  /** DPR clamped to prevent fill-rate overload */
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
  /** Geometry Level-of-Detail index (0 = full detail, 1 = mid LOD, 2 = low-poly LOD) */
  lodLevel: LodLevel;
  /** Whether expensive post-processing passes are enabled */
  postProcessingEnabled: boolean;
  /** Whether secondary PBR detail maps & reflections are enabled */
  secondaryMaterialEffects: boolean;
  /** Maximum allowed texture dimension in pixels (512, 1024, or 2048) */
  maxTextureDimension: number;
}

export interface UseQualityTierResult extends QualityTierSettings, DeviceCapabilities {
  /** Active 3-profile rendering strategy ('ultra-light' | 'balanced' | 'high-fidelity') */
  profile: RenderingProfileName;
  /** Logical hardware classification ('low-end' | 'mid-range' | 'high-end') */
  logicalTier: DeviceLogicalTier;
  /** Android-specific tier classification, or null on non-Android platforms */
  androidTier: DeviceLogicalTier | null;
  /** Primary execution environment ('web-desktop' | 'phone') */
  environment: PrimaryEnvironment;
  /** Concrete platform ('android' | 'ios' | 'windows' | 'macos' | 'tablet' | 'other') */
  platform: DevicePlatform;
  /** Current dynamic runtime degradation step (0 = baseline .. 6 = max relief) */
  degradationStep: DegradationStep;
  /** Active resolution scale factor applied during runtime adaptation (0.75..1.0) */
  dprScale: number;
  /** Geometry LOD level (0, 1, or 2) */
  lodLevel: LodLevel;
  /** Whether post-processing effects are active */
  postProcessingEnabled: boolean;
  /** Whether secondary PBR material maps/reflections are active */
  secondaryMaterialEffects: boolean;
  /** Maximum texture dimension budget in pixels */
  maxTextureDimension: number;
  /** Whether KTX2 BasisU GPU-compressed textures are supported */
  ktx2Supported: boolean;
  /** Whether ASTC hardware texture compression is supported */
  astcSupported: boolean;
  /** Whether ETC2 hardware texture compression is supported */
  etc2Supported: boolean;
  /** Whether WebGPU (`navigator.gpu`) is available */
  webgpuAvailable: boolean;
  /** Whether WebGL2 is available */
  webgl2Available: boolean;
  /** Whether WebGL1 is available */
  webgl1Available: boolean;
  /** Thermal / compute pressure state ('nominal' | 'fair' | 'serious' | 'critical' | 'unsupported') */
  thermalState: ThermalPressureState;
  /** Whether Data Saver (`navigator.connection.saveData`) is enabled */
  saveData: boolean;
  /** Effective network category ('slow-2g' | '2g' | '3g' | '4g' | 'unknown') */
  effectiveNetworkType: EffectiveNetworkType;
  /** Indicates whether client-side hardware capability detection has completed */
  isHydrated: boolean;
  /** Programmatically override tier/profile or reset to automatic ('auto' or null) */
  setTierOverride: (tier: QualityTier | RenderingProfileName | 'auto' | null) => void;
  /** Alias for setting 3-profile override ('ultra-light' | 'balanced' | 'high-fidelity' | 'auto' | null) */
  setProfileOverride: (profile: QualityOverrideInput) => void;
  /** Currently active legacy tier override, or null if automatic */
  tierOverride: QualityTier | null;
  /** Currently active 3-profile override, or null if automatic */
  profileOverride: RenderingProfileName | null;
}

export interface UseQualityTierOptions {
  /** Initial fallback tier before hydration (defaults to 'high' for rich initial paint) */
  initialTier?: QualityTier;
  /** Forced tier or profile override (for testing or user settings) */
  overrideTier?: QualityTier | RenderingProfileName | null;
}

/**
 * Calibrated Tier Configurations (100% backward-compatible with LookDev & DPR benchmarks)
 */
export const QUALITY_TIER_CONFIGS: Record<QualityTier, QualityTierSettings> = {
  high: {
    qualityTier: 'high',
    tier: 'high',
    profile: 'high-fidelity',
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
    lodLevel: 0,
    postProcessingEnabled: true,
    secondaryMaterialEffects: true,
    maxTextureDimension: 2048,
  },
  medium: {
    qualityTier: 'medium',
    tier: 'medium',
    profile: 'balanced',
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
    lodLevel: 1,
    postProcessingEnabled: false,
    secondaryMaterialEffects: true,
    maxTextureDimension: 1024,
  },
  low: {
    qualityTier: 'low',
    tier: 'low',
    profile: 'ultra-light',
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
    lodLevel: 2,
    postProcessingEnabled: false,
    secondaryMaterialEffects: false,
    maxTextureDimension: 512,
  },
};

interface CachedHookGLProbe {
  gpuRenderer?: string;
  isSoftwareGpu: boolean;
  webgl2Available: boolean;
  webgl1Available: boolean;
  maxTextureSize: number;
  compressedTextures: CompressedTextureSupport;
}

// Module-level GL probe cache so resize / re-renders never allocate extra WebGL contexts
let cachedHookGLProbe: CachedHookGLProbe | null = null;

function probeHookGLOnce(): CachedHookGLProbe {
  if (cachedHookGLProbe) {
    return cachedHookGLProbe;
  }

  let gpuRenderer: string | undefined;
  let isSoftwareGpu = false;
  let webgl2Available = false;
  let webgl1Available = false;
  let maxTextureSize = 4096;
  let compressedTextures: CompressedTextureSupport = {
    astc: false,
    etc2: false,
    etc1: false,
    s3tc: false,
    bptc: false,
    pvrtc: false,
    ktx2Supported: false,
    preferredFormat: 'rgba8',
  };

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    let gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
      if (gl) {
        webgl2Available = true;
        webgl1Available = true;
      }
    } catch {
      gl = null;
    }

    if (!gl) {
      gl = (canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      if (gl) {
        webgl1Available = true;
      }
    }

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      } else {
        gpuRenderer = gl.getParameter(gl.RENDERER) || '';
      }

      maxTextureSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 4096;

      if (gpuRenderer) {
        const lower = gpuRenderer.toLowerCase();
        if (
          lower.includes('swiftshader') ||
          lower.includes('llvmpipe') ||
          lower.includes('softpipe') ||
          lower.includes('lavapipe') ||
          lower.includes('software') ||
          lower.includes('microsoft basic render')
        ) {
          isSoftwareGpu = true;
        }
      }

      const astc = Boolean(gl.getExtension('WEBGL_compressed_texture_astc'));
      const etc2 = Boolean(gl.getExtension('WEBGL_compressed_texture_etc'));
      const etc1 = Boolean(gl.getExtension('WEBGL_compressed_texture_etc1'));
      const s3tc = Boolean(
        gl.getExtension('WEBGL_compressed_texture_s3tc') ||
          gl.getExtension('MOZ_WEBGL_compressed_texture_s3tc') ||
          gl.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc')
      );
      const bptc = Boolean(gl.getExtension('EXT_texture_compression_bptc'));
      const pvrtc = Boolean(
        gl.getExtension('WEBGL_compressed_texture_pvrtc') ||
          gl.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc')
      );
      const preferredFormat = astc
        ? 'astc'
        : bptc
          ? 'bptc'
          : etc2
            ? 'etc2'
            : s3tc
              ? 's3tc'
              : pvrtc
                ? 'pvrtc'
                : etc1
                  ? 'etc1'
                  : 'rgba8';

      compressedTextures = {
        astc,
        etc2,
        etc1,
        s3tc,
        bptc,
        pvrtc,
        ktx2Supported: webgl2Available && preferredFormat !== 'rgba8',
        preferredFormat,
      };

      const loseContext = gl.getExtension('WEBGL_lose_context');
      loseContext?.loseContext();
    }
  } catch {
    // WebGL disabled or restricted
  }

  cachedHookGLProbe = {
    gpuRenderer,
    isSoftwareGpu,
    webgl2Available,
    webgl1Available,
    maxTextureSize,
    compressedTextures,
  };
  return cachedHookGLProbe;
}

function classifyGpuStrengthForProfile(
  gpuRenderer: string | undefined,
  isDesktop: boolean,
  webgl2Available: boolean,
  webgpuAvailable: boolean,
  maxTextureSize: number,
  dpr: number,
  maxViewportDim: number,
  cores: number
): 'low-end' | 'mid-range' | 'high-end' | 'software' {
  if (!gpuRenderer) {
    return webgl2Available && maxTextureSize >= 16384 ? 'mid-range' : 'low-end';
  }
  const lower = gpuRenderer.toLowerCase();
  if (
    lower.includes('swiftshader') ||
    lower.includes('llvmpipe') ||
    lower.includes('software') ||
    lower.includes('microsoft basic render')
  ) {
    return 'software';
  }
  if (lower.includes('adreno')) {
    const m = lower.match(/adreno\s*(?:\(tm\))?\s*(\d{3,4})/i);
    const num = m ? parseInt(m[1], 10) : 610;
    if (num >= 730) return 'high-end';
    if (num === 702) return 'low-end';
    if ((num >= 618 && num <= 699) || (num >= 710 && num < 730)) return 'mid-range';
    return 'low-end';
  }
  if (lower.includes('immortalis')) return 'high-end';
  if (lower.includes('xclipse')) {
    const m = lower.match(/xclipse\s*(\d{3})/i);
    return m && parseInt(m[1], 10) >= 900 ? 'high-end' : 'mid-range';
  }
  if (lower.includes('mali')) {
    if (/mali[-\s]*(4\d\d|t\d\d\d)/i.test(lower)) return 'low-end';
    const gm = lower.match(/mali[-\s]*g(\d{2,3})(?:\s*mc(\d+))?/i);
    if (gm) {
      const g = parseInt(gm[1], 10);
      const mc = gm[2] ? parseInt(gm[2], 10) : undefined;
      if (g <= 52 || (g === 57 && (mc === undefined || mc <= 2))) return 'low-end';
      if (g >= 715 || (g === 710 && mc !== undefined && mc >= 10)) return 'high-end';
      return 'mid-range';
    }
    return 'low-end';
  }
  if (lower.includes('powervr') || lower.includes('rogue') || /\bge8\d{3}\b/i.test(lower)) {
    return 'low-end';
  }
  if (lower.includes('apple')) {
    if (/apple\s+m[1-9]/i.test(lower) || isDesktop) return 'high-end';
    const am = lower.match(/apple\s+a(\d{1,2})/i);
    if (am) {
      const gen = parseInt(am[1], 10);
      return gen >= 15 ? 'high-end' : gen >= 11 ? 'mid-range' : 'low-end';
    }
    if (webgpuAvailable || (webgl2Available && maxTextureSize >= 16384 && dpr >= 3 && maxViewportDim >= 844 && cores >= 6)) {
      return 'high-end';
    }
    return webgl2Available ? 'mid-range' : 'low-end';
  }
  if (
    lower.includes('nvidia') ||
    lower.includes('geforce') ||
    lower.includes('rtx') ||
    lower.includes('gtx') ||
    lower.includes('radeon rx') ||
    lower.includes('intel arc')
  ) {
    return 'high-end';
  }
  return 'mid-range';
}

/**
 * Returns calibrated settings for a given QualityTier
 */
export function getTierSettings(tier: QualityTier): QualityTierSettings {
  return QUALITY_TIER_CONFIGS[tier] || QUALITY_TIER_CONFIGS.medium;
}

function tierToProfile(tier: QualityTier): RenderingProfileName {
  if (tier === 'high') return 'high-fidelity';
  if (tier === 'medium') return 'balanced';
  return 'ultra-light';
}

function profileToTier(profile: RenderingProfileName): QualityTier {
  if (profile === 'high-fidelity') return 'high';
  if (profile === 'balanced') return 'medium';
  return 'low';
}

function normalizeOverrideToTierAndProfile(
  val: QualityTier | RenderingProfileName | 'auto' | null | undefined
): { tier: QualityTier | null; profile: RenderingProfileName | null } {
  if (!val || val === 'auto') {
    return { tier: null, profile: null };
  }
  if (val === 'high' || val === 'medium' || val === 'low') {
    return { tier: val, profile: tierToProfile(val) };
  }
  if (val === 'high-fidelity' || val === 'balanced' || val === 'ultra-light') {
    return { tier: profileToTier(val), profile: val };
  }
  return { tier: null, profile: null };
}

/**
 * Detect client hardware capabilities safely (SSR-compatible, WebGL-probe cached)
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
      environment: 'web-desktop',
      platform: 'other',
      logicalTier: 'mid-range',
      androidTier: null,
      recommendedProfile: 'balanced',
      webgl2Available: true,
      webgl1Available: true,
      webgpuAvailable: false,
      maxTextureSize: 8192,
      ktx2Supported: false,
      astcSupported: false,
      etc2Supported: false,
      saveData: false,
      effectiveNetworkType: 'unknown',
      thermalState: 'unsupported',
    };
  }

  const dpr = typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : 1;
  const hardwareConcurrency =
    typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 4;
  const deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;

  const ua = navigator.userAgent || '';
  const isTouch = Boolean(
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || 'ontouchstart' in window
  );

  const screenWidth = typeof window.innerWidth === 'number' ? window.innerWidth : 1024;
  const screenHeight = typeof window.innerHeight === 'number' ? window.innerHeight : 768;
  const minDimension = Math.min(screenWidth, screenHeight);
  const maxDimension = Math.max(screenWidth, screenHeight);

  const isAndroidUA = /Android/i.test(ua);
  const isIPhoneUA = /iPhone|iPod/i.test(ua);
  const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTabletUA = /iPad|tablet|(android(?!.*mobile))/i.test(ua);

  const isTablet =
    isTabletUA || (isTouch && minDimension >= 600 && minDimension <= 1024 && !isMobileUA);
  const isMobile = !isTablet && (isMobileUA || (isTouch && minDimension < 600));
  const isDesktop = !isMobile && !isTablet;

  const environment: PrimaryEnvironment = isMobile ? 'phone' : 'web-desktop';
  let platform: DevicePlatform = 'other';
  if (isAndroidUA && isMobile) platform = 'android';
  else if (isIPhoneUA) platform = 'ios';
  else if (isTablet) platform = isAndroidUA ? 'android' : 'tablet';
  else if (/Windows/i.test(ua)) platform = 'windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) platform = 'macos';

  let prefersReducedMotion = false;
  try {
    if (typeof window.matchMedia === 'function') {
      prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  } catch {
    prefersReducedMotion = false;
  }

  const webgpuAvailable = 'gpu' in navigator;
  const glProbe = probeHookGLOnce();
  const gpuRenderer = glProbe.gpuRenderer;
  const isSoftwareGpu = glProbe.isSoftwareGpu;

  let isDiscreteGpu = false;
  if (gpuRenderer) {
    const lower = gpuRenderer.toLowerCase();
    if (
      lower.includes('nvidia') ||
      lower.includes('geforce') ||
      lower.includes('rtx') ||
      lower.includes('gtx') ||
      lower.includes('quadro') ||
      lower.includes('radeon') ||
      lower.includes('intel arc') ||
      (lower.includes('apple') && isDesktop)
    ) {
      isDiscreteGpu = true;
    }
  }

  const navConn = (
    navigator as unknown as {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  const saveData = Boolean(navConn?.saveData ?? false);
  const rawEff = navConn?.effectiveType;
  const effectiveNetworkType: EffectiveNetworkType =
    rawEff === 'slow-2g' || rawEff === '2g' || rawEff === '3g' || rawEff === '4g'
      ? rawEff
      : 'unknown';

  const gpuStrength = classifyGpuStrengthForProfile(
    gpuRenderer,
    isDesktop,
    glProbe.webgl2Available,
    webgpuAvailable,
    glProbe.maxTextureSize,
    dpr,
    maxDimension,
    hardwareConcurrency
  );

  let logicalTier: DeviceLogicalTier = 'mid-range';
  if (
    isSoftwareGpu ||
    !glProbe.webgl1Available ||
    gpuStrength === 'software' ||
    gpuStrength === 'low-end' ||
    (typeof deviceMemory === 'number' && deviceMemory <= 2)
  ) {
    logicalTier = 'low-end';
  } else if (gpuStrength === 'high-end' && hardwareConcurrency >= 6) {
    logicalTier = 'high-end';
  } else {
    logicalTier = 'mid-range';
  }

  let recommendedProfile: RenderingProfileName =
    logicalTier === 'high-end'
      ? 'high-fidelity'
      : logicalTier === 'mid-range'
        ? 'balanced'
        : 'ultra-light';

  if (
    isSoftwareGpu ||
    prefersReducedMotion ||
    saveData ||
    effectiveNetworkType === 'slow-2g' ||
    effectiveNetworkType === '2g'
  ) {
    recommendedProfile = 'ultra-light';
  } else if (effectiveNetworkType === '3g' && recommendedProfile === 'high-fidelity') {
    recommendedProfile = 'balanced';
  }

  const thermalState: ThermalPressureState =
    typeof globalThis !== 'undefined' && 'PressureObserver' in globalThis
      ? 'nominal'
      : 'unsupported';

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
    environment,
    platform,
    logicalTier,
    androidTier: platform === 'android' ? logicalTier : null,
    recommendedProfile,
    webgl2Available: glProbe.webgl2Available,
    webgl1Available: glProbe.webgl1Available,
    webgpuAvailable,
    maxTextureSize: glProbe.maxTextureSize,
    ktx2Supported: glProbe.compressedTextures.ktx2Supported,
    astcSupported: glProbe.compressedTextures.astc,
    etc2Supported: glProbe.compressedTextures.etc2,
    compressedTextures: glProbe.compressedTextures,
    saveData,
    effectiveNetworkType,
    thermalState,
  };
}

/**
 * Calculates the calibrated legacy QualityTier ('high' | 'medium' | 'low') from device capabilities.
 * Preserves 100% deterministic backward compatibility with existing floorplan & LookDev tests.
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

  // 3. Mobile Phones: strictly 'low' in legacy tier mapping
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
 * Calculates the multi-signal 3-profile rendering strategy ('ultra-light' | 'balanced' | 'high-fidelity')
 * without relying on RAM alone or penalizing browsers where `deviceMemory` is undefined.
 */
export function calculateRenderingProfile(caps: DeviceCapabilities): RenderingProfileName {
  if (
    caps.isSoftwareGpu ||
    caps.prefersReducedMotion ||
    caps.isLowPower ||
    caps.saveData ||
    caps.effectiveNetworkType === 'slow-2g' ||
    caps.effectiveNetworkType === '2g' ||
    caps.thermalState === 'critical'
  ) {
    return 'ultra-light';
  }

  if (caps.recommendedProfile) {
    if (caps.thermalState === 'serious' && caps.recommendedProfile === 'high-fidelity') {
      return 'balanced';
    }
    return caps.recommendedProfile;
  }

  const tier = calculateQualityTier(caps);
  return tierToProfile(tier);
}

interface GlobalManagerSlot {
  __GOLDEN_OAK_QUALITY_MANAGER__?: QualityManager;
}

function readGlobalManagerSnapshot(): QualityManagerState | null {
  const g = globalThis as unknown as GlobalManagerSlot;
  return g.__GOLDEN_OAK_QUALITY_MANAGER__?.getSnapshot() ?? null;
}

/**
 * Adaptive Quality & DPR Tier Controller Hook
 *
 * Detects multi-signal device capabilities (GPU architecture, WebGL2/WebGPU, compressed
 * texture formats, DPR fill-rate, CPU concurrency, optional RAM/heap, network, battery,
 * reduced motion, thermal pressure) and synchronizes with `<AdaptiveQualityController />`
 * runtime hysteresis state when mounted.
 */
export function useQualityTier(options?: UseQualityTierOptions): UseQualityTierResult {
  const initialTier = options?.initialTier ?? 'high';
  const externalOverride = options?.overrideTier ?? null;

  const initialParsed = normalizeOverrideToTierAndProfile(externalOverride);
  const [tierOverride, setInternalTierOverride] = useState<QualityTier | null>(initialParsed.tier);
  const [profileOverride, setInternalProfileOverride] = useState<RenderingProfileName | null>(
    initialParsed.profile
  );
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(() =>
    detectDeviceCapabilities()
  );
  const [runtimeState, setRuntimeState] = useState<QualityManagerState | null>(() =>
    readGlobalManagerSnapshot()
  );
  const [isHydrated, setIsHydrated] = useState(false);

  // Sync external override prop if it changes
  useEffect(() => {
    if (externalOverride !== undefined) {
      const parsed = normalizeOverrideToTierAndProfile(externalOverride);
      setInternalTierOverride(parsed.tier);
      setInternalProfileOverride(parsed.profile);
    }
  }, [externalOverride]);

  // Client-side detection, persisted override hydration, & hardware/runtime event listeners
  useEffect(() => {
    const caps = detectDeviceCapabilities();
    setCapabilities(caps);
    setIsHydrated(true);

    // Load persisted user override if no explicit prop override was supplied
    if (!externalOverride) {
      try {
        const stored = window.localStorage?.getItem(QUALITY_OVERRIDE_STORAGE_KEY);
        if (stored) {
          const parsed = normalizeOverrideToTierAndProfile(stored as QualityTier | RenderingProfileName);
          if (parsed.tier && parsed.profile) {
            setInternalTierOverride(parsed.tier);
            setInternalProfileOverride(parsed.profile);
          }
        }
      } catch {
        // Ignore storage restrictions
      }
    }

    let isMounted = true;

    // Subscribe to live QualityManager runtime step-down/step-up state if active
    let managerUnsubscribe: (() => void) | undefined;
    const attachGlobalManager = () => {
      const g = globalThis as unknown as GlobalManagerSlot;
      const mgr = g.__GOLDEN_OAK_QUALITY_MANAGER__;
      if (!mgr || !isMounted) return;
      managerUnsubscribe?.();
      setRuntimeState(mgr.getSnapshot());
      managerUnsubscribe = mgr.subscribe(() => {
        if (!isMounted) return;
        setRuntimeState(mgr.getSnapshot());
      });
    };

    attachGlobalManager();
    const handleManagerReady = () => attachGlobalManager();
    window.addEventListener('golden-oak:quality-manager-ready', handleManagerReady);

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
            setCapabilities((prev) =>
              prev.isLowPower !== isLowPower ? { ...prev, isLowPower } : prev
            );
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

    // Window resize listener to recheck screen bounds / orientation (reuses cached GL probe!)
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
      window.removeEventListener('golden-oak:quality-manager-ready', handleManagerReady);
      managerUnsubscribe?.();
      batteryCleanup?.();
      motionCleanup?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeTier: QualityTier = useMemo(() => {
    if (tierOverride) {
      return tierOverride;
    }
    if (!isHydrated) {
      return initialTier;
    }
    if (runtimeState && runtimeState.degradationStep > 0) {
      // Reflect severe runtime degradation in legacy consumers when active
      if (runtimeState.degradationStep >= 4) return 'low';
      if (runtimeState.degradationStep >= 2 && runtimeState.legacyTier === 'high') return 'medium';
    }
    return calculateQualityTier(capabilities);
  }, [tierOverride, isHydrated, initialTier, capabilities, runtimeState]);

  const activeProfile: RenderingProfileName = useMemo(() => {
    if (profileOverride) {
      return profileOverride;
    }
    if (!isHydrated) {
      return tierToProfile(initialTier);
    }
    if (runtimeState) {
      return runtimeState.effective.profile;
    }
    return calculateRenderingProfile(capabilities);
  }, [profileOverride, isHydrated, initialTier, capabilities, runtimeState]);

  const tierSettings = useMemo(() => getTierSettings(activeTier), [activeTier]);

  const applyOverride = useCallback(
    (input: QualityTier | RenderingProfileName | 'auto' | null) => {
      const parsed = normalizeOverrideToTierAndProfile(input);
      setInternalTierOverride(parsed.tier);
      setInternalProfileOverride(parsed.profile);

      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          if (parsed.profile === null) {
            window.localStorage.removeItem(QUALITY_OVERRIDE_STORAGE_KEY);
          } else {
            window.localStorage.setItem(QUALITY_OVERRIDE_STORAGE_KEY, parsed.profile);
          }
        }
      } catch {
        // Ignore storage restrictions
      }

      const g = globalThis as unknown as GlobalManagerSlot;
      g.__GOLDEN_OAK_QUALITY_MANAGER__?.setOverride(parsed.profile ?? 'auto');
    },
    []
  );

  const eff = runtimeState?.effective;
  const degradationStep: DegradationStep = runtimeState?.degradationStep ?? 0;
  const dprScale = eff?.dprScale ?? 1.0;
  const lodLevel: LodLevel = eff ? eff.lodLevel : QUALITY_TIER_CONFIGS[profileToTier(activeProfile)].lodLevel;
  const postProcessingEnabled = eff
    ? eff.postProcessingEnabled
    : activeProfile === 'high-fidelity' && !capabilities.isLowPower && !capabilities.prefersReducedMotion;
  const secondaryMaterialEffects = eff
    ? eff.secondaryMaterialEffects
    : activeProfile !== 'ultra-light';
  const maxTextureDimension = eff
    ? eff.maxTextureDimension
    : activeProfile === 'high-fidelity'
      ? 2048
      : activeProfile === 'balanced'
        ? 1024
        : 512;

  return {
    ...tierSettings,
    ...capabilities,
    qualityTier: activeTier,
    tier: activeTier,
    profile: activeProfile,
    dpr: degradationStep > 0 && eff ? eff.effectiveDpr : tierSettings.dpr,
    shadowsEnabled:
      degradationStep >= 2 && eff ? eff.shadowsEnabled : tierSettings.shadowsEnabled,
    transmissionEnabled:
      degradationStep >= 4 && eff ? eff.transmissionEnabled : tierSettings.transmissionEnabled,
    simplifyTransmission:
      degradationStep >= 4 && eff ? eff.simplifyTransmission : tierSettings.simplifyTransmission,
    logicalTier: capabilities.logicalTier ?? 'mid-range',
    androidTier: capabilities.androidTier ?? null,
    environment: capabilities.environment ?? (capabilities.isMobile ? 'phone' : 'web-desktop'),
    platform: capabilities.platform ?? 'other',
    degradationStep,
    dprScale,
    lodLevel,
    postProcessingEnabled,
    secondaryMaterialEffects,
    maxTextureDimension,
    ktx2Supported: capabilities.ktx2Supported ?? false,
    astcSupported: capabilities.astcSupported ?? false,
    etc2Supported: capabilities.etc2Supported ?? false,
    webgpuAvailable: capabilities.webgpuAvailable ?? false,
    webgl2Available: capabilities.webgl2Available ?? true,
    webgl1Available: capabilities.webgl1Available ?? true,
    thermalState: runtimeState?.thermalState ?? capabilities.thermalState ?? 'unsupported',
    saveData: capabilities.saveData ?? false,
    effectiveNetworkType: capabilities.effectiveNetworkType ?? 'unknown',
    isHydrated,
    setTierOverride: applyOverride,
    setProfileOverride: applyOverride,
    tierOverride,
    profileOverride,
  };
}
