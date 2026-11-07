/**
 * Intelligent Runtime Adaptive Quality Manager (Section 8)
 *
 * Implements:
 * 1. Three calibrated base rendering profiles:
 *    - `ultra-light`   (legacy tier `'low'`)
 *    - `balanced`      (legacy tier `'medium'`)
 *    - `high-fidelity` (legacy tier `'high'`)
 * 2. 6-step progressive runtime degradation & gradual hysteresis restoration:
 *    - Step 1: Reduce render resolution scale (`dprScale` 0.85x -> 0.75x)
 *    - Step 2: Reduce/disable real-time shadows (`shadowsEnabled = false`)
 *    - Step 3: Disable expensive post-processing (`postProcessingEnabled = false`)
 *    - Step 4: Reduce secondary material effects (`secondaryMaterialEffects = false`, lower env reflections)
 *    - Step 5: Switch to lower geometry LOD (`lodLevel = Math.min(2, lodLevel + 1)`)
 *    - Step 6: Reduce texture residency (`maxTextureDimension` halved, `evictSecondaryMaps = true` when memory > 80% or FPS < 28)
 * 3. `frameloop="demand"` idle-sleep immunity: ignores frame deltas >= 200ms so 0-FPS idle pauses
 *    never masquerade as lag spikes or falsely inflate smooth-recovery timers.
 * 4. Oscillation circuit-breaker: if a step-up triggers another step-down within 15s, locks that
 *    quality ceiling for 60s to prevent visual flickering.
 * 5. External-store pub/sub (`subscribe` / `getSnapshot` / `getServerSnapshot`) + safe `localStorage`
 *    manual override persistence (`golden-oak:quality-override`).
 */

import type {
  DeviceLogicalTier,
  ExtendedDeviceCapabilities,
  PrimaryEnvironment,
  RenderingProfileName,
  ThermalPressureState,
} from './device-capabilities';

export type LegacyQualityTier = 'high' | 'medium' | 'low';

export type QualityOverrideInput =
  | RenderingProfileName
  | LegacyQualityTier
  | 'auto'
  | null;

export type DegradationStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type LodLevel = 0 | 1 | 2;

export const QUALITY_OVERRIDE_STORAGE_KEY = 'golden-oak:quality-override';

export interface RenderingProfileConfig {
  profile: RenderingProfileName;
  legacyTier: LegacyQualityTier;
  /** Target [min, max] DPR window prior to dynamic step-down scaling */
  dprRange: [number, number];
  /** R3F Canvas compatible DPR value */
  dpr: number | [number, number];
  /** Minimum DPR floor permitted during Step 1-2 dynamic scaling */
  minScaledDpr: number;
  maxTextureDimension: number;
  shadowsEnabled: boolean;
  maxShadowMapSize: number;
  contactShadowFrames: number;
  contactShadowResolution: number;
  postProcessingEnabled: boolean;
  secondaryMaterialEffects: boolean;
  transmissionEnabled: boolean;
  simplifyTransmission: boolean;
  lodLevel: LodLevel;
  antialias: boolean;
  maxAnisotropy: number;
  environmentIntensity: number;
  toneMappingExposure: number;
  powerPreference: 'high-performance' | 'default' | 'low-power';
}

export interface EffectiveQualitySettings extends RenderingProfileConfig {
  degradationStep: DegradationStep;
  /** Resolution multiplier applied to clamped base DPR (1.0 -> 0.85 -> 0.75) */
  dprScale: number;
  /** Concrete scalar pixel ratio for `gl.setPixelRatio(...)` */
  effectiveDpr: number;
  /** True at Step 6 when non-essential normal/roughness/AO secondary maps should be evicted */
  evictSecondaryMaps: boolean;
}

export interface RuntimeFrameMetrics {
  avgFps: number;
  avgFrameTimeMs: number;
  p90FrameTimeMs: number;
  sampleCount: number;
  totalActiveFrames: number;
  idleGapsIgnored: number;
  isIdle: boolean;
  memoryUtilization?: number;
}

