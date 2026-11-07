import * as THREE from 'three';

/**
 * Exhaustive list of texture map property names across Three.js
 * MeshBasicMaterial, MeshStandardMaterial, MeshPhysicalMaterial,
 * MeshLambertMaterial, MeshPhongMaterial, MeshToonMaterial, and MeshMatcapMaterial.
 */
export const TEXTURE_MAP_SLOTS = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'emissiveMap',
  'alphaMap',
  'envMap',
  'lightMap',
  'bumpMap',
  'displacementMap',
  'specularMap',
  'specularIntensityMap',
  'specularColorMap',
  'gradientMap',
  'matcap',
  'clearcoatMap',
  'clearcoatNormalMap',
  'clearcoatRoughnessMap',
  'transmissionMap',
  'thicknessMap',
  'sheenColorMap',
  'sheenRoughnessMap',
  'iridescenceMap',
  'iridescenceThicknessMap',
  'anisotropyMap',
] as const;

export interface InstanceDisposalResult {
  disposedMaterials: number;
  disposedTextures: number;
  disposedGeometries: number;
}

export interface FullDisposalResult {
  disposedGeometries: number;
  disposedMaterials: number;
  disposedTextures: number;
  disposedRenderTargets: number;
}

export interface RendererMemorySnapshot {
  geometries: number;
  textures: number;
  programs: number;
  calls: number;
  triangles: number;
  points: number;
  lines: number;
}

type RenderableObject = THREE.Object3D & {
  isMesh?: boolean;
  isPoints?: boolean;
  isLine?: boolean;
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material | THREE.Material[];
};

function isRenderable(obj: THREE.Object3D): obj is RenderableObject {
  const candidate = obj as RenderableObject;
  return Boolean(candidate.isMesh || candidate.isPoints || candidate.isLine);
}

function isTextureLike(val: unknown): val is THREE.Texture {
  return Boolean(
    val &&
      typeof val === 'object' &&
      ((val as THREE.Texture).isTexture === true ||
        typeof (val as THREE.Texture).dispose === 'function')
  );
}

function isRenderTargetLike(val: unknown): val is THREE.WebGLRenderTarget {
  return Boolean(
    val &&
      typeof val === 'object' &&
      ((val as THREE.WebGLRenderTarget).isWebGLRenderTarget === true ||
        ('texture' in (val as Record<string, unknown>) &&
          typeof (val as THREE.WebGLRenderTarget).dispose === 'function' &&
          !(val as THREE.Texture).isTexture))
  );
}

/**
 * Helper to explicitly tag a custom per-instance texture so `disposeInstanceClone`
 * disposes it alongside cloned instance materials without touching shared glTF textures.
 */
export function tagInstanceTexture<T extends THREE.Texture>(texture: T): T {
  texture.userData = { ...texture.userData, __isInstanceClone: true };
  return texture;
}

/**
 * Helper to explicitly tag a procedural per-instance geometry so `disposeInstanceClone`
 * disposes it when the instance unmounts while preserving cached glTF BufferGeometries.
 */
export function tagProceduralGeometry<T extends THREE.BufferGeometry>(geometry: T): T {
  geometry.userData = { ...geometry.userData, __isProceduralClone: true };
  return geometry;
}

/**
 * Clones a cached glTF `Object3D` hierarchy with isolated per-instance `Material` clones
 * while sharing immutable `BufferGeometry` and `Texture` references from `useGLTF` cache.
 *
 * - Deduplicates materials within the cloned instance so multi-part meshes sharing a palette
 *   still batch uniforms cleanly.
 * - Tags each cloned material with `userData.__isInstanceClone = true` for deterministic cleanup.
 * - Enables `frustumCulled = true` and ensures `boundingSphere` is precomputed on geometries.
 */
