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
  scene.updateMatrixWorld(true);
  
  scene.traverse((child) => {
    if (child.isMesh) {
      const box = new THREE.Box3().setFromObject(child);
      const cx = (box.min.x + box.max.x) / 2;
      const cy = (box.min.y + box.max.y) / 2;
      const cz = (box.min.z + box.max.z) / 2;
      const r = Math.sqrt(cx * cx + (cz - 0.6) * (cz - 0.6));
      
      if (r < 3.0 && cy >= 0.4 && cy <= 1.8) {
        console.log(`Mesh: '${child.name}', Mat: '${child.material?.name}', cy: ${cy.toFixed(2)}, Y: [${box.min.y.toFixed(2)}, ${box.max.y.toFixed(2)}], r: ${r.toFixed(2)}`);
      }
    }
  });
});
