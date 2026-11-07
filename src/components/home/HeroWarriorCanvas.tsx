'use client';

import React, { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, AdaptiveDpr } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { enhanceWarriorMaterials } from '@/components/viewer/warrior-materials';
import { WebGLContextGuard, WebGLErrorBoundary } from '@/components/3d/WebGLContextGuard';
import { SafeContactShadows } from '@/components/3d/SafeContactShadows';
import { AdaptiveQualityController } from '@/components/3d/AdaptiveQualityController';
import { useQualityTier, type QualityTier } from '@/hooks/useQualityTier';
import { SHARED_WARRIOR_LOD_PATHS } from '@/data/model-config';

export interface HeroWarriorCanvasProps {
  autoRotate: boolean;
  onControlsRef?: (controls: OrbitControlsType | null) => void;
  isVisible?: boolean;
  qualityTierOverride?: QualityTier | null;
}

type TelemetryWindow = Window & {
  __GOLDEN_OAK_3D_TELEMETRY__?: Record<string, unknown>;
};

function detectSaveData(): boolean {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(conn?.saveData);
}

function WarriorMesh({
  scale = 0.95,
  modelPath = SHARED_WARRIOR_LOD_PATHS.balanced,
}: {
  scale?: number;
  modelPath?: string;
}) {
  const { scene } = useGLTF(modelPath, '/draco/');
  const groupRef = useRef<THREE.Group>(null);

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

  useEffect(() => {
    return () => {
      for (const mat of clonedData.clonedMaterials) {
        mat.dispose();
      }
    };
  }, [clonedData]);

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      <primitive object={clonedData.scene} scale={scale} dispose={null} />
    </group>
  );
}

/**
 * Ultra-lightweight procedural ground shadow disc for low/saveData devices.
 * Replaces 1024x1024/512x512 WebGLRenderTarget + dual blur shader passes with
 * a single 32-segment alpha disc (0 render targets, 0 blur passes, full disposal).
 */
