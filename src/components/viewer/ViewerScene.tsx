'use client';

import React, { Suspense, useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useProgress } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { ModelConfig } from '@/data/model-config';
import { useQualityTier, type QualityTier } from '@/hooks/useQualityTier';
import { enhanceWarriorMaterials } from './warrior-materials';
import { WebGLContextGuard, WebGLErrorBoundary } from '@/components/3d/WebGLContextGuard';
import { SafeContactShadows } from '@/components/3d/SafeContactShadows';
import {
  DemandFrameloopController,
  useDemandFrameloopContext,
} from '@/components/3d/DemandFrameloopController';
import { AdaptiveQualityController } from '@/components/3d/AdaptiveQualityController';
import {
  cloneSceneWithIsolatedMaterials,
  disposeInstanceClone,
  getRendererMemorySnapshot,
  type RendererMemorySnapshot,
} from '@/lib/three/resource-disposal';
import type { ViewerQualityMode } from './ViewerControls';

export interface DishViewerTelemetryPayload {
  mounted: boolean;
  dishSlug: string;
  modelPath: string;
  activeTier: QualityTier;
  tierProfile: 'ultra-light' | 'balanced' | 'high-fidelity';
  qualityMode: ViewerQualityMode;
  frameloop: 'always' | 'demand' | 'never';
  isDocumentVisible: boolean;
  isInViewport: boolean;
  dpr: number;
  memory: RendererMemorySnapshot;
  updatedAt: number;
}

interface DishTelemetryWindow {
  __GOLDEN_OAK_3D_TELEMETRY__?: Record<string, unknown>;
}

function normalizeOverrideTier(
  mode?: ViewerQualityMode | 'ultra-light' | 'balanced' | 'high-fidelity' | null
): QualityTier | null {
  if (!mode || mode === 'auto') return null;
  if (mode === 'low' || mode === 'ultra-light') return 'low';
  if (mode === 'medium' || mode === 'balanced') return 'medium';
  if (mode === 'high' || mode === 'high-fidelity') return 'high';
  return null;
}

function getTierProfileLabel(tier: QualityTier, qualityObj?: unknown): 'ultra-light' | 'balanced' | 'high-fidelity' {
  const peerProfile = (qualityObj as Record<string, unknown> | undefined)?.profile;
  if (
    peerProfile === 'ultra-light' ||
    peerProfile === 'balanced' ||
    peerProfile === 'high-fidelity'
  ) {
    return peerProfile;
  }
  if (tier === 'low') return 'ultra-light';
  if (tier === 'medium') return 'balanced';
  return 'high-fidelity';
}

/**
 * Resolves LOD model path if `config.lodPaths` or `config.resolveModelPath` is provided
 * by model-config upgrades, falling back deterministically to `config.modelPath`.
 */
export function resolveDishModelPath(
  config: ModelConfig,
  activeTier: QualityTier,
  qualityObj?: unknown
): string {
  const dynamicConfig = config as unknown as {
    modelPath: string;
    lodPaths?: Partial<Record<string, string>>;
    culinaryAssetLodPaths?: Partial<Record<string, string>>;
    resolveModelPath?: (tier: string) => string;
  };

  if (typeof dynamicConfig.resolveModelPath === 'function') {
    const resolved = dynamicConfig.resolveModelPath(activeTier);
    if (typeof resolved === 'string' && resolved.length > 0) {
      return resolved;
    }
  }

  const lodPaths = dynamicConfig.culinaryAssetLodPaths || dynamicConfig.lodPaths;
  if (lodPaths && typeof lodPaths === 'object') {
    const peerLod = (qualityObj as Record<string, unknown> | undefined)?.lodLevel;
    const numericLodKey =
      peerLod === 2
        ? 'ultraLight'
        : peerLod === 1
          ? 'balanced'
          : peerLod === 0
            ? 'high'
            : '';
    const candidateKeys = [
      numericLodKey,
      typeof peerLod === 'string' ? peerLod : '',
      activeTier,
      activeTier === 'low'
        ? 'ultraLight'
        : activeTier === 'medium'
          ? 'balanced'
          : 'high',
      activeTier === 'low'
        ? 'ultra-light'
        : activeTier === 'medium'
          ? 'balanced'
          : 'high-fidelity',
      activeTier === 'low' ? 'lod2' : activeTier === 'medium' ? 'lod1' : 'lod0',
    ].filter(Boolean);

    for (const key of candidateKeys) {
      const candidate = lodPaths[key];
      if (typeof candidate === 'string' && candidate.length > 0) {
        return candidate;
      }
    }
  }

  return config.modelPath;
}

