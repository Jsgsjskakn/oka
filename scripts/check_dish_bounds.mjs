import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// Setup node-compatible loaders
const loader = new GLTFLoader();

const files = [
  'public/models/optimized/golden-oak-burger-high.glb',
  'public/models/optimized/classic-smash-burger-high.glb',
  'public/models/optimized/tandoori-paneer-pizza-high.glb'
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const buf = fs.readFileSync(f);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  loader.parse(ab, '', (gltf) => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    console.log(`Bounds for ${f}:`);
    console.log('  Size:', size);
    console.log('  Center:', center);
    console.log('  Min:', box.min);
    console.log('  Max:', box.max);
  }, (err) => console.error(`Error loading ${f}:`, err));
}
