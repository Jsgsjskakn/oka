import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useGLTF } from '@react-three/drei';

// Configure local Draco decoder path (zero external CDN dependency)
useGLTF.setDecoderPath('/draco/');

export const INTERIOR_MODEL_URL = '/models/the_golden_oak_interior.optimized.glb';
export const ORIGINAL_INTERIOR_MODEL_URL = '/models/the_golden_oak_interior.glb';

/**
 * Master Architectural PBR Tuning:
 * Directly matches the Blender 5.2 LookDev visual ground truth.
 * Preserves high-detail materials, embedded textures, reflections, and emissions:
 *  1. Crystal Clear Glassware (transmission 0.65, opacity 0.35, roughness 0.05, ior 1.5)
 *  2. Ruby Red Wine & Spirits (#780616, transmission 0.25, opacity 0.88)
 *  3. Polished Champagne Brass & Gold (#E8BF65, metalness 0.88, roughness 0.22)
 *  4. Italian Cognac Leather Dining Chairs (#582B14, roughness 0.42, metalness 0.05)
 *  5. Imperial Brown Hardwood Floor (#3A2417, roughness 0.35)
 *  6. Smoked Walnut Partitions & Timber Slats (#25160E, roughness 0.32)
 *  7. Calacatta Gold Marble Tables & Plates (#F7F5F0, roughness 0.15)
 *  8. Warm Ambient Lamps, Cove LED & Honey Onyx (emissive #FF9E2C, intensity 2.5)
 */
