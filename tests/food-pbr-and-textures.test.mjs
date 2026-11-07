import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import * as THREE from 'three';

import {
  FOOD_MATERIAL_CATEGORIES,
  FOOD_MATERIAL_PRESETS,
  resolveFoodRenderProfile,
  inferFoodCategoryFromHint,
  createFoodMaterial,
  cloneMaterialsForInstance,
  disposeClonedInstanceMaterials,
  applyFoodMaterialProfile,
} from '../src/lib/three/food-materials.ts';

import {
  DEFAULT_LOCAL_BASIS_PATH,
  TEXTURE_FORMAT_MATRIX,
  TEXTURE_TIER_PROFILES,
  getTextureProfileSettings,
  sanitizeLocalDecoderPath,
  estimateTextureVramBytes,
  detectTextureCapabilities,
  checkLocalBasisTranscoderAvailable,
  getLocalKTX2Loader,
  optimizeSceneTextures,
  SharedTextureCache,
  loadProgressiveTexture,
  packORMTexture,
} from '../src/lib/three/texture-loader.ts';

import {
  WARRIOR_MATERIAL_PALETTE,
  enhanceWarriorMaterials,
} from '../src/components/viewer/warrior-materials.ts';

const require = createRequire(import.meta.url);
const ts = require('typescript');

/**
 * Helper to transpile and evaluate pure exports from `StudioFoodLighting.tsx` in Node
 * without requiring a browser React DOM renderer.
 */
function loadTranspiledStudioFoodLighting() {
  const filePath = path.resolve('src/components/3d/StudioFoodLighting.tsx');
  const source = fs.readFileSync(filePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  });

  const moduleExports = {};
  const moduleObj = { exports: moduleExports };
  const customRequire = (specifier) => {
    if (specifier === 'three') return THREE;
    if (specifier === 'react') {
      return {
        default: { createElement: () => null },
        createElement: () => null,
        useEffect: () => {},
        useMemo: (fn) => fn(),
      };
    }
    if (specifier === '@react-three/fiber') {
      return { useThree: () => ({ width: 1280 }) };
    }
    if (specifier.includes('RoomEnvironment')) {
      return { RoomEnvironment: class MockRoomEnv { dispose() {} } };
    }
    if (specifier.includes('HDRLoader')) {
      return { HDRLoader: class MockHDRLoader {} };
    }
    if (specifier.includes('SafeContactShadows')) {
      return { SafeContactShadows: () => null };
    }
    if (specifier.includes('food-materials')) {
      return { resolveFoodRenderProfile };
    }
    return require(specifier);
  };

  const fn = vm.runInThisContext(
    `(function(exports, require, module) { ${transpiled.outputText} })`,
    { filename: 'StudioFoodLighting.cjs' }
  );
  fn(moduleExports, customRequire, moduleObj);
  return moduleObj.exports;
}

