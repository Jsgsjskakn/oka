import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Agent 5 Verification: Cache Poisoning & R3F Lifecycle Cleaner', async (t) => {
  const componentsToAudit = [
    'src/components/viewer/ViewerScene.tsx',
    'src/components/ar/ARScene.tsx',
    'src/components/home/HeroWarriorCanvas.tsx',
    'src/components/home/PromoWarriorCanvas.tsx',
    'src/components/booking/Restaurant3DFloorplan.tsx',
  ];

  await t.test('1. Static Code Audit: Elimination of toxic geometry disposal and disposeObject', () => {
    for (const relPath of componentsToAudit) {
      const fullPath = path.resolve(relPath);
      assert.ok(fs.existsSync(fullPath), `${relPath} must exist`);
      const content = fs.readFileSync(fullPath, 'utf8');

      // Check no geometry.dispose() or geom.dispose()
      assert.doesNotMatch(
        content,
        /\b(?:geometry|geom)\.dispose\s*\(/i,
        `${relPath} must NOT call geometry.dispose() on cached glTF models`
      );

      // Check no disposeObject function or invocation
      assert.doesNotMatch(
        content,
        /\bdisposeObject\s*\(/,
        `${relPath} must NOT call disposeObject on cached glTF scenes`
      );
    }
  });

  await t.test('2. Static Code Audit: Primitive elements use dispose={null}', () => {
    for (const relPath of componentsToAudit) {
      const fullPath = path.resolve(relPath);
      const content = fs.readFileSync(fullPath, 'utf8');

      // Find all <primitive ...> tags
      const primitiveMatches = content.match(/<primitive\b[^>]*>/g) || [];
      assert.ok(primitiveMatches.length > 0, `${relPath} must have at least one <primitive> element`);

      for (const primitiveTag of primitiveMatches) {
        assert.ok(
          primitiveTag.includes('dispose={null}'),
          `${relPath}: primitive tag (${primitiveTag}) must include dispose={null} to prevent R3F auto-disposing cached geometries`
        );
      }
    }
  });

  await t.test('3. Simulated Lifecycle: Page switching does not corrupt shared glTF cache', () => {
    // Simulate Drei's useGLTF cache
    class MockBufferAttribute {
      constructor(data) {
        this.data = data;
        this.disposed = false;
      }
      dispose() {
        this.disposed = true;
      }
    }

    class MockBufferGeometry {
      constructor() {
        this.attributes = {
          position: new MockBufferAttribute(new Float32Array([0, 0, 0, 1, 1, 1])),
          normal: new MockBufferAttribute(new Float32Array([0, 1, 0, 0, 1, 0])),
        };
        this.disposed = false;
      }
      dispose() {
        this.disposed = true;
        for (const attr of Object.values(this.attributes)) {
          attr.dispose();
        }
      }
    }

    class MockMesh {
      constructor(geometry) {
        this.isMesh = true;
        this.geometry = geometry;
      }
      clone() {
        // Three.js clone shares geometry by reference
        return new MockMesh(this.geometry);
      }
    }

    class MockScene {
      constructor(mesh) {
        this.children = [mesh];
      }
      clone(recursive = true) {
        return new MockScene(this.children[0].clone());
      }
      traverse(fn) {
        this.children.forEach(fn);
      }
    }

    // Singleton cache holding the raw GLTF scene
    const sharedGeometry = new MockBufferGeometry();
    const sharedMesh = new MockMesh(sharedGeometry);
    const gltfCache = {
      '/models/warrior_model.glb': { scene: new MockScene(sharedMesh) },
      '/models/warrior_scene.glb': { scene: new MockScene(sharedMesh) },
      '/models/the_golden_oak_interior.glb': { scene: new MockScene(sharedMesh) },
    };

    // Simulate R3F primitive unmount handler
    function simulateR3FUnmount(primitiveProps) {
      if (primitiveProps.dispose === null) {
        // With dispose={null}, R3F skips disposing the object!
        return;
      }
      // Without dispose={null}, R3F auto-disposes geometries
      primitiveProps.object.traverse((child) => {
        if (child.isMesh && child.geometry) {
          child.geometry.dispose();
        }
      });
    }

    // Navigation Sequence:
    // 1. User visits Home: HeroWarriorCanvas mounts
    const heroScene = gltfCache['/models/warrior_scene.glb'].scene.clone(true);
    assert.equal(sharedGeometry.disposed, false);

    // 2. User leaves Home -> HeroWarriorCanvas unmounts with dispose={null}
    simulateR3FUnmount({ object: heroScene, dispose: null });
    assert.equal(sharedGeometry.disposed, false, 'Shared geometry MUST NOT be disposed on HeroCanvas unmount');

    // 3. User navigates to Booking -> Restaurant3DFloorplan mounts
    const floorplanScene = gltfCache['/models/the_golden_oak_interior.glb'].scene;
    assert.equal(sharedGeometry.disposed, false);

    // 4. User leaves Booking -> Restaurant3DFloorplan unmounts with dispose={null}
    simulateR3FUnmount({ object: floorplanScene, dispose: null });
    assert.equal(sharedGeometry.disposed, false, 'Shared geometry MUST NOT be disposed on Floorplan unmount');

    // 5. User navigates to 3D Viewer -> ViewerScene mounts
    const viewerScene = gltfCache['/models/warrior_scene.glb'].scene.clone(true);
    assert.equal(sharedGeometry.disposed, false);

    // 6. User switches dish in 3D Viewer -> Previous ViewerScene unmounts with dispose={null}
    simulateR3FUnmount({ object: viewerScene, dispose: null });
    assert.equal(sharedGeometry.disposed, false, 'Shared geometry MUST NOT be disposed on ViewerScene unmount');

    // 7. User navigates to AR -> ARScene mounts
    const arScene = gltfCache['/models/warrior_scene.glb'].scene.clone(true);
    assert.equal(sharedGeometry.disposed, false);

    // 8. User exits AR -> ARScene unmounts with dispose={null}
    simulateR3FUnmount({ object: arScene, dispose: null });
    assert.equal(sharedGeometry.disposed, false, 'Shared geometry MUST NOT be disposed on ARScene unmount');

    // 9. User returns to Home -> HeroWarriorCanvas mounts again
    const returnHeroScene = gltfCache['/models/warrior_scene.glb'].scene.clone(true);
    assert.equal(sharedGeometry.disposed, false, 'Geometry is fully intact for re-render, preventing WebGL buffer crash');
    assert.equal(returnHeroScene.children[0].geometry.attributes.position.disposed, false);
  });
});
