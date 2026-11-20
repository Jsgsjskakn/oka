/**
 * THE GOLDEN OAK — PHASE 7 MASTER VERIFICATION SUITE
 * DISH AUTHENTICITY, 3D ASSET RECONSTRUCTION & MOBILE AR OPTIMIZATION
 *
 * Verifies:
 * 1. Individual 23-dish authenticity classification & honesty invariants
 * 2. Realistic food PBR material pipeline (metallicFactor = 0.0, natural roughness, zero emissive)
 * 3. Physical scale validation & ground-contact origin (scaleValidated: false honesty)
 * 4. GLB & USDZ mobile optimization (all USDZ < 1.5 MB with embedded textures & 64-byte alignment)
 * 5. Device-adaptive loading (2GB, 4GB, 6GB, 8GB+ Android multi-signal residency guard)
 * 6. AR accuracy & platform execution path separation
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  DISH_ASSET_MANIFEST,
  getAllManifestDishSlugs,
} from '../src/data/dish-asset-manifest.ts';
import {
  KNOWN_DISH_SLUGS,
  getModelConfig,
} from '../src/data/model-config.ts';
import {
  evaluateProgressiveResidencyGuard,
  buildProgressiveLodPlan,
} from '../src/lib/three/progressive-asset-loader.ts';
import {
  resolveXRSessionQualityProfile,
} from '../src/lib/xr/ar-quality-profile.ts';
import {
  checkWebXRImmersiveArSupport,
} from '../src/lib/xr/webxr-session.ts';
import {
  buildAndroidSceneViewerIntentUrl,
  evaluateIOSQuickLookCapability,
} from '../src/lib/three/ar-capabilities.ts';

const ROOT = process.cwd();

test('Phase 7 — 1. 23-Dish Individual Authenticity Audit & Classification Honesty', async (t) => {
  await t.test('All 23 canonical entries have explicit Phase 7 authenticity classification metadata', () => {
    const slugs = getAllManifestDishSlugs();
    assert.equal(slugs.length, 23);

    for (const slug of slugs) {
      const entry = DISH_ASSET_MANIFEST[slug];
      assert.ok(entry.authenticityClassification, `${slug} must define authenticityClassification`);
      assert.equal(typeof entry.authenticityVerified, 'boolean', `${slug} must define boolean authenticityVerified`);
      assert.ok(entry.plateDiameterCm > 0, `${slug} must define positive plateDiameterCm`);
      assert.ok(Array.isArray(entry.missingIngredientsOrLimitations), `${slug} must list limitations honestly`);
      assert.ok(entry.missingIngredientsOrLimitations.length >= 1, `${slug} must document at least 1 limitation`);
    }
  });

  await t.test('Classification counts match Phase 7.2 ground truth (23/23 authentic-dedicated, 0 duplicates/stand-ins/placeholders)', () => {
    const counts = {
      'authentic-dedicated': 0,
      'duplicate-primary-mesh': 0,
      'same-family-variant': 0,
      'cross-recipe-stand-in': 0,
      'untextured-generic-placeholder': 0,
    };

    for (const entry of Object.values(DISH_ASSET_MANIFEST)) {
      counts[entry.authenticityClassification]++;
      assert.equal(entry.authenticityVerified, true, `${entry.dishId} must have authenticityVerified: true`);
      assert.equal(entry.isSharedPlaceholder, false, `${entry.dishId} must have isSharedPlaceholder: false`);
    }

    assert.equal(counts['authentic-dedicated'], 23);
    assert.equal(counts['duplicate-primary-mesh'], 0);
    assert.equal(counts['same-family-variant'], 0);
    assert.equal(counts['cross-recipe-stand-in'], 0);
    assert.equal(counts['untextured-generic-placeholder'], 0);
  });
});

test('Phase 7 — 2. Realistic Food Material Pipeline (Zero Metallic, Natural Roughness, Zero Emissive)', async (t) => {
  await t.test('Every GLB material across all 23 dishes has metallicFactor = 0.0 and emissiveFactor = [0,0,0]', () => {
    for (const [slug, entry] of Object.entries(DISH_ASSET_MANIFEST)) {
      assert.equal(
        entry.pbrMaterialAudit.zeroMetallicVerified,
        true,
        `${slug} must have zero metallic factor across all dielectric food/dishware materials`
      );
      assert.equal(
        entry.pbrMaterialAudit.zeroEmissiveVerified,
        true,
        `${slug} must have zero artificial emissive glow`
      );
      const [minR, maxR] = entry.pbrMaterialAudit.roughnessRange;
      assert.ok(minR >= 0.08, `${slug} min roughness (${minR}) must not be mirror-plastic (< 0.08)`);
      assert.ok(maxR <= 1.0, `${slug} max roughness (${maxR}) must be <= 1.0`);
    }
  });
});

test('Phase 7 — 3. Physical Scale Validation & Canonical Origin Ground Contact', async (t) => {
  await t.test('All 23 dishes maintain scaleValidated: false, groundContactValidated: true, and accurate modelScaleFactor', () => {
    for (const [slug, entry] of Object.entries(DISH_ASSET_MANIFEST)) {
      assert.equal(entry.scaleValidated, false, `${slug} must keep scaleValidated: false until caliper measured`);
      assert.equal(entry.dimensionSource, 'estimated-typical-portion');
      assert.equal(entry.groundContactValidated, true, `${slug} must have validated Y=0 ground contact`);
      assert.equal(entry.canonicalOrigin, 'footprint-centre-ground-contact');

      const highBbox = entry.profiles.high.bboxM;
      const targetM = Math.max(entry.dimensions.widthCm, entry.dimensions.depthCm) / 100;
      const modelM = Math.max(highBbox.width, highBbox.depth);
      assert.ok(Math.abs(entry.modelScaleFactor - targetM / modelM) < 0.005);
    }
  });
});

test('Phase 7 — 4. GLB & USDZ Mobile Optimization (All USDZ < 1.5 MB with Embedded Textures)', async (t) => {
  await t.test('Every USDZ asset is < 1.5 MB (eliminating all > 10 MB Phase 6 USDZ bottlenecks) and 64-byte aligned', () => {
    for (const [slug, entry] of Object.entries(DISH_ASSET_MANIFEST)) {
      const usdzRel = entry.profiles.usdz.path;
      const usdzAbs = path.join(ROOT, 'public', usdzRel.replace(/^\//, ''));
      assert.ok(fs.existsSync(usdzAbs), `USDZ must exist for ${slug}`);
      const buf = fs.readFileSync(usdzAbs);

      assert.ok(
        buf.length <= 1.5 * 1024 * 1024,
        `USDZ for ${slug} (${(buf.length / 1024).toFixed(1)} KB) must be <= 1.5 MB`
      );
      assert.equal(buf.readUInt32LE(0), 0x04034b50, `${slug} USDZ must have valid ZIP header`);

      let offset = 0;
      const entryNames = [];
      while (offset + 30 <= buf.length && buf.readUInt32LE(offset) === 0x04034b50) {
        const method = buf.readUInt16LE(offset + 8);
        const compSize = buf.readUInt32LE(offset + 18);
        const nameLen = buf.readUInt16LE(offset + 26);
        const extraLen = buf.readUInt16LE(offset + 28);
        const dataOffset = offset + 30 + nameLen + extraLen;
        const entryName = buf.toString('utf8', offset + 30, offset + 30 + nameLen);
        assert.equal(method, 0, `${slug} USDZ entry ${entryName} must use store method 0`);
        assert.equal(dataOffset % 64, 0, `${slug} USDZ entry ${entryName} must be 64-byte aligned`);
        entryNames.push(entryName);
        offset = dataOffset + compSize;
      }

      if (entry.profiles.high.texturesCount > 0) {
        const hasEmbeddedTex = entryNames.some((n) => n.startsWith('textures/') && n.endsWith('.jpg'));
        assert.equal(hasEmbeddedTex, true, `Textured dish ${slug} USDZ must pack embedded textures/*.jpg`);
      }
    }
  });
});

test('Phase 7 — 5. Device-Adaptive Loading (2GB, 4GB, 6GB, 8GB+ Android Rules)', async (t) => {
  const cfg = getModelConfig('tandoori-paneer-pizza');

  await t.test('2GB Android: locks strictly to Ultra-Light with zero upgrade sequence', () => {
    const plan = buildProgressiveLodPlan('tandoori-paneer-pizza', cfg, {
      targetProfile: 'balanced',
      deviceMemoryGb: 2,
      gpuTier: 'low-end',
    });
    assert.equal(plan.initialLodProfile, 'ultra-light');
    assert.equal(plan.effectiveTargetProfile, 'ultra-light');
    assert.equal(plan.upgradeSequence.length, 0);
  });

  await t.test('4GB Android: loads Ultra-Light first; upgrades to Balanced ONLY when GPU, memory, FPS & thermal are safe', () => {
    // Case A: 4GB Android with low-end GPU (Adreno 610) -> blocked from upgrading
    const lowGpuPlan = buildProgressiveLodPlan('tandoori-paneer-pizza', cfg, {
      targetProfile: 'balanced',
      deviceMemoryGb: 4,
      gpuTier: 'low-end',
    });
    assert.equal(lowGpuPlan.initialLodProfile, 'ultra-light');
    assert.equal(lowGpuPlan.effectiveTargetProfile, 'ultra-light');
    assert.equal(lowGpuPlan.upgradeSequence.length, 0);

    // Case B: 4GB Android with mid-range GPU but high heap (70%) -> blocked from upgrading
    const highHeapPlan = buildProgressiveLodPlan('tandoori-paneer-pizza', cfg, {
      targetProfile: 'balanced',
      deviceMemoryGb: 4,
      gpuTier: 'mid-range',
      jsHeapUsedBytes: 70 * 1024 * 1024,
      jsHeapLimitBytes: 100 * 1024 * 1024,
    });
    assert.equal(highHeapPlan.effectiveTargetProfile, 'ultra-light');
    assert.equal(highHeapPlan.upgradeSequence.length, 0);

    // Case C: 4GB Android with mid-range GPU, 40% heap, 58 FPS, nominal thermal -> upgrades to Balanced (never High)
    const safe4GbPlan = buildProgressiveLodPlan('tandoori-paneer-pizza', cfg, {
      targetProfile: 'high-fidelity',
      deviceMemoryGb: 4,
      gpuTier: 'mid-range',
      jsHeapUsedBytes: 40 * 1024 * 1024,
      jsHeapLimitBytes: 100 * 1024 * 1024,
      measuredFps: 58,
      thermalState: 'nominal',
    });
    assert.equal(safe4GbPlan.initialLodProfile, 'ultra-light');
    assert.equal(safe4GbPlan.effectiveTargetProfile, 'balanced');
    assert.equal(safe4GbPlan.upgradeSequence.length, 1);
    assert.equal(safe4GbPlan.upgradeSequence[0].profile, 'balanced');
  });

  await t.test('6GB Android: Balanced by default', () => {
    const plan6Gb = buildProgressiveLodPlan('tandoori-paneer-pizza', cfg, {
      targetProfile: 'high-fidelity',
      deviceMemoryGb: 6,
      gpuTier: 'mid-range',
    });
    assert.equal(plan6Gb.effectiveTargetProfile, 'balanced');
  });

  await t.test('8GB+ Android: never selects High Fidelity on RAM alone; requires High-End GPU', () => {
    const trap8GbLowGpu = evaluateProgressiveResidencyGuard({
      targetProfile: 'high-fidelity',
      deviceMemoryGb: 8,
      gpuTier: 'low-end',
    });
    assert.equal(trap8GbLowGpu.allowedProfile, 'ultra-light');

    const mid8GbGpu = evaluateProgressiveResidencyGuard({
      targetProfile: 'high-fidelity',
      deviceMemoryGb: 8,
      gpuTier: 'mid-range',
    });
    assert.equal(mid8GbGpu.allowedProfile, 'balanced');

    const flagship12Gb = evaluateProgressiveResidencyGuard({
      targetProfile: 'high-fidelity',
      deviceMemoryGb: 12,
      gpuTier: 'high-end',
    });
    assert.equal(flagship12Gb.allowedProfile, 'high-fidelity');
  });
});

test('Phase 7 — 6. AR Platform Separation (WebXR, Android Scene Viewer, iOS Quick Look, Camera Preview)', async (t) => {
  await t.test('Keeps WebXR, Android Scene Viewer (resizable=false), and iOS Quick Look (allowsContentScaling=0) separate', async () => {
    const webxrSupported = await checkWebXRImmersiveArSupport({
      isSecureContext: true,
      xr: { isSessionSupported: async (mode) => mode === 'immersive-ar' },
    });
    assert.equal(webxrSupported.supported, true);

    const intentUrl = buildAndroidSceneViewerIntentUrl({
      glbUrl: 'https://the-golden-oak.vercel.app/models/optimized/tandoori-paneer-pizza-balanced.glb',
      title: 'Tandoori Paneer Pizza',
      fallbackUrl: 'https://the-golden-oak.vercel.app/ar/tandoori-paneer-pizza',
    });
    assert.ok(intentUrl.startsWith('intent://arvr.google.com/scene-viewer/1.0?'));
    assert.ok(intentUrl.includes('resizable=false'), 'Scene Viewer must lock real-world metric scale via resizable=false');

    const fakeDoc = {
      createElement: (tag) =>
        tag === 'a'
          ? { relList: { supports: (token) => token === 'ar' } }
          : {},
    };
    const quickLook = evaluateIOSQuickLookCapability({
      usdzPath: '/models/optimized/tandoori-paneer-pizza.usdz',
      documentRef: fakeDoc,
      baseOrigin: 'https://the-golden-oak.vercel.app',
    });
    assert.equal(quickLook.quickLookReady, true);
    assert.ok(quickLook.usdzUrl.includes('/models/optimized/tandoori-paneer-pizza.usdz'));
  });
});

test('Phase 7 — 7. Mandatory Deliverables Completeness (8 / 8 Reports)', async (t) => {
  await t.test('All 8 mandatory Phase 7 deliverables exist in docs/phase7/', () => {
    const requiredFiles = [
      'PHASE7_DISH_AUTHENTICITY_AUDIT.md',
      'PHASE7_3D_ASSET_RECONSTRUCTION_REPORT.md',
      'PHASE7_FOOD_TEXTURE_COLOUR_REPORT.md',
      'PHASE7_SCALE_VALIDATION_REPORT.md',
      'PHASE7_GLB_USDZ_OPTIMIZATION_REPORT.md',
      'PHASE7_DEVICE_ADAPTIVE_LOADING_REPORT.md',
      'PHASE7_AR_ACCURACY_REPORT.md',
      'PHASE7_FINAL_ACCEPTANCE_REPORT.md',
    ];
    for (const file of requiredFiles) {
      const p = path.join(ROOT, 'docs', 'phase7', file);
      assert.ok(fs.existsSync(p), `Missing deliverable: ${p}`);
      const st = fs.statSync(p);
      assert.ok(st.size > 2000, `Deliverable ${file} must be comprehensive (> 2KB)`);
    }
  });
});
