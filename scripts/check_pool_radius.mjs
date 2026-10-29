import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

global.self = global;
global.window = global;

const glbPath = './public/models/the_golden_oak_interior.glb';
const buf = fs.readFileSync(glbPath);
const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const loader = new GLTFLoader();
loader.parse(arrayBuffer, '', (gltf) => {
  const scene = gltf.scene;
  
  scene.traverse((child) => {
    if (child.isMesh && (child.name.includes('Rotunda') || child.name.includes('Pool') || child.name.includes('Basin'))) {
      child.geometry.computeBoundingBox();
      const bb = child.geometry.boundingBox;
      console.log(`Mesh: '${child.name}', Mat: '${child.material?.name}', X: [${bb.min.x.toFixed(2)}, ${bb.max.x.toFixed(2)}], Y: [${bb.min.y.toFixed(2)}, ${bb.max.y.toFixed(2)}], Z: [${bb.min.z.toFixed(2)}, ${bb.max.z.toFixed(2)}]`);
    }
  });
});
