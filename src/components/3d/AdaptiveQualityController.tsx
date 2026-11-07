'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  detectExtendedDeviceCapabilities,
  observeThermalPressure,
  type DeviceLogicalTier,
  type RenderingProfileName,
  type ThermalPressureState,
} from '@/lib/three/device-capabilities';
import {
  getGlobalQualityManager,
  type DegradationStep,
  type LodLevel,
  type QualityManager,
  type QualityManagerState,
  type LegacyQualityTier,
} from '@/lib/three/quality-manager';

export interface GoldenOak3DTelemetryEntry {
  canvasName: string;
  mounted: boolean;
  updatedAt: number;
  profile: RenderingProfileName;
  qualityTier: LegacyQualityTier;
  logicalTier: DeviceLogicalTier;
  androidTier: DeviceLogicalTier | null;
  degradationStep: DegradationStep;
  lodLevel: LodLevel;
  effectiveDpr: number;
  dprScale: number;
  fps: number;
  avgFrameTimeMs: number;
  p90FrameTimeMs: number;
  isIdle: boolean;
  idleGapsIgnored: number;
  oscillationLocked: boolean;
  shadowsEnabled: boolean;
  postProcessingEnabled: boolean;
  secondaryMaterialEffects: boolean;
  evictSecondaryMaps: boolean;
  maxTextureDimension: number;
  drawCalls: number;
  triangles: number;
  lines: number;
  points: number;
  geometries: number;
  textures: number;
  jsHeapUsedMb?: number;
  jsHeapLimitMb?: number;
  thermalState: ThermalPressureState;
}

export type GoldenOak3DTelemetryMap = Record<string, GoldenOak3DTelemetryEntry>;

interface TelemetryWindow {
  __GOLDEN_OAK_3D_TELEMETRY__?: GoldenOak3DTelemetryMap;
}

export interface AdaptiveQualityControllerProps {
  /** Identifier key in `window.__GOLDEN_OAK_3D_TELEMETRY__` (defaults to `'default'`) */
  canvasName?: string;
  /** Optional custom `QualityManager` instance (defaults to global singleton) */
  qualityManager?: QualityManager;
  /** Enable/disable dynamic runtime sampling (defaults to `true`) */
  enabled?: boolean;
  /** Minimum interval in ms between telemetry snapshot publishes during continuous motion (defaults to `200`) */
  telemetryThrottleMs?: number;
  /** Optional callback invoked whenever the active quality state transitions */
  onQualityChange?: (state: QualityManagerState) => void;
  /** Optional callback invoked when telemetry is updated */
  onTelemetrySnapshot?: (snapshot: GoldenOak3DTelemetryEntry) => void;
}

interface SavedSecondaryMaps {
  normalMap: THREE.Texture | null;
  roughnessMap: THREE.Texture | null;
  aoMap: THREE.Texture | null;
  bumpMap: THREE.Texture | null;
}

/**
 * Applies Reversible Texture Anisotropy & Secondary Detail Map Residency Governance
 * on scene materials when `QualityManager` transitions between steps (especially Step 4 & Step 6).
 */
function syncSceneMaterialBudget(
  scene: THREE.Scene,
  maxAnisotropy: number,
  evictSecondaryMaps: boolean,
  savedMapsRegistry: WeakMap<THREE.Material, SavedSecondaryMaps>
): void {
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (let i = 0; i < materials.length; i++) {
      const mat = materials[i] as THREE.MeshStandardMaterial;
      if (!mat) continue;

      // Clamp anisotropy on primary maps without destroying shared cached glTF textures
      if (mat.map && mat.map.anisotropy !== maxAnisotropy) {
        mat.map.anisotropy = Math.max(1, maxAnisotropy);
        mat.map.needsUpdate = true;
      }

      if (evictSecondaryMaps) {
        if (!savedMapsRegistry.has(mat)) {
          savedMapsRegistry.set(mat, {
            normalMap: mat.normalMap ?? null,
            roughnessMap: mat.roughnessMap ?? null,
            aoMap: mat.aoMap ?? null,
            bumpMap: mat.bumpMap ?? null,
          });
        }
        let mutated = false;
        if (mat.normalMap) {
          mat.normalMap = null;
          mutated = true;
        }
        if (mat.aoMap) {
          mat.aoMap = null;
          mutated = true;
        }
        if (mat.bumpMap) {
          mat.bumpMap = null;
          mutated = true;
        }
        if (mutated) {
          mat.needsUpdate = true;
        }
      } else if (savedMapsRegistry.has(mat)) {
        const saved = savedMapsRegistry.get(mat)!;
        let restored = false;
        if (!mat.normalMap && saved.normalMap) {
          mat.normalMap = saved.normalMap;
          restored = true;
        }
        if (!mat.aoMap && saved.aoMap) {
          mat.aoMap = saved.aoMap;
          restored = true;
        }
        if (!mat.bumpMap && saved.bumpMap) {
          mat.bumpMap = saved.bumpMap;
          restored = true;
        }
        if (restored) {
          mat.needsUpdate = true;
        }
        savedMapsRegistry.delete(mat);
      }
    }
  });
}

