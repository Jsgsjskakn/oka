/**
 * THE GOLDEN OAK — Phase 7 Realistic Food Material Pipeline Calibrator
 * Agent 2: PBR Texture and Colour Specialist
 *
 * Audits and calibrates PBR material properties across all 11 GLB archetypes
 * (High, Balanced, Ultra-Light = 33 binary GLB files in public/models/optimized/):
 * - Enforces metallicFactor = 0.0 on all dielectric organic food, ceramic, and glass materials.
 * - Eliminates mirror-like plastic roughness values (0.02, 0.05, 0.10, 0.12) and replaces them
 *   with culinarily accurate surface roughness values.
 * - Enforces zero artificial emissive glow (emissiveFactor = [0, 0, 0]).
 * - Preserves binary geometry buffers, Draco bitstreams, and embedded textures 100% intact.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OPTIMIZED_DIR = path.join(ROOT_DIR, 'public', 'models', 'optimized');

/**
 * Scientifically calibrated dielectric food PBR roughness & metallic targets per material name.
 */
export const MATERIAL_PBR_CALIBRATION = {
  // 1. Tandoori Paneer Pizza
  Mat_Molten_Mozzarella_Cheese_Bed: { metallicFactor: 0.0, roughnessFactor: 0.28 },
  Mat_Neapolitan_Cornicione_Crust: { metallicFactor: 0.0, roughnessFactor: 0.72 },
  Mat_Tandoori_Paneer_Tikka: { metallicFactor: 0.0, roughnessFactor: 0.45 },
  Mat_Roasted_Cherry_Tomato: { metallicFactor: 0.0, roughnessFactor: 0.22 },
  Mat_Roasted_Green_Pepper: { metallicFactor: 0.0, roughnessFactor: 0.30 },
  Mat_Roasted_Red_Pepper: { metallicFactor: 0.0, roughnessFactor: 0.30 },
  Mat_Red_Onion_Slivers: { metallicFactor: 0.0, roughnessFactor: 0.35 },
  Mat_Crushed_Red_Chili: { metallicFactor: 0.0, roughnessFactor: 0.50 },
  Mat_Fresh_Coriander: { metallicFactor: 0.0, roughnessFactor: 0.48 },
  Mat_Tandoori_Mayo_Drizzle: { metallicFactor: 0.0, roughnessFactor: 0.32 },
  Mat_Chili_Seed: { metallicFactor: 0.0, roughnessFactor: 0.55 },

  // 2. Chicken Tikka Pizza
  Mat_Chicken_Pizza_PBR: { metallicFactor: 0.0, roughnessFactor: 0.36 },
  Mat_Baked_Dough_Rim: { metallicFactor: 0.0, roughnessFactor: 0.75 },

  // 3. Mushroom Truffle Pizza (uses metallicRoughnessTexture index 1; keep factor 1.0 multiplier)
  Mat_Artisan_Pizza_Top: { metallicFactor: 0.0, roughnessFactor: 1.0 },

  // 4. BBQ Chicken Overload Pizza
  Mat_Crust_V26: { metallicFactor: 0.0, roughnessFactor: 0.72 },
  Mat_Cheese_V26: { metallicFactor: 0.0, roughnessFactor: 0.28 },
  Mat_BBQ_V26: { metallicFactor: 0.0, roughnessFactor: 0.14 },
  Mat_Chicken_V26: { metallicFactor: 0.0, roughnessFactor: 0.40 },
  Mat_Bacon_V26: { metallicFactor: 0.0, roughnessFactor: 0.32 },
  Mat_Onion_V26: { metallicFactor: 0.0, roughnessFactor: 0.35 },
  Mat_Jalapeno_Skin_V26: { metallicFactor: 0.0, roughnessFactor: 0.28 },
  Mat_Jalapeno_Flesh_V26: { metallicFactor: 0.0, roughnessFactor: 0.38 },
  Mat_Jalapeno_Seed_V26: { metallicFactor: 0.0, roughnessFactor: 0.42 },

  // 5. Classic Smash Burger & Golden Oak Signature Burger
  bun_001: { metallicFactor: 0.0, roughnessFactor: 0.44 },
  lettuce_001: { metallicFactor: 0.0, roughnessFactor: 0.42 },
  vegies_001: { metallicFactor: 0.0, roughnessFactor: 0.38 },

  // 6. Crispy Paneer Burger
  Mat_Cheddar_Gourmet_V33: { metallicFactor: 0.0, roughnessFactor: 0.30 },
  Mat_Sweet_Chili_V33: { metallicFactor: 0.0, roughnessFactor: 0.14 },
  Mat_Chutney_Liquid_V33: { metallicFactor: 0.0, roughnessFactor: 0.22 },
  Mat_Panko_Photo_Clean_V33: { metallicFactor: 0.0, roughnessFactor: 0.58 },
  Mat_Carrot_V33: { metallicFactor: 0.0, roughnessFactor: 0.34 },
  Mat_Slaw_TwoTone_V33: { metallicFactor: 0.0, roughnessFactor: 0.38 },

  // 7. Wok-Tossed Chow Mein
  Mat_Cabbage: { metallicFactor: 0.0, roughnessFactor: 0.34 },
  Mat_Carrot: { metallicFactor: 0.0, roughnessFactor: 0.32 },
  Mat_ArtisanalBowl: { metallicFactor: 0.0, roughnessFactor: 0.55 },
  Mat_MasterChowMein: { metallicFactor: 0.0, roughnessFactor: 0.22 },
  Mat_SauteedOnion: { metallicFactor: 0.0, roughnessFactor: 0.28 },
  Mat_ScallionCore: { metallicFactor: 0.0, roughnessFactor: 0.35 },
  Mat_ScallionGreen: { metallicFactor: 0.0, roughnessFactor: 0.38 },
  Mat_SesameSeed: { metallicFactor: 0.0, roughnessFactor: 0.48 },

  // 8. Dynamite Chilli Potatoes
  'M_Diced_Pepper_Yellow_v60.001': { metallicFactor: 0.0, roughnessFactor: 0.26 },
  'M_Diced_Pepper_Red_v60.001': { metallicFactor: 0.0, roughnessFactor: 0.26 },
  'M_Diced_Pepper_Green_v60.001': { metallicFactor: 0.0, roughnessFactor: 0.26 },
  'M_Dolsot_Stone_Pot_v60.001': { metallicFactor: 0.0, roughnessFactor: 0.65 },
  'M_Crispy_Braised_Potato_v60.001': { metallicFactor: 0.0, roughnessFactor: 0.24 },
  'M_Scallion_Garnish_v60.001': { metallicFactor: 0.0, roughnessFactor: 0.40 },
  'M_Toasted_Sesame_v60.001': { metallicFactor: 0.0, roughnessFactor: 0.48 },

  // 9. Placeholder Dishware & Mocktail Glass
  Mat_Ceramic_Plate: { metallicFactor: 0.0, roughnessFactor: 0.18 },
  Mat_Fresh_Vegetables: { metallicFactor: 0.0, roughnessFactor: 0.36 },
  Mat_Glossy_Sauce: { metallicFactor: 0.0, roughnessFactor: 0.14 },
  Mat_Fried_Food: { metallicFactor: 0.0, roughnessFactor: 0.58 },
  Mat_Glass_Container: { metallicFactor: 0.0, roughnessFactor: 0.08 },
  Mat_Beverage_Liquid: { metallicFactor: 0.0, roughnessFactor: 0.12 },
};

