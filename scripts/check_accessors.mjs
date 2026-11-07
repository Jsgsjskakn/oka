import fs from 'node:fs';
import * as THREE from 'three';

function readGlbHeaderAndJson(diskPath) {
  const buf = fs.readFileSync(diskPath);
  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
  return { gltf: JSON.parse(jsonStr) };
}

for (const name of ['warrior-lod0-high.glb', 'golden-oak-burger-master.glb']) {
  const p = `public/models/optimized/${name}`;
  if (!fs.existsSync(p)) continue;
  const { gltf } = readGlbHeaderAndJson(p);
  // Find position accessor bounds
  const posAccessors = gltf.accessors.filter(a => a.type === 'VEC3' && a.min && a.max);
  console.log(`\n=== Bounds for ${name} ===`);
  for (let i = 0; i < Math.min(posAccessors.length, 3); i++) {
    console.log(`Accessor ${i}: min=`, posAccessors[i].min, `max=`, posAccessors[i].max);
  }
}
