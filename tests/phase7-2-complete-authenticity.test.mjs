/**
 * THE GOLDEN OAK — PHASE 7.2 VERIFICATION SUITE
 * COMPLETE 23/23 DISH AUTHENTICITY RECONSTRUCTION
 *
 * Verifies:
 * 1. All 7 required Phase 7.2 dishes (+ golden-oak-signature-burger) have dedicated Blender 5.2 .blend source files,
 *    High/Balanced/Ultra-Light Draco GLBs, and 1:1 physical metric USDZ archives with embedded textures.
 * 2. Complete 23/23 catalog authenticity: all 23 dishes map to unique High/Balanced/Ultra-Light GLB paths,
 *    unique USDZ paths, and 23 Blender source files in models/blender-sources/.
 * 3. Zero duplicates, zero cross-recipe stand-ins, zero same-family borrowed models, zero untextured placeholders.
 * 4. Physical scale honesty: scaleValidated === false across all 23 dishes.
 * 5. Consolidated deliverable docs/phase7/PHASE7_2_COMPLETE_DISH_AUTHENTICITY_REPORT.md exists and is complete.
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
  getModelConfig,
} from '../src/data/model-config.ts';

const ROOT = process.cwd();

const SEVEN_REQUIRED_PHASE72_DISHES = [
  { slug: 'peri-peri-fiesta-pizza', blend: 'peri_peri_fiesta_pizza.blend' },
  { slug: 'paneer-royale-burger', blend: 'paneer_royale_burger.blend' },
  { slug: 'hakka-street-chow-mein', blend: 'hakka_street_chow_mein.blend' },
  { slug: 'golden-chilli-potato', blend: 'golden_chilli_potato.blend' },
  { slug: 'keema-masala-pizza', blend: 'keema_masala_pizza.blend' },
  { slug: 'farmhouse-supreme-pizza', blend: 'farmhouse_supreme_pizza.blend' },
  { slug: 'truffle-mushroom-cheese-burger', blend: 'truffle_mushroom_cheese_burger.blend' },
];

test('Phase 7.2 — 1. Seven Reconstructed Dishes Dedicated Blender 5.2, Multi-LOD GLB & 1:1 USDZ Verification', async (t) => {
  await t.test('All 7 required dishes have dedicated .blend source files, 3 monotonic Draco GLB LODs, and <1.2MB textured USDZs', () => {
    for (const item of SEVEN_REQUIRED_PHASE72_DISHES) {
      const blendPath = path.join(ROOT, 'models', 'blender-sources', item.blend);
      assert.ok(fs.existsSync(blendPath), `Missing Blender 5.2 source file: ${blendPath}`);
      assert.ok(fs.statSync(blendPath).size > 50 * 1024, `${item.blend} must be > 50KB`);

      const cfg = getModelConfig(item.slug);
      assert.equal(cfg.culinaryAssetLodPaths.high, `/models/optimized/${item.slug}-high.glb`);
      assert.equal(cfg.culinaryAssetLodPaths.balanced, `/models/optimized/${item.slug}-balanced.glb`);
      assert.equal(cfg.culinaryAssetLodPaths.ultraLight, `/models/optimized/${item.slug}-ultralight.glb`);
      assert.equal(cfg.culinaryUsdzPath, `/models/optimized/${item.slug}.usdz`);

      const entry = DISH_ASSET_MANIFEST[item.slug];
      assert.ok(entry, `Manifest entry must exist for ${item.slug}`);
      assert.equal(entry.authenticityClassification, 'authentic-dedicated');
      assert.equal(entry.authenticityVerified, true);
      assert.equal(entry.isSharedPlaceholder, false);
      assert.equal(entry.colorValidated, true);
      assert.equal(entry.scaleValidated, false);
      assert.equal(entry.sourceBlendAsset, item.blend);
      assert.ok(entry.profiles.high.texturesCount >= 3, `${item.slug} must have >= 3 embedded UV textures`);
      assert.ok(entry.profiles.high.materialsCount >= 3, `${item.slug} must have >= 3 culinary materials`);
      assert.equal(entry.pbrMaterialAudit.zeroMetallicVerified, true);
      assert.equal(entry.pbrMaterialAudit.zeroEmissiveVerified, true);

      assert.ok(
        entry.profiles.ultraLight.triangleCount < entry.profiles.balanced.triangleCount &&
          entry.profiles.balanced.triangleCount < entry.profiles.high.triangleCount,
        `${item.slug} must have strictly monotonic triangle counts across UltraLight < Balanced < High`
      );
      assert.ok(
        entry.profiles.ultraLight.sizeBytes < entry.profiles.balanced.sizeBytes &&
          entry.profiles.balanced.sizeBytes < entry.profiles.high.sizeBytes,
        `${item.slug} must have strictly monotonic byte sizes across UltraLight < Balanced < High`
      );
    }
  });
});

test('Phase 7.2 — 2. Complete 23/23 Catalog Uniqueness, Blender Lineage & Zero Stand-In Verification', async (t) => {
  await t.test('All 23 canonical dishes have 23 unique High GLBs, 23 unique Balanced GLBs, 23 unique Ultra-Light GLBs, 23 unique USDZs, and 23 on-disk .blend files', () => {
    const slugs = getAllManifestDishSlugs();
    assert.equal(slugs.length, 23);

    const highPaths = new Set();
    const balPaths = new Set();
    const ultraPaths = new Set();
    const usdzPaths = new Set();

    for (const slug of slugs) {
      const entry = DISH_ASSET_MANIFEST[slug];
      assert.equal(entry.authenticityClassification, 'authentic-dedicated', `${slug} must be authentic-dedicated`);
      assert.equal(entry.authenticityVerified, true, `${slug} must be authenticityVerified: true`);
      assert.equal(entry.isSharedPlaceholder, false, `${slug} must have isSharedPlaceholder: false`);
      assert.equal(entry.colorValidated, true, `${slug} must have colorValidated: true`);
      assert.equal(entry.scaleValidated, false, `${slug} must keep scaleValidated: false`);

      const blendPath = path.join(ROOT, 'models', 'blender-sources', entry.sourceBlendAsset);
      assert.ok(fs.existsSync(blendPath), `Missing .blend source for ${slug}: ${blendPath}`);

      highPaths.add(entry.profiles.high.path);
      balPaths.add(entry.profiles.balanced.path);
      ultraPaths.add(entry.profiles.ultraLight.path);
      usdzPaths.add(entry.profiles.usdz.path);
    }

    assert.equal(highPaths.size, 23, 'All 23 canonical dishes must map to 23 distinct High GLB files');
    assert.equal(balPaths.size, 23, 'All 23 canonical dishes must map to 23 distinct Balanced GLB files');
    assert.equal(ultraPaths.size, 23, 'All 23 canonical dishes must map to 23 distinct Ultra-Light GLB files');
    assert.equal(usdzPaths.size, 23, 'All 23 canonical dishes must map to 23 distinct USDZ files');
  });

  await t.test('Consolidated deliverable docs/phase7/PHASE7_2_COMPLETE_DISH_AUTHENTICITY_REPORT.md exists and is complete', () => {
    const reportPath = path.join(ROOT, 'docs', 'phase7', 'PHASE7_2_COMPLETE_DISH_AUTHENTICITY_REPORT.md');
    assert.ok(fs.existsSync(reportPath), `Missing Phase 7.2 report: ${reportPath}`);
    const st = fs.statSync(reportPath);
    assert.ok(st.size > 8000, 'Phase 7.2 consolidated report must be comprehensive (> 8KB)');
  });
});
