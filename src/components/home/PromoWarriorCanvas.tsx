'use client';

import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, AdaptiveDpr } from '@react-three/drei';
import * as THREE from 'three';
import { enhanceWarriorMaterials } from '@/components/viewer/warrior-materials';
import { WebGLContextGuard, WebGLErrorBoundary } from '@/components/3d/WebGLContextGuard';
import { SafeContactShadows } from '@/components/3d/SafeContactShadows';
import { AdaptiveQualityController } from '@/components/3d/AdaptiveQualityController';
import { useQualityTier, type QualityTier } from '@/hooks/useQualityTier';
import { SHARED_WARRIOR_LOD_PATHS } from '@/data/model-config';

function detectSaveData(): boolean {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(conn?.saveData);
}

// Subcomponent: Sync canvas touchAction to allow smooth page scroll on mobile
function CanvasScrollPassThrough() {
  const { gl } = useThree();
  useEffect(() => {
    gl?.domElement?.style.setProperty('touch-action', 'pan-y');
  }, [gl]);
  return null;
}

// Camera zoom controller reactive to zoomLevel prop (invalidates demand frameloop on zoom change)
function CameraZoomController({ zoomLevel = 1.0 }: { zoomLevel?: number }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    const baseDist = 3.4;
    const targetDist = baseDist / zoomLevel;
    camera.position.set(
      camera.position.x,
      1.25 / zoomLevel,
      THREE.MathUtils.lerp(camera.position.z, targetDist, 0.8)
    );
    camera.updateProjectionMatrix();
    invalidate();
  }, [zoomLevel, camera, invalidate]);
  return null;
}

function DemandVisibilitySync({
  isActive,
  frameloop,
}: {
  isActive: boolean;
  frameloop: 'always' | 'demand' | 'never';
}) {
  const { invalidate } = useThree();
  const prevActive = useRef(false);

  useEffect(() => {
    if (isActive && !prevActive.current && frameloop === 'demand') {
      invalidate();
    }
    prevActive.current = isActive;
  }, [isActive, frameloop, invalidate]);

  return null;
}

