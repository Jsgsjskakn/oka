import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Agent 12: Static Media & Dead-Weight Bundle Auditor', () => {
  const rootDir = process.cwd();
  const manifestPath = path.join(rootDir, 'scripts', 'unreferenced-assets-manifest.json');
  const publicDir = path.join(rootDir, 'public');

  it('1. Manifest exists and is valid JSON', () => {
    assert.equal(fs.existsSync(manifestPath), true, 'Manifest file must exist at scripts/unreferenced-assets-manifest.json');
    const content = fs.readFileSync(manifestPath, 'utf8');
    assert.doesNotThrow(() => JSON.parse(content), 'Manifest must be valid parseable JSON');
  });

  it('2. Safety Rule Invariant: NO files have been destructively deleted from public/', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.ok(manifest.summary.total_public_files_count >= 78, 'Must account for all files in public/');

    // Check that every single file listed in manifest actually exists on disk
    for (const asset of manifest.unreferenced_assets) {
      const fullPath = path.join(publicDir, asset.relative_to_public);
      assert.equal(fs.existsSync(fullPath), true, `Unreferenced file must still exist on disk: ${asset.relative_to_public}`);
    }

    for (const asset of manifest.actively_referenced_assets) {
      const fullPath = path.join(publicDir, asset.relative_to_public);
      assert.equal(fs.existsSync(fullPath), true, `Referenced file must exist on disk: ${asset.relative_to_public}`);
    }
  });

  it('3. Unreferenced assets metadata integrity (dimensions, size_bytes, type)', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.ok(manifest.unreferenced_assets.length >= 45, 'Must have at least 45 unreferenced assets');

    for (const asset of manifest.unreferenced_assets) {
      assert.ok(asset.size_bytes > 0, `size_bytes must be > 0 for ${asset.relative_to_public}`);
      assert.ok(asset.type, `type must be defined for ${asset.relative_to_public}`);
      assert.ok(asset.dimensions, `dimensions must be defined for ${asset.relative_to_public}`);
      assert.ok(asset.category, `category must be specified for ${asset.relative_to_public}`);
      assert.ok(asset.reason, `reason must be specified for ${asset.relative_to_public}`);
    }
  });

  it('4. Actively referenced assets verification', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.ok(manifest.actively_referenced_assets.length >= 30, 'Must have at least 30 actively referenced assets');

    for (const asset of manifest.actively_referenced_assets) {
      assert.ok(asset.references.length > 0, `Active asset must have at least one code reference: ${asset.relative_to_public}`);
      for (const ref of asset.references) {
        assert.ok(ref.file, 'Reference must have a file path');
        assert.ok(ref.line > 0, 'Reference must have a line number');
      }
    }
  });

  it('5. Deployment payload savings calculation accuracy', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const summary = manifest.summary;

    const unrefSum = manifest.unreferenced_assets.reduce((acc, a) => acc + a.size_bytes, 0);
    const refSum = manifest.actively_referenced_assets.reduce((acc, a) => acc + a.size_bytes, 0);

    assert.equal(summary.unreferenced_size_bytes, unrefSum, 'unreferenced_size_bytes must match sum of unreferenced assets');
    assert.equal(summary.actively_referenced_size_bytes, refSum, 'actively_referenced_size_bytes must match sum of referenced assets');
    assert.equal(summary.total_public_size_bytes, unrefSum + refSum, 'Total size must match sum of referenced + unreferenced');
    assert.ok(summary.deployment_payload_savings.reduction_percentage > 50, 'Edge deployment payload reduction must be > 50%');
  });

  it('6. Phase 1 baseline reconciliation', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const recon = manifest.summary.phase_1_baseline_reconciliation;

    assert.ok(recon.legacy_dead_weight_count >= 44, 'Must reconcile Phase 1 ~46 assets');
    assert.ok(recon.legacy_dead_weight_mb >= 18.0, 'Must reconcile Phase 1 ~18 MB dead weight');
  });
});
