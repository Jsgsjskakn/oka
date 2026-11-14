/**
 * THE GOLDEN OAK — Phase 3.2 Mobile Performance & XR Quality Profile Engine
 *
 * Implements:
 * 1. Multi-signal device capability classification across all 9 target device personas.
 * 2. Resolution of calibrated WebXR session quality profiles (ultra-light, balanced, high-fidelity).
 * 3. XRFrameTimeMonitor with rolling p50/p90/p95 frame delta metrics.
 * 4. Exact 5-tier gradual degradation order:
 *    framebuffer scale -> shadows -> light estimation -> LOD -> textures.
 * 5. Hysteresis cooldowns, sustained smooth duration, and oscillation ceiling lock.
 * 6. TRACKING STABILITY FIRST invariant: hit-test and anchor subsystems are never disabled to save perf.
 * 7. Pure TypeScript, zero DOM/Canvas runtime requirement, 100% node --test importable.
 */

import type { ARExperienceRoute } from './spatial-contract';
import type {
  ExtendedDeviceCapabilities,
  GpuArchitectureTier,
  GpuVendorFamily,
  ThermalPressureState,
} from '../three/device-capabilities';

// ---------------------------------------------------------------------------
// 1. Core Profile & Shadow Types
// ---------------------------------------------------------------------------

export type XRProfileName = 'ultra-light' | 'balanced' | 'high-fidelity';
export type XRShadowTechnique = 'contact-blob' | 'contact-shadow-texture' | 'shadow-map';
export type XRLodTier = 0 | 1 | 2; // 0 = high-fidelity, 1 = balanced, 2 = ultra-light

export interface XRSessionQualityProfile {
  profile: XRProfileName;
  /** Viewport framebuffer resolution multiplier (e.g. 0.75 for ultra-light, 1.0 for balanced, 1.0..1.25 for high). */
  framebufferScaleFactor: number;
  /** Fixed foveation level (0.0 = off, 0.5 = medium, 1.0 = maximum). Supported on WebXR XRWebGLLayer. */
  foveation: number;
  /** Shadow technique: planar contact blob (zero FBO), contact texture, or directional shadow map. */
  shadowTechnique: XRShadowTechnique;
  /** Maximum texture mip dimension in pixels (512, 1024, or 2048). */
  textureMaxDimension: number;
  /** Active LOD level: 0 = high-fidelity master, 1 = balanced, 2 = ultralight. */
  lodTier: XRLodTier;
  /** Whether to sample and apply WebXR light estimation reflection probes and spherical harmonics. */
  useLightEstimation: boolean;
  /** Maximum recommended simultaneous dishes in the scene to preserve 60 FPS fill-rate. */
  maxConcurrentDishes: number;
  /** Hardware MSAA antialiasing enabled on the WebGL/WebXR framebuffer. */
  antialias: boolean;
  /** Target device pixel ratio ceiling for overlay and non-XR elements. */
  dpr: number;
  /** WebGL power preference hint. */
  powerPreference: 'low-power' | 'default' | 'high-performance';
  /** Max texture anisotropy level (1 = off, 2, 4). */
  maxAnisotropy: number;
  /** Environment lighting intensity multiplier. */
  environmentIntensity: number;
  /** Auditable list of classification rules and constraints applied. */
  reasons: string[];
}

// ---------------------------------------------------------------------------
// 2. Calibrated Base Profiles (Section 8 & Phase 3.2 Specs)
// ---------------------------------------------------------------------------

export const XR_BASE_PROFILES: Readonly<Record<XRProfileName, XRSessionQualityProfile>> = {
  'ultra-light': {
    profile: 'ultra-light',
    framebufferScaleFactor: 0.75,
    foveation: 1.0,
    shadowTechnique: 'contact-blob',
    textureMaxDimension: 512,
    lodTier: 2,
    useLightEstimation: false,
    maxConcurrentDishes: 1,
    antialias: false,
    dpr: 1.0,
    powerPreference: 'low-power',
    maxAnisotropy: 1,
    environmentIntensity: 1.0,
    reasons: ['base:ultra-light-calibrated'],
  },
  balanced: {
    profile: 'balanced',
    framebufferScaleFactor: 1.0,
    foveation: 0.5,
    shadowTechnique: 'contact-shadow-texture',
    textureMaxDimension: 1024,
    lodTier: 1,
    useLightEstimation: true,
    maxConcurrentDishes: 2,
    antialias: true,
    dpr: 1.25,
    powerPreference: 'default',
    maxAnisotropy: 2,
    environmentIntensity: 1.15,
    reasons: ['base:balanced-calibrated'],
  },
  'high-fidelity': {
    profile: 'high-fidelity',
    framebufferScaleFactor: 1.0,
    foveation: 0.0,
    shadowTechnique: 'shadow-map',
    textureMaxDimension: 2048,
    lodTier: 0,
    useLightEstimation: true,
    maxConcurrentDishes: 4,
    antialias: true,
    dpr: 1.5,
    powerPreference: 'high-performance',
    maxAnisotropy: 4,
    environmentIntensity: 1.25,
    reasons: ['base:high-fidelity-calibrated'],
  },
};

