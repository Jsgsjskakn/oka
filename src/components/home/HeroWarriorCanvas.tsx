'use client';

import React, { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, AdaptiveDpr } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { enhanceWarriorMaterials } from '@/components/viewer/warrior-materials';
import { WebGLContextGuard, WebGLErrorBoundary } from '@/components/3d/WebGLContextGuard';
import { SafeContactShadows } from '@/components/3d/SafeContactShadows';

interface HeroWarriorCanvasProps {
  autoRotate: boolean;
  onControlsRef?: (controls: OrbitControlsType | null) => void;
}

function WarriorMesh({ scale = 0.95 }: { scale?: number }) {
  const { scene } = useGLTF('/models/warrior_model.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    enhanceWarriorMaterials(clone);
    return clone;
  }, [scene]);

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      <primitive object={clonedScene} scale={scale} dispose={null} />
    </group>
  );
}

export function HeroWarriorCanvas({ autoRotate, onControlsRef }: HeroWarriorCanvasProps) {
  const controlsRef = useRef<OrbitControlsType | null>(null);
  const [shadowKey, setShadowKey] = useState(0);

  useEffect(() => {
    const handleGlobalRefresh = () => setShadowKey((k) => k + 1);
    window.addEventListener('golden-oak:refresh-shadow', handleGlobalRefresh);
    return () => window.removeEventListener('golden-oak:refresh-shadow', handleGlobalRefresh);
  }, []);

  return (
    <WebGLErrorBoundary
      name="Hero Warrior 3D"
      customMessage="Device graphics memory is constrained. Tap below to retry rendering the 3D model."
    >
      <Canvas
        frameloop={autoRotate ? 'always' : 'demand'}
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
        style={{ width: '100%', height: '100%', background: 'transparent', touchAction: 'pan-y' }}
      >
        <AdaptiveDpr pixelated />

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

        {/* Studio Luxury Warm Ambient Lights */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 6, 4]} intensity={1.2} />
        <directionalLight position={[-4, 4, -4]} intensity={0.4} color="#FFF2DA" />
        <directionalLight position={[0, -2, 2]} intensity={0.3} color="#F0C36B" />
        <pointLight position={[0, 3, 0]} intensity={0.6} color="#FFE4A0" />

        <Suspense fallback={null}>
          <WarriorMesh />
          {/* Contact Shadows: Leak-free SafeContactShadows */}
          <SafeContactShadows
            position={[0, -0.12, 0]}
            opacity={0.6}
            scale={5}
            blur={2.2}
            far={3}
            resolution={typeof window !== 'undefined' && window.innerWidth < 768 ? 512 : 1024}
            frames={1}
            smooth
            refreshTrigger={shadowKey}
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
          touches={{
            ONE: (-1 as unknown as THREE.TOUCH),
            TWO: THREE.TOUCH.DOLLY_ROTATE,
          }}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.05}
          enableDamping={true}
          dampingFactor={0.08}
          target={[0, 0.5, 0]}
          makeDefault
        />
      </Canvas>
    </WebGLErrorBoundary>
  );
}

useGLTF.preload('/models/warrior_model.glb', '/draco/');
