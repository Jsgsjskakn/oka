import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Agent 11: HDR Environment Map & Prefiltered IBL Optimizer', () => {
  const rootDir = process.cwd();
  const origPath = path.join(rootDir, 'public', 'textures', 'forest_env.hdr');
  const optPath = path.join(rootDir, 'public', 'textures', 'forest_env.optimized.hdr');
  const benchPath = path.join(rootDir, 'scratch', 'hdr_optimization_benchmark.json');

  it('1. Safety Rule: Original HDR is preserved and never overwritten', () => {
    assert.equal(fs.existsSync(origPath), true, 'Original forest_env.hdr must exist');
    const origStat = fs.statSync(origPath);
    assert.equal(origStat.size, 1881946, 'Original file size must remain strictly 1,881,946 bytes');
  });

  it('2. Companion HDR exists with 74.5% payload reduction', () => {
    assert.equal(fs.existsSync(optPath), true, 'Optimized companion forest_env.optimized.hdr must exist');
    const optStat = fs.statSync(optPath);
    assert.equal(optStat.size, 479253, 'Optimized file size is 479,253 bytes (~479 KB)');

    const reductionPct = ((1881946 - optStat.size) / 1881946) * 100;
    assert.ok(reductionPct >= 74.0, `Payload reduction must be >= 74% (actual: ${reductionPct.toFixed(2)}%)`);
  });

  it('3. Three.js RGBE/HDR loader parses both textures into correct dimensions', async () => {
    let loader;
    try {
      const { HDRLoader } = await import('three/examples/jsm/loaders/HDRLoader.js');
      loader = new HDRLoader();
    } catch {
      const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js');
      loader = new RGBELoader();
    }

    const origBuf = fs.readFileSync(origPath);
    const origData = loader.parse(origBuf.buffer.slice(origBuf.byteOffset, origBuf.byteOffset + origBuf.byteLength));
    assert.equal(origData.width, 1024, 'Original width must be 1024');
    assert.equal(origData.height, 512, 'Original height must be 512');
    assert.equal(origData.data.length, 1024 * 512 * 4, 'Original texel buffer length is 1024*512*4');

    const optBuf = fs.readFileSync(optPath);
    const optData = loader.parse(optBuf.buffer.slice(optBuf.byteOffset, optBuf.byteOffset + optBuf.byteLength));
    assert.equal(optData.width, 512, 'Optimized width must be 512');
    assert.equal(optData.height, 256, 'Optimized height must be 256');
    assert.equal(optData.data.length, 512 * 256 * 4, 'Optimized texel buffer length is 512*256*4 (75% buffer reduction)');
  });

  it('4. Optimization benchmark JSON verifies visual fidelity and performance metrics', () => {
    assert.equal(fs.existsSync(benchPath), true, 'Benchmark JSON must exist in scratch/');
    const bench = JSON.parse(fs.readFileSync(benchPath, 'utf8'));

    assert.equal(bench.success, true);
    assert.ok(bench.file_sizes.reduction_percentage >= 74.0);
    assert.ok(bench.js_decode_benchmark.speedup >= 3.0, 'JS decode speedup must be at least 3.0x');
    assert.ok(bench.visual_fidelity.luminance_conservation_pct >= 99.0, 'Luminance energy conservation >= 99%');
    assert.ok(bench.visual_fidelity.max_chromaticity_shift <= 0.001, 'Chromaticity shift <= 0.001');

    for (const check of bench.checks) {
      assert.equal(check.passed, true, `Check failed: ${check.name}`);
    }
  });
});