describe('Agent 3: Culinary PBR Materials, Smart Textures & Tier-Aware Studio Lighting', () => {
  describe('1. Culinary PBR Material Presets & Anti-Plastic Roughness Bounds', () => {
    it('defines all 9 specification categories (including glass-container & ceramic-plate)', () => {
      const expected = [
        'fried-food',
        'bread-crust',
        'melted-cheese',
        'grilled-meat',
        'fresh-vegetables',
        'glossy-sauce',
        'dessert',
        'beverage',
        'glass-container',
        'ceramic-plate',
      ];
      for (const cat of expected) {
        assert.ok(FOOD_MATERIAL_CATEGORIES.includes(cat), `Missing category ${cat}`);
        assert.ok(FOOD_MATERIAL_PRESETS[cat], `Missing preset for ${cat}`);
      }
    });

    it('calibrates roughness ranges to look natural and appetizing — never plastic', () => {
      const checkRange = (cat, minExpected, maxExpected) => {
        const preset = FOOD_MATERIAL_PRESETS[cat];
        assert.ok(
          preset.roughness >= minExpected && preset.roughness <= maxExpected,
          `${cat} roughness (${preset.roughness}) must lie within [${minExpected}, ${maxExpected}]`
        );
        assert.equal(preset.roughnessRange[0], minExpected);
        assert.equal(preset.roughnessRange[1], maxExpected);
      };

      checkRange('fried-food', 0.58, 0.68);
      checkRange('bread-crust', 0.72, 0.84);
      checkRange('melted-cheese', 0.28, 0.36);
      checkRange('grilled-meat', 0.34, 0.46);
      checkRange('fresh-vegetables', 0.38, 0.52);
      checkRange('glossy-sauce', 0.10, 0.18);
      checkRange('dessert', 0.26, 0.65);

      // Ceramic porcelain glaze at 0.16
      assert.equal(FOOD_MATERIAL_PRESETS['ceramic-plate'].roughness, 0.16);

      // Dielectric food materials have 0.0 metalness
      for (const foodCat of [
        'fried-food',
        'bread-crust',
        'melted-cheese',
        'grilled-meat',
        'fresh-vegetables',
        'glossy-sauce',
        'dessert',
        'beverage',
        'ceramic-plate',
      ]) {
        assert.equal(
          FOOD_MATERIAL_PRESETS[foodCat].metalness,
          0.0,
          `${foodCat} must remain purely dielectric (metalness 0.0)`
        );
      }
    });

    it('enables glossy-sauce clearcoat ONLY on high-fidelity and downgrades to MeshStandardMaterial on mobile tiers', () => {
      const hiSauce = createFoodMaterial('glossy-sauce', {
        profile: 'high-fidelity',
        secondaryEffects: true,
      });
      assert.equal(hiSauce.isMeshPhysicalMaterial, true);
      assert.equal(hiSauce.clearcoat, 0.6);
      assert.equal(hiSauce.clearcoatRoughness, 0.12);

      const balSauce = createFoodMaterial('glossy-sauce', { profile: 'balanced' });
      assert.equal(balSauce.isMeshStandardMaterial, true);
      assert.equal(balSauce.isMeshPhysicalMaterial ?? false, false);
      assert.equal(balSauce.clearcoat ?? 0, 0);

      const ultraSauce = createFoodMaterial('glossy-sauce', { profile: 'ultra-light' });
      assert.equal(ultraSauce.isMeshStandardMaterial, true);
      assert.equal(ultraSauce.isMeshPhysicalMaterial ?? false, false);
      assert.equal(ultraSauce.clearcoat ?? 0, 0);
    });

    it('enforces transmission === 0 fast-path on beverage & glass-container for ultra-light, balanced, and AR', () => {
      for (const cat of ['beverage', 'glass-container']) {
        for (const profile of ['ultra-light', 'balanced']) {
          const mat = createFoodMaterial(cat, { profile });
          assert.equal(
            mat.transmission ?? 0,
            0,
            `${cat} on ${profile} must have transmission === 0 to prevent TBDR framebuffer blits`
          );
          assert.equal(mat.transparent, true, `${cat} on ${profile} must use transparent alpha fast-path`);
          assert.equal(mat.depthWrite, false);
        }

        // Even on high-fidelity, AR mode must disable transmission so live camera video shows through
        const arMat = createFoodMaterial(cat, { profile: 'high-fidelity', isAR: true });
        assert.equal(arMat.transmission ?? 0, 0, `${cat} in AR must keep transmission === 0`);
      }

      // High-fidelity non-AR viewer gets optical transmission
      const hiGlass = createFoodMaterial('glass-container', { profile: 'high-fidelity', isAR: false });
      assert.equal(hiGlass.isMeshPhysicalMaterial, true);
      assert.ok(hiGlass.transmission > 0.5);
    });

    it('accurately infers culinary categories from menu dish slugs and glTF node names', () => {
      assert.equal(inferFoodCategoryFromHint('dynamite-chilli-potatoes'), 'fried-food');
      assert.equal(inferFoodCategoryFromHint('Brioche_Bun_Top'), 'bread-crust');
      assert.equal(inferFoodCategoryFromHint('tandoori-paneer-pizza'), 'melted-cheese');
      assert.equal(inferFoodCategoryFromHint('classic-smash-burger'), 'grilled-meat');
      assert.equal(inferFoodCategoryFromHint('farmhouse-salad-greens'), 'fresh-vegetables');
      assert.equal(inferFoodCategoryFromHint('wok-tossed-chow-mein'), 'glossy-sauce');
      assert.equal(inferFoodCategoryFromHint('chocolate-lava-cake'), 'dessert');
      assert.equal(inferFoodCategoryFromHint('kaffir-lime-mocktail'), 'beverage');
      assert.equal(inferFoodCategoryFromHint('Crystal_Tumbler_Glass'), 'glass-container');
      assert.equal(inferFoodCategoryFromHint('Porcelain_Serving_Plate'), 'ceramic-plate');
    });
  });

  describe('2. Non-Destructive Per-Instance Material Cloning & Scene Material Enhancer', () => {
    it('clones materials per-instance with __clonedForInstance tag and never mutates shared useGLTF cache', () => {
      const cachedMat = new THREE.MeshPhysicalMaterial({
        name: 'Drink_Glass_Mat',
        color: new THREE.Color('#ffffff'),
        roughness: 0.02,
        transmission: 0.95,
        clearcoat: 1.0,
      });
      const geom = new THREE.SphereGeometry(0.5, 8, 8);
      const cachedScene = new THREE.Group();
      const m1 = new THREE.Mesh(geom, cachedMat);
      const m2 = new THREE.Mesh(geom, cachedMat);
      cachedScene.add(m1, m2);

      // Simulate ViewerScene / ARScene cloning a glTF scene
      const instanceScene = cachedScene.clone(true);
      const summary = applyFoodMaterialProfile(instanceScene, {
        category: 'glass-container',
        profile: 'balanced',
      });

      assert.equal(summary.clonedMaterials, 1, 'Should clone shared material once per instance');
      assert.equal(summary.downgradedPhysicalMaterials, 1, 'Should downgrade MeshPhysicalMaterial on balanced');

      // Verify shared cache is 100% untouched
      assert.equal(cachedMat.transmission, 0.95, 'Cached material transmission must NOT be mutated');
      assert.equal(cachedMat.clearcoat, 1.0, 'Cached material clearcoat must NOT be mutated');
      assert.equal(cachedMat.userData.__clonedForInstance, undefined);

      // Verify instance meshes share the downgraded, tagged instance material
      const instMesh1 = instanceScene.children[0];
      const instMesh2 = instanceScene.children[1];
      assert.notEqual(instMesh1.material, cachedMat);
      assert.equal(instMesh1.material, instMesh2.material, 'Intra-instance meshes should share cloned material');
      assert.equal(instMesh1.material.userData.__clonedForInstance, true);
      assert.equal(instMesh1.material.transmission ?? 0, 0);
      assert.equal(instMesh1.material.clearcoat ?? 0, 0);
      assert.equal(instMesh1.material.transparent, true);

      // Verify safe disposal only disposes cloned instance materials, never cached geometry
      const disposedCount = disposeClonedInstanceMaterials(instanceScene);
      assert.equal(disposedCount, 1);
      assert.ok(geom.attributes.position, 'Shared geometry remains intact');
    });

    it('strips static baked environment tint and emissive glow when isAR === true', () => {
      const dummyEnv = new THREE.Texture();
      const rawMat = new THREE.MeshStandardMaterial({
        name: 'Grilled_Patty',
        envMap: dummyEnv,
        emissive: new THREE.Color('#ff6600'),
        emissiveIntensity: 0.8,
      });
      const root = new THREE.Group();
      root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), rawMat));

      applyFoodMaterialProfile(root, {
        category: 'grilled-meat',
        profile: 'high-fidelity',
        isAR: true,
      });

      const arMat = root.children[0].material;
      assert.equal(arMat.envMap, null, 'AR mode must clear static baked envMap');
      assert.equal(arMat.emissiveIntensity, 0, 'AR mode must zero out artificial emissive glow');
      assert.equal(rawMat.envMap, dummyEnv, 'Original cached material keeps its envMap');
    });
  });

  describe('3. Smart Texture Optimization, ColorSpaces, Deduplication, Downscaling & ORM', () => {
    it('detects GPU hardware texture compression capabilities accurately and safely in SSR', () => {
      const ssrCaps = detectTextureCapabilities(null);
      assert.equal(ssrCaps.preferredGpuFormat, 'uncompressed');
      assert.equal(ssrCaps.preferredDeliveryFormat, 'webp');

      const androidAstcCaps = detectTextureCapabilities({
        extensions: { has: (ext) => ext === 'WEBGL_compressed_texture_astc' },
        capabilities: { getMaxAnisotropy: () => 8, maxTextureSize: 4096, isWebGL2: true },
      });
      assert.equal(androidAstcCaps.astc, true);
      assert.equal(androidAstcCaps.preferredGpuFormat, 'astc');
      assert.equal(androidAstcCaps.preferredDeliveryFormat, 'ktx2');

      const desktopBc7Caps = detectTextureCapabilities({
        extensions: { has: (ext) => ext === 'EXT_texture_compression_bptc' },
        capabilities: { getMaxAnisotropy: () => 16, maxTextureSize: 16384, isWebGL2: true },
      });
      assert.equal(desktopBc7Caps.bptc, true);
      assert.equal(desktopBc7Caps.preferredGpuFormat, 'bptc');
      assert.ok(TEXTURE_FORMAT_MATRIX.length >= 7);
    });

    it('enforces local-only Basis decoder paths and rejects external CDNs per CSP', async () => {
      assert.equal(sanitizeLocalDecoderPath(), DEFAULT_LOCAL_BASIS_PATH);
      assert.equal(sanitizeLocalDecoderPath('basis'), '/basis/');

      assert.throws(
        () => sanitizeLocalDecoderPath('https://unpkg.com/three@0.185.0/examples/jsm/libs/basis/'),
        /External CDN decoder path/
      );
      assert.throws(
        () => sanitizeLocalDecoderPath('https://cdn.jsdelivr.net/npm/three/examples/jsm/libs/basis/'),
        /External CDN decoder path/
      );
      assert.throws(
        () => sanitizeLocalDecoderPath('//www.gstatic.com/basis/'),
        /External CDN decoder path/
      );

      // Since /public/basis/basis_transcoder.wasm is not installed in workspace, honest check returns false & null
      const basisPresent = await checkLocalBasisTranscoderAvailable('/basis/');
      assert.equal(basisPresent, false);
      const ktx2Loader = await getLocalKTX2Loader({ capabilities: {} });
      assert.equal(ktx2Loader, null);
    });

    it('configures tier texture profiles matching mobile VRAM & bandwidth targets', () => {
      const ultra = getTextureProfileSettings('ultra-light');
      assert.equal(ultra.maxDimension, 512);
      assert.equal(ultra.anisotropy, 1);
      assert.equal(ultra.minFilter, THREE.LinearMipmapNearestFilter);
      assert.equal(ultra.stripSecondaryMaps, true);

      const bal = getTextureProfileSettings('balanced');
      assert.equal(bal.maxDimension, 1024);
      assert.equal(bal.anisotropy, 4);
      assert.equal(bal.minFilter, THREE.LinearMipmapLinearFilter);
      assert.equal(bal.stripSecondaryMaps, false);

      const hi = getTextureProfileSettings('high-fidelity');
      assert.equal(hi.maxDimension, 2048);
      assert.equal(hi.anisotropy, 8);
      assert.equal(hi.minFilter, THREE.LinearMipmapLinearFilter);
      assert.equal(TEXTURE_TIER_PROFILES['high-fidelity'].maxDimension, 2048);
    });

    it('enforces SRGBColorSpace vs NoColorSpace, deduplicates textures, clamps anisotropy, and downscales 2048->512 (16x VRAM savings)', () => {
      // Create two separate 2048x2048 RGBA DataTexture instances with identical pixel content
      const size = 2048;
      const pixelsA = new Uint8Array(size * size * 4);
      pixelsA.fill(180);
      const pixelsB = new Uint8Array(size * size * 4);
      pixelsB.fill(180);

      const baseColorTex1 = new THREE.DataTexture(pixelsA, size, size, THREE.RGBAFormat);
      baseColorTex1.colorSpace = THREE.NoColorSpace; // Wrong initial color space!

      const baseColorTex2 = new THREE.DataTexture(pixelsB, size, size, THREE.RGBAFormat);
      baseColorTex2.colorSpace = THREE.NoColorSpace; // Duplicate albedo texture on 2nd material!

      const normalPixels = new Uint8Array(1024 * 1024 * 4);
      normalPixels.fill(128);
      const normalTex = new THREE.DataTexture(normalPixels, 1024, 1024, THREE.RGBAFormat);
      normalTex.colorSpace = THREE.SRGBColorSpace; // Wrong initial color space for normal map!

      const ormPixels = new Uint8Array(1024 * 1024 * 4);
      ormPixels.fill(200);
      const ormTex = new THREE.DataTexture(ormPixels, 1024, 1024, THREE.RGBAFormat);
      ormTex.colorSpace = THREE.SRGBColorSpace; // Wrong initial color space for ORM!

      const bumpTex = new THREE.DataTexture(new Uint8Array(256 * 256 * 4), 256, 256, THREE.RGBAFormat);

      const mat1 = new THREE.MeshStandardMaterial({
        map: baseColorTex1,
        normalMap: normalTex,
        roughnessMap: ormTex,
        metalnessMap: ormTex,
        aoMap: ormTex,
        bumpMap: bumpTex,
      });
      const mat2 = new THREE.MeshStandardMaterial({
        map: baseColorTex2,
      });

      const scene = new THREE.Group();
      scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat1));
      scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat2));

      // Optimize for 2GB ultra-light phone (maxDimension: 512, anisotropy: 1)
      const stats = optimizeSceneTextures(scene, 'ultra-light', {
        getMaxAnisotropy: () => 16,
      });

      // 1. Deduplication: mat1.map and mat2.map now point to the exact same Texture object
      assert.equal(mat1.map, mat2.map, 'Duplicate albedo textures must be deduplicated');
      assert.ok(stats.deduplicatedSlots >= 1);

      // 2. Color spaces fixed
      assert.equal(mat1.map.colorSpace, THREE.SRGBColorSpace, 'BaseColor must be SRGBColorSpace');
      assert.equal(mat1.normalMap.colorSpace, THREE.NoColorSpace, 'NormalMap must be NoColorSpace');
      assert.equal(mat1.roughnessMap.colorSpace, THREE.NoColorSpace, 'ORM/Roughness must be NoColorSpace');

      // 3. Secondary optional bumpMap stripped on ultra-light
      assert.equal(mat1.bumpMap, null, 'Secondary bumpMap should be stripped on ultra-light');
      assert.equal(stats.strippedSecondaryMaps, 1);

      // 4. Downscaling 2048x2048 -> 512x512 saves 16x VRAM on BaseColor!
      assert.equal(mat1.map.image.width, 512);
      assert.equal(mat1.map.image.height, 512);
      assert.equal(mat1.normalMap.image.width, 512);
      assert.equal(mat1.normalMap.image.height, 512);
      assert.equal(mat1.map.minFilter, THREE.LinearMipmapNearestFilter);
      assert.equal(mat1.map.anisotropy, 1);

      const vram2048 = estimateTextureVramBytes(2048, 2048, { hasMipmaps: true });
      const vram512 = estimateTextureVramBytes(512, 512, { hasMipmaps: true });
      assert.ok(Math.abs(vram2048 / vram512 - 16) < 0.01, '2048->512 must achieve 16x VRAM reduction');
      assert.ok(stats.estimatedVramAfterBytes < stats.estimatedVramBeforeBytes / 8);

      // 5. Verify anisotropy clamping when GPU maxAnisotropy < profile anisotropy
      const hiScene = new THREE.Group();
      const hiTex = new THREE.DataTexture(new Uint8Array(64 * 64 * 4), 64, 64, THREE.RGBAFormat);
      hiScene.add(
        new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ map: hiTex }))
      );
      const hiStats = optimizeSceneTextures(hiScene, 'high-fidelity', {
        getMaxAnisotropy: () => 4, // Hardware limit lower than high-fidelity's 8
      });
      assert.equal(hiStats.anisotropyApplied, 4);
      assert.equal(hiTex.anisotropy, 4);
    });

    it('packs AO [R], Roughness [G], and Metallic [B] into a single linear ORM DataTexture', () => {
      const ao = new Uint8Array([200, 180, 220, 255]);
      const roughness = new Uint8Array([160, 140, 90, 110]);
      const metalness = new Uint8Array([0, 0, 255, 128]);

      const orm = packORMTexture({
        width: 2,
        height: 2,
        ao,
        roughness,
        metalness,
      });

      assert.equal(orm.colorSpace, THREE.NoColorSpace);
      assert.equal(orm.image.width, 2);
      assert.equal(orm.image.height, 2);

      const d = orm.image.data;
      // Pixel 0: R=200, G=160, B=0, A=255
      assert.deepEqual([d[0], d[1], d[2], d[3]], [200, 160, 0, 255]);
      // Pixel 2: R=220, G=90, B=255, A=255
      assert.deepEqual([d[8], d[9], d[10], d[11]], [220, 90, 255, 255]);
    });

    it('manages ref-counted SharedTextureCache & progressive loading without leaks', async () => {
      const cache = new SharedTextureCache();
      let loadCalls = 0;
      let disposed = false;

      const customLoader = async () => {
        loadCalls += 1;
        await new Promise((r) => setTimeout(r, 10));
        const t = new THREE.DataTexture(new Uint8Array(128 * 128 * 4), 128, 128, THREE.RGBAFormat);
        const origDispose = t.dispose.bind(t);
        t.dispose = () => {
          disposed = true;
          origDispose();
        };
        return t;
      };

      // Concurrent load deduplication
      const [t1, t2] = await Promise.all([
        cache.getOrLoad('pizza-albedo', customLoader),
        cache.getOrLoad('pizza-albedo', customLoader),
      ]);
      assert.equal(loadCalls, 1, 'Concurrent callers must share 1 load');
      assert.equal(t1, t2);
      assert.equal(cache.getRefCount('pizza-albedo'), 2);

      // First release keeps texture alive
      assert.equal(cache.release('pizza-albedo'), false);
      assert.equal(disposed, false);
      assert.equal(cache.getRefCount('pizza-albedo'), 1);

      // Second release disposes texture cleanly
      assert.equal(cache.release('pizza-albedo'), true);
      assert.equal(disposed, true);
      assert.equal(cache.getRefCount('pizza-albedo'), 0);

      // Progressive loader test
      let previewSeen = false;
      let highResSeen = false;
      const progCache = new SharedTextureCache();
      const handle = loadProgressiveTexture({
        url: '/textures/mock-crust.webp',
        profile: 'ultra-light',
        cache: progCache,
        customLoader: async () =>
          new THREE.DataTexture(new Uint8Array(1024 * 1024 * 4), 1024, 1024, THREE.RGBAFormat),
        onPreview: (p) => {
          previewSeen = p.image.width === 4;
        },
        onHighRes: (hi) => {
          highResSeen = hi.image.width === 512; // Downscaled to ultra-light 512!
        },
      });

      assert.equal(previewSeen, true, 'Instant 4x4 placeholder texture provided synchronously');
      await handle.promise;
      assert.equal(highResSeen, true, 'High-res texture downscaled to tier cap and delivered');
      handle.release();
      assert.equal(progCache.size, 0, 'Progressive handle release cleans up cache entry');
    });
  });

  describe('4. Upgraded Backward-Compatible warrior-materials.ts', () => {
    it('preserves WARRIOR_MATERIAL_PALETTE and 1-arg enhanceWarriorMaterials while preventing cache mutation and Cornea transmission blits', () => {
      assert.equal(Object.keys(WARRIOR_MATERIAL_PALETTE).length, 14);

      const cachedGold = new THREE.MeshPhysicalMaterial({
        name: 'Gold_Trim_Mat',
        color: new THREE.Color(0.1, 0.1, 0.1),
        roughness: 0.9,
        metalness: 0.1,
        clearcoat: 1.0,
      });
      const cachedCornea = new THREE.MeshPhysicalMaterial({
        name: 'Cornea_Mat',
        color: new THREE.Color(1, 1, 1),
        roughness: 0.0,
        transmission: 1.0,
      });

      const cachedScene = new THREE.Group();
      cachedScene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), cachedGold));
      cachedScene.add(new THREE.Mesh(new THREE.SphereGeometry(0.2), cachedCornea));

      const clone = cachedScene.clone(true);
      // 1-argument backward-compatible call
      enhanceWarriorMaterials(clone);

      // Cached materials MUST NOT be mutated
      assert.equal(cachedGold.roughness, 0.9, 'Cached Gold_Trim_Mat must not be mutated');
      assert.equal(cachedCornea.transmission, 1.0, 'Cached Cornea_Mat must not be mutated');

      // Cloned instance materials are calibrated & safe
      const instGold = clone.children[0].material;
      const instCornea = clone.children[1].material;
      assert.equal(instGold.userData.__clonedForInstance, true);
      assert.equal(instGold.roughness, WARRIOR_MATERIAL_PALETTE.Gold_Trim_Mat.roughness);
      assert.equal(instGold.metalness, WARRIOR_MATERIAL_PALETTE.Gold_Trim_Mat.metalness);
      assert.equal(instGold.clearcoat, 0, 'Secondary clearcoat stripped on balanced mobile tier');
      assert.equal(instCornea.transmission, 0, 'Cornea multipass transmission eliminated');
      assert.equal(instCornea.transparent, true);
    });
  });

  describe('5. Tier-Aware StudioFoodLighting Budgets & Zero-CDN CSP Compliance', () => {
    it('enforces tier light & shadow budgets and dynamic AR ambientLuma matching', () => {
      const {
        resolveStudioLightingBudget,
        createRadialShadowTexture,
        LOCAL_OPTIMIZED_HDR_PATH,
      } = loadTranspiledStudioFoodLighting();

      assert.equal(LOCAL_OPTIMIZED_HDR_PATH, '/textures/forest_env.optimized.hdr');

      // Ultra-light: 2 lights, no IBL, 1-draw-call radial decal, 0 contact shadow FBO passes
      const ultra = resolveStudioLightingBudget({ profile: 'ultra-light', mode: 'viewer' }, true);
      assert.equal(ultra.activeLightCount, 2);
      assert.equal(ultra.iblSource, 'none');
      assert.equal(ultra.shadowStrategy, 'radial-decal');
      assert.equal(ultra.directionalCastShadow, false);

      // Balanced: 3 lights, 0 KB RoomEnvironment IBL, non-smooth single-frame ContactShadows
      const bal = resolveStudioLightingBudget({ profile: 'balanced', mode: 'viewer' }, true);
      assert.equal(bal.activeLightCount, 3);
      assert.equal(bal.iblSource, 'room-environment');
      assert.equal(bal.shadowStrategy, 'baked-contact-fast');
      assert.equal(bal.contactShadowResolution, 256);
      assert.equal(bal.contactShadowSmooth, false);

      // High-fidelity: 4 lights, RoomEnvironment default (or opt-in local 468KB HDR), smooth ContactShadows
      const hiMobile = resolveStudioLightingBudget({ profile: 'high-fidelity', mode: 'viewer' }, true);
      assert.equal(hiMobile.activeLightCount, 4);
      assert.equal(hiMobile.iblSource, 'room-environment');
      assert.equal(hiMobile.contactShadowResolution, 512);
      assert.equal(hiMobile.contactShadowSmooth, true);

      const hiDesktopHdr = resolveStudioLightingBudget(
        { profile: 'high-fidelity', mode: 'viewer', useLocalHdrOnHighFidelity: true, shadowsEnabled: true },
        false
      );
      assert.equal(hiDesktopHdr.iblSource, 'local-optimized-hdr');
      assert.equal(hiDesktopHdr.contactShadowResolution, 1024);
      assert.equal(hiDesktopHdr.directionalCastShadow, true);

      // AR mode: clamps ambientLuma to [0.3, 1.4], disables baked studio IBL, uses radial decal
      const arLow = resolveStudioLightingBudget({ profile: 'high-fidelity', mode: 'ar', ambientLuma: 0.05 }, true);
      assert.equal(arLow.clampedAmbientLuma, 0.3);
      assert.equal(arLow.iblSource, 'none');
      assert.equal(arLow.shadowStrategy, 'radial-decal');
      assert.equal(arLow.directionalCastShadow, false);

      const arBright = resolveStudioLightingBudget({ profile: 'balanced', mode: 'ar', ambientLuma: 2.5 }, true);
      assert.equal(arBright.clampedAmbientLuma, 1.4);

      // Procedural radial shadow DataTexture has smooth center-to-edge alpha falloff
      const decalTex = createRadialShadowTexture(64);
      assert.equal(decalTex.image.width, 64);
      const centerAlpha = decalTex.image.data[(32 * 64 + 32) * 4 + 3];
      const cornerAlpha = decalTex.image.data[3];
      assert.ok(centerAlpha > 240, 'Center of shadow decal should have strong umbra alpha');
      assert.equal(cornerAlpha, 0, 'Corner of shadow decal must fade cleanly to 0 alpha');
    });

    it('verifies zero external CDN URLs and strict PMREM/GPU disposal across all owned modules', () => {
      const ownedFiles = [
        'src/lib/three/food-materials.ts',
        'src/lib/three/texture-loader.ts',
        'src/components/viewer/warrior-materials.ts',
        'src/components/3d/StudioFoodLighting.tsx',
      ];

      for (const rel of ownedFiles) {
        const content = fs.readFileSync(path.resolve(rel), 'utf8');
        // Strip comments and string literals belonging to error-guard regexes? Even simpler:
        // ensure no https:// URLs exist at all in source code!
        assert.doesNotMatch(
          content,
          /https?:\/\/(unpkg\.com|cdn\.jsdelivr\.net|www\.gstatic\.com|dl\.polyhaven\.org)/i,
          `${rel} must never reference external CDN URLs`
        );
      }

      const lightingSrc = fs.readFileSync(
        path.resolve('src/components/3d/StudioFoodLighting.tsx'),
        'utf8'
      );
      assert.ok(lightingSrc.includes('roomEnvironment.dispose()'), 'Must dispose temporary RoomEnvironment');
      assert.ok(lightingSrc.includes('pmremGenerator.dispose()'), 'Must dispose PMREMGenerator');
      assert.ok(lightingSrc.includes('entry.renderTarget.dispose()'), 'Must dispose cached PMREM render target');
      assert.ok(!lightingSrc.includes('/textures/forest_env.hdr'), 'Must never load unoptimized 1.84MB forest_env.hdr');
    });
  });
});
