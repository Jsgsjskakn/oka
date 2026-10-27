'use client';

import { Suspense, useRef, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, ContactShadows, useProgress, AdaptiveDpr, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { type ModelConfig } from '@/data/model-config';
import { enhanceWarriorMaterials } from './warrior-materials';

interface FoodModelProps {
  config: ModelConfig;
  category?: string;
  onLoaded?: () => void;
  onProgress?: (progress: number) => void;
  showHotspots?: boolean;
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat: THREE.Material) => mat.dispose());
      }
    }
  });
}

function FoodModel({ config, onLoaded, onProgress }: FoodModelProps) {
  const { scene } = useGLTF(config.modelPath);
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
    return () => {
      disposeObject(clonedScene);
    };
  }, [config.initialRotation, clonedScene, onLoaded, onProgress]);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive
        object={clonedScene}
        scale={config.initialScale}
        position={[0, 0, 0]}
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
function AutoPresentation({ active }: { active: boolean }) {
  const { scene } = useThree();
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (active && elapsed.current < 3) {
      elapsed.current += delta;
      scene.rotation.y += delta * 0.5;
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
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, cameraDistance * 0.35, cameraDistance));
  const isTransitioning = useRef(false);

  useEffect(() => {
    if (cameraPreset === 'top') {
      targetPos.current.set(0, cameraDistance * 1.15, 0.001);
      isTransitioning.current = true;
    } else {
      targetPos.current.set(0, cameraDistance * 0.35, cameraDistance);
      isTransitioning.current = true;
    }
  }, [cameraPreset, cameraDistance]);

  useFrame((_, delta) => {
    if (isTransitioning.current) {
      camera.position.lerp(targetPos.current, Math.min(1, delta * 3.5));
      if (controlsRef.current) {
        controlsRef.current.target.lerp(new THREE.Vector3(0, 0.8, 0), delta * 4);
        controlsRef.current.update();
      }
      if (camera.position.distanceTo(targetPos.current) < 0.05) {
        isTransitioning.current = false;
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
  onControlsRef,
  onProgress,
  onLoaded,
  onError,
  onDoubleTap,
}: ViewerSceneProps) {
  const lastTapRef = useRef(0);
  const presentationRef = useRef(true);
  const internalControlsRef = useRef<OrbitControlsType | null>(null);

  const handlePointerDown = useCallback(() => {
    presentationRef.current = false;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onDoubleTap();
    }
    lastTapRef.current = now;
  }, [onDoubleTap]);

  return (
    <Canvas
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

      {/* Studio Luxury Lighting Suite (100% offline & local, zero CDN dependency) */}
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.45} color="#fff5e0" />
      <directionalLight position={[0, -2, 2]} intensity={0.25} color="#E2A84B" />
      <pointLight position={[0, 4, 0]} intensity={0.6} color="#fff5e0" />
      <hemisphereLight args={['#ffffff', '#222222', 0.6]} />

      <AutoPresentation active={presentationRef.current} />

      <CameraGlideController
        cameraDistance={config.cameraDistance}
        cameraPreset={cameraPreset}
        controlsRef={internalControlsRef}
      />

      <Suspense fallback={null}>
        <LoadingTracker onProgress={onProgress} />
        <FoodModel
          config={config}
          category={category}
          onLoaded={onLoaded}
          onProgress={onProgress}
          showHotspots={showHotspots}
        />
        <ContactShadows
          position={[0, -0.05, 0]}
          opacity={0.5}
          scale={10}
          blur={2.5}
          far={4}
        />
      </Suspense>

      <OrbitControls
        ref={(ref) => {
          internalControlsRef.current = ref;
          onControlsRef(ref);
        }}
        autoRotate={autoRotate}
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
  );
}
