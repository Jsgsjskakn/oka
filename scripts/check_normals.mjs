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
    if (child.isMesh && (child.name === 'Rotunda_Water_Surface' || child.name === 'Rotunda_Pool_Floor_Nero')) {
      const geo = child.geometry;
      console.log(`Mesh '${child.name}': count=${geo.attributes.position.count}, index=${geo.index ? geo.index.count : 'no index'}`);
      const normals = geo.attributes.normal;
      if (normals) {
        console.log(`  Normal sample 0: [${normals.getX(0)}, ${normals.getY(0)}, ${normals.getZ(0)}]`);
      }
    }
  });
});