interface FoodModelProps {
  config: ModelConfig;
  modelPath: string;
  activeTier: QualityTier;
  maxAnisotropy: number;
  simplifyTransmission: boolean;
  onLoaded?: () => void;
  onProgress?: (progress: number) => void;
}

function FoodModel({
  config,
  modelPath,
  activeTier,
  maxAnisotropy,
  simplifyTransmission,
  onLoaded,
  onProgress,
}: FoodModelProps) {
  const { scene } = useGLTF(modelPath, '/draco/');
  const { invalidate } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  // Clone hierarchy with isolated per-instance Materials while sharing cached BufferGeometries & Textures
  const clonedScene = useMemo(() => {
    const clone = cloneSceneWithIsolatedMaterials(scene);
    enhanceWarriorMaterials(clone);
    return clone;
  }, [scene]);

  // Apply tier-calibrated material properties to isolated instance materials
  useEffect(() => {
    const envBoost = activeTier === 'high' ? 1.0 : activeTier === 'medium' ? 0.8 : 0.0;

    clonedScene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = false;

      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (!mat) continue;
        const stdMat = mat as THREE.MeshPhysicalMaterial;
        if ('envMapIntensity' in stdMat) {
          stdMat.envMapIntensity = envBoost;
        }
        if (simplifyTransmission && 'transmission' in stdMat && stdMat.transmission > 0) {
          stdMat.transmission = 0;
          stdMat.transparent = true;
          stdMat.opacity = Math.min(stdMat.opacity ?? 1, 0.88);
        }
        if (stdMat.map && typeof stdMat.map.anisotropy === 'number') {
          stdMat.map.anisotropy = Math.min(maxAnisotropy, 8);
        }
        mat.needsUpdate = true;
      }
    });

    invalidate();
  }, [clonedScene, activeTier, maxAnisotropy, simplifyTransmission, invalidate]);

  // Deterministic GPU disposal of cloned materials when switching dishes, LODs, or unmounting
  useEffect(() => {
    return () => {
      disposeInstanceClone(clonedScene);
    };
  }, [clonedScene]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.set(...config.initialRotation);
    }
    onProgress?.(100);
    onLoaded?.();
    invalidate();
  }, [clonedScene, config.initialRotation, onLoaded, onProgress, invalidate]);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive
        object={clonedScene}
        scale={config.initialScale}
        position={[0, 0, 0]}
        dispose={null}
      />
    </group>
  );
}

function LoadingTracker({ onProgress }: { onProgress: (progress: number) => void }) {
  const { progress } = useProgress();
  useEffect(() => {
    onProgress(progress);
  }, [progress, onProgress]);
  return null;
}

/**
 * Procedural Studio IBL & Renderer Calibration Manager
 *
 * - Configures ACESFilmicToneMapping and tier-calibrated exposure/DPR.
 * - Generates a compact procedural `RoomEnvironment` PMREM cubemap ONLY on `medium` and `high`
 *   tiers (100% offline, 0 network requests), disposing `RoomEnvironment` and `PMREMGenerator`
 *   immediately after baking, and disposing the `WebGLRenderTarget` cleanly on tier downgrade or unmount.
 */
