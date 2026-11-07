import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

function readGlbHeaderAndJson(diskPath) {
  const buf = fs.readFileSync(diskPath);
  assert.equal(buf.readUInt32LE(0), 0x46546c67, 'Invalid magic');
  const totalLen = buf.readUInt32LE(8);
  const jsonLen = buf.readUInt32LE(12);
  const jsonType = buf.readUInt32LE(16);
  assert.equal(jsonType, 0x4e4f534a, 'Chunk 0 must be JSON');

  const jsonRaw = buf.subarray(20, 20 + jsonLen);
  let hasNullPad = false;
  for (let i = jsonRaw.length - 1; i >= 0; i--) {
    const byte = jsonRaw[i];
    if (byte === 0x00) {
      hasNullPad = true;
      break;
    }
    if (byte === 0x20) continue;
    break;
  }
  const jsonStr = jsonRaw.toString('utf8');
  const gltf = JSON.parse(jsonStr.trimEnd());
  return { gltf, hasNullPad };
}

const res = readGlbHeaderAndJson('public/models/optimized/test_burger_draco.glb');
console.log('Extensions used:', res.gltf.extensionsUsed);
console.log('hasNullPad (must be false):', res.hasNullPad);
console.log('Images count:', res.gltf.images?.length);
console.log('Meshes count:', res.gltf.meshes?.length);
console.log('Materials count:', res.gltf.materials?.length);
