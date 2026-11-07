'use client';

import { Suspense, useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useProgress, AdaptiveDpr } from '@react-three/drei';
import { CanvasTexture, Vector3 } from 'three';
import type { Group, Mesh, Material } from 'three';
import type { ModelConfig } from '@/data/model-config';
import type { IngredientHotspot } from '@/data/ar-config';
import { useQualityTier } from '@/hooks/useQualityTier';
import { enhanceWarriorMaterials } from '@/components/viewer/warrior-materials';
import { SafeContactShadows } from '@/components/3d/SafeContactShadows';
import { WebGLContextGuard, WebGLErrorBoundary } from '@/components/3d/WebGLContextGuard';
import {
  DEFAULT_AR_LIGHT_ESTIMATE,
  resolveTieredModelPath,
  type RealWorldLightEstimate,
} from '@/lib/three/ar-capabilities';

export interface ARTelemetrySnapshot {
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
  preserveDrawingBuffer: false;
  frameloop: 'always' | 'demand' | 'never';
  qualityTier: string;
  dpr: number;
  ambientIntensity: number;
  lightingLabel: string;
  updatedAt: number;
}

declare global {
  interface Window {
    __GOLDEN_OAK_3D_TELEMETRY__?: Record<string, unknown>;
  }
}

/**
 * Generates a compact 64x64 soft radial occlusion gradient texture for grounded AR table contact.
 * Replaces multi-pass shadow maps with 1 draw call and 0 per-frame FBO blits on mobile TBDR GPUs.
 */
function createContactDiscTexture(): CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 2, half, half, half);
  grad.addColorStop(0, 'rgba(12, 8, 5, 0.82)');
  grad.addColorStop(0.42, 'rgba(16, 11, 7, 0.48)');
  grad.addColorStop(0.75, 'rgba(20, 14, 9, 0.14)');
  grad.addColorStop(1, 'rgba(20, 14, 9, 0)');

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Lightweight 1-draw-call grounded contact shadow & subtle placement rim scaled to the dish footprint.
 */
