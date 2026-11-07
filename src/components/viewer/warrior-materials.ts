import type { Object3D, Mesh, Material, MeshStandardMaterial, MeshPhysicalMaterial } from 'three';
import type { FoodRenderProfile } from '@/lib/three/food-materials';

function resolveWarriorRenderProfile(
  tierOrProfile?: FoodRenderProfile | 'low' | 'medium' | 'high' | string | null
): FoodRenderProfile {
  if (tierOrProfile === 'ultra-light' || tierOrProfile === 'low') return 'ultra-light';
  if (tierOrProfile === 'high-fidelity' || tierOrProfile === 'high') return 'high-fidelity';
  return 'balanced';
}

/**
 * Authentic, rich PBR material palette for the 3D Warrior Model.
 * Provides vibrant colors, natural skin tones, ruby crimson cape,
 * gleaming gold trim, and polished steel armor.
 */
export const WARRIOR_MATERIAL_PALETTE: Record<
  string,
  { color: [number, number, number]; roughness: number; metalness: number }
> = {
  Skin_Mat: { color: [0.82, 0.62, 0.48], roughness: 0.5, metalness: 0.0 },
  Crimson_Cape_Mat: { color: [0.85, 0.12, 0.12], roughness: 0.45, metalness: 0.05 },
  Gold_Trim_Mat: { color: [0.95, 0.78, 0.25], roughness: 0.28, metalness: 0.7 },
  Talwar_Brass_Mat: { color: [0.90, 0.72, 0.20], roughness: 0.3, metalness: 0.65 },
  Talwar_Blade_Mat: { color: [0.85, 0.88, 0.92], roughness: 0.2, metalness: 0.8 },
  Steel_Armor_Mat: { color: [0.65, 0.68, 0.72], roughness: 0.35, metalness: 0.7 },
  Dark_Iron_Mat: { color: [0.28, 0.29, 0.32], roughness: 0.45, metalness: 0.4 },
  Leather_Mat: { color: [0.45, 0.28, 0.15], roughness: 0.6, metalness: 0.05 },
  Hair_Beard_Mat: { color: [0.12, 0.08, 0.05], roughness: 0.6, metalness: 0.0 },
  Floor_Stone_Mat: { color: [0.078, 0.063, 0.051], roughness: 0.45, metalness: 0.25 },
  Cornea_Mat: { color: [1.0, 1.0, 1.0], roughness: 0.1, metalness: 0.0 },
  Sclera_Mat: { color: [0.95, 0.95, 0.95], roughness: 0.2, metalness: 0.0 },
  Iris_Mat: { color: [0.25, 0.15, 0.08], roughness: 0.1, metalness: 0.0 },
  Pupil_Black: { color: [0.02, 0.02, 0.02], roughness: 0.1, metalness: 0.0 },
};

export interface EnhanceWarriorMaterialsOptions {
  /** Rendering tier profile (accepts FoodRenderProfile or legacy 'low' | 'medium' | 'high') */
  profile?: FoodRenderProfile | 'low' | 'medium' | 'high';
  /** Clone shared cached materials per-instance (defaults to true to prevent useGLTF cache mutation) */
  cloneMaterials?: boolean;
  /** Whether rendering inside live camera AR mode (disables static baked envMap tinting) */
  isAR?: boolean;
  /** Allow physical cornea transmission ONLY when explicitly opted-in on high-fidelity */
  enableTransmission?: boolean;
  /** Optional explicit IBL intensity multiplier */
  envMapIntensity?: number;
}

/**
 * Traverses a 3D object hierarchy and ensures every material has its vibrant
 * color, roughness, metalness, and tier-calibrated IBL intensity applied.
 *
 * Backward-compatible with 1-argument callers (`enhanceWarriorMaterials(clone)`),
 * while fixing the shared `useGLTF` cache mutation leak via per-instance cloning
 * (`userData.__clonedForInstance = true`) and eliminating costly multipass
 * `Cornea_Mat` transmission FBO copies on mobile GPUs.
 */