export interface QualityManagerOptions {
  initialProfile?: RenderingProfileName;
  devicePixelRatio?: number;
  environment?: PrimaryEnvironment;
  logicalTier?: DeviceLogicalTier;
  androidTier?: DeviceLogicalTier | null;
  physicalPixelCount?: number;
  thermalState?: ThermalPressureState;
  /** Rolling active frame window capacity (default: 60) */
  rollingWindowSize?: number;
  /** Minimum active rendered frames before FPS step-down/up triggers (default: 45) */
  minSampleFrames?: number;
  /** Ignore deltas >= threshold in seconds as frameloop="demand" idle sleep (default: 0.200s) */
  maxActiveDeltaSeconds?: number;
  /** Unstable average FPS threshold for step-down (default: 38 FPS) */
  unstableFpsThreshold?: number;
  /** Unstable p90 frame time in ms for step-down (default: 28 ms) */
  unstableP90FrameTimeMs?: number;
  /** Severe FPS threshold permitting Step 5 -> Step 6 texture eviction (default: 28 FPS) */
  severeFpsThreshold?: number;
  /** JS heap / memory pressure threshold permitting Step 6 (default: 0.80) */
  highMemoryPressureThreshold?: number;
  /** Sustained smooth FPS threshold for gradual step-up (default: 55 FPS) */
  smoothFpsThreshold?: number;
  /** Sustained smooth p90 frame time threshold in ms for step-up (default: 18.5 ms) */
  smoothP90FrameTimeMs?: number;
  /** Minimum cooldown between consecutive step-downs in ms (default: 1500 ms) */
  stepDownCooldownMs?: number;
  /** Minimum cooldown after a step-down before recovery can occur in ms (default: 8000 ms) */
  recoveryCooldownMs?: number;
  /** Sustained smooth rendering duration required before stepping up 1 step in ms (default: 12000 ms) */
  sustainedSmoothDurationMs?: number;
  /** Window after a step-up where an immediate step-down triggers oscillation lock (default: 15000 ms) */
  oscillationWindowMs?: number;
  /** Duration to lock the step ceiling when oscillation is detected (default: 60000 ms) */
  oscillationLockDurationMs?: number;
  /** Whether to read/write manual override from browser localStorage (default: true) */
  persistOverride?: boolean;
}

export interface QualityManagerState {
  baseProfile: RenderingProfileName;
  legacyTier: LegacyQualityTier;
  logicalTier: DeviceLogicalTier;
  androidTier: DeviceLogicalTier | null;
  environment: PrimaryEnvironment;
  manualOverride: RenderingProfileName | null;
  degradationStep: DegradationStep;
  oscillationLocked: boolean;
  oscillationCeilingStep: DegradationStep | null;
  oscillationLockUntilMs: number | null;
  thermalState: ThermalPressureState;
  effective: EffectiveQualitySettings;
  metrics: RuntimeFrameMetrics;
  lastTransitionReason: string;
}

/**
 * Calibrated Base Rendering Profiles (Section 8)
 */
export const RENDERING_PROFILES: Record<RenderingProfileName, RenderingProfileConfig> = {
  'ultra-light': {
    profile: 'ultra-light',
    legacyTier: 'low',
    dprRange: [0.75, 1.0],
    dpr: 1.0,
    minScaledDpr: 0.75,
    maxTextureDimension: 512,
    shadowsEnabled: false,
    maxShadowMapSize: 256,
    contactShadowFrames: 1,
    contactShadowResolution: 256,
    postProcessingEnabled: false,
    secondaryMaterialEffects: false,
    transmissionEnabled: false,
    simplifyTransmission: true,
    lodLevel: 2,
    antialias: false,
    maxAnisotropy: 1,
    environmentIntensity: 1.05,
    toneMappingExposure: 1.38,
    powerPreference: 'low-power',
  },
  balanced: {
    profile: 'balanced',
    legacyTier: 'medium',
    dprRange: [1.0, 1.35],
    dpr: [1, 1.35],
    minScaledDpr: 0.75,
    maxTextureDimension: 1024,
    shadowsEnabled: true,
    maxShadowMapSize: 512,
    contactShadowFrames: 1,
    contactShadowResolution: 512,
    postProcessingEnabled: false,
    secondaryMaterialEffects: true,
    transmissionEnabled: true,
    simplifyTransmission: false,
    lodLevel: 1,
    antialias: true,
    maxAnisotropy: 4,
    environmentIntensity: 1.15,
    toneMappingExposure: 1.42,
    powerPreference: 'default',
  },
  'high-fidelity': {
    profile: 'high-fidelity',
    legacyTier: 'high',
    dprRange: [1.0, 1.75],
    dpr: [1, 1.75],
    minScaledDpr: 0.85,
    maxTextureDimension: 2048,
    shadowsEnabled: true,
    maxShadowMapSize: 1024,
    contactShadowFrames: 1,
    contactShadowResolution: 1024,
    postProcessingEnabled: true,
    secondaryMaterialEffects: true,
    transmissionEnabled: true,
    simplifyTransmission: false,
    lodLevel: 0,
    antialias: true,
    maxAnisotropy: 8,
    environmentIntensity: 1.25,
    toneMappingExposure: 1.48,
    powerPreference: 'high-performance',
  },
};

