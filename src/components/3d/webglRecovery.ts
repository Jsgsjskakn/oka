import * as THREE from 'three';

/**
 * Universal Scene & Texture Re-initialization utility
 * When WebGL context is restored, all GPU-bound buffers and textures are invalidated.
 * Traversing the scene and setting `needsUpdate = true` forces Three.js to re-upload
 * textures, recompile shader programs, and bind fresh WebGL textures.
 */
export function reinitializeSceneWebGL(
  scene: THREE.Scene | { traverse: (cb: (child: any) => void) => void },
  gl?: { resetState?: () => void }
): { meshesUpdated: number; texturesUpdated: number } {
  let meshesUpdated = 0;
  let texturesUpdated = 0;

  if (gl && typeof gl.resetState === 'function') {
    try {
      gl.resetState();
    } catch {
      // Ignore if renderer doesn't support or already in safe state
    }
  }

  scene.traverse((child: any) => {
    if (child && child.isMesh) {
      meshesUpdated++;

      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat: any) => {
          if (!mat) return;
          mat.needsUpdate = true;

          // Check standard Three.js texture map slots
          const textureSlots = [
            'map',
            'normalMap',
            'roughnessMap',
            'metalnessMap',
            'envMap',
            'emissiveMap',
            'aoMap',
            'alphaMap',
            'bumpMap',
            'displacementMap',
            'lightMap',
            'clearcoatMap',
            'transmissionMap',
          ] as const;

          for (const slot of textureSlots) {
            const tex = mat[slot];
            if (tex && (tex.isTexture || tex instanceof THREE.Texture)) {
              tex.needsUpdate = true;
              texturesUpdated++;
            }
          }
        });
      }

      // Re-mark geometry attributes if needed
      if (child.geometry) {
        const geom = child.geometry;
        if (geom.attributes) {
          for (const attrKey of Object.keys(geom.attributes)) {
            const attr = geom.attributes[attrKey];
            if (attr && 'needsUpdate' in attr) {
              attr.needsUpdate = true;
            }
          }
        }
        if (geom.index && 'needsUpdate' in geom.index) {
          geom.index.needsUpdate = true;
        }
      }
    }
  });

  return { meshesUpdated, texturesUpdated };
}
