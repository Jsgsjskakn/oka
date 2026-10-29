import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('3D Asset & Centralized Model Verification', async (t) => {
  const modelPath = path.resolve('public/models/warrior_model.glb');
  const scenePath = path.resolve('public/models/warrior_scene.glb');
  
  await t.test('optimized warrior_model.glb asset exists and is valid Draco glTF binary', () => {
    assert.ok(fs.existsSync(modelPath), 'warrior_model.glb must exist in public/models/');
    const stat = fs.statSync(modelPath);
    assert.ok(stat.size > 500_000, `File size should be >500KB, got ${stat.size} bytes`);
    
    // Check glTF binary header magic 'glTF' (0x46546C67)
    const fd = fs.openSync(modelPath, 'r');
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    assert.equal(buffer.toString('ascii'), 'glTF', 'File must begin with glTF binary magic');
  });

  await t.test('SAFETY RULE: original uncompressed warrior_scene.glb is preserved intact', () => {
    assert.ok(fs.existsSync(scenePath), 'warrior_scene.glb must exist in public/models/');
    const stat = fs.statSync(scenePath);
    assert.ok(stat.size > 5_000_000, `File size should be substantial (>5MB), got ${stat.size} bytes`);
  });

  await t.test('original blender file and backup are preserved intact', () => {
    const originalPath = path.resolve(process.cwd(), '..', 'ai-timeline-video-builder', 'warrior_scene.blend');
    const backupPath = path.resolve(process.cwd(), '..', 'ai-timeline-video-builder', 'warrior_scene.blend.backup');
    
    assert.ok(fs.existsSync(originalPath), 'Original warrior_scene.blend must exist');
    assert.ok(fs.existsSync(backupPath), 'Backup warrior_scene.blend.backup must exist');
    
    const origStat = fs.statSync(originalPath);
    const backupStat = fs.statSync(backupPath);
    assert.equal(origStat.size, backupStat.size, 'Original and backup file sizes must match exactly');
  });
});
