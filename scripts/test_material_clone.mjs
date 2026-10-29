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
  
  // Clone materials for unique meshes so modifying one doesn't unintentionally overwrite others!
  scene.traverse((child) => {
    if (child.isMesh && child.material) {
      const name = (child.material.name || '').toLowerCase();
      const objName = (child.name || '').toLowerCase();
      
      if (
        objName.includes('rotunda') || 
        objName.includes('fountain') || 
        objName.includes('chandelier') ||
        name.includes('rotunda') ||
        name.includes('water') ||
        name.includes('crystal')
      ) {
        child.material = child.material.clone();
      }
    }
  });

  console.log('Materials successfully cloned for rotunda, fountain, chandelier.');
});
