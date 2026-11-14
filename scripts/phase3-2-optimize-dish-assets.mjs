/**
 * THE GOLDEN OAK — PHASE 3.2 FOOD 3D ASSET OPTIMIZATION PIPELINE
 * Sub-Agent 3: Food 3D Asset & Visual Quality Specialist
 *
 * Pipeline performing:
 * 1. Geometry decimation & topological welding (Meshoptimizer via glTF-Transform)
 * 2. Hardware multi-LOD generation:
 *    - High-fidelity: 28,000 – 45,000 triangles
 *    - Balanced: 14,000 – 22,000 triangles
 *    - Ultra-light: 5,500 – 9,500 triangles
 * 3. Texture budget enforcement & downscaling (1024 -> 512 -> 256)
 * 4. Normal map compression (resolving 4.65 MB uncompressed bun normal map)
 * 5. Tabletop canonical origin baking:
 *    - Footprint centered at X=0, Z=0
 *    - Lowest point touches Y=0 (ground contact)
 * 6. Local Draco compression for fast network transfer and strict CSP compliance
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(ROOT_DIR, 'scratch', 'phase3-2-asset-backup');
const OPTIMIZED_DIR = path.join(ROOT_DIR, 'public', 'models', 'optimized');
const SCRATCH_WORK_DIR = path.join(ROOT_DIR, 'scratch', 'phase3-2-work');

if (!fs.existsSync(SCRATCH_WORK_DIR)) {
  fs.mkdirSync(SCRATCH_WORK_DIR, { recursive: true });
}

/**
 * Inspects a GLB file directly from disk without external dependencies.
 */