function StudioEnvironmentAndToneManager({
  activeTier,
  environmentEnabled,
  environmentIntensity,
  toneMappingExposure,
}: {
  activeTier: QualityTier;
  environmentEnabled: boolean;
  environmentIntensity: number;
  toneMappingExposure: number;
}) {
  const get = useThree((state) => state.get);
  const envTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);

  // Sync tone mapping & exposure
  useEffect(() => {
    const { gl: renderer, invalidate } = get();
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = toneMappingExposure;
    invalidate();
  }, [get, toneMappingExposure]);

  // Manage procedural RoomEnvironment IBL lifecycle
  useEffect(() => {
    const { gl: renderer, scene: rootScene, invalidate } = get();

    if (!environmentEnabled) {
      if (envTargetRef.current) {
        if (rootScene.environment === envTargetRef.current.texture) {
          rootScene.environment = null;
        }
        envTargetRef.current.dispose();
        envTargetRef.current = null;
      } else {
        rootScene.environment = null;
      }
      invalidate();
      return;
    }

    let envRT = envTargetRef.current;
    if (!envRT) {
      let pmremGenerator: THREE.PMREMGenerator | null = null;
      let roomScene: RoomEnvironment | null = null;
      try {
        pmremGenerator = new THREE.PMREMGenerator(renderer);
        roomScene = new RoomEnvironment();
        envRT = pmremGenerator.fromScene(roomScene, 0.04);
        envTargetRef.current = envRT;
      } catch {
        envRT = null;
      } finally {
        roomScene?.dispose?.();
        pmremGenerator?.dispose();
      }
    }

    if (envRT) {
      rootScene.environment = envRT.texture;
    }
    invalidate();

    return () => {
      if (envTargetRef.current) {
        if (rootScene.environment === envTargetRef.current.texture) {
          rootScene.environment = null;
        }
        envTargetRef.current.dispose();
        envTargetRef.current = null;
      }
    };
  }, [get, environmentEnabled]);

  useEffect(() => {
    const { scene: rootScene, invalidate } = get();
    if (environmentEnabled && 'environmentIntensity' in rootScene) {
      (rootScene as THREE.Scene & { environmentIntensity: number }).environmentIntensity =
        environmentIntensity;
      invalidate();
    }
  }, [get, activeTier, environmentEnabled, environmentIntensity]);

  return null;
}

/**
 * Imperative camera preset, zoom, and reset bridge using DemandFrameloopController context.
 */
function ViewerCameraRigBridge({
  cameraDistance,
  dishSlug,
  cameraPreset,
  prefersReducedMotion,
  zoomSignal,
  resetSignal,
  controlsRef,
  turntableRef,
  onResetComplete,
}: {
  cameraDistance: number;
  dishSlug: string;
  cameraPreset: 'side' | 'top';
  prefersReducedMotion: boolean;
  zoomSignal?: { id: number; factor: number } | null;
  resetSignal?: number;
  controlsRef: React.RefObject<OrbitControlsType | null>;
  turntableRef: React.RefObject<THREE.Group | null>;
  onResetComplete: () => void;
}) {
  const demandCtx = useDemandFrameloopContext();
  const transitionTo = demandCtx?.transitionTo;

  // Smooth on-demand camera preset glide ('side' <-> 'top') & dish framing updates
  useEffect(() => {
    if (!transitionTo) return;
    const lambda = prefersReducedMotion ? 999 : 6.0;
    if (cameraPreset === 'top') {
      transitionTo({
        position: [0, cameraDistance * 1.15, 0.001],
        target: [0, 0.8, 0],
        dampingLambda: lambda,
      });
    } else {
      transitionTo({
        position: [0, cameraDistance * 0.35, cameraDistance],
        target: [0, 0.8, 0],
        dampingLambda: lambda,
      });
    }
  }, [transitionTo, cameraPreset, cameraDistance, dishSlug, prefersReducedMotion]);

  // Smooth on-demand Zoom In / Zoom Out handler
  useEffect(() => {
    if (!zoomSignal || !transitionTo) return;
    const controls = controlsRef.current;
    if (!controls) return;

    const cam = controls.object;
    const offset = cam.position.clone().sub(controls.target);
    const currentDist = offset.length() || cameraDistance;
    const minDist = controls.minDistance || 2;
    const maxDist = controls.maxDistance || 12;
    const nextDist = Math.min(maxDist, Math.max(minDist, currentDist * zoomSignal.factor));

    if (offset.lengthSq() < 0.00001) {
      offset.set(0, cameraDistance * 0.35, cameraDistance);
    }
    offset.setLength(nextDist);
    const nextPos = controls.target.clone().add(offset);

    transitionTo({
      position: [nextPos.x, nextPos.y, nextPos.z],
      target: [controls.target.x, controls.target.y, controls.target.z],
      dampingLambda: prefersReducedMotion ? 999 : 8.5,
    });
  }, [transitionTo, zoomSignal, cameraDistance, prefersReducedMotion, controlsRef]);

  // Smooth Reset handler
  useEffect(() => {
    if (!resetSignal || !transitionTo) return;
    if (turntableRef.current) {
      turntableRef.current.rotation.y = 0;
    }
    transitionTo(
      {
        position: [0, cameraDistance * 0.35, cameraDistance],
        target: [0, 0.8, 0],
        dampingLambda: prefersReducedMotion ? 999 : 7.0,
      },
      onResetComplete
    );
  }, [transitionTo, resetSignal, cameraDistance, prefersReducedMotion, turntableRef, onResetComplete]);

  return null;
}

