'use client';

import { Suspense, useRef, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, useProgress, AdaptiveDpr } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import type { Group, Object3D, Material, Mesh, BufferGeometry } from 'three';
import type { ModelConfig } from '@/data/model-config';

interface FoodModelProps {
  config: ModelConfig;
  onLoaded?: () => void;
}

function disposeObject(obj: Object3D) {
  obj.traverse((child) => {
    if ((child as Mesh).isMesh) {
      const mesh = child as Mesh;
      if (mesh.geometry) (mesh.geometry as BufferGeometry).dispose();
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat: Material) => mat.dispose());
      }
    }
  });
}

function FoodModel({ config, onLoaded }: FoodModelProps) {
  const { scene } = useGLTF(config.modelPath);
  const groupRef = useRef<Group>(null);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.set(...config.initialRotation);
    }
    onLoaded?.();
    return () => {
      disposeObject(clonedScene);
    };
  }, [config.initialRotation, clonedScene, onLoaded]);

  return (
    <group ref={groupRef}>
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

interface ViewerSceneProps {
  config: ModelConfig;
  autoRotate: boolean;
  onControlsRef: (controls: OrbitControlsType | null) => void;
  onProgress: (progress: number) => void;
  onLoaded: () => void;
  onError: (error: string) => void;
  onDoubleTap: () => void;
}

export function ViewerScene({ config, autoRotate, onControlsRef, onProgress, onLoaded, onError, onDoubleTap }: ViewerSceneProps) {
  const lastTapRef = useRef(0);
  const presentationRef = useRef(true);

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
      style={{ background: '#0a0a0a' }}
      onPointerDown={handlePointerDown}
    >
      <AdaptiveDpr pixelated />

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-3, 3, -3]} intensity={0.3} />
      <pointLight position={[0, 4, 0]} intensity={0.4} color="#fff5e0" />

      <Environment preset="studio" />

      <AutoPresentation active={presentationRef.current} />

      <Suspense fallback={null}>
        <LoadingTracker onProgress={onProgress} />
        <FoodModel config={config} onLoaded={onLoaded} />
        <ContactShadows
          position={[0, -0.2, 0]}
          opacity={0.4}
          scale={10}
          blur={2.5}
          far={4}
        />
      </Suspense>

      <OrbitControls
        ref={(ref) => onControlsRef(ref)}
        autoRotate={autoRotate}
        autoRotateSpeed={1.5}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={12}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 6}
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
