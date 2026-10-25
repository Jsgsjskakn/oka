'use client';

import { useEffect, useState, useRef } from 'react';

export function MagneticCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if device has touch screen; if so, don't show custom cursor
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const onMouseMove = (e: MouseEvent) => {
      // Use requestAnimationFrame for smoother following
      requestAnimationFrame(() => {
        setPosition({ x: e.clientX, y: e.clientY });
      });
    };

    const updateHoverState = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if hovering over interactive elements
      const isInteractive = target.closest('button, a, input, select, textarea, label, [role="button"]');
      setIsHovering(!!isInteractive);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseover', updateHoverState);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', updateHoverState);
    };
  }, []);

  // Return nothing on touch devices or if not mounted/positioned yet
  if (position.x === 0 && position.y === 0) return null;

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed top-0 left-0 z-[9999] mix-blend-screen transition-transform duration-100 ease-out will-change-transform hidden md:block"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%)`,
      }}
    >
      <div 
        className={`rounded-full bg-champagne blur-[15px] opacity-40 transition-all duration-300 ease-out ${
          isHovering ? 'w-[60px] h-[60px] bg-cyan-400 opacity-50 blur-[20px]' : 'w-[40px] h-[40px]'
        }`} 
      />
      {/* Inner sharp dot for precision */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ${
          isHovering ? 'w-1 h-1 bg-white opacity-80' : 'w-2 h-2 bg-[#e8d085] opacity-90 shadow-[0_0_10px_#c9a84c]'
        }`}
      />
    </div>
  );
}
