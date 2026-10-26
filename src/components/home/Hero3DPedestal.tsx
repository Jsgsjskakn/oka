'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RotateCw, Box } from 'lucide-react';

export function Hero3DPedestal() {
  const [rotation, setRotation] = useState(15);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const currentRotationRef = useRef(15);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Gentle auto-rotation when not dragging
    let lastTime = performance.now();
    const autoRotate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      if (!isDragging) {
        currentRotationRef.current = (currentRotationRef.current + delta * 12) % 360;
        setRotation(currentRotationRef.current);
      }
      animFrameRef.current = requestAnimationFrame(autoRotate);
    };
    animFrameRef.current = requestAnimationFrame(autoRotate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startXRef.current;
    startXRef.current = e.clientX;
    currentRotationRef.current = (currentRotationRef.current + deltaX * 0.7) % 360;
    setRotation(currentRotationRef.current);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative w-full aspect-square max-w-[440px] mx-auto flex flex-col items-center justify-center select-none">
      {/* Warm Ambient Gold Radial Glow Aura */}
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-[#E2A84B]/20 via-[#E2A84B]/05 to-transparent blur-2xl rounded-full" />
      
      {/* 360° Orbital Gold Geometry Ring */}
      <div className="pointer-events-none absolute inset-6 sm:inset-10 rounded-full border border-[#E2A84B]/20 animate-[spin_40s_linear_infinite]" />
      <div className="pointer-events-none absolute inset-12 sm:inset-16 rounded-full border border-dashed border-[#E2A84B]/15 animate-[spin_30s_linear_infinite_reverse]" />

      {/* Interactive 3D Dish Container */}
      <div
        className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] cursor-grab active:cursor-grabbing z-20 flex items-center justify-center"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ perspective: 1000 }}
      >
        {/* Architectural Pedestal Reflection Base */}
        <div
          className="absolute -bottom-4 w-[240px] sm:w-[280px] h-[40px] rounded-[100%] bg-gradient-to-t from-[#E2A84B]/15 via-black/60 to-transparent blur-sm"
          style={{
            transform: 'rotateX(60deg)',
          }}
        />

        {/* 3D Rotating Platter & Dish */}
        <div
          className="relative w-[250px] h-[250px] sm:w-[290px] sm:h-[290px] rounded-full overflow-hidden border-2 border-[#E2A84B]/40 transition-transform duration-75 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(226,168,75,0.25)]"
          style={{
            transform: `rotate(${rotation}deg) scale(1)`,
          }}
        >
          <Image
            src="/images/dishes/mushroom-truffle-pizza.webp"
            alt="Artisanal Wood-Fired Wild Truffle Mushroom Pizza 3D Preview"
            fill
            priority
            sizes="(max-width: 640px) 260px, 300px"
            className="object-cover pointer-events-none scale-105"
          />
        </div>
      </div>

      {/* Floating Glass Tag (Drag to Rotate 360° · Live 3D Menu) */}
      <Link
        href="/ar"
        className="relative z-30 mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs text-[#FAF5EC] transition-all hover:border-[#E2A84B] hover:text-[#E2A84B] group"
        style={{
          background: 'rgba(13, 10, 8, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(226, 168, 75, 0.3)',
        }}
      >
        <RotateCw className="w-3.5 h-3.5 text-[#E2A84B] group-hover:rotate-180 transition-transform duration-500" />
        <span className="font-medium tracking-wide">Drag to Rotate 360° · Live 3D Menu</span>
        <Box className="w-3.5 h-3.5 text-[#E2A84B]/80 ml-0.5" />
      </Link>
    </div>
  );
}
