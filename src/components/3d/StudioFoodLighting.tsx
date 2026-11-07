'use client';

import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { SafeContactShadows } from './SafeContactShadows';
import { type FoodRenderProfile, resolveFoodRenderProfile } from '@/lib/three/food-materials';

export type StudioLightingMode = 'viewer' | 'ar' | 'pedestal';

/**
 * Strictly local optimized HDR path (479 KB vs 1.84 MB legacy HDR).
 * Only ever loaded on `high-fidelity` when `useLocalHdrOnHighFidelity` is explicitly true.
 */
export const LOCAL_OPTIMIZED_HDR_PATH = '/textures/forest_env.optimized.hdr';

export interface StudioFoodLightingProps {
  profile: FoodRenderProfile;
  mode?: StudioLightingMode;
  /** Controls real-time directional shadow map casting on `high-fidelity` */
  shadowsEnabled?: boolean;
  /** Explicit override for contact/directional shadow resolution */
  shadowResolution?: number;
  /** Incrementing key to re-bake single-frame `SafeContactShadows` on demand */
  shadowRefreshKey?: number | string;
  /** Dynamic real-world camera luminance estimate (clamped to [0.3, 1.4]) for `mode="ar"` */
  ambientLuma?: number;
  /** Optional opt-in to load local `/textures/forest_env.optimized.hdr` on `high-fidelity` (default false = 0 KB `RoomEnvironment`) */
  useLocalHdrOnHighFidelity?: boolean;
  /** Ground plane vertical offset override */
  groundY?: number;
  /** Ground shadow diameter / scale override */
  groundScale?: number;
  /** Whether ground shadow (decal or baked contact shadow) is rendered (default true) */
  enableGroundShadow?: boolean;
}

