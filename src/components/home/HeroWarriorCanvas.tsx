'use client';

import React, { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, ContactShadows, AdaptiveDpr } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { enhanceWarriorMaterials } from '@/components/viewer/warrior-materials';

interface HeroWarriorCanvasProps {
  autoRotate: boolean;
  onControlsRef?: (controls: OrbitControlsType | null) => void;
}

function WarriorMesh({ scale = 0.95 }: { scale?: number }) {
  const { scene } = useGLTF('/models/warrior_scene.glb');
  const groupRef = useRef<THREE.Group>(null);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    enhanceWarriorMaterials(clone);
    return clone;
  }, [scene]);

  useEffect(() => {
    return () => {
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => m.dispose());
          }
        }
      });
    };
  }, [clonedScene]);

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      <primitive object={clonedScene} scale={scale} />
    </group>
  );
}

export function HeroWarriorCanvas({ autoRotate, onControlsRef }: HeroWarriorCanvasProps) {
  const controlsRef = useRef<OrbitControlsType | null>(null);

  return (
    <Canvas
      camera={{
        position: [0, 1.4, 3.8],
        fov: 36,
        near: 0.1,
        far: 50,
      }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1.5]}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <AdaptiveDpr pixelated />

      {/* Studio Luxury Warm Ambient Lights */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} />
      <directionalLight position={[-4, 4, -4]} intensity={0.4} color="#FFF2DA" />
      <directionalLight position={[0, -2, 2]} intensity={0.3} color="#F0C36B" />
      <pointLight position={[0, 3, 0]} intensity={0.6} color="#FFE4A0" />

      <Suspense fallback={null}>
        <WarriorMesh />
        <ContactShadows
          position={[0, -0.12, 0]}
          opacity={0.6}
          scale={5}
          blur={2.2}
          far={3}
        />
      </Suspense>

      <OrbitControls
        ref={(ref) => {
          controlsRef.current = ref;
          onControlsRef?.(ref);
        }}
        autoRotate={autoRotate}
        autoRotateSpeed={1.8}
        enablePan={false}
        enableZoom={false}
        enableRotate={true}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.05}
        enableDamping={true}
        dampingFactor={0.08}
        target={[0, 0.5, 0]}
        makeDefault
      />
    </Canvas>
  );
}

useGLTF.preload('/models/warrior_scene.glb');
