'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { generateOakParticleMap, OakParticle, GOLD_PALETTE } from './oakTreeParticleMap';

interface CinematicParticleTreeProps {
  onComplete?: () => void;
  isReady?: boolean;
}

// Cubic bezier easing for graceful deceleration
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface FallingGoldenLeaf {
  x: number;
  y: number;
  length: number;
  width: number;
  speedY: number;
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
  '#F5C869',
  '#FFE5A3',
  '#E6A838',
  '#CFA043',
  '#FFF2C6',
  '#D89E34',
];

export function CinematicParticleTree({ onComplete, isReady = true }: CinematicParticleTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Animation & Clock Refs (zero React state in per-frame render loop)
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const lastHiddenTimeRef = useRef<number | null>(null);
  const completedTriggeredRef = useRef<boolean>(false);

  // Mouse & Pointer Reactivity
  const pointerTargetRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const pointerCurrentRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerPosRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  // DOM Refs for 60/120 FPS buttery smooth direct UI updates (bypassing React re-renders)
  const progressTextRef = useRef<HTMLSpanElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const lastReportedProgressRef = useRef<number>(0);

  // Typography Reveal Phase (5.0s to 8.0s)
  const [titlePhase, setTitlePhase] = useState<'hidden' | 'revealing' | 'complete'>('hidden');
  const titlePhaseRef = useRef<'hidden' | 'revealing' | 'complete'>('hidden');
  const [showSubtitle, setShowSubtitle] = useState<boolean>(false);
  const showSubtitleRef = useRef<boolean>(false);

  // Brand Name Split Characters for Luxury Letter-by-Letter Drift
  const BRAND_TITLE = 'The Golden Oak';
  const SUBTITLE = 'RESTAURANT & LOUNGE';

  // Responsive Particle List (High fragment density calibrated for rock-solid 60 FPS)
  const particlesRef = useRef<OakParticle[]>([]);
  // Falling Golden Leaves Shedding from Tree Canopy
  const leavesRef = useRef<FallingGoldenLeaf[]>([]);

  // Initialize Particles with calibrated fragment counts for buttery smooth performance
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    particlesRef.current = generateOakParticleMap(isMobile ? 1800 : 3200);
  }, []);

  // Pointer Movement Handlers
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.32; // Center of tree emblem

    const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width * 0.4)));
    const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height * 0.4)));

    pointerTargetRef.current = { x: nx, y: ny, active: true };
    pointerPosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    handlePointerMove(e);
  }, [handlePointerMove]);

  const handlePointerLeave = useCallback(() => {
    pointerTargetRef.current.active = false;
    pointerPosRef.current.active = false;
  }, []);

  // Handle Visibility Change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        lastHiddenTimeRef.current = performance.now();
      } else if (lastHiddenTimeRef.current !== null && startTimeRef.current !== null) {
        const pauseDuration = performance.now() - lastHiddenTimeRef.current;
        pausedTimeRef.current += pauseDuration;
        lastHiddenTimeRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Main 60 FPS Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);

    const resize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);

      // Initialize falling golden leaves
      const isMobile = rect.width < 768;
      const leafCount = isMobile ? 36 : 64;
      const minDim = Math.min(canvas.width, canvas.height);
      const emblemRadius = Math.max(300 * dpr, Math.min(canvas.width * 0.44, canvas.height * 0.40));
      const centerX = canvas.width * 0.5;
      const centerY = canvas.height * 0.32;

      const leaves: FallingGoldenLeaf[] = [];
      for (let i = 0; i < leafCount; i++) {
        const length = 4.0 + Math.random() * 4.5;
        const width = length * (0.42 + Math.random() * 0.16);
        const canopyMinY = centerY - emblemRadius * 0.52;
        const spawnX = centerX + (Math.random() - 0.5) * emblemRadius * 1.35;
        const spawnY = canopyMinY + Math.random() * (canvas.height - canopyMinY);

        leaves.push({
          x: spawnX,
          y: spawnY,
          length,
          width,
          speedY: 1.3 + Math.random() * 0.85,
          swaySpeed: 0.026 + Math.random() * 0.03,
          swayAmp: 0.8 + Math.random() * 1.1,
          swayPhase: Math.random() * Math.PI * 2,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.04,
          color: FALLING_LEAF_COLORS[Math.floor(Math.random() * FALLING_LEAF_COLORS.length)],
          baseAlpha: 0.55 + Math.random() * 0.35,
          twinklePhase: Math.random() * Math.PI * 2,
          hasGlint: Math.random() > 0.65,
        });
      }
      leavesRef.current = leaves;
    };

    resize();
    window.addEventListener('resize', resize);

    // Reduced Motion Detection
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Render Frame Function
    const render = (now: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }

      // Compute elapsed monotonic time (in seconds)
      const effectiveElapsed = (now - startTimeRef.current - pausedTimeRef.current) / 1000;
      const elapsed = prefersReducedMotion ? effectiveElapsed * 4.5 : effectiveElapsed;

      // =====================================================================
      // 1. PROGRESS COUNTER (Continuous, buttery-smooth monotonic glide)
      // 0s to 4s: fast progression 0% -> 90%
      // 4s to 5s: 90% -> 95% (1s)
      // 5s to 6s: 95% -> 99% (1s)
      // 6s to 8s: 99% -> 100% (2s)
      // =====================================================================
      let rawProgress = 0;
      if (elapsed <= 0) {
        rawProgress = 0;
      } else if (elapsed < 4.0) {
        // 0s - 4s: fast load 0% -> 90% with smooth ease
        const u = elapsed / 4.0;
        const ease = 1 - Math.pow(1 - u, 1.4);
        rawProgress = ease * 90;
      } else if (elapsed < 5.0) {
        // 4s - 5s: 90% -> 95% (1s)
        const u = elapsed - 4.0;
        rawProgress = 90 + u * 5.0;
      } else if (elapsed < 6.0) {
        // 5s - 6s: 95% -> 99% (1s)
        const u = elapsed - 5.0;
        rawProgress = 95 + u * 4.0;
      } else if (elapsed < 8.0) {
        // 6s - 8s: 99% -> 100% (2s)
        const u = (elapsed - 6.0) / 2.0;
        const ease = 1 - Math.pow(1 - u, 1.4);
        rawProgress = 99 + ease * 1.0;
      } else {
        rawProgress = 100;
      }

      const displayPercent = Math.min(100, Math.round(rawProgress));

      // Direct DOM update ensures ZERO frame drops and smooth number progression
      if (displayPercent !== lastReportedProgressRef.current) {
        lastReportedProgressRef.current = displayPercent;
        if (progressTextRef.current) {
          progressTextRef.current.textContent = String(displayPercent).padStart(2, '0');
        }
      }

      // Progress bar updates with floating-point sub-pixel accuracy every single frame
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${rawProgress.toFixed(2)}%`;
      }

      // =====================================================================
      // 2. TIMELINE PHASES & TYPOGRAPHY REVEAL
      // GPU-accelerated CSS transition-delays handle letter cascade (0 React re-renders)
      // =====================================================================
      if (elapsed >= 5.0 && titlePhaseRef.current === 'hidden') {
        titlePhaseRef.current = 'revealing';
        setTitlePhase('revealing');
      }

      if (elapsed >= 5.8 && !showSubtitleRef.current) {
        showSubtitleRef.current = true;
        setShowSubtitle(true);
      }

      if (elapsed >= 6.8 && titlePhaseRef.current !== 'complete') {
        titlePhaseRef.current = 'complete';
        setTitlePhase('complete');
      }

      // Trigger Completion at exactly 8.0s when website readiness allows
      if (elapsed >= 8.0 && !completedTriggeredRef.current) {
        if (isReady) {
          completedTriggeredRef.current = true;
          if (onComplete) onComplete();
        }
      }

      // =====================================================================
      // 3. POINTER LERP & REACTIVITY
      // =====================================================================
      const targetP = pointerTargetRef.current.active
        ? pointerTargetRef.current
        : { x: 0, y: 0 };
      pointerCurrentRef.current.x += (targetP.x - pointerCurrentRef.current.x) * 0.06;
      pointerCurrentRef.current.y += (targetP.y - pointerCurrentRef.current.y) * 0.06;

      const px = pointerCurrentRef.current.x;
      const py = pointerCurrentRef.current.y;

      // =====================================================================
      // 4. CANVAS CLEAR (PURE METALLIC BLACK: #000000)
      // =====================================================================
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.32;
      const emblemRadius = Math.max(300 * dpr, Math.min(width * 0.44, height * 0.40));

      const sweepActive = elapsed >= 3.6 && elapsed <= 5.2;
      const sweepY = sweepActive ? 0.7 - ((elapsed - 3.6) / 1.6) * 1.5 : -999;

      // Exact cursor coordinates on canvas for interactive fragment repulsion
      const mouseCanvasX = pointerPosRef.current.x * dpr;
      const mouseCanvasY = pointerPosRef.current.y * dpr;
      const isPointerActive = pointerPosRef.current.active;

      // Soft Golden Cursor Ripple Aura when interacting (Refined subtle compact radius)
      if (isPointerActive) {
        const cursorGlow = ctx.createRadialGradient(
          mouseCanvasX,
          mouseCanvasY,
          0,
          mouseCanvasX,
          mouseCanvasY,
          28 * dpr
        );
        cursorGlow.addColorStop(0, 'rgba(247, 217, 139, 0.22)');
        cursorGlow.addColorStop(0.5, 'rgba(212, 175, 55, 0.08)');
        cursorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cursorGlow;
        ctx.beginPath();
        ctx.arc(mouseCanvasX, mouseCanvasY, 28 * dpr, 0, Math.PI * 2);
        ctx.fill();

        // Expanding concentric golden ripple wave ring
        const ripplePhase = (now * 0.003) % (Math.PI * 2);
        const rippleRadius = (8 + (ripplePhase / (Math.PI * 2)) * 24) * dpr;
        const rippleAlpha = (1 - ripplePhase / (Math.PI * 2)) * 0.35;
        ctx.strokeStyle = `rgba(247, 217, 139, ${rippleAlpha})`;
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.arc(mouseCanvasX, mouseCanvasY, rippleRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // =====================================================================
      // 5. DRAW PARTICLES
      // =====================================================================
      const particles = particlesRef.current;
      const pLen = particles.length;

      for (let i = 0; i < pLen; i++) {
        const p = particles[i];

        // Phase A (0.0s - 1.0s): Awakening & Scattered Gentle Drift
        if (elapsed < 1.0) {
          const awakenT = Math.min(1, Math.max(0, elapsed / 0.8));
          const driftAngle = p.twinklePhase + elapsed * p.twinkleSpeed * 0.4;
          const driftDist = 18 * dpr * Math.sin(driftAngle);

          let currentScreenX = centerX + p.startX * emblemRadius * 1.6 + driftDist;
          let currentScreenY = centerY + p.startY * emblemRadius * 1.6 + driftDist * 0.5;

          const depthMultiplier = p.layer === 'trunk' ? 0.35 : p.layer === 'root' ? 0.25 : 1.0;

          // Fragment cursor repulsion during initial floating drift phase
          if (isPointerActive) {
            const dx = currentScreenX - mouseCanvasX;
            const dy = currentScreenY - mouseCanvasY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const repulsionRadius = 40 * dpr;

            if (dist < repulsionRadius && dist > 0.1) {
              const normDist = dist / repulsionRadius;
              const force = (1 - normDist) * (1 - normDist) * 22 * dpr * depthMultiplier;
              currentScreenX += (dx / dist) * force;
              currentScreenY += (dy / dist) * force;
            }
          }

          const alpha = awakenT * p.baseAlpha * 0.65;
          if (alpha <= 0.01) continue;

          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(currentScreenX, currentScreenY, p.size * dpr * 0.85, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        // Phase B & C (1.0s - 5.0s): Convergence toward Tree Silhouette
        let flightT = 0;
        if (elapsed < p.activationTime) {
          flightT = 0;
        } else {
          const rawFlight = (elapsed - p.activationTime) / p.duration;
          flightT = Math.min(1, Math.max(0, rawFlight));
        }

        const easedT = easeOutCubic(flightT);

        const targetScreenX = centerX + p.targetX * emblemRadius;
        const targetScreenY = centerY + p.targetY * emblemRadius;

        const startScreenX = centerX + p.startX * emblemRadius * 1.8;
        const startScreenY = centerY + p.startY * emblemRadius * 1.8;

        const arcAmount = (1 - easedT) * easedT * p.curveBias * 70 * dpr;
        let curX = startScreenX + (targetScreenX - startScreenX) * easedT - arcAmount * (p.targetY || 0.5);
        let curY = startScreenY + (targetScreenY - startScreenY) * easedT + arcAmount * (p.targetX || 0.5);

        // Parallax depth shift based on normalized pointer
        const depthMultiplier = p.layer === 'trunk' ? 0.35 : p.layer === 'root' ? 0.25 : 1.0;
        const parallaxX = px * p.depth * 14 * dpr * depthMultiplier;
        const parallaxY = py * p.depth * 10 * dpr * depthMultiplier;

        curX += parallaxX * Math.max(0.2, easedT);
        curY += parallaxY * Math.max(0.2, easedT);

        // Interactive Cursor Repulsion active across ALL fragment stages
        if (isPointerActive) {
          const dx = curX - mouseCanvasX;
          const dy = curY - mouseCanvasY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const repulsionRadius = 40 * dpr;

          if (dist < repulsionRadius && dist > 0.1) {
            const normDist = dist / repulsionRadius;
            const force = (1 - normDist) * (1 - normDist) * 22 * dpr * depthMultiplier;
            curX += (dx / dist) * force;
            curY += (dy / dist) * force;
          }
        }

        // Visual Styling, Twinkle & Golden Light Sweep
        const twinkle = Math.sin(p.twinklePhase + elapsed * p.twinkleSpeed) * 0.18;
        let alpha = Math.min(1, Math.max(0.15, p.baseAlpha + twinkle));

        if (sweepActive && easedT > 0.85) {
          const distToWave = Math.abs(p.targetY - sweepY);
          if (distToWave < 0.22) {
            const sweepIntensity = (1 - distToWave / 0.22) * 0.85;
            alpha = Math.min(1, alpha + sweepIntensity);
          }
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        const curSize = (p.isHighlight ? p.size * 1.15 : p.size) * dpr;
        ctx.arc(curX, curY, curSize, 0, Math.PI * 2);
        ctx.fill();

        if (p.isHighlight && easedT > 0.8) {
          ctx.globalAlpha = alpha * 0.25;
          ctx.beginPath();
          ctx.arc(curX, curY, curSize * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // =====================================================================
      // 6. RENDER FALLING GOLDEN LEAVES
      // =====================================================================
      if (elapsed >= 0.8) {
        const leafIntroFactor = Math.min(1, Math.max(0, (elapsed - 0.8) / 1.5));
        const leaves = leavesRef.current;
        const leafCount = leaves.length;
        const canopyMinY = centerY - emblemRadius * 0.52;
        const canopyMaxY = centerY + emblemRadius * 0.12;

        for (let i = 0; i < leafCount; i++) {
          const leaf = leaves[i];

          leaf.y += leaf.speedY * dpr;
          leaf.swayPhase += leaf.swaySpeed;
          const swayOffset = Math.sin(leaf.swayPhase) * leaf.swayAmp * dpr;
          leaf.x += swayOffset;
          leaf.angle += leaf.rotSpeed;

          if (leaf.y > height + 25 * dpr || leaf.x < -30 || leaf.x > width + 30) {
            leaf.x = centerX + (Math.random() - 0.5) * emblemRadius * 1.35;
            leaf.y = canopyMinY + Math.random() * (canopyMaxY - canopyMinY);
            leaf.speedY = 1.3 + Math.random() * 0.85;
            leaf.swayPhase = Math.random() * Math.PI * 2;
            leaf.angle = Math.random() * Math.PI * 2;
            leaf.rotSpeed = (Math.random() - 0.5) * 0.04;
          }

          // Interactive Cursor Repulsion on Falling Golden Leaves
          if (isPointerActive) {
            const ldx = leaf.x - mouseCanvasX;
            const ldy = leaf.y - mouseCanvasY;
            const ldist = Math.sqrt(ldx * ldx + ldy * ldy);
            const leafRepelRadius = 60 * dpr;
            if (ldist < leafRepelRadius && ldist > 0.1) {
              const lNorm = ldist / leafRepelRadius;
              const lForce = (1 - lNorm) * (1 - lNorm) * 22 * dpr;
              leaf.x += (ldx / ldist) * lForce;
              leaf.y += (ldy / ldist) * lForce;
              leaf.angle += (ldx > 0 ? 0.05 : -0.05);
            }
          }

          const curLength = leaf.length * dpr;
          const curWidth = leaf.width * dpr;
          const shimmer = Math.sin(leaf.twinklePhase + elapsed * 3.0) * 0.15;
          const alpha = Math.max(0.2, Math.min(0.95, leaf.baseAlpha + shimmer)) * leafIntroFactor;

          ctx.save();
          ctx.translate(leaf.x, leaf.y);
          ctx.rotate(leaf.angle);

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

          ctx.beginPath();
          ctx.moveTo(0, -curLength * 0.8);
          ctx.lineTo(0, curLength * 0.8);
          ctx.strokeStyle = '#FFF6D6';
          ctx.globalAlpha = alpha * 0.55;
          ctx.lineWidth = Math.max(0.6, 0.75 * dpr);
          ctx.stroke();

          if (leaf.hasGlint && Math.sin(leaf.twinklePhase + elapsed * 4) > 0.65) {
            ctx.globalAlpha = alpha * 0.35;
            ctx.beginPath();
            ctx.arc(0, 0, curLength * 1.3, 0, Math.PI * 2);
            ctx.fillStyle = '#FFF8E7';
            ctx.fill();
          }

          ctx.restore();
        }
      }

      ctx.globalAlpha = 1.0;

      animFrameRef.current = requestAnimationFrame(render);
    };

    let rectWidth = canvas.width / dpr;
    let rectHeight = canvas.height / dpr;
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      rectWidth = r.width;
      rectHeight = r.height;
    }

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      window.removeEventListener('resize', resize);
    };
  }, [isReady, onComplete]);

  // Support ESC keyboard shortcut for instant accessibility skip (no UI button)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onComplete) onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerLeave}
      className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden touch-none"
      style={{ backgroundColor: '#000000' }}
    >
      {/* 1. Main Canvas 2D Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-10" />

      {/* 2. Phase D Typography Reveal: "The Golden Oak" & "RESTAURANT & LOUNGE" */}
      {/* Bespoke Cinzel Roman Luxury Serif with refined optical kerning */}
      <div className="absolute inset-x-0 bottom-[14%] sm:bottom-[16%] md:bottom-[18%] pointer-events-none z-20 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-5xl flex flex-col items-center justify-center text-center">
          {/* Brand Name in Cinzel with Gold Leaf Metallic Gradient & Natural Kerning */}
          <div className="flex items-center justify-center tracking-wide flex-wrap">
            {BRAND_TITLE.split('').map((char, index) => {
              const isRevealed = titlePhase !== 'hidden';
              return (
                <span
                  key={index}
                  className="font-[family-name:var(--font-cinzel)] font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-semibold tracking-wider inline-block leading-tight select-none"
                  style={{
                    opacity: isRevealed ? 1 : 0,
                    transform: isRevealed ? 'translateY(0)' : 'translateY(14px)',
                    transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                    transitionDelay: `${index * 65}ms`,
                    background: isRevealed
                      ? 'linear-gradient(180deg, #FFF9EB 0%, #F5DC9A 48%, #CFA54A 100%)'
                      : 'transparent',
                    WebkitBackgroundClip: isRevealed ? 'text' : undefined,
                    WebkitTextFillColor: isRevealed ? 'transparent' : undefined,
                    filter: isRevealed ? 'drop-shadow(0 0 20px rgba(214,183,122,0.45))' : 'none',
                    marginRight: char === ' ' ? '0.3em' : '0.02em',
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </div>

          {/* Subtitle: "RESTAURANT & LOUNGE" in classical Roman tracking */}
          <div
            className="text-[11px] sm:text-xs md:text-sm font-sans tracking-[0.45em] text-[#D4AF37] uppercase font-medium mt-3.5 select-none drop-shadow-[0_0_8px_rgba(214,183,122,0.35)]"
            style={{
              opacity: showSubtitle ? 0.95 : 0,
              transform: showSubtitle ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), letter-spacing 0.8s ease-out',
              letterSpacing: showSubtitle ? '0.45em' : '0.25em',
            }}
          >
            {SUBTITLE}
          </div>
        </div>
      </div>

      {/* 3. Percentage Progress Counter (Right Side as Circled) & Wide Gold Bar */}
      <div className="absolute bottom-5 sm:bottom-7 inset-x-0 z-30 pointer-events-none flex flex-col gap-2.5 px-6 sm:px-12 md:px-16 w-full max-w-6xl mx-auto">
        {/* Right-aligned Percentage Display with Luxury Roman Serif Font */}
        <div className="w-full flex justify-end items-baseline pr-1 sm:pr-2">
          <span className="font-[family-name:var(--font-cinzel)] font-serif text-2xl sm:text-3xl md:text-4xl font-semibold tracking-wider text-[#F5DC9A] tabular-nums drop-shadow-[0_0_16px_rgba(245,220,154,0.65)] select-none">
            <span ref={progressTextRef}>00</span>
            <span className="text-base sm:text-lg md:text-xl text-[#D4AF37] ml-1.5 font-serif font-medium">%</span>
          </span>
        </div>
        {/* Prominent Wide Gold Progress Bar spanning across the bottom */}
        <div className="w-full h-[2.5px] sm:h-[3px] bg-white/[0.08] rounded-full overflow-hidden shadow-[0_0_12px_rgba(214,183,122,0.25)]">
          <div
            ref={progressBarRef}
            className="h-full bg-gradient-to-r from-[#9C6B18] via-[#D4AF37] to-[#FFF0B8] shadow-[0_0_16px_rgba(247,217,139,0.95)] rounded-full will-change-[width]"
            style={{ width: '0%' }}
          />
        </div>
      </div>
    </div>
  );
}
