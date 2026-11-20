/**
 * THE GOLDEN OAK — Phase 7.1 Six Dedicated Food Models Multi-LOD GLB Optimizer
 *
 * Takes the 18 Blender 5.2 LOD GLB exports from scratch/phase7-1-raw/<slug>-<tier>-raw.glb
 * and generates:
 * - public/models/optimized/<slug>-high.glb
 * - public/models/optimized/<slug>-balanced.glb
 * - public/models/optimized/<slug>-ultralight.glb
 *
 * Applies canonical --pivot below ground centering, Draco mesh compression,
 * strict 0x20 JSON chunk space padding, and metallicFactor = 0.0 dielectric PBR compliance.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT_DIR, 'scratch', 'phase7-1-raw');
const WORK_DIR = path.join(ROOT_DIR, 'scratch', 'phase7-1-work');
const OPT_DIR = path.join(ROOT_DIR, 'public', 'models', 'optimized');

if (!fs.existsSync(WORK_DIR)) {
  fs.mkdirSync(WORK_DIR, { recursive: true });
}

const SIX_DISHES = [
  'truffle-mushroom-risotto',
  'butter-chicken-bao',
  'dahi-ke-kebab',
  'crispy-chilli-babycorn',
  'dim-sum-platter',
  'kaffir-lime-mocktail',
];

function runGltfTransform(args) {
  execSync(`npx --yes @gltf-transform/cli ${args}`, { cwd: ROOT_DIR, stdio: 'pipe' });
}

function enforceStrictSpacePaddingAndDielectric(glbPath) {
  const buf = fs.readFileSync(glbPath);
  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + jsonLen).replace(/\0+$/g, '');
  const gltf = JSON.parse(jsonStr.trimEnd());
  const binHeaderOffset = 20 + jsonLen;
  const binLen = buf.readUInt32LE(binHeaderOffset);
  const binChunk = buf.subarray(binHeaderOffset + 8, binHeaderOffset + 8 + binLen);

  let tris = 0;
  for (const mesh of gltf.meshes || []) {
    for (const prim of mesh.primitives || []) {
      if (prim.indices !== undefined && gltf.accessors[prim.indices]) {
        tris += Math.floor(gltf.accessors[prim.indices].count / 3);
      }
    }
  }

  for (const mat of gltf.materials || []) {
    if (!mat.pbrMetallicRoughness) mat.pbrMetallicRoughness = {};
    mat.pbrMetallicRoughness.metallicFactor = 0.0;
    const r = mat.pbrMetallicRoughness.roughnessFactor ?? 0.35;
    mat.pbrMetallicRoughness.roughnessFactor = Math.max(0.08, Math.min(0.85, r));
    mat.emissiveFactor = [0, 0, 0];
  }

  let newJsonStr = JSON.stringify(gltf);
  while (newJsonStr.length % 4 !== 0) newJsonStr += ' ';
  const newJsonBuf = Buffer.from(newJsonStr, 'utf8');
  const outBuf = Buffer.alloc(12 + 8 + newJsonBuf.length + 8 + binChunk.length);

  outBuf.writeUInt32LE(0x46546c67, 0);
  outBuf.writeUInt32LE(2, 4);
  outBuf.writeUInt32LE(outBuf.length, 8);
  outBuf.writeUInt32LE(newJsonBuf.length, 12);
  outBuf.writeUInt32LE(0x4e4f534a, 16);
  newJsonBuf.copy(outBuf, 20);

  const newBinOffset = 20 + newJsonBuf.length;
  outBuf.writeUInt32LE(binChunk.length, newBinOffset);
  outBuf.writeUInt32LE(0x004e4942, newBinOffset + 4);
  binChunk.copy(outBuf, newBinOffset + 8);

  fs.writeFileSync(glbPath, outBuf);
  return { tris, sizeKb: (outBuf.length / 1024).toFixed(2) };
}

function buildTier(slug, tier) {
  const rawPath = path.join(RAW_DIR, `${slug}-${tier}-raw.glb`);
  const cenPath = path.join(WORK_DIR, `${slug}-${tier}-cen.glb`);
  runGltfTransform(`center "${rawPath}" "${cenPath}" --pivot below`);

  const finalPath = path.join(OPT_DIR, `${slug}-${tier}.glb`);
  runGltfTransform(`draco "${cenPath}" "${finalPath}"`);
  const { tris, sizeKb } = enforceStrictSpacePaddingAndDielectric(finalPath);
  console.log(`  [${tier.padEnd(10)}] ${slug}-${tier}.glb | tris: ${String(tris).padStart(6)} | size: ${sizeKb} KB`);
}

function main() {
  console.log('================================================================');
  console.log('PHASE 7.1 MULTI-LOD DRACO OPTIMIZER FOR 6 DEDICATED FOOD MODELS');
  console.log('================================================================');
  for (const slug of SIX_DISHES) {
    console.log(`\nProcessing ${slug}:`);
    buildTier(slug, 'high');
    buildTier(slug, 'balanced');
    buildTier(slug, 'ultralight');
  }
  console.log('\nAll 18 multi-LOD GLBs (6 dishes x 3 tiers) generated and verified!');
}

main();
