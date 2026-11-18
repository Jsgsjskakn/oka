/**
 * THE GOLDEN OAK — Phase 5 Dish Asset Geometry Optimization
 * Agent 2: 3D Food Model Engineer & Visual Fidelity Specialist
 *
 * Resolves over-tessellation in balanced and ultra-light variants of:
 * - bbq-chicken-overload (balanced: ~14K–22K, ultra-light: ~5.5K–9.5K)
 * - crispy-paneer-burger (balanced: ~14K–22K, ultra-light: ~5.5K–9.5K)
 *
 * Uses MeshoptSimplifier.simplifySloppy on uncompressed boundary-rich geometry
 * followed by canonical ground-contact centering (--pivot below) and Draco compression.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { MeshoptSimplifier } from 'meshoptimizer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SCRATCH_DIR = path.join(ROOT_DIR, 'scratch', 'phase5-asset-work');
const OPTIMIZED_DIR = path.join(ROOT_DIR, 'public', 'models', 'optimized');

if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

function runGltfTransform(args) {
  const cmd = `npx --yes @gltf-transform/cli ${args}`;
  execSync(cmd, { cwd: ROOT_DIR, stdio: 'pipe' });
}

export function inspectGlb(glbPath) {
  if (!fs.existsSync(glbPath)) return null;
  const buf = fs.readFileSync(glbPath);
  const sizeBytes = buf.length;
  const sizeKB = Number((sizeBytes / 1024).toFixed(2));
  if (buf.length < 20) return { sizeBytes, sizeKB, valid: false };

  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) return { sizeBytes, sizeKB, valid: false };

  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
  const gltf = JSON.parse(jsonStr.trimEnd());

  let triangleCount = 0;
  let vertexCount = 0;
  let bboxMin = [Infinity, Infinity, Infinity];
  let bboxMax = [-Infinity, -Infinity, -Infinity];

  if (gltf.meshes) {
    for (const mesh of gltf.meshes) {
      if (!mesh.primitives) continue;
      for (const prim of mesh.primitives) {
        if (prim.attributes && prim.attributes.POSITION !== undefined) {
          const posAcc = gltf.accessors[prim.attributes.POSITION];
          if (posAcc) {
            vertexCount += posAcc.count;
            if (posAcc.min) {
              bboxMin[0] = Math.min(bboxMin[0], posAcc.min[0]);
              bboxMin[1] = Math.min(bboxMin[1], posAcc.min[1]);
              bboxMin[2] = Math.min(bboxMin[2], posAcc.min[2]);
            }
            if (posAcc.max) {
              bboxMax[0] = Math.max(bboxMax[0], posAcc.max[0]);
              bboxMax[1] = Math.max(bboxMax[1], posAcc.max[1]);
              bboxMax[2] = Math.max(bboxMax[2], posAcc.max[2]);
            }
          }
        }
        if (prim.indices !== undefined) {
          const indAcc = gltf.accessors[prim.indices];
          if (indAcc) {
            triangleCount += Math.floor(indAcc.count / 3);
          }
        }
      }
    }
  }

  return {
    valid: true,
    sizeBytes,
    sizeKB,
    vertexCount,
    triangleCount,
    bbox: {
      min: bboxMin,
      max: bboxMax,
      width: Number((bboxMax[0] - bboxMin[0]).toFixed(4)),
      height: Number((bboxMax[1] - bboxMin[1]).toFixed(4)),
      depth: Number((bboxMax[2] - bboxMin[2]).toFixed(4)),
    },
  };
}

/**
 * Perform sloppy decimation on an uncompressed GLB buffer.
 */
