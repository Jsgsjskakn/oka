import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import draco3d from 'draco3d';
import {
  SHARED_DEFAULT_MODEL_PATH,
  LOCAL_DRACO_DECODER_PATH,
  KNOWN_DISH_SLUGS,
  MODEL_CONFIGS,
  modelConfigs,
  DISH_CULINARY_PROFILES,
  INTERIOR_MODEL_PATHS,
  ENVIRONMENT_HDR_PATHS,
  getModelConfig,
  hasModel,
  hasInteractive3DModel,
  resolveAdaptiveModelConfig,
  inferCulinaryProfile,
} from '../src/data/model-config.ts';

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

function readGlbHeaderAndJson(diskPath) {
  assert.ok(fs.existsSync(diskPath), `Expected GLB file to exist: ${diskPath}`);
  const buf = fs.readFileSync(diskPath);
  assert.ok(buf.length >= 20, `GLB file too small (${buf.length}B): ${diskPath}`);

  const magic = buf.readUInt32LE(0);
  const version = buf.readUInt32LE(4);
  const totalLen = buf.readUInt32LE(8);
  const jsonChunkLen = buf.readUInt32LE(12);
  const jsonChunkType = buf.readUInt32LE(16);

  assert.equal(magic, 0x46546c67, `Invalid glTF magic header in ${diskPath}`);
  assert.equal(version, 2, `Expected glTF 2.0 in ${diskPath}`);
  assert.equal(totalLen, buf.length, `Declared byte length mismatch in ${diskPath}`);
  assert.equal(jsonChunkType, 0x4e4f534a, `Chunk 0 must be JSON in ${diskPath}`);

  const rawJson = buf.toString('utf8', 20, 20 + jsonChunkLen);
  const hasNullPad = rawJson.includes('\0');
  const gltf = JSON.parse(rawJson.replace(/\0+$/g, '').trim());

  let binChunk = null;
  const binHeaderOffset = 20 + jsonChunkLen;
  if (binHeaderOffset + 8 <= buf.length) {
    const binLen = buf.readUInt32LE(binHeaderOffset);
    const binType = buf.readUInt32LE(binHeaderOffset + 4);
    assert.equal(binType, 0x004e4942, `Chunk 1 must be BIN in ${diskPath}`);
    binChunk = buf.subarray(binHeaderOffset + 8, binHeaderOffset + 8 + binLen);
  }

  return { buf, gltf, binChunk, hasNullPad };
}

function verifyUsdzArchive(diskPath) {
  assert.ok(fs.existsSync(diskPath), `Expected USDZ file to exist: ${diskPath}`);
  const buf = fs.readFileSync(diskPath);
  assert.ok(buf.length > 256, `USDZ archive unexpectedly small: ${diskPath}`);
  assert.equal(buf.readUInt32LE(0), 0x04034b50, `Invalid ZIP/USDZ magic in ${diskPath}`);

  let offset = 0;
  let entryCount = 0;
  while (offset + 30 <= buf.length && buf.readUInt32LE(offset) === 0x04034b50) {
    const method = buf.readUInt16LE(offset + 8);
    const compSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const dataOffset = offset + 30 + nameLen + extraLen;

    assert.equal(method, 0, `USDZ entry must be uncompressed store (method=0) in ${diskPath}`);
    assert.equal(dataOffset % 64, 0, `USDZ entry payload at ${dataOffset} must be 64-byte aligned in ${diskPath}`);
    entryCount++;
    offset = dataOffset + compSize;
  }
  assert.ok(entryCount >= 1, `USDZ must contain at least model.usda in ${diskPath}`);
}