/**
 * Tier-Calibrated Studio Food Lighting Rig
 * - low (`ultra-light`): 2 lights (Hemisphere + Key Directional) — minimizes mobile fragment shader ALU
 * - medium (`balanced`): 3 lights (Hemisphere + Key + Warm Rim/Fill) + subtle RoomEnvironment IBL
 * - high (`high-fidelity`): 4 studio lights (Hemisphere + Key + Warm Fill + Golden Rim) + RoomEnvironment IBL
 */
function TierAwareDishLighting({ activeTier }: { activeTier: QualityTier }) {
  if (activeTier === 'low') {
    return (
      <>
        <hemisphereLight args={['#FFF6E8', '#2A1F18', 1.18]} />
        <directionalLight position={[5, 8, 5]} intensity={1.52} color="#FFF8EE" />
      </>
    );
  }

  if (activeTier === 'medium') {
    return (
      <>
        <hemisphereLight args={['#FFF6E8', '#241B14', 0.85]} />
        <directionalLight position={[5, 8, 5]} intensity={1.18} color="#FFFDF8" />
        <directionalLight position={[-5, 5, -4]} intensity={0.52} color="#FFE8C2" />
      </>
    );
  }

  return (
    <>
      <hemisphereLight args={['#FFF8EE', '#241B14', 0.72]} />
      <directionalLight position={[5, 8, 5]} intensity={1.15} color="#FFFFFF" />
      <directionalLight position={[-5, 5, -5]} intensity={0.48} color="#FFF2DC" />
      <directionalLight position={[0, -2, 3]} intensity={0.28} color="#E2A84B" />
    </>
  );
}

/**
 * AutoPresentation Turntable Controller
 *
 * Gently rotates ONLY the dedicated dish turntable `<group>` (NEVER `state.scene.rotation.y`,
 * keeping studio lights and shadows stationary!) for up to 3 seconds on initial dish reveal,
 * and stops immediately upon any user interaction or reduced-motion preference.
 */
function AutoPresentation({
  active,
  turntableRef,
  dishSlug,
  onComplete,
}: {
  active: boolean;
  turntableRef: React.RefObject<THREE.Group | null>;
  dishSlug: string;
  onComplete?: () => void;
}) {
  const { invalidate } = useThree();
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);

  // Reset turntable angle cleanly when dish changes
  useEffect(() => {
    elapsedRef.current = 0;
    completedRef.current = false;
    if (turntableRef.current) {
      turntableRef.current.rotation.y = 0;
    }
    invalidate();
  }, [dishSlug, turntableRef, invalidate]);

  useEffect(() => {
    if (active && !completedRef.current) {
      invalidate();
    }
  }, [active, invalidate]);

  useFrame((_, delta) => {
    if (!active || completedRef.current) return;

    const clampedDelta = Math.min(delta, 0.05);
    elapsedRef.current += clampedDelta;

    if (turntableRef.current && elapsedRef.current < 3.0) {
      // Smooth ease-out angular velocity so the dish settles gracefully
      const progress = elapsedRef.current / 3.0;
      const easeOut = 1 - progress * progress;
      turntableRef.current.rotation.y += clampedDelta * 0.55 * easeOut;
      invalidate();
    }

    if (elapsedRef.current >= 3.0 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
      invalidate();
    }
  });

  return null;
}

/**
 * Publishes live WebGL renderer memory & draw-call telemetry to
 * `window.__GOLDEN_OAK_3D_TELEMETRY__['DishViewer']` for headless verification.
 */
