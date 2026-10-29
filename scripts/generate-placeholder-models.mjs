// Script to generate minimal valid GLB files for development
// Run with: node scripts/generate-placeholder-models.mjs

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const modelsDir = join(__dirname, '..', 'public', 'models');

// Generate a minimal valid GLB with a colored disc (simulating a plate/pizza/burger shape)
function createMinimalGLB(color) {
  // Create a simple disc mesh (low-poly circle)
  const segments = 32;
  const radius = 0.5;
  const height = 0.08;
  
  const positions = [];
  const normals = [];
  const indices = [];
  
  // Top center vertex
  positions.push(0, height/2, 0);
  normals.push(0, 1, 0);
  
  // Top ring
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    positions.push(Math.cos(angle) * radius, height/2, Math.sin(angle) * radius);
    normals.push(0, 1, 0);
  }
  
  // Top face triangles
  for (let i = 0; i < segments; i++) {
    indices.push(0, i + 1, ((i + 1) % segments) + 1);
  }
  
  // Bottom center vertex
  const bottomCenter = segments + 1;
  positions.push(0, -height/2, 0);
  normals.push(0, -1, 0);
  
  // Bottom ring
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    positions.push(Math.cos(angle) * radius, -height/2, Math.sin(angle) * radius);
    normals.push(0, -1, 0);
  }
  
  // Bottom face triangles (reversed winding)
  for (let i = 0; i < segments; i++) {
    indices.push(bottomCenter, ((i + 1) % segments) + bottomCenter + 1, i + bottomCenter + 1);
  }
  
  // Side faces
  for (let i = 0; i < segments; i++) {
    const top1 = i + 1;
    const top2 = ((i + 1) % segments) + 1;
    const bot1 = i + bottomCenter + 1;
    const bot2 = ((i + 1) % segments) + bottomCenter + 1;
    indices.push(top1, bot1, top2);
    indices.push(top2, bot1, bot2);
  }
  
  const posArray = new Float32Array(positions);
  const normArray = new Float32Array(normals);
  const idxArray = new Uint16Array(indices);
  
  const posBuffer = Buffer.from(posArray.buffer);
  const normBuffer = Buffer.from(normArray.buffer);
  const idxBuffer = Buffer.from(idxArray.buffer);
  
  // Pad to 4-byte alignment
  function pad(buf) {
    const remainder = buf.length % 4;
    if (remainder === 0) return buf;
    return Buffer.concat([buf, Buffer.alloc(4 - remainder)]);
  }
  
  const paddedPos = pad(posBuffer);
  const paddedNorm = pad(normBuffer);
  const paddedIdx = pad(idxBuffer);
  const binData = Buffer.concat([paddedIdx, paddedPos, paddedNorm]);
  
  const vertexCount = positions.length / 3;
  
  const gltf = {
    asset: { version: "2.0", generator: "golden-oak-placeholder" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
      primitives: [{
        attributes: { POSITION: 1, NORMAL: 2 },
        indices: 0,
        material: 0
      }]
    }],
    materials: [{
      pbrMetallicRoughness: {
        baseColorFactor: color,
        metallicFactor: 0.1,
        roughnessFactor: 0.7
      }
    }],
    accessors: [
      { bufferView: 0, componentType: 5123, count: indices.length, type: "SCALAR" },
      { bufferView: 1, componentType: 5126, count: vertexCount, type: "VEC3",
        max: [radius, height/2, radius], min: [-radius, -height/2, -radius] },
      { bufferView: 2, componentType: 5126, count: vertexCount, type: "VEC3" }
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: paddedIdx.length, target: 34963 },
      { buffer: 0, byteOffset: paddedIdx.length, byteLength: paddedPos.length, target: 34962 },
      { buffer: 0, byteOffset: paddedIdx.length + paddedPos.length, byteLength: paddedNorm.length, target: 34962 }
    ],
    buffers: [{ byteLength: binData.length }]
  };
  
  const jsonStr = JSON.stringify(gltf);
  const jsonBuf = Buffer.from(jsonStr);
  const paddedJson = pad(jsonBuf);
  
  // GLB header: magic + version + length
  // Chunk 0: JSON
  // Chunk 1: BIN
  const headerSize = 12;
  const jsonChunkHeader = 8;
  const binChunkHeader = 8;
  const totalLength = headerSize + jsonChunkHeader + paddedJson.length + binChunkHeader + binData.length;
  
  const glb = Buffer.alloc(totalLength);
  let offset = 0;
  
  // Header
  glb.writeUInt32LE(0x46546C67, offset); offset += 4; // magic: glTF
  glb.writeUInt32LE(2, offset); offset += 4;           // version
  glb.writeUInt32LE(totalLength, offset); offset += 4;  // length
  
  // JSON chunk
  glb.writeUInt32LE(paddedJson.length, offset); offset += 4;
  glb.writeUInt32LE(0x4E4F534A, offset); offset += 4; // JSON
  paddedJson.copy(glb, offset); offset += paddedJson.length;
  
  // BIN chunk
  glb.writeUInt32LE(binData.length, offset); offset += 4;
  glb.writeUInt32LE(0x004E4942, offset); offset += 4; // BIN
  binData.copy(glb, offset);
  
  return glb;
}

// Generate 3 placeholder models with different colors
const models = [
  { name: 'tandoori-paneer-pizza.glb', color: [0.85, 0.55, 0.2, 1.0] },   // warm orange
  { name: 'chicken-tikka-pizza.glb', color: [0.8, 0.35, 0.15, 1.0] },      // deep orange
  { name: 'classic-smash-burger.glb', color: [0.65, 0.4, 0.2, 1.0] },      // brown
];

for (const model of models) {
  const glb = createMinimalGLB(model.color);
  const path = join(modelsDir, model.name);
  writeFileSync(path, glb);
  console.log(`Created: ${path} (${glb.length} bytes)`);
}

console.log('Done! 3 placeholder GLB models created.');
