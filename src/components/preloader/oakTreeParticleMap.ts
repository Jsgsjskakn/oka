/**
 * The Golden Oak — Cinematic Particle Tree Geometry & Coordinate Sampler
 *
 * Deterministically samples and calibrates particle positions for the majestic
 * Golden Oak emblem: spreading roots, solid trunk, branching limbs, and dense
 * hemispherical foliage canopy dome.
 */

export interface OakParticle {
  // Target position in emblem space (-1.0 to 1.0)
  targetX: number;
  targetY: number;

  // Initial scattered position in normalized viewport space (-1.5 to 1.5)
  startX: number;
  startY: number;

  // Visual appearance
  size: number;
  color: string;
  baseAlpha: number;
  depth: number; // -1 (background/inner) to 1 (foreground/outer)

  // Motion & timeline parameters
  layer: 'root' | 'trunk' | 'branch' | 'canopy' | 'apex';
  activationTime: number; // Time in seconds when particle begins converging
  duration: number; // Duration of convergence travel in seconds
  curveBias: number; // Perpendicular arc offset during flight (-1 to 1)

  // Micro-shimmer / Twinkle
  twinkleSpeed: number;
  twinklePhase: number;
  isHighlight: boolean;
}

// Curated Luxury Gold Palette
export const GOLD_PALETTE = {
  pureBlack: '#000000',
  metallicGold: '#D4AF37',
  highlightGold: '#F7D98B',
  deepAmber: '#9C6B18',
  warmWhite: '#FFF9E8',
  champagne: '#E5C158',
};

// Seeded pseudo-random number generator for 100% deterministic formation
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Generates the calibrated particle map for The Golden Oak tree emblem.
 * @param count Nominal particle count (calibrated between 800 and 1200 depending on screen)
 */