/**
 * AdaptiveQualityController
 *
 * Mounts inside any React Three Fiber `<Canvas>` (compatible with both `frameloop="demand"`
 * and `frameloop="always"`).
 *
 * Responsibilities:
 * 1. Samples active `useFrame` deltas while ignoring `frameloop="demand"` sleep gaps >= 200ms
 *    and hidden-tab background intervals.
 * 2. Feeds frame times, V8 JS heap utilization, and W3C `PressureObserver` thermal states into `QualityManager`.
 * 3. Smoothly updates `gl.setPixelRatio(...)`, shadow map state, and material residency budgets,
 *    calling `invalidate()` whenever quality changes.
 * 4. Publishes live `gl.info.render` (drawCalls, triangles) & `gl.info.memory` (geometries, textures)
 *    telemetry to `window.__GOLDEN_OAK_3D_TELEMETRY__[canvasName]` for automated `puppeteer-core` audits.
 */
export function AdaptiveQualityController({
  canvasName = 'default',
  qualityManager,
  enabled = true,
  telemetryThrottleMs = 200,
  onQualityChange,
  onTelemetrySnapshot,
}: AdaptiveQualityControllerProps) {
  const { gl, scene, invalidate } = useThree();
  const manager = qualityManager ?? getGlobalQualityManager();

  const onQualityChangeRef = useRef(onQualityChange);
  onQualityChangeRef.current = onQualityChange;

  const onTelemetrySnapshotRef = useRef(onTelemetrySnapshot);
  onTelemetrySnapshotRef.current = onTelemetrySnapshot;

  const isDocumentHiddenRef = useRef(false);
  const lastTelemetryPublishMsRef = useRef(0);
  const microtaskQueuedRef = useRef(false);
  const appliedDprRef = useRef<number>(-1);
  const appliedShadowsRef = useRef<boolean | null>(null);
  const appliedEvictRef = useRef<boolean>(false);
  const appliedAnisoRef = useRef<number>(-1);
  const savedMapsRegistryRef = useRef(new WeakMap<THREE.Material, SavedSecondaryMaps>());

  // Writes post-render gl.info metrics into window.__GOLDEN_OAK_3D_TELEMETRY__
  const publishTelemetrySnapshot = (force = false) => {
    if (typeof window === 'undefined') return;
    const now = performance.now();
    if (!force && now - lastTelemetryPublishMsRef.current < telemetryThrottleMs) {
      return;
    }
    lastTelemetryPublishMsRef.current = now;

    const qState = manager.getSnapshot();
    const perfMem = (
      performance as unknown as {
        memory?: { usedJSHeapSize?: number; jsHeapSizeLimit?: number };
      }
    ).memory;

    const entry: GoldenOak3DTelemetryEntry = {
      canvasName,
      mounted: true,
      updatedAt: Date.now(),
      profile: qState.effective.profile,
      qualityTier: qState.legacyTier,
      logicalTier: qState.logicalTier,
      androidTier: qState.androidTier,
      degradationStep: qState.degradationStep,
      lodLevel: qState.effective.lodLevel,
      effectiveDpr: qState.effective.effectiveDpr,
      dprScale: qState.effective.dprScale,
      fps: qState.metrics.avgFps,
      avgFrameTimeMs: qState.metrics.avgFrameTimeMs,
      p90FrameTimeMs: qState.metrics.p90FrameTimeMs,
      isIdle: qState.metrics.isIdle,
      idleGapsIgnored: qState.metrics.idleGapsIgnored,
      oscillationLocked: qState.oscillationLocked,
      shadowsEnabled: qState.effective.shadowsEnabled,
      postProcessingEnabled: qState.effective.postProcessingEnabled,
      secondaryMaterialEffects: qState.effective.secondaryMaterialEffects,
      evictSecondaryMaps: qState.effective.evictSecondaryMaps,
      maxTextureDimension: qState.effective.maxTextureDimension,
      drawCalls: gl.info?.render?.calls ?? 0,
      triangles: gl.info?.render?.triangles ?? 0,
      lines: gl.info?.render?.lines ?? 0,
      points: gl.info?.render?.points ?? 0,
      geometries: gl.info?.memory?.geometries ?? 0,
      textures: gl.info?.memory?.textures ?? 0,
      jsHeapUsedMb:
        typeof perfMem?.usedJSHeapSize === 'number'
          ? Number((perfMem.usedJSHeapSize / (1024 * 1024)).toFixed(1))
          : undefined,
      jsHeapLimitMb:
        typeof perfMem?.jsHeapSizeLimit === 'number'
          ? Number((perfMem.jsHeapSizeLimit / (1024 * 1024)).toFixed(1))
          : undefined,
      thermalState: qState.thermalState,
    };

    const win = window as unknown as TelemetryWindow;
    if (!win.__GOLDEN_OAK_3D_TELEMETRY__) {
      win.__GOLDEN_OAK_3D_TELEMETRY__ = {};
    }
    win.__GOLDEN_OAK_3D_TELEMETRY__[canvasName] = entry;
    onTelemetrySnapshotRef.current?.(entry);
  };

  // Lifecycle setup: hydrate capabilities, subscribe to QualityManager, visibilitychange, and PressureObserver
  useEffect(() => {
    const caps = detectExtendedDeviceCapabilities();
    manager.applyDeviceCapabilities(caps);

    const applyRendererQuality = (qState: QualityManagerState, isInitial = false) => {
      const { effective } = qState;
      let needsFrame = false;

      if (Math.abs(appliedDprRef.current - effective.effectiveDpr) > 0.01) {
        appliedDprRef.current = effective.effectiveDpr;
        try {
          gl.setPixelRatio(effective.effectiveDpr);
          needsFrame = true;
        } catch {
          // Safe fallback for mock renderers
        }
      }

      if (appliedShadowsRef.current !== effective.shadowsEnabled) {
        appliedShadowsRef.current = effective.shadowsEnabled;
        if (gl.shadowMap) {
          gl.shadowMap.enabled = effective.shadowsEnabled;
          gl.shadowMap.needsUpdate = true;
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('golden-oak:refresh-shadow'));
        }
        needsFrame = true;
      }

      if (
        appliedEvictRef.current !== effective.evictSecondaryMaps ||
        appliedAnisoRef.current !== effective.maxAnisotropy
      ) {
        appliedEvictRef.current = effective.evictSecondaryMaps;
        appliedAnisoRef.current = effective.maxAnisotropy;
        syncSceneMaterialBudget(
          scene,
          effective.maxAnisotropy,
          effective.evictSecondaryMaps,
          savedMapsRegistryRef.current
        );
        needsFrame = true;
      }

      if (needsFrame) {
        invalidate();
      }
      if (!isInitial) {
        onQualityChangeRef.current?.(qState);
      }
      publishTelemetrySnapshot(true);
    };

    applyRendererQuality(manager.getSnapshot(), true);

    const unsubscribeManager = manager.subscribe(() => {
      applyRendererQuality(manager.getSnapshot(), false);
    });

    const handleVisibilityChange = () => {
      isDocumentHiddenRef.current = typeof document !== 'undefined' ? document.hidden : false;
      if (!isDocumentHiddenRef.current) {
        invalidate();
      }
    };

    if (typeof document !== 'undefined') {
      isDocumentHiddenRef.current = document.hidden;
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    const cleanupThermal = observeThermalPressure((thermal) => {
      manager.setThermalState(thermal);
    });

    return () => {
      unsubscribeManager();
      cleanupThermal();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (typeof window !== 'undefined') {
        const win = window as unknown as TelemetryWindow;
        if (win.__GOLDEN_OAK_3D_TELEMETRY__?.[canvasName]) {
          win.__GOLDEN_OAK_3D_TELEMETRY__[canvasName] = {
            ...win.__GOLDEN_OAK_3D_TELEMETRY__[canvasName],
            mounted: false,
            updatedAt: Date.now(),
          };
        }
      }
    };
  }, [gl, scene, invalidate, manager, canvasName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Active frame delta & post-render gl.info telemetry sampler (priority 0 preserves R3F auto-render!)
  useFrame((_state, delta) => {
    if (!enabled || isDocumentHiddenRef.current) {
      return;
    }

    let heapUtilization: number | undefined;
    if (typeof performance !== 'undefined') {
      const mem = (
        performance as unknown as {
          memory?: { usedJSHeapSize?: number; jsHeapSizeLimit?: number };
        }
      ).memory;
      if (mem?.jsHeapSizeLimit && mem.jsHeapSizeLimit > 0 && typeof mem.usedJSHeapSize === 'number') {
        heapUtilization = mem.usedJSHeapSize / mem.jsHeapSizeLimit;
      }
    }

    manager.recordFrameDelta(delta, performance.now(), heapUtilization);

    // Queue post-render microtask so `gl.info.render.calls` and `triangles` reflect the completed
    // `gl.render(scene, camera)` pass even when `frameloop="demand"` renders a single frame and sleeps.
    if (!microtaskQueuedRef.current) {
      microtaskQueuedRef.current = true;
      queueMicrotask(() => {
        microtaskQueuedRef.current = false;
        publishTelemetrySnapshot(false);
      });
    }
  });

  return null;
}

export default AdaptiveQualityController;