export function enhanceWarriorMaterials(
  obj: Object3D,
  options?: EnhanceWarriorMaterialsOptions
): void {
  const profile = resolveWarriorRenderProfile(options?.profile ?? 'balanced');
  const shouldClone = options?.cloneMaterials !== false;
  const isAR = Boolean(options?.isAR);
  const allowTransmission =
    profile === 'high-fidelity' && Boolean(options?.enableTransmission) && !isAR;

  const instanceCloneMap = new Map<Material, Material>();
  const styledSet = new Set<Material>();

  obj.traverse((child) => {
    if (!(child as Mesh).isMesh) return;
    const mesh = child as Mesh;
    if (!mesh.material) return;

    const processMat = (rawMat: Material): Material => {
      if (!rawMat) return rawMat;

      let mat = rawMat;
      const alreadyCloned =
        mat.userData?.__clonedForInstance === true || mat.userData?.__isInstanceClone === true;
      if (alreadyCloned) {
        mat.userData.__clonedForInstance = true;
        mat.userData.__isInstanceClone = true;
      } else if (shouldClone && typeof mat.clone === 'function') {
        const existingClone = instanceCloneMap.get(mat);
        if (existingClone) {
          mat = existingClone;
        } else {
          const cloned = mat.clone();
          cloned.userData = {
            ...(mat.userData || {}),
            __clonedForInstance: true,
            __isInstanceClone: true,
            __sourceMaterialUuid: mat.uuid,
          };
          instanceCloneMap.set(mat, cloned);
          mat = cloned;
        }
      }

      if (styledSet.has(mat)) {
        return mat;
      }
      styledSet.add(mat);

      const palette = WARRIOR_MATERIAL_PALETTE[mat.name];
      const stdMat = mat as MeshStandardMaterial;

      if (palette && 'color' in stdMat && stdMat.color) {
        stdMat.color.setRGB(palette.color[0], palette.color[1], palette.color[2]);

        const isMetallic = palette.metalness >= 0.4;
        if ('roughness' in stdMat) {
          // Slightly soften metallic roughness on ultra-light (no IBL cubemap) so direct lights catch broader highlights
          stdMat.roughness =
            profile === 'ultra-light' && isMetallic
              ? Math.min(0.48, palette.roughness + 0.06)
              : palette.roughness;
        }
        if ('metalness' in stdMat) {
          stdMat.metalness =
            profile === 'ultra-light' && isMetallic
              ? Math.min(palette.metalness, 0.58)
              : palette.metalness;
        }

        if ('envMapIntensity' in stdMat) {
          if (options?.envMapIntensity !== undefined) {
            stdMat.envMapIntensity = options.envMapIntensity;
          } else if (isAR) {
            stdMat.envMapIntensity = 0.6;
            stdMat.envMap = null;
          } else if (isMetallic) {
            stdMat.envMapIntensity =
              profile === 'high-fidelity' ? 1.3 : profile === 'balanced' ? 1.18 : 0.9;
          } else {
            stdMat.envMapIntensity =
              profile === 'high-fidelity' ? 1.0 : profile === 'balanced' ? 0.92 : 0.78;
          }
        }
      }

      // Fast-path Cornea_Mat & strip expensive glTF KHR_materials_* physical lobes on mobile tiers
      const physMat = mat as MeshPhysicalMaterial;
      if (mat.name === 'Cornea_Mat') {
        if (!allowTransmission) {
          if ('transmission' in physMat) physMat.transmission = 0;
          mat.transparent = true;
          mat.opacity = 0.28;
          mat.depthWrite = false;
        }
      }

      if (profile !== 'high-fidelity') {
        if ('clearcoat' in physMat) physMat.clearcoat = 0;
        if ('sheen' in physMat) physMat.sheen = 0;
        if ('anisotropy' in physMat) physMat.anisotropy = 0;
        if ('transmission' in physMat && !allowTransmission) physMat.transmission = 0;
      }

      mat.needsUpdate = true;
      return mat;
    };

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(processMat);
    } else {
      mesh.material = processMat(mesh.material);
    }
  });
}
