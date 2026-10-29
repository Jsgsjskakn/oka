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

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

interface FallingGoldenLeaf {
  x: number;
  y: number;
  length: number;
  width: number;
  speedY: number; // medium speed ("slowly na he fast, medium speed")
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

  // Progress Counter State (Updated at throttled intervals for clean UI)
  const [progress, setProgress] = useState<number>(0);
  const lastReportedProgressRef = useRef<number>(0);

  // Typography Reveal Phase (5.0s to 8.0s)
  const [titlePhase, setTitlePhase] = useState<'hidden' | 'revealing' | 'complete'>('hidden');
  const titlePhaseRef = useRef<'hidden' | 'revealing' | 'complete'>('hidden');
  const [revealedLetters, setRevealedLetters] = useState<number>(0);
  const revealedLettersRef = useRef<number>(0);
  const [showSubtitle, setShowSubtitle] = useState<boolean>(false);
  const showSubtitleRef = useRef<boolean>(false);

  // Brand Name Split Characters for Luxury Letter-by-Letter Drift
  const BRAND_TITLE = 'The Golden Oak';
  const SUBTITLE = 'RESTAURANT & LOUNGE';

  // Responsive Particle List
  const particlesRef = useRef<OakParticle[]>([]);
  // Falling Golden Leaves Shedding from Tree Canopy
  const leavesRef = useRef<FallingGoldenLeaf[]>([]);

