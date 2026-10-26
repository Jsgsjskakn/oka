'use client';

import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, ContactShadows, AdaptiveDpr } from '@react-three/drei';
import * as THREE from 'three';
import { enhanceWarriorMaterials } from '@/components/viewer/warrior-materials';

function WarriorModel({ isDragging }: { isDragging: boolean }) {
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

  // Smooth continuous auto-rotation when user is not dragging
  useFrame((_, delta) => {
    if (groupRef.current && !isDragging) {
      groupRef.current.rotation.y += delta * 0.45;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.6, 0]}>
      <primitive object={clonedScene} scale={0.7} />

      {/* Luxury Obsidian Turntable Disc Under Warrior */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.45, 64]} />
        <meshStandardMaterial color="#14100D" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Molten Gold Rim Ring */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.41, 1.45, 64]} />
        <meshStandardMaterial color="#E2A84B" roughness={0.2} metalness={0.85} />
      </mesh>
    </group>
  );
}

export function PromoWarriorCanvas() {
  const [isInteracting, setIsInteracting] = useState(false);

  return (
    <div className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{
          position: [0, 1.25, 3.4],
          fov: 38,
          near: 0.1,
          far: 50,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <AdaptiveDpr pixelated />

        {/* Studio Lighting Suite for High-Contrast Vibrant Textures */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 6, 4]} intensity={1.4} castShadow />
        <directionalLight position={[-4, 4, -4]} intensity={0.65} color="#FFE8C2" />
        <directionalLight position={[0, -2, 2]} intensity={0.35} color="#E2A84B" />
        <pointLight position={[0, 2, 0]} intensity={0.5} color="#FAF5EC" />

        <Suspense
          fallback={
            null
          }
        >
          <WarriorModel isDragging={isInteracting} />

          {/* Contact Shadows Under Disc */}
          <ContactShadows
            position={[0, -0.61, 0]}
            opacity={0.75}
            scale={3.8}
            blur={2}
            far={1.8}
          />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            target={[0, 0.55, 0]}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2 + 0.05}
            onStart={() => setIsInteracting(true)}
            onEnd={() => setIsInteracting(false)}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/warrior_scene.glb');
