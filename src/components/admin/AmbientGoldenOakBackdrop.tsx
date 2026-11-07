'use client';

import React, { useEffect, useRef } from 'react';
import { generateOakParticleMap, OakParticle, GOLD_PALETTE } from '@/components/preloader/oakTreeParticleMap';

interface EmittedFragment {
  // Current screen position
  x: number;
  y: number;
  // Velocity
  vx: number;
  vy: number;
  // Physical leaf / ember size
  length: number;
  width: number;
  // Rotation
  angle: number;
  rotSpeed: number;
  // Sway physics
  swayAmp: number;
  swaySpeed: number;
  swayPhase: number;
  // Appearance
  color: string;
  type: 'leaf' | 'ember';
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
  scale: number;
}

const FRAGMENT_COLORS = [
  '#FFF9E8', // warm white gold
  '#F7D98B', // highlight gold
  '#E5C158', // champagne gold
  '#D4AF37', // metallic gold
  '#F5C869', // bright amber gold
  '#C59A30', // deep gold
];

export function AmbientGoldenOakBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);

    // 1. Generate the EXACT SAME calibrated Golden Oak tree particles from preloader
    const treeParticles: OakParticle[] = generateOakParticleMap(2200);

    // Filter canopy and branch particles as spawn points for emitted fragments
    const canopySpawnNodes = treeParticles.filter(
      (p) => p.layer === 'canopy' || p.layer === 'branch' || p.layer === 'apex'
    );

    // 2. Continuous Emitted Fragments (Leaves + Glowing Embers shedding from the tree)
    const MAX_FRAGMENTS = 70;
    const fragments: EmittedFragment[] = [];

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    // Helper: spawn a fragment directly from a node on the tree
    const spawnFragment = (f?: EmittedFragment): EmittedFragment => {
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const centerX = width * 0.52;
      const centerY = height * 0.48;
      const treeRadius = Math.min(width, height) * 0.42;

      // Pick a random node from the tree's canopy / branches
      const node = canopySpawnNodes[Math.floor(Math.random() * canopySpawnNodes.length)] || treeParticles[0];
      const startX = centerX + node.targetX * treeRadius;
      const startY = centerY + node.targetY * treeRadius;

      // Outward burst velocity away from tree center + upward wind
      const angleFromCenter = Math.atan2(startY - centerY, startX - centerX);
      const speed = 0.4 + Math.random() * 0.8;
      const isEmber = Math.random() < 0.35; // 35% glowing embers, 65% fluttering leaves

      const item: EmittedFragment = f || {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        length: 0,
        width: 0,
        angle: 0,
        rotSpeed: 0,
        swayAmp: 0,
        swaySpeed: 0,
        swayPhase: 0,
        color: '',
        type: 'leaf',
        alpha: 0,
        maxAlpha: 0.8,
        life: 0,
        maxLife: 5,
        scale: 1,
      };

      item.x = startX;
      item.y = startY;
      item.type = isEmber ? 'ember' : 'leaf';
      item.vx = Math.cos(angleFromCenter) * speed + (Math.random() - 0.5) * 0.4;
      item.vy = isEmber
        ? -0.6 - Math.random() * 0.8 // Embers drift gracefully upward
        : Math.sin(angleFromCenter) * 0.3 + 0.3 + Math.random() * 0.5; // Leaves flutter downward & outward
      item.length = isEmber ? 1.5 + Math.random() * 1.5 : 4.0 + Math.random() * 4.5;
      item.width = isEmber ? item.length : 1.8 + Math.random() * 2.0;
      item.angle = Math.random() * Math.PI * 2;
      item.rotSpeed = (Math.random() - 0.5) * 0.04;
      item.swayAmp = 0.8 + Math.random() * 1.5;
      item.swaySpeed = 0.015 + Math.random() * 0.02;
      item.swayPhase = Math.random() * Math.PI * 2;
      item.color = FRAGMENT_COLORS[Math.floor(Math.random() * FRAGMENT_COLORS.length)];
      item.alpha = 0;
      item.maxAlpha = isEmber ? 0.65 + Math.random() * 0.35 : 0.45 + Math.random() * 0.45;
      item.life = 0;
      item.maxLife = 3.5 + Math.random() * 4.0;
      item.scale = 0.6 + Math.random() * 0.6;

      return item;
    };

    // Stagger initialize fragments
    for (let i = 0; i < MAX_FRAGMENTS; i++) {
      const frag = spawnFragment();
      // Pre-warm life so they appear staggered across the screen on load
      frag.life = Math.random() * frag.maxLife;
      frag.x += frag.vx * frag.life * 40;
      frag.y += frag.vy * frag.life * 40;
      fragments.push(frag);
    }

    const startTime = performance.now();

    // RENDER LOOP (60/120 FPS)
    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const centerX = width * 0.52;
      const centerY = height * 0.48;
      const treeRadius = Math.min(width, height) * 0.42;

      // =======================================================================
      // 1. RENDER THE PRELOADER GOLDEN OAK TREE (With Wind & Shimmer Animation)
      // =======================================================================
      const pLen = treeParticles.length;
      for (let i = 0; i < pLen; i++) {
        const p = treeParticles[i];

        // Natural sway / breathing in the wind
        const windX = Math.sin(elapsed * 0.9 + p.targetY * 3.5) * (p.layer === 'canopy' || p.layer === 'apex' ? 2.8 : 0.8);
        const windY = Math.cos(elapsed * 0.7 + p.targetX * 2.0) * 0.9;

        const screenX = (centerX + p.targetX * treeRadius + windX) * dpr;
        const screenY = (centerY + p.targetY * treeRadius + windY) * dpr;

        // Twinkle and pulse
        const twinkle = Math.sin(p.twinklePhase + elapsed * p.twinkleSpeed) * 0.18;
        const alpha = Math.min(0.85, Math.max(0.15, (p.baseAlpha * 0.7) + twinkle));

        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        const pSize = p.isHighlight ? p.size * 1.25 : p.size;
        ctx.arc(screenX, screenY, pSize * dpr * 0.85, 0, Math.PI * 2);
        ctx.fill();
      }

      // =======================================================================
      // 2. RENDER EMITTED FRAGMENTS SHEDDING FROM THE TREE ("Fragments nikal rahe hain")
      // =======================================================================
      for (let i = 0; i < MAX_FRAGMENTS; i++) {
        const f = fragments[i];
        f.life += 0.016; // approx 60fps delta

        // Respawn if lifetime ended or scrolled far outside screen
        if (f.life >= f.maxLife || f.y > height + 60 || f.y < -60 || f.x < -60 || f.x > width + 60) {
          spawnFragment(f);
          continue;
        }

        // Physics movement: velocity + sinusoidal wind sway
        f.x += f.vx + Math.sin(f.swayPhase + elapsed * f.swaySpeed * 60) * f.swayAmp * 0.2;
        f.y += f.vy;
        f.angle += f.rotSpeed;

        // Life fade in and fade out curve
        const progress = f.life / f.maxLife;
        let fade = 1;
        if (progress < 0.15) {
          fade = progress / 0.15; // smooth birth
        } else if (progress > 0.7) {
          fade = (1 - progress) / 0.3; // gentle dissipation
        }
        const currentAlpha = Math.max(0, Math.min(1, f.maxAlpha * fade));

        const sx = f.x * dpr;
        const sy = f.y * dpr;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(f.angle);
        ctx.globalAlpha = currentAlpha;
        ctx.fillStyle = f.color;

        if (f.type === 'leaf') {
          // Elongated fluttering Golden Oak leaf flake
          ctx.beginPath();
          ctx.ellipse(0, 0, (f.width * dpr * f.scale) / 2, (f.length * dpr * f.scale) / 2, 0, 0, Math.PI * 2);
          ctx.fill();

          // Delicate leaf central spine line
          ctx.strokeStyle = '#FFF8E7';
          ctx.lineWidth = 0.5 * dpr;
          ctx.beginPath();
          ctx.moveTo(0, -(f.length * dpr * f.scale) / 2.5);
          ctx.lineTo(0, (f.length * dpr * f.scale) / 2.5);
          ctx.stroke();
        } else {
          // Radiant Golden Ember Sparkle with soft aura
          ctx.beginPath();
          ctx.arc(0, 0, f.length * dpr * f.scale, 0, Math.PI * 2);
          ctx.fill();

          // Outer shimmer ring
          ctx.strokeStyle = f.color;
          ctx.lineWidth = 0.6 * dpr;
          ctx.globalAlpha = currentAlpha * 0.45;
          ctx.beginPath();
          ctx.arc(0, 0, f.length * dpr * f.scale * 1.8, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none -z-15 w-full h-full"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