export function inspectGlb(glbPath) {
  if (!fs.existsSync(glbPath)) {
    return null;
  }
  const buf = fs.readFileSync(glbPath);
  const sizeBytes = buf.length;
  const sizeKB = Number((sizeBytes / 1024).toFixed(2));
  
  if (buf.length < 20) {
    return { sizeBytes, sizeKB, valid: false };
  }

  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) { // 'glTF'
    return { sizeBytes, sizeKB, valid: false };
  }

  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
  const gltf = JSON.parse(jsonStr.trimEnd());

  let triangleCount = 0;
  let vertexCount = 0;
  let meshCount = gltf.meshes ? gltf.meshes.length : 0;
  let primitiveCount = 0;

  let bboxMin = [Infinity, Infinity, Infinity];
  let bboxMax = [-Infinity, -Infinity, -Infinity];

  if (gltf.meshes) {
    for (const mesh of gltf.meshes) {
      if (!mesh.primitives) continue;
      for (const prim of mesh.primitives) {
        primitiveCount++;
        // Position accessor
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
        // Indices accessor
        if (prim.indices !== undefined) {
          const indAcc = gltf.accessors[prim.indices];
          if (indAcc) {
            triangleCount += Math.floor(indAcc.count / 3);
          }
        }
      }
    }
  }

  const materialCount = gltf.materials ? gltf.materials.length : 0;
  const imageCount = gltf.images ? gltf.images.length : 0;
  const textureCount = gltf.textures ? gltf.textures.length : 0;
  const extensionsUsed = gltf.extensionsUsed || [];

  return {
    valid: true,
    sizeBytes,
    sizeKB,
    meshCount,
    primitiveCount,
    vertexCount,
    triangleCount,
    materialCount,
    imageCount,
    textureCount,
    extensionsUsed,
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
 * Execute gltf-transform CLI command synchronously.
 */
function runGltfTransform(args) {
  const cmd = `npx --yes @gltf-transform/cli ${args}`;
  execSync(cmd, { cwd: ROOT_DIR, stdio: 'pipe' });
}

/**
 * Over-tessellated archetypes with decimation recipes.
 */
const OVER_TESSELLATED_ARCHETYPES = [
  {
    archetype: 'bbq-chicken-overload',
    rawBackup: 'bbq-chicken-overload-high.glb',
    ratios: {
      high: { ratio: 0.02, error: 0.01 },
      balanced: { ratio: 0.01, error: 0.02 },
      ultraLight: { ratio: 0.004, error: 0.04 },
    },
    texLimits: { high: 1024, balanced: 512, ultraLight: 256 },
  },
  {
    archetype: 'wok-tossed-chow-mein',
    rawBackup: 'wok-tossed-chow-mein-high.glb',
    ratios: {
      high: { ratio: 0.057, error: 0.01 },
      balanced: { ratio: 0.026, error: 0.02 },
      ultraLight: { ratio: 0.011, error: 0.04 },
    },
    texLimits: { high: 1024, balanced: 512, ultraLight: 256 },
  },
  {
    archetype: 'crispy-paneer-burger',
    rawBackup: 'crispy-paneer-burger-high.glb',
    ratios: {
      high: { ratio: 0.09, error: 0.01 },
      balanced: { ratio: 0.045, error: 0.02 },
      ultraLight: { ratio: 0.018, error: 0.04 },
    },
    texLimits: { high: 1024, balanced: 512, ultraLight: 256 },
  },
  {
    archetype: 'mushroom-truffle-pizza',
    rawBackup: 'mushroom-truffle-pizza-high.glb',
    ratios: {
      high: { ratio: 0.12, error: 0.01 },
      balanced: { ratio: 0.06, error: 0.02 },
      ultraLight: { ratio: 0.025, error: 0.04 },
    },
    texLimits: { high: 1024, balanced: 512, ultraLight: 256 },
  },
  {
    archetype: 'dynamite-chilli-potatoes',
    rawBackup: 'dynamite-chilli-potatoes-high.glb',
    ratios: {
      high: { ratio: 0.14, error: 0.01 },
      balanced: { ratio: 0.07, error: 0.02 },
      ultraLight: { ratio: 0.028, error: 0.04 },
    },
    texLimits: { high: 1024, balanced: 512, ultraLight: 256 },
  },
  {
    archetype: 'chicken-tikka-pizza',
    rawBackup: 'chicken-tikka-pizza-high.glb',
    ratios: {
      high: { ratio: 0.8, error: 0.005 },
      balanced: { ratio: 0.4, error: 0.01 },
      ultraLight: { ratio: 0.16, error: 0.03 },
    },
    texLimits: { high: 1024, balanced: 512, ultraLight: 256 },
  },
  {
    archetype: 'tandoori-paneer-pizza',
    rawBackup: 'tandoori-paneer-pizza-high.glb',
    ratios: {
      high: { ratio: 0.7, error: 0.005 },
      balanced: { ratio: 0.35, error: 0.01 },
      ultraLight: { ratio: 0.14, error: 0.03 },
    },
    texLimits: { high: 1024, balanced: 512, ultraLight: 256 },
  },
];

/**
 * Optimizes a single over-tessellated archetype across high, balanced, and ultra-light tiers.
 */
export function optimizeOverTessellatedArchetype(config) {
  const { archetype, rawBackup, ratios, texLimits } = config;
  console.log(`\n======================================================`);
  console.log(`OPTIMIZING OVER-TESSELLATED ARCHETYPE: ${archetype}`);
  console.log(`======================================================`);

  const rawPath = path.join(BACKUP_DIR, rawBackup);
  const beforeAudit = inspectGlb(rawPath);
  console.log(`Before State:`);
  console.log(`  File size: ${beforeAudit.sizeKB} KB`);
  console.log(`  Triangles: ${beforeAudit.triangleCount.toLocaleString()}`);
  console.log(`  Vertices:  ${beforeAudit.vertexCount.toLocaleString()}`);
  console.log(`  BBox:      ${beforeAudit.bbox.width}m x ${beforeAudit.bbox.height}m x ${beforeAudit.bbox.depth}m`);

  // Step 1: Weld duplicate vertices
  const weldedPath = path.join(SCRATCH_WORK_DIR, `${archetype}-welded.glb`);
  console.log(`\n  [1/4] Welding vertices...`);
  runGltfTransform(`weld "${rawPath}" "${weldedPath}"`);

  const results = { archetype, before: beforeAudit, tiers: {} };

  // Step 2: Generate each tier
  const tiers = [
    { name: 'high', suffix: '-high.glb', recipe: ratios.high, maxTex: texLimits.high },
    { name: 'balanced', suffix: '-balanced.glb', recipe: ratios.balanced, maxTex: texLimits.balanced },
    { name: 'ultraLight', suffix: '-ultralight.glb', recipe: ratios.ultraLight, maxTex: texLimits.ultraLight },
  ];

  for (const tier of tiers) {
    console.log(`\n  [2/4] Generating Tier: ${tier.name}`);
    const simplifiedPath = path.join(SCRATCH_WORK_DIR, `${archetype}-${tier.name}-simplified.glb`);
    runGltfTransform(
      `simplify "${weldedPath}" "${simplifiedPath}" --ratio ${tier.recipe.ratio} --error ${tier.recipe.error}`
    );

    // Texture resizing
    const resizedPath = path.join(SCRATCH_WORK_DIR, `${archetype}-${tier.name}-resized.glb`);
    runGltfTransform(
      `resize "${simplifiedPath}" "${resizedPath}" --width ${tier.maxTex} --height ${tier.maxTex}`
    );

    // Canonical origin centering: pivot below (Y=0 ground contact, footprint centered X=0, Z=0)
    const centeredPath = path.join(SCRATCH_WORK_DIR, `${archetype}-${tier.name}-centered.glb`);
    runGltfTransform(`center "${resizedPath}" "${centeredPath}" --pivot below`);

    // Draco compression
    const finalTierPath = path.join(OPTIMIZED_DIR, `${archetype}${tier.suffix}`);
    runGltfTransform(`draco "${centeredPath}" "${finalTierPath}"`);

    const afterAudit = inspectGlb(finalTierPath);
    console.log(`  -> ${tier.name.toUpperCase()} complete:`);
    console.log(`     Triangles: ${afterAudit.triangleCount.toLocaleString()}`);
    console.log(`     File size: ${afterAudit.sizeKB} KB`);
    console.log(`     BBox Y min: ${afterAudit.bbox.min[1]}m (Ground Contact)`);
    results.tiers[tier.name] = afterAudit;
  }

  return results;
}

/**
 * Optimizes the Golden Oak Signature Burger & Classic Smash Burger.
 * Focuses on compressing the massive 4.65 MB uncompressed normal map.
 */
export function optimizeBurgerArchetype() {
  console.log(`\n======================================================`);
  console.log(`OPTIMIZING BURGER ARCHETYPE (Texture & Normal Map Reduction)`);
  console.log(`======================================================`);

  const rawPath = path.join(BACKUP_DIR, 'golden-oak-burger-high.glb');
  const beforeAudit = inspectGlb(rawPath);
  console.log(`Before State:`);
  console.log(`  File size: ${beforeAudit.sizeKB} KB`);
  console.log(`  Triangles: ${beforeAudit.triangleCount.toLocaleString()}`);

  const tiers = [
    { name: 'high', suffix: '-high.glb', maxTex: 1024 },
    { name: 'balanced', suffix: '-balanced.glb', maxTex: 512 },
    { name: 'ultraLight', suffix: '-ultralight.glb', maxTex: 256 },
  ];

  const results = { archetype: 'golden-oak-burger', before: beforeAudit, tiers: {} };

  for (const tier of tiers) {
    console.log(`\n  Processing Burger Tier: ${tier.name} (Max texture: ${tier.maxTex}px)...`);
    const resizedPath = path.join(SCRATCH_WORK_DIR, `burger-${tier.name}-resized.glb`);
    runGltfTransform(`resize "${rawPath}" "${resizedPath}" --width ${tier.maxTex} --height ${tier.maxTex}`);

    const centeredPath = path.join(SCRATCH_WORK_DIR, `burger-${tier.name}-centered.glb`);
    runGltfTransform(`center "${resizedPath}" "${centeredPath}" --pivot below`);

    // Output to both golden-oak-burger, golden-oak-signature-burger, and classic-smash-burger
    const targets = [
      `golden-oak-burger${tier.suffix}`,
      `golden-oak-signature-burger${tier.suffix}`,
      `classic-smash-burger${tier.suffix}`,
    ];

    const dracoPath = path.join(SCRATCH_WORK_DIR, `burger-${tier.name}-draco.glb`);
    runGltfTransform(`draco "${centeredPath}" "${dracoPath}"`);

    for (const target of targets) {
      fs.copyFileSync(dracoPath, path.join(OPTIMIZED_DIR, target));
    }

    const afterAudit = inspectGlb(path.join(OPTIMIZED_DIR, `golden-oak-burger${tier.suffix}`));
    console.log(`  -> ${tier.name.toUpperCase()} complete:`);
    console.log(`     Triangles: ${afterAudit.triangleCount.toLocaleString()}`);
    console.log(`     File size: ${afterAudit.sizeKB} KB (Reduced from ${beforeAudit.sizeKB} KB)`);
    results.tiers[tier.name] = afterAudit;
  }

  return results;
}

/**
 * Main execution runner
 */
export async function runOptimizationPipeline(filterName) {
  console.log('STARTING PHASE 3.2 3D FOOD ASSET OPTIMIZATION PIPELINE');
  const allResults = [];

  // Priority (b): over-tessellated & pizza dishes
  for (const config of OVER_TESSELLATED_ARCHETYPES) {
    if (filterName && config.archetype !== filterName) continue;
    const res = optimizeOverTessellatedArchetype(config);
    allResults.push(res);
  }

  // Priority (c): Burger normal map optimization
  if (!filterName || filterName === 'golden-oak-burger') {
    const burgerRes = optimizeBurgerArchetype();
    allResults.push(burgerRes);
  }

  const reportPath = path.join(ROOT_DIR, 'scratch', 'phase3-2-optimization-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(allResults, null, 2), 'utf8');
  console.log(`\nPipeline execution complete! Intermediate results written to ${reportPath}`);
  return allResults;
}

// Auto-run if executed directly via node
if (process.argv[1] && process.argv[1].endsWith('phase3-2-optimize-dish-assets.mjs')) {
  const filterArg = process.argv[2];
  runOptimizationPipeline(filterArg).catch((err) => {
    console.error('Optimization pipeline failed:', err);
    process.exit(1);
  });
}