export function profileToLegacyTier(profile: RenderingProfileName): LegacyQualityTier {
  if (profile === 'high-fidelity') return 'high';
  if (profile === 'balanced') return 'medium';
  return 'low';
}

export function legacyTierToProfile(tier: LegacyQualityTier): RenderingProfileName {
  if (tier === 'high') return 'high-fidelity';
  if (tier === 'medium') return 'balanced';
  return 'ultra-light';
}

export function normalizeQualityOverride(
  input: QualityOverrideInput | string | undefined
): RenderingProfileName | null {
  if (!input || input === 'auto') return null;
  if (input === 'ultra-light' || input === 'balanced' || input === 'high-fidelity') {
    return input;
  }
  if (input === 'low' || input === 'medium' || input === 'high') {
    return legacyTierToProfile(input);
  }
  return null;
}

/**
 * Calibrates the maximum DPR ceiling for `high-fidelity` based on environment and physical pixel count
 * so flagship mobile caps at 1.75x, standard/QHD desktop allows up to 2.0x, and 4K/5K displays clamp at 1.5x.
 */
export function getCalibratedDprRange(
  profile: RenderingProfileName,
  environment: PrimaryEnvironment = 'web-desktop',
  physicalPixelCount = 2_073_600
): [number, number] {
  const base = RENDERING_PROFILES[profile];
  if (profile !== 'high-fidelity') {
    return [base.dprRange[0], base.dprRange[1]];
  }
  if (environment === 'phone') {
    return [1.0, 1.75];
  }
  if (physicalPixelCount >= 4_500_000) {
    return [1.0, 1.5];
  }
  return [1.0, 2.0];
}

/**
 * Pure deterministic computation of effective rendering parameters at a given degradation step (0..6).
 *
 * Exact Section 8 Progressive Degradation Sequence:
 * - Step 1: Reduce render resolution scale (`dprScale` 0.85x -> 0.75x)
 * - Step 2: Reduce/disable real-time shadow quality (`shadowsEnabled = false`, smaller contact shadow)
 * - Step 3: Disable expensive post-processing (`postProcessingEnabled = false`)
 * - Step 4: Reduce secondary material effects (`secondaryMaterialEffects = false`, lower env reflections)
 * - Step 5: Switch to lower LOD (`lodLevel = Math.min(2, lodLevel + 1)`)
 * - Step 6: Reduce texture residency (`maxTextureDimension` halved, `evictSecondaryMaps = true`)
 */
export function computeEffectiveQualitySettings(
  profile: RenderingProfileName,
  step: DegradationStep,
  devicePixelRatio = 1,
  environment: PrimaryEnvironment = 'web-desktop',
  physicalPixelCount = 2_073_600
): EffectiveQualitySettings {
  const base = RENDERING_PROFILES[profile];
  const calibratedRange = getCalibratedDprRange(profile, environment, physicalPixelCount);
  const clampedBaseDpr = Math.min(
    calibratedRange[1],
    Math.max(1.0, Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1)
  );

  let dprScale = 1.0;
  let shadowsEnabled = base.shadowsEnabled;
  let maxShadowMapSize = base.maxShadowMapSize;
  let contactShadowFrames = base.contactShadowFrames;
  let contactShadowResolution = base.contactShadowResolution;
  let postProcessingEnabled = base.postProcessingEnabled;
  let secondaryMaterialEffects = base.secondaryMaterialEffects;
  let transmissionEnabled = base.transmissionEnabled;
  let simplifyTransmission = base.simplifyTransmission;
  let lodLevel: LodLevel = base.lodLevel;
  let maxTextureDimension = base.maxTextureDimension;
  let maxAnisotropy = base.maxAnisotropy;
  let environmentIntensity = base.environmentIntensity;
  let evictSecondaryMaps = false;

  // Step 1: Render resolution scale reduction
  if (step >= 1) {
    dprScale = step >= 2 ? 0.75 : 0.85;
  }

  // Step 2: Real-time shadow reduction / disablement
  if (step >= 2) {
    shadowsEnabled = false;
    maxShadowMapSize = Math.min(maxShadowMapSize, 256);
    contactShadowResolution = Math.min(contactShadowResolution, 256);
    contactShadowFrames = profile === 'ultra-light' ? 0 : 1;
  }

  // Step 3: Disable post-processing passes
  if (step >= 3) {
    postProcessingEnabled = false;
  }

  // Step 4: Disable secondary material effects & reduce reflection cost
  if (step >= 4) {
    secondaryMaterialEffects = false;
    transmissionEnabled = false;
    simplifyTransmission = true;
    environmentIntensity = Number((base.environmentIntensity * 0.78).toFixed(2));
    maxAnisotropy = Math.min(maxAnisotropy, 2);
  }

  // Step 5: Switch to lower geometry LOD
  if (step >= 5) {
    lodLevel = Math.min(2, base.lodLevel + 1) as LodLevel;
  }

  // Step 6: Halve texture residency ceiling & evict non-essential secondary maps
  if (step >= 6) {
    maxTextureDimension = Math.max(256, Math.floor(base.maxTextureDimension / 2));
    evictSecondaryMaps = true;
    maxAnisotropy = 1;
    lodLevel = 2;
  }

  const effectiveDpr = Number(
    Math.max(base.minScaledDpr === 0.85 && step >= 2 ? 0.75 : 0.75, clampedBaseDpr * dprScale).toFixed(2)
  );

  const dprProp: number | [number, number] =
    step === 0
      ? profile === 'ultra-light'
        ? 1.0
        : calibratedRange
      : effectiveDpr;

  return {
    ...base,
    dprRange: calibratedRange,
    dpr: dprProp,
    degradationStep: step,
    dprScale,
    effectiveDpr,
    shadowsEnabled,
    maxShadowMapSize,
    contactShadowFrames,
    contactShadowResolution,
    postProcessingEnabled,
    secondaryMaterialEffects,
    transmissionEnabled,
    simplifyTransmission,
    lodLevel,
    maxTextureDimension,
    maxAnisotropy,
    environmentIntensity,
    evictSecondaryMaps,
  };
}