// ---------------------------------------------------------------------------
// 3. Multi-Signal Quality Resolution
// ---------------------------------------------------------------------------

export interface XRQualityResolutionInput {
  /** Optional existing device capabilities snapshot from device-capabilities.ts */
  capabilities?: Partial<ExtendedDeviceCapabilities> | null;
  /** Active AR experience route (from spatial-contract.ts) */
  arRoute?: ARExperienceRoute;
  /** Granted WebXR features for this session (e.g. ['hit-test', 'anchors', 'light-estimation']) */
  grantedXRFeatures?: readonly string[] | Set<string> | null;
  /** W3C Compute Pressure or OS thermal state */
  thermalHint?: ThermalPressureState | 'nominal' | 'fair' | 'serious' | 'critical' | 'unsupported' | string;
  /** Alias for thermalHint */
  thermalState?: ThermalPressureState | 'nominal' | 'fair' | 'serious' | 'critical' | 'unsupported' | string;
  /** Battery state or level hint */
  batteryState?: string | { level?: number; charging?: boolean } | null;
  batteryLevel?: number;
  batteryCharging?: boolean;
  /** Rolling or past frame metrics if available */
  measuredFrameTimes?: {
    p50Ms?: number;
    p90Ms?: number;
    p95Ms?: number;
    averageFps?: number;
  };
  /** Explicit manual user override */
  overrideProfile?: XRProfileName | null;
  /** Network Data-Saver hint */
  saveData?: boolean;
  /** Battery saver hint */
  isLowPower?: boolean;
  /** GPU Unmasked Renderer string fallback */
  gpuRenderer?: string;
  /** GPU Architecture tier fallback */
  gpuTier?: GpuArchitectureTier;
  /** Device RAM in GiB (undefined on Safari/iOS & Firefox) */
  deviceMemory?: number;
  /** Platform identifier string */
  platform?: string;
  /** Mobile viewport hint */
  isMobile?: boolean;
  /** Device Pixel Ratio */
  devicePixelRatio?: number;
  /** Software GPU flag */
  isSoftwareGpu?: boolean;
  /** Hardware concurrency */
  hardwareConcurrency?: number;
}

/**
 * Pure heuristic GPU family and tier classifier for standalone or fallback inputs.
 * Ensures the 8GB budget phone trap (Adreno 610 + 8GB RAM) is correctly categorized as low-end,
 * and Apple A15-A17 / M1-M3 with undefined deviceMemory are classified as high-end.
 */
