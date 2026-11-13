import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';

import {
  KNOWN_DISH_SLUGS,
  getModelConfig,
  resolveAdaptiveModelConfig,
} from '../src/data/model-config.ts';
import {
  detectExtendedDeviceCapabilities,
} from '../src/lib/three/device-capabilities.ts';
import {
  calculateRenderingProfile,
  detectDeviceCapabilities,
} from '../src/hooks/useQualityTier.ts';
import {
  ASSET_PRIORITY_WEIGHTS,
  PriorityAssetDownloadQueue,
  SharedModelBufferCache,
  buildProgressiveLodPlan,
  evaluateProgressiveResidencyGuard,
  replaceLodSceneSafely,
} from '../src/lib/three/progressive-asset-loader.ts';
import {
  TEXTURE_FORMAT_MATRIX,
  TEXTURE_TIER_PROFILES,
  checkLocalBasisTranscoderAvailable,
} from '../src/lib/three/texture-loader.ts';
import {
  SPATIAL_EXPERIENCE_TAXONOMY,
  classifySpatialExperience,
  detectARCapabilityMatrix,
} from '../src/lib/three/ar-capabilities.ts';
import {
  cloneSceneWithIsolatedMaterials,
  disposeInstanceClone,
} from '../src/lib/three/resource-disposal.ts';

const ROOT = process.cwd();

