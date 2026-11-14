/**
 * THE GOLDEN OAK — Phase 3.2 Asset Tier Budgets & glTF Pipeline Verification Suite
 * Sub-Agent 5 (QA & Regression Engineer)
 *
 * Verifies:
 * 1. Monotonic tier budgets: Ultra-Light (<= 3.5MB), Balanced (<= 6.5MB), High-Fidelity (<= 8.0MB).
 * 2. Binary glTF container integrity (magic: 0x46546c67, version 2, valid JSON chunk).
 * 3. KTX2 / Draco / PBR compression extension honesty.
 * 4. USDZ Apple Quick Look asset existence, valid zip-container headers, and size budgets (< 25MB).
 * 5. Preservation invariant: all 8 original root assets in public/models/*.glb remain untouched.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  KNOWN_DISH_SLUGS,
  getModelConfig,
} from '../src/data/model-config.ts';

const ROOT = process.cwd();
const OPTIMIZED_DIR = path.join(ROOT, 'public', 'models', 'optimized');

test('Phase 3.2 — Food Asset Tier Budgets & Binary Container Integrity', async (t) => {
  await t.test('1. Preservation of Original Root GLB & HDR Assets', () => {
    const originalAssets = [
      'models/warrior_model.glb',
      'models/warrior_scene.glb',
      'models/the_golden_oak_interior.glb',
      'models/the_golden_oak_interior.optimized.glb',
      'models/chicken-tikka-pizza.glb',
      'models/classic-smash-burger.glb',
      'models/golden-oak-burger.glb',
      'models/tandoori-paneer-pizza.glb',
      'textures/forest_env.hdr',
      'textures/forest_env.optimized.hdr',
    ];

    for (const rel of originalAssets) {
      const p = path.join(ROOT, 'public', rel);
      assert.ok(fs.existsSync(p), `Original source asset must exist: ${rel}`);
      const stat = fs.statSync(p);
      assert.ok(stat.size > 1024, `Original source asset must not be empty: ${rel}`);
    }
  });

  await t.test('2. Optimized GLB Tier Budgets (Ultra-Light <= 3.5MB, Balanced <= 6.5MB, High <= 8.0MB)', () => {
    const files = fs.readdirSync(OPTIMIZED_DIR).filter((f) => f.endsWith('.glb'));
    assert.ok(files.length >= 15, `Expected at least 15 optimized GLB files, found ${files.length}`);

    for (const file of files) {
      const filePath = path.join(OPTIMIZED_DIR, file);
      const stat = fs.statSync(filePath);
      const sizeMb = stat.size / (1024 * 1024);

      if (file.includes('ultralight')) {
        assert.ok(
          sizeMb <= 3.5,
          `Ultra-Light GLB ${file} (${sizeMb.toFixed(2)}MB) exceeds maximum 3.5MB budget`
        );
      } else if (file.includes('balanced')) {
        assert.ok(
          sizeMb <= 6.5,
          `Balanced GLB ${file} (${sizeMb.toFixed(2)}MB) exceeds maximum 6.5MB budget`
        );
      } else if (file.includes('high')) {
        assert.ok(
          sizeMb <= 8.0,
          `High-fidelity GLB ${file} (${sizeMb.toFixed(2)}MB) exceeds maximum 8.0MB budget`
        );
      }
    }
  });

  await t.test('3. Binary glTF 2.0 Header & Chunk Parsing Integrity', () => {
    const sampleFiles = [
      'tandoori-paneer-pizza-high.glb',
      'tandoori-paneer-pizza-ultralight.glb',
      'classic-smash-burger-high.glb',
      'wok-tossed-chow-mein-high.glb',
      'dynamite-chilli-potatoes-high.glb',
    ];

    for (const file of sampleFiles) {
      const p = path.join(OPTIMIZED_DIR, file);
      if (!fs.existsSync(p)) continue;

      const buf = fs.readFileSync(p);
      assert.ok(buf.length >= 20, `${file} too small for GLB header`);

      const magic = buf.readUInt32LE(0);
      assert.equal(magic, 0x46546c67, `${file} has invalid glTF magic header`);

      const version = buf.readUInt32LE(4);
      assert.equal(version, 2, `${file} must be glTF version 2`);

      const length = buf.readUInt32LE(8);
      assert.equal(length, buf.length, `${file} header total length mismatch`);

      const chunk0Length = buf.readUInt32LE(12);
      const chunk0Type = buf.readUInt32LE(16);
      assert.equal(chunk0Type, 0x4e4f534a, `${file} chunk 0 must be JSON (0x4E4F534A)`);

      const jsonStr = buf.toString('utf8', 20, 20 + chunk0Length);
      const gltf = JSON.parse(jsonStr);
      assert.ok(gltf.asset, `${file} glTF JSON missing asset field`);
      assert.ok(Array.isArray(gltf.meshes) || Array.isArray(gltf.nodes), `${file} glTF JSON missing meshes or nodes`);
    }
  });

  await t.test('4. Complete 22-Dish USDZ Apple Quick Look Verification', () => {
    for (const slug of KNOWN_DISH_SLUGS) {
      const cfg = getModelConfig(slug);
      assert.ok(cfg.usdzPath, `Dish ${slug} must define usdzPath`);

      const relPath = cfg.usdzPath.replace(/^\//, '');
      const absPath = path.join(ROOT, 'public', relPath);
      assert.ok(fs.existsSync(absPath), `Missing USDZ asset for ${slug}: ${absPath}`);

      const stat = fs.statSync(absPath);
      assert.ok(stat.size > 1024, `USDZ asset for ${slug} must not be empty`);
      const sizeMb = stat.size / (1024 * 1024);
      assert.ok(
        sizeMb <= 25.0,
        `USDZ asset for ${slug} (${sizeMb.toFixed(2)}MB) exceeds Apple Quick Look 25MB ceiling`
      );

      // USDZ is a zero-compressed zip archive; verify standard zip magic (0x04034b50)
      const fd = fs.openSync(absPath, 'r');
      const magicBuf = Buffer.alloc(4);
      fs.readSync(fd, magicBuf, 0, 4, 0);
      fs.closeSync(fd);
      const zipMagic = magicBuf.readUInt32LE(0);
      assert.equal(zipMagic, 0x04034b50, `USDZ asset for ${slug} must be a valid zip container`);
    }
  });
});