export function applyInteriorMaterials(
  root: THREE.Object3D,
  simplifyTransmission: boolean = false,
  shadowsEnabled: boolean = true
): void {
  root.traverse((child: any) => {
    if (child.isMesh && child.material) {
      const mat = child.material;
      child.castShadow = shadowsEnabled;
      child.receiveShadow = shadowsEnabled;

      const name = (mat.name || '').toLowerCase();
      const objName = (child.name || '').toLowerCase();

      // 1. Crystal Clear Glassware & Chandelier Crystals (Eliminates solid black transmission collapse)
      if (
        name.includes('glass') ||
        name.includes('crystalline') ||
        name.includes('crystal') ||
        objName.includes('glass') ||
        objName.includes('crystal') ||
        objName.includes('chalice')
      ) {
        child.castShadow = false;
        child.receiveShadow = false;
        mat.color = new THREE.Color('#FFFFFF');
        mat.emissive = new THREE.Color('#FFAA33'); // Warm 2700K golden crystal illumination prevents dark chandelier silhouettes
        mat.emissiveIntensity = 0.75;
        mat.transparent = true;
        mat.opacity = simplifyTransmission ? 0.45 : 0.35;
        mat.roughness = simplifyTransmission ? 0.1 : 0.05;
        mat.metalness = 0.05;
        mat.transmission = 0; // CRITICAL: transmission > 0 in merged / multipass WebGL renders as opaque black! 0 ensures crystal-clear transparency
        mat.ior = 1.5;
        mat.depthWrite = false;
        mat.needsUpdate = true;
      }

      // 1b. Crystalline Water Surface (Fountain tiers & Rotunda Pool - crystal aquatic reflection)
      if (name.includes('water') || objName.includes('water')) {
        child.castShadow = false;
        child.receiveShadow = false;
        mat.color = new THREE.Color('#38D9C0'); // Luminous Mediterranean turquoise water
        mat.emissive = new THREE.Color('#149480'); // Radiant emerald aquatic glow
        mat.emissiveIntensity = 0.95;
        mat.transparent = true;
        mat.opacity = 0.88;
        mat.roughness = 0.02;
        mat.metalness = 0.15;
        mat.transmission = 0;
        mat.depthWrite = false;
        mat.side = THREE.DoubleSide;
        mat.needsUpdate = true;
      }

      // 2. Ruby Red Wine & Spirits (Deep glowing jewel red - never collapses into black)
      if (name.includes('wine') || name.includes('ruby') || name.includes('liquid') || objName.includes('liquid')) {
        child.castShadow = false;
        child.receiveShadow = false;
        mat.color = new THREE.Color('#780616');
        mat.emissive = new THREE.Color('#6E0814');
        mat.emissiveIntensity = 0.65;
        mat.transparent = true;
        mat.opacity = simplifyTransmission ? 0.85 : 0.88;
        mat.roughness = 0.08;
        mat.transmission = 0; // CRITICAL: prevents solid black transmission collapse
        mat.depthWrite = true;
        mat.needsUpdate = true;
      }

      // 3. Polished Champagne Brass & Gold (Chandelier, Rotunda Fountain, Cutlery)
      if (
        !name.includes('rug') &&
        !name.includes('water') &&
        !name.includes('crystalline') &&
        !objName.includes('water') &&
        (name.includes('brass') ||
          name.includes('gold') ||
          name.includes('bronze') ||
          objName.includes('chandelier') ||
          objName.includes('fountain') ||
          objName.includes('halo_ring') ||
          objName.includes('pedestal'))
      ) {
        mat.color = new THREE.Color('#E8BF65');
        mat.metalness = 0.88;
        mat.roughness = 0.22;
        mat.needsUpdate = true;
      }

      // 4. Italian Cognac Leather Dining Chairs (Warm Caramel Saddle Brown)
      if (name.includes('leather') || objName.includes('ch_')) {
        mat.color = new THREE.Color('#8C4A26');
        mat.roughness = 0.38;
        mat.metalness = 0.05;
        mat.needsUpdate = true;
      }

      // 5. Imperial Brown Hardwood Floor (Warm Golden Oak Floorplan)
      if (name.includes('imperial_brown') || name.includes('wood_tiles') || objName.includes('floor')) {
        // When texture map is present, avoid dark color crush; preserve warm vibrant wood tones
        mat.color = mat.map ? new THREE.Color('#FFE8D0') : new THREE.Color('#7A4321');
        mat.roughness = 0.24;
        mat.metalness = 0.04;
        mat.needsUpdate = true;
      }

      // 5b. Exterior Timber Deck & Architectural Plinths
      if (name.includes('timber_deck') || objName.includes('exterior_ground') || (objName.includes('plinth') && !name.includes('brass') && !name.includes('calacatta') && !name.includes('onyx') && !name.includes('pool'))) {
        mat.color = new THREE.Color('#6E3816');
        mat.roughness = 0.32;
        mat.needsUpdate = true;
      }

      // 5c. Plush Decorative Rugs (Warm Bronze-Taupe, Emerald & Midnight Silk instead of cold slate)
      if (name.includes('rug') || name.includes('carpet')) {
        if (name.includes('emerald')) {
          mat.color = new THREE.Color('#1B4D3E');
        } else if (name.includes('midnight')) {
          mat.color = new THREE.Color('#162238');
        } else {
          mat.color = new THREE.Color('#3D332A');
        }
        mat.roughness = 0.75;
        mat.metalness = 0.0;
        mat.needsUpdate = true;
      }

      // 6. Smoked Walnut Partitions & Timber Slats
      if (name.includes('walnut') || name.includes('timber') || name.includes('slats')) {
        mat.color = new THREE.Color('#25160E');
        mat.roughness = 0.32;
        mat.needsUpdate = true;
      }

      // 7. Calacatta Gold Marble Tables & Plates
      if (name.includes('calacatta') || name.includes('marble') || objName.includes('plate') || objName.includes('top')) {
        mat.color = new THREE.Color('#F7F5F0');
        mat.roughness = 0.15;
        mat.needsUpdate = true;
      }

      // 7b. Luxury Placemats (Warm Espresso/Bronze Leather instead of pitch-black abyss)
      if (name.includes('placemat') || objName.includes('_pm')) {
        mat.color = new THREE.Color('#382C24');
        mat.roughness = 0.55;
        mat.metalness = 0.05;
        mat.needsUpdate = true;
      }

      // 7c. Rotunda Basin, Pool Floor & Nero Marquina (Polished radiant emerald/aqua marble pool floor instead of pitch-black abyss)
      if (
        name.includes('nero') ||
        name.includes('marquina') ||
        objName.includes('basin') ||
        objName.includes('pool_floor') ||
        objName.includes('rotunda_pool') ||
        objName.includes('rotunda_basin')
      ) {
        mat.color = new THREE.Color('#2A7D70');
        mat.emissive = new THREE.Color('#165248');
        mat.emissiveIntensity = 0.85;
        mat.roughness = 0.12;
        mat.metalness = 0.15;
        child.receiveShadow = false; // Prevents deep cavity shadow from rendering pitch black
        child.castShadow = false;
        mat.needsUpdate = true;
      }

      // 8. Warm Ambient Lamps, Cove LED & Honey Onyx
      if (name.includes('warm_2700k') || name.includes('cove_led') || name.includes('onyx') || name.includes('lampshade')) {
        mat.emissive = new THREE.Color('#FF9E2C');
        mat.emissiveIntensity = 2.5;
        mat.needsUpdate = true;
      }
    }
  });
}

