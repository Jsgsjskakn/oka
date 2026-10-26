'use client';

import { Suspense, useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, ContactShadows, useProgress, AdaptiveDpr } from '@react-three/drei';
import type { Group, Object3D, Material, Mesh, BufferGeometry } from 'three';
import { Vector3 } from 'three';
import { type ModelConfig, SHARED_DEFAULT_MODEL_PATH } from '@/data/model-config';
import type { IngredientHotspot } from '@/data/ar-config';
import { enhanceWarriorMaterials } from '@/components/viewer/warrior-materials';

// Dispose helper
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

// AR Reticle - premium gold ring
function ARReticle({ visible }: { visible: boolean }) {
  const groupRef = useRef<Group>(null);
  const phaseRef = useRef(0);

  useFrame((_, delta) => {
    phaseRef.current = (phaseRef.current + delta * 2) % (Math.PI * 2);
    if (groupRef.current) {
      const s = 1 + Math.sin(phaseRef.current) * 0.05;
      groupRef.current.scale.set(s, s, s);
      groupRef.current.rotation.z += delta * 0.3;
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Outer ring */}
      <mesh>
        <ringGeometry args={[0.2, 0.24, 64]} />
        <meshBasicMaterial color="#c9a84c" transparent opacity={0.5} />
      </mesh>
      {/* Inner ring */}
      <mesh>
        <ringGeometry args={[0.15, 0.17, 64]} />
        <meshBasicMaterial color="#c9a84c" transparent opacity={0.2} />
      </mesh>
      {/* Center dot */}
      <mesh>
        <circleGeometry args={[0.03, 32]} />
        <meshBasicMaterial color="#c9a84c" transparent opacity={0.6} />
      </mesh>
      {/* Cross markers */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle) * 0.22, Math.sin(angle) * 0.22, 0]}>
          <circleGeometry args={[0.012, 16]} />
          <meshBasicMaterial color="#c9a84c" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// AR Food Model with placement animation
interface ARFoodModelProps {
  config: ModelConfig;
  category?: string;
  placed: boolean;
  scale: number;
  rotation: number;
  onLoaded?: () => void;
  onProgress?: (progress: number) => void;
}

function ARFoodModel({ config, placed, scale, rotation, onLoaded, onProgress }: ARFoodModelProps) {
  const { scene } = useGLTF(config.modelPath);
  const groupRef = useRef<Group>(null);
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    enhanceWarriorMaterials(clone);
    return clone;
  }, [scene]);
  const animRef = useRef(0);

  useEffect(() => {
    onProgress?.(100);
    onLoaded?.();
    return () => { disposeObject(clonedScene); };
  }, [clonedScene, onLoaded, onProgress]);

  useFrame((_, delta) => {
    if (placed && animRef.current < 1) {
      animRef.current = Math.min(animRef.current + delta * 2.5, 1);
    }
    if (groupRef.current) {
      const eased = 1 - Math.pow(1 - animRef.current, 3);
      const currentScale = config.initialScale * scale * eased;
      groupRef.current.scale.set(currentScale, currentScale, currentScale);
      groupRef.current.rotation.y = rotation;
      // Subtle floating effect when placed
      if (placed && animRef.current >= 1) {
        groupRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.003;
      }
    }
  });

  if (!placed) return null;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

// 3D Hotspot markers (visible in the scene)
interface HotspotMarkersProps {
  hotspots: IngredientHotspot[];
  visible: boolean;
  dishScale: number;
}