export function classifyGpuArchitecture(rendererStr?: string): {
  family: GpuVendorFamily;
  tier: GpuArchitectureTier;
  isDiscrete: boolean;
  isSoftware: boolean;
} {
  if (!rendererStr) {
    return { family: 'unknown', tier: 'unknown', isDiscrete: false, isSoftware: false };
  }

  const norm = rendererStr.toLowerCase();

  // Software fallback
  if (
    norm.includes('swiftshader') ||
    norm.includes('llvmpipe') ||
    norm.includes('software rasterizer') ||
    norm.includes('mesa software')
  ) {
    return { family: 'software', tier: 'software', isDiscrete: false, isSoftware: true };
  }

  // Apple GPU (Apple A-series / M-series)
  if (norm.includes('apple') || norm.includes('metal')) {
    // A15/A16/A17/A18, M1/M2/M3/M4 or modern Apple Silicon
    if (
      norm.includes('m1') ||
      norm.includes('m2') ||
      norm.includes('m3') ||
      norm.includes('m4') ||
      norm.includes('a15') ||
      norm.includes('a16') ||
      norm.includes('a17') ||
      norm.includes('a18') ||
      norm.includes('pro') ||
      norm.includes('max')
    ) {
      return { family: 'apple', tier: 'high-end', isDiscrete: true, isSoftware: false };
    }
    // Older Apple: A12/A13/A14
    if (norm.includes('a12') || norm.includes('a13') || norm.includes('a14')) {
      return { family: 'apple', tier: 'mid-range', isDiscrete: false, isSoftware: false };
    }
    // Generic Apple GPU without specific chip string (e.g. Safari standard masked string)
    // Recent iOS devices with generic "Apple GPU" are mid-to-high
    return { family: 'apple', tier: 'high-end', isDiscrete: false, isSoftware: false };
  }

  // Qualcomm Adreno
  if (norm.includes('adreno')) {
    // High-end: 730, 740, 750, 830 (Snapdragon 8 Gen 1/2/3)
    if (/adreno\s*(?:[^\d]*)?(?:7[3-9]\d|8\d\d)/i.test(norm)) {
      return { family: 'adreno', tier: 'high-end', isDiscrete: false, isSoftware: false };
    }
    // Mid-range: 642, 650, 660, 710, 720, 725
    if (/adreno\s*(?:[^\d]*)?(?:64\d|65\d|66\d|71\d|72\d)/i.test(norm)) {
      return { family: 'adreno', tier: 'mid-range', isDiscrete: false, isSoftware: false };
    }
    // Low-end / entry: 610, 612, 616, 618, 619, 506, 510, etc.
    return { family: 'adreno', tier: 'low-end', isDiscrete: false, isSoftware: false };
  }

  // ARM Mali / Immortalis
  if (norm.includes('immortalis')) {
    return { family: 'immortalis', tier: 'high-end', isDiscrete: false, isSoftware: false };
  }
  if (norm.includes('mali')) {
    // High-end: G710, G715, G720, G77, G78
    if (/mali[- ]*g(?:7[7-9]|7\d\d)/i.test(norm)) {
      return { family: 'mali', tier: 'high-end', isDiscrete: false, isSoftware: false };
    }
    // Mid-range: G68, G76, G77 (lower core count)
    if (/mali[- ]*g(?:68|76)/i.test(norm)) {
      return { family: 'mali', tier: 'mid-range', isDiscrete: false, isSoftware: false };
    }
    // Low-end: G31, G51, G52, G57
    return { family: 'mali', tier: 'low-end', isDiscrete: false, isSoftware: false };
  }

  // NVIDIA
  if (norm.includes('nvidia') || norm.includes('geforce') || norm.includes('rtx') || norm.includes('gtx')) {
    if (norm.includes('rtx') || norm.includes('gtx 10') || norm.includes('gtx 16')) {
      return { family: 'nvidia', tier: 'high-end', isDiscrete: true, isSoftware: false };
    }
    return { family: 'nvidia', tier: 'mid-range', isDiscrete: true, isSoftware: false };
  }

  // AMD Radeon
  if (norm.includes('radeon') || norm.includes('amd')) {
    if (norm.includes('rx 6') || norm.includes('rx 7') || norm.includes('rx 5')) {
      return { family: 'amd', tier: 'high-end', isDiscrete: true, isSoftware: false };
    }
    return { family: 'amd', tier: 'mid-range', isDiscrete: true, isSoftware: false };
  }

  // Intel
  if (norm.includes('intel') || norm.includes('iris') || norm.includes('uhd')) {
    if (/iris.*xe|arc/i.test(norm)) {
      return { family: 'intel', tier: 'mid-range', isDiscrete: norm.includes('arc'), isSoftware: false };
    }
    return { family: 'intel', tier: 'low-end', isDiscrete: false, isSoftware: false };
  }

  return { family: 'unknown', tier: 'unknown', isDiscrete: false, isSoftware: false };
}

/**
 * Resolves the optimal XRSessionQualityProfile for a WebXR session.
 * Integrates multi-signal inputs, device persona scoring, thermal state, and route capabilities.
 */