function GroundContactDisc({
  footprintScale,
  opacity,
}: {
  footprintScale: number;
  opacity: number;
}) {
  const shadowTexture = useMemo(() => createContactDiscTexture(), []);

  useEffect(() => {
    return () => {
      shadowTexture?.dispose();
    };
  }, [shadowTexture]);

  const radius = Math.max(0.36, footprintScale * 0.68);

  return (
    <mesh position={[0, -0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
      <circleGeometry args={[radius, 40]} />
      <meshBasicMaterial
        map={shadowTexture ?? undefined}
        color={shadowTexture ? '#ffffff' : '#0f0a06'}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
}

// AR Reticle - crisp luxury gold placement target ring
function ARReticle({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <group position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Soft center ground hint */}
      <mesh>
        <circleGeometry args={[0.2, 40]} />
        <meshBasicMaterial color="#120d09" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {/* Outer ring */}
      <mesh>
        <ringGeometry args={[0.2, 0.235, 56]} />
        <meshBasicMaterial color="#c9a84c" transparent opacity={0.62} depthWrite={false} />
      </mesh>
      {/* Inner ring */}
      <mesh>
        <ringGeometry args={[0.145, 0.162, 48]} />
        <meshBasicMaterial color="#f0c36b" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      {/* Center dot */}
      <mesh>
        <circleGeometry args={[0.028, 24]} />
        <meshBasicMaterial color="#f0c36b" transparent opacity={0.75} depthWrite={false} />
      </mesh>
      {/* Cardinal alignment ticks */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle) * 0.218, Math.sin(angle) * 0.218, 0]}>
          <circleGeometry args={[0.012, 12]} />
          <meshBasicMaterial color="#ffe3a5" transparent opacity={0.88} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// AR Food Model with 400ms cubic ease-out placement settle & clean per-instance material disposal
interface ARFoodModelProps {
  modelPath: string;
  initialScale: number;
  placed: boolean;
  scale: number;
  rotation: number;
  offsetXZ: [number, number];
  settleKey: number;
  onLoaded?: () => void;
  onProgress?: (progress: number) => void;
}

function ARFoodModel({
  modelPath,
  initialScale,
  placed,
  scale,
  rotation,
  offsetXZ,
  settleKey,
  onLoaded,
  onProgress,
}: ARFoodModelProps) {
  const { scene } = useGLTF(modelPath, '/draco/');
  const { invalidate } = useThree();
  const groupRef = useRef<Group>(null);
  const animRef = useRef(placed ? 0 : 0);

  // Clone hierarchy AND per-instance materials so dish switches never leak or mutate shared glTF materials
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((mat: Material) => (mat ? mat.clone() : mat));
        } else if (mesh.material) {
          mesh.material = mesh.material.clone();
        }
      }
    });
    enhanceWarriorMaterials(clone);
    return clone;
  }, [scene]);

  // Dispose ONLY per-instance cloned materials on dish switch or AR exit; shared BufferGeometries remain intact
  useEffect(() => {
    return () => {
      clonedScene.traverse((child) => {
        if ((child as Mesh).isMesh) {
          const mesh = child as Mesh;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            if (mat && typeof mat.dispose === 'function') {
              mat.dispose();
            }
          });
        }
      });
    };
  }, [clonedScene]);

  useEffect(() => {
    onProgress?.(100);
    onLoaded?.();
    invalidate();
  }, [clonedScene, onLoaded, onProgress, invalidate]);

  // Reset brief 400ms settle animation when placed or switched
  useEffect(() => {
    if (placed) {
      animRef.current = 0.08;
      invalidate();
    } else {
      animRef.current = 0;
    }
  }, [placed, settleKey, modelPath, invalidate]);

  useFrame((_, delta) => {
    if (!placed || !groupRef.current) return;

    if (animRef.current < 1) {
      // Complete settle within ~400ms (delta * 2.6)
      animRef.current = Math.min(1, animRef.current + Math.min(delta, 0.05) * 2.6);
      invalidate();
    }

    const eased = 1 - Math.pow(1 - animRef.current, 3);
    const currentScale = initialScale * scale * eased;
    groupRef.current.scale.set(currentScale, currentScale, currentScale);
    groupRef.current.rotation.y = rotation;
    groupRef.current.position.set(offsetXZ[0], 0, offsetXZ[1]);
  });

  // Ensure synchronous transform updates even when frameloop is 'demand' and animRef === 1
  useEffect(() => {
    if (!placed || !groupRef.current) return;
    const eased = animRef.current >= 1 ? 1 : 1 - Math.pow(1 - animRef.current, 3);
    const currentScale = initialScale * scale * Math.max(0.08, eased);
    groupRef.current.scale.set(currentScale, currentScale, currentScale);
    groupRef.current.rotation.y = rotation;
    groupRef.current.position.set(offsetXZ[0], 0, offsetXZ[1]);
    invalidate();
  }, [placed, initialScale, scale, rotation, offsetXZ, invalidate]);

  if (!placed) return null;

  return (
    <group ref={groupRef} position={[offsetXZ[0], 0, offsetXZ[1]]}>
      <primitive object={clonedScene} dispose={null} />
    </group>
  );
}

// 3D Hotspot markers (grounded static markers compatible with 0-FPS demand rendering)
interface HotspotMarkersProps {
  hotspots: IngredientHotspot[];
  visible: boolean;
  dishScale: number;
  offsetXZ: [number, number];
}