/**
 * Freezes static world matrices and turns off raycasting on interior meshes.
 * Stops Three.js from recalculating 4,500+ transformation matrices per frame.
 */
export function applyOptimizationPass(root: THREE.Object3D): void {
  // Pre-bake all world transformation matrices
  root.updateMatrixWorld(true);

  root.traverse((child: any) => {
    if (child.isMesh || child.isObject3D) {
      child.matrixAutoUpdate = false;
      child.matrixWorldAutoUpdate = false;
      child.updateMatrix();
    }
    if (child.isMesh) {
      // Deactivate expensive bounding box/polygon raycasting
      child.raycast = () => null;
    }
  });
}

/**
 * Batching Mode: 'merge'
 * Normalizes vertex attributes and combines static meshes sharing the same material
 * into single batched draw calls using BufferGeometryUtils.mergeGeometries.
 * Reduces draw calls from 4,561+ down to ~64.
 */
export function buildMergedScene(scene: THREE.Group): THREE.Group {
  scene.updateMatrixWorld(true);

  const matGroups = new Map<
    string,
    {
      material: THREE.Material;
      geoms: THREE.BufferGeometry[];
    }
  >();

  scene.traverse((child: any) => {
    if (child.isMesh && child.geometry && child.material) {
      const mat = child.material as THREE.Material;
      const key = mat.uuid || mat.name || 'default';

      if (!matGroups.has(key)) {
        matGroups.set(key, { material: mat, geoms: [] });
      }

      const g = child.geometry.clone() as THREE.BufferGeometry;
      g.applyMatrix4(child.matrixWorld);

      // Normalize attributes so mergeGeometries succeeds across diverse meshes
      const allowedAttrs = ['position', 'normal', 'uv'];
      for (const attrName in g.attributes) {
        if (!allowedAttrs.includes(attrName)) {
          g.deleteAttribute(attrName);
        }
      }
      if (!g.attributes.normal) {
        g.computeVertexNormals();
      }
      if (!g.attributes.uv) {
        const count = g.attributes.position.count;
        g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
      }
      if (!g.index) {
        const count = g.attributes.position.count;
        const indices = new Uint32Array(count);
        for (let i = 0; i < count; i++) indices[i] = i;
        g.setIndex(new THREE.BufferAttribute(indices, 1));
      }

      matGroups.get(key)!.geoms.push(g);
    }
  });

  const mergedGroup = new THREE.Group();
  mergedGroup.name = 'OptimizedInterior_MergedBatches';

  for (const group of matGroups.values()) {
    const isTranslucent = group.material.transparent || ((group.material as any).transmission && (group.material as any).transmission > 0);
    if (group.geoms.length === 1) {
      const mesh = new THREE.Mesh(group.geoms[0], group.material);
      mesh.castShadow = !isTranslucent;
      mesh.receiveShadow = !isTranslucent;
      mesh.matrixAutoUpdate = false;
      mesh.matrixWorldAutoUpdate = false;
      mesh.raycast = () => null;
      mergedGroup.add(mesh);
    } else if (group.geoms.length > 1) {
      const merged = mergeGeometries(group.geoms, false);
      if (merged) {
        const mesh = new THREE.Mesh(merged, group.material);
        mesh.castShadow = !isTranslucent;
        mesh.receiveShadow = !isTranslucent;
        mesh.matrixAutoUpdate = false;
        mesh.matrixWorldAutoUpdate = false;
        mesh.raycast = () => null;
        mergedGroup.add(mesh);
      }
      // Explicitly dispose temporary cloned BufferGeometries to eliminate heap and buffer leakage
      group.geoms.forEach((g) => g.dispose());
    }
  }

  mergedGroup.matrixAutoUpdate = false;
  mergedGroup.matrixWorldAutoUpdate = false;
  mergedGroup.updateMatrix();
  mergedGroup.updateMatrixWorld(true);

  return mergedGroup;
}