export function resolveXRSessionQualityProfile(
  input: XRQualityResolutionInput = {}
): XRSessionQualityProfile {
  const reasons: string[] = [];

  // 1. Manual user override takes precedence
  if (input.overrideProfile) {
    const base = XR_BASE_PROFILES[input.overrideProfile] || XR_BASE_PROFILES['balanced'];
    return {
      ...base,
      reasons: [`override:user-selected->${input.overrideProfile}`],
    };
  }

  // 2. Extract capabilities / signals
  const caps = input.capabilities;
  const rendererStr = caps?.gpuRenderer || input.gpuRenderer;
  const gpuInfo = classifyGpuArchitecture(rendererStr);
  const effectiveGpuTier = caps?.gpuTier || input.gpuTier || gpuInfo.tier;
  const isSoftware = caps?.isSoftwareGpu ?? input.isSoftwareGpu ?? gpuInfo.isSoftware;
  const deviceMemory = caps?.deviceMemory ?? input.deviceMemory; // in GiB
  const isMobile = caps?.isMobile ?? input.isMobile ?? false;
  const platform = caps?.platform || input.platform || 'other';
  const thermal = input.thermalState || input.thermalHint || caps?.thermalState || 'nominal';
  const saveData = input.saveData || caps?.network?.saveData || false;
  const isLowPower =
    input.isLowPower ||
    (typeof input.batteryState === 'string' && input.batteryState === 'low') ||
    caps?.isLowPower ||
    false;

  // 3. Determine base profile tier
  let resolvedTier: XRProfileName = 'balanced';

  // Invariant 0: Guard iOS device memory undefined without penalization
  if ((platform === 'ios' || platform === 'tablet') && deviceMemory === undefined) {
    reasons.push('guard:ios-device-memory-undefined-preserved');
  }

  // Invariant 1: Software GPU always gets ultra-light
  if (isSoftware) {
    resolvedTier = 'ultra-light';
    reasons.push('cap:software-gpu->ultra-light');
  }
  // Invariant 2: Low-end GPU always gets ultra-light (regardless of marketing RAM!)
  else if (effectiveGpuTier === 'low-end') {
    resolvedTier = 'ultra-light';
    reasons.push(`gpu:low-end-tier(${rendererStr || 'unspecified'})->ultra-light`);
    if (typeof deviceMemory === 'number' && deviceMemory >= 8) {
      reasons.push('guard:8gb-budget-phone-trap-neutralized(ram-ignored-for-weak-gpu)');
    }
  }
  // Invariant 3: Low RAM on devices where RAM is reported (<= 2GB)
  else if (typeof deviceMemory === 'number' && deviceMemory > 0 && deviceMemory <= 2) {
    resolvedTier = 'ultra-light';
    reasons.push(`mem:low-ram-budget(${deviceMemory}GB)->ultra-light`);
  }
  // Invariant 4: Flagship / High-end GPU
  else if (effectiveGpuTier === 'high-end') {
    // If mobile and high-end, check thermal / battery constraints
    if (isMobile) {
      if (thermal === 'serious' || thermal === 'critical') {
        resolvedTier = 'ultra-light';
        reasons.push(`thermal:${thermal}->ultra-light`);
      } else if (thermal === 'fair' || isLowPower) {
        resolvedTier = 'balanced';
        reasons.push('thermal:fair-or-low-power->balanced-cap');
      } else {
        resolvedTier = 'high-fidelity';
        reasons.push(`gpu:flagship-mobile(${rendererStr || 'apple/adreno-high'})->high-fidelity`);
      }
    } else {
      // Desktop / Discrete GPU
      resolvedTier = 'high-fidelity';
      reasons.push(`gpu:desktop-discrete(${rendererStr || 'discrete-gpu'})->high-fidelity`);
    }
  }
  // Invariant 5: Mid-range GPU
  else if (effectiveGpuTier === 'mid-range') {
    if (thermal === 'serious' || thermal === 'critical') {
      resolvedTier = 'ultra-light';
      reasons.push(`thermal:${thermal}->ultra-light`);
    } else {
      resolvedTier = 'balanced';
      reasons.push(`gpu:mid-range(${rendererStr || 'mid-tier'})->balanced`);
    }
  }
  // Invariant 6: Apple iOS/iPadOS device where deviceMemory === undefined
  else if (platform === 'ios' || (!rendererStr && platform === 'tablet')) {
    // iOS Safari does not expose deviceMemory. NEVER penalize iOS for undefined deviceMemory!
    reasons.push('guard:ios-device-memory-undefined-preserved');
    resolvedTier = 'balanced';
  } else {
    // Default fallback
    resolvedTier = 'balanced';
    reasons.push('default:balanced-standard');
  }

  // 4. Energy and Network Overrides
  if (saveData && resolvedTier !== 'ultra-light') {
    resolvedTier = 'ultra-light';
    reasons.push('override:save-data->ultra-light');
  }
  if (isLowPower && resolvedTier === 'high-fidelity') {
    resolvedTier = 'balanced';
    reasons.push('override:battery-saver->balanced');
  }

  // 5. Build base profile clone
  const baseProfile = XR_BASE_PROFILES[resolvedTier];
  const profile: XRSessionQualityProfile = {
    ...baseProfile,
    reasons: [...reasons, ...baseProfile.reasons],
  };

  // 6. Granted XR Features Check (Light Estimation)
  const grantedSet =
    input.grantedXRFeatures instanceof Set
      ? input.grantedXRFeatures
      : new Set(input.grantedXRFeatures || []);

  const routeIsWorldTracked =
    input.arRoute === 'webxr-immersive-ar' ||
    input.arRoute === 'android-scene-viewer' ||
    input.arRoute === 'ios-quick-look';

  // Light estimation requires both granted feature AND capable profile (balanced or high-fidelity)
  if (!grantedSet.has('light-estimation')) {
    profile.useLightEstimation = false;
    profile.reasons.push('xr:light-estimation-not-granted');
  } else if (resolvedTier === 'ultra-light') {
    // On ultra-light, preserve frame time by skipping reflection probes
    profile.useLightEstimation = false;
    profile.reasons.push('xr:light-estimation-disabled-for-ultra-light');
  }

  // Non-world-tracked route (fallback preview): disable heavy XR lighting
  if (input.arRoute && !routeIsWorldTracked) {
    profile.useLightEstimation = false;
    profile.reasons.push('xr:light-estimation-disabled-non-tracked-route');
  }

  return profile;
}