export function generateOakParticleMap(count = 950): OakParticle[] {
  const rng = createRng(1729); // Deterministic seed
  const particles: OakParticle[] = [];

  // Helper to add particle
  const addParticle = (
    tx: number,
    ty: number,
    layer: 'root' | 'trunk' | 'branch' | 'canopy' | 'apex',
    options?: {
      size?: number;
      depth?: number;
      color?: string;
      activationTime?: number;
      duration?: number;
      isHighlight?: boolean;
    }
  ) => {
    // Generate scattered initial awakening position outside or around the center
    const angle = rng() * Math.PI * 2;
    const distance = 0.5 + rng() * 1.1; // Scattered in wide circle
    const startX = Math.cos(angle) * distance;
    const startY = Math.sin(angle) * distance;

    const isHighlight = options?.isHighlight ?? rng() < 0.14;
    const depth = options?.depth ?? (rng() * 2 - 1);

    // Pick luxury gold color
    let color = options?.color;
    if (!color) {
      if (isHighlight) {
        color = rng() < 0.4 ? GOLD_PALETTE.warmWhite : GOLD_PALETTE.highlightGold;
      } else if (layer === 'trunk' || layer === 'root') {
        color = rng() < 0.35 ? GOLD_PALETTE.deepAmber : GOLD_PALETTE.metallicGold;
      } else {
        const roll = rng();
        color =
          roll < 0.45
            ? GOLD_PALETTE.metallicGold
            : roll < 0.8
              ? GOLD_PALETTE.champagne
              : GOLD_PALETTE.highlightGold;
      }
    }

    // Phase B (1.0s to 3.0s) & Phase C (3.0s to 5.0s) timeline scheduling
    let actTime = options?.activationTime;
    let dur = options?.duration ?? 1.8 + rng() * 0.8;

    if (actTime === undefined) {
      if (layer === 'root') {
        actTime = 0.9 + rng() * 0.7; // 0.9s - 1.6s
      } else if (layer === 'trunk') {
        actTime = 1.0 + rng() * 0.8; // 1.0s - 1.8s
      } else if (layer === 'branch') {
        actTime = 1.6 + rng() * 1.0; // 1.6s - 2.6s
      } else if (layer === 'canopy') {
        actTime = 2.2 + rng() * 1.3; // 2.2s - 3.5s
      } else {
        actTime = 2.8 + rng() * 1.1; // 2.8s - 3.9s (Apex)
      }
    }

    particles.push({
      targetX: tx,
      targetY: ty,
      startX,
      startY,
      size: options?.size ?? (isHighlight ? 2.4 + rng() * 1.2 : 1.3 + rng() * 1.1),
      color,
      baseAlpha: 0.75 + rng() * 0.25,
      depth,
      layer,
      activationTime: actTime,
      duration: dur,
      curveBias: (rng() - 0.5) * 1.4,
      twinkleSpeed: 2.0 + rng() * 4.0,
      twinklePhase: rng() * Math.PI * 2,
      isHighlight,
    });
  };

  // 1. TRUNK PARTICLES (~160 particles)
  // Forms a tapering, textured core from y = 0.32 down to y = -0.15
  const trunkCount = Math.floor(count * 0.17);
  for (let i = 0; i < trunkCount; i++) {
    const t = i / trunkCount;
    const y = 0.32 - t * 0.47; // 0.32 down to -0.15
    // Tapering width from 0.09 at base to 0.045 at branch split
    const widthAtY = (0.09 - t * 0.045) * (0.8 + rng() * 0.4);
    const x = (rng() - 0.5) * widthAtY * 2;
    addParticle(x, y, 'trunk', {
      depth: (rng() - 0.5) * 0.6,
      size: 1.8 + rng() * 1.2,
      activationTime: 1.0 + t * 0.8,
    });
  }

  // 2. ROOT NETWORK PARTICLES (~140 particles)
  // 6 Primary lateral root arches radiating downward and outward
  const rootCount = Math.floor(count * 0.15);
  const rootArches = [
    { startX: -0.04, startY: 0.32, endX: -0.42, endY: 0.58, cpX: -0.22, cpY: 0.44 },
    { startX: -0.02, startY: 0.33, endX: -0.24, endY: 0.62, cpX: -0.14, cpY: 0.48 },
    { startX: 0.0, startY: 0.34, endX: -0.06, endY: 0.64, cpX: -0.04, cpY: 0.50 },
    { startX: 0.0, startY: 0.34, endX: 0.06, endY: 0.64, cpX: 0.04, cpY: 0.50 },
    { startX: 0.02, startY: 0.33, endX: 0.24, endY: 0.62, cpX: 0.14, cpY: 0.48 },
    { startX: 0.04, startY: 0.32, endX: 0.42, endY: 0.58, cpX: 0.22, cpY: 0.44 },
  ];

  for (let i = 0; i < rootCount; i++) {
    const arch = rootArches[i % rootArches.length];
    const u = rng();
    // Quadratic bezier point: (1-u)^2 * P0 + 2*(1-u)*u * P1 + u^2 * P2
    const bx =
      Math.pow(1 - u, 2) * arch.startX +
      2 * (1 - u) * u * arch.cpX +
      Math.pow(u, 2) * arch.endX;
    const by =
      Math.pow(1 - u, 2) * arch.startY +
      2 * (1 - u) * u * arch.cpY +
      Math.pow(u, 2) * arch.endY;

    // Slight organic scatter around root spline
    const jitter = (1 - u) * 0.018 + 0.006;
    const x = bx + (rng() - 0.5) * jitter;
    const y = by + (rng() - 0.5) * jitter;

    addParticle(x, y, 'root', {
      depth: (rng() - 0.5) * 0.8,
      size: 1.5 + (1 - u) * 1.5,
      activationTime: 0.9 + u * 0.7,
    });
  }

  // 3. MAIN BRANCH BOUGHS (~180 particles)
  // Splaying outward and upward from trunk split
  const branchCount = Math.floor(count * 0.19);
  const branchBoughs = [
    // Left Lower Bough
    { startX: -0.03, startY: -0.1, endX: -0.46, endY: -0.22, cpX: -0.26, cpY: -0.06 },
    // Left Mid Bough
    { startX: -0.02, startY: -0.14, endX: -0.38, endY: -0.42, cpX: -0.24, cpY: -0.28 },
    // Left High Bough
    { startX: -0.01, startY: -0.16, endX: -0.18, endY: -0.54, cpX: -0.12, cpY: -0.36 },
    // Right High Bough
    { startX: 0.01, startY: -0.16, endX: 0.18, endY: -0.54, cpX: 0.12, cpY: -0.36 },
    // Right Mid Bough
    { startX: 0.02, startY: -0.14, endX: 0.38, endY: -0.42, cpX: 0.24, cpY: -0.28 },
    // Right Lower Bough
    { startX: 0.03, startY: -0.1, endX: 0.46, endY: -0.22, cpX: 0.26, cpY: -0.06 },
    // Secondary Twigs
    { startX: -0.26, startY: -0.06, endX: -0.48, endY: -0.06, cpX: -0.38, cpY: -0.02 },
    { startX: 0.26, startY: -0.06, endX: 0.48, endY: -0.06, cpX: 0.38, cpY: -0.02 },
    { startX: -0.24, startY: -0.28, endX: -0.32, endY: -0.24, cpX: -0.28, cpY: -0.22 },
    { startX: 0.24, startY: -0.28, endX: 0.32, endY: -0.24, cpX: 0.28, cpY: -0.22 },
  ];

  for (let i = 0; i < branchCount; i++) {
    const bough = branchBoughs[i % branchBoughs.length];
    const u = rng();
    const bx =
      Math.pow(1 - u, 2) * bough.startX +
      2 * (1 - u) * u * bough.cpX +
      Math.pow(u, 2) * bough.endX;
    const by =
      Math.pow(1 - u, 2) * bough.startY +
      2 * (1 - u) * u * bough.cpY +
      Math.pow(u, 2) * bough.endY;

    const jitter = (1 - u) * 0.016 + 0.005;
    const x = bx + (rng() - 0.5) * jitter;
    const y = by + (rng() - 0.5) * jitter;

    addParticle(x, y, 'branch', {
      depth: (rng() - 0.5) * 0.9,
      size: 1.4 + (1 - u) * 1.3,
      activationTime: 1.6 + u * 1.0,
    });
  }

  // 4. CANOPY FOLIAGE CLUSTERS (~470 particles)
  // Forms the grand, symmetrical, dense oak leaf crown
  const canopyCount = count - particles.length;
  // Foliage cluster centers matching reference oak crown
  const foliageCenters = [
    // Top Central Apex
    { x: 0.0, y: -0.62, radiusX: 0.22, radiusY: 0.16, weight: 1.2, isApex: true },
    // High Left Dome
    { x: -0.24, y: -0.56, radiusX: 0.24, radiusY: 0.18, weight: 1.0 },
    // High Right Dome
    { x: 0.24, y: -0.56, radiusX: 0.24, radiusY: 0.18, weight: 1.0 },
    // Upper Outer Left
    { x: -0.44, y: -0.42, radiusX: 0.22, radiusY: 0.18, weight: 0.9 },
    // Upper Outer Right
    { x: 0.44, y: -0.42, radiusX: 0.22, radiusY: 0.18, weight: 0.9 },
    // Mid Flank Left
    { x: -0.52, y: -0.24, radiusX: 0.20, radiusY: 0.16, weight: 0.8 },
    // Mid Flank Right
    { x: 0.52, y: -0.24, radiusX: 0.20, radiusY: 0.16, weight: 0.8 },
    // Low Flank Left
    { x: -0.46, y: -0.06, radiusX: 0.18, radiusY: 0.14, weight: 0.7 },
    // Low Flank Right
    { x: 0.46, y: -0.06, radiusX: 0.18, radiusY: 0.14, weight: 0.7 },
    // Inner Canopy Fill (behind upper trunk and primary joints)
    { x: 0.0, y: -0.42, radiusX: 0.28, radiusY: 0.20, weight: 1.1 },
    { x: -0.16, y: -0.32, radiusX: 0.22, radiusY: 0.16, weight: 0.85 },
    { x: 0.16, y: -0.32, radiusX: 0.22, radiusY: 0.16, weight: 0.85 },
  ];

  for (let i = 0; i < canopyCount; i++) {
    const center = foliageCenters[i % foliageCenters.length];
    // Radial distribution within cluster ellipse
    const r = Math.sqrt(rng()); // Uniform 2D circle sampling
    const theta = rng() * Math.PI * 2;
    const x = center.x + Math.cos(theta) * r * center.radiusX;
    const y = center.y + Math.sin(theta) * r * center.radiusY;

    // Outer edge particles are slightly smaller and more translucent for natural leaf falloff
    const isEdge = r > 0.75;
    const layer = center.isApex ? 'apex' : 'canopy';

    addParticle(x, y, layer, {
      depth: (rng() - 0.5) * 1.8,
      size: isEdge ? 1.2 + rng() * 1.0 : 1.6 + rng() * 1.4,
      isHighlight: rng() < 0.18,
      activationTime: 2.2 + rng() * 1.6,
      duration: 1.6 + rng() * 0.9,
    });
  }

  return particles;
}