function ViewerTelemetryBridge({
  dishSlug,
  modelPath,
  activeTier,
  tierProfile,
  qualityMode,
  frameloop,
  isDocumentVisible,
  isInViewport,
}: {
  dishSlug: string;
  modelPath: string;
  activeTier: QualityTier;
  tierProfile: 'ultra-light' | 'balanced' | 'high-fidelity';
  qualityMode: ViewerQualityMode;
  frameloop: 'always' | 'demand' | 'never';
  isDocumentVisible: boolean;
  isInViewport: boolean;
}) {
  const { gl } = useThree();

  const publishSnapshot = useCallback(
    (mounted: boolean) => {
      if (typeof window === 'undefined') return;
      const telemetryWin = window as unknown as DishTelemetryWindow;
      if (!telemetryWin.__GOLDEN_OAK_3D_TELEMETRY__) {
        telemetryWin.__GOLDEN_OAK_3D_TELEMETRY__ = {};
      }
      const snapshot = getRendererMemorySnapshot(gl);
      const payload: DishViewerTelemetryPayload & Record<string, unknown> = {
        canvasName: 'DishViewer',
        mounted,
        dishSlug,
        modelPath,
        activeTier,
        qualityTier: activeTier,
        profile: tierProfile,
        tierProfile,
        qualityMode,
        frameloop,
        isDocumentVisible,
        isInViewport,
        dpr: typeof gl.getPixelRatio === 'function' ? gl.getPixelRatio() : 1,
        effectiveDpr: typeof gl.getPixelRatio === 'function' ? gl.getPixelRatio() : 1,
        drawCalls: snapshot.calls,
        triangles: snapshot.triangles,
        geometries: snapshot.geometries,
        textures: snapshot.textures,
        memory: snapshot,
        updatedAt: Date.now(),
      };
      telemetryWin.__GOLDEN_OAK_3D_TELEMETRY__['DishViewer'] = payload;
    },
    [
      gl,
      dishSlug,
      modelPath,
      activeTier,
      tierProfile,
      qualityMode,
      frameloop,
      isDocumentVisible,
      isInViewport,
    ]
  );

  useEffect(() => {
    publishSnapshot(true);
    return () => {
      publishSnapshot(false);
    };
  }, [publishSnapshot]);

  useFrame(() => {
    publishSnapshot(true);
  });

  return null;
}

export interface ViewerSceneProps {
  config: ModelConfig;
  category?: string;
  autoRotate: boolean;
  showHotspots?: boolean;
  cameraPreset?: 'side' | 'top';
  shadowTrigger?: number;
  qualityMode?: ViewerQualityMode;
  zoomSignal?: { id: number; factor: number } | null;
  resetSignal?: number;
  onActiveQualityChange?: (tier: QualityTier) => void;
  onControlsRef: (controls: OrbitControlsType | null) => void;
  onProgress: (progress: number) => void;
  onLoaded: () => void;
  onError: (error: string) => void;
  onDoubleTap: () => void;
}