// ---------------------------------------------------------------------------
// 4. Gradual Degradation Ladder Engine
// ---------------------------------------------------------------------------

export const MAX_DEGRADATION_LEVEL = 5;

/**
 * Applies a specific degradation level (0..5) to a profile in strict order:
 * Step 1: Reduce framebuffer scale factor (1.0 -> 0.85 -> 0.75)
 * Step 2: Downgrade shadow technique ('shadow-map' -> 'contact-shadow-texture' -> 'contact-blob')
 * Step 3: Disable light estimation probe updates
 * Step 4: Step down mesh LOD tier (0 -> 1 -> 2)
 * Step 5: Reduce texture maximum dimension (2048 -> 1024 -> 512) and disable antialiasing
 *
 * TRACKING STABILITY INVARIANT:
 * Hit-test and anchors are NEVER modified, throttled or disabled.
 */
export function applyDegradationLevel(
  base: XRSessionQualityProfile,
  level: number
): XRSessionQualityProfile {
  const clampedLevel = Math.max(0, Math.min(MAX_DEGRADATION_LEVEL, Math.floor(level)));
  if (clampedLevel === 0) return { ...base };

  const effective: XRSessionQualityProfile = {
    ...base,
    reasons: [...base.reasons, `degrade:level-${clampedLevel}`],
  };

  // Level 1: Reduce framebuffer scale factor (save pixel fill rate by ~28%)
  if (clampedLevel >= 1) {
    effective.framebufferScaleFactor = Math.max(0.75, base.framebufferScaleFactor * 0.85);
    effective.reasons.push(`degrade-step-1:framebufferScale(${effective.framebufferScaleFactor.toFixed(2)})`);
  }

  // Level 2: Downgrade shadow technique
  if (clampedLevel >= 2) {
    if (base.shadowTechnique === 'shadow-map') {
      effective.shadowTechnique = 'contact-shadow-texture';
      effective.reasons.push('degrade-step-2:shadowMap->contactShadowTexture');
    } else {
      effective.shadowTechnique = 'contact-blob';
      effective.reasons.push('degrade-step-2:shadow->contactBlob');
    }
  }

  // Level 3: Disable light estimation updates
  if (clampedLevel >= 3) {
    effective.useLightEstimation = false;
    effective.reasons.push('degrade-step-3:lightEstimationDisabled');
  }

  // Level 4: Step down mesh LOD tier
  if (clampedLevel >= 4) {
    effective.lodTier = Math.min(2, (base.lodTier + 1) as XRLodTier) as XRLodTier;
    effective.shadowTechnique = 'contact-blob'; // Ensure zero-FBO planar shadow
    effective.reasons.push(`degrade-step-4:lodTier->${effective.lodTier}`);
  }

  // Level 5: Reduce texture maximum dimension and disable antialias (Full ultra-light floor)
  if (clampedLevel >= 5) {
    effective.textureMaxDimension = Math.min(512, base.textureMaxDimension);
    effective.antialias = false;
    effective.maxAnisotropy = 1;
    effective.framebufferScaleFactor = 0.75;
    effective.profile = 'ultra-light';
    effective.reasons.push('degrade-step-5:textureMax512-antialiasOff->ultraLightFloor');
  }

  return effective;
}

// ---------------------------------------------------------------------------
// 5. XR Frame Time Monitor (Rolling Metrics, Hysteresis & Oscillation Lock)
// ---------------------------------------------------------------------------

