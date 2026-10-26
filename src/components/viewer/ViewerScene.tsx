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

/**
 * 360° Molten Gold Compass & Degree Ring on Pedestal Rim
 * High-precision luxury ticks (0°, 90°, 180°, 270°) and degree marks
 * that rotate synchronously with the turntable pedestal.
 */
function GoldCompassRing({ scale = 1 }: { scale?: number }) {
  // Generate 24 ticks around 360 degrees
  const ticks = useMemo(() => {
    const items: Array<{
      angle: number;
      isMajor: boolean;
      isSemiMajor: boolean;
      label?: string;
      x: number;
      z: number;
      length: number;
      width: number;
    }> = [];
    const radius = 1.84 * scale;

    for (let i = 0; i < 24; i++) {
      const deg = i * 15;
      const angle = (deg * Math.PI) / 180;
      const isMajor = deg % 90 === 0;
      const isSemiMajor = !isMajor && deg % 45 === 0;

      const length = isMajor ? 0.12 * scale : isSemiMajor ? 0.08 * scale : 0.045 * scale;
      const width = isMajor ? 0.02 * scale : isSemiMajor ? 0.015 * scale : 0.01 * scale;

      const x = Math.sin(angle) * (radius - length / 2);
      const z = Math.cos(angle) * (radius - length / 2);

      items.push({ angle, isMajor, isSemiMajor, x, z, length, width });
    }
    return items;
  }, [scale]);

  const radius = 1.84 * scale;

  return (
    <group position={[0, 0.015, 0]}>
      {/* Outer Continuous Molten Gold Rim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.02 * scale, radius + 0.02 * scale, 72]} />
        <meshStandardMaterial
          color="#E2A84B"
          metalness={0.85}
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner Concentric Hairline Track */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.14 * scale, radius - 0.125 * scale, 72]} />
        <meshStandardMaterial
          color="#E2A84B"
          metalness={0.7}
          roughness={0.3}
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Radial Ticks */}
      {ticks.map((t, idx) => (
        <group key={idx} position={[t.x, 0.002, t.z]} rotation={[0, -t.angle, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[t.width, t.length]} />
            <meshStandardMaterial
              color={t.isMajor ? '#E2A84B' : t.isSemiMajor ? '#D49432' : '#9E6818'}
              metalness={0.8}
              roughness={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * 3 Glowing Ingredient X-Ray Hotspot Pins
 * Highlights signature culinary elements directly over the 3D dish.
 */
function IngredientHotspotPins() {
  const hotspots = [
    {
      name: 'Pickled Onions',
      pos: [-0.45, 1.35, 0.35] as [number, number, number],
    },
    {
      name: 'Aged Cheddar',
      pos: [0.4, 1.55, -0.2] as [number, number, number],
    },
    {
      name: 'Smoky Mint Chutney',
      pos: [0.08, 0.9, 0.55] as [number, number, number],
    },
  ];

  return (
    <group>
      {hotspots.map((pin, i) => (
        <group key={pin.name} position={pin.pos}>
          {/* Glowing Pin Tip */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshBasicMaterial color="#E2A84B" />
          </mesh>

          {/* Vertical Needle Line */}
          <mesh position={[0, -0.16, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 0.32, 8]} />
            <meshBasicMaterial color="#E2A84B" transparent opacity={0.65} />
          </mesh>

          {/* Floating Luxury Glass Pill Badge */}
          <Html center distanceFactor={6} style={{ pointerEvents: 'none' }}>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#15110E]/90 backdrop-blur-md border border-[#E2A84B]/60 shadow-[0_0_18px_rgba(226,168,75,0.45)] whitespace-nowrap animate-in fade-in zoom-in-75 duration-300">
              <span className="w-2 h-2 rounded-full bg-[#E2A84B] shadow-[0_0_8px_#E2A84B] animate-pulse" />
              <span className="font-sans text-[11px] font-semibold text-[#FAF5EC] tracking-wide">
                {pin.name}
              </span>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

/**
 * 3D Model Loader with vibrant, authentic material colors.
 * Loads the warrior GLB and applies full rich colors to all materials
 * with the luxury turntable compass ring and optional ingredient pins.
 */
function FoodModel({ config, onLoaded, onProgress, showHotspots = false }: FoodModelProps) {
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
    <group ref={groupRef}>
      <primitive
        object={clonedScene}
        scale={config.initialScale}
        position={[0, 0, 0]}
      />

      {/* 360° Molten Gold Compass Degree Ring on outer turntable rim */}
      <GoldCompassRing scale={config.initialScale} />

      {/* Ingredient X-Ray Hotspots (Toggled via Control Dock) */}
      {showHotspots && <IngredientHotspotPins />}
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