  // Initialize Particles & Viewport
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    particlesRef.current = generateOakParticleMap(isMobile ? 1200 : 2200);
  }, []);

  // Pointer Movement Handlers
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.38; // Center of tree emblem

    // Normalized from -1.0 to 1.0 relative to tree center
    const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width * 0.4)));
    const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height * 0.4)));

    pointerTargetRef.current = { x: nx, y: ny, active: true };
  }, []);

  const handlePointerLeave = useCallback(() => {
    pointerTargetRef.current.active = false;
  }, []);

  // Handle Visibility Change (Tab switching pause/clamp)
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

      // Initialize falling golden leaves shed from tree canopy
      const isMobile = rect.width < 768;
      const leafCount = isMobile ? 26 : 42;
      const minDim = Math.min(canvas.width, canvas.height);
      const emblemRadius = Math.max(220 * dpr, minDim * 0.33);
      const centerX = canvas.width * 0.5;
      const centerY = canvas.height * 0.38;

      const leaves: FallingGoldenLeaf[] = [];
      for (let i = 0; i < leafCount; i++) {
        const length = 4.0 + Math.random() * 4.0;
        const width = length * (0.42 + Math.random() * 0.16);
        const canopyMinY = centerY - emblemRadius * 0.52;
        const spawnX = centerX + (Math.random() - 0.5) * emblemRadius * 1.3;
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
      // If user prefers reduced motion, compress the 8s animation into 1.5s
      const elapsed = prefersReducedMotion ? effectiveElapsed * 4.5 : effectiveElapsed;

      // =====================================================================
      // 1. PROGRESS COUNTER (0% to 100% strictly monotonic)
      // =====================================================================
      // 0.0s = 0%, 5.0s = 62.5%, 8.0s = 100%
      const rawProgress = Math.min(100, (elapsed / 8.0) * 100);
      const easedProgress = Math.floor(rawProgress);

      if (easedProgress > lastReportedProgressRef.current) {
        lastReportedProgressRef.current = easedProgress;
        setProgress(easedProgress);
      }

      // =====================================================================
      // 2. TIMELINE PHASES & TYPOGRAPHY REVEAL
      // =====================================================================
      // Phase D begins at 5.0s: trigger letter-by-letter brand name reveal
      if (elapsed >= 5.0 && titlePhaseRef.current === 'hidden') {
        titlePhaseRef.current = 'revealing';
        setTitlePhase('revealing');
      }

      if (elapsed >= 5.0 && elapsed < 6.5) {
        // Between 5.0s and 6.5s, reveal letters progressively (14 characters total)
        const letterProgress = Math.min(1, Math.max(0, (elapsed - 5.0) / 1.5));
        const count = Math.min(BRAND_TITLE.length, Math.ceil(letterProgress * BRAND_TITLE.length));
        if (count !== revealedLettersRef.current) {
          revealedLettersRef.current = count;
          setRevealedLetters(count);
        }

        if (elapsed >= 5.8 && !showSubtitleRef.current) {
          showSubtitleRef.current = true;
          setShowSubtitle(true);
        }
      } else if (elapsed >= 6.5 && titlePhaseRef.current !== 'complete') {
        titlePhaseRef.current = 'complete';
        setTitlePhase('complete');
        revealedLettersRef.current = BRAND_TITLE.length;
        setRevealedLetters(BRAND_TITLE.length);
        if (!showSubtitleRef.current) {
          showSubtitleRef.current = true;
          setShowSubtitle(true);
        }
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

      // Center of Tree Emblem on canvas
      const centerX = width * 0.5;
      // Position slightly above vertical center to allow room for "The Golden Oak" title below
      const centerY = height * 0.38;

      // Base scale of tree emblem relative to viewport - Grand & Majestic (~50% larger)
      const minDim = Math.min(width, height);
      const emblemRadius = Math.max(220 * dpr, minDim * 0.33);

      // Light Sweep Wave parameter (travels upward through tree during Phase C: 3.8s to 5.0s)
      const sweepActive = elapsed >= 3.6 && elapsed <= 5.2;
      const sweepY = sweepActive ? 0.7 - ((elapsed - 3.6) / 1.6) * 1.5 : -999;

      // =====================================================================
      // 5. DRAW PARTICLES
      // =====================================================================
      const particles = particlesRef.current;
      const pLen = particles.length;

      for (let i = 0; i < pLen; i++) {
        const p = particles[i];

        // -------------------------------------------------------------------
        // Phase A (0.0s - 1.0s): Awakening & Scattered Gentle Drift
        // -------------------------------------------------------------------
        if (elapsed < 1.0) {
          // Particles softly appear with gentle Brownian floating
          const awakenT = Math.min(1, Math.max(0, elapsed / 0.8));
          const driftAngle = p.twinklePhase + elapsed * p.twinkleSpeed * 0.4;
          const driftDist = 18 * dpr * Math.sin(driftAngle);

          const currentScreenX = centerX + p.startX * emblemRadius * 1.6 + driftDist;
          const currentScreenY = centerY + p.startY * emblemRadius * 1.6 + driftDist * 0.5;

          const alpha = awakenT * p.baseAlpha * 0.65;
          if (alpha <= 0.01) continue;

          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(currentScreenX, currentScreenY, p.size * dpr * 0.85, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        // -------------------------------------------------------------------
        // Phase B & C (1.0s - 5.0s): Convergence toward Tree Silhouette
        // -------------------------------------------------------------------
        let flightT = 0;
        if (elapsed < p.activationTime) {
          // Still in scattered floating stage, drifting waiting for activation
          flightT = 0;
        } else {
          const rawFlight = (elapsed - p.activationTime) / p.duration;
          flightT = Math.min(1, Math.max(0, rawFlight));
        }

        // Apply smooth easeOutCubic deceleration as particles find their places
        const easedT = easeOutCubic(flightT);

        // Compute base resting target in screen coordinates
        const targetScreenX = centerX + p.targetX * emblemRadius;
        const targetScreenY = centerY + p.targetY * emblemRadius;

        const startScreenX = centerX + p.startX * emblemRadius * 1.8;
        const startScreenY = centerY + p.startY * emblemRadius * 1.8;

        // Curved arc path during convergence flight
        const arcAmount = (1 - easedT) * easedT * p.curveBias * 70 * dpr;
        let curX = startScreenX + (targetScreenX - startScreenX) * easedT - arcAmount * (p.targetY || 0.5);
        let curY = startScreenY + (targetScreenY - startScreenY) * easedT + arcAmount * (p.targetX || 0.5);

        // -------------------------------------------------------------------
        // Interactive Depth & Mouse Repulsion (After & during formation)
        // -------------------------------------------------------------------
        if (easedT > 0.4) {
          const depthMultiplier = p.layer === 'trunk' ? 0.35 : p.layer === 'root' ? 0.25 : 1.0;

          // Parallax depth shift based on normalized pointer
          const parallaxX = px * p.depth * 14 * dpr * depthMultiplier;
          const parallaxY = py * p.depth * 10 * dpr * depthMultiplier;

          curX += parallaxX * easedT;
          curY += parallaxY * easedT;

          // Subtle local cursor repulsion (within 85px radius)
          if (pointerTargetRef.current.active) {
            const cursorPixelX = centerX + px * (rectWidth * 0.4);
            const cursorPixelY = centerY + py * (rectHeight * 0.4);
            const dx = curX - cursorPixelX;
            const dy = curY - cursorPixelY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const repulsionRadius = 85 * dpr;

            if (dist < repulsionRadius && dist > 1) {
              const force = (1 - dist / repulsionRadius) * 22 * dpr * depthMultiplier;
              curX += (dx / dist) * force;
              curY += (dy / dist) * force;
            }
          }
        }

        // -------------------------------------------------------------------
        // Visual Styling, Twinkle & Golden Light Sweep
        // -------------------------------------------------------------------
        // Micro twinkle
        const twinkle = Math.sin(p.twinklePhase + elapsed * p.twinkleSpeed) * 0.18;
        let alpha = Math.min(1, Math.max(0.15, p.baseAlpha + twinkle));

        // Light Sweep Wave (intensifies particles when wave passes their Y level)
        if (sweepActive && easedT > 0.85) {
          const distToWave = Math.abs(p.targetY - sweepY);
          if (distToWave < 0.22) {
            const sweepIntensity = (1 - distToWave / 0.22) * 0.85;
            alpha = Math.min(1, alpha + sweepIntensity);
          }
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;

        // Render Particle Point
        ctx.beginPath();
        const curSize = (p.isHighlight ? p.size * 1.15 : p.size) * dpr;
        ctx.arc(curX, curY, curSize, 0, Math.PI * 2);
        ctx.fill();

        // Subtle soft gold glow aura for brighter highlight fragments
        if (p.isHighlight && easedT > 0.8) {
          ctx.globalAlpha = alpha * 0.25;
          ctx.beginPath();
          ctx.arc(curX, curY, curSize * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // =====================================================================
      // 6. RENDER FALLING GOLDEN LEAVES (Shed from Tree Canopy at Medium Speed)
      // =====================================================================
      if (elapsed >= 0.8) {
        const leafIntroFactor = Math.min(1, Math.max(0, (elapsed - 0.8) / 1.5));
        const leaves = leavesRef.current;
        const leafCount = leaves.length;
        const canopyMinY = centerY - emblemRadius * 0.52;
        const canopyMaxY = centerY + emblemRadius * 0.12;

        for (let i = 0; i < leafCount; i++) {
          const leaf = leaves[i];

          // Downward fall: medium speed (~1.3 - 2.15 px per frame scaled by dpr)
          leaf.y += leaf.speedY * dpr;

          // Horizontal sway (tumbling oscillation in the air breeze)
          leaf.swayPhase += leaf.swaySpeed;
          const swayOffset = Math.sin(leaf.swayPhase) * leaf.swayAmp * dpr;
          leaf.x += swayOffset;

          // Gentle rotation
          leaf.angle += leaf.rotSpeed;

          // Reset to tree canopy when falling past bottom or out of bounds
          if (leaf.y > height + 25 * dpr || leaf.x < -30 || leaf.x > width + 30) {
            leaf.x = centerX + (Math.random() - 0.5) * emblemRadius * 1.3;
            leaf.y = canopyMinY + Math.random() * (canopyMaxY - canopyMinY);
            leaf.speedY = 1.3 + Math.random() * 0.85;
            leaf.swayPhase = Math.random() * Math.PI * 2;
            leaf.angle = Math.random() * Math.PI * 2;
            leaf.rotSpeed = (Math.random() - 0.5) * 0.04;
          }

          // Draw delicate golden leaf shape
          const curLength = leaf.length * dpr;
          const curWidth = leaf.width * dpr;
          const shimmer = Math.sin(leaf.twinklePhase + elapsed * 3.0) * 0.15;
          const alpha = Math.max(0.2, Math.min(0.95, leaf.baseAlpha + shimmer)) * leafIntroFactor;

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

          // Fine golden central spine / vein
          ctx.beginPath();
          ctx.moveTo(0, -curLength * 0.8);
          ctx.lineTo(0, curLength * 0.8);
          ctx.strokeStyle = '#FFF6D6';
          ctx.globalAlpha = alpha * 0.55;
          ctx.lineWidth = Math.max(0.6, 0.75 * dpr);
          ctx.stroke();

          // Specular golden sparkle glint
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

      // Loop frame
      animFrameRef.current = requestAnimationFrame(render);
    };

    // Rect cache for mouse normalization
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

  // Support ESC keyboard shortcut for instant skip
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
      onPointerLeave={handlePointerLeave}
      className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden touch-none"
      style={{ backgroundColor: '#000000' }}
    >
      {/* 1. Main Canvas 2D Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-10" />

      {/* 2. Phase D Typography Reveal: "The Golden Oak" & "RESTAURANT & LOUNGE" */}
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center">
        {/* Spacer to align typography directly under the tree trunk base */}
        <div className="w-full h-auto mt-[310px] sm:mt-[340px] md:mt-[360px] flex flex-col items-center">
          {/* Brand Name with Letter-by-Letter Opacity & Upward Translation */}
          <div className="flex items-center justify-center tracking-tight">
            {BRAND_TITLE.split('').map((char, index) => {
              const isRevealed = titlePhase === 'complete' || index < revealedLetters;
              return (
                <span
                  key={index}
                  className="font-serif text-3xl sm:text-4xl md:text-[44px] font-bold text-[#F8F2E8] transition-all duration-500 ease-out inline-block"
                  style={{
                    opacity: isRevealed ? 1 : 0,
                    transform: isRevealed ? 'translateY(0)' : 'translateY(12px)',
                    color: isRevealed ? '#FAF5EC' : 'transparent',
                    textShadow: isRevealed ? '0 0 25px rgba(212,175,55,0.45)' : 'none',
                    marginRight: char === ' ' ? '0.35em' : '0.01em',
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </div>

          {/* Subtitle: "RESTAURANT & LOUNGE" */}
          <div
            className="text-[9px] sm:text-[10px] md:text-[11px] font-mono tracking-[0.34em] text-[#D4AF37] uppercase font-medium mt-2 transition-all duration-700 ease-out"
            style={{
              opacity: showSubtitle ? 0.95 : 0,
              transform: showSubtitle ? 'translateY(0)' : 'translateY(6px)',
              letterSpacing: showSubtitle ? '0.34em' : '0.20em',
            }}
          >
            {SUBTITLE}
          </div>
        </div>
      </div>

      {/* 3. Understated Monotonic Percentage Progress Counter (0% to 100%) */}
      <div className="absolute bottom-8 sm:bottom-10 z-30 pointer-events-none flex flex-col items-center gap-1.5">
        <span className="font-mono text-[11px] sm:text-xs font-semibold text-[#D4AF37]/80 tracking-widest tabular-nums">
          {String(progress).padStart(2, '0')}%
        </span>
        {/* Restrained subtle 1px gold progress rule */}
        <div className="w-24 h-[1px] bg-white/[0.08] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#9C6B18] via-[#D4AF37] to-[#F7D98B] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 4. Minimalist Elegant Skip Option (Allows immediate skip anytime without trapped feeling) */}
      <button
        type="button"
        onClick={() => {
          if (onComplete) onComplete();
        }}
        className="absolute top-6 right-6 sm:top-8 sm:right-8 z-40 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono tracking-widest text-[#D4AF37]/50 hover:text-[#D4AF37] border border-white/[0.06] hover:border-[#D4AF37]/40 bg-black/40 hover:bg-black/70 backdrop-blur-md transition-all cursor-pointer pointer-events-auto select-none"
        title="Skip intro animation (Esc)"
        aria-label="Skip intro animation"
      >
        SKIP [ESC]
      </button>
    </div>
  );
}