export interface XRFrameTimeMonitorOptions {
  /** Target frame duration in ms (default: 16.67ms for 60 FPS target; 11.11ms for 90 FPS) */
  targetFrameTimeMs?: number;
  /** High frame time threshold for p90 triggering degradation (default: 20.0ms for 60 FPS) */
  p90DegradeThresholdMs?: number;
  /** Severe frame time threshold for p95 triggering degradation (default: 23.0ms for 60 FPS) */
  p95DegradeThresholdMs?: number;
  /** Frame time threshold for p95 considered smooth for recovery (default: 15.5ms) */
  p95RecoverThresholdMs?: number;
  /** Cooldown in ms between downward degradation steps (default: 1500ms) */
  stepDownCooldownMs?: number;
  /** Cooldown in ms between recovery steps (default: 8000ms) */
  recoveryCooldownMs?: number;
  /** Required sustained smooth performance duration before recovery is allowed (default: 12000ms) */
  sustainedSmoothDurationMs?: number;
  /** Rolling window capacity of frame delta samples (default: 90 frames, ~1.5 seconds) */
  sampleWindowSize?: number;
  /** Window in ms to detect rapid oscillation (default: 15000ms) */
  oscillationWindowMs?: number;
  /** Lock duration in ms when oscillation is detected (default: 60000ms) */
  oscillationLockDurationMs?: number;
  /** Threshold in ms to ignore idle gap / paused tab sleeps (default: 200ms) */
  idleGapThresholdMs?: number;
  /** Initial base quality profile */
  initialProfile?: XRSessionQualityProfile;
}

export interface XRFrameMetrics {
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  averageFps: number;
  sampleCount: number;
}

export interface XRFrameTimeAction {
  action: 'hold' | 'degrade' | 'recover';
  profile: XRProfileName;
  effectiveSettings: XRSessionQualityProfile;
  degradationLevel: number;
  reason: string;
  metrics: XRFrameMetrics;
  oscillationLocked: boolean;
}

/**
 * High-performance XR Frame Time Monitor.
 * Maintains rolling percentiles of WebXR requestAnimationFrame deltas,
 * executes calibrated degradation steps to preserve 60 FPS tracking stability,
 * and guards against flapping via hysteresis cooldowns and oscillation locks.
 */
export class XRFrameTimeMonitor {
  private readonly targetFrameTimeMs: number;
  private readonly p90DegradeThresholdMs: number;
  private readonly p95DegradeThresholdMs: number;
  private readonly p95RecoverThresholdMs: number;
  private readonly stepDownCooldownMs: number;
  private readonly recoveryCooldownMs: number;
  private readonly sustainedSmoothDurationMs: number;
  private readonly sampleWindowSize: number;
  private readonly oscillationWindowMs: number;
  private readonly oscillationLockDurationMs: number;
  private readonly idleGapThresholdMs: number;

  private baseProfile: XRSessionQualityProfile;
  private effectiveProfile: XRSessionQualityProfile;
  private degradationLevel = 0;

  // Rolling buffer
  private samples: number[] = [];
  private sampleIndex = 0;

  // Cooldown and timing state
  private lastStepDownTimeMs = -Infinity;
  private lastRecoveryTimeMs = -Infinity;
  private smoothStartTimeMs: number | null = null;

  // Oscillation protection
  private recentTransitions: Array<{ timestampMs: number; direction: 'degrade' | 'recover' }> = [];
  private oscillationLocked = false;
  private oscillationLockUntilMs = 0;
  private oscillationCeilingLevel: number | null = null;

  constructor(opts: XRFrameTimeMonitorOptions = {}) {
    this.targetFrameTimeMs = opts.targetFrameTimeMs ?? 16.67;
    this.p90DegradeThresholdMs = opts.p90DegradeThresholdMs ?? 20.0;
    this.p95DegradeThresholdMs = opts.p95DegradeThresholdMs ?? 23.0;
    this.p95RecoverThresholdMs = opts.p95RecoverThresholdMs ?? 15.5;
    this.stepDownCooldownMs = opts.stepDownCooldownMs ?? 1500;
    this.recoveryCooldownMs = opts.recoveryCooldownMs ?? 8000;
    this.sustainedSmoothDurationMs = opts.sustainedSmoothDurationMs ?? 12000;
    this.sampleWindowSize = opts.sampleWindowSize ?? 90;
    this.oscillationWindowMs = opts.oscillationWindowMs ?? 15000;
    this.oscillationLockDurationMs = opts.oscillationLockDurationMs ?? 60000;
    this.idleGapThresholdMs = opts.idleGapThresholdMs ?? 200.0;

    this.baseProfile = opts.initialProfile ? { ...opts.initialProfile } : { ...XR_BASE_PROFILES['balanced'] };
    this.effectiveProfile = { ...this.baseProfile };
  }