function computePercentile90(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9));
  return sorted[idx];
}

function readStoredOverride(): RenderingProfileName | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(QUALITY_OVERRIDE_STORAGE_KEY);
      return normalizeQualityOverride(raw ?? undefined);
    }
  } catch {
    // Storage restricted (private mode / iframe sandbox)
  }
  return null;
}

function writeStoredOverride(override: RenderingProfileName | null): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (override === null) {
        window.localStorage.removeItem(QUALITY_OVERRIDE_STORAGE_KEY);
      } else {
        window.localStorage.setItem(QUALITY_OVERRIDE_STORAGE_KEY, override);
      }
    }
  } catch {
    // Safe no-op when storage unavailable
  }
}

/**
 * Stateful Adaptive Quality Manager with Hysteresis, Demand-Loop Sleep Immunity,
 * and Oscillation Circuit-Breaker.
 */
export class QualityManager {
  private baseProfile: RenderingProfileName;
  private manualOverride: RenderingProfileName | null = null;
  private logicalTier: DeviceLogicalTier;
  private androidTier: DeviceLogicalTier | null;
  private environment: PrimaryEnvironment;
  private devicePixelRatio: number;
  private physicalPixelCount: number;
  private thermalState: ThermalPressureState;
  private degradationStep: DegradationStep = 0;

  // Configuration thresholds
  private readonly rollingWindowSize: number;
  private readonly minSampleFrames: number;
  private readonly maxActiveDeltaSeconds: number;
  private readonly unstableFpsThreshold: number;
  private readonly unstableP90FrameTimeMs: number;
  private readonly severeFpsThreshold: number;
  private readonly highMemoryPressureThreshold: number;
  private readonly smoothFpsThreshold: number;
  private readonly smoothP90FrameTimeMs: number;
  private readonly stepDownCooldownMs: number;
  private readonly recoveryCooldownMs: number;
  private readonly sustainedSmoothDurationMs: number;
  private readonly oscillationWindowMs: number;
  private readonly oscillationLockDurationMs: number;
  private readonly persistOverride: boolean;

  // Rolling active frame samples (in milliseconds)
  private frameTimesMs: number[] = [];
  private totalActiveFrames = 0;
  private idleGapsIgnored = 0;
  private isIdle = true;
  private memoryUtilization: number | undefined = undefined;

  // Hysteresis & circuit-breaker timestamps
  private lastStepDownAtMs: number | null = null;
  private lastStepUpAtMs: number | null = null;
  private smoothStableSinceMs: number | null = null;
  private oscillationLockUntilMs: number | null = null;
  private oscillationCeilingStep: DegradationStep | null = null;
  private lastTransitionReason = 'initial-calibration';

  // External store subscribers & cached immutable snapshot
  private listeners = new Set<() => void>();
  private snapshotCache: QualityManagerState;
  private serverSnapshotCache: QualityManagerState;