function HotspotMarkers({ hotspots, visible, dishScale, offsetXZ }: HotspotMarkersProps) {
  if (!visible || hotspots.length === 0) return null;

  return (
    <group position={[offsetXZ[0], 0, offsetXZ[1]]}>
      {hotspots.map((hp) => {
        const stemHeight = Math.max(0.02, hp.position[1] * dishScale * 0.5);
        return (
          <group
            key={hp.id}
            position={[
              hp.position[0] * dishScale,
              hp.position[1] * dishScale + 0.05,
              hp.position[2] * dishScale,
            ]}
          >
            {/* Inner gold pin */}
            <mesh>
              <sphereGeometry args={[0.022, 12, 12]} />
              <meshBasicMaterial color="#f0c36b" transparent opacity={0.92} />
            </mesh>
            {/* Outer halo */}
            <mesh>
              <sphereGeometry args={[0.036, 12, 12]} />
              <meshBasicMaterial color="#c9a84c" transparent opacity={0.18} depthWrite={false} />
            </mesh>
            {/* Stem line down to dish */}
            <mesh position={[0, -0.025, 0]}>
              <cylinderGeometry args={[0.0018, 0.0018, stemHeight, 4]} />
              <meshBasicMaterial color="#c9a84c" transparent opacity={0.28} />
            </mesh>
          </group>
        );
      })}
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

// Reusable scratch vector to prevent per-frame GC allocations
const scratchHotspotVector = new Vector3();

// Demand-safe 3D-to-2D Hotspot Projector with 0.5px epsilon guard to prevent re-render loops
function HotspotProjector({
  hotspots,
  dishScale,
  rotation,
  offsetXZ,
  onProjected,
}: {
  hotspots: IngredientHotspot[];
  dishScale: number;
  rotation: number;
  offsetXZ: [number, number];
  onProjected: (
    projected: Array<{
      id: string;
      name: string;
      description: string;
      screenX: number;
      screenY: number;
    }>
  ) => void;
}) {
  const { camera, size } = useThree();
  const lastUpdateRef = useRef(0);
  const lastSignatureRef = useRef('');

  const computeAndEmit = useCallback(() => {
    if (hotspots.length === 0) {
      if (lastSignatureRef.current !== 'empty') {
        lastSignatureRef.current = 'empty';
        onProjected([]);
      }
      return;
    }

    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);

    const projected = hotspots.map((hp) => {
      const localX = hp.position[0] * dishScale;
      const localZ = hp.position[2] * dishScale;
      const rotatedX = localX * cosR + localZ * sinR + offsetXZ[0];
      const rotatedZ = -localX * sinR + localZ * cosR + offsetXZ[1];

      scratchHotspotVector.set(rotatedX, hp.position[1] * dishScale + 0.08, rotatedZ);
      scratchHotspotVector.project(camera);
      return {
        id: hp.id,
        name: hp.name,
        description: hp.description,
        screenX: ((scratchHotspotVector.x + 1) / 2) * size.width,
        screenY: ((-scratchHotspotVector.y + 1) / 2) * size.height,
      };
    });

    const sig = projected
      .map((p) => `${p.id}:${Math.round(p.screenX * 2)}:${Math.round(p.screenY * 2)}`)
      .join('|');
    if (sig !== lastSignatureRef.current) {
      lastSignatureRef.current = sig;
      onProjected(projected);
    }
  }, [hotspots, dishScale, rotation, offsetXZ, camera, size.width, size.height, onProjected]);

  useEffect(() => {
    computeAndEmit();
  }, [computeAndEmit]);

  useFrame((state) => {
    if (hotspots.length === 0) return;
    const now = state.clock.getElapsedTime();
    if (now - lastUpdateRef.current < 0.066) return;
    lastUpdateRef.current = now;
    computeAndEmit();
  });

  return null;
}

/**
 * Synchronous Imperative Snapshot Provider
 * Renders one explicit frame (`gl.render(scene, camera)`) and extracts `toDataURL('image/png')`
 * within the same synchronous JS turn before buffer swap — zero retained color-buffer overhead!
 */
function ARSnapshotBridge({
  onRegisterSnapshotProvider,
}: {
  onRegisterSnapshotProvider?: (provider: (() => string | null) | null) => void;
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    if (!onRegisterSnapshotProvider) return;

    const captureFrameDataUrl = (): string | null => {
      try {
        gl.render(scene, camera);
        return gl.domElement.toDataURL('image/png');
      } catch {
        return null;
      }
    };

    onRegisterSnapshotProvider(captureFrameDataUrl);
    return () => {
      onRegisterSnapshotProvider(null);
    };
  }, [gl, scene, camera, onRegisterSnapshotProvider]);

  return null;
}

/**
 * Demand-Loop Invalidator & Real-Time AR Telemetry Exporter (`window.__GOLDEN_OAK_3D_TELEMETRY__.ARScene`)
 */