export function ViewerScene({
  config,
  autoRotate,
  cameraPreset = 'side',
  shadowTrigger,
  qualityMode = 'auto',
  zoomSignal,
  resetSignal,
  onActiveQualityChange,
  onControlsRef,
  onProgress,
  onLoaded,
  onError,
  onDoubleTap,
}: ViewerSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const turntableRef = useRef<THREE.Group>(null);
  const internalControlsRef = useRef<OrbitControlsType | null>(null);
  const lastTapRef = useRef(0);

  const overrideTier = useMemo(() => normalizeOverrideTier(qualityMode), [qualityMode]);
  const quality = useQualityTier({
    initialTier: 'medium',
    overrideTier,
  });

  const activeTier: QualityTier = quality.qualityTier;
  const tierProfile = getTierProfileLabel(activeTier, quality);
  const prefersReducedMotion = Boolean(quality.prefersReducedMotion);

  useEffect(() => {
    onActiveQualityChange?.(activeTier);
  }, [activeTier, onActiveQualityChange]);

  const resolvedModelPath = useMemo(
    () => resolveDishModelPath(config, activeTier, quality),
    [config, activeTier, quality]
  );

  // Clean React state for initial 3s presentation turntable (replaces broken presentationRef)
  const [presentationActive, setPresentationActive] = useState<boolean>(true);
  const [shadowKey, setShadowKey] = useState(0);

  // Lifecycle suspension states: Page Visibility API + Viewport IntersectionObserver
  const [isDocumentVisible, setIsDocumentVisible] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.visibilityState !== 'hidden' : true
  );
  const [isInViewport, setIsInViewport] = useState<boolean>(true);

  // Document visibility listener: suspends GPU rendering when browser tab is backgrounded
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibility = () => {
      setIsDocumentVisible(document.visibilityState !== 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Viewport IntersectionObserver: suspends GPU rendering when canvas scrolls off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsInViewport(entry.isIntersecting && entry.intersectionRatio > 0);
        }
      },
      { threshold: 0.01 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  const triggerShadowRefresh = useCallback(() => {
    setShadowKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const handleGlobalRefresh = () => triggerShadowRefresh();
    window.addEventListener('golden-oak:refresh-shadow', handleGlobalRefresh);
    return () => window.removeEventListener('golden-oak:refresh-shadow', handleGlobalRefresh);
  }, [triggerShadowRefresh]);

  const effectiveShadowKey = `${shadowKey}-${shadowTrigger ?? 'init'}`;

  const stopPresentationOnInteract = useCallback(() => {
    setPresentationActive((prev) => (prev ? false : prev));
  }, []);

  const handlePointerDown = useCallback(() => {
    stopPresentationOnInteract();
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onDoubleTap();
    }
    lastTapRef.current = now;
  }, [onDoubleTap, stopPresentationOnInteract]);

  const handlePresentationComplete = useCallback(() => {
    setPresentationActive(false);
    triggerShadowRefresh();
  }, [triggerShadowRefresh]);

  const handleModelLoaded = useCallback(() => {
    triggerShadowRefresh();
    onLoaded();
  }, [onLoaded, triggerShadowRefresh]);

  // Effective frameloop per Section 10:
  // - Offscreen or backgrounded tab -> 'never' (0 CPU, 0 GPU, 0 battery)
  // - Continuous autoRotate (without reduced motion) -> 'always'
  // - Default interactive & idle mode -> 'demand' (drops to 0 FPS when settled)
  const isRenderAllowed = isDocumentVisible && isInViewport;
  const shouldAutoRotate = autoRotate && !prefersReducedMotion;
  const effectiveFrameloop: 'always' | 'demand' | 'never' = !isRenderAllowed
    ? 'never'
    : shouldAutoRotate
      ? 'always'
      : 'demand';

  // Tier-calibrated DPR, tone mapping, IBL, and ContactShadow settings
  const tierDpr: number | [number, number] =
    activeTier === 'low' ? 1 : activeTier === 'medium' ? [1, 1.25] : [1, 1.5];
  const tierAntialias = activeTier !== 'low';
  const tierPowerPreference: WebGLPowerPreference =
    activeTier === 'low'
      ? 'low-power'
      : activeTier === 'medium'
        ? 'default'
        : 'high-performance';
  const tierEnvEnabled = activeTier !== 'low';
  const tierEnvIntensity = activeTier === 'high' ? 0.72 : activeTier === 'medium' ? 0.55 : 0;
  const tierExposure = activeTier === 'low' ? 1.22 : activeTier === 'medium' ? 1.18 : 1.16;
  const tierShadowResolution =
    activeTier === 'high' && !quality.isMobile ? 1024 : 512;

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      onWheel={stopPresentationOnInteract}
      onTouchStart={stopPresentationOnInteract}
    >
      <WebGLErrorBoundary
        name={`3D Dish Showcase (${config.dishSlug})`}
        onError={(err) => onError(err.message)}
      >
        <Canvas
          frameloop={effectiveFrameloop}
          camera={{
            position: [0, config.cameraDistance * 0.35, config.cameraDistance],
            fov: 38,
            near: 0.1,
            far: 100,
          }}
          gl={{
            antialias: tierAntialias,
            alpha: true,
            powerPreference: tierPowerPreference,
            stencil: false,
            depth: true,
          }}
          dpr={tierDpr}
          style={{ background: 'transparent' }}
          onPointerDown={handlePointerDown}
        >
          {/* WebGL Context Loss & Recovery Guard */}
          <WebGLContextGuard
            canvasName={`Dish 3D Viewer (${config.dishSlug})`}
            onContextLost={() => {
              console.warn(`[ViewerScene] Context lost for ${config.dishSlug}`);
            }}
            onContextRestored={() => {
              console.info(`[ViewerScene] Context restored for ${config.dishSlug}`);
              triggerShadowRefresh();
            }}
            onReinitialize={(scene) => {
              enhanceWarriorMaterials(scene);
            }}
            restoreTimeoutMs={5000}
            onRestoreTimeout={() => {
              onError('Graphics context was suspended due to device memory constraints. Tap Retry to reload.');
            }}
          />

          {/* Runtime FPS Hysteresis & Progressive Quality Manager */}
          <AdaptiveQualityController
            canvasName="DishViewer_Adaptive"
            enabled={isRenderAllowed && qualityMode === 'auto'}
          />

          {/* Procedural Studio IBL (medium/high only) & ACES Filmic Tone Mapping */}
          <StudioEnvironmentAndToneManager
            activeTier={activeTier}
            environmentEnabled={tierEnvEnabled}
            environmentIntensity={tierEnvIntensity}
            toneMappingExposure={tierExposure}
          />

          {/* Tier-Calibrated Studio Food Lighting Rig (2 / 3 / 4 lights, 100% offline) */}
          <TierAwareDishLighting activeTier={activeTier} />

          {/* On-Demand Rendering Coordinator (drops to 0 FPS when camera & damping settle) */}
          <DemandFrameloopController
            controlsRef={internalControlsRef}
            deps={[
              config.dishSlug,
              resolvedModelPath,
              activeTier,
              effectiveShadowKey,
              isDocumentVisible,
              isInViewport,
            ]}
          >
            <ViewerCameraRigBridge
              cameraDistance={config.cameraDistance}
              dishSlug={config.dishSlug}
              cameraPreset={cameraPreset}
              prefersReducedMotion={prefersReducedMotion}
              zoomSignal={zoomSignal}
              resetSignal={resetSignal}
              controlsRef={internalControlsRef}
              turntableRef={turntableRef}
              onResetComplete={triggerShadowRefresh}
            />
          </DemandFrameloopController>

          {/* Initial 3-second turntable reveal (rotates ONLY model group, never scene lights!) */}
          <AutoPresentation
            active={
              presentationActive &&
              !prefersReducedMotion &&
              !shouldAutoRotate &&
              isRenderAllowed &&
              !zoomSignal &&
              !resetSignal
            }
            turntableRef={turntableRef}
            dishSlug={config.dishSlug}
            onComplete={handlePresentationComplete}
          />

          {/* LoadingTracker outside Suspense so it reports real-time download progress */}
          <LoadingTracker onProgress={onProgress} />

          <Suspense fallback={null}>
            <group ref={turntableRef}>
              {(quality.isHydrated || Boolean(overrideTier)) && (
                <FoodModel
                  key={config.dishSlug}
                  config={config}
                  modelPath={resolvedModelPath}
                  activeTier={activeTier}
                  maxAnisotropy={quality.maxAnisotropy}
                  simplifyTransmission={quality.simplifyTransmission}
                  onLoaded={handleModelLoaded}
                  onProgress={onProgress}
                />
              )}
            </group>

            {/* Contact Shadows: 0-RenderTarget static disc on low tier, 1-frame baked on medium/high */}
            <SafeContactShadows
              position={[0, -0.05, 0]}
              opacity={activeTier === 'low' ? 0.45 : 0.5}
              scale={10}
              blur={2.4}
              far={4}
              resolution={tierShadowResolution}
              frames={1}
              smooth={activeTier === 'high'}
              fastStaticFallback={activeTier === 'low'}
              refreshTrigger={effectiveShadowKey}
            />
          </Suspense>

          <OrbitControls
            ref={(ref) => {
              internalControlsRef.current = ref;
              onControlsRef(ref);
            }}
            autoRotate={shouldAutoRotate && isRenderAllowed}
            autoRotateSpeed={1.5}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={12}
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 12}
            panSpeed={0.5}
            rotateSpeed={0.8}
            zoomSpeed={1.0}
            enableDamping={!prefersReducedMotion}
            dampingFactor={0.08}
            target={[0, 0.8, 0]}
            makeDefault
          />

          {/* Live WebGL Memory & Render Telemetry for Headless Verification */}
          <ViewerTelemetryBridge
            dishSlug={config.dishSlug}
            modelPath={resolvedModelPath}
            activeTier={activeTier}
            tierProfile={tierProfile}
            qualityMode={qualityMode}
            frameloop={effectiveFrameloop}
            isDocumentVisible={isDocumentVisible}
            isInViewport={isInViewport}
          />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