  constructor(options: QualityManagerOptions = {}) {
    this.baseProfile = options.initialProfile ?? 'balanced';
    this.logicalTier =
      options.logicalTier ??
      (this.baseProfile === 'high-fidelity'
        ? 'high-end'
        : this.baseProfile === 'balanced'
          ? 'mid-range'
          : 'low-end');
    this.androidTier = options.androidTier ?? null;
    this.environment = options.environment ?? 'web-desktop';
    this.devicePixelRatio = options.devicePixelRatio ?? 1;
    this.physicalPixelCount = options.physicalPixelCount ?? 2_073_600;
    this.thermalState = options.thermalState ?? 'unsupported';

    this.rollingWindowSize = options.rollingWindowSize ?? 60;
    this.minSampleFrames = options.minSampleFrames ?? 45;
    this.maxActiveDeltaSeconds = options.maxActiveDeltaSeconds ?? 0.2;
    this.unstableFpsThreshold = options.unstableFpsThreshold ?? 38;
    this.unstableP90FrameTimeMs = options.unstableP90FrameTimeMs ?? 28;
    this.severeFpsThreshold = options.severeFpsThreshold ?? 28;
    this.highMemoryPressureThreshold = options.highMemoryPressureThreshold ?? 0.8;
    this.smoothFpsThreshold = options.smoothFpsThreshold ?? 55;
    this.smoothP90FrameTimeMs = options.smoothP90FrameTimeMs ?? 18.5;
    this.stepDownCooldownMs = options.stepDownCooldownMs ?? 1500;
    this.recoveryCooldownMs = options.recoveryCooldownMs ?? 8000;
    this.sustainedSmoothDurationMs = options.sustainedSmoothDurationMs ?? 12000;
    this.oscillationWindowMs = options.oscillationWindowMs ?? 15000;
    this.oscillationLockDurationMs = options.oscillationLockDurationMs ?? 60000;
    this.persistOverride = options.persistOverride ?? true;

    if (this.persistOverride) {
      this.manualOverride = readStoredOverride();
    }

    this.snapshotCache = this.buildSnapshot(0);
    this.serverSnapshotCache = this.buildServerSnapshot();
  }

  /**
   * Synchronizes baseline device capabilities detected on client hydration or resize.
   */
  public applyDeviceCapabilities(caps: ExtendedDeviceCapabilities): void {
    const changed =
      this.baseProfile !== caps.recommendedProfile ||
      this.logicalTier !== caps.logicalTier ||
      this.androidTier !== caps.androidTier ||
      this.environment !== caps.environment ||
      this.devicePixelRatio !== caps.devicePixelRatio ||
      this.physicalPixelCount !== caps.screen.physicalPixelCount ||
      this.thermalState !== caps.thermalState;

    this.baseProfile = caps.recommendedProfile;
    this.logicalTier = caps.logicalTier;
    this.androidTier = caps.androidTier;
    this.environment = caps.environment;
    this.devicePixelRatio = caps.devicePixelRatio;
    this.physicalPixelCount = caps.screen.physicalPixelCount;
    this.thermalState = caps.thermalState;
    if (typeof caps.memory.jsHeapUtilization === 'number') {
      this.memoryUtilization = caps.memory.jsHeapUtilization;
    }

    if (changed) {
      this.lastTransitionReason = `capabilities-hydrated:${caps.recommendedProfile}`;
      this.emitChange();
    }
  }

  /**
   * Sets or clears a manual quality override ('auto' | null | profile | legacy tier).
   */
  public setOverride(input: QualityOverrideInput): void {
    const normalized = normalizeQualityOverride(input);
    if (this.manualOverride === normalized) return;

    this.manualOverride = normalized;
    this.degradationStep = 0;
    this.frameTimesMs = [];
    this.smoothStableSinceMs = null;
    this.oscillationLockUntilMs = null;
    this.oscillationCeilingStep = null;
    this.lastTransitionReason = normalized
      ? `manual-override:${normalized}`
      : 'manual-override:auto';

    if (this.persistOverride) {
      writeStoredOverride(normalized);
    }

    this.emitChange();
  }

  public getOverride(): RenderingProfileName | null {
    return this.manualOverride;
  }

  /**
   * Updates thermal/compute pressure state from W3C PressureObserver when supported.
   */
  public setThermalState(state: ThermalPressureState, nowMs = this.now()): void {
    if (this.thermalState === state) return;
    this.thermalState = state;

    if (!this.manualOverride) {
      if (state === 'critical' && this.degradationStep < 4) {
        this.degradationStep = 4;
        this.lastStepDownAtMs = nowMs;
        this.smoothStableSinceMs = null;
        this.frameTimesMs = [];
        this.lastTransitionReason = 'thermal-critical:jump-step-4';
      } else if (state === 'serious' && this.degradationStep < 2) {
        this.degradationStep = 2;
        this.lastStepDownAtMs = nowMs;
        this.smoothStableSinceMs = null;
        this.frameTimesMs = [];
        this.lastTransitionReason = 'thermal-serious:jump-step-2';
      }
    }

    this.emitChange();
  }