function ARDemandAndTelemetryBridge({
  frameloop,
  qualityTier,
  lightEstimate,
  invalidateDepsKey,
}: {
  frameloop: 'always' | 'demand' | 'never';
  qualityTier: string;
  lightEstimate: RealWorldLightEstimate;
  invalidateDepsKey: string;
}) {
  const { gl, invalidate } = useThree();

  const publishTelemetry = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!window.__GOLDEN_OAK_3D_TELEMETRY__) {
      window.__GOLDEN_OAK_3D_TELEMETRY__ = {};
    }
    const snapshot: ARTelemetrySnapshot = {
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      preserveDrawingBuffer: false,
      frameloop,
      qualityTier,
      dpr: gl.getPixelRatio(),
      ambientIntensity: lightEstimate.ambientIntensity,
      lightingLabel: lightEstimate.lightingLabel,
      updatedAt: Date.now(),
    };
    window.__GOLDEN_OAK_3D_TELEMETRY__['ARScene'] = snapshot;
  }, [
    gl,
    frameloop,
    qualityTier,
    lightEstimate.ambientIntensity,
    lightEstimate.lightingLabel,
  ]);

  useEffect(() => {
    if (frameloop !== 'never') {
      invalidate();
    }
    publishTelemetry();
  }, [invalidateDepsKey, frameloop, invalidate, publishTelemetry]);

  useFrame(() => {
    publishTelemetry();
  });

  return null;
}

export interface ARSceneProps {
  config: ModelConfig;
  category?: string;
  placed: boolean;
  modelScale: number;
  modelRotation: number;
  modelOffsetXZ?: [number, number];
  recenterTrigger?: number;
  lightEstimate?: RealWorldLightEstimate;
  enableBakedContactShadow?: boolean;
  hotspots: IngredientHotspot[];
  showHotspots: boolean;
  onProgress: (progress: number) => void;
  onModelLoaded: () => void;
  onHotspotsProjected: (
    projected: Array<{
      id: string;
      name: string;
      description: string;
      screenX: number;
      screenY: number;
    }>
  ) => void;
  onRegisterSnapshotProvider?: (provider: (() => string | null) | null) => void;
}

