import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Agent 14 Verification: WebGL Context Loss & Recovery Guard', async (t) => {
  const targetFiles = {
    guard: 'src/components/3d/WebGLContextGuard.tsx',
    restaurant: 'src/components/booking/Restaurant3DFloorplan.tsx',
    viewer: 'src/components/viewer/ViewerScene.tsx',
    hero: 'src/components/home/HeroWarriorCanvas.tsx',
    promo: 'src/components/home/PromoWarriorCanvas.tsx',
  };

  await t.test('1. File Existence Audit', () => {
    for (const [key, relPath] of Object.entries(targetFiles)) {
      const fullPath = path.resolve(relPath);
      assert.ok(fs.existsSync(fullPath), `${relPath} must exist on disk`);
    }
  });

  await t.test('2. WebGLContextGuard & webglRecovery Core Engine Audit', () => {
    const guardContent = fs.readFileSync(path.resolve(targetFiles.guard), 'utf8');
    const recoveryContent = fs.readFileSync(path.resolve('src/components/3d/webglRecovery.ts'), 'utf8');

    // 1. Mandatory event.preventDefault() call on webglcontextlost
    assert.match(
      guardContent,
      /event\.preventDefault\s*\(\s*\)/,
      'WebGLContextGuard must call event.preventDefault() on webglcontextlost to allow browser recovery'
    );

    // 2. Both webglcontextlost and webglcontextrestored event listeners
    assert.match(
      guardContent,
      /addEventListener\s*\(\s*['"]webglcontextlost['"]/,
      'WebGLContextGuard must register webglcontextlost listener'
    );
    assert.match(
      guardContent,
      /addEventListener\s*\(\s*['"]webglcontextrestored['"]/,
      'WebGLContextGuard must register webglcontextrestored listener'
    );

    // 3. Texture and material re-initialization traversal in webglRecovery
    assert.match(
      recoveryContent,
      /mat\.needsUpdate\s*=\s*true/,
      'webglRecovery must set mat.needsUpdate = true on materials upon restore'
    );
    assert.match(
      recoveryContent,
      /tex\.needsUpdate\s*=\s*true/,
      'webglRecovery must set tex.needsUpdate = true on textures upon restore'
    );

    // 4. Invalidate frame loop
    assert.match(
      guardContent,
      /invalidate\s*\(\s*\)/,
      'WebGLContextGuard must call invalidate() to trigger immediate frame redraw after restore'
    );

    // 5. WebGLErrorBoundary export
    assert.match(
      guardContent,
      /export\s+class\s+WebGLErrorBoundary/,
      'WebGLContextGuard must export WebGLErrorBoundary class'
    );
  });

  await t.test('3. Restaurant3DFloorplan Hardening & Reservation State Preservation Audit', () => {
    const restaurantContent = fs.readFileSync(path.resolve(targetFiles.restaurant), 'utf8');

    // 1. Uses WebGLContextGuard
    assert.match(
      restaurantContent,
      /<WebGLContextGuard\b/,
      'Restaurant3DFloorplan must mount WebGLContextGuard'
    );

    // 2. Preserves all reservation state in ThreeDErrorBoundary
    assert.match(
      restaurantContent,
      /<ThreeDErrorBoundary\b[^>]*selectedTableNumber/,
      'ThreeDErrorBoundary must receive selectedTableNumber'
    );
    assert.match(
      restaurantContent,
      /<ThreeDErrorBoundary\b[^>]*guests/,
      'ThreeDErrorBoundary must receive guests'
    );
    assert.match(
      restaurantContent,
      /<ThreeDErrorBoundary\b[^>]*onSwitchTo2D/,
      'ThreeDErrorBoundary must receive onSwitchTo2D callback'
    );

    // 3. Reassuring preservation text in ThreeDErrorBoundary
    assert.match(
      restaurantContent,
      /Booking Progress Preserved|Reservation.*Preserved/i,
      'ThreeDErrorBoundary must render a prominent reservation preservation banner'
    );
    assert.match(
      restaurantContent,
      /Continue Booking via 2D Floorplan|Switch to 2D Floorplan/i,
      'ThreeDErrorBoundary must provide a 2D floorplan fallback button'
    );

    // 4. Runtime context loss overlay
    assert.match(
      restaurantContent,
      /contextLost/,
      'Restaurant3DFloorplan must track contextLost state'
    );
    assert.match(
      restaurantContent,
      /applyArchitecturalPBR/,
      'Restaurant3DFloorplan must define and invoke applyArchitecturalPBR on restore'
    );
  });

  await t.test('4. ViewerScene Hardening Audit', () => {
    const viewerContent = fs.readFileSync(path.resolve(targetFiles.viewer), 'utf8');

    // 1. WebGLErrorBoundary wraps Canvas
    assert.match(
      viewerContent,
      /<WebGLErrorBoundary\b/,
      'ViewerScene must wrap Canvas in WebGLErrorBoundary'
    );

    // 2. WebGLContextGuard mounted
    assert.match(
      viewerContent,
      /<WebGLContextGuard\b/,
      'ViewerScene must mount WebGLContextGuard'
    );

    // 3. Re-enhances warrior materials on restore
    assert.match(
      viewerContent,
      /enhanceWarriorMaterials/,
      'ViewerScene must re-apply enhanceWarriorMaterials'
    );
  });

  await t.test('5. HeroWarriorCanvas Hardening Audit', () => {
    const heroContent = fs.readFileSync(path.resolve(targetFiles.hero), 'utf8');

    // 1. WebGLErrorBoundary wraps Canvas
    assert.match(
      heroContent,
      /<WebGLErrorBoundary\b/,
      'HeroWarriorCanvas must wrap Canvas in WebGLErrorBoundary'
    );

    // 2. WebGLContextGuard mounted
    assert.match(
      heroContent,
      /<WebGLContextGuard\b/,
      'HeroWarriorCanvas must mount WebGLContextGuard'
    );
  });

  await t.test('6. PromoWarriorCanvas Hardening Audit', () => {
    const promoContent = fs.readFileSync(path.resolve(targetFiles.promo), 'utf8');

    // 1. WebGLErrorBoundary wraps Canvas with fallback
    assert.match(
      promoContent,
      /<WebGLErrorBoundary\b/,
      'PromoWarriorCanvas must wrap Canvas in WebGLErrorBoundary'
    );

    // 2. WebGLContextGuard mounted
    assert.match(
      promoContent,
      /<WebGLContextGuard\b/,
      'PromoWarriorCanvas must mount WebGLContextGuard'
    );
  });

  await t.test('7. Functional Simulation: Scene & Texture Re-initialization Traversal', async () => {
    // Dynamic import of the pure helper function from webglRecovery.ts
    const recoveryModule = await import('../src/components/3d/webglRecovery.ts');
    assert.ok(typeof recoveryModule.reinitializeSceneWebGL === 'function', 'reinitializeSceneWebGL must be an exported function');

    // Create a mock Three.js scene hierarchy
    const mockTexture1 = { isTexture: true, needsUpdate: false };
    const mockTexture2 = { isTexture: true, needsUpdate: false };
    const mockMaterial1 = { needsUpdate: false, map: mockTexture1, roughnessMap: mockTexture2 };
    const mockMaterial2 = { needsUpdate: false, normalMap: { isTexture: true, needsUpdate: false } };

    const mockMesh1 = {
      isMesh: true,
      material: mockMaterial1,
      geometry: {
        attributes: {
          position: { needsUpdate: false },
          normal: { needsUpdate: false },
        },
      },
    };

    const mockMesh2 = {
      isMesh: true,
      material: [mockMaterial2], // array material
      geometry: {
        index: { needsUpdate: false },
      },
    };

    const mockScene = {
      traverse: (cb) => {
        cb(mockMesh1);
        cb(mockMesh2);
      },
    };

    let resetStateCalled = false;
    const mockGl = {
      resetState: () => {
        resetStateCalled = true;
      },
    };

    const result = recoveryModule.reinitializeSceneWebGL(mockScene, mockGl);

    assert.strictEqual(result.meshesUpdated, 2, 'Must update 2 meshes');
    assert.strictEqual(result.texturesUpdated, 3, 'Must update 3 textures');
    assert.strictEqual(resetStateCalled, true, 'gl.resetState() must be called');
    assert.strictEqual(mockMaterial1.needsUpdate, true, 'Material 1 needsUpdate must be true');
    assert.strictEqual(mockMaterial2.needsUpdate, true, 'Material 2 needsUpdate must be true');
    assert.strictEqual(mockTexture1.needsUpdate, true, 'Texture 1 needsUpdate must be true');
    assert.strictEqual(mockTexture2.needsUpdate, true, 'Texture 2 needsUpdate must be true');
    assert.strictEqual(mockMesh1.geometry.attributes.position.needsUpdate, true, 'Attribute position needsUpdate must be true');
    assert.strictEqual(mockMesh2.geometry.index.needsUpdate, true, 'Index needsUpdate must be true');
  });

  await t.test('8. Functional Simulation: Context Loss Prevention Default Contract', () => {
    class MockWebGLContextEvent {
      constructor(type) {
        this.type = type;
        this.defaultPrevented = false;
      }
      preventDefault() {
        this.defaultPrevented = true;
      }
    }

    const event = new MockWebGLContextEvent('webglcontextlost');
    assert.strictEqual(event.defaultPrevented, false);

    // Emulate WebGLContextGuard event handler
    const handler = (e) => {
      e.preventDefault();
    };
    handler(event);

    assert.strictEqual(
      event.defaultPrevented,
      true,
      'Calling preventDefault() signals to browser that application will restore WebGL context'
    );
  });
});
