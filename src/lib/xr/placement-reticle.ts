/**
 * THE GOLDEN OAK — AR TABLETOP PLACEMENT RETICLE
 * Sub-Agent 2 (Table Placement & Dimension Engineer)
 *
 * Implements a luxury, restaurant-grade circular reticle sized in METRES (~0.10–0.12m radius)
 * for WebXR hit-test table placement.
 *
 * Aesthetic guidelines:
 * - Minimal, elegant gold (#c9a84c / #f0c36b) matching The Golden Oak brand.
 * - Sized in metres: radius ~0.11m (diameter ~22cm, typical table plate footprint).
 * - Subtle animated pulse/rotation during scanning; steady crisp gold on surface detection.
 * - No neon or arcade effects.
 * - depthWrite: false, transparent: true, renderOrder: 999 to prevent Z-fighting with table planes.
 * - Clean lifecycle disposal for WebGL resources.
 */

import * as THREE from 'three';

export type PlacementReticleState = 'scanning' | 'surface-detected' | 'hidden';

export interface PlacementReticle {
  object: THREE.Object3D;
  setState(state: PlacementReticleState): void;
  update(dtSeconds: number): void;
  dispose(): void;
}

export const RETICLE_CONFIG = {
  innerRadiusM: 0.095,
  mainRadiusM: 0.105,
  outerRadiusM: 0.120,
  outerThicknessM: 0.003,
  centerDotRadiusM: 0.008,
  primaryGold: 0xc9a84c,
  brightGold: 0xf0c36b,
  scanningGold: 0x9b7b32,
  pulseSpeedRadPerSec: 2.8,
  rotationSpeedRadPerSec: 0.5,
  surfaceElevationM: 0.001, // 1mm elevation above hit plane to prevent z-fighting
} as const;

export function createPlacementReticle(): PlacementReticle {
  const root = new THREE.Group();
  root.name = 'xr-placement-reticle';
  root.visible = false;

  // Orient flat on horizontal tabletop (+Y is up in canonical world units)
  root.rotation.x = -Math.PI / 2;
  root.position.y = RETICLE_CONFIG.surfaceElevationM;

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // 1. Main Primary Ring (~0.10m radius)
  const mainRingGeo = new THREE.RingGeometry(
    RETICLE_CONFIG.innerRadiusM,
    RETICLE_CONFIG.mainRadiusM,
    64
  );
  geometries.push(mainRingGeo);

  const mainRingMat = new THREE.MeshBasicMaterial({
    color: RETICLE_CONFIG.primaryGold,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  materials.push(mainRingMat);

  const mainRingMesh = new THREE.Mesh(mainRingGeo, mainRingMat);
  mainRingMesh.renderOrder = 999;
  root.add(mainRingMesh);

  // 2. Outer Accent Ring (~0.12m radius, delicate gold outline)
  const outerRingGeo = new THREE.RingGeometry(
    RETICLE_CONFIG.outerRadiusM - RETICLE_CONFIG.outerThicknessM,
    RETICLE_CONFIG.outerRadiusM,
    64
  );
  geometries.push(outerRingGeo);

  const outerRingMat = new THREE.MeshBasicMaterial({
    color: RETICLE_CONFIG.brightGold,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  materials.push(outerRingMat);

  const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRingMesh.renderOrder = 999;
  root.add(outerRingMesh);

  // 3. Center Target Dot
  const centerDotGeo = new THREE.CircleGeometry(
    RETICLE_CONFIG.centerDotRadiusM,
    32
  );
  geometries.push(centerDotGeo);

  const centerDotMat = new THREE.MeshBasicMaterial({
    color: RETICLE_CONFIG.brightGold,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  materials.push(centerDotMat);

  const centerDotMesh = new THREE.Mesh(centerDotGeo, centerDotMat);
  centerDotMesh.renderOrder = 999;
  root.add(centerDotMesh);

  // 4. Subtle 4-Quadrant Accent Ticks (classic fine dining aesthetic)
  const tickGeo = new THREE.PlaneGeometry(0.002, 0.015);
  geometries.push(tickGeo);
  const tickMat = new THREE.MeshBasicMaterial({
    color: RETICLE_CONFIG.brightGold,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  materials.push(tickMat);

  const tickPositions = [
    { x: 0, y: RETICLE_CONFIG.outerRadiusM + 0.008, rot: 0 },
    { x: 0, y: -(RETICLE_CONFIG.outerRadiusM + 0.008), rot: 0 },
    { x: RETICLE_CONFIG.outerRadiusM + 0.008, y: 0, rot: Math.PI / 2 },
    { x: -(RETICLE_CONFIG.outerRadiusM + 0.008), y: 0, rot: Math.PI / 2 },
  ];

  const ticksGroup = new THREE.Group();
  ticksGroup.name = 'reticle-ticks';
  tickPositions.forEach((pos) => {
    const tick = new THREE.Mesh(tickGeo, tickMat);
    tick.position.set(pos.x, pos.y, 0);
    tick.rotation.z = pos.rot;
    tick.renderOrder = 999;
    ticksGroup.add(tick);
  });
  root.add(ticksGroup);

  // Animation & state tracking
  let currentState: PlacementReticleState = 'hidden';
  let elapsedTime = 0;

  function setState(state: PlacementReticleState): void {
    currentState = state;
    if (state === 'hidden') {
      root.visible = false;
      return;
    }

    root.visible = true;

    if (state === 'surface-detected') {
      // Solid, stable, bright gold locked-in appearance
      mainRingMat.color.setHex(RETICLE_CONFIG.brightGold);
      mainRingMat.opacity = 0.95;
      outerRingMat.color.setHex(RETICLE_CONFIG.primaryGold);
      outerRingMat.opacity = 0.7;
      centerDotMat.opacity = 1.0;
      tickMat.opacity = 0.85;
      root.scale.set(1, 1, 1);
    } else if (state === 'scanning') {
      // Subdued searching state
      mainRingMat.color.setHex(RETICLE_CONFIG.scanningGold);
      mainRingMat.opacity = 0.45;
      outerRingMat.color.setHex(RETICLE_CONFIG.primaryGold);
      outerRingMat.opacity = 0.3;
      centerDotMat.opacity = 0.6;
      tickMat.opacity = 0.4;
    }
  }

  function update(dtSeconds: number): void {
    if (currentState === 'hidden' || !root.visible) {
      return;
    }

    const dt = Number.isFinite(dtSeconds) ? Math.max(0, Math.min(0.1, dtSeconds)) : 0.016;
    elapsedTime += dt;

    if (currentState === 'scanning') {
      // Gentle breathing pulse
      const pulse = Math.sin(elapsedTime * RETICLE_CONFIG.pulseSpeedRadPerSec);
      const scaleMultiplier = 1.0 + pulse * 0.04;
      root.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);

      // Smooth subtle opacity breathing
      mainRingMat.opacity = 0.35 + (pulse + 1) * 0.15;
      outerRingMat.opacity = 0.2 + (pulse + 1) * 0.1;

      // Slow rotational scanning drift
      ticksGroup.rotation.z = elapsedTime * RETICLE_CONFIG.rotationSpeedRadPerSec;
    } else if (currentState === 'surface-detected') {
      // Very slight high-frequency micro-sheen on the ticks
      ticksGroup.rotation.z = 0;
      root.scale.set(1, 1, 1);
    }
  }

  function dispose(): void {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    root.clear();
  }

  return {
    object: root,
    setState,
    update,
    dispose,
  };
}