export interface StudioLightingBudget {
  profile: FoodRenderProfile;
  mode: StudioLightingMode;
  activeLightCount: number;
  iblSource: 'none' | 'room-environment' | 'local-optimized-hdr';
  environmentIntensity: number;
  shadowStrategy: 'none' | 'radial-decal' | 'baked-contact-fast' | 'baked-contact-smooth';
  contactShadowResolution: number;
  contactShadowSmooth: boolean;
  directionalCastShadow: boolean;
  directionalShadowMapSize: number;
  clampedAmbientLuma: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Pure deterministic calculator for the active light, IBL, and shadow budget.
 * Eliminates the legacy 6-light + 1024px multi-pass shadow bottleneck on mobile GPUs.
 */
export function resolveStudioLightingBudget(
  props: Pick<
    StudioFoodLightingProps,
    | 'profile'
    | 'mode'
    | 'shadowsEnabled'
    | 'shadowResolution'
    | 'ambientLuma'
    | 'useLocalHdrOnHighFidelity'
    | 'enableGroundShadow'
  >,
  isMobileViewport: boolean = false
): StudioLightingBudget {
  const profile = resolveFoodRenderProfile(props.profile);
  const mode = props.mode ?? 'viewer';
  const enableGroundShadow = props.enableGroundShadow ?? true;
  const clampedAmbientLuma = Number(clamp(props.ambientLuma ?? 0.85, 0.3, 1.4).toFixed(3));

  // Real-world AR mode: dynamic ambientLuma matching, zero static studio IBL tint, 1-draw-call decal
  if (mode === 'ar') {
    return {
      profile,
      mode,
      activeLightCount: 2, // 1 hemisphere + 1 key directional
      iblSource: 'none',
      environmentIntensity: 0,
      shadowStrategy: enableGroundShadow ? 'radial-decal' : 'none',
      contactShadowResolution: 0,
      contactShadowSmooth: false,
      directionalCastShadow: false,
      directionalShadowMapSize: 0,
      clampedAmbientLuma,
    };
  }

  // Ultra-light tier (2GB phones): 2 lights, 0 FBO shadow passes, 1-draw-call radial shadow decal
  if (profile === 'ultra-light') {
    return {
      profile,
      mode,
      activeLightCount: 2, // 1 warm hemisphere + 1 key directional
      iblSource: 'none',
      environmentIntensity: 0,
      shadowStrategy: enableGroundShadow ? 'radial-decal' : 'none',
      contactShadowResolution: 0,
      contactShadowSmooth: false,
      directionalCastShadow: false,
      directionalShadowMapSize: 0,
      clampedAmbientLuma,
    };
  }

  // Balanced tier (4–6GB mid-range phones): 3 lights + 0 KB RoomEnvironment + 1-frame non-smooth ContactShadows
  if (profile === 'balanced') {
    const res = props.shadowResolution ?? (isMobileViewport ? 256 : 512);
    return {
      profile,
      mode,
      activeLightCount: 3, // hemisphere + warm key + golden rim
      iblSource: 'room-environment',
      environmentIntensity: mode === 'pedestal' ? 0.68 : 0.75,
      shadowStrategy: enableGroundShadow ? 'baked-contact-fast' : 'none',
      contactShadowResolution: clamp(res, 128, 512),
      contactShadowSmooth: false,
      directionalCastShadow: false,
      directionalShadowMapSize: 0,
      clampedAmbientLuma,
    };
  }

  // High-fidelity tier (8GB+ flagship & desktop): 4 lights + RoomEnvironment (or opt-in local 468KB HDR) + smooth ContactShadows
  const defaultHiRes = isMobileViewport ? 512 : 1024;
  const hiRes = clamp(props.shadowResolution ?? defaultHiRes, 256, 1024);
  const castDirShadow = Boolean(props.shadowsEnabled);

  return {
    profile,
    mode,
    activeLightCount: 4, // hemisphere + key + warm fill + golden rim
    iblSource: props.useLocalHdrOnHighFidelity ? 'local-optimized-hdr' : 'room-environment',
    environmentIntensity: mode === 'pedestal' ? 0.78 : 0.88,
    shadowStrategy: enableGroundShadow ? 'baked-contact-smooth' : 'none',
    contactShadowResolution: hiRes,
    contactShadowSmooth: true,
    directionalCastShadow: castDirShadow,
    directionalShadowMapSize: castDirShadow ? hiRes : 0,
    clampedAmbientLuma,
  };
}

/**
 * Generates a tiny 64x64 (16 KB) soft Gaussian radial shadow `DataTexture`.
 * Zero network fetches, zero DOM `<canvas>` dependencies, 1 draw call on GPU.
 */
export function createRadialShadowTexture(
  resolution: number = 64,
  umbraHex: string = '#1A1109'
): THREE.DataTexture {
  const size = Math.max(16, resolution);
  const data = new Uint8Array(size * size * 4);
  const umbra = new THREE.Color(umbraHex);
  const rByte = Math.round(umbra.r * 255);
  const gByte = Math.round(umbra.g * 255);
  const bByte = Math.round(umbra.b * 255);

  const half = (size - 1) / 2;

  for (let y = 0; y < size; y++) {
    const ny = (y - half) / half;
    for (let x = 0; x < size; x++) {
      const nx = (x - half) / half;
      const distSq = nx * nx + ny * ny;
      const falloff = distSq >= 1.0 ? 0.0 : Math.pow(1.0 - distSq, 2.2);
      const idx = (y * size + x) * 4;
      data[idx] = rByte;
      data[idx + 1] = gByte;
      data[idx + 2] = bByte;
      data[idx + 3] = Math.round(falloff * 255);
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.name = 'GoldenOak_RadialShadowDecal';
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

// ============================================================================
// Ref-Counted Per-Renderer RoomEnvironment PMREM Cache (Zero Leak, Zero Network)
// ============================================================================

interface CachedPMREMEntry {
  renderTarget: THREE.WebGLRenderTarget;
  refs: number;
}

const roomPmremCache = new WeakMap<THREE.WebGLRenderer, CachedPMREMEntry>();

function acquireRoomEnvironmentPMREM(gl: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const existing = roomPmremCache.get(gl);
  if (existing) {
    existing.refs += 1;
    return existing.renderTarget;
  }

  const pmremGenerator = new THREE.PMREMGenerator(gl);
  const roomEnvironment = new RoomEnvironment();
  const renderTarget = pmremGenerator.fromScene(roomEnvironment, 0.04);

  // Immediately dispose temporary generator & procedural scene meshes
  roomEnvironment.dispose();
  pmremGenerator.dispose();

  roomPmremCache.set(gl, { renderTarget, refs: 1 });
  return renderTarget;
}

function releaseRoomEnvironmentPMREM(gl: THREE.WebGLRenderer): void {
  const entry = roomPmremCache.get(gl);
  if (!entry) return;
  entry.refs -= 1;
  if (entry.refs <= 0) {
    roomPmremCache.delete(gl);
    entry.renderTarget.dispose();
  }
}

// ============================================================================
// Internal R3F Subcomponents
// ============================================================================

function RadialShadowDecal({
  position,
  scale,
  opacity,
  umbraHex,
}: {
  position: [number, number, number];
  scale: number;
  opacity: number;
  umbraHex: string;
}) {
  const { decalTexture, geometry } = useMemo(() => {
    const tex = createRadialShadowTexture(64, umbraHex);
    const geom = new THREE.PlaneGeometry(scale, scale);
    return { decalTexture: tex, geometry: geom };
  }, [scale, umbraHex]);

  useEffect(() => {
    return () => {
      decalTexture.dispose();
      geometry.dispose();
    };
  }, [decalTexture, geometry]);

  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={-1}
    >
      <meshBasicMaterial
        map={decalTexture}
        transparent
        opacity={opacity}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
}

function StudioEnvironmentIBL({
  iblSource,
  environmentIntensity,
}: {
  iblSource: StudioLightingBudget['iblSource'];
  environmentIntensity: number;
}) {
  const getThreeState = useThree((state) => state.get);

  useEffect(() => {
    const { gl, scene, invalidate } = getThreeState();
    const prevEnvironment = scene.environment;
    const prevIntensity =
      'environmentIntensity' in scene
        ? (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity
        : 1;

    if (iblSource === 'none') {
      scene.environment = null;
      if ('environmentIntensity' in scene) {
        (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity = 0;
      }
      invalidate();
      return () => {
        scene.environment = prevEnvironment;
        if ('environmentIntensity' in scene) {
          (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity =
            prevIntensity;
        }
      };
    }

    // Bind 0 KB procedural RoomEnvironment PMREM immediately (even while optional local HDR loads)
    let cancelled = false;
    let roomAcquired = false;
    let localHdrRT: THREE.WebGLRenderTarget | null = null;

    try {
      const roomRT = acquireRoomEnvironmentPMREM(gl);
      roomAcquired = true;
      scene.environment = roomRT.texture;
      if ('environmentIntensity' in scene) {
        (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity =
          environmentIntensity;
      }
      invalidate();
    } catch {
      // Safe fallback in mock/non-WebGL environments
    }

    if (iblSource === 'local-optimized-hdr') {
      const loader = new HDRLoader();
      loader
        .loadAsync(LOCAL_OPTIMIZED_HDR_PATH)
        .then((hdrTex) => {
          if (cancelled) {
            hdrTex.dispose();
            return;
          }
          const pmrem = new THREE.PMREMGenerator(gl);
          pmrem.compileEquirectangularShader();
          localHdrRT = pmrem.fromEquirectangular(hdrTex);
          hdrTex.dispose();
          pmrem.dispose();

          scene.environment = localHdrRT.texture;
          if ('environmentIntensity' in scene) {
            (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity =
              environmentIntensity;
          }
          invalidate();
        })
        .catch(() => {
          // Keeps 0 KB RoomEnvironment active if offline or local HDR unavailable
        });
    }

    return () => {
      cancelled = true;
      if (localHdrRT) {
        localHdrRT.dispose();
        localHdrRT = null;
      }
      if (roomAcquired) {
        releaseRoomEnvironmentPMREM(gl);
        roomAcquired = false;
      }
      scene.environment = prevEnvironment;
      if ('environmentIntensity' in scene) {
        (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity =
          prevIntensity;
      }
    };
  }, [getThreeState, iblSource, environmentIntensity]);

  return null;
}

/**
 * `<StudioFoodLighting />`
 *
 * Unified, tier-aware culinary studio & AR lighting rig for The Golden Oak:
 * - Zero external CDN dependencies (uses Three.js in-memory `RoomEnvironment` PMREM with 0 KB network cost).
 * - Strict mobile GPU light & shadow budgets across `ultra-light`, `balanced`, and `high-fidelity`.
 * - Dynamic real-world `ambientLuma` light matching and 1-draw-call shadow receiver for `mode="ar"`.
 */
export function StudioFoodLighting({
  profile,
  mode = 'viewer',
  shadowsEnabled = false,
  shadowResolution,
  shadowRefreshKey = 0,
  ambientLuma = 0.85,
  useLocalHdrOnHighFidelity = false,
  groundY,
  groundScale,
  enableGroundShadow = true,
}: StudioFoodLightingProps) {
  const viewportWidth = useThree((state) => state.size.width);
  const isMobileViewport = viewportWidth > 0 && viewportWidth < 768;

  const budget = useMemo(
    () =>
      resolveStudioLightingBudget(
        {
          profile,
          mode,
          shadowsEnabled,
          shadowResolution,
          ambientLuma,
          useLocalHdrOnHighFidelity,
          enableGroundShadow,
        },
        isMobileViewport
      ),
    [
      profile,
      mode,
      shadowsEnabled,
      shadowResolution,
      ambientLuma,
      useLocalHdrOnHighFidelity,
      enableGroundShadow,
      isMobileViewport,
    ]
  );

  const defaultGroundY = mode === 'ar' ? -0.01 : mode === 'pedestal' ? -0.12 : -0.05;
  const resolvedGroundY = groundY ?? defaultGroundY;
  const defaultScale = mode === 'pedestal' ? 5 : mode === 'ar' ? 4.5 : 8;
  const resolvedScale = groundScale ?? defaultScale;
  const groundPos: [number, number, number] = [0, resolvedGroundY, 0];

  // 1. AR Real-World Dynamic Light Matching Mode
  if (budget.mode === 'ar') {
    const luma = budget.clampedAmbientLuma;
    const arDecalOpacity = Number(clamp(0.16 + 0.22 * luma, 0.22, 0.46).toFixed(3));

    return (
      <group name="StudioFoodLighting_AR">
        <StudioEnvironmentIBL iblSource="none" environmentIntensity={0} />
        <hemisphereLight
          args={['#FFFDF8', '#423930', Number((0.62 * luma).toFixed(3))]}
        />
        <directionalLight
          position={[2.8, 5.8, 2.6]}
          color="#FFFFFF"
          intensity={Number((0.92 * luma).toFixed(3))}
          castShadow={false}
        />
        {budget.shadowStrategy === 'radial-decal' && (
          <RadialShadowDecal
            position={groundPos}
            scale={resolvedScale}
            opacity={arDecalOpacity}
            umbraHex="#0E0C0A"
          />
        )}
      </group>
    );
  }

  // 2. Ultra-Light Studio Rig (2 lights, 0 shadow FBO passes, 1-draw-call radial decal)
  if (budget.profile === 'ultra-light') {
    return (
      <group name="StudioFoodLighting_UltraLight">
        <StudioEnvironmentIBL iblSource="none" environmentIntensity={0} />
        <hemisphereLight args={['#FFF6E6', '#3D2B1F', 0.9]} />
        <directionalLight
          position={[3.8, 6.5, 3.5]}
          color="#FFF9EF"
          intensity={1.25}
          castShadow={false}
        />
        {budget.shadowStrategy === 'radial-decal' && (
          <RadialShadowDecal
            position={groundPos}
            scale={mode === 'pedestal' ? 2.8 : 3.4}
            opacity={mode === 'pedestal' ? 0.55 : 0.46}
            umbraHex="#1A1109"
          />
        )}
      </group>
    );
  }

  // 3. Balanced Studio Rig (Hemisphere + Key + Golden Rim + RoomEnvironment IBL + fast single-frame ContactShadows)
  if (budget.profile === 'balanced') {
    return (
      <group name="StudioFoodLighting_Balanced">
        <StudioEnvironmentIBL
          iblSource={budget.iblSource}
          environmentIntensity={budget.environmentIntensity}
        />
        <hemisphereLight args={['#FFF6E6', '#3A281C', 0.68]} />
        <directionalLight
          position={[4.2, 7.2, 3.8]}
          color="#FFF9F0"
          intensity={1.18}
          castShadow={false}
        />
        <directionalLight
          position={[-3.2, 4.6, -4.2]}
          color="#F2C166"
          intensity={0.52}
          castShadow={false}
        />
        {budget.shadowStrategy === 'baked-contact-fast' && (
          <SafeContactShadows
            position={groundPos}
            opacity={mode === 'pedestal' ? 0.56 : 0.48}
            scale={resolvedScale}
            blur={2.1}
            far={mode === 'pedestal' ? 3 : 4}
            resolution={budget.contactShadowResolution}
            frames={1}
            smooth={false}
            color="#1A1008"
            refreshTrigger={shadowRefreshKey}
          />
        )}
      </group>
    );
  }

  // 4. High-Fidelity Studio Rig (Hemisphere + Key + Warm Fill + Golden Rim + IBL + smooth ContactShadows)
  return (
    <group name="StudioFoodLighting_HighFidelity">
      <StudioEnvironmentIBL
        iblSource={budget.iblSource}
        environmentIntensity={budget.environmentIntensity}
      />
      <hemisphereLight args={['#FFF7EA', '#38261B', 0.54]} />
      <directionalLight
        position={[4.5, 7.5, 4.0]}
        color="#FFF9F2"
        intensity={1.22}
        castShadow={budget.directionalCastShadow}
        shadow-mapSize={
          budget.directionalCastShadow
            ? [budget.directionalShadowMapSize, budget.directionalShadowMapSize]
            : undefined
        }
        shadow-bias={-0.0004}
      />
      <directionalLight
        position={[-4.2, 3.8, 2.6]}
        color="#FFEBD2"
        intensity={0.44}
        castShadow={false}
      />
      <directionalLight
        position={[-2.6, 5.0, -4.5]}
        color="#F0BE63"
        intensity={0.58}
        castShadow={false}
      />
      {budget.shadowStrategy === 'baked-contact-smooth' && (
        <SafeContactShadows
          position={groundPos}
          opacity={mode === 'pedestal' ? 0.58 : 0.5}
          scale={resolvedScale}
          blur={2.3}
          far={mode === 'pedestal' ? 3 : 4}
          resolution={budget.contactShadowResolution}
          frames={1}
          smooth={true}
          color="#170E07"
          refreshTrigger={shadowRefreshKey}
        />
      )}
    </group>
  );
}

export default StudioFoodLighting;