function sloppyDecimateGlbBuffer(buf, meshTargets) {
  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
  const gltf = JSON.parse(jsonStr.trimEnd());
  const binOffset = 20 + jsonLen + 8;
  const binLen = buf.readUInt32LE(20 + jsonLen);
  const binChunk = buf.subarray(binOffset, binOffset + binLen);

  let totalBefore = 0;
  let totalAfter = 0;

  for (let mIdx = 0; mIdx < gltf.meshes.length; mIdx++) {
    const mesh = gltf.meshes[mIdx];
    for (const prim of mesh.primitives) {
      if (prim.indices === undefined || prim.attributes.POSITION === undefined) continue;

      const indAcc = gltf.accessors[prim.indices];
      const posAcc = gltf.accessors[prim.attributes.POSITION];
      const indBv = gltf.bufferViews[indAcc.bufferView];
      const posBv = gltf.bufferViews[posAcc.bufferView];

      const indByteOffset = (indBv.byteOffset || 0) + (indAcc.byteOffset || 0);
      const posByteOffset = (posBv.byteOffset || 0) + (posAcc.byteOffset || 0);

      const isUint16 = indAcc.componentType === 5123;
      let indices;
      if (isUint16) {
        indices = new Uint32Array(new Uint16Array(binChunk.buffer, binChunk.byteOffset + indByteOffset, indAcc.count));
      } else {
        indices = new Uint32Array(binChunk.buffer, binChunk.byteOffset + indByteOffset, indAcc.count);
      }

      const positions = new Float32Array(binChunk.buffer, binChunk.byteOffset + posByteOffset, posAcc.count * 3);
      totalBefore += indices.length / 3;

      const recipe = meshTargets[mesh.name] || meshTargets['*'];
      if (recipe && recipe.ratio < 1.0) {
        const targetCount = Math.max(6, Math.floor((indices.length * recipe.ratio) / 3) * 3);
        const [simplified, err] = MeshoptSimplifier.simplifySloppy(
          indices,
          positions,
          3,
          null,
          targetCount,
          recipe.error || 0.25
        );
        console.log(`  [Sloppy] Mesh '${mesh.name}': ${indices.length / 3} -> ${simplified.length / 3} tris (err: ${err.toFixed(4)})`);
        totalAfter += simplified.length / 3;

        if (isUint16) {
          const out16 = new Uint16Array(binChunk.buffer, binChunk.byteOffset + indByteOffset, indAcc.count);
          for (let i = 0; i < simplified.length; i++) {
            out16[i] = simplified[i];
          }
        } else {
          const out32 = new Uint32Array(binChunk.buffer, binChunk.byteOffset + indByteOffset, indAcc.count);
          for (let i = 0; i < simplified.length; i++) {
            out32[i] = simplified[i];
          }
        }
        indAcc.count = simplified.length;
      } else {
        totalAfter += indices.length / 3;
      }
    }
  }

  console.log(`  Total Triangles: ${totalBefore.toLocaleString()} -> ${totalAfter.toLocaleString()}`);

  let newJsonStr = JSON.stringify(gltf);
  while (newJsonStr.length % 4 !== 0) {
    newJsonStr += ' ';
  }

  const newJsonBuf = Buffer.from(newJsonStr, 'utf8');
  const outBuf = Buffer.alloc(12 + 8 + newJsonBuf.length + 8 + binLen);

  outBuf.writeUInt32LE(0x46546c67, 0); // 'glTF'
  outBuf.writeUInt32LE(2, 4); // version 2
  outBuf.writeUInt32LE(outBuf.length, 8); // total length

  outBuf.writeUInt32LE(newJsonBuf.length, 12);
  outBuf.writeUInt32LE(0x4e4f534a, 16); // 'JSON'
  newJsonBuf.copy(outBuf, 20);

  const newBinOffset = 20 + newJsonBuf.length;
  outBuf.writeUInt32LE(binLen, newBinOffset);
  outBuf.writeUInt32LE(0x004e4942, newBinOffset + 4); // 'BIN\0'
  binChunk.copy(outBuf, newBinOffset + 8);

  return outBuf;
}