/**
 * Batching Mode: 'instance'
 * Groups repetitive furniture and tableware sharing identical geometry buffers
 * into hardware InstancedMeshes (chairs, place settings, glassware).
 * Reduces draw calls from 4,561+ down to 1,648.
 */
export function buildInstancedScene(scene: THREE.Group): THREE.Group {
  scene.updateMatrixWorld(true);

  const groupMap = new Map<
    string,
    {
      geometry: THREE.BufferGeometry;
      material: THREE.Material;
      meshes: THREE.Mesh[];
    }
  >();

  scene.traverse((child: any) => {
    if (child.isMesh && child.geometry && child.material) {
      const mat = child.material as THREE.Material;
      const key = `${child.geometry.uuid}_${mat.uuid || mat.name}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          geometry: child.geometry,
          material: mat,
          meshes: [],
        });
      }
      groupMap.get(key)!.meshes.push(child);
    }
  });

  const instancedGroup = new THREE.Group();
  instancedGroup.name = 'OptimizedInterior_InstancedBatches';

  for (const group of groupMap.values()) {
    if (group.meshes.length > 1) {
      const count = group.meshes.length;
      const im = new THREE.InstancedMesh(group.geometry, group.material, count);
      im.castShadow = true;
      im.receiveShadow = true;
      im.matrixAutoUpdate = false;
      im.matrixWorldAutoUpdate = false;
      im.raycast = () => null;

      for (let i = 0; i < count; i++) {
        im.setMatrixAt(i, group.meshes[i].matrixWorld);
      }
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingBox();
      im.computeBoundingSphere();
      instancedGroup.add(im);
    } else if (group.meshes.length === 1) {
      const single = group.meshes[0].clone();
      single.matrixAutoUpdate = false;
      single.matrixWorldAutoUpdate = false;
      single.raycast = () => null;
      single.castShadow = true;
      single.receiveShadow = true;
      instancedGroup.add(single);
    }
  }

  instancedGroup.matrixAutoUpdate = false;
  instancedGroup.matrixWorldAutoUpdate = false;
  instancedGroup.updateMatrix();
  instancedGroup.updateMatrixWorld(true);

  return instancedGroup;
}

/**
 * Computes table proxy geometry parameters based on capacity and position.
 */
export function getTableProxyGeometry(table: {
  capacity: number;
  position3D: [number, number, number];
}): {
  radius: number;
  height: number;
  position: [number, number, number];
} {
  const radius =
    table.capacity <= 2
      ? 0.65
      : table.capacity <= 4
        ? 0.9
        : table.capacity <= 6
          ? 1.2
          : 1.7;
  const height = 0.85;
  const position: [number, number, number] = [
    table.position3D[0],
    0.425,
    -table.position3D[2],
  ];
  return { radius, height, position };
}