export function ARScene({
  config,
  placed,
  modelScale,
  modelRotation,
  modelOffsetXZ = [0, 0],
  recenterTrigger = 0,
  lightEstimate = DEFAULT_AR_LIGHT_ESTIMATE,
  enableBakedContactShadow = false,
  hotspots,
  showHotspots,
  onProgress,
  onModelLoaded,
  onHotspotsProjected,
  onRegisterSnapshotProvider,
}: ARSceneProps) {
  const qualityTier = useQualityTier({ initialTier: 'low' });
  const [isPageHidden, setIsPageHidden] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false
  );
  const [isAnimatingPlacement, setIsAnimatingPlacement] = useState(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolvedModelPath = useMemo(
    () =>
      resolveTieredModelPath(
        config as unknown as { modelPath: string } & Record<string, unknown>,
        qualityTier.tier
      ),
    [config, qualityTier.tier]
  );

  // Suspend WebGL rendering completely when phone is locked or browser tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageHidden(document.visibilityState === 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Run 'always' ONLY during the brief 400ms placement/dish-switch/recenter settle animation, then drop to 'demand' (0 FPS idle!)
  useEffect(() => {
    if (!placed) {
      setIsAnimatingPlacement(false);
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      return;
    }

    setIsAnimatingPlacement(true);
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
    }
    settleTimerRef.current = setTimeout(() => {
      setIsAnimatingPlacement(false);
      settleTimerRef.current = null;
    }, 430);

    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
    };
  }, [placed, config.dishSlug, recenterTrigger]);

  const activeFrameloop = isPageHidden
    ? 'never'
    : isAnimatingPlacement
      ? 'always'
      : 'demand';

  const dishFootprintScale = config.initialScale * modelScale;

  const invalidateDepsKey = [
    config.dishSlug,
    resolvedModelPath,
    placed ? '1' : '0',
    modelScale.toFixed(3),
    modelRotation.toFixed(3),
    modelOffsetXZ[0].toFixed(3),
    modelOffsetXZ[1].toFixed(3),
    showHotspots ? '1' : '0',
    recenterTrigger,
    lightEstimate.ambientIntensity,
    lightEstimate.directionalIntensity,
    lightEstimate.lightTintHex,
  ].join('|');

  return (
    <WebGLErrorBoundary name={`AR Table View (${config.dishSlug})`}>
      <Canvas
        frameloop={isPageHidden ? 'never' : isAnimatingPlacement ? 'always' : 'demand'}
        camera={{ position: [0, 2, 3], fov: 50, near: 0.1, far: 50 }}
        gl={{
          antialias: qualityTier.antialias,
          alpha: true,
          powerPreference: qualityTier.powerPreference,
          preserveDrawingBuffer: false,
        }}
        dpr={qualityTier.dpr}
        style={{ background: 'transparent', position: 'absolute', inset: 0, zIndex: 1 }}
        id="ar-canvas"
      >
        <AdaptiveDpr pixelated />

        {/* WebGL Context Loss & Recovery Guard */}
        <WebGLContextGuard
          canvasName="AR Food Viewer"
          onReinitialize={(scene) => {
            enhanceWarriorMaterials(scene);
          }}
        />

        <ARSnapshotBridge onRegisterSnapshotProvider={onRegisterSnapshotProvider} />

        <ARDemandAndTelemetryBridge
          frameloop={activeFrameloop}
          qualityTier={qualityTier.tier}
          lightEstimate={lightEstimate}
          invalidateDepsKey={invalidateDepsKey}
        />

        {/* Real-world adaptive AR lighting (zero shadow-map passes on mobile TBDR GPUs) */}
        <ambientLight
          intensity={lightEstimate.ambientIntensity}
          color={lightEstimate.lightTintHex}
        />
        <hemisphereLight
          args={[lightEstimate.lightTintHex, '#261d17', lightEstimate.hemisphereIntensity]}
        />
        <directionalLight
          position={[3, 5, 3]}
          intensity={lightEstimate.directionalIntensity}
          color={lightEstimate.lightTintHex}
        />
        <directionalLight
          position={[-2, 4, -1]}
          intensity={Math.max(0.18, Number((lightEstimate.directionalIntensity * 0.25).toFixed(2)))}
          color="#fff5e0"
        />

        <ARReticle visible={!placed} />

        <LoadingTracker onProgress={onProgress} />

        <Suspense fallback={null}>
          <ARFoodModel
            modelPath={resolvedModelPath}
            initialScale={config.initialScale}
            placed={placed}
            scale={modelScale}
            rotation={modelRotation}
            offsetXZ={modelOffsetXZ}
            settleKey={recenterTrigger}
            onLoaded={onModelLoaded}
            onProgress={onProgress}
          />

          {placed && (
            <group position={[modelOffsetXZ[0], 0, modelOffsetXZ[1]]}>
              <GroundContactDisc
                footprintScale={dishFootprintScale}
                opacity={lightEstimate.contactShadowOpacity}
              />
            </group>
          )}

          {placed && enableBakedContactShadow && qualityTier.tier === 'high' && (
            <SafeContactShadows
              position={[modelOffsetXZ[0], -0.012, modelOffsetXZ[1]]}
              opacity={0.28}
              scale={6}
              blur={2.2}
              far={3.5}
              resolution={256}
              frames={1}
              smooth
              refreshTrigger={`${config.dishSlug}-${Math.round(modelScale * 10)}-${recenterTrigger}`}
            />
          )}

          {placed && showHotspots && (
            <HotspotMarkers
              hotspots={hotspots}
              visible={showHotspots}
              dishScale={dishFootprintScale}
              offsetXZ={modelOffsetXZ}
            />
          )}

          {placed && (
            <HotspotProjector
              hotspots={showHotspots ? hotspots : []}
              dishScale={dishFootprintScale}
              rotation={modelRotation}
              offsetXZ={modelOffsetXZ}
              onProjected={onHotspotsProjected}
            />
          )}
        </Suspense>
      </Canvas>
    </WebGLErrorBoundary>
  );
}