export async function optimizeTargetMesh(slug, tier, rawPath, targets, texSize) {
  console.log(`\n--- Optimizing ${slug} (${tier}) ---`);
  await MeshoptSimplifier.ready;

  const uncompressedPath = path.join(SCRATCH_DIR, `${slug}-${tier}-uncompressed.glb`);
  runGltfTransform(`copy "${rawPath}" "${uncompressedPath}"`);

  const uncompressedBuf = fs.readFileSync(uncompressedPath);
  const decimatedBuf = sloppyDecimateGlbBuffer(uncompressedBuf, targets);

  const decimatedPath = path.join(SCRATCH_DIR, `${slug}-${tier}-decimated.glb`);
  fs.writeFileSync(decimatedPath, decimatedBuf);

  // Resize textures if necessary
  const resizedPath = path.join(SCRATCH_DIR, `${slug}-${tier}-resized.glb`);
  runGltfTransform(`resize "${decimatedPath}" "${resizedPath}" --width ${texSize} --height ${texSize}`);

  // Ensure origin is footprint centered and grounded (y=0)
  const centeredPath = path.join(SCRATCH_DIR, `${slug}-${tier}-centered.glb`);
  runGltfTransform(`center "${resizedPath}" "${centeredPath}" --pivot below`);

  // Compress with Draco
  const finalPath = path.join(OPTIMIZED_DIR, `${slug}-${tier}.glb`);
  runGltfTransform(`draco "${centeredPath}" "${finalPath}"`);

  const audit = inspectGlb(finalPath);
  console.log(`  => Finished ${slug}-${tier}.glb:`);
  console.log(`     Triangles: ${audit.triangleCount.toLocaleString()}`);
  console.log(`     Size:      ${audit.sizeKB} KB (${(audit.sizeBytes / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`     BBox Ymin: ${audit.bbox.min[1]}m, Ymax: ${audit.bbox.max[1]}m, H: ${audit.bbox.height}m`);
  return audit;
}

async function main() {
  console.log('================================================================');
  console.log('PHASE 5 DISH ASSET GEOMETRY OPTIMIZATION: BBQ & PANEER BURGER');
  console.log('================================================================');

  // 1. BBQ Chicken Overload
  const bbqSource = path.join(OPTIMIZED_DIR, 'bbq-chicken-overload-high.glb');

  // Balanced target: ~14K–22K tris (aiming for ~21K)
  await optimizeTargetMesh(
    'bbq-chicken-overload',
    'balanced',
    bbqSource,
    {
      'Mesh_Chicken_Cluster_00': { ratio: 0.22, error: 0.25 },
      'Mesh_Caramelized_Onions': { ratio: 0.22, error: 0.25 },
      'Mesh_Bacon_Bits': { ratio: 0.30, error: 0.25 },
      'Mesh_Cheese_Bed': { ratio: 0.30, error: 0.22 },
      'Mesh_Pizza_Crust': { ratio: 0.50, error: 0.15 },
      '*': { ratio: 0.60, error: 0.15 },
    },
    512
  );

  // Ultra-light target: ~5.5K–9.5K tris (aiming for ~8.5K)
  await optimizeTargetMesh(
    'bbq-chicken-overload',
    'ultralight',
    bbqSource,
    {
      'Mesh_Chicken_Cluster_00': { ratio: 0.10, error: 0.28 },
      'Mesh_Caramelized_Onions': { ratio: 0.10, error: 0.28 },
      'Mesh_Bacon_Bits': { ratio: 0.10, error: 0.28 },
      'Mesh_Cheese_Bed': { ratio: 0.10, error: 0.28 },
      'Mesh_Pizza_Crust': { ratio: 0.20, error: 0.28 },
      'Mesh_BBQ_Drizzle': { ratio: 0.20, error: 0.28 },
      '*': { ratio: 0.25, error: 0.28 },
    },
    256
  );

  // 2. Crispy Paneer Burger
  const paneerSource = path.join(OPTIMIZED_DIR, 'crispy-paneer-burger-high.glb');

  // Balanced target: ~14K–22K tris (aiming for ~19K)
  await optimizeTargetMesh(
    'crispy-paneer-burger',
    'balanced',
    paneerSource,
    {
      'Burger_Slaw_Ribbons': { ratio: 0.30, error: 0.25 },
      'Burger_Cheese_Bottom': { ratio: 0.60, error: 0.15 },
      'Cube': { ratio: 0.70, error: 0.15 },
      'Burger_Slaw_Carrots': { ratio: 0.70, error: 0.15 },
      'Burger_Chutney_Bottom': { ratio: 0.80, error: 0.15 },
      '*': { ratio: 0.85, error: 0.15 },
    },
    512
  );

  // Ultra-light target: ~5.5K–9.5K tris (aiming for ~8.5K)
  await optimizeTargetMesh(
    'crispy-paneer-burger',
    'ultralight',
    paneerSource,
    {
      'Burger_Slaw_Ribbons': { ratio: 0.10, error: 0.28 },
      'Burger_Cheese_Bottom': { ratio: 0.20, error: 0.25 },
      'Cube': { ratio: 0.30, error: 0.25 },
      'Burger_Slaw_Carrots': { ratio: 0.30, error: 0.25 },
      'Burger_Chutney_Bottom': { ratio: 0.35, error: 0.25 },
      '*': { ratio: 0.35, error: 0.25 },
    },
    256
  );

  console.log('\nOptimization successfully executed!');
}

if (process.argv[1] && process.argv[1].endsWith('phase5-optimize-dish-assets.mjs')) {
  main().catch((err) => {
    console.error('Failed:', err);
    process.exit(1);
  });
}