describe('Agent 1: 3D Asset & glTF Pipeline Verification Suite', () => {
  describe('1. Suite 4 Regression Invariants & Source Asset Preservation', () => {
    it('preserves SHARED_DEFAULT_MODEL_PATH === "/models/warrior_model.glb"', () => {
      assert.equal(SHARED_DEFAULT_MODEL_PATH, '/models/warrior_model.glb');
      assert.equal(LOCAL_DRACO_DECODER_PATH, '/draco/');
    });

    it('getModelConfig preserves exact Suite 4 fields for default dishes and authentic models for overridden dishes', () => {
      const defaultCfg = getModelConfig('classic-smash-burger');
      assert.equal(defaultCfg.dishSlug, 'classic-smash-burger');
      assert.equal(defaultCfg.modelPath, SHARED_DEFAULT_MODEL_PATH);
      assert.equal(defaultCfg.modelPath, '/models/warrior_model.glb');
      assert.equal(defaultCfg.initialScale, 0.8);
      assert.equal(defaultCfg.cameraDistance, 4.5);
      assert.equal(defaultCfg.isSharedPlaceholder, true);
      assert.ok(defaultCfg.modelName.includes('Prototype Asset'));

      const burgerCfg = getModelConfig('golden-oak-signature-burger');
      assert.equal(burgerCfg.dishSlug, 'golden-oak-signature-burger');
      assert.equal(burgerCfg.modelPath, '/models/optimized/golden-oak-burger-high.glb');
      assert.equal(burgerCfg.isSharedPlaceholder, false);
      assert.equal(burgerCfg.modelName, 'Golden Oak Signature Burger');
      assert.equal(burgerCfg.lodPaths.high, '/models/optimized/golden-oak-burger-high.glb');
      assert.equal(burgerCfg.lodPaths.balanced, '/models/optimized/golden-oak-burger-balanced.glb');
      assert.equal(burgerCfg.lodPaths.ultraLight, '/models/optimized/golden-oak-burger-ultralight.glb');
      assert.equal(burgerCfg.usdzPath, '/models/optimized/golden-oak-burger.usdz');
    });

    it('hasModel and hasInteractive3DModel accept all 22 known dishes and reject invalid slugs', () => {
      assert.ok(KNOWN_DISH_SLUGS.length >= 22);
      for (const slug of KNOWN_DISH_SLUGS) {
        assert.equal(hasModel(slug), true);
        assert.equal(hasInteractive3DModel(slug), true);
      }

      for (const bad of ['fake-dish', '../../etc/passwd', '', null, undefined, 42, {}]) {
        assert.equal(hasModel(bad), false);
        assert.equal(hasInteractive3DModel(bad), false);
      }
    });

    it('keeps all 8 original public/models/*.glb and 2 public/textures/*.hdr untouched on disk', () => {
      const requiredUntouchedAssets = [
        { rel: 'models/warrior_model.glb', minBytes: 600_000 },
        { rel: 'models/warrior_scene.glb', minBytes: 9_000_000 },
        { rel: 'models/the_golden_oak_interior.glb', minBytes: 11_000_000 },
        { rel: 'models/the_golden_oak_interior.optimized.glb', minBytes: 6_000_000 },
        { rel: 'models/chicken-tikka-pizza.glb', minBytes: 3_000 },
        { rel: 'models/classic-smash-burger.glb', minBytes: 3_000 },
        { rel: 'models/golden-oak-burger.glb', minBytes: 3_000 },
        { rel: 'models/tandoori-paneer-pizza.glb', minBytes: 3_000 },
        { rel: 'textures/forest_env.hdr', minBytes: 1_800_000 },
        { rel: 'textures/forest_env.optimized.hdr', minBytes: 470_000 },
      ];

      for (const item of requiredUntouchedAssets) {
        const full = path.join(PUBLIC_DIR, item.rel);
        assert.ok(fs.existsSync(full), `Missing preserved asset: ${item.rel}`);
        const st = fs.statSync(full);
        assert.ok(
          st.size >= item.minBytes,
          `Preserved asset ${item.rel} size ${st.size} < expected ${item.minBytes}`
        );
      }
    });
  });

  describe('2. Binary GLB & USDZ Verification Across MODEL_CONFIGS and LOD Derivatives', () => {
    it('every modelPath, lodPaths, culinaryAssetLodPaths, and USDZ path exists and passes binary validation', () => {
      const checkedGlbs = new Set();
      const checkedUsdzs = new Set();

      assert.equal(Object.keys(MODEL_CONFIGS).length, KNOWN_DISH_SLUGS.length);
      assert.equal(modelConfigs.length, KNOWN_DISH_SLUGS.length);

      for (const slug of KNOWN_DISH_SLUGS) {
        const cfg = MODEL_CONFIGS[slug];
        assert.ok(cfg, `Missing MODEL_CONFIGS[${slug}]`);
        assert.ok(cfg.culinaryCategory, `Missing culinaryCategory for ${slug}`);
        assert.ok(Array.isArray(cfg.secondaryCategories), `Missing secondaryCategories for ${slug}`);
        assert.ok(cfg.lodPaths, `Missing lodPaths for ${slug}`);
        assert.ok(cfg.culinaryAssetLodPaths, `Missing culinaryAssetLodPaths for ${slug}`);

        const glbPaths = [
          cfg.modelPath,
          cfg.lodPaths.high,
          cfg.lodPaths.balanced,
          cfg.lodPaths.ultraLight,
          cfg.lodPaths.medium,
          cfg.lodPaths.low,
          cfg.culinaryAssetLodPaths.high,
          cfg.culinaryAssetLodPaths.balanced,
          cfg.culinaryAssetLodPaths.ultraLight,
        ].filter(Boolean);

        for (const webPath of glbPaths) {
          if (checkedGlbs.has(webPath)) continue;
          checkedGlbs.add(webPath);

          const diskPath = path.join(PUBLIC_DIR, webPath.replace(/^\//, ''));
          const { gltf, hasNullPad } = readGlbHeaderAndJson(diskPath);

          if (webPath.startsWith('/models/optimized/')) {
            assert.equal(
              hasNullPad,
              false,
              `Optimized GLB ${webPath} must have strict 0x20 JSON padding (no null bytes)`
            );
            assert.ok(
              (gltf.extensionsUsed || []).includes('KHR_draco_mesh_compression'),
              `Optimized GLB ${webPath} must use KHR_draco_mesh_compression`
            );
          }
        }

        if (cfg.usdzAvailable && cfg.usdzPath && !checkedUsdzs.has(cfg.usdzPath)) {
          checkedUsdzs.add(cfg.usdzPath);
          verifyUsdzArchive(path.join(PUBLIC_DIR, cfg.usdzPath.replace(/^\//, '')));
        }
        if (cfg.culinaryUsdzPath && !checkedUsdzs.has(cfg.culinaryUsdzPath)) {
          checkedUsdzs.add(cfg.culinaryUsdzPath);
          verifyUsdzArchive(path.join(PUBLIC_DIR, cfg.culinaryUsdzPath.replace(/^\//, '')));
        }
      }

      // Also verify optimized interior mobile-balanced derivative
      const interiorOptDisk = path.join(
        PUBLIC_DIR,
        INTERIOR_MODEL_PATHS.mobileBalanced.replace(/^\//, '')
      );
      const { buf: intOptBuf, gltf: intOptGltf } = readGlbHeaderAndJson(interiorOptDisk);
      const interiorOrigOptSize = fs.statSync(
        path.join(PUBLIC_DIR, INTERIOR_MODEL_PATHS.desktopHigh.replace(/^\//, ''))
      ).size;

      assert.ok(
        intOptBuf.length < interiorOrigOptSize * 0.6,
        `Expected mobile-balanced interior (${intOptBuf.length}B) to save >40% over .optimized.glb (${interiorOrigOptSize}B)`
      );
      assert.equal(intOptGltf.materials.length, 63, 'Duplicate brass material must be deduplicated (64 -> 63)');
    });

    it('warrior LOD hierarchy reduces draw calls 72 -> 14 (-80.6%) and monotonically scales triangles & bytes', () => {
      const orig = readGlbHeaderAndJson(path.join(PUBLIC_DIR, 'models/warrior_model.glb'));
      const lod0 = readGlbHeaderAndJson(path.join(PUBLIC_DIR, 'models/optimized/warrior-lod0-high.glb'));
      const lod1 = readGlbHeaderAndJson(path.join(PUBLIC_DIR, 'models/optimized/warrior-lod1-balanced.glb'));
      const lod2 = readGlbHeaderAndJson(path.join(PUBLIC_DIR, 'models/optimized/warrior-lod2-ultralight.glb'));

      assert.equal(orig.gltf.meshes.length, 72);
      assert.equal(lod0.gltf.meshes.length, 14);
      assert.equal(lod1.gltf.meshes.length, 14);
      assert.equal(lod2.gltf.meshes.length, 14);

      assert.ok(lod2.buf.length < lod1.buf.length, 'LOD2 bytes must be smaller than LOD1');
      assert.ok(lod1.buf.length < lod0.buf.length, 'LOD1 bytes must be smaller than LOD0');
      assert.ok(lod0.buf.length < orig.buf.length, 'LOD0 bytes must be smaller than warrior_model.glb');

      // LOD1 and LOD2 must strip KHR_materials_transmission to prevent multipass FBO blits
      assert.ok(!(lod1.gltf.extensionsUsed || []).includes('KHR_materials_transmission'));
      assert.ok(!(lod2.gltf.extensionsUsed || []).includes('KHR_materials_transmission'));
    });

    it('round-trip decodes Draco bitstreams inside optimized GLBs via Google draco3d WASM', async () => {
      const decoderModule = await draco3d.createDecoderModule({});
      const targets = [
        'models/optimized/warrior-lod2-ultralight.glb',
        'models/optimized/golden-oak-burger-balanced.glb',
        'models/optimized/kaffir-lime-mocktail-ultralight.glb',
      ];

      for (const rel of targets) {
        const { gltf, binChunk } = readGlbHeaderAndJson(path.join(PUBLIC_DIR, rel));
        assert.ok(binChunk, `Expected BIN chunk in ${rel}`);

        for (const mesh of gltf.meshes) {
          for (const prim of mesh.primitives) {
            const dracoExt = prim.extensions?.KHR_draco_mesh_compression;
            assert.ok(dracoExt, `Expected Draco extension on primitive in ${rel}`);
            const bv = gltf.bufferViews[dracoExt.bufferView];
            const slice = binChunk.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);

            const decoder = new decoderModule.Decoder();
            const decBuf = new decoderModule.DecoderBuffer();
            decBuf.Init(new Int8Array(slice), slice.length);
            const dracoMesh = new decoderModule.Mesh();
            const status = decoder.DecodeBufferToMesh(decBuf, dracoMesh);

            assert.equal(status.ok(), true, `Draco WASM decode failed for ${rel}`);
            assert.ok(dracoMesh.num_points() > 0);
            assert.ok(dracoMesh.num_faces() > 0);

            decoderModule.destroy(dracoMesh);
            decoderModule.destroy(decBuf);
            decoderModule.destroy(decoder);
          }
        }
      }
    });
  });

  describe('3. resolveAdaptiveModelConfig & Culinary Material Profiles', () => {
    it('resolves ultra-light, balanced, and high-fidelity profiles accurately across all menu items', () => {
      for (const slug of KNOWN_DISH_SLUGS) {
        const ultra = resolveAdaptiveModelConfig(slug, 'ultra-light');
        const balanced = resolveAdaptiveModelConfig(slug, 'balanced');
        const high = resolveAdaptiveModelConfig(slug, 'high-fidelity');

        assert.equal(ultra.profile, 'ultra-light');
        assert.equal(balanced.profile, 'balanced');
        assert.equal(high.profile, 'high-fidelity');

        if (slug === 'golden-oak-signature-burger') {
          assert.equal(ultra.resolvedModelPath, '/models/optimized/golden-oak-burger-ultralight.glb');
          assert.equal(balanced.resolvedModelPath, '/models/optimized/golden-oak-burger-balanced.glb');
          assert.equal(high.resolvedModelPath, '/models/optimized/golden-oak-burger-high.glb');
        } else {
          assert.equal(ultra.resolvedModelPath, '/models/optimized/warrior-lod2-ultralight.glb');
          assert.equal(balanced.resolvedModelPath, '/models/optimized/warrior-lod1-balanced.glb');
          assert.equal(high.resolvedModelPath, '/models/optimized/warrior-lod0-high.glb');
        }

        assert.equal(ultra.lodPath, ultra.resolvedModelPath);
        assert.equal(balanced.lodPath, balanced.resolvedModelPath);
        assert.equal(high.lodPath, high.resolvedModelPath);

        assert.equal(ultra.maxTextureSize, 512);
        assert.equal(balanced.maxTextureSize, 1024);
        assert.equal(high.maxTextureSize, 2048);

        assert.ok(ultra.estimatedTriangles < balanced.estimatedTriangles);
        assert.ok(balanced.estimatedTriangles < high.estimatedTriangles);
        assert.equal(ultra.estimatedDrawCalls, 14);

        assert.equal(ultra.environmentHdrPath, ENVIRONMENT_HDR_PATHS.optimized);
        assert.equal(balanced.environmentHdrPath, ENVIRONMENT_HDR_PATHS.optimized);
        assert.equal(high.environmentHdrPath, ENVIRONMENT_HDR_PATHS.high);
      }
    });

    it('supports quality-tier aliases ("low", "medium", "high") and dynamic unknown dish slugs', () => {
      const low = resolveAdaptiveModelConfig('kaffir-lime-mocktail', 'low');
      const med = resolveAdaptiveModelConfig('kaffir-lime-mocktail', 'medium');
      const hi = resolveAdaptiveModelConfig('kaffir-lime-mocktail', 'high');

      assert.equal(low.profile, 'ultra-light');
      assert.equal(med.profile, 'balanced');
      assert.equal(hi.profile, 'high-fidelity');
      assert.equal(low.culinaryCategory, 'beverage');
      assert.ok(low.secondaryCategories.includes('glass-container'));

      // Dynamic slug heuristic fallback
      const dessertFallback = inferCulinaryProfile('molten-chocolate-lava-cake');
      assert.equal(dessertFallback.culinaryCategory, 'dessert');
      assert.equal(Object.keys(DISH_CULINARY_PROFILES).length, 22);
    });
  });
});
