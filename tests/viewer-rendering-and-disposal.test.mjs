import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import {
  TEXTURE_MAP_SLOTS,
  cloneSceneWithIsolatedMaterials,
  disposeInstanceClone,
  disposeFullObject3D,
  getRendererMemorySnapshot,
  tagInstanceTexture,
  tagProceduralGeometry,
} from '../src/lib/three/resource-disposal.ts';

describe('Agent 4: 3D Dish Viewer, Deterministic GPU Disposal & On-Demand Rendering', () => {
  const rootDir = process.cwd();
  const viewerScenePath = path.join(rootDir, 'src/components/viewer/ViewerScene.tsx');
  const threeDViewerPath = path.join(rootDir, 'src/components/viewer/ThreeDViewer.tsx');
  const viewerControlsPath = path.join(rootDir, 'src/components/viewer/ViewerControls.tsx');
  const safeShadowsPath = path.join(rootDir, 'src/components/3d/SafeContactShadows.tsx');
  const demandControllerPath = path.join(rootDir, 'src/components/3d/DemandFrameloopController.tsx');

  describe('1. Deterministic GPU Resource Disposal Engine (resource-disposal.ts)', () => {
    it('cloneSceneWithIsolatedMaterials isolates materials while sharing cached geometries & textures and enabling frustum culling', () => {
      const sharedGeom = new THREE.BufferGeometry();
      sharedGeom.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), 3)
      );
      // Confirm boundingSphere starts null before cloning
      assert.equal(sharedGeom.boundingSphere, null);

      const sharedColorMap = new THREE.Texture();
      const sharedMat = new THREE.MeshStandardMaterial({
        name: 'Gold_Trim_Mat',
        color: 0xffffff,
        map: sharedColorMap,
      });

      const meshA = new THREE.Mesh(sharedGeom, sharedMat);
      meshA.frustumCulled = false;
      const meshB = new THREE.Mesh(sharedGeom, sharedMat);
      const cachedGltfScene = new THREE.Group();
      cachedGltfScene.add(meshA, meshB);

      const instanceClone = cloneSceneWithIsolatedMaterials(cachedGltfScene);
      const clonedMeshes = [];
      instanceClone.traverse((c) => {
        if (c.isMesh) clonedMeshes.push(c);
      });

      assert.equal(clonedMeshes.length, 2, 'Should clone both meshes');

      // 1. Geometries & textures remain shared by reference with useGLTF cache
      assert.strictEqual(clonedMeshes[0].geometry, sharedGeom, 'Must share cached BufferGeometry');
      assert.strictEqual(clonedMeshes[0].material.map, sharedColorMap, 'Must share cached Texture');
      assert.notEqual(sharedGeom.boundingSphere, null, 'Must precompute boundingSphere for frustum culling');
      assert.equal(clonedMeshes[0].frustumCulled, true, 'Must enforce frustumCulled = true');

      // 2. Materials are isolated clones (and deduplicated within the same instance)
      assert.notStrictEqual(clonedMeshes[0].material, sharedMat, 'Must isolate Material from glTF cache');
      assert.strictEqual(
        clonedMeshes[0].material,
        clonedMeshes[1].material,
        'Should deduplicate shared palette materials within the same cloned scene'
      );
      assert.equal(clonedMeshes[0].material.userData.__isInstanceClone, true);

      // 3. Mutating instance clone material does NOT pollute cached glTF material
      clonedMeshes[0].material.color.setHex(0xff0000);
      assert.equal(sharedMat.color.getHex(), 0xffffff, 'Cached glTF material must remain untouched');
    });

    it('disposeInstanceClone disposes cloned materials, tagged textures & procedural geometries while keeping shared glTF cache 100% intact', () => {
      let sharedGeomDisposed = false;
      let sharedTexDisposed = false;
      let customTexDisposed = false;
      let procGeomDisposed = false;
      let sharedMatDisposed = false;

      const sharedGeom = new THREE.BoxGeometry(1, 1, 1);
      const origSharedGeomDispose = sharedGeom.dispose.bind(sharedGeom);
      sharedGeom.dispose = () => {
        sharedGeomDisposed = true;
        origSharedGeomDispose();
      };

      const sharedTex = new THREE.Texture();
      sharedTex.dispose = () => {
        sharedTexDisposed = true;
      };

      const sharedMat = new THREE.MeshStandardMaterial({ map: sharedTex });
      sharedMat.dispose = () => {
        sharedMatDisposed = true;
      };

      const cachedScene = new THREE.Group();
      cachedScene.add(new THREE.Mesh(sharedGeom, sharedMat));

      const instance = cloneSceneWithIsolatedMaterials(cachedScene);
      let clonedMatDisposed = false;
      const clonedMesh = instance.children[0];
      const origClonedMatDispose = clonedMesh.material.dispose.bind(clonedMesh.material);
      clonedMesh.material.dispose = () => {
        clonedMatDisposed = true;
        origClonedMatDispose();
      };

      // Attach a custom per-instance texture and procedural helper mesh
      const customTex = tagInstanceTexture(new THREE.Texture());
      customTex.dispose = () => {
        customTexDisposed = true;
      };
      clonedMesh.material.emissiveMap = customTex;

      const procGeom = tagProceduralGeometry(new THREE.PlaneGeometry(2, 2));
      procGeom.dispose = () => {
        procGeomDisposed = true;
      };
      const procMat = new THREE.MeshBasicMaterial();
      procMat.userData.__isInstanceClone = true;
      instance.add(new THREE.Mesh(procGeom, procMat));

      const stats = disposeInstanceClone(instance);

      assert.equal(clonedMatDisposed, true, 'Cloned glTF material must be disposed');
      assert.equal(customTexDisposed, true, 'Custom instance texture must be disposed');
      assert.equal(procGeomDisposed, true, 'Procedural instance geometry must be disposed');
      assert.equal(stats.disposedMaterials, 2);
      assert.equal(stats.disposedTextures, 1);
      assert.equal(stats.disposedGeometries, 1);

      // Shared glTF cache invariants
      assert.equal(sharedGeomDisposed, false, 'Shared cached BufferGeometry MUST NOT be disposed');
      assert.equal(sharedTexDisposed, false, 'Shared cached Texture MUST NOT be disposed');
      assert.equal(sharedMatDisposed, false, 'Shared cached Material MUST NOT be disposed');

      // Null safety check
      assert.deepEqual(disposeInstanceClone(null), {
        disposedMaterials: 0,
        disposedTextures: 0,
        disposedGeometries: 0,
      });
    });

    it('20x rapid dish-switch stress simulation retains 0 leaked materials and 0 corrupted cache entries', () => {
      const sharedGeom = new THREE.SphereGeometry(1, 8, 8);
      let sharedGeomDisposeCount = 0;
      sharedGeom.dispose = () => {
        sharedGeomDisposeCount += 1;
      };

      const mat1 = new THREE.MeshStandardMaterial({ name: 'Skin_Mat' });
      const mat2 = new THREE.MeshStandardMaterial({ name: 'Gold_Trim_Mat' });
      const cachedScene = new THREE.Group();
      cachedScene.add(new THREE.Mesh(sharedGeom, [mat1, mat2]));

      let activeMaterials = 0;
      for (let switchIdx = 0; switchIdx < 20; switchIdx++) {
        const clone = cloneSceneWithIsolatedMaterials(cachedScene);
        const cloneMesh = clone.children[0];
        activeMaterials += cloneMesh.material.length;

        const res = disposeInstanceClone(clone);
        activeMaterials -= res.disposedMaterials;
      }

      assert.equal(activeMaterials, 0, 'Net leaked cloned materials after 20 dish switches must be 0');
      assert.equal(sharedGeomDisposeCount, 0, 'Shared glTF geometry must survive all 20 switches intact');
    });

    it('disposeFullObject3D deeply disposes all geometries, multi-materials, PBR texture map slots, and RenderTargets', () => {
      const disposedSlots = new Set();

      const physicalMat = new THREE.MeshPhysicalMaterial();
      const testedSlots = [
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
        'clearcoatMap',
        'clearcoatNormalMap',
        'clearcoatRoughnessMap',
        'transmissionMap',
        'thicknessMap',
      ];

      for (const slot of testedSlots) {
        assert.ok(TEXTURE_MAP_SLOTS.includes(slot), `TEXTURE_MAP_SLOTS must include ${slot}`);
        const tex = new THREE.Texture();
        tex.dispose = () => {
          disposedSlots.add(slot);
        };
        physicalMat[slot] = tex;
      }

      let uniformTexDisposed = false;
      const uniformTex = new THREE.Texture();
      uniformTex.dispose = () => {
        uniformTexDisposed = true;
      };

      let rtDisposed = false;
      const renderTarget = new THREE.WebGLRenderTarget(64, 64);
      const origRtDispose = renderTarget.dispose.bind(renderTarget);
      renderTarget.dispose = () => {
        rtDisposed = true;
        origRtDispose();
      };

      const shaderMat = new THREE.ShaderMaterial({
        uniforms: {
          uDiffuse: { value: uniformTex },
          uFbo: { value: renderTarget },
        },
      });

      let geomDisposed = false;
      const geom = new THREE.BoxGeometry(1, 1, 1);
      geom.dispose = () => {
        geomDisposed = true;
      };

      const root = new THREE.Group();
      const mesh = new THREE.Mesh(geom, [physicalMat, shaderMat]);
      root.add(mesh);

      const fullStats = disposeFullObject3D(root);

      assert.equal(geomDisposed, true, 'Geometry must be disposed');
      assert.equal(rtDisposed, true, 'WebGLRenderTarget in uniform must be disposed');
      assert.equal(uniformTexDisposed, true, 'Shader uniform texture must be disposed');
      assert.equal(disposedSlots.size, testedSlots.length, 'Every PBR texture slot must be disposed');
      assert.equal(fullStats.disposedGeometries, 1);
      assert.equal(fullStats.disposedMaterials, 2);
      assert.equal(fullStats.disposedRenderTargets, 1);
      assert.equal(fullStats.disposedTextures, testedSlots.length + 1);
      assert.equal(root.children.length, 0, 'Root scene children must be cleared');
    });

    it('getRendererMemorySnapshot extracts renderer counters cleanly', () => {
      const mockGl = {
        info: {
          memory: { geometries: 12, textures: 5 },
          programs: [{ id: 1 }, { id: 2 }, { id: 3 }],
          render: { calls: 9, triangles: 18420, points: 0, lines: 0 },
        },
      };
      assert.deepEqual(getRendererMemorySnapshot(mockGl), {
        geometries: 12,
        textures: 5,
        programs: 3,
        calls: 9,
        triangles: 18420,
        points: 0,
        lines: 0,
      });
      assert.deepEqual(getRendererMemorySnapshot(null), {
        geometries: 0,
        textures: 0,
        programs: 0,
        calls: 0,
        triangles: 0,
        points: 0,
        lines: 0,
      });
    });
  });

  describe('2. ViewerScene On-Demand Lifecycle, Preload Elimination & Tier Calibration', () => {
    const viewerSrc = fs.readFileSync(viewerScenePath, 'utf8');

    it('eliminates unconditional top-level useGLTF.preload calls in ViewerScene.tsx', () => {
      assert.doesNotMatch(
        viewerSrc,
        /useGLTF\.preload\s*\(/,
        'ViewerScene.tsx must NOT execute eager module-level useGLTF.preload'
      );
    });

    it('suspends frameloop to "never" via Page Visibility API AND IntersectionObserver, and uses "demand" by default', () => {
      assert.match(
        viewerSrc,
        /addEventListener\(\s*['"]visibilitychange['"]/,
        'Must subscribe to visibilitychange'
      );
      assert.match(
        viewerSrc,
        /removeEventListener\(\s*['"]visibilitychange['"]/,
        'Must clean up visibilitychange listener'
      );
      assert.match(
        viewerSrc,
        /new\s+IntersectionObserver\s*\(/,
        'Must observe viewport visibility with IntersectionObserver'
      );
      assert.match(
        viewerSrc,
        /observer\.disconnect\s*\(\s*\)/,
        'Must disconnect IntersectionObserver on unmount'
      );
      assert.ok(
        viewerSrc.includes("'never'") && viewerSrc.includes("'demand'") && viewerSrc.includes("'always'"),
        'Must compute effective frameloop across never, demand, and always'
      );
      assert.ok(
        viewerSrc.includes('<DemandFrameloopController'),
        'Must pair demand frameloop with DemandFrameloopController'
      );
    });

    it('fixes AutoPresentation bug: uses React state and rotates dedicated turntable group instead of scene.rotation.y', () => {
      assert.doesNotMatch(
        viewerSrc,
        /scene\.rotation\.y\s*\+=/,
        'Must NEVER rotate root scene.rotation.y (which rotates studio lights and shadows)'
      );
      assert.doesNotMatch(
        viewerSrc,
        /presentationRef\.current/,
        'Must replace non-reactive presentationRef.current with React state'
      );
      assert.ok(
        viewerSrc.includes('turntableRef.current.rotation.y'),
        'AutoPresentation must rotate only the dedicated model turntable group'
      );
      assert.ok(
        viewerSrc.includes('presentationActive') && viewerSrc.includes('setPresentationActive'),
        'Must control presentation turntable via reactive state'
      );
    });

    it('wires useQualityTier, procedural RoomEnvironment IBL disposal, deterministic clone disposal, and live telemetry', () => {
      assert.ok(viewerSrc.includes('useQualityTier'), 'Must wire useQualityTier');
      assert.ok(
        viewerSrc.includes('cloneSceneWithIsolatedMaterials') &&
          viewerSrc.includes('disposeInstanceClone'),
        'FoodModel must clone with isolated materials and deterministically dispose clones'
      );
      assert.ok(
        viewerSrc.includes('RoomEnvironment') &&
          viewerSrc.includes('PMREMGenerator') &&
          viewerSrc.includes('ACESFilmicToneMapping'),
        'Must configure ACESFilmicToneMapping and offline procedural RoomEnvironment IBL'
      );
      assert.ok(
        viewerSrc.includes("__GOLDEN_OAK_3D_TELEMETRY__['DishViewer']"),
        'Must expose live WebGL telemetry under window.__GOLDEN_OAK_3D_TELEMETRY__.DishViewer'
      );
    });
  });

  describe('3. Manual Quality Override, Controls & Zero-RenderTarget Shadow Fallback', () => {
    const controlsSrc = fs.readFileSync(viewerControlsPath, 'utf8');
    const threeDViewerSrc = fs.readFileSync(threeDViewerPath, 'utf8');
    const safeShadowsSrc = fs.readFileSync(safeShadowsPath, 'utf8');
    const demandSrc = fs.readFileSync(demandControllerPath, 'utf8');

    it('provides Auto · Ultra-Light · Balanced · High manual quality selector and accessible controls', () => {
      for (const label of ['Auto', 'Ultra-Light', 'Balanced', 'High']) {
        assert.ok(
          controlsSrc.includes(label),
          `ViewerControls.tsx must render '${label}' quality option`
        );
      }
      assert.ok(
        controlsSrc.includes('min-h-[48px]') &&
          controlsSrc.includes('min-w-[48px]') &&
          controlsSrc.includes('touch-manipulation'),
        'ViewerControls must enforce mobile-ergonomic >=48px touch targets'
      );
      assert.ok(
        threeDViewerSrc.includes("addEventListener('fullscreenchange'") &&
          threeDViewerSrc.includes("removeEventListener('fullscreenchange'"),
        'ThreeDViewer.tsx must strictly clean up fullscreenchange listeners'
      );
      assert.ok(
        threeDViewerSrc.includes('key={`viewer-canvas-${retryKey}`}'),
        'ThreeDViewer.tsx must keep WebGL Canvas persistent across dish switches to prevent context churn'
      );
    });

    it('SafeContactShadows supports zero-RenderTarget fastStaticFallback while preserving full FBO disposal', () => {
      assert.ok(
        safeShadowsSrc.includes('fastStaticFallback') && safeShadowsSrc.includes('enabled = true'),
        'SafeContactShadows must expose fastStaticFallback and enabled props'
      );
      assert.ok(
        safeShadowsSrc.includes('if (!useDynamicTargets) return null;'),
        'SafeContactShadows must skip WebGLRenderTarget allocations when fastStaticFallback is active'
      );
      assert.ok(
        safeShadowsSrc.includes('staticGeom.dispose()') && safeShadowsSrc.includes('staticMat.dispose()'),
        'SafeContactShadows must dispose static disc geometry and shader material on unmount'
      );
    });

    it('DemandFrameloopController halts invalidation and pauses telemetry interval when tab is hidden', () => {
      assert.ok(
        demandSrc.includes("document.visibilityState === 'hidden'") &&
          demandSrc.includes("addEventListener('visibilitychange'") &&
          demandSrc.includes("removeEventListener('visibilitychange'"),
        'DemandFrameloopController must track and clean up visibilitychange and gate background work'
      );
    });
  });
});
