/**
 * THE GOLDEN OAK — PHASE 7.1 VERIFICATION SUITE
 * REMAINING DISH AUTHENTICITY (6 DEDICATED BLENDER 5.2 MODELS) & PHYSICAL VALIDATION
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  DISH_ASSET_MANIFEST,
} from '../src/data/dish-asset-manifest.ts';
import {
  getModelConfig,
} from '../src/data/model-config.ts';

const ROOT = process.cwd();

const SIX_PHASE71_DISHES = [
  { slug: 'truffle-mushroom-risotto', blend: 'truffle_mushroom_risotto.blend', minTex: 4, minMats: 4 },
  { slug: 'butter-chicken-bao', blend: 'butter_chicken_bao.blend', minTex: 4, minMats: 4 },
  { slug: 'dahi-ke-kebab', blend: 'dahi_ke_kebab.blend', minTex: 3, minMats: 3 },
  { slug: 'crispy-chilli-babycorn', blend: 'crispy_chilli_babycorn.blend', minTex: 3, minMats: 3 },
  { slug: 'dim-sum-platter', blend: 'dim_sum_platter.blend', minTex: 4, minMats: 4 },
  { slug: 'kaffir-lime-mocktail', blend: 'kaffir_lime_mocktail.blend', minTex: 3, minMats: 3 },
];

test('Phase 7.1 — Task 1: Six Dedicated Blender 5.2 Models & Multi-LOD GLB/USDZ Verification', async (t) => {
  await t.test('All 6 native Blender 5.2 source files (.blend) exist on disk in models/blender-sources/', () => {
    for (const item of SIX_PHASE71_DISHES) {
      const blendPath = path.join(ROOT, 'models', 'blender-sources', item.blend);
      assert.ok(fs.existsSync(blendPath), `Missing Blender 5.2 source file: ${blendPath}`);
      const st = fs.statSync(blendPath);
      assert.ok(st.size > 50 * 1024, `Blender source file ${item.blend} must be non-trivial (>50KB)`);
    }
  });

  await t.test('All 6 dishes map to their own dedicated GLB LODs and USDZ (zero gourmet-wok-bowl sharing)', () => {
    for (const item of SIX_PHASE71_DISHES) {
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
      assert.equal(entry.sourceBlendAsset, item.blend);
      assert.equal(entry.profiles.high.hasUVs, true);
      assert.ok(entry.profiles.high.texturesCount >= item.minTex, `${item.slug} must have >= ${item.minTex} textures`);
      assert.ok(entry.profiles.high.materialsCount >= item.minMats, `${item.slug} must have >= ${item.minMats} materials`);
      assert.equal(entry.pbrMaterialAudit.zeroMetallicVerified, true);
      assert.equal(entry.pbrMaterialAudit.zeroEmissiveVerified, true);

      // Strict monotonic byte progression across LODs
      assert.ok(
        entry.profiles.ultraLight.sizeBytes < entry.profiles.balanced.sizeBytes,
        `${item.slug} ultraLight (${entry.profiles.ultraLight.sizeKb}KB) must be smaller than balanced (${entry.profiles.balanced.sizeKb}KB)`
      );
      assert.ok(
        entry.profiles.balanced.sizeBytes < entry.profiles.high.sizeBytes,
        `${item.slug} balanced (${entry.profiles.balanced.sizeKb}KB) must be smaller than high (${entry.profiles.high.sizeKb}KB)`
      );
    }
  });
});

test('Phase 7.1 — Task 2 & Task 3: 23-Dish Catalog Audit & Physical Scale Honesty', async (t) => {
  await t.test('All 23/23 dishes are authentic-dedicated with zero placeholders or stand-ins', () => {
    const counts = {
      'authentic-dedicated': 0,
      'duplicate-primary-mesh': 0,
      'same-family-variant': 0,
      'cross-recipe-stand-in': 0,
      'untextured-generic-placeholder': 0,
    };
    for (const entry of Object.values(DISH_ASSET_MANIFEST)) {
      counts[entry.authenticityClassification]++;
      assert.equal(entry.scaleValidated, false, `${entry.dishId} must keep scaleValidated: false`);
      assert.ok(entry.profiles.high.texturesCount > 0, `${entry.dishId} must have embedded textures`);
    }
    assert.equal(counts['authentic-dedicated'], 23);
    assert.equal(counts['duplicate-primary-mesh'], 0);
    assert.equal(counts['same-family-variant'], 0);
    assert.equal(counts['cross-recipe-stand-in'], 0);
    assert.equal(counts['untextured-generic-placeholder'], 0);
  });

  await t.test('Phase 7.1 report and kitchen measurement template exist on disk', () => {
    const reportPath = path.join(ROOT, 'docs', 'phase7.1', 'PHASE7_1_REMAINING_DISH_AUTHENTICITY_AND_VALIDATION.md');
    const templatePath = path.join(ROOT, 'docs', 'phase7.1', 'KITCHEN_PHYSICAL_MEASUREMENT_TEMPLATE.md');
    assert.ok(fs.existsSync(reportPath), `Missing Phase 7.1 report: ${reportPath}`);
    assert.ok(fs.existsSync(templatePath), `Missing Kitchen Measurement Template: ${templatePath}`);
  });
});