  /**
   * Resets the monitor metrics while keeping profile configurations.
   */
  public reset(): void {
    this.samples = [];
    this.sampleIndex = 0;
    this.degradationLevel = 0;
    this.effectiveProfile = { ...this.baseProfile };
    this.lastStepDownTimeMs = -Infinity;
    this.lastRecoveryTimeMs = -Infinity;
    this.smoothStartTimeMs = null;
    this.recentTransitions = [];
    this.oscillationLocked = false;
    this.oscillationLockUntilMs = 0;
    this.oscillationCeilingLevel = null;
  }

  /**
   * Updates base profile (e.g. upon user override or capability change).
   */
  public setBaseProfile(profile: XRSessionQualityProfile): void {
    this.baseProfile = { ...profile };
    this.effectiveProfile = applyDegradationLevel(this.baseProfile, this.degradationLevel);
  }

  /**
   * Samples a single frame time delta (in milliseconds).
   * Call once per WebXR requestAnimationFrame callback:
   * `monitor.sample(frameDeltaMs, performance.now())`
   */
  public sample(frameTimeMs: number, nowMs: number = Date.now()): XRFrameTimeAction {
    // 1. Idle gap immunity: ignore pauses, background tabs, or initial load spikes
    if (frameTimeMs >= this.idleGapThresholdMs || frameTimeMs <= 0 || !Number.isFinite(frameTimeMs)) {
      return {
        action: 'hold',
        profile: this.effectiveProfile.profile,
        effectiveSettings: this.effectiveProfile,
        degradationLevel: this.degradationLevel,
        reason: 'idle-gap-discarded',
        metrics: this.computeMetrics(),
        oscillationLocked: this.oscillationLocked,
      };
    }

    // 2. Add sample to rolling ring buffer
    if (this.samples.length < this.sampleWindowSize) {
      this.samples.push(frameTimeMs);
    } else {
      this.samples[this.sampleIndex] = frameTimeMs;
      this.sampleIndex = (this.sampleIndex + 1) % this.sampleWindowSize;
    }

    // Require at least 15 samples before making dynamic adjustments
    if (this.samples.length < 15) {
      return {
        action: 'hold',
        profile: this.effectiveProfile.profile,
        effectiveSettings: this.effectiveProfile,
        degradationLevel: this.degradationLevel,
        reason: 'warming-up-sample-buffer',
        metrics: this.computeMetrics(),
        oscillationLocked: this.oscillationLocked,
      };
    }

    // 3. Compute rolling percentiles
    const metrics = this.computeMetrics();

    // 4. Check oscillation lock expiry
    if (this.oscillationLocked && nowMs >= this.oscillationLockUntilMs) {
      this.oscillationLocked = false;
      this.oscillationLockUntilMs = 0;
      this.oscillationCeilingLevel = null;
    }

    // 5. Evaluate degradation trigger (p90 > 20ms or p95 > 23ms)
    const isDroppingFrames =
      metrics.p90Ms >= this.p90DegradeThresholdMs || metrics.p95Ms >= this.p95DegradeThresholdMs;

    if (isDroppingFrames) {
      this.smoothStartTimeMs = null; // reset smooth counter

      const cooldownElapsed = nowMs - this.lastStepDownTimeMs >= this.stepDownCooldownMs;
      const canDegradeFurther = this.degradationLevel < MAX_DEGRADATION_LEVEL;

      if (cooldownElapsed && canDegradeFurther) {
        this.degradationLevel++;
        this.lastStepDownTimeMs = nowMs;
        this.effectiveProfile = applyDegradationLevel(this.baseProfile, this.degradationLevel);

        // Record transition for oscillation analysis
        this.recordTransition(nowMs, 'degrade');

        // Check if we rapidly degraded after a recent recovery
        if (this.detectRapidOscillation(nowMs)) {
          this.oscillationLocked = true;
          this.oscillationLockUntilMs = nowMs + this.oscillationLockDurationMs;
          this.oscillationCeilingLevel = this.degradationLevel;
        }

        return {
          action: 'degrade',
          profile: this.effectiveProfile.profile,
          effectiveSettings: this.effectiveProfile,
          degradationLevel: this.degradationLevel,
          reason: `p90=${metrics.p90Ms.toFixed(1)}ms, p95=${metrics.p95Ms.toFixed(1)}ms->degraded-to-level-${this.degradationLevel}`,
          metrics,
          oscillationLocked: this.oscillationLocked,
        };
      }

      return {
        action: 'hold',
        profile: this.effectiveProfile.profile,
        effectiveSettings: this.effectiveProfile,
        degradationLevel: this.degradationLevel,
        reason: cooldownElapsed ? 'at-maximum-degradation-floor' : 'degrade-cooldown-active',
        metrics,
        oscillationLocked: this.oscillationLocked,
      };
    }

    // 6. Evaluate recovery trigger (p95 <= 15.5ms sustained)
    const isSmooth = metrics.p95Ms <= this.p95RecoverThresholdMs;

    if (isSmooth) {
      if (this.smoothStartTimeMs === null) {
        this.smoothStartTimeMs = nowMs;
      }

      const smoothDuration = nowMs - this.smoothStartTimeMs;
      const recoveryCooldownElapsed = nowMs - this.lastRecoveryTimeMs >= this.recoveryCooldownMs;
      const canRecover = this.degradationLevel > 0;

      // Guard: oscillation lock prevents stepping above the ceiling
      const isBlockedByOscillation =
        this.oscillationLocked &&
        this.oscillationCeilingLevel !== null &&
        this.degradationLevel <= this.oscillationCeilingLevel;

      if (
        canRecover &&
        !isBlockedByOscillation &&
        smoothDuration >= this.sustainedSmoothDurationMs &&
        recoveryCooldownElapsed
      ) {
        this.degradationLevel--;
        this.lastRecoveryTimeMs = nowMs;
        this.smoothStartTimeMs = nowMs; // reset counter for next potential recovery
        this.effectiveProfile = applyDegradationLevel(this.baseProfile, this.degradationLevel);

        this.recordTransition(nowMs, 'recover');

        return {
          action: 'recover',
          profile: this.effectiveProfile.profile,
          effectiveSettings: this.effectiveProfile,
          degradationLevel: this.degradationLevel,
          reason: `sustained-smooth(${smoothDuration}ms, p95=${metrics.p95Ms.toFixed(1)}ms)->recovered-to-level-${this.degradationLevel}`,
          metrics,
          oscillationLocked: this.oscillationLocked,
        };
      }
    } else {
      this.smoothStartTimeMs = null;
    }

    return {
      action: 'hold',
      profile: this.effectiveProfile.profile,
      effectiveSettings: this.effectiveProfile,
      degradationLevel: this.degradationLevel,
      reason: 'stable',
      metrics,
      oscillationLocked: this.oscillationLocked,
    };
  }