  /**
   * Records a rendered frame delta (in seconds) from R3F `useFrame`.
   *
   * CRITICAL `frameloop="demand"` GUARD:
   * Deltas >= `maxActiveDeltaSeconds` (200ms) represent idle 0-FPS sleep between user
   * interactions and are strictly ignored so they NEVER trigger false quality drops.
   */
  public recordFrameDelta(
    deltaSeconds: number,
    nowMs = this.now(),
    memoryUtilization?: number
  ): QualityManagerState {
    if (typeof memoryUtilization === 'number' && Number.isFinite(memoryUtilization)) {
      this.memoryUtilization = Math.max(0, Math.min(1, memoryUtilization));
    }

    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0.0001) {
      return this.snapshotCache;
    }

    // Clear expired oscillation lock if wall-clock lock window has passed
    if (this.oscillationLockUntilMs !== null && nowMs >= this.oscillationLockUntilMs) {
      this.oscillationLockUntilMs = null;
      this.oscillationCeilingStep = null;
      this.emitChange(nowMs);
    }

    // Demand-frameloop sleep immunity: ignore pauses >= 200ms!
    if (deltaSeconds >= this.maxActiveDeltaSeconds) {
      this.idleGapsIgnored += 1;
      const wasIdle = this.isIdle;
      this.isIdle = true;

      // Pause smooth-recovery stopwatch across idle sleep so 0-FPS sleep doesn't count as smooth active rendering
      if (this.smoothStableSinceMs !== null) {
        this.smoothStableSinceMs += deltaSeconds * 1000;
      }

      if (!wasIdle) {
        this.snapshotCache = this.buildSnapshot(nowMs);
      }
      return this.snapshotCache;
    }

    this.isIdle = false;
    this.totalActiveFrames += 1;

    const frameTimeMs = deltaSeconds * 1000;
    this.frameTimesMs.push(frameTimeMs);
    if (this.frameTimesMs.length > this.rollingWindowSize) {
      this.frameTimesMs.shift();
    }

    // Do not dynamically mutate quality when user explicitly locked a manual override
    if (this.manualOverride !== null) {
      return this.snapshotCache;
    }

    // Evaluate once rolling window has sufficient active rendered frames
    if (this.frameTimesMs.length < this.minSampleFrames) {
      return this.snapshotCache;
    }

    const metrics = this.computeMetrics();
    const recentCount = Math.min(8, this.frameTimesMs.length);
    let recentSumMs = 0;
    for (let i = this.frameTimesMs.length - recentCount; i < this.frameTimesMs.length; i++) {
      recentSumMs += this.frameTimesMs[i];
    }
    const recentAvgFrameTimeMs = recentSumMs / recentCount;
    const unstableFrameTimeMs = 1000 / this.unstableFpsThreshold;
    const stillExperiencingSlowFrames =
      frameTimeMs >= unstableFrameTimeMs || recentAvgFrameTimeMs >= unstableFrameTimeMs;

    const isUnstable =
      stillExperiencingSlowFrames &&
      (metrics.avgFps < this.unstableFpsThreshold ||
        metrics.p90FrameTimeMs > this.unstableP90FrameTimeMs);

    const isMemoryCritical =
      typeof this.memoryUtilization === 'number' &&
      this.memoryUtilization > this.highMemoryPressureThreshold;

    // 1. Check Step-Down Condition
    if ((isUnstable || isMemoryCritical) && this.degradationStep < 6) {
      this.smoothStableSinceMs = null;

      const stepDownReady =
        this.lastStepDownAtMs === null ||
        nowMs - this.lastStepDownAtMs >= this.stepDownCooldownMs;

      if (stepDownReady) {
        const nextCandidate = (this.degradationStep + 1) as DegradationStep;

        // Step 6 (texture residency halving + secondary map eviction) requires memory > 80% or severe FPS < 28
        const canEnterStep6 =
          nextCandidate < 6 ||
          isMemoryCritical ||
          metrics.avgFps < this.severeFpsThreshold ||
          metrics.p90FrameTimeMs > 1000 / this.severeFpsThreshold;

        if (canEnterStep6) {
          this.performStepDown(
            nextCandidate,
            nowMs,
            isMemoryCritical
              ? `step-down:${nextCandidate}(memory=${Math.round((this.memoryUtilization ?? 0) * 100)}%)`
              : `step-down:${nextCandidate}(fps=${metrics.avgFps.toFixed(1)},p90=${metrics.p90FrameTimeMs.toFixed(1)}ms)`
          );
          return this.snapshotCache;
        }
      }
      return this.snapshotCache;
    }