function LowTierGroundShadow() {
  const resources = useMemo(() => {
    const shadowDiscBuffer = new THREE.CircleGeometry(1.35, 32);
    const shadowDiscMat = new THREE.MeshBasicMaterial({
      color: '#070504',
      transparent: true,
      opacity: 0.45,
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
      position={[0, -0.12, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      geometry={resources.shadowDiscBuffer}
      material={resources.shadowDiscMat}
    />
  );
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

function HeroTelemetryReporter({
  frameloop,
  qualityTier,
  isLowTier,
  dpr,
  isInViewport,
  isDocumentHidden,
  autoRotate,
}: {
  frameloop: 'always' | 'demand' | 'never';
  qualityTier: QualityTier;
  isLowTier: boolean;
  dpr: number | [number, number];
  isInViewport: boolean;
  isDocumentHidden: boolean;
  autoRotate: boolean;
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

      const win = window as unknown as TelemetryWindow;
      win.__GOLDEN_OAK_3D_TELEMETRY__ = win.__GOLDEN_OAK_3D_TELEMETRY__ || {};
      win.__GOLDEN_OAK_3D_TELEMETRY__.HeroWarriorCanvas = {
        component: 'HeroWarriorCanvas',
        mounted: true,
        frameloop,
        qualityTier,
        isLowTier,
        dpr,
        isInViewport,
        isDocumentHidden,
        autoRotate,
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
        lightCount: isLowTier ? 2 : 5,
        updatedAt: Date.now(),
      };
    };

    publish();
    const timer = setInterval(publish, 350);
    return () => {
      clearInterval(timer);
      if (typeof window !== 'undefined') {
        const win = window as unknown as TelemetryWindow;
        if (win.__GOLDEN_OAK_3D_TELEMETRY__?.HeroWarriorCanvas) {
          win.__GOLDEN_OAK_3D_TELEMETRY__.HeroWarriorCanvas = {
            ...(win.__GOLDEN_OAK_3D_TELEMETRY__.HeroWarriorCanvas as Record<string, unknown>),
            mounted: false,
            fps: 0,
            isIdle: true,
            updatedAt: Date.now(),
          };
        }
      }
    };
  }, [gl, frameloop, qualityTier, isLowTier, dpr, isInViewport, isDocumentHidden, autoRotate]);

  return null;
}

export function HeroWarriorCanvas({
  autoRotate,
  onControlsRef,
  isVisible = true,
  qualityTierOverride,
}: HeroWarriorCanvasProps) {
  const quality = useQualityTier({ overrideTier: qualityTierOverride });
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsType | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [shadowKey, setShadowKey] = useState(0);
  const [isInViewport, setIsInViewport] = useState(true);
  const [isDocumentHidden, setIsDocumentHidden] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isSaveData, setIsSaveData] = useState(false);

  useEffect(() => {
    setIsSaveData(detectSaveData());
    const handleGlobalRefresh = () => setShadowKey((k) => k + 1);
    window.addEventListener('golden-oak:refresh-shadow', handleGlobalRefresh);
    return () => window.removeEventListener('golden-oak:refresh-shadow', handleGlobalRefresh);
  }, []);

  // Viewport IntersectionObserver: suspends Hero WebGL canvas immediately once scrolled past Hero
  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      { threshold: 0.05, rootMargin: '50px 0px 50px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Document tab visibility listener: suspends Hero WebGL canvas when tab is backgrounded
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

  // Pause continuous autoRotate on reduced motion or ultra-low-power so idle FPS drops to 0 FPS
  const effectiveAutoRotate = Boolean(autoRotate) && !quality.prefersReducedMotion && !isUltraLowPower;
  const isCanvasActive = isVisible && isInViewport && !isDocumentHidden;
  const activeFrameloop: 'always' | 'demand' | 'never' = !isCanvasActive
    ? 'never'
    : effectiveAutoRotate || isInteracting
      ? 'always'
      : 'demand';

  const activeDpr: number | [number, number] = isLowTier ? 1 : quality.dpr;

  return (
    <div ref={containerRef} className="w-full h-full">
      <WebGLErrorBoundary
        name="Hero Warrior 3D"
        customMessage="Device graphics memory is constrained. Tap below to retry rendering the 3D model."
      >
        <Canvas
          frameloop={activeFrameloop}
          camera={{
            position: [0, 1.4, 3.8],
            fov: 36,
            near: 0.1,
            far: 50,
          }}
          gl={{
            antialias: isLowTier ? false : quality.antialias,
            alpha: true,
            powerPreference: isLowTier ? 'low-power' : quality.powerPreference,
          }}
          dpr={activeDpr}
          style={{ width: '100%', height: '100%', background: 'transparent', touchAction: 'pan-y' }}
        >
          {!isLowTier && <AdaptiveDpr pixelated />}
          <AdaptiveQualityController canvasName="HeroWarrior_Adaptive" enabled={isCanvasActive} />

          <DemandVisibilitySync isActive={isCanvasActive} frameloop={activeFrameloop} />
          <HeroTelemetryReporter
            frameloop={activeFrameloop}
            qualityTier={quality.qualityTier}
            isLowTier={isLowTier}
            dpr={activeDpr}
            isInViewport={isInViewport}
            isDocumentHidden={isDocumentHidden}
            autoRotate={effectiveAutoRotate}
          />

          {/* WebGL Context Loss & Recovery Guard */}
          <WebGLContextGuard
            canvasName="Hero Warrior Showcase"
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
              <ambientLight intensity={1.05} />
              <directionalLight position={[4, 6, 4]} intensity={1.45} />
            </>
          ) : (
            <>
              <ambientLight intensity={0.8} />
              <directionalLight position={[4, 6, 4]} intensity={1.2} />
              <directionalLight position={[-4, 4, -4]} intensity={0.4} color="#FFF2DA" />
              <directionalLight position={[0, -2, 2]} intensity={0.3} color="#F0C36B" />
              <pointLight position={[0, 3, 0]} intensity={0.6} color="#FFE4A0" />
            </>
          )}

          <Suspense fallback={null}>
            {(quality.isHydrated || Boolean(qualityTierOverride)) && (
              <WarriorMesh
                modelPath={
                  isLowTier
                    ? SHARED_WARRIOR_LOD_PATHS.ultraLight
                    : quality.qualityTier === 'medium'
                      ? SHARED_WARRIOR_LOD_PATHS.balanced
                      : SHARED_WARRIOR_LOD_PATHS.high
                }
              />
            )}
            {isLowTier ? (
              <LowTierGroundShadow />
            ) : (
              <SafeContactShadows
                position={[0, -0.12, 0]}
                opacity={0.6}
                scale={5}
                blur={2.2}
                far={3}
                resolution={quality.qualityTier === 'medium' ? 512 : 1024}
                frames={1}
                smooth
                refreshTrigger={shadowKey}
              />
            )}
          </Suspense>

          <OrbitControls
            ref={(ref) => {
              controlsRef.current = ref;
              onControlsRef?.(ref);
            }}
            autoRotate={effectiveAutoRotate && isCanvasActive}
            autoRotateSpeed={1.8}
            enablePan={false}
            enableZoom={false}
            enableRotate={true}
            touches={{
              ONE: (-1 as unknown as THREE.TOUCH),
              TWO: THREE.TOUCH.DOLLY_ROTATE,
            }}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.05}
            enableDamping={!quality.prefersReducedMotion}
            dampingFactor={0.08}
            target={[0, 0.5, 0]}
            onStart={() => {
              if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
              setIsInteracting(true);
            }}
            onEnd={() => {
              if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
              settleTimerRef.current = setTimeout(() => {
                setIsInteracting(false);
              }, 450);
            }}
            makeDefault
          />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