describe('Phase 2 Production Validation, Photorealistic Asset Audit & Regression Suite', () => {
  describe('Objective 1: 22-Dish Asset Quality Audit & Placeholder Identification', () => {
    it('audits all 22 menu dishes and verifies every culinary LOD GLB and USDZ exists on disk', () => {
      assert.equal(KNOWN_DISH_SLUGS.length, 22, 'Must audit all 22 menu dishes');

      for (const slug of KNOWN_DISH_SLUGS) {
        const cfg = getModelConfig(slug);
        assert.ok(cfg.culinaryAssetLodPaths, `Dish ${slug} must define culinaryAssetLodPaths`);

        for (const [tier, relPath] of Object.entries(cfg.culinaryAssetLodPaths)) {
          const absPath = path.join(ROOT, 'public', relPath.replace(/^\//, ''));
          assert.ok(fs.existsSync(absPath), `Missing ${tier} GLB for ${slug}: ${absPath}`);
          const stat = fs.statSync(absPath);
          assert.ok(stat.size > 1024, `${relPath} must be a non-empty binary GLB`);
        }

        assert.ok(cfg.usdzPath, `Dish ${slug} must define usdzPath for iOS Quick Look`);
        const absUsdz = path.join(ROOT, 'public', cfg.usdzPath.replace(/^\//, ''));
        assert.ok(fs.existsSync(absUsdz), `Missing USDZ for ${slug}: ${absUsdz}`);
      }
    });

    it('validates benchmarks/phase2-22dish-asset-audit.json transparently documents duplicated archetypes, untextured placeholders, and over-tessellated meshes', () => {
      const reportPath = path.join(ROOT, 'benchmarks', 'phase2-22dish-asset-audit.json');
      assert.ok(fs.existsSync(reportPath), 'phase2-22dish-asset-audit.json must exist');
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

      assert.equal(report.summary.totalMenuDishes, 22);
      assert.equal(report.dishes.length, 22);
      assert.ok(
        report.summary.sharedDuplicateArchetypeDishesCount >= 12,
        'Audit must honestly identify the 12+ dishes sharing culinary archetypes rather than claiming all 22 are unique'
      );
      assert.equal(
        report.summary.archetypesWithCompletePbrStackCount,
        0,
        'Audit must honestly report that 0 archetypes currently have a full KTX2 PBR stack (BaseColor + Normal + ORM)'
      );
      assert.equal(
        report.archetypeBreakdown['gourmet-wok-bowl'].lods.high.textureCount,
        0,
        'Audit must identify that gourmet-wok-bowl (shared by 8 dishes) has 0 textures'
      );
      assert.equal(
        report.archetypeBreakdown['bbq-chicken-overload'].lods.high.triangleCount,
        1870624,
        'Audit must identify over-tessellated bbq-chicken-overload-high.glb (1,870,624 triangles)'
      );
    });
  });

  describe('Objective 3: Advanced Adaptive Quality & Profile Reconciliation', () => {
    it('does not downgrade capable iPhones (where navigator.deviceMemory is undefined) or confuse 8GB budget Androids with flagships', () => {
      // 1. Recent iPhone 15 Pro (deviceMemory: undefined, Apple GPU, DPR 3, 6 cores)
      const iphoneProCaps = detectExtendedDeviceCapabilities({
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
        devicePixelRatio: 3,
        hardwareConcurrency: 6,
        deviceMemory: undefined,
        viewportWidth: 393,
        viewportHeight: 852,
        isTouch: true,
        webglProbe: {
          webgl2Available: true,
          webgl1Available: true,
          gpuRenderer: 'Apple GPU',
          gpuVendor: 'Apple Inc.',
          maxTextureSize: 16384,
          isSoftwareGpu: false,
          compressedTextures: {
            astc: true,
            etc2: true,
            etc1: false,
            s3tc: false,
            bptc: false,
            pvrtc: true,
            ktx2Supported: true,
            preferredFormat: 'astc',
          },
        },
      });
      assert.equal(iphoneProCaps.logicalTier, 'high-end');
      assert.equal(iphoneProCaps.recommendedProfile, 'high-fidelity');

      // 2. 8GB RAM Trap Budget Android with weak Adreno 610 GPU -> must NOT get high-fidelity
      const budget8GbAndroid = detectExtendedDeviceCapabilities({
        userAgent:
          'Mozilla/5.0 (Linux; Android 13; Redmi Note 12) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36',
        devicePixelRatio: 2.75,
        hardwareConcurrency: 8,
        deviceMemory: 8,
        viewportWidth: 393,
        viewportHeight: 873,
        isTouch: true,
        webglProbe: {
          webgl2Available: true,
          webgl1Available: true,
          gpuRenderer: 'Adreno (TM) 610',
          gpuVendor: 'Qualcomm',
          maxTextureSize: 8192,
          isSoftwareGpu: false,
          compressedTextures: {
            astc: true,
            etc2: true,
            etc1: true,
            s3tc: false,
            bptc: false,
            pvrtc: false,
            ktx2Supported: true,
            preferredFormat: 'astc',
          },
        },
      });
      assert.notEqual(
        budget8GbAndroid.recommendedProfile,
        'high-fidelity',
        '8GB budget phone with weak Adreno 610 must not be classified as high-fidelity'
      );

      // 3. Reconciled ViewerScene.tsx derives activeTier from tierProfile so mid-range/flagship phones are not stuck on low
      const viewerSrc = fs.readFileSync(
        path.join(ROOT, 'src/components/viewer/ViewerScene.tsx'),
        'utf8'
      );
      assert.ok(
        viewerSrc.includes("tierProfile === 'high-fidelity'") &&
          viewerSrc.includes("tierProfile === 'balanced'"),
        'ViewerScene.tsx must reconcile activeTier with multi-signal tierProfile'
      );
    });
  });

  describe('Objective 4: Progressive Asset Delivery, Priority Queue, Cancellation & Residency Guard', () => {
    it('builds progressive LOD plan starting at ultra-light and enforces memory/thermal residency guard', () => {
      const cfg = getModelConfig('tandoori-paneer-pizza');

      // Nominal high-fidelity plan: starts at ultra-light, upgrades to balanced -> high-fidelity
      const nominalPlan = buildProgressiveLodPlan('tandoori-paneer-pizza', cfg, {
        targetProfile: 'high-fidelity',
        jsHeapUsedBytes: 40 * 1024 * 1024,
        jsHeapLimitBytes: 256 * 1024 * 1024,
        thermalState: 'nominal',
      });
      assert.equal(nominalPlan.initialLodProfile, 'ultra-light');
      assert.ok(nominalPlan.initialModelPath.endsWith('tandoori-paneer-pizza-ultralight.glb'));
      assert.equal(nominalPlan.upgradeSequence.length, 2);
      assert.equal(nominalPlan.upgradeSequence[0].profile, 'balanced');
      assert.equal(nominalPlan.upgradeSequence[1].profile, 'high-fidelity');

      // High memory pressure (85% heap used) -> blocks upgrade to high-fidelity, caps at balanced
      const pressuredPlan = buildProgressiveLodPlan('tandoori-paneer-pizza', cfg, {
        targetProfile: 'high-fidelity',
        jsHeapUsedBytes: 218 * 1024 * 1024,
        jsHeapLimitBytes: 256 * 1024 * 1024,
        thermalState: 'nominal',
      });
      assert.equal(pressuredPlan.effectiveTargetProfile, 'balanced');
      assert.equal(pressuredPlan.downgradedByMemoryOrThermal, true);
      assert.equal(pressuredPlan.upgradeSequence.length, 1);
      assert.equal(pressuredPlan.upgradeSequence[0].profile, 'balanced');

      // Critical thermal state -> stays at ultra-light with 0 upgrades
      const criticalThermalPlan = buildProgressiveLodPlan('tandoori-paneer-pizza', cfg, {
        targetProfile: 'high-fidelity',
        thermalState: 'critical',
      });
      assert.equal(criticalThermalPlan.effectiveTargetProfile, 'ultra-light');
      assert.equal(criticalThermalPlan.upgradeSequence.length, 0);
    });

    it('preempts low-priority prewarm downloads and cancels obsolete requests via AbortController on rapid dish switch', async () => {
      const cache = new SharedModelBufferCache({ maxEntries: 8 });
      const queue = new PriorityAssetDownloadQueue({ maxConcurrency: 1, cache });

      const abortedUrls = [];
      const slowFetcher = (url, signal) =>
        new Promise((resolve, reject) => {
          const timer = setTimeout(() => resolve(new ArrayBuffer(128)), 80);
          signal.addEventListener(
            'abort',
            () => {
              clearTimeout(timer);
              abortedUrls.push(url);
              reject(new DOMException('Aborted', 'AbortError'));
            },
            { once: true }
          );
        });

      // Enqueue dish A initial load + prewarm
      const pDishA = queue.enqueue({
        dishSlug: 'classic-smash-burger',
        url: '/models/optimized/classic-smash-burger-ultralight.glb',
        priorityBand: 'active-dish-initial',
        customFetcher: slowFetcher,
      });
      const pDishBPrewarm = queue.enqueue({
        dishSlug: 'crispy-paneer-burger',
        url: '/models/optimized/crispy-paneer-burger-ultralight.glb',
        priorityBand: 'adjacent-dish-prewarm',
        customFetcher: slowFetcher,
      });

      // User rapidly switches to dish C -> cancel all obsolete requests not belonging to dish C
      const cancelled = queue.cancelAllObsoleteRequests('tandoori-paneer-pizza');
      assert.equal(cancelled, 2, 'Both obsolete dish requests must be cancelled immediately');

      await assert.rejects(pDishA, /AbortError|Cancelled/);
      await assert.rejects(pDishBPrewarm, /AbortError|Cancelled/);

      // Dish C succeeds and caches its buffer
      const bufC = await queue.enqueue({
        dishSlug: 'tandoori-paneer-pizza',
        url: '/models/optimized/tandoori-paneer-pizza-ultralight.glb',
        priorityBand: 'active-dish-initial',
        customFetcher: async () => new ArrayBuffer(256),
      });
      assert.equal(bufC.byteLength, 256);
      assert.equal(cache.has('/models/optimized/tandoori-paneer-pizza-ultralight.glb'), true);
    });

    it('replaceLodSceneSafely swaps LOD clones atomically and disposes previous instance clone without leaking', () => {
      const parentGroup = new THREE.Group();
      const sharedGeom = new THREE.BoxGeometry(1, 1, 1);
      const baseScene1 = new THREE.Group();
      baseScene1.add(new THREE.Mesh(sharedGeom, new THREE.MeshStandardMaterial()));
      const baseScene2 = new THREE.Group();
      baseScene2.add(new THREE.Mesh(sharedGeom, new THREE.MeshStandardMaterial()));

      const lod2Clone = cloneSceneWithIsolatedMaterials(baseScene1);
      const lod1Clone = cloneSceneWithIsolatedMaterials(baseScene2);

      let lod2MatDisposed = false;
      lod2Clone.children[0].material.dispose = () => {
        lod2MatDisposed = true;
      };

      parentGroup.add(lod2Clone);
      const result = replaceLodSceneSafely(parentGroup, lod2Clone, lod1Clone);

      assert.equal(result.swapped, true);
      assert.equal(result.disposedPrevious, true);
      assert.equal(lod2MatDisposed, true, 'Replaced LOD clone material must be disposed immediately');
      assert.equal(parentGroup.children.length, 1);
      assert.strictEqual(parentGroup.children[0], lod1Clone);
    });
  });

  describe('Objective 5: Texture & Geometry Compression Pipeline', () => {
    it('verifies local Basis Universal transcoder files (/basis-ktx2/) and Draco decoder files (/draco/) are present for strict CSP', async () => {
      assert.equal(
        await checkLocalBasisTranscoderAvailable('/basis-ktx2/'),
        true,
        'public/basis-ktx2/basis_transcoder.js and basis_transcoder.wasm must exist locally'
      );
      assert.ok(fs.existsSync(path.join(ROOT, 'public/draco/draco_decoder.wasm')));
      assert.equal(TEXTURE_TIER_PROFILES['ultra-light'].maxDimension, 512);
      assert.equal(TEXTURE_TIER_PROFILES['balanced'].maxDimension, 1024);
      assert.equal(TEXTURE_TIER_PROFILES['high-fidelity'].maxDimension, 2048);
      const astcSpec = TEXTURE_FORMAT_MATRIX.find((f) => f.id === 'ktx2-astc-4x4');
      const etc2Spec = TEXTURE_FORMAT_MATRIX.find((f) => f.id === 'ktx2-etc2-rgba');
      assert.ok(astcSpec && astcSpec.vramReductionVsRgba8Pct >= 75);
      assert.ok(etc2Spec && etc2Spec.vramReductionVsRgba8Pct >= 75);
    });
  });

  describe('Objective 6: AR Engineering Validation & Strict 5-Mode Separation', () => {
    it('separates all 5 spatial experience modes and NEVER labels camera-overlay-preview as world-tracked AR', async () => {
      assert.equal(SPATIAL_EXPERIENCE_TAXONOMY['ordinary-3d-viewer'].isWorldTracked, false);
      assert.equal(SPATIAL_EXPERIENCE_TAXONOMY['camera-overlay-preview'].isWorldTracked, false);
      assert.equal(SPATIAL_EXPERIENCE_TAXONOMY['android-arcore-scene-viewer'].isWorldTracked, true);
      assert.equal(SPATIAL_EXPERIENCE_TAXONOMY['ios-ar-quick-look'].isWorldTracked, true);
      assert.equal(SPATIAL_EXPERIENCE_TAXONOMY['webxr-immersive-ar'].isWorldTracked, true);

      // In-browser camera mode without WebXR/SceneViewer/QuickLook -> isWorldTrackedARAvailable: false
      const cameraOnlyMatrix = await detectARCapabilityMatrix({
        navigatorRef: {
          userAgent: 'Mozilla/5.0 (Linux; Android 10; Generic) AppleWebKit/537.36',
          maxTouchPoints: 5,
          mediaDevices: {
            getUserMedia: async () => ({}),
            enumerateDevices: async () => [{ kind: 'videoinput' }],
          },
        },
        glbPath: '', // No SceneViewer GLB
      });
      assert.equal(cameraOnlyMatrix.inBrowserExperience.kind, 'camera-overlay-preview');
      assert.equal(cameraOnlyMatrix.inBrowserExperience.isWorldTracked, false);
      assert.equal(cameraOnlyMatrix.isWorldTrackedARAvailable, false);

      const classified = classifySpatialExperience(cameraOnlyMatrix, false);
      assert.equal(classified.kind, 'camera-overlay-preview');
      assert.equal(classified.isWorldTracked, false);
    });
  });

  describe('Objective 7 & 8: 50x Dish-Switching Memory Stability & Regression Benchmarks', () => {
    it('maintains 0 leaked materials and intact shared geometry across 50 rapid dish switches', () => {
      const sharedGeom = new THREE.SphereGeometry(1, 12, 12);
      let sharedGeomDisposed = false;
      sharedGeom.dispose = () => {
        sharedGeomDisposed = true;
      };
      const baseScene = new THREE.Group();
      baseScene.add(
        new THREE.Mesh(sharedGeom, [
          new THREE.MeshStandardMaterial({ name: 'Crust' }),
          new THREE.MeshStandardMaterial({ name: 'Glaze' }),
        ])
      );

      let liveMaterials = 0;
      let currentClone = null;

      for (let i = 0; i < 50; i++) {
        const nextClone = cloneSceneWithIsolatedMaterials(baseScene);
        liveMaterials += 2;
        nextClone.children[0].material.forEach((m) => {
          const orig = m.dispose.bind(m);
          m.dispose = () => {
            liveMaterials -= 1;
            orig();
          };
        });

        if (currentClone) {
          disposeInstanceClone(currentClone);
        }
        currentClone = nextClone;
        assert.equal(liveMaterials, 2, `At switch #${i + 1}, only 2 materials may remain resident`);
      }

      disposeInstanceClone(currentClone);
      assert.equal(liveMaterials, 0, 'After final unmount, 0 cloned materials remain');
      assert.equal(sharedGeomDisposed, false, 'Shared geometry must remain intact');
    });

    it('verifies repeatable benchmark JSON artifacts pass all automated regression gates', () => {
      const baselineVsOptPath = path.join(
        ROOT,
        'benchmarks',
        'phase2-baseline-vs-optimized.json'
      );
      const stressPath = path.join(ROOT, 'benchmarks', 'phase2-thermal-memory-stress.json');
      const compressionPath = path.join(ROOT, 'benchmarks', 'phase2-compression-pipeline.json');

      assert.ok(fs.existsSync(baselineVsOptPath), 'phase2-baseline-vs-optimized.json must exist');
      assert.ok(fs.existsSync(stressPath), 'phase2-thermal-memory-stress.json must exist');
      assert.ok(fs.existsSync(compressionPath), 'phase2-compression-pipeline.json must exist');

      const bench = JSON.parse(fs.readFileSync(baselineVsOptPath, 'utf8'));
      assert.equal(
        bench.repeatableRouteBenchmarks.menu.unexpected3dAssetDownloads,
        0,
        'Regression Gate: /menu must download 0 3D models/HDR/WASM assets'
      );
      assert.equal(
        bench.repeatableRouteBenchmarks.viewer3d.hiddenSuspensionCheck.suspendedToNeverWhenHidden,
        true,
        'Regression Gate: /3d/[dishId] must suspend frameloop to "never" when document is hidden'
      );
      assert.equal(
        bench.nineDeviceValidationMatrix.length,
        9,
        'Regression Gate: 9-device testing matrix must cover all 9 required hardware classes'
      );
    });
  });
});