    // 2. Check Gradual Step-Up Recovery Condition
    const isSmooth =
      metrics.avgFps > this.smoothFpsThreshold &&
      metrics.p90FrameTimeMs < this.smoothP90FrameTimeMs &&
      !isMemoryCritical &&
      (this.memoryUtilization === undefined || this.memoryUtilization < 0.75) &&
      this.thermalState !== 'serious' &&
      this.thermalState !== 'critical';

    if (!isSmooth) {
      this.smoothStableSinceMs = null;
      return this.snapshotCache;
    }

    if (this.degradationStep === 0) {
      return this.snapshotCache;
    }

    if (this.smoothStableSinceMs === null) {
      this.smoothStableSinceMs = nowMs;
      return this.snapshotCache;
    }

    const cooldownAfterDropElapsed =
      this.lastStepDownAtMs === null ||
      nowMs - this.lastStepDownAtMs >= this.recoveryCooldownMs;

    const sustainedSmoothElapsed =
      nowMs - this.smoothStableSinceMs >= this.sustainedSmoothDurationMs;

    if (cooldownAfterDropElapsed && sustainedSmoothElapsed) {
      const targetStep = (this.degradationStep - 1) as DegradationStep;

      // Respect Oscillation Circuit-Breaker lock ceiling
      const blockedByOscillationLock =
        this.oscillationLockUntilMs !== null &&
        nowMs < this.oscillationLockUntilMs &&
        this.oscillationCeilingStep !== null &&
        targetStep < this.oscillationCeilingStep;

      if (!blockedByOscillationLock) {
        this.performStepUp(
          targetStep,
          nowMs,
          `step-up:${targetStep}(fps=${metrics.avgFps.toFixed(1)})`
        );
      }
    }

