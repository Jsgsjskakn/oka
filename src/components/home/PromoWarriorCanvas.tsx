'use client';

import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, AdaptiveDpr } from '@react-three/drei';
import * as THREE from 'three';
import { enhanceWarriorMaterials } from '@/components/viewer/warrior-materials';
import { WebGLContextGuard, WebGLErrorBoundary } from '@/components/3d/WebGLContextGuard';
import { SafeContactShadows } from '@/components/3d/SafeContactShadows';

// Subcomponent: Sync canvas touchAction to allow smooth page scroll on mobile
function CanvasScrollPassThrough() {
  const { gl } = useThree();
  useEffect(() => {
    if (gl?.domElement) {
      gl.domElement.style.touchAction = 'pan-y';
    }
  }, [gl]);
  return null;
}

// Camera zoom controller reactive to zoomLevel prop
function CameraZoomController({ zoomLevel = 1.0 }: { zoomLevel?: number }) {
  const { camera } = useThree();
  useEffect(() => {
    const baseDist = 3.4;
    const targetDist = baseDist / zoomLevel;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetDist, 0.8);
    camera.position.y = 1.25 / zoomLevel;
    camera.updateProjectionMatrix();
  }, [zoomLevel, camera]);
  return null;
}

function WarriorModel({ isDragging, autoRotate = true }: { isDragging: boolean; autoRotate?: boolean }) {
  const { scene } = useGLTF('/models/warrior_model.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    enhanceWarriorMaterials(clone);
    return clone;
  }, [scene]);

  // Smooth continuous auto-rotation when user is not dragging
  useFrame((_, delta) => {
    if (groupRef.current && !isDragging && autoRotate) {
      groupRef.current.rotation.y += delta * 0.45;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.6, 0]}>
      <primitive object={clonedScene} scale={0.7} dispose={null} />

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

interface PromoWarriorCanvasProps {
  autoRotate?: boolean;
  zoomLevel?: number;
}

export function PromoWarriorCanvas({ autoRotate = true, zoomLevel = 1.0 }: PromoWarriorCanvasProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const [shadowKey, setShadowKey] = useState(0);

  useEffect(() => {
    const handleGlobalRefresh = () => setShadowKey((k) => k + 1);
    window.addEventListener('golden-oak:refresh-shadow', handleGlobalRefresh);
    return () => window.removeEventListener('golden-oak:refresh-shadow', handleGlobalRefresh);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing">
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
          style={{ background: 'transparent', touchAction: 'pan-y' }}
        >
          <AdaptiveDpr pixelated />

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

          {/* Studio Lighting Suite for High-Contrast Vibrant Textures */}
          <ambientLight intensity={0.9} />
          <directionalLight position={[4, 6, 4]} intensity={1.4} />
          <directionalLight position={[-4, 4, -4]} intensity={0.65} color="#FFE8C2" />
          <directionalLight position={[0, -2, 2]} intensity={0.35} color="#E2A84B" />
          <pointLight position={[0, 2, 0]} intensity={0.5} color="#FAF5EC" />

          <Suspense fallback={null}>
            <CameraZoomController zoomLevel={zoomLevel} />
            <WarriorModel isDragging={isInteracting} autoRotate={autoRotate} />

            {/* Contact Shadows Under Disc: Leak-free SafeContactShadows */}
            <SafeContactShadows
              position={[0, -0.61, 0]}
              opacity={0.75}
              scale={3.8}
              blur={2}
              far={1.8}
              resolution={typeof window !== 'undefined' && window.innerWidth < 768 ? 512 : 1024}
              frames={1}
              smooth
              refreshTrigger={shadowKey}
            />

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
              onStart={() => setIsInteracting(true)}
              onEnd={() => setIsInteracting(false)}
            />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}

useGLTF.preload('/models/warrior_model.glb', '/draco/');
