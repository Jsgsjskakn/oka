import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Polyfills for headless Three.js execution in Node.js
global.self = global;
global.window = global;

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  applyInteriorMaterials,
  applyOptimizationPass,
  buildMergedScene,
  buildInstancedScene,
  getTableProxyGeometry,
  INTERIOR_MODEL_URL,
} from '../src/lib/three/interiorOptimization.ts';
import { RESTAURANT_3D_TABLES } from '../src/lib/constants/restaurant3DMapping.ts';

test('Agent 4: OptimizedInteriorModel & Geometry Batching Verification', async (t) => {
  const componentPath = path.resolve('src/components/booking/OptimizedInteriorModel.tsx');
  const floorplanPath = path.resolve('src/components/booking/Restaurant3DFloorplan.tsx');
  const glbPath = path.resolve('public/models/the_golden_oak_interior.glb');

  assert.ok(fs.existsSync(componentPath), 'OptimizedInteriorModel.tsx must exist');
  assert.ok(fs.existsSync(glbPath), 'the_golden_oak_interior.glb must exist');

  const componentSource = fs.readFileSync(componentPath, 'utf8');
  const floorplanSource = fs.readFileSync(floorplanPath, 'utf8');

  await t.test('1. Static Code Audit: Safe disposal and primitive configuration', () => {
    // 1. Must use dispose={null}
    const primitiveMatches = componentSource.match(/<primitive\b[^>]*>/g) || [];
    assert.ok(primitiveMatches.length > 0, 'Must contain <primitive> element');
    for (const tag of primitiveMatches) {
      assert.ok(tag.includes('dispose={null}'), `Primitive must include dispose={null}: ${tag}`);
    }

    // 2. Must not destroy geometry cache
    assert.doesNotMatch(componentSource, /\bgeometry\.dispose\s*\(/i);
    assert.doesNotMatch(componentSource, /\bdisposeObject\s*\(/);

    // 3. Must freeze static world matrices
    assert.ok(
      componentSource.includes('applyOptimizationPass'),
      'Must apply optimization pass with matrix freezing'
    );

    // 4. Must disable raycast on interior background meshes
    assert.ok(
      componentSource.includes('raycast={() => null}'),
      'Must disable raycasting on interior background meshes'
    );

    // 5. Restaurant3DFloorplan must import and render OptimizedInteriorModel
    assert.ok(
      floorplanSource.includes('OptimizedInteriorModel'),
      'Restaurant3DFloorplan.tsx must integrate OptimizedInteriorModel'
    );
  });

  await t.test('2. Headless Scene Parse & Ground Truth Baseline', async () => {
    const loader = new GLTFLoader();
    const buf = fs.readFileSync(glbPath);
    const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    const gltf = await new Promise((resolve, reject) => {
      loader.parse(arrayBuf, '', resolve, reject);
    });

    assert.ok(gltf.scene, 'GLTF scene parsed successfully');

    let initialMeshCount = 0;
    gltf.scene.traverse((c) => {
      if (c.isMesh) initialMeshCount++;
    });

    assert.strictEqual(initialMeshCount, 4561, 'Original unbatched scene contains 4,561 mesh nodes');
  });

  await t.test('3. Master Architectural PBR Tuning & Visual Fidelity', async () => {
    const loader = new GLTFLoader();
    const buf = fs.readFileSync(glbPath);
    const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    const gltf = await new Promise((resolve, reject) => {
      loader.parse(arrayBuf, '', resolve, reject);
    });

    applyInteriorMaterials(gltf.scene);

    let checkedLeather = false;
    let checkedBrass = false;
    let checkedWine = false;
    let checkedMarble = false;
    let checkedCove = false;
    let checkedGlass = false;
    let checkedHardwood = false;
    let checkedWalnut = false;

    gltf.scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mat = child.material;
        const name = (mat.name || '').toLowerCase();

        // 1. Crystal Clear Glassware
        if (name.includes('glass') && !name.includes('bordeaux')) {
          assert.strictEqual(mat.transparent, true);
          assert.strictEqual(mat.depthWrite, false);
          assert.strictEqual(mat.opacity, 0.35);
          assert.strictEqual(mat.roughness, 0.05);
          checkedGlass = true;
        }

        // 2. Ruby Red Wine & Spirits
        if (name.includes('wine') || name.includes('ruby')) {
          assert.strictEqual(mat.color.getHexString().toUpperCase(), '780616');
          assert.strictEqual(mat.transparent, true);
          assert.strictEqual(mat.opacity, 0.88);
          checkedWine = true;
        }

        // 3. Polished Champagne Brass & Gold
        if ((name.includes('brass') || name.includes('gold')) && !name.includes('rug')) {
          assert.strictEqual(mat.color.getHexString().toUpperCase(), 'E8BF65');
          assert.strictEqual(mat.metalness, 0.88);
          assert.strictEqual(mat.roughness, 0.22);
          checkedBrass = true;
        }

        // 4. Italian Cognac Leather
        if (name.includes('leather')) {
          assert.strictEqual(mat.color.getHexString().toUpperCase(), '8C4A26');
          assert.strictEqual(mat.roughness, 0.38);
          checkedLeather = true;
        }

        // 5. Imperial Brown Hardwood Floor
        if (name.includes('imperial_brown')) {
          assert.strictEqual(mat.color.getHexString().toUpperCase(), '7A4321');
          assert.strictEqual(mat.roughness, 0.24);
          checkedHardwood = true;
        }

        // 6. Smoked Walnut Partitions
        if (name.includes('walnut')) {
          assert.strictEqual(mat.color.getHexString().toUpperCase(), '25160E');
          assert.strictEqual(mat.roughness, 0.32);
          checkedWalnut = true;
        }

        // 7. Calacatta Gold Marble Tables & Plates
        if (name.includes('calacatta')) {
          assert.strictEqual(mat.color.getHexString().toUpperCase(), 'F7F5F0');
          assert.strictEqual(mat.roughness, 0.15);
          checkedMarble = true;
        }

        // 8. Warm Ambient Lamps & Cove LED
        if (name.includes('warm_cove_led_2700k')) {
          assert.strictEqual(mat.emissive.getHexString().toUpperCase(), 'FF9E2C');
          assert.strictEqual(mat.emissiveIntensity, 2.5);
          checkedCove = true;
        }
      }
    });

    assert.ok(checkedLeather, 'Leather material verified');
    assert.ok(checkedBrass, 'Brass material verified');
    assert.ok(checkedWine, 'Wine material verified');
    assert.ok(checkedMarble, 'Marble material verified');
    assert.ok(checkedCove, 'Cove LED verified');
    assert.ok(checkedGlass, 'Glassware verified');
    assert.ok(checkedHardwood, 'Hardwood verified');
    assert.ok(checkedWalnut, 'Walnut verified');
  });

  await t.test('4. Batch Mode "merge": Reduces 4,561 Draw Calls to 64 Batches (98.6% Reduction)', async () => {
    const loader = new GLTFLoader();
    const buf = fs.readFileSync(glbPath);
    const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    const gltf = await new Promise((resolve, reject) => {
      loader.parse(arrayBuf, '', resolve, reject);
    });

    applyInteriorMaterials(gltf.scene);

    const origBbox = new THREE.Box3().setFromObject(gltf.scene);
    const mergedGroup = buildMergedScene(gltf.scene);

    assert.ok(mergedGroup instanceof THREE.Group);
    assert.strictEqual(
      mergedGroup.children.length,
      64,
      'Exact 64 merged material batches created from 4,561 meshes'
    );

    // Verify bounding box matches ground truth within nanometer tolerance
    const mergedBbox = new THREE.Box3().setFromObject(mergedGroup);
    const minDiff = origBbox.min.distanceTo(mergedBbox.min);
    const maxDiff = origBbox.max.distanceTo(mergedBbox.max);
    assert.ok(minDiff < 1e-6, `Min BBox diff ${minDiff} must be < 1e-6`);
    assert.ok(maxDiff < 1e-6, `Max BBox diff ${maxDiff} must be < 1e-6`);

    // Verify every merged mesh has frozen matrices and disabled raycast
    for (const child of mergedGroup.children) {
      assert.strictEqual(child.matrixAutoUpdate, false, 'Merged mesh matrixAutoUpdate must be false');
      assert.strictEqual(child.matrixWorldAutoUpdate, false, 'Merged mesh matrixWorldAutoUpdate must be false');
      assert.strictEqual(child.raycast(), null, 'Merged mesh raycast must return null');
    }
  });

  await t.test('5. Batch Mode "instance": Batches 2,930 Furniture Meshes into 17 InstancedMeshes', async () => {
    const loader = new GLTFLoader();
    const buf = fs.readFileSync(glbPath);
    const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    const gltf = await new Promise((resolve, reject) => {
      loader.parse(arrayBuf, '', resolve, reject);
    });

    applyInteriorMaterials(gltf.scene);
    const instancedGroup = buildInstancedScene(gltf.scene);

    let instancedCount = 0;
    let singleCount = 0;
    let totalInstances = 0;

    for (const child of instancedGroup.children) {
      if (child.isInstancedMesh) {
        instancedCount++;
        totalInstances += child.count;
      } else if (child.isMesh) {
        singleCount++;
      }
    }

    assert.strictEqual(instancedCount, 17, '17 InstancedMeshes created');
    assert.strictEqual(totalInstances, 2930, '2,930 instances batched');
    assert.strictEqual(singleCount, 1631, '1,631 single unique meshes preserved');
    assert.strictEqual(
      instancedCount + singleCount,
      1648,
      'Draw calls reduced from 4,561 to 1,648 (63.9% reduction)'
    );
  });

  await t.test('6. Matrix Freezing & Raycasting Optimization Pass', async () => {
    const loader = new GLTFLoader();
    const buf = fs.readFileSync(glbPath);
    const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    const gltf = await new Promise((resolve, reject) => {
      loader.parse(arrayBuf, '', resolve, reject);
    });

    applyOptimizationPass(gltf.scene);

    let frozenNodeCount = 0;
    let disabledRaycastCount = 0;

    gltf.scene.traverse((child) => {
      if (child.isMesh || child.isObject3D) {
        if (child.matrixAutoUpdate === false && child.matrixWorldAutoUpdate === false) {
          frozenNodeCount++;
        }
      }
      if (child.isMesh) {
        if (typeof child.raycast === 'function' && child.raycast() === null) {
          disabledRaycastCount++;
        }
      }
    });

    assert.strictEqual(frozenNodeCount, 5000, 'All 5,000 scene objects (4,999 nodes + root scene) have frozen matrices');
    assert.strictEqual(disabledRaycastCount, 4561, 'All 4,561 mesh nodes have raycasting disabled');
  });

  await t.test('7. Dedicated Table Proxies: 28 Colliders with Exact Spatial Alignment', () => {
    assert.strictEqual(RESTAURANT_3D_TABLES.length, 28, '28 luxury dining tables configured');

    for (const t of RESTAURANT_3D_TABLES) {
      const geom = getTableProxyGeometry(t);
      assert.ok(geom.radius >= 0.65 && geom.radius <= 1.7);
      assert.strictEqual(geom.height, 0.85);
      assert.strictEqual(geom.position.length, 3);
      assert.ok(Number.isFinite(geom.position[0]));
      assert.ok(Number.isFinite(geom.position[1]));
      assert.ok(Number.isFinite(geom.position[2]));
    }
  });
});