    return this.snapshotCache;
  }

  /**
   * Forces a specific degradation step (for diagnostics or testing).
   */
  public setDegradationStep(step: DegradationStep, nowMs = this.now(), reason = 'manual-step'): void {
    if (this.degradationStep === step) return;
    this.degradationStep = step;
    this.frameTimesMs = [];
    this.smoothStableSinceMs = null;
    this.lastTransitionReason = reason;
    this.emitChange(nowMs);
  }

  /**
   * Resets dynamic degradation state back to baseline Step 0.
   */
  public resetDynamicState(nowMs = this.now()): void {
    this.degradationStep = 0;
    this.frameTimesMs = [];
    this.totalActiveFrames = 0;
    this.idleGapsIgnored = 0;
    this.isIdle = true;
    this.lastStepDownAtMs = null;
    this.lastStepUpAtMs = null;
    this.smoothStableSinceMs = null;
    this.oscillationLockUntilMs = null;
    this.oscillationCeilingStep = null;
    this.lastTransitionReason = 'reset';
    this.emitChange(nowMs);
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public getSnapshot = (): QualityManagerState => {
    return this.snapshotCache;
  };

  public getServerSnapshot = (): QualityManagerState => {
    return this.serverSnapshotCache;
  };

  private performStepDown(nextStep: DegradationStep, nowMs: number, reason: string): void {
    // Oscillation circuit-breaker: if a recent step-up immediately degraded back down within 15s,
    // lock this ceiling for 60s to prevent visual quality bouncing!
    if (
      this.lastStepUpAtMs !== null &&
      nowMs - this.lastStepUpAtMs <= this.oscillationWindowMs
    ) {
      this.oscillationLockUntilMs = nowMs + this.oscillationLockDurationMs;
      this.oscillationCeilingStep = nextStep;
      reason = `${reason}[oscillation-lock-60s]`;
    }

    this.degradationStep = nextStep;
    this.lastStepDownAtMs = nowMs;
    this.smoothStableSinceMs = null;
    this.frameTimesMs = [];
    this.lastTransitionReason = reason;
    this.emitChange(nowMs);
  }

  private performStepUp(targetStep: DegradationStep, nowMs: number, reason: string): void {
    this.degradationStep = targetStep;
    this.lastStepUpAtMs = nowMs;
    this.smoothStableSinceMs = nowMs;
    this.frameTimesMs = [];
    this.lastTransitionReason = reason;
    this.emitChange(nowMs);
  }

  private computeMetrics(): RuntimeFrameMetrics {
    const count = this.frameTimesMs.length;
    if (count === 0) {
      return {
        avgFps: 0,
        avgFrameTimeMs: 0,
        p90FrameTimeMs: 0,
        sampleCount: 0,
        totalActiveFrames: this.totalActiveFrames,
        idleGapsIgnored: this.idleGapsIgnored,
        isIdle: this.isIdle,
        memoryUtilization: this.memoryUtilization,
      };
    }

    let sumMs = 0;
    for (let i = 0; i < count; i++) {
      sumMs += this.frameTimesMs[i];
    }
    const avgFrameTimeMs = sumMs / count;
    const avgFps = avgFrameTimeMs > 0 ? 1000 / avgFrameTimeMs : 0;
    const p90FrameTimeMs = computePercentile90(this.frameTimesMs);

    return {
      avgFps: Number(avgFps.toFixed(2)),
      avgFrameTimeMs: Number(avgFrameTimeMs.toFixed(2)),
      p90FrameTimeMs: Number(p90FrameTimeMs.toFixed(2)),
      sampleCount: count,
      totalActiveFrames: this.totalActiveFrames,
      idleGapsIgnored: this.idleGapsIgnored,
      isIdle: this.isIdle,
      memoryUtilization: this.memoryUtilization,
    };
  }

  private buildSnapshot(nowMs: number): QualityManagerState {
    const activeProfile = this.manualOverride ?? this.baseProfile;
    const activeStep: DegradationStep = this.manualOverride ? 0 : this.degradationStep;
    const effective = computeEffectiveQualitySettings(
      activeProfile,
      activeStep,
      this.devicePixelRatio,
      this.environment,
      this.physicalPixelCount
    );
    const oscillationLocked =
      this.oscillationLockUntilMs !== null && nowMs < this.oscillationLockUntilMs;

    return {
      baseProfile: this.baseProfile,
      legacyTier: profileToLegacyTier(activeProfile),
      logicalTier: this.logicalTier,
      androidTier: this.androidTier,
      environment: this.environment,
      manualOverride: this.manualOverride,
      degradationStep: activeStep,
      oscillationLocked,
      oscillationCeilingStep: oscillationLocked ? this.oscillationCeilingStep : null,
      oscillationLockUntilMs: oscillationLocked ? this.oscillationLockUntilMs : null,
      thermalState: this.thermalState,
      effective,
      metrics: this.computeMetrics(),
      lastTransitionReason: this.lastTransitionReason,
    };
  }

  private buildServerSnapshot(): QualityManagerState {
    const effective = computeEffectiveQualitySettings('high-fidelity', 0, 1, 'web-desktop');
    return {
      baseProfile: 'high-fidelity',
      legacyTier: 'high',
      logicalTier: 'high-end',
      androidTier: null,
      environment: 'web-desktop',
      manualOverride: null,
      degradationStep: 0,
      oscillationLocked: false,
      oscillationCeilingStep: null,
      oscillationLockUntilMs: null,
      thermalState: 'unsupported',
      effective,
      metrics: {
        avgFps: 0,
        avgFrameTimeMs: 0,
        p90FrameTimeMs: 0,
        sampleCount: 0,
        totalActiveFrames: 0,
        idleGapsIgnored: 0,
        isIdle: true,
      },
      lastTransitionReason: 'ssr-default',
    };
  }

  private emitChange(nowMs = this.now()): void {
    this.snapshotCache = this.buildSnapshot(nowMs);
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // Isolate subscriber errors
      }
    });

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(
          new CustomEvent('golden-oak:quality-change', {
            detail: this.snapshotCache,
          })
        );
      } catch {
        // Ignore in synthetic test environments without CustomEvent
      }
    }
  }

  private now(): number {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  }
}

interface GlobalWithQualityManager {
  __GOLDEN_OAK_QUALITY_MANAGER__?: QualityManager;
}

/**
 * Returns the shared application-wide `QualityManager` singleton stored on `globalThis`,
 * enabling zero-coupling synchronization between `<AdaptiveQualityController />` and `useQualityTier()`.
 */
export function getGlobalQualityManager(): QualityManager {
  const g = globalThis as unknown as GlobalWithQualityManager;
  if (!g.__GOLDEN_OAK_QUALITY_MANAGER__) {
    g.__GOLDEN_OAK_QUALITY_MANAGER__ = new QualityManager();
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('golden-oak:quality-manager-ready'));
      } catch {
        // Ignore in synthetic DOM environments
      }
    }
  }
  return g.__GOLDEN_OAK_QUALITY_MANAGER__;
}

/**
 * Resets the global singleton (for isolated unit tests).
 */
export function resetGlobalQualityManager(options?: QualityManagerOptions): QualityManager {
  const g = globalThis as unknown as GlobalWithQualityManager;
  g.__GOLDEN_OAK_QUALITY_MANAGER__ = new QualityManager(options);
  return g.__GOLDEN_OAK_QUALITY_MANAGER__;
}