const ARCHETYPES = [
  'tandoori-paneer-pizza',
  'chicken-tikka-pizza',
  'mushroom-truffle-pizza',
  'bbq-chicken-overload',
  'classic-smash-burger',
  'golden-oak-burger',
  'crispy-paneer-burger',
  'wok-tossed-chow-mein',
  'dynamite-chilli-potatoes',
  'gourmet-wok-bowl',
  'kaffir-lime-mocktail',
];

const TIERS = ['high', 'balanced', 'ultralight'];

function calibrateGlbMaterials(glbPath) {
  const buf = fs.readFileSync(glbPath);
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) {
    throw new Error(`Invalid GLB magic in ${glbPath}`);
  }

  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
  const gltf = JSON.parse(jsonStr.trimEnd());
  const binHeaderOffset = 20 + jsonLen;
  const binLen = buf.readUInt32LE(binHeaderOffset);
  const binChunk = buf.subarray(binHeaderOffset + 8, binHeaderOffset + 8 + binLen);

  const changes = [];
  for (const mat of gltf.materials || []) {
    if (!mat.pbrMetallicRoughness) {
      mat.pbrMetallicRoughness = {};
    }
    const pbr = mat.pbrMetallicRoughness;
    const oldMetal = pbr.metallicFactor ?? 1.0;
    const oldRough = pbr.roughnessFactor ?? 1.0;

    const target = MATERIAL_PBR_CALIBRATION[mat.name];
    const newMetal = target ? target.metallicFactor : 0.0;
    const newRough = target
      ? target.roughnessFactor
      : pbr.metallicRoughnessTexture
        ? 1.0
        : Math.max(0.14, Math.min(0.78, oldRough));

    pbr.metallicFactor = newMetal;
    pbr.roughnessFactor = newRough;
    mat.emissiveFactor = [0, 0, 0];

    if (Math.abs(oldMetal - newMetal) > 0.001 || Math.abs(oldRough - newRough) > 0.001) {
      changes.push({
        material: mat.name,
        oldMetal: Number(oldMetal.toFixed(4)),
        newMetal: Number(newMetal.toFixed(4)),
        oldRough: Number(oldRough.toFixed(4)),
        newRough: Number(newRough.toFixed(4)),
      });
    }
  }

  let newJsonStr = JSON.stringify(gltf);
  while (newJsonStr.length % 4 !== 0) {
    newJsonStr += ' ';
  }
  const newJsonBuf = Buffer.from(newJsonStr, 'utf8');
  const outBuf = Buffer.alloc(12 + 8 + newJsonBuf.length + 8 + binChunk.length);

  outBuf.writeUInt32LE(0x46546c67, 0);
  outBuf.writeUInt32LE(2, 4);
  outBuf.writeUInt32LE(outBuf.length, 8);

  outBuf.writeUInt32LE(newJsonBuf.length, 12);
  outBuf.writeUInt32LE(0x4e4f534a, 16);
  newJsonBuf.copy(outBuf, 20);

  const newBinHeaderOffset = 20 + newJsonBuf.length;
  outBuf.writeUInt32LE(binChunk.length, newBinHeaderOffset);
  outBuf.writeUInt32LE(0x004e4942, newBinHeaderOffset + 4);
  binChunk.copy(outBuf, newBinHeaderOffset + 8);

  fs.writeFileSync(glbPath, outBuf);
  return { file: path.basename(glbPath), changesCount: changes.length, changes };
}

export function runPbrCalibration() {
  console.log('================================================================');
  console.log('PHASE 7 REALISTIC FOOD PBR MATERIAL PIPELINE CALIBRATION');
  console.log('================================================================');
  const summary = [];
  for (const archetype of ARCHETYPES) {
    for (const tier of TIERS) {
      const file = `${archetype}-${tier}.glb`;
      const absPath = path.join(OPTIMIZED_DIR, file);
      if (!fs.existsSync(absPath)) continue;
      const res = calibrateGlbMaterials(absPath);
      summary.push(res);
      if (tier === 'high' && res.changesCount > 0) {
        console.log(`[CALIBRATED] ${file}: ${res.changesCount} materials updated`);
        for (const c of res.changes) {
          console.log(
            `  - ${c.material.padEnd(32)}: metal ${c.oldMetal} -> ${c.newMetal} | rough ${c.oldRough} -> ${c.newRough}`
          );
        }
      }
    }
  }
  console.log(`Calibrated ${summary.length} GLB files across ${ARCHETYPES.length} archetypes.`);
  return summary;
}

if (process.argv[1] && process.argv[1].endsWith('phase7-pbr-calibrate-glbs.mjs')) {
  runPbrCalibration();
}
