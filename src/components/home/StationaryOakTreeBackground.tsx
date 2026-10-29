'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { generateOakParticleMap, OakParticle, GOLD_PALETTE } from '@/components/preloader/oakTreeParticleMap';

interface AmbientEmber {
  x: number; // 0 to 1 normalized
  y: number; // 0 to 1 normalized
  size: number;
  speedY: number;
  speedX: number;
  alpha: number;
  baseAlpha: number;
  phase: number;
}

interface FallingGoldenLeaf {
  x: number;
  y: number;
  length: number;
  width: number;
  speedY: number; // medium falling speed ("slowly na he fast, medium speed")
  swaySpeed: number;
  swayAmp: number;
  swayPhase: number;
  angle: number;
  rotSpeed: number;
  color: string;
  baseAlpha: number;
  twinklePhase: number;
  hasGlint: boolean;
}

const FALLING_LEAF_COLORS = [
  '#F5C869', // Bright gold
  '#FFE5A3', // Pale shimmering gold
  '#E6A838', // Rich warm amber
  '#CFA043', // Metallic champagne
  '#FFF2C6', // Radiant highlight gold
  '#D89E34', // Deep antique gold
];

interface StationaryOakTreeBackgroundProps {
  className?: string;
  isFixed?: boolean;
}