  /**
   * Computes p50, p90, p95 and average FPS from the rolling sample buffer.
   */
  public computeMetrics(): XRFrameMetrics {
    if (this.samples.length === 0) {
      return { p50Ms: 16.67, p90Ms: 16.67, p95Ms: 16.67, averageFps: 60, sampleCount: 0 };
    }

    const sorted = [...this.samples].sort((a, b) => a - b);
    const n = sorted.length;

    const p50Ms = sorted[Math.floor(n * 0.5)];
    const p90Ms = sorted[Math.min(n - 1, Math.floor(n * 0.9))];
    const p95Ms = sorted[Math.min(n - 1, Math.floor(n * 0.95))];

    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const avgDeltaMs = sum / n;
    const averageFps = avgDeltaMs > 0 ? Math.round(1000 / avgDeltaMs) : 60;

    return {
      p50Ms: Number(p50Ms.toFixed(2)),
      p90Ms: Number(p90Ms.toFixed(2)),
      p95Ms: Number(p95Ms.toFixed(2)),
      averageFps,
      sampleCount: n,
    };
  }

  public getEffectiveSettings(): XRSessionQualityProfile {
    return { ...this.effectiveProfile };
  }

  public getBaseProfile(): XRSessionQualityProfile {
    return { ...this.baseProfile };
  }

  public getDegradationLevel(): number {
    return this.degradationLevel;
  }

  public isOscillationLocked(): boolean {
    return this.oscillationLocked;
  }

  private recordTransition(nowMs: number, direction: 'degrade' | 'recover'): void {
    this.recentTransitions.push({ timestampMs: nowMs, direction });
    // Keep only transitions within oscillationWindowMs
    const cutoff = nowMs - this.oscillationWindowMs;
    this.recentTransitions = this.recentTransitions.filter((t) => t.timestampMs >= cutoff);
  }

  private detectRapidOscillation(nowMs: number): boolean {
    const cutoff = nowMs - this.oscillationWindowMs;
    const windowTransitions = this.recentTransitions.filter((t) => t.timestampMs >= cutoff);

    // If we have >= 3 direction changes in the window, it's oscillating
    let flips = 0;
    for (let i = 1; i < windowTransitions.length; i++) {
      if (windowTransitions[i].direction !== windowTransitions[i - 1].direction) {
        flips++;
      }
    }
    return flips >= 2;
  }
}