export function cloneSceneWithIsolatedMaterials(sourceScene: THREE.Object3D): THREE.Object3D {
  const clonedRoot = sourceScene.clone(true);
  clonedRoot.userData = { ...clonedRoot.userData, __isInstanceRoot: true };

  const materialCloneMap = new Map<THREE.Material, THREE.Material>();

  const cloneSingleMaterial = (mat: THREE.Material): THREE.Material => {
    const existing = materialCloneMap.get(mat);
    if (existing) return existing;

    const clonedMat = mat.clone();
    clonedMat.userData = {
      ...mat.userData,
      __isInstanceClone: true,
      __disposed: false,
    };
    materialCloneMap.set(mat, clonedMat);
    return clonedMat;
  };

  clonedRoot.traverse((child) => {
    if (!isRenderable(child)) return;

    child.frustumCulled = true;

    if (child.geometry) {
      if (!child.geometry.boundingSphere) {
        child.geometry.computeBoundingSphere();
      }
      if (!child.geometry.boundingBox) {
        child.geometry.computeBoundingBox();
      }
    }

    if (Array.isArray(child.material)) {
      child.material = child.material.map((m) => (m ? cloneSingleMaterial(m) : m));
    } else if (child.material) {
      child.material = cloneSingleMaterial(child.material);
    }
  });

  return clonedRoot;
}

function collectMaterialTexturesAndTargets(
  mat: THREE.Material,
  onTexture: (tex: THREE.Texture) => void,
  onRenderTarget?: (rt: THREE.WebGLRenderTarget) => void
): void {
  const record = mat as unknown as Record<string, unknown>;

  for (const slot of TEXTURE_MAP_SLOTS) {
    const candidate = record[slot];
    if (isRenderTargetLike(candidate)) {
      onRenderTarget?.(candidate);
      if (isTextureLike(candidate.texture)) {
        onTexture(candidate.texture);
      }
    } else if (isTextureLike(candidate)) {
      onTexture(candidate);
    }
  }

  // Inspect ShaderMaterial / RawShaderMaterial uniforms if present
  const uniforms = (mat as THREE.ShaderMaterial).uniforms;
  if (uniforms && typeof uniforms === 'object') {
    for (const uniform of Object.values(uniforms)) {
      const val = uniform?.value;
      if (isRenderTargetLike(val)) {
        onRenderTarget?.(val);
        if (isTextureLike(val.texture)) {
          onTexture(val.texture);
        }
      } else if (isTextureLike(val)) {
        onTexture(val);
      } else if (Array.isArray(val)) {
        for (const item of val) {
          if (isRenderTargetLike(item)) {
            onRenderTarget?.(item);
          } else if (isTextureLike(item)) {
            onTexture(item);
          }
        }
      }
    }
  }
}

/**
 * Deterministically disposes per-instance cloned resources created by
 * `cloneSceneWithIsolatedMaterials` without corrupting shared `useGLTF` cached
 * `BufferGeometry` or `Texture` assets.
 */
export function disposeInstanceClone(
  root: THREE.Object3D | null | undefined
): InstanceDisposalResult {
  const result: InstanceDisposalResult = {
    disposedMaterials: 0,
    disposedTextures: 0,
    disposedGeometries: 0,
  };

  if (!root) return result;

  const visitedMaterials = new Set<THREE.Material>();
  const visitedTextures = new Set<THREE.Texture>();
  const visitedGeometries = new Set<THREE.BufferGeometry>();

  root.traverse((child) => {
    if (!isRenderable(child)) return;

    const geom = child.geometry;
    if (
      geom &&
      !visitedGeometries.has(geom) &&
      (geom.userData?.__isProceduralClone === true || geom.userData?.__isInstanceClone === true)
    ) {
      visitedGeometries.add(geom);
      geom.userData.__disposed = true;
      geom.dispose();
      result.disposedGeometries += 1;
    }

    const materials = Array.isArray(child.material)
      ? child.material
      : child.material
        ? [child.material]
        : [];

    for (const mat of materials) {
      if (!mat || visitedMaterials.has(mat)) continue;
      visitedMaterials.add(mat);

      collectMaterialTexturesAndTargets(mat, (tex) => {
        if (!visitedTextures.has(tex) && tex.userData?.__isInstanceClone === true) {
          visitedTextures.add(tex);
          tex.userData.__disposed = true;
          tex.dispose();
          result.disposedTextures += 1;
        }
      });

      if (mat.userData?.__isInstanceClone === true) {
        mat.userData.__disposed = true;
        mat.dispose();
        result.disposedMaterials += 1;
      }
    }
  });

  return result;
}