export function StationaryOakTreeBackground({
  className = '',
  isFixed = false,
}: StationaryOakTreeBackgroundProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Animation frame & time tracking
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastHiddenTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);
  const renderRef = useRef<((now: number) => void) | null>(null);

  const startAnimation = useCallback(() => {
    if (animFrameRef.current === null && isVisibleRef.current && !document.hidden && renderRef.current) {
      animFrameRef.current = requestAnimationFrame(renderRef.current);
    }
  }, []);

  // Normalized pointer lerp for subtle 2.5D depth parallax
  const pointerTargetRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const pointerCurrentRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Deterministic Oak Particles (~1050 particles for majestic density)
  const particlesRef = useRef<OakParticle[]>([]);
  // Ambient rising golden embers
  const embersRef = useRef<AmbientEmber[]>([]);
  // Falling delicate golden leaves shed from the oak tree canopy
  const leavesRef = useRef<FallingGoldenLeaf[]>([]);

  // Smooth fade-in opacity ramp
  const [opacity, setOpacity] = useState<number>(0);

  // Initialize Particles, Embers & Falling Golden Leaves
  useEffect(() => {
    // Generate identical Oak tree particle geometry
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    particlesRef.current = generateOakParticleMap(isMobile ? 850 : 1450);

    // Generate ~35 gentle rising warm golden embers for magical dining atmosphere
    const embers: AmbientEmber[] = [];
    const count = isMobile ? 20 : 35;
    for (let i = 0; i < count; i++) {
      embers.push({
        x: Math.random(),
        y: Math.random(),
        size: 1.2 + Math.random() * 2.2,
        speedY: 0.00018 + Math.random() * 0.0004,
        speedX: (Math.random() - 0.5) * 0.00015,
        alpha: 0.35 + Math.random() * 0.55,
        baseAlpha: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
    embersRef.current = embers;

    // Graceful fade-in on mount
    const timer = setTimeout(() => {
      setOpacity(1);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // IntersectionObserver to freeze loop when scrolled offscreen (0% battery waste)
  useEffect(() => {
    if (isFixed) {
      isVisibleRef.current = true;
      return;
    }
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const wasVisible = isVisibleRef.current;
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting && !wasVisible) {
          startAnimation();
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isFixed, startAnimation]);

  // Visibility change pause/resume
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        lastHiddenTimeRef.current = performance.now();
        if (animFrameRef.current !== null) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
      } else {
        if (lastHiddenTimeRef.current !== null && startTimeRef.current !== null) {
          pausedTimeRef.current += performance.now() - lastHiddenTimeRef.current;
          lastHiddenTimeRef.current = null;
        }
        startAnimation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [startAnimation]);

  // Pointer tracking for subtle 2.5D spatial parallax
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width * 0.5)));
    const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height * 0.5)));

    pointerTargetRef.current = { x: nx, y: ny, active: true };
  }, []);

  const handlePointerLeave = useCallback(() => {
    pointerTargetRef.current.active = false;
  }, []);

  // Main 60 FPS Stationary Tree Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let localDpr = 1;

    const resize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      localDpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);

      canvas.width = Math.max(1, Math.floor(rect.width * localDpr));
      canvas.height = Math.max(1, Math.floor(rect.height * localDpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // Re-initialize / replenish falling leaves on resize
      const isMobile = rect.width < 768;
      const leafCount = isMobile ? 32 : 54;
      const emblemRadius = Math.max(340 * localDpr, Math.min(canvas.width * 0.48, canvas.height * 0.82));
      const centerX = canvas.width * 0.5;
      const centerY = canvas.height * 0.46;

      const leaves: FallingGoldenLeaf[] = [];
      for (let i = 0; i < leafCount; i++) {
        const length = 4.2 + Math.random() * 4.2; // small delicate golden leaf (~4.2 to 8.4px)
        const width = length * (0.42 + Math.random() * 0.16); // ~1.8 to 4.2px
        const canopyMinY = centerY - emblemRadius * 0.55;
        const spawnX = centerX + (Math.random() - 0.5) * emblemRadius * 1.35;
        // Pre-distribute vertically across screen on first load
        const spawnY = canopyMinY + Math.random() * (canvas.height - canopyMinY);

        leaves.push({
          x: spawnX,
          y: spawnY,
          length,
          width,
          // Medium fall speed: ~1.35 - 2.25 px per frame at 60fps (graceful organic flutter)
          speedY: 1.35 + Math.random() * 0.9,
          swaySpeed: 0.026 + Math.random() * 0.03,
          swayAmp: 0.85 + Math.random() * 1.15,
          swayPhase: Math.random() * Math.PI * 2,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.04,
          color: FALLING_LEAF_COLORS[Math.floor(Math.random() * FALLING_LEAF_COLORS.length)],
          baseAlpha: 0.55 + Math.random() * 0.38,
          twinklePhase: Math.random() * Math.PI * 2,
          hasGlint: Math.random() > 0.6,
        });
      }
      leavesRef.current = leaves;
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    const render = (now: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = now;
      }

      // If hidden or scrolled out of view, sleep the render pass without scheduling new frames
      if (!isVisibleRef.current || document.hidden) {
        animFrameRef.current = null;
        return;
      }

      const elapsed = (now - startTimeRef.current - pausedTimeRef.current) / 1000;
      const dpr = localDpr;
      const width = canvas.width;
      const height = canvas.height;

      // Pointer Lerp
      const targetP = pointerTargetRef.current.active ? pointerTargetRef.current : { x: 0, y: 0 };
      pointerCurrentRef.current.x += (targetP.x - pointerCurrentRef.current.x) * 0.04;
      pointerCurrentRef.current.y += (targetP.y - pointerCurrentRef.current.y) * 0.04;
      const px = pointerCurrentRef.current.x;
      const py = pointerCurrentRef.current.y;

      // 1. Clear Canvas with Transparent Alpha (allows dark backdrop beneath)
      ctx.clearRect(0, 0, width, height);

      // Center the majestic tree emblem horizontally and vertically behind the section
      const centerX = width * 0.5;
      const centerY = height * 0.46;

      // Calibrated emblem scale to spread majestically behind and around both cards
      const emblemRadius = Math.max(340 * dpr, Math.min(width * 0.48, height * 0.82));

      // 2. Soft Ambient Radial Golden Illumination Behind Tree
      const auraGradient = ctx.createRadialGradient(
        centerX,
        centerY - emblemRadius * 0.15,
        emblemRadius * 0.08,
        centerX,
        centerY,
        emblemRadius * 1.65
      );
      auraGradient.addColorStop(0, 'rgba(240, 195, 107, 0.28)');
      auraGradient.addColorStop(0.35, 'rgba(212, 175, 55, 0.16)');
      auraGradient.addColorStop(0.7, 'rgba(156, 107, 24, 0.06)');
      auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, emblemRadius * 1.7, 0, Math.PI * 2);
      ctx.fill();

      // 3. Render Ambient Rising Golden Hearth Embers
      const embers = embersRef.current;
      const eLen = embers.length;
      for (let i = 0; i < eLen; i++) {
        const ember = embers[i];
        ember.y -= ember.speedY;
        ember.x += Math.sin(ember.phase + elapsed * 1.2) * 0.0003;
        if (ember.y < -0.05) {
          ember.y = 1.05;
          ember.x = Math.random();
        }

        const emberScreenX = ember.x * width;
        const emberScreenY = ember.y * height;
        const pulse = Math.sin(ember.phase + elapsed * 2.5) * 0.18;
        const emberAlpha = Math.max(0.08, Math.min(0.85, ember.baseAlpha + pulse));

        ctx.fillStyle = GOLD_PALETTE.highlightGold;
        ctx.globalAlpha = emberAlpha * 0.75;
        ctx.beginPath();
        ctx.arc(emberScreenX, emberScreenY, ember.size * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Render Stationary The Golden Oak Tree Emblem Particles
      const particles = particlesRef.current;
      const pLen = particles.length;

      // Subtle organic breathing: canopy pulses gently with living life
      const breathing = Math.sin(elapsed * 0.9) * (0.012 * emblemRadius);

      for (let i = 0; i < pLen; i++) {
        const p = particles[i];

        // Target coordinates from calibrated emblem map
        const targetScreenX = centerX + p.targetX * emblemRadius;
        const targetScreenY = centerY + p.targetY * emblemRadius;

        // Subtle layer-specific depth and breathing
        const depthMultiplier = p.layer === 'trunk' ? 0.35 : p.layer === 'root' ? 0.25 : 1.0;
        const breathFactor = p.layer === 'canopy' || p.layer === 'apex' ? breathing : breathing * 0.2;

        // Subtle 2.5D Parallax with pointer (tree stays in place, subtle spatial feel)
        const parallaxX = px * p.depth * 9 * dpr * depthMultiplier;
        const parallaxY = py * p.depth * 6 * dpr * depthMultiplier;

        const curX = targetScreenX + p.targetX * breathFactor + parallaxX;
        const curY = targetScreenY + p.targetY * breathFactor + parallaxY;

        // Micro-twinkle shimmer
        const twinkle = Math.sin(p.twinklePhase + elapsed * p.twinkleSpeed) * 0.22;
        const alpha = Math.min(1, Math.max(0.24, p.baseAlpha * 1.05 + twinkle));

        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;

        // Render Core Particle
        ctx.beginPath();
        const curSize = (p.isHighlight ? p.size * 1.45 : p.size * 1.25) * dpr;
        ctx.arc(curX, curY, curSize, 0, Math.PI * 2);
        ctx.fill();

        // Soft Golden Halo Aura for Highlights
        if (p.isHighlight) {
          ctx.globalAlpha = alpha * 0.42;
          ctx.beginPath();
          ctx.arc(curX, curY, curSize * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Render Falling Golden Leaves Shedding from Tree Canopy at Medium Speed
      const leaves = leavesRef.current;
      const leafCount = leaves.length;
      const canopyMinY = centerY - emblemRadius * 0.55;
      const canopyMaxY = centerY + emblemRadius * 0.12;

      for (let i = 0; i < leafCount; i++) {
        const leaf = leaves[i];

        // Downward fall: medium speed (~1.35 - 2.25 px per frame scaled by dpr)
        leaf.y += leaf.speedY * dpr;

        // Gentle horizontal sway (tumbling oscillation in the air breeze)
        leaf.swayPhase += leaf.swaySpeed;
        const swayOffset = Math.sin(leaf.swayPhase) * leaf.swayAmp * dpr;
        leaf.x += swayOffset;

        // Gentle rotation
        leaf.angle += leaf.rotSpeed;

        // Reset to tree canopy when falling below bottom or out of horizontal bounds
        if (leaf.y > height + 25 * dpr || leaf.x < -40 || leaf.x > width + 40) {
          leaf.x = centerX + (Math.random() - 0.5) * emblemRadius * 1.35;
          leaf.y = canopyMinY + Math.random() * (canopyMaxY - canopyMinY);
          leaf.speedY = 1.35 + Math.random() * 0.9;
          leaf.swayPhase = Math.random() * Math.PI * 2;
          leaf.angle = Math.random() * Math.PI * 2;
          leaf.rotSpeed = (Math.random() - 0.5) * 0.04;
        }

        // Draw small golden leaf shape
        const curLength = leaf.length * dpr;
        const curWidth = leaf.width * dpr;
        const shimmer = Math.sin(leaf.twinklePhase + elapsed * 3.0) * 0.15;
        const alpha = Math.max(0.25, Math.min(0.95, leaf.baseAlpha + shimmer));

        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.angle);

        // Pointed oval leaf contour
        ctx.beginPath();
        ctx.moveTo(0, -curLength);
        ctx.quadraticCurveTo(curWidth, -curLength * 0.25, curWidth * 0.85, 0);
        ctx.quadraticCurveTo(curWidth * 0.6, curLength * 0.7, 0, curLength);
        ctx.quadraticCurveTo(-curWidth * 0.6, curLength * 0.7, -curWidth * 0.85, 0);
        ctx.quadraticCurveTo(-curWidth, -curLength * 0.25, 0, -curLength);
        ctx.closePath();

        ctx.fillStyle = leaf.color;
        ctx.globalAlpha = alpha;
        ctx.fill();

        // Delicate central spine / leaf vein
        ctx.beginPath();
        ctx.moveTo(0, -curLength * 0.8);
        ctx.lineTo(0, curLength * 0.8);
        ctx.strokeStyle = '#FFF6D6';
        ctx.globalAlpha = alpha * 0.55;
        ctx.lineWidth = Math.max(0.6, 0.75 * dpr);
        ctx.stroke();

        // Subtle specular glint
        if (leaf.hasGlint && Math.sin(leaf.twinklePhase + elapsed * 4) > 0.65) {
          ctx.globalAlpha = alpha * 0.35;
          ctx.beginPath();
          ctx.arc(0, 0, curLength * 1.3, 0, Math.PI * 2);
          ctx.fillStyle = '#FFF8E7';
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.globalAlpha = 1.0;
      animFrameRef.current = requestAnimationFrame(render);
    };

    renderRef.current = render;
    if (isVisibleRef.current && !document.hidden) {
      animFrameRef.current = requestAnimationFrame(render);
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      renderRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`${
        isFixed ? 'fixed' : 'absolute'
      } inset-0 w-full h-full pointer-events-none select-none overflow-hidden transition-opacity duration-1000 ease-out ${className}`}
      style={{
        opacity,
        zIndex: 0,
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