function HotspotMarkers({ hotspots, visible, dishScale }: HotspotMarkersProps) {
  const groupRef = useRef<Group>(null);
  const phaseRef = useRef(0);

  useFrame((_, delta) => {
    phaseRef.current += delta;
  });

  if (!visible || hotspots.length === 0) return null;

  return (
    <group ref={groupRef}>
      {hotspots.map((hp, i) => {
        const yBob = Math.sin(phaseRef.current * 2 + i * 1.2) * 0.015;
        return (
          <group key={hp.id} position={[hp.position[0] * dishScale, hp.position[1] * dishScale + yBob + 0.05, hp.position[2] * dishScale]}>
            {/* Glowing orb */}
            <mesh>
              <sphereGeometry args={[0.025, 16, 16]} />
              <meshBasicMaterial color="#c9a84c" transparent opacity={0.9} />
            </mesh>
            {/* Outer glow */}
            <mesh>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshBasicMaterial color="#c9a84c" transparent opacity={0.15} />
            </mesh>
            {/* Connecting line down to dish */}
            <mesh position={[0, -0.025 - yBob, 0]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.002, 0.002, hp.position[1] * dishScale * 0.5, 4]} />
              <meshBasicMaterial color="#c9a84c" transparent opacity={0.25} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function LoadingTracker({ onProgress }: { onProgress: (progress: number) => void }) {
  const { progress } = useProgress();
  useEffect(() => { onProgress(progress); }, [progress, onProgress]);
  return null;
}

// Reusable scratch vector to prevent per-frame GC allocations
const scratchHotspotVector = new Vector3();

// Project 3D hotspot positions to 2D screen with 15fps throttle for smooth 60fps INP
function HotspotProjector({ hotspots, dishScale, onProjected }: {
  hotspots: IngredientHotspot[];
  dishScale: number;
  onProjected: (projected: Array<{ id: string; name: string; description: string; screenX: number; screenY: number }>) => void;
}) {
  const { camera, size } = useThree();
  const lastUpdateRef = useRef(0);

  useFrame((state) => {
    if (hotspots.length === 0) return;
    const now = state.clock.getElapsedTime();
    // Throttle projection state updates to ~15fps (0.066s) to prevent main thread event loop starvation
    if (now - lastUpdateRef.current < 0.066) return;
    lastUpdateRef.current = now;

    const projected = hotspots.map((hp) => {
      scratchHotspotVector.set(
        hp.position[0] * dishScale,
        hp.position[1] * dishScale + 0.08,
        hp.position[2] * dishScale,
      );
      scratchHotspotVector.project(camera);
      return {
        id: hp.id,
        name: hp.name,
        description: hp.description,
        screenX: ((scratchHotspotVector.x + 1) / 2) * size.width,
        screenY: ((-scratchHotspotVector.y + 1) / 2) * size.height,
      };
    });
    onProjected(projected);
  });

  return null;
}

interface ARSceneProps {
  config: ModelConfig;
  category?: string;
  placed: boolean;
  modelScale: number;
  modelRotation: number;
  hotspots: IngredientHotspot[];
  showHotspots: boolean;
  onProgress: (progress: number) => void;
  onModelLoaded: () => void;
  onHotspotsProjected: (projected: Array<{ id: string; name: string; description: string; screenX: number; screenY: number }>) => void;
}

export function ARScene({
  config, category, placed, modelScale, modelRotation,
  hotspots, showHotspots,
  onProgress, onModelLoaded, onHotspotsProjected,
}: ARSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 2, 3], fov: 50, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      dpr={[1, 1.5]}
      style={{ background: 'transparent', position: 'absolute', inset: 0, zIndex: 1 }}
      id="ar-canvas"
    >
      <AdaptiveDpr pixelated />

      {/* Natural restaurant lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 3]} intensity={0.6} castShadow />
      <directionalLight position={[-2, 4, -1]} intensity={0.15} color="#fff5e0" />
      <pointLight position={[0, 3, 0]} intensity={0.2} color="#c9a84c" distance={8} />

      <ARReticle visible={!placed} />

      <Suspense fallback={null}>
        <LoadingTracker onProgress={onProgress} />
        <ARFoodModel
          config={config}
          category={category}
          placed={placed}
          scale={modelScale}
          rotation={modelRotation}
          onLoaded={onModelLoaded}
          onProgress={onProgress}
        />
        {placed && showHotspots && (
          <HotspotMarkers
            hotspots={hotspots}
            visible={showHotspots}
            dishScale={config.initialScale * modelScale}
          />
        )}
        {placed && (
          <HotspotProjector
            hotspots={showHotspots ? hotspots : []}
            dishScale={config.initialScale * modelScale}
            onProjected={onHotspotsProjected}
          />
        )}
        {placed && (
          <ContactShadows
            position={[0, -0.01, 0]}
            opacity={0.35}
            scale={8}
            blur={2.5}
            far={4}
          />
        )}
      </Suspense>
    </Canvas>
  );
}
