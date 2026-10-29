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
    if (child.isMesh && (child.name.includes('Rotunda') || child.name.includes('Fountain') || child.name.includes('Chandelier'))) {
      const box = new THREE.Box3().setFromObject(child);
      if (child.name.includes('Water') || child.name.includes('Pool') || child.name.includes('Basin') || child.name.includes('CrystalPrism') || child.name.includes('Rod') || child.name.includes('Tier')) {
        console.log(`Mesh: '${child.name}', Mat: '${child.material?.name}', MinY: ${box.min.y.toFixed(3)}, MaxY: ${box.max.y.toFixed(3)}, Center: [${((box.min.x+box.max.x)/2).toFixed(2)}, ${((box.min.y+box.max.y)/2).toFixed(2)}, ${((box.min.z+box.max.z)/2).toFixed(2)}]`);
      }
    }
  });
});