function WarriorModel({
  isDragging,
  autoRotate = true,
  isLowTier = false,
  modelPath = SHARED_WARRIOR_LOD_PATHS.balanced,
}: {
  isDragging: boolean;
  autoRotate?: boolean;
  isLowTier?: boolean;
  modelPath?: string;
}) {
  const { scene } = useGLTF(modelPath, '/draco/');
  const groupRef = useRef<THREE.Group>(null);
  const segments = isLowTier ? 32 : 64;

  // Clone scene nodes AND materials per-instance while preserving shared glTF BufferGeometries
  const clonedData = useMemo(() => {
    const clone = scene.clone(true);
    const clonedMaterials: THREE.Material[] = [];

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((mat) => {
            const matClone = mat.clone();
            clonedMaterials.push(matClone);
            return matClone;
          });
        } else if (mesh.material) {
          const matClone = mesh.material.clone();
          clonedMaterials.push(matClone);
          mesh.material = matClone;
        }
      }
    });

    enhanceWarriorMaterials(clone);
    return { scene: clone, clonedMaterials };
  }, [scene]);

  // Procedural turntable geometries & materials with explicit disposal on unmount/tier change
  const turntableResources = useMemo(() => {
    const platterDiscBuffer = new THREE.CircleGeometry(1.45, segments);
    const platterRimBuffer = new THREE.RingGeometry(1.41, 1.45, segments);
    const platterDiscMat = new THREE.MeshStandardMaterial({
      color: '#14100D',
      roughness: 0.4,
      metalness: 0.5,
    });
    const platterRimMat = new THREE.MeshStandardMaterial({
      color: '#E2A84B',
      roughness: 0.2,
      metalness: 0.85,
    });
    return {
      platterDiscBuffer,
      platterRimBuffer,
      platterDiscMat,
      platterRimMat,
    };
  }, [segments]);

  useEffect(() => {
    return () => {
      for (const mat of clonedData.clonedMaterials) {
        mat.dispose();
      }
    };
  }, [clonedData]);

  useEffect(() => {
    return () => {
      turntableResources.platterDiscBuffer.dispose();
      turntableResources.platterRimBuffer.dispose();
      turntableResources.platterDiscMat.dispose();
      turntableResources.platterRimMat.dispose();
    };
  }, [turntableResources]);

  // Smooth continuous auto-rotation when user is not dragging and autoRotate is active
  useFrame((_, delta) => {
    if (groupRef.current && !isDragging && autoRotate) {
      groupRef.current.rotation.y += Math.min(delta, 0.1) * 0.45;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.6, 0]}>
      <primitive object={clonedData.scene} scale={0.7} dispose={null} />

      {/* Luxury Obsidian Turntable Disc Under Warrior */}
      <mesh
        position={[0, 0.005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={turntableResources.platterDiscBuffer}
        material={turntableResources.platterDiscMat}
      />

      {/* Molten Gold Rim Ring */}
      <mesh
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={turntableResources.platterRimBuffer}
        material={turntableResources.platterRimMat}
      />
    </group>
  );
}

/**
 * Ultra-lightweight procedural ground shadow under platter for low/saveData tier.
 * Skips 1024x1024/512x512 render target allocation and blur shader passes.
 */
function LowTierPlatterShadow() {
  const resources = useMemo(() => {
    const shadowDiscBuffer = new THREE.CircleGeometry(1.55, 32);
    const shadowDiscMat = new THREE.MeshBasicMaterial({
      color: '#050403',
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    });
    return { shadowDiscBuffer, shadowDiscMat };
  }, []);

  useEffect(() => {
    return () => {
      resources.shadowDiscBuffer.dispose();
      resources.shadowDiscMat.dispose();
    };
  }, [resources]);

  return (
    <mesh
      position={[0, -0.61, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      geometry={resources.shadowDiscBuffer}
      material={resources.shadowDiscMat}
    />
  );
}

function PromoTelemetryReporter({
  frameloop,
  qualityTier,
  isLowTier,
  dpr,
  isInViewport,
  isDocumentHidden,
  autoRotate,
  segments,
}: {
  frameloop: 'always' | 'demand' | 'never';
  qualityTier: QualityTier;
  isLowTier: boolean;
  dpr: number | [number, number];
  isInViewport: boolean;
  isDocumentHidden: boolean;
  autoRotate: boolean;
  segments: number;
}) {
  const { gl } = useThree();
  const frameTimestamps = useRef<number[]>([]);
  const totalFrames = useRef(0);

  useFrame(() => {
    frameTimestamps.current.push(performance.now());
    totalFrames.current += 1;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const publish = () => {
      const now = performance.now();
      frameTimestamps.current = frameTimestamps.current.filter((t) => now - t <= 1000);
      const lastFrame = frameTimestamps.current[frameTimestamps.current.length - 1] || 0;
      const isIdle = frameloop === 'never' || now - lastFrame > 250 || frameTimestamps.current.length === 0;
      const fps = isIdle ? 0 : frameTimestamps.current.length;

      const win = window as Window & { __GOLDEN_OAK_3D_TELEMETRY__?: Record<string, unknown> };
      win.__GOLDEN_OAK_3D_TELEMETRY__ = win.__GOLDEN_OAK_3D_TELEMETRY__ || {};
      win.__GOLDEN_OAK_3D_TELEMETRY__.PromoWarriorCanvas = {
        component: 'PromoWarriorCanvas',
        mounted: true,
        frameloop,
        qualityTier,
        isLowTier,
        dpr,
        isInViewport,
        isDocumentHidden,
        autoRotate,
        turntableSegments: segments,
        lightCount: isLowTier ? 2 : 5,
        fps,
        isIdle,
        totalFramesRendered: totalFrames.current,
        calls: gl.info?.render?.calls ?? 0,
        triangles: gl.info?.render?.triangles ?? 0,
        lines: gl.info?.render?.lines ?? 0,
        points: gl.info?.render?.points ?? 0,
        geometries: gl.info?.memory?.geometries ?? 0,
        textures: gl.info?.memory?.textures ?? 0,
        programs: gl.info?.programs?.length ?? 0,
        updatedAt: Date.now(),
      };
    };

    publish();
    const timer = setInterval(publish, 350);
    return () => {
      clearInterval(timer);
      const win = window as Window & { __GOLDEN_OAK_3D_TELEMETRY__?: Record<string, unknown> };
      if (typeof window !== 'undefined' && win.__GOLDEN_OAK_3D_TELEMETRY__?.PromoWarriorCanvas) {
        win.__GOLDEN_OAK_3D_TELEMETRY__.PromoWarriorCanvas = {
          ...(win.__GOLDEN_OAK_3D_TELEMETRY__.PromoWarriorCanvas as Record<string, unknown>),
          mounted: false,
          fps: 0,
          isIdle: true,
          updatedAt: Date.now(),
        };
      }
    };
  }, [gl, frameloop, qualityTier, isLowTier, dpr, isInViewport, isDocumentHidden, autoRotate, segments]);

  return null;
}

export interface PromoWarriorCanvasProps {
  autoRotate?: boolean;
  zoomLevel?: number;
  isVisible?: boolean;
  userToggledRotate?: boolean;
  qualityTierOverride?: QualityTier | null;
}

export function PromoWarriorCanvas({
  autoRotate = true,
  zoomLevel = 1.0,
  isVisible = true,
  userToggledRotate = false,
  qualityTierOverride,
}: PromoWarriorCanvasProps) {
  const quality = useQualityTier({ overrideTier: qualityTierOverride });
  const containerRef = useRef<HTMLDivElement>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isInteracting, setIsInteracting] = useState(false);
  const [shadowKey, setShadowKey] = useState(0);
  const [isInViewport, setIsInViewport] = useState(true);
  const [isDocumentHidden, setIsDocumentHidden] = useState(false);
  const [isSaveData, setIsSaveData] = useState(false);

  useEffect(() => {
    setIsSaveData(detectSaveData());
    const handleGlobalRefresh = () => setShadowKey((k) => k + 1);
    window.addEventListener('golden-oak:refresh-shadow', handleGlobalRefresh);
    return () => window.removeEventListener('golden-oak:refresh-shadow', handleGlobalRefresh);
  }, []);

  // Viewport IntersectionObserver: freezes rendering (frameloop="never") whenever off-screen
  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      { threshold: 0.01, rootMargin: '100px 0px 100px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Document visibility listener: freezes rendering when browser tab is hidden
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const syncVisibility = () => {
      setIsDocumentHidden(document.visibilityState === 'hidden' || document.hidden);
    };
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    return () => document.removeEventListener('visibilitychange', syncVisibility);
  }, []);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, []);

  const isLowTier = quality.qualityTier === 'low' || isSaveData;
  const isUltraLowPower =
    quality.isLowPower ||
    quality.isSoftwareGpu ||
    isSaveData ||
    (typeof quality.deviceMemory === 'number' && quality.deviceMemory <= 2);

  // Pause continuous autoRotate automatically on prefersReducedMotion / ultra-low-power so idle FPS drops to 0 FPS
  const effectiveAutoRotate =
    Boolean(autoRotate) &&
    (userToggledRotate || (!quality.prefersReducedMotion && !isUltraLowPower));

  const isCanvasActive = isVisible && isInViewport && !isDocumentHidden;
  const activeFrameloop: 'always' | 'demand' | 'never' = !isCanvasActive
    ? 'never'
    : effectiveAutoRotate || isInteracting
      ? 'always'
      : 'demand';

  const activeDpr: number | [number, number] = isLowTier ? 1 : quality.dpr;
  const segments = isLowTier ? 32 : 64;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
    >
      <WebGLErrorBoundary
        name="Promo Warrior Platter"
        fallback={(_err, reset) => (
          <div className="w-full h-full rounded-full flex flex-col items-center justify-center p-4 text-center bg-radial-gradient from-[#1E1712] to-[#0A0806] border border-[#F0C36B]/40 select-none">
            <span className="text-xl mb-1">👑</span>
            <span className="text-[11px] font-mono font-medium text-[#F8F2E8] uppercase tracking-wider mb-1">
              3D Stage Suspended
            </span>
            <span className="text-[9.5px] text-[#C8B89E] max-w-[180px] mb-2 leading-tight">
              Hardware memory constrained. Tap to retry interactive turntable.
            </span>
            <button
              type="button"
              onClick={reset}
              className="px-3 py-1 rounded-full bg-[#F0C36B] text-black text-[10px] font-mono font-bold tracking-wider uppercase hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}
      >
        <Canvas
          frameloop={activeFrameloop}
          camera={{
            position: [0, 1.25, 3.4],
            fov: 38,
            near: 0.1,
            far: 50,
          }}
          gl={{
            antialias: isLowTier ? false : quality.antialias,
            alpha: true,
            powerPreference: isLowTier ? 'low-power' : quality.powerPreference,
          }}
          dpr={activeDpr}
          style={{ background: 'transparent', touchAction: 'pan-y' }}
        >
          {!isLowTier && <AdaptiveDpr pixelated />}
          <AdaptiveQualityController canvasName="PromoWarrior_Adaptive" enabled={isCanvasActive} />

          <DemandVisibilitySync isActive={isCanvasActive} frameloop={activeFrameloop} />
          <PromoTelemetryReporter
            frameloop={activeFrameloop}
            qualityTier={quality.qualityTier}
            isLowTier={isLowTier}
            dpr={activeDpr}
            isInViewport={isInViewport}
            isDocumentHidden={isDocumentHidden}
            autoRotate={effectiveAutoRotate}
            segments={segments}
          />

          {/* WebGL Context Loss & Recovery Guard */}
          <WebGLContextGuard
            canvasName="Promo Warrior Platter"
            onContextRestored={() => {
              setShadowKey((k) => k + 1);
            }}
            onReinitialize={(scene) => {
              enhanceWarriorMaterials(scene);
            }}
            restoreTimeoutMs={5000}
          />

          {/* Device-Tier Aware Studio Lighting: 2 lights on low/saveData vs 5 lights on medium/high */}
          {isLowTier ? (
            <>
              <ambientLight intensity={1.15} />
              <directionalLight position={[4, 6, 4]} intensity={1.55} />
            </>
          ) : (
            <>
              <ambientLight intensity={0.9} />
              <directionalLight position={[4, 6, 4]} intensity={1.4} />
              <directionalLight position={[-4, 4, -4]} intensity={0.65} color="#FFE8C2" />
              <directionalLight position={[0, -2, 2]} intensity={0.35} color="#E2A84B" />
              <pointLight position={[0, 2, 0]} intensity={0.5} color="#FAF5EC" />
            </>
          )}

          <Suspense fallback={null}>
            <CameraZoomController zoomLevel={zoomLevel} />
            {(quality.isHydrated || Boolean(qualityTierOverride)) && (
              <WarriorModel
                isDragging={isInteracting}
                autoRotate={effectiveAutoRotate && isCanvasActive}
                isLowTier={isLowTier}
                modelPath={
                  isLowTier
                    ? SHARED_WARRIOR_LOD_PATHS.ultraLight
                    : quality.qualityTier === 'medium'
                      ? SHARED_WARRIOR_LOD_PATHS.balanced
                      : SHARED_WARRIOR_LOD_PATHS.high
                }
              />
            )}

            {/* Contact Shadows Under Disc: ultra-light alpha disc on low tier, SafeContactShadows on medium/high */}
            {isLowTier ? (
              <LowTierPlatterShadow />
            ) : (
              <SafeContactShadows
                position={[0, -0.61, 0]}
                opacity={0.75}
                scale={3.8}
                blur={2}
                far={1.8}
                resolution={quality.qualityTier === 'medium' ? 512 : 1024}
                frames={1}
                smooth
                refreshTrigger={shadowKey}
              />
            )}

            <CanvasScrollPassThrough />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              target={[0, 0.55, 0]}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2 + 0.05}
              touches={{
                ONE: (-1 as unknown as THREE.TOUCH),
                TWO: THREE.TOUCH.DOLLY_ROTATE,
              }}
              onStart={() => {
                if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
                setIsInteracting(true);
              }}
              onEnd={() => {
                if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
                settleTimerRef.current = setTimeout(() => {
                  setIsInteracting(false);
                }, 250);
              }}
            />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