/**
 * Deeply disposes ALL geometries, materials, PBR texture map slots, shader uniform
 * textures, and attached `WebGLRenderTarget`s under `root`.
 *
 * Use ONLY when completely evicting a standalone or uncached 3D asset from GPU memory
 * (never on an active shared `useGLTF` cache entry unless evicting the cache entry too).
 */
export function disposeFullObject3D(
  root: THREE.Object3D | null | undefined
): FullDisposalResult {
  const result: FullDisposalResult = {
    disposedGeometries: 0,
    disposedMaterials: 0,
    disposedTextures: 0,
    disposedRenderTargets: 0,
  };

  if (!root) return result;

  const visitedGeometries = new Set<THREE.BufferGeometry>();
  const visitedMaterials = new Set<THREE.Material>();
  const visitedTextures = new Set<THREE.Texture>();
  const visitedRenderTargets = new Set<THREE.WebGLRenderTarget>();

  const disposeTex = (tex: THREE.Texture) => {
    if (visitedTextures.has(tex)) return;
    visitedTextures.add(tex);
    if (tex.userData && typeof tex.userData === 'object') {
      tex.userData.__disposed = true;
    }
    tex.dispose();
    result.disposedTextures += 1;
  };

  const disposeRT = (rt: THREE.WebGLRenderTarget) => {
    if (visitedRenderTargets.has(rt)) return;
    visitedRenderTargets.add(rt);
    if (isTextureLike(rt.texture)) {
      visitedTextures.add(rt.texture);
    }
    rt.dispose();
    result.disposedRenderTargets += 1;
  };

  root.traverse((child) => {
    // Check userData for any attached render targets or textures
    if (child.userData && typeof child.userData === 'object') {
      for (const val of Object.values(child.userData)) {
        if (isRenderTargetLike(val)) {
          disposeRT(val);
        } else if (isTextureLike(val)) {
          disposeTex(val);
        }
      }
    }

    // Check Scene-level background / environment textures
    const asScene = child as THREE.Scene;
    if (asScene.isScene) {
      if (isRenderTargetLike(asScene.background)) {
        disposeRT(asScene.background);
      } else if (isTextureLike(asScene.background)) {
        disposeTex(asScene.background);
      }
      if (isRenderTargetLike(asScene.environment)) {
        disposeRT(asScene.environment);
      } else if (isTextureLike(asScene.environment)) {
        disposeTex(asScene.environment);
      }
    }

    if (!isRenderable(child)) return;

    if (child.geometry && !visitedGeometries.has(child.geometry)) {
      visitedGeometries.add(child.geometry);
      if (child.geometry.userData && typeof child.geometry.userData === 'object') {
        child.geometry.userData.__disposed = true;
      }
      child.geometry.dispose();
      result.disposedGeometries += 1;
    }

    const materials = Array.isArray(child.material)
      ? child.material
      : child.material
        ? [child.material]
        : [];

    for (const mat of materials) {
      if (!mat || visitedMaterials.has(mat)) continue;
      visitedMaterials.add(mat);

      collectMaterialTexturesAndTargets(mat, disposeTex, disposeRT);

      if (mat.userData && typeof mat.userData === 'object') {
        mat.userData.__disposed = true;
      }
      mat.dispose();
      result.disposedMaterials += 1;
    }
  });

  if (root.children.length > 0) {
    root.clear();
  }

  return result;
}

/**
 * Extracts a clean, serializable snapshot of WebGLRenderer GPU memory and per-frame
 * render counters for telemetry and leak regression assertions.
 */
export function getRendererMemorySnapshot(
  gl: Pick<THREE.WebGLRenderer, 'info'> | null | undefined
): RendererMemorySnapshot {
  const memory = gl?.info?.memory;
  const render = gl?.info?.render;
  const programs = gl?.info?.programs;

  return {
    geometries: memory?.geometries ?? 0,
    textures: memory?.textures ?? 0,
    programs: Array.isArray(programs) ? programs.length : 0,
    calls: render?.calls ?? 0,
    triangles: render?.triangles ?? 0,
    points: render?.points ?? 0,
    lines: render?.lines ?? 0,
  };
}
