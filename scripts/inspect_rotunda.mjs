import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Polyfill self and window for Three.js
global.self = global;
global.window = global;

const glbPath = './public/models/the_golden_oak_interior.glb';
const buf = fs.readFileSync(glbPath);
const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const loader = new GLTFLoader();
loader.parse(arrayBuffer, '', (gltf) => {
  const scene = gltf.scene;
  
  scene.traverse((child) => {
    if (child.isMesh) {
      const name = (child.name || '').toLowerCase();
      const mat = child.material;
      const matName = (mat?.name || '').toLowerCase();
      
      if (
        name.includes('rotunda') || 
        name.includes('pool') || 
        name.includes('basin') || 
        name.includes('water') || 
        name.includes('fountain') ||
        name.includes('chalice') ||
        name.includes('chandelier') ||
        name.includes('rug') ||
        matName.includes('rotunda') || 
        matName.includes('water') || 
        matName.includes('nero')
      ) {
        console.log(`Mesh: '${child.name}', Mat: '${mat?.name}', BaseColor: #${mat?.color?.getHexString()}, Emissive: #${mat?.emissive?.getHexString?.() || 'none'}, Roughness: ${mat?.roughness}, Transparent: ${mat?.transparent}, Opacity: ${mat?.opacity}`);
      }
    }
  });
}, (err) => console.error(err));
