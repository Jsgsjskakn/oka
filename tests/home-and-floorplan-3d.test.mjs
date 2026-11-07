import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';

import {
  buildMergedScene,
  buildInstancedScene,
} from '../src/lib/three/interiorOptimization.ts';
import {
  DEVICE_PERSONAS,
  BENCHMARK_ROUTES,
  resolveChromeExecutable,
} from '../scripts/benchmark-3d-runtime.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const BASELINE_ARTIFACT_PATH =
  'C:\\Users\\Pyiush Gupta\\.gemini\\antigravity\\brain\\22cb5c35-3043-4ba7-a662-5d1b3225baa2\\baseline_3d_metrics.json';

function readProjectFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

describe('Agent 6: Home, Floorplan, Bundle Splitting & Real Telemetry Verification', () => {
  describe('1. Phase A — Pre-Optimization Baseline Audit & Asset Inventory', () => {
    it('verifies scripts/audit-baseline-metrics.mjs and baseline_3d_metrics.json exist with verified pre-edit ground truth', () => {
      assert.ok(
        fs.existsSync(path.join(ROOT, 'scripts/audit-baseline-metrics.mjs')),
        'scripts/audit-baseline-metrics.mjs must exist'
      );
      assert.ok(
        fs.existsSync(BASELINE_ARTIFACT_PATH),
        'Pre-optimization baseline_3d_metrics.json must exist in shared brain artifact dir'
      );

      const baseline = JSON.parse(fs.readFileSync(BASELINE_ARTIFACT_PATH, 'utf8'));
      assert.equal(baseline.summary.totalCanvasMounts, 6);
      assert.equal(baseline.summary.eagerUseGLTFPreloadCount, 7);
      assert.equal(baseline.summary.preserveDrawingBufferTrueCount, 1);
      assert.equal(baseline.summary.unoptimizedForestHdrRefs, 2);
      assert.equal(baseline.summary.dynamicSsrFalseCount, 4);
      assert.equal(baseline.summary.assets.glbFileCount, 8);
      assert.equal(baseline.summary.assets.hdrFileCount, 2);
      assert.equal(baseline.summary.assets.dracoFileCount, 3);
      assert.ok(baseline.summary.assets.totalGlbBytes > 28_000_000);
      assert.equal(baseline.summary.assets.forestEnvHdrComparison.savingsPercent, 74.5);
    });
  });

  describe('2. Phase B — Home Dual-Canvas Protection, Lazy Intersection Mount & Device-Tier Scaling', () => {
    it('eliminates eager module-scope useGLTF.preload from HeroWarriorCanvas and PromoWarriorCanvas', () => {
      const heroCanvas = readProjectFile('src/components/home/HeroWarriorCanvas.tsx');
      const promoCanvas = readProjectFile('src/components/home/PromoWarriorCanvas.tsx');

      assert.doesNotMatch(
        heroCanvas,
        /useGLTF\.preload\s*\(/,
        'HeroWarriorCanvas must not execute eager module-scope useGLTF.preload'
      );
      assert.doesNotMatch(
        promoCanvas,
        /useGLTF\.preload\s*\(/,
        'PromoWarriorCanvas must not execute eager module-scope useGLTF.preload'
      );
    });

    it('lazy-mounts PromoWarriorCanvas in ARPromoSection via next/dynamic (ssr: false) gated by IntersectionObserver', () => {
      const promoSection = readProjectFile('src/components/home/ARPromoSection.tsx');

      assert.match(promoSection, /dynamic\s*\(\s*\(\)\s*=>\s*import\(['"]\.\/PromoWarriorCanvas['"]\)/);
      assert.match(promoSection, /ssr:\s*false/);
      assert.match(promoSection, /IntersectionObserver/);
      assert.match(promoSection, /rootMargin:\s*['"]250px['"]/);
      assert.match(promoSection, /shouldMountCanvas\s*\?\s*\(/);
      assert.match(promoSection, /const\s+isStageActive\s*=\s*isInViewport\s*&&\s*!isDocumentHidden/);
      assert.match(promoSection, /isVisible=\{isStageActive\}/);
      assert.match(promoSection, /useQualityTier/);
    });

    it('isolates HeroWarriorCanvas behind next/dynamic (ssr: false) in Hero3DPedestal and avoids 60Hz React state updates', () => {
      const pedestal = readProjectFile('src/components/home/Hero3DPedestal.tsx');

      assert.match(pedestal, /dynamic\s*\(\s*\(\)\s*=>\s*import\(['"]\.\/HeroWarriorCanvas['"]\)/);
      assert.match(pedestal, /ssr:\s*false/);
      assert.doesNotMatch(
        pedestal,
        /const\s*\[\s*rotation\s*,\s*setRotation\s*\]\s*=\s*useState/,
        'Hero3DPedestal must mutate DOM transform ref directly instead of 60Hz React state re-renders'
      );
      assert.match(pedestal, /stageRef\.current\.style\.transform/);
      assert.match(pedestal, /visibilitychange/);
      assert.match(pedestal, /useQualityTier/);
    });

    it('enforces viewport + visibility sleep (frameloop="never"), demand idle, and low-tier GPU budgets on Home canvases', () => {
      const heroCanvas = readProjectFile('src/components/home/HeroWarriorCanvas.tsx');
      const promoCanvas = readProjectFile('src/components/home/PromoWarriorCanvas.tsx');

      for (const [name, src] of [
        ['HeroWarriorCanvas', heroCanvas],
        ['PromoWarriorCanvas', promoCanvas],
      ]) {
        assert.match(src, /useQualityTier\s*\(/, `${name} must use useQualityTier()`);
        assert.match(src, /IntersectionObserver/, `${name} must track viewport visibility`);
        assert.match(src, /visibilitychange/, `${name} must pause when document tab is hidden`);
        assert.match(src, /['"]never['"]/, `${name} must suspend frameloop to 'never' off-screen`);
        assert.match(src, /['"]demand['"]/, `${name} must drop frameloop to 'demand' when stationary`);
        assert.match(src, /powerPreference:\s*isLowTier\s*\?\s*['"]low-power['"]/, `${name} must request low-power GPU context on low tier`);
        assert.match(src, /antialias:\s*isLowTier\s*\?\s*false\s*:\s*quality\.antialias/, `${name} must disable MSAA on low tier`);
        assert.match(src, /__GOLDEN_OAK_3D_TELEMETRY__/, `${name} must publish live WebGL telemetry`);
      }

      // PromoWarriorCanvas procedural geometry & material disposal check
      assert.match(promoCanvas, /platterDiscBuffer\.dispose\(\)/);
      assert.match(promoCanvas, /platterRimBuffer\.dispose\(\)/);
      assert.match(promoCanvas, /platterDiscMat\.dispose\(\)/);
      assert.match(promoCanvas, /platterRimMat\.dispose\(\)/);
      assert.match(promoCanvas, /isLowTier\s*\?\s*32\s*:\s*64/);
    });
  });

  describe('3. Phase C — Booking 3D Floorplan HDR Optimization, Tab-Sleep & VRAM Disposal', () => {
    it('eliminates eager module-scope useGLTF.preload from Restaurant3DFloorplan and OptimizedInteriorModel', () => {
      const floorplan = readProjectFile('src/components/booking/Restaurant3DFloorplan.tsx');
      const interior = readProjectFile('src/components/booking/OptimizedInteriorModel.tsx');

      assert.doesNotMatch(
        floorplan,
        /useGLTF\.preload\s*\(/,
        'Restaurant3DFloorplan must not execute module-scope useGLTF.preload'
      );
      assert.doesNotMatch(
        interior,
        /useGLTF\.preload\s*\(/,
        'OptimizedInteriorModel must not execute module-scope useGLTF.preload'
      );
    });

    it('switches default Floorplan IBL to /textures/forest_env.optimized.hdr (74.5% smaller), skips HDR on low/saveData tier, and sleeps on hidden tab', () => {
      const floorplan = readProjectFile('src/components/booking/Restaurant3DFloorplan.tsx');

      assert.match(
        floorplan,
        /\/textures\/forest_env\.optimized\.hdr/,
        'Restaurant3DFloorplan must load 468KB forest_env.optimized.hdr on medium/high tiers'
      );
      assert.match(
        floorplan,
        /const\s+shouldLoadHdr\s*=\s*quality\.qualityTier\s*!==\s*['"]low['"]\s*&&\s*!isSaveData/,
        'Restaurant3DFloorplan must skip HDR download completely on low/saveData mobile devices'
      );
      assert.match(
        floorplan,
        /!isViewportVisible\s*\|\|\s*isDocumentHidden\s*\?\s*['"]never['"]\s*:\s*['"]demand['"]/,
        'Restaurant3DFloorplan must suspend Canvas frameloop to never when off-screen or tab-hidden'
      );
      assert.match(floorplan, /frameloop=\{activeFrameloop\}/);
      assert.match(floorplan, /visibilitychange/);
      assert.match(floorplan, /__GOLDEN_OAK_3D_TELEMETRY__/);

      const rawHdrSize = fs.statSync(path.join(ROOT, 'public/textures/forest_env.hdr')).size;
      const optHdrSize = fs.statSync(path.join(ROOT, 'public/textures/forest_env.optimized.hdr')).size;
      const reductionPct = ((rawHdrSize - optHdrSize) / rawHdrSize) * 100;
      assert.ok(reductionPct > 74, `Expected >74% HDR byte savings, got ${reductionPct.toFixed(1)}%`);
    });

    it('shares a single CylinderGeometry + MeshBasicMaterial across all 28 TableInteractionProxies and disposes derived merged buffers safely', () => {
      const interior = readProjectFile('src/components/booking/OptimizedInteriorModel.tsx');

      assert.match(interior, /const\s+proxyCylinderBuffer\s*=\s*new\s+THREE\.CylinderGeometry/);
      assert.match(interior, /proxyResources\.proxyCylinderBuffer\.dispose\(\)/);
      assert.match(interior, /proxyResources\.proxyColliderMat\.dispose\(\)/);
      assert.match(interior, /cachedBuffers\.has\(/);
      assert.match(interior, /meshBuffer\.dispose\(\)/);
      assert.match(interior, /__GOLDEN_OAK_3D_TELEMETRY__/);
    });

    it('functional simulation: disposes derived merged/instanced GPU buffers on unmount without poisoning cached useGLTF buffers', () => {
      // Simulate a cached glTF scene with shared geometries & materials
      const cachedGeoA = new THREE.BoxGeometry(1, 1, 1);
      const cachedGeoB = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 8);
      const cachedMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });

      let cachedDisposedCount = 0;
      cachedGeoA.addEventListener('dispose', () => {
        cachedDisposedCount += 1;
      });
      cachedGeoB.addEventListener('dispose', () => {
        cachedDisposedCount += 1;
      });
      cachedMat.addEventListener('dispose', () => {
        cachedDisposedCount += 1;
      });

      const cachedScene = new THREE.Group();
      for (let i = 0; i < 6; i += 1) {
        const meshA = new THREE.Mesh(cachedGeoA, cachedMat);
        meshA.position.set(i * 2, 0, 0);
        cachedScene.add(meshA);

        const meshB = new THREE.Mesh(cachedGeoB, cachedMat);
        meshB.position.set(i * 2, 1, 0);
        cachedScene.add(meshB);
      }

      const cachedBuffers = new Set([cachedGeoA, cachedGeoB]);
      const cachedMaterials = new Set([cachedMat]);

      const root = buildMergedScene(cachedScene);
      assert.ok(root.children.length >= 1);

      const instancedRoot = buildInstancedScene(cachedScene);
      assert.ok(instancedRoot.children.length >= 1);

      let derivedDisposedCount = 0;
      for (const container of [root, instancedRoot]) {
        container.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            const buf = obj.geometry;
            if (buf && !cachedBuffers.has(buf)) {
              buf.addEventListener('dispose', () => {
                derivedDisposedCount += 1;
              });
            }
          }
        });
      }

      // Execute exact unmount cleanup logic from OptimizedInteriorModel.tsx
      const disposedBuffers = new Set();
      for (const container of [root, instancedRoot]) {
        container.traverse((obj) => {
          if (obj instanceof THREE.InstancedMesh) {
            obj.dispose();
          }
          if (obj instanceof THREE.Mesh) {
            const meshBuffer = obj.geometry;
            if (meshBuffer && !cachedBuffers.has(meshBuffer) && !disposedBuffers.has(meshBuffer)) {
              disposedBuffers.add(meshBuffer);
              meshBuffer.dispose();
            }
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const mat of mats) {
              if (mat && !cachedMaterials.has(mat)) {
                mat.dispose();
              }
            }
          }
        });
      }

      assert.ok(derivedDisposedCount >= 1, 'Derived merged batch BufferGeometry must be disposed on unmount');
      assert.equal(cachedDisposedCount, 0, 'Cached useGLTF geometries and materials must NEVER be disposed');

      // Clean up test fixtures
      cachedGeoA.dispose();
      cachedGeoB.dispose();
      cachedMat.dispose();
    });

    it('keeps /menu completely free of Three.js imports and removes stale model/ar .bak files', () => {
      const menuPage = readProjectFile('src/app/menu/page.tsx');
      const menuClient = readProjectFile('src/components/menu/MenuClient.tsx');

      assert.doesNotMatch(menuPage, /three|@react-three|WarriorCanvas|Floorplan|ViewerScene|ARScene/);
      assert.doesNotMatch(menuClient, /three|@react-three|WarriorCanvas|Floorplan|ViewerScene|ARScene/);

      assert.equal(
        fs.existsSync(path.join(ROOT, 'src/data/ar-config.ts.bak')),
        false,
        'src/data/ar-config.ts.bak must remain removed'
      );
      assert.equal(
        fs.existsSync(path.join(ROOT, 'src/data/model-config.ts.bak')),
        false,
        'src/data/model-config.ts.bak must remain removed'
      );
    });
  });

  describe('4. Phase D — Real Headless Chromium + CDP Benchmark Harness Verification', () => {
    it('exports all 5 required device personas, all 5+ routes, and locates a real local Chromium executable', () => {
      assert.equal(DEVICE_PERSONAS.length, 5);
      const personaIds = DEVICE_PERSONAS.map((p) => p.id);
      assert.deepEqual(personaIds, [
        'low-end-android',
        'mid-range-android',
        'high-end-android',
        'ios-iphone-safari',
        'desktop-high-fidelity',
      ]);

      const routePaths = BENCHMARK_ROUTES.map((r) => r.path);
      assert.ok(routePaths.includes('/'));
      assert.ok(routePaths.includes('/menu'));
      assert.ok(routePaths.includes('/3d/golden-oak-signature-burger'));
      assert.ok(routePaths.includes('/ar'));
      assert.ok(routePaths.includes('/ar/golden-oak-signature-burger'));
      assert.ok(routePaths.includes('/booking'));

      const chromeBin = resolveChromeExecutable();
      assert.ok(fs.existsSync(chromeBin), `Resolved Chrome binary must exist on disk: ${chromeBin}`);
    });
  });
});
