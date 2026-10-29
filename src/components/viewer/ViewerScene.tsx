'use client';

import { Suspense, useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useProgress, AdaptiveDpr, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { type ModelConfig, SHARED_DEFAULT_MODEL_PATH } from '@/data/model-config';
import { enhanceWarriorMaterials } from './warrior-materials';
import { WebGLContextGuard, WebGLErrorBoundary } from '@/components/3d/WebGLContextGuard';
import { SafeContactShadows } from '@/components/3d/SafeContactShadows';

interface FoodModelProps {
  config: ModelConfig;
  category?: string;
  onLoaded?: () => void;
  onProgress?: (progress: number) => void;
  showHotspots?: boolean;
}

function FoodModel({ config, onLoaded, onProgress }: FoodModelProps) {
  const { scene } = useGLTF(config.modelPath, '/draco/');
  const groupRef = useRef<THREE.Group>(null);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    enhanceWarriorMaterials(clone);
    return clone;
  }, [scene]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.set(...config.initialRotation);
    }
    onProgress?.(100);
    onLoaded?.();
  }, [config.initialRotation, onLoaded, onProgress]);

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

// Auto-presentation: gentle rotation for 3 seconds, then stops
function AutoPresentation({ active, onComplete }: { active: boolean; onComplete?: () => void }) {
  const { scene, invalidate } = useThree();
  const elapsed = useRef(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (active) {
      invalidate();
    }
  }, [active, invalidate]);

  useFrame((_, delta) => {
    if (active && elapsed.current < 3) {
      elapsed.current += delta;
      scene.rotation.y += delta * 0.5;
      invalidate();
      if (elapsed.current >= 3 && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
        invalidate();
      }
    }
  });

  return null;
}

/**
 * Smooth Camera Preset Glide Controller
 * Transitions smoothly between 45° Side View and 90° Top-Down View
 */
function CameraGlideController({
  cameraDistance,
  cameraPreset,
  controlsRef,
}: {
  cameraDistance: number;
  cameraPreset: 'side' | 'top';
  controlsRef: React.MutableRefObject<OrbitControlsType | null>;
}) {
  const { camera, invalidate } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, cameraDistance * 0.35, cameraDistance));
  const isTransitioning = useRef(false);

  useEffect(() => {
    if (cameraPreset === 'top') {
      targetPos.current.set(0, cameraDistance * 1.15, 0.001);
      isTransitioning.current = true;
      invalidate();
    } else {
      targetPos.current.set(0, cameraDistance * 0.35, cameraDistance);
      isTransitioning.current = true;
      invalidate();
    }
  }, [cameraPreset, cameraDistance, invalidate]);

  useFrame((_, delta) => {
    if (isTransitioning.current) {
      camera.position.lerp(targetPos.current, Math.min(1, delta * 3.5));
      if (controlsRef.current) {
        controlsRef.current.target.lerp(new THREE.Vector3(0, 0.8, 0), delta * 4);
        controlsRef.current.update();
      }
      invalidate();
      if (camera.position.distanceTo(targetPos.current) < 0.05) {
        isTransitioning.current = false;
        invalidate();
      }
    }
  });

  return null;
}

interface ViewerSceneProps {
  config: ModelConfig;
  category?: string;
  autoRotate: boolean;
  showHotspots?: boolean;
  cameraPreset?: 'side' | 'top';
  shadowTrigger?: number;
  onControlsRef: (controls: OrbitControlsType | null) => void;
  onProgress: (progress: number) => void;
  onLoaded: () => void;
  onError: (error: string) => void;
  onDoubleTap: () => void;
}

export function ViewerScene({
  config,
  category,
  autoRotate,
  showHotspots = false,
  cameraPreset = 'side',
  shadowTrigger,
  onControlsRef,
  onProgress,
  onLoaded,
  onError,
  onDoubleTap,
}: ViewerSceneProps) {
  const lastTapRef = useRef(0);
  const presentationRef = useRef(true);
  const internalControlsRef = useRef<OrbitControlsType | null>(null);
  const [shadowKey, setShadowKey] = useState(0);
  const [isTabVisible, setIsTabVisible] = useState(true);

  // Tab visibility listener: Suspends GPU rendering when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const triggerShadowRefresh = useCallback(() => {
    setShadowKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (shadowTrigger !== undefined) {
      triggerShadowRefresh();
    }
  }, [shadowTrigger, triggerShadowRefresh]);

  useEffect(() => {
    const handleGlobalRefresh = () => triggerShadowRefresh();
    window.addEventListener('golden-oak:refresh-shadow', handleGlobalRefresh);
    return () => window.removeEventListener('golden-oak:refresh-shadow', handleGlobalRefresh);
  }, [triggerShadowRefresh]);

  const handlePointerDown = useCallback(() => {
    if (presentationRef.current) {
      presentationRef.current = false;
      triggerShadowRefresh();
    }
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onDoubleTap();
    }
    lastTapRef.current = now;
  }, [onDoubleTap, triggerShadowRefresh]);

  const handleModelLoaded = useCallback(() => {
    triggerShadowRefresh();
    onLoaded();
  }, [onLoaded, triggerShadowRefresh]);

  return (
    <WebGLErrorBoundary
      name={`3D Dish Showcase (${config.dishSlug})`}
      onError={(err) => onError(err.message)}
    >
      <Canvas
        frameloop={isTabVisible ? (autoRotate ? 'always' : 'demand') : 'never'}
        camera={{
          position: [0, config.cameraDistance * 0.35, config.cameraDistance],
          fov: 38,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
        onPointerDown={handlePointerDown}
      >
        <AdaptiveDpr pixelated />

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

        {/* Studio Luxury Lighting Suite (100% offline & local, zero CDN dependency) */}
        <ambientLight intensity={0.75} />
        <directionalLight position={[5, 8, 5]} intensity={1.1} />
        <directionalLight position={[-5, 5, -5]} intensity={0.45} color="#fff5e0" />
        <directionalLight position={[0, -2, 2]} intensity={0.25} color="#E2A84B" />
        <pointLight position={[0, 4, 0]} intensity={0.6} color="#fff5e0" />
        <hemisphereLight args={['#ffffff', '#222222', 0.6]} />

        <AutoPresentation active={presentationRef.current} onComplete={triggerShadowRefresh} />

        <CameraGlideController
          cameraDistance={config.cameraDistance}
          cameraPreset={cameraPreset}
          controlsRef={internalControlsRef}
        />

        {/* LoadingTracker outside Suspense so it reports real-time download progress */}
        <LoadingTracker onProgress={onProgress} />

        <Suspense fallback={null}>
          <FoodModel
            config={config}
            category={category}
            onLoaded={handleModelLoaded}
            onProgress={onProgress}
            showHotspots={showHotspots}
          />
          {/* Contact Shadows: Leak-free SafeContactShadows */}
          <SafeContactShadows
            position={[0, -0.05, 0]}
            opacity={0.5}
            scale={10}
            blur={2.4}
            far={4}
            resolution={typeof window !== 'undefined' && window.innerWidth < 768 ? 512 : 1024}
            frames={1}
            smooth
            refreshTrigger={shadowKey}
          />
        </Suspense>

        <OrbitControls
          ref={(ref) => {
            internalControlsRef.current = ref;
            onControlsRef(ref);
          }}
          autoRotate={autoRotate && isTabVisible}
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
          enableDamping={true}
          dampingFactor={0.08}
          target={[0, 0.8, 0]}
          makeDefault
        />
      </Canvas>
    </WebGLErrorBoundary>
  );
}

useGLTF.preload(SHARED_DEFAULT_MODEL_PATH, '/draco/');
