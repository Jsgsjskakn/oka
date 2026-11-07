#!/usr/bin/env node
/**
 * Phase B: Production 3D Model Optimizer, Multi-LOD Generator & USDZ Exporter
 * The Golden Oak — Production 3D Asset Pipeline
 *
 * Non-destructively generates hardware-calibrated multi-LOD Draco .glb assets
 * and iOS AR Quick Look spec-compliant .usdz packages inside public/models/optimized/
 * using Three.js, MeshoptSimplifier, MeshoptEncoder, Google Draco 1.5.7, and Sharp.
 *
 * SAFETY INVARIANT: Never modifies or deletes any existing file in public/models/
 * or public/textures/.
 */

global.self = global;
global.window = global;

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MeshoptSimplifier } from 'meshoptimizer/simplifier';
import { MeshoptEncoder } from 'meshoptimizer/encoder';
import draco3d from 'draco3d';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const MODELS_DIR = path.join(ROOT_DIR, 'public', 'models');
const OPTIMIZED_DIR = path.join(MODELS_DIR, 'optimized');

// Warrior vibrant palette matching src/components/viewer/warrior-materials.ts
const WARRIOR_PALETTE = {
  Skin_Mat: { color: [0.82, 0.62, 0.48], roughness: 0.5, metalness: 0.0 },
  Crimson_Cape_Mat: { color: [0.85, 0.12, 0.12], roughness: 0.45, metalness: 0.05 },
  Gold_Trim_Mat: { color: [0.95, 0.78, 0.25], roughness: 0.28, metalness: 0.7 },
  Talwar_Brass_Mat: { color: [0.9, 0.72, 0.2], roughness: 0.3, metalness: 0.65 },
  Talwar_Blade_Mat: { color: [0.85, 0.88, 0.92], roughness: 0.2, metalness: 0.8 },
  Steel_Armor_Mat: { color: [0.65, 0.68, 0.72], roughness: 0.35, metalness: 0.7 },
  Dark_Iron_Mat: { color: [0.28, 0.29, 0.32], roughness: 0.45, metalness: 0.4 },
  Leather_Mat: { color: [0.45, 0.28, 0.15], roughness: 0.6, metalness: 0.05 },
  Hair_Beard_Mat: { color: [0.12, 0.08, 0.05], roughness: 0.6, metalness: 0.0 },
  Floor_Stone_Mat: { color: [0.078, 0.063, 0.051], roughness: 0.45, metalness: 0.25 },
  Cornea_Mat: { color: [1.0, 1.0, 1.0], roughness: 0.1, metalness: 0.0 },
  Sclera_Mat: { color: [0.95, 0.95, 0.95], roughness: 0.2, metalness: 0.0 },
  Iris_Mat: { color: [0.25, 0.15, 0.08], roughness: 0.1, metalness: 0.0 },
  Pupil_Black: { color: [0.02, 0.02, 0.02], roughness: 0.1, metalness: 0.0 },
};

/**
 * Pad Buffer to 4-byte boundary using spec-compliant byte (0x20 for JSON, 0x00 for BIN).
 */
function padBuffer4(buf, padByte = 0x00) {
  const rem = buf.length % 4;
  if (rem === 0) return buf;
  return Buffer.concat([buf, Buffer.alloc(4 - rem, padByte)]);
}

/**
 * Assemble a binary GLB 2.0 buffer from a glTF JSON object and a binary buffer.
 */
function packGlb(gltfJson, binBuffer) {
  const jsonRaw = Buffer.from(JSON.stringify(gltfJson), 'utf8');
  const jsonPadded = padBuffer4(jsonRaw, 0x20); // Spec 4.4.2.1: MUST pad JSON with 0x20 spaces
  const binPadded = padBuffer4(binBuffer, 0x00); // Spec 4.4.2.2: pad BIN with 0x00

  const totalLength = 12 + 8 + jsonPadded.length + 8 + binPadded.length;
  const out = Buffer.alloc(totalLength);

  let offset = 0;
  out.writeUInt32LE(0x46546c67, offset); offset += 4; // 'glTF'
  out.writeUInt32LE(2, offset); offset += 4;          // version 2
  out.writeUInt32LE(totalLength, offset); offset += 4;

  // Chunk 0: JSON
  out.writeUInt32LE(jsonPadded.length, offset); offset += 4;
  out.writeUInt32LE(0x4e4f534a, offset); offset += 4; // 'JSON'
  jsonPadded.copy(out, offset); offset += jsonPadded.length;

  // Chunk 1: BIN
  out.writeUInt32LE(binPadded.length, offset); offset += 4;
  out.writeUInt32LE(0x004e4942, offset); offset += 4; // 'BIN\0'
  binPadded.copy(out, offset);

  return out;
}

/**
 * Compute min/max bounds for a flat Float32Array of VEC3 positions.
 */
function computePositionBounds(positions) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    if (x < min[0]) min[0] = x;
    if (y < min[1]) min[1] = y;
    if (z < min[2]) min[2] = z;
    if (x > max[0]) max[0] = x;
    if (y > max[1]) max[1] = y;
    if (z > max[2]) max[2] = z;
  }
  return { min, max };
}

/**
 * Simplify and optimize an indexed triangle mesh using MeshoptSimplifier + MeshoptEncoder.
 */
function simplifyAndOptimizeGeometry(geom, targetRatio = 1.0, maxError = 0.01, keepUvs = true) {
  let g = geom.clone();
  if (!g.index) {
    const vertCount = g.attributes.position.count;
    const seq = new Uint32Array(vertCount);
    for (let i = 0; i < vertCount; i++) seq[i] = i;
    g.setIndex(new THREE.BufferAttribute(seq, 1));
  }

  const posAttr = g.attributes.position;
  const normAttr = g.attributes.normal;
  const uvAttr = keepUvs ? g.attributes.uv : null;

  const vertCount = posAttr.count;
  const positions = new Float32Array(vertCount * 3);
  for (let i = 0; i < vertCount; i++) {
    positions[i * 3] = posAttr.getX(i);
    positions[i * 3 + 1] = posAttr.getY(i);
    positions[i * 3 + 2] = posAttr.getZ(i);
  }

  const attrStride = 3 + (uvAttr ? 2 : 0);
  const packedAttrs = new Float32Array(vertCount * attrStride);
  for (let i = 0; i < vertCount; i++) {
    packedAttrs[i * attrStride] = normAttr ? normAttr.getX(i) : 0;
    packedAttrs[i * attrStride + 1] = normAttr ? normAttr.getY(i) : 1;
    packedAttrs[i * attrStride + 2] = normAttr ? normAttr.getZ(i) : 0;
    if (uvAttr) {
      packedAttrs[i * attrStride + 3] = uvAttr.getX(i);
      packedAttrs[i * attrStride + 4] = uvAttr.getY(i);
    }
  }

  const rawIndexArray = g.index.array;
  let indices = new Uint32Array(rawIndexArray.length);
  for (let i = 0; i < rawIndexArray.length; i++) indices[i] = rawIndexArray[i];

  // Simplify mesh using Quadric Error Metric (QEM) with normal/UV preservation
  if (targetRatio < 0.999 && indices.length > 96) {
    const targetIndexCount = Math.max(
      36,
      Math.floor((indices.length * targetRatio) / 3) * 3
    );
    const weights = uvAttr ? [0.5, 0.5, 0.5, 0.25, 0.25] : [0.5, 0.5, 0.5];
    let [simplifiedIndices] = MeshoptSimplifier.simplifyWithAttributes(
      indices,
      positions,
      3,
      packedAttrs,
      attrStride,
      weights,
      null,
      targetIndexCount,
      maxError
    );
    // If QEM error bound stopped early on ultra-dense meshes, allow sloppy fallback only when needed
    if (simplifiedIndices.length > targetIndexCount * 1.6 && targetRatio <= 0.15) {
      const [sloppyIndices] = MeshoptSimplifier.simplifySloppy(
        indices,
        positions,
        3,
        null,
        targetIndexCount,
        maxError * 3
      );
      if (sloppyIndices.length >= 36) {
        simplifiedIndices = sloppyIndices;
      }
    }
    if (simplifiedIndices.length >= 12) {
      indices = simplifiedIndices;
    }
  }

  // Reorder triangles IN-PLACE for GPU vertex cache + vertex fetch remap!
  // MeshoptEncoder.reorderMesh mutates `indices` in-place to [0..unique-1] and returns [remap, unique].
  const [remap, newVertCount] = MeshoptEncoder.reorderMesh(indices, true, true);
  const compactIndices = indices;

  const outPositions = new Float32Array(newVertCount * 3);
  const outNormals = new Float32Array(newVertCount * 3);
  const outUvs = uvAttr ? new Float32Array(newVertCount * 2) : null;

  for (let oldV = 0; oldV < remap.length; oldV++) {
    const newV = remap[oldV];
    if (newV >= newVertCount) continue; // 0xFFFFFFFF = unreferenced vertex
    outPositions[newV * 3] = positions[oldV * 3];
    outPositions[newV * 3 + 1] = positions[oldV * 3 + 1];
    outPositions[newV * 3 + 2] = positions[oldV * 3 + 2];

    let nx = packedAttrs[oldV * attrStride];
    let ny = packedAttrs[oldV * attrStride + 1];
    let nz = packedAttrs[oldV * attrStride + 2];
    const len = Math.hypot(nx, ny, nz) || 1;
    outNormals[newV * 3] = nx / len;
    outNormals[newV * 3 + 1] = ny / len;
    outNormals[newV * 3 + 2] = nz / len;

    if (outUvs) {
      outUvs[newV * 2] = packedAttrs[oldV * attrStride + 3];
      outUvs[newV * 2 + 1] = packedAttrs[oldV * attrStride + 4];
    }
  }

  // If sloppy simplification was triggered, recompute smooth vertex normals cleanly
  if (targetRatio <= 0.15) {
    const tempGeom = new THREE.BufferGeometry();
    tempGeom.setAttribute('position', new THREE.BufferAttribute(outPositions, 3));
    tempGeom.setIndex(new THREE.BufferAttribute(compactIndices, 1));
    tempGeom.computeVertexNormals();
    outNormals.set(tempGeom.attributes.normal.array);
  }

  return {
    vertexCount: newVertCount,
    triangleCount: Math.floor(compactIndices.length / 3),
    indices: compactIndices,
    positions: outPositions,
    normals: outNormals,
    uvs: outUvs,
  };
}

/**
 * Encode a mesh primitive with Google Draco 1.5.7 and immediately round-trip decode
 * to verify binary validity and capture exact encoded point/face counts.
 */
function encodePrimitiveDraco(encoderModule, decoderModule, meshData, quantBits) {
  const encoder = new encoderModule.Encoder();
  const meshBuilder = new encoderModule.MeshBuilder();
  const dracoMesh = new encoderModule.Mesh();

  const numFaces = Math.floor(meshData.indices.length / 3);
  const numPoints = meshData.vertexCount;

  meshBuilder.AddFacesToMesh(dracoMesh, numFaces, meshData.indices);

  const posAttrId = meshBuilder.AddFloatAttributeToMesh(
    dracoMesh,
    encoderModule.POSITION,
    numPoints,
    3,
    meshData.positions
  );
  const normAttrId = meshBuilder.AddFloatAttributeToMesh(
    dracoMesh,
    encoderModule.NORMAL,
    numPoints,
    3,
    meshData.normals
  );

  let uvAttrId = -1;
  if (meshData.uvs) {
    uvAttrId = meshBuilder.AddFloatAttributeToMesh(
      dracoMesh,
      encoderModule.TEX_COORD,
      numPoints,
      2,
      meshData.uvs
    );
  }

  encoder.SetSpeedOptions(4, 4);
  encoder.SetAttributeQuantization(encoderModule.POSITION, quantBits.pos || 14);
  encoder.SetAttributeQuantization(encoderModule.NORMAL, quantBits.norm || 10);
  if (meshData.uvs) {
    encoder.SetAttributeQuantization(encoderModule.TEX_COORD, quantBits.uv || 12);
  }
  encoder.SetEncodingMethod(encoderModule.MESH_EDGEBREAKER_ENCODING);

  const encodedData = new encoderModule.DracoInt8Array();
  const encodedLen = encoder.EncodeMeshToDracoBuffer(dracoMesh, encodedData);

  if (encodedLen <= 0) {
    throw new Error('Draco EncodeMeshToDracoBuffer failed');
  }

  const rawBytes = Buffer.alloc(encodedLen);
  for (let i = 0; i < encodedLen; i++) {
    rawBytes[i] = encodedData.GetValue(i) & 0xff;
  }

  encoderModule.destroy(encodedData);
  encoderModule.destroy(dracoMesh);
  encoderModule.destroy(meshBuilder);
  encoderModule.destroy(encoder);

  // Round-trip decode check to verify bitstream integrity & exact decoded counts
  const decoder = new decoderModule.Decoder();
  const decBuf = new decoderModule.DecoderBuffer();
  decBuf.Init(new Int8Array(rawBytes), rawBytes.length);
  const decodedMesh = new decoderModule.Mesh();
  const status = decoder.DecodeBufferToMesh(decBuf, decodedMesh);
  if (!status.ok()) {
    throw new Error(`Draco round-trip decode verification failed: ${status.error_msg()}`);
  }
  const decodedPoints = decodedMesh.num_points();
  const decodedFaces = decodedMesh.num_faces();

  decoderModule.destroy(decodedMesh);
  decoderModule.destroy(decBuf);
  decoderModule.destroy(decoder);

  return {
    dracoBuffer: rawBytes,
    decodedPoints,
    decodedFaces,
    dracoAttrIds: {
      POSITION: posAttrId,
      NORMAL: normAttrId,
      ...(uvAttrId >= 0 ? { TEXCOORD_0: uvAttrId } : {}),
    },
  };
}

/**
 * Build a complete Draco-compressed GLB buffer from an array of { name, materialIndex, meshData }
 * and glTF material definitions.
 */
function buildDracoGlb({
  generatorName,
  meshesSpec,
  materialsSpec,
  extensionsUsedExtra = [],
  encoderModule,
  decoderModule,
  quantBits,
}) {
  const nodes = [];
  const meshes = [];
  const accessors = [];
  const bufferViews = [];
  const binChunks = [];
  let binByteOffset = 0;

  for (let i = 0; i < meshesSpec.length; i++) {
    const item = meshesSpec[i];
    const encoded = encodePrimitiveDraco(
      encoderModule,
      decoderModule,
      item.meshData,
      quantBits
    );

    const paddedDraco = padBuffer4(encoded.dracoBuffer, 0x00);
    const bvIdx = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: binByteOffset,
      byteLength: encoded.dracoBuffer.length,
    });
    binChunks.push(paddedDraco);
    binByteOffset += paddedDraco.length;

    const bounds = computePositionBounds(item.meshData.positions);

    const posAccIdx = accessors.length;
    accessors.push({
      componentType: 5126,
      count: encoded.decodedPoints,
      min: bounds.min.map((v) => Number(v.toFixed(6))),
      max: bounds.max.map((v) => Number(v.toFixed(6))),
      type: 'VEC3',
    });

    const normAccIdx = accessors.length;
    accessors.push({
      componentType: 5126,
      count: encoded.decodedPoints,
      type: 'VEC3',
    });

    const primAttributes = {
      POSITION: posAccIdx,
      NORMAL: normAccIdx,
    };

    if (item.meshData.uvs) {
      const uvAccIdx = accessors.length;
      accessors.push({
        componentType: 5126,
        count: encoded.decodedPoints,
        type: 'VEC2',
      });
      primAttributes.TEXCOORD_0 = uvAccIdx;
    }

    const idxAccIdx = accessors.length;
    accessors.push({
      componentType: encoded.decodedPoints <= 65535 ? 5123 : 5125,
      count: encoded.decodedFaces * 3,
      type: 'SCALAR',
    });

    const meshIdx = meshes.length;
    meshes.push({
      name: item.name,
      primitives: [
        {
          attributes: primAttributes,
          indices: idxAccIdx,
          material: item.materialIndex,
          mode: 4,
          extensions: {
            KHR_draco_mesh_compression: {
              bufferView: bvIdx,
              attributes: encoded.dracoAttrIds,
            },
          },
        },
      ],
    });

    nodes.push({
      name: `${item.name}_Node`,
      mesh: meshIdx,
    });
  }

  const binTotal = Buffer.concat(binChunks);
  const extensionsUsed = Array.from(
    new Set(['KHR_draco_mesh_compression', ...extensionsUsedExtra])
  );

  const gltf = {
    asset: {
      version: '2.0',
      generator: generatorName,
    },
    extensionsUsed,
    extensionsRequired: ['KHR_draco_mesh_compression'],
    scene: 0,
    scenes: [
      {
        name: 'Scene',
        nodes: nodes.map((_, idx) => idx),
      },
    ],
    nodes,
    meshes,
    materials: materialsSpec,
    accessors,
    bufferViews,
    buffers: [
      {
        byteLength: binTotal.length,
      },
    ],
  };

  return packGlb(gltf, binTotal);
}

/**
 * Convert simplified meshSpecs + materials into a Three.js Scene for USDZ export.
 */
function buildThreeSceneForUsdz(meshesSpec, materialsSpec) {
  const scene = new THREE.Scene();
  const threeMaterials = materialsSpec.map((m) => {
    const pbr = m.pbrMetallicRoughness || {};
    const c = pbr.baseColorFactor || [1, 1, 1, 1];
    const isBlend = m.alphaMode === 'BLEND' || (c[3] !== undefined && c[3] < 0.99);
    return new THREE.MeshStandardMaterial({
      name: m.name || 'Mat',
      color: new THREE.Color(c[0], c[1], c[2]),
      metalness: pbr.metallicFactor ?? 0.0,
      roughness: pbr.roughnessFactor ?? 0.5,
      transparent: isBlend,
      opacity: c[3] ?? 1.0,
    });
  });

  for (const item of meshesSpec) {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(item.meshData.positions, 3));
    geom.setAttribute('normal', new THREE.BufferAttribute(item.meshData.normals, 3));
    if (item.meshData.uvs) {
      geom.setAttribute('uv', new THREE.BufferAttribute(item.meshData.uvs, 2));
    }
    geom.setIndex(new THREE.BufferAttribute(item.meshData.indices, 1));
    const mesh = new THREE.Mesh(geom, threeMaterials[item.materialIndex]);
    mesh.name = item.name;
    scene.add(mesh);
  }
  scene.updateMatrixWorld(true);
  return scene;
}

/**
 * Export a Three.js Scene to an iOS AR Quick Look spec-compliant .usdz file.
 */
async function exportSceneToUsdzFile(scene, outPath) {
  const exporter = new USDZExporter();
  const arrayBuf = await exporter.parseAsync(scene, {
    quickLookCompatible: true,
    includeAnchoringProperties: true,
    ar: {
      anchoring: { type: 'plane' },
      planeAnchoring: { alignment: 'horizontal' },
    },
  });
  fs.writeFileSync(outPath, Buffer.from(arrayBuf));
}

// ============================================================================
// 1. WARRIOR SHOWCASE MULTI-LOD PIPELINE (72 Draw Calls -> 14 Draw Calls)
// ============================================================================

async function generateWarriorLods(encoderModule, decoderModule) {
  console.log('\n[1/3] Optimizing Warrior Showcase Model -> 3 Hardware LODs + USDZ...');
  const srcPath = path.join(MODELS_DIR, 'warrior_scene.glb');
  const rawBuf = fs.readFileSync(srcPath);

  // Extract original materials from JSON chunk so exact names/properties are preserved
  const jsonLen = rawBuf.readUInt32LE(12);
  const srcGltf = JSON.parse(rawBuf.toString('utf8', 20, 20 + jsonLen).trim());

  const loader = new GLTFLoader();
  const arrayBuf = rawBuf.buffer.slice(rawBuf.byteOffset, rawBuf.byteOffset + rawBuf.byteLength);
  const parsed = await new Promise((resolve, reject) => {
    loader.parse(arrayBuf, '', resolve, reject);
  });

  parsed.scene.updateMatrixWorld(true);

  // Group world-transformed BufferGeometries by material name
  const matNameToIndex = new Map();
  srcGltf.materials.forEach((m, idx) => {
    matNameToIndex.set(m.name, idx);
  });

  const groupedGeoms = new Map(); // matIdx -> BufferGeometry[]

  parsed.scene.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry) return;
    const matName = obj.material?.name;
    const matIdx = matNameToIndex.has(matName) ? matNameToIndex.get(matName) : 0;

    let g = obj.geometry.clone();
    g.applyMatrix4(obj.matrixWorld);

    // Ensure consistent attributes (POSITION + NORMAL + UV) for mergeGeometries
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) {
      const count = g.attributes.position.count;
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }

    // Keep only position, normal, uv so mergeGeometries never fails on mismatched attributes
    for (const attrKey of Object.keys(g.attributes)) {
      if (attrKey !== 'position' && attrKey !== 'normal' && attrKey !== 'uv') {
        g.deleteAttribute(attrKey);
      }
    }

    if (!groupedGeoms.has(matIdx)) groupedGeoms.set(matIdx, []);
    groupedGeoms.get(matIdx).push(g);
  });

  // Merge per material: collapses 72 meshes -> 14 unified material batches!
  const mergedBatches = [];
  for (let matIdx = 0; matIdx < srcGltf.materials.length; matIdx++) {
    const list = groupedGeoms.get(matIdx);
    if (!list || list.length === 0) continue;
    const merged = list.length === 1 ? list[0] : mergeGeometries(list, false);
    mergedBatches.push({
      matIdx,
      matName: srcGltf.materials[matIdx].name,
      geometry: merged,
    });
  }

  // Helper to tailor materials per device render profile
  function buildWarriorMaterialsForProfile(profile) {
    return srcGltf.materials.map((origMat) => {
      const m = JSON.parse(JSON.stringify(origMat));
      const pal = WARRIOR_PALETTE[m.name];
      if (pal && m.pbrMetallicRoughness) {
        // Embed vibrant palette directly as baseColorFactor/roughness/metalness defaults too!
        const alpha = m.pbrMetallicRoughness.baseColorFactor?.[3] ?? 1.0;
        m.pbrMetallicRoughness.baseColorFactor = [pal.color[0], pal.color[1], pal.color[2], alpha];
        m.pbrMetallicRoughness.roughnessFactor = pal.roughness;
        m.pbrMetallicRoughness.metallicFactor = pal.metalness;
      }

      if (profile === 'balanced') {
        // Strip KHR_materials_transmission on Cornea_Mat to eliminate multipass FBO blit
        if (m.extensions) {
          delete m.extensions.KHR_materials_transmission;
          delete m.extensions.KHR_materials_ior;
          delete m.extensions.KHR_materials_anisotropy;
          if (Object.keys(m.extensions).length === 0) delete m.extensions;
        }
      } else if (profile === 'ultra-light') {
        // Strip all multi-lobe PBR extensions for mobile TBDR single-pass shading
        delete m.extensions;
        if (m.alphaMode !== 'BLEND') {
          m.doubleSided = false;
        }
      }
      return m;
    });
  }

  const lodConfigs = [
    {
      file: 'warrior-lod0-high.glb',
      profile: 'high-fidelity',
      ratio: 0.5,
      maxError: 0.004,
      keepUvs: true,
      quantBits: { pos: 14, norm: 10, uv: 12 },
      extensionsExtra: [
        'KHR_materials_clearcoat',
        'KHR_materials_transmission',
        'KHR_materials_specular',
        'KHR_materials_sheen',
        'KHR_materials_anisotropy',
        'KHR_materials_ior',
      ],
    },
    {
      file: 'warrior-lod1-balanced.glb',
      profile: 'balanced',
      ratio: 0.28,
      maxError: 0.012,
      keepUvs: false,
      quantBits: { pos: 13, norm: 9 },
      extensionsExtra: [
        'KHR_materials_clearcoat',
        'KHR_materials_specular',
        'KHR_materials_sheen',
      ],
    },
    {
      file: 'warrior-lod2-ultralight.glb',
      profile: 'ultra-light',
      ratio: 0.1,
      maxError: 0.035,
      keepUvs: false,
      quantBits: { pos: 12, norm: 8 },
      extensionsExtra: [],
    },
  ];

  let ultralightSpecs = null;
  let ultralightMats = null;

  for (const cfg of lodConfigs) {
    const materialsSpec = buildWarriorMaterialsForProfile(cfg.profile);
    const meshesSpec = mergedBatches.map((batch) => ({
      name: `Warrior_${batch.matName}`,
      materialIndex: batch.matIdx,
      meshData: simplifyAndOptimizeGeometry(
        batch.geometry,
        cfg.ratio,
        cfg.maxError,
        cfg.keepUvs
      ),
    }));

    if (cfg.profile === 'ultra-light') {
      ultralightSpecs = meshesSpec;
      ultralightMats = materialsSpec;
    }

    const glbBuf = buildDracoGlb({
      generatorName: `GoldenOak-3D-Pipeline (${cfg.profile})`,
      meshesSpec,
      materialsSpec,
      extensionsUsedExtra: cfg.extensionsExtra,
      encoderModule,
      decoderModule,
      quantBits: cfg.quantBits,
    });

    const outPath = path.join(OPTIMIZED_DIR, cfg.file);
    fs.writeFileSync(outPath, glbBuf);

    const totalTris = meshesSpec.reduce((s, m) => s + m.meshData.triangleCount, 0);
    const totalVerts = meshesSpec.reduce((s, m) => s + m.meshData.vertexCount, 0);
    console.log(
      `  -> ${cfg.file}: ${(glbBuf.length / 1024).toFixed(1)} KB | drawCalls=${meshesSpec.length} | verts=${totalVerts} | tris=${totalTris}`
    );
  }

  // Generate Apple AR Quick Look USDZ from dedicated Quick Look decimation (~14k tris -> <1 MB USDZ)
  if (ultralightMats) {
    const usdzSpecs = mergedBatches.map((batch) => ({
      name: `Warrior_${batch.matName}`,
      materialIndex: batch.matIdx,
      meshData: simplifyAndOptimizeGeometry(batch.geometry, 0.035, 0.06, false),
    }));
    const usdzScene = buildThreeSceneForUsdz(usdzSpecs, ultralightMats);
    // Scale to realistic tabletop centerpiece height (~28cm) for iOS Quick Look plane placement
    usdzScene.scale.setScalar(0.16);
    usdzScene.updateMatrixWorld(true);
    const usdzPath = path.join(OPTIMIZED_DIR, 'warrior-showcase.usdz');
    await exportSceneToUsdzFile(usdzScene, usdzPath);
    const usdzStat = fs.statSync(usdzPath);
    console.log(`  -> warrior-showcase.usdz: ${(usdzStat.size / 1024).toFixed(1)} KB (iOS Quick Look ready)`);
  }
}

// ============================================================================
// 2. CULINARY MULTI-LOD FOOD & PLATTER ASSETS + USDZ
// ============================================================================

const CULINARY_MATERIALS = [
  {
    name: 'Mat_Ceramic_Plate',
    pbrMetallicRoughness: { baseColorFactor: [0.96, 0.95, 0.92, 1.0], metallicFactor: 0.04, roughnessFactor: 0.16 },
  },
  {
    name: 'Mat_Bread_Crust',
    pbrMetallicRoughness: { baseColorFactor: [0.78, 0.49, 0.21, 1.0], metallicFactor: 0.0, roughnessFactor: 0.68 },
  },
  {
    name: 'Mat_Grilled_Meat',
    pbrMetallicRoughness: { baseColorFactor: [0.34, 0.17, 0.1, 1.0], metallicFactor: 0.02, roughnessFactor: 0.46 },
  },
  {
    name: 'Mat_Melted_Cheese',
    pbrMetallicRoughness: { baseColorFactor: [0.96, 0.72, 0.16, 1.0], metallicFactor: 0.0, roughnessFactor: 0.22 },
  },
  {
    name: 'Mat_Fresh_Vegetables',
    pbrMetallicRoughness: { baseColorFactor: [0.24, 0.62, 0.22, 1.0], metallicFactor: 0.0, roughnessFactor: 0.36 },
  },
  {
    name: 'Mat_Glossy_Sauce',
    pbrMetallicRoughness: { baseColorFactor: [0.76, 0.16, 0.09, 1.0], metallicFactor: 0.02, roughnessFactor: 0.12 },
  },
  {
    name: 'Mat_Fried_Food',
    pbrMetallicRoughness: { baseColorFactor: [0.84, 0.56, 0.18, 1.0], metallicFactor: 0.0, roughnessFactor: 0.58 },
  },
  {
    name: 'Mat_Glass_Container',
    alphaMode: 'BLEND',
    pbrMetallicRoughness: { baseColorFactor: [0.94, 0.98, 1.0, 0.32], metallicFactor: 0.06, roughnessFactor: 0.06 },
  },
  {
    name: 'Mat_Beverage_Liquid',
    alphaMode: 'BLEND',
    pbrMetallicRoughness: { baseColorFactor: [0.2, 0.72, 0.38, 0.86], metallicFactor: 0.0, roughnessFactor: 0.08 },
  },
];

const MAT_IDX = {
  PLATE: 0,
  BREAD: 1,
  MEAT: 2,
  CHEESE: 3,
  VEG: 4,
  SAUCE: 5,
  FRIED: 6,
  GLASS: 7,
  LIQUID: 8,
};

function normalizeAttributes(geom) {
  const g = geom;
  if (!g.index) {
    const c = g.attributes.position.count;
    const seq = new Uint32Array(c);
    for (let i = 0; i < c; i++) seq[i] = i;
    g.setIndex(new THREE.BufferAttribute(seq, 1));
  }
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) {
    const c = g.attributes.position.count;
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(c * 2), 2));
  }
  for (const k of Object.keys(g.attributes)) {
    if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
  }
  return g;
}

function buildPlateParts(radialSegs, outerRadius = 0.15) {
  const profile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(outerRadius * 0.72, 0.0),
    new THREE.Vector2(outerRadius * 0.96, 0.014),
    new THREE.Vector2(outerRadius, 0.018),
    new THREE.Vector2(outerRadius * 0.94, 0.02),
    new THREE.Vector2(outerRadius * 0.68, 0.006),
    new THREE.Vector2(0.0, 0.006),
  ];
  return normalizeAttributes(new THREE.LatheGeometry(profile, radialSegs));
}

/**
 * Procedural gourmet dish builders parameterized by radial/tubular tessellation (detailFactor: 1.0, 0.6, 0.35).
 */
function buildCulinaryArchetype(archetype, segs) {
  const ringSegs = Math.max(12, Math.round(segs));
  const subSegs = Math.max(8, Math.round(segs * 0.5));
  const buckets = new Map(); // matIdx -> BufferGeometry[]

  function addPart(matIdx, geom, tx = 0, ty = 0, tz = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    const g = normalizeAttributes(geom.clone());
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
    m.compose(new THREE.Vector3(tx, ty, tz), q, new THREE.Vector3(sx, sy, sz));
    g.applyMatrix4(m);
    if (!buckets.has(matIdx)) buckets.set(matIdx, []);
    buckets.get(matIdx).push(g);
  }

  if (archetype === 'golden-oak-burger' || archetype === 'classic-smash-burger') {
    const isSmash = archetype === 'classic-smash-burger';
    addPart(MAT_IDX.PLATE, buildPlateParts(ringSegs, 0.145));

    // Bottom toasted brioche heel
    addPart(MAT_IDX.BREAD, new THREE.CylinderGeometry(0.068, 0.062, 0.022, ringSegs, 2), 0, 0.017, 0);

    // Lettuce wave / pickle layer
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      addPart(
        MAT_IDX.VEG,
        new THREE.CylinderGeometry(0.026, 0.026, 0.005, Math.max(8, subSegs)),
        Math.cos(ang) * 0.045,
        0.031,
        Math.sin(ang) * 0.045,
        0.08 * Math.sin(i),
        ang,
        0.08 * Math.cos(i)
      );
    }

    // Flame-grilled patty 1 + melted cheddar
    addPart(
      MAT_IDX.MEAT,
      new THREE.CylinderGeometry(0.069, 0.068, isSmash ? 0.015 : 0.026, ringSegs, 2),
      0,
      isSmash ? 0.042 : 0.047,
      0
    );
    addPart(
      MAT_IDX.CHEESE,
      new THREE.BoxGeometry(0.112, 0.004, 0.112, 2, 1, 2),
      0,
      isSmash ? 0.052 : 0.062,
      0,
      0,
      Math.PI / 4,
      0
    );

    if (isSmash) {
      // Second smash patty + second cheese slice
      addPart(MAT_IDX.MEAT, new THREE.CylinderGeometry(0.067, 0.067, 0.014, ringSegs, 2), 0, 0.062, 0);
      addPart(MAT_IDX.CHEESE, new THREE.BoxGeometry(0.108, 0.004, 0.108, 2, 1, 2), 0, 0.071, 0, 0, 0.2, 0);
    } else {
      // Heirloom tomato slices + glossy truffle-bacon jam glaze
      addPart(MAT_IDX.SAUCE, new THREE.CylinderGeometry(0.054, 0.054, 0.008, ringSegs), 0, 0.068, 0);
      addPart(MAT_IDX.FRIED, new THREE.TorusGeometry(0.038, 0.007, Math.max(6, Math.floor(subSegs / 2)), ringSegs), 0, 0.077, 0, Math.PI / 2, 0, 0);
    }

    // Domed brioche crown bun
    const crownY = isSmash ? 0.074 : 0.082;
    addPart(
      MAT_IDX.BREAD,
      new THREE.SphereGeometry(0.068, ringSegs, subSegs, 0, Math.PI * 2, 0, Math.PI * 0.52),
      0,
      crownY,
      0,
      0,
      0,
      0,
      1.0,
      0.62,
      1.0
    );
  } else if (archetype === 'tandoori-paneer-pizza' || archetype === 'chicken-tikka-pizza') {
    const isPaneer = archetype === 'tandoori-paneer-pizza';
    addPart(MAT_IDX.PLATE, buildPlateParts(ringSegs, 0.175));

    // Sourdough flat base + puffy cornicione rim
    addPart(MAT_IDX.BREAD, new THREE.CylinderGeometry(0.145, 0.142, 0.009, ringSegs), 0, 0.011, 0);
    addPart(
      MAT_IDX.BREAD,
      new THREE.TorusGeometry(0.138, 0.013, Math.max(8, subSegs), ringSegs),
      0,
      0.017,
      0,
      Math.PI / 2,
      0,
      0
    );

    // Rich makhani / tikka sauce layer + melted smoked mozzarella layer
    addPart(MAT_IDX.SAUCE, new THREE.CylinderGeometry(0.126, 0.126, 0.003, ringSegs), 0, 0.017, 0);
    addPart(MAT_IDX.CHEESE, new THREE.CylinderGeometry(0.121, 0.121, 0.004, ringSegs), 0, 0.02, 0);

    // 10 artisan toppings arranged organically
    for (let i = 0; i < 10; i++) {
      const r = i < 3 ? 0.042 : 0.088;
      const ang = (i * 2.39996) % (Math.PI * 2); // golden angle spiral
      const tx = Math.cos(ang) * r;
      const tz = Math.sin(ang) * r;

      if (isPaneer) {
        addPart(MAT_IDX.FRIED, new THREE.BoxGeometry(0.02, 0.013, 0.02), tx, 0.027, tz, 0, ang, 0);
      } else {
        addPart(MAT_IDX.MEAT, new THREE.DodecahedronGeometry(0.013, 0), tx, 0.027, tz, ang, ang * 0.5, 0);
      }

      // Bell pepper / jalapeno strips
      const vx = Math.cos(ang + 0.45) * (r * 0.85);
      const vz = Math.sin(ang + 0.45) * (r * 0.85);
      addPart(
        MAT_IDX.VEG,
        new THREE.CylinderGeometry(0.009, 0.009, 0.003, Math.max(8, Math.floor(subSegs / 2))),
        vx,
        0.024,
        vz,
        0,
        ang,
        0
      );
    }
  } else if (archetype === 'gourmet-wok-bowl') {
    // Deep ceramic bowl via lathe
    const bowlProfile = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.065, 0.0),
      new THREE.Vector2(0.115, 0.055),
      new THREE.Vector2(0.122, 0.075),
      new THREE.Vector2(0.114, 0.076),
      new THREE.Vector2(0.098, 0.045),
      new THREE.Vector2(0.0, 0.012),
    ];
    addPart(MAT_IDX.PLATE, new THREE.LatheGeometry(bowlProfile, ringSegs));

    // Sculpted noodle / starter mound + glossy chili glaze + scallion rings
    addPart(
      MAT_IDX.FRIED,
      new THREE.SphereGeometry(0.096, ringSegs, subSegs, 0, Math.PI * 2, 0, Math.PI * 0.55),
      0,
      0.036,
      0,
      0,
      0,
      0,
      1.0,
      0.52,
      1.0
    );
    addPart(
      MAT_IDX.SAUCE,
      new THREE.TorusGeometry(0.048, 0.008, Math.max(6, Math.floor(subSegs / 2)), ringSegs),
      0,
      0.072,
      0,
      Math.PI / 2,
      0,
      0
    );
    for (let i = 0; i < 7; i++) {
      const ang = i * 2.1;
      const r = 0.025 + (i % 3) * 0.02;
      addPart(
        MAT_IDX.VEG,
        new THREE.TorusGeometry(0.008, 0.0025, 6, Math.max(8, Math.floor(subSegs / 2))),
        Math.cos(ang) * r,
        0.078 - r * 0.15,
        Math.sin(ang) * r,
        Math.PI / 2,
        0,
        0
      );
    }
  } else if (archetype === 'kaffir-lime-mocktail') {
    // Coaster + crystal highball glass + translucent lime-emerald liquid + lime wheel
    addPart(MAT_IDX.PLATE, new THREE.CylinderGeometry(0.065, 0.068, 0.006, ringSegs), 0, 0.003, 0);

    // Beverage core first (inner radius smaller than glass wall)
    addPart(MAT_IDX.LIQUID, new THREE.CylinderGeometry(0.041, 0.035, 0.115, ringSegs), 0, 0.072, 0);

    // Kaffir lime wheel on rim
    addPart(MAT_IDX.VEG, new THREE.CylinderGeometry(0.024, 0.024, 0.005, ringSegs), 0.044, 0.142, 0, 0, 0, Math.PI / 2.3);

    // Outer crystal glass shell
    const glassProfile = [
      new THREE.Vector2(0.0, 0.006),
      new THREE.Vector2(0.04, 0.006),
      new THREE.Vector2(0.048, 0.145),
      new THREE.Vector2(0.045, 0.145),
      new THREE.Vector2(0.037, 0.016),
      new THREE.Vector2(0.0, 0.016),
    ];
    addPart(MAT_IDX.GLASS, new THREE.LatheGeometry(glassProfile, ringSegs));
  }

  // Merge per used material so draw calls == number of distinct culinary materials (3..6 draw calls!)
  const usedMatIndices = Array.from(buckets.keys()).sort((a, b) => a - b);
  const localMaterials = usedMatIndices.map((globalIdx) =>
    JSON.parse(JSON.stringify(CULINARY_MATERIALS[globalIdx]))
  );

  const meshesSpec = usedMatIndices.map((globalIdx, localIdx) => {
    const list = buckets.get(globalIdx);
    const merged = list.length === 1 ? list[0] : mergeGeometries(list, false);
    return {
      name: `${archetype}_${CULINARY_MATERIALS[globalIdx].name}`,
      materialIndex: localIdx,
      geometry: merged,
    };
  });

  return { meshesSpec, localMaterials };
}

async function generateCulinaryAssets(encoderModule, decoderModule) {
  console.log('\n[2/3] Generating 6 Multi-LOD Culinary Food/Platter Archetypes (18 GLBs + 6 USDZs)...');

  const archetypes = [
    'golden-oak-burger',
    'classic-smash-burger',
    'tandoori-paneer-pizza',
    'chicken-tikka-pizza',
    'gourmet-wok-bowl',
    'kaffir-lime-mocktail',
  ];

  const tiers = [
    { suffix: 'high', profile: 'high-fidelity', segs: 48, quant: { pos: 14, norm: 10, uv: 12 } },
    { suffix: 'balanced', profile: 'balanced', segs: 28, quant: { pos: 13, norm: 9, uv: 11 } },
    { suffix: 'ultralight', profile: 'ultra-light', segs: 16, quant: { pos: 12, norm: 8, uv: 10 } },
  ];

  for (const arch of archetypes) {
    let balancedSpecForUsdz = null;
    let balancedMatsForUsdz = null;

    for (const tier of tiers) {
      const { meshesSpec, localMaterials } = buildCulinaryArchetype(arch, tier.segs);
      const optimizedSpecs = meshesSpec.map((m) => ({
        name: m.name,
        materialIndex: m.materialIndex,
        meshData: simplifyAndOptimizeGeometry(m.geometry, 1.0, 0.005, true),
      }));

      if (tier.suffix === 'balanced') {
        balancedSpecForUsdz = optimizedSpecs;
        balancedMatsForUsdz = localMaterials;
      }

      const glbBuf = buildDracoGlb({
        generatorName: `GoldenOak-Culinary-Pipeline (${arch}:${tier.profile})`,
        meshesSpec: optimizedSpecs,
        materialsSpec: localMaterials,
        extensionsUsedExtra: [],
        encoderModule,
        decoderModule,
        quantBits: tier.quant,
      });

      const fileName = `${arch}-${tier.suffix}.glb`;
      fs.writeFileSync(path.join(OPTIMIZED_DIR, fileName), glbBuf);

      const tris = optimizedSpecs.reduce((s, m) => s + m.meshData.triangleCount, 0);
      const verts = optimizedSpecs.reduce((s, m) => s + m.meshData.vertexCount, 0);
      console.log(
        `  -> ${fileName}: ${(glbBuf.length / 1024).toFixed(2)} KB | drawCalls=${optimizedSpecs.length} | verts=${verts} | tris=${tris}`
      );
    }

    if (balancedSpecForUsdz && balancedMatsForUsdz) {
      const scene = buildThreeSceneForUsdz(balancedSpecForUsdz, balancedMatsForUsdz);
      const usdzFile = `${arch}.usdz`;
      const usdzPath = path.join(OPTIMIZED_DIR, usdzFile);
      await exportSceneToUsdzFile(scene, usdzPath);
      const st = fs.statSync(usdzPath);
      console.log(`  -> ${usdzFile}: ${(st.size / 1024).toFixed(2)} KB (1:1 tabletop scale USDZ)`);
    }
  }
}

// ============================================================================
// 3. INTERIOR TEXTURE-CLAMPED & MATERIAL-DEDUPLICATED DERIVATIVE
// ============================================================================

async function generateOptimizedInteriorDerivative() {
  console.log('\n[3/3] Generating Texture-Clamped & Deduplicated Interior GLB Derivative...');
  const srcPath = path.join(MODELS_DIR, 'the_golden_oak_interior.optimized.glb');
  const buf = fs.readFileSync(srcPath);

  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen).trim());
  const binStart = 20 + jsonLen + 8;
  const binLen = buf.readUInt32LE(20 + jsonLen);
  const binChunk = buf.subarray(binStart, binStart + binLen);

  // 1. Deduplicate identical material definitions (64 -> 63)
  const sigToMatIdx = new Map();
  const oldToNewMat = new Map();
  const dedupedMaterials = [];

  gltf.materials.forEach((mat, oldIdx) => {
    const copy = { ...mat };
    delete copy.name;
    const sig = JSON.stringify(copy);
    if (sigToMatIdx.has(sig)) {
      oldToNewMat.set(oldIdx, sigToMatIdx.get(sig));
    } else {
      const newIdx = dedupedMaterials.length;
      sigToMatIdx.set(sig, newIdx);
      oldToNewMat.set(oldIdx, newIdx);
      dedupedMaterials.push(mat);
    }
  });

  for (const mesh of gltf.meshes || []) {
    for (const prim of mesh.primitives || []) {
      if (typeof prim.material === 'number' && oldToNewMat.has(prim.material)) {
        prim.material = oldToNewMat.get(prim.material);
      }
    }
  }
  const removedMats = gltf.materials.length - dedupedMaterials.length;
  gltf.materials = dedupedMaterials;

  // 2. Rebuild BIN chunk, transcoding oversized embedded opaque PNGs -> clamped 1024x1024 JPEG (quality 85)
  const imageBufferViewSet = new Map(); // bvIdx -> imgIdx
  (gltf.images || []).forEach((img, imgIdx) => {
    if (typeof img.bufferView === 'number') {
      imageBufferViewSet.set(img.bufferView, imgIdx);
    }
  });

  const newBinParts = [];
  let newOffset = 0;

  for (let bvIdx = 0; bvIdx < gltf.bufferViews.length; bvIdx++) {
    const bv = gltf.bufferViews[bvIdx];
    const origSlice = binChunk.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);

    if (imageBufferViewSet.has(bvIdx)) {
      const imgIdx = imageBufferViewSet.get(bvIdx);
      const img = gltf.images[imgIdx];
      const compressedJpeg = await sharp(origSlice)
        .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 84, mozjpeg: true })
        .toBuffer();

      img.mimeType = 'image/jpeg';
      const padded = padBuffer4(compressedJpeg, 0x00);
      bv.byteOffset = newOffset;
      bv.byteLength = compressedJpeg.length;
      newBinParts.push(padded);
      newOffset += padded.length;
      console.log(
        `  -> Image "${img.name}": ${(origSlice.length / 1024).toFixed(1)} KB PNG -> ${(compressedJpeg.length / 1024).toFixed(1)} KB 1024px JPEG`
      );
    } else {
      const padded = padBuffer4(origSlice, 0x00);
      bv.byteOffset = newOffset;
      bv.byteLength = origSlice.length;
      newBinParts.push(padded);
      newOffset += padded.length;
    }
  }

  const finalBin = Buffer.concat(newBinParts);
  gltf.buffers[0].byteLength = finalBin.length;

  const outGlb = packGlb(gltf, finalBin);
  const outPath = path.join(OPTIMIZED_DIR, 'the_golden_oak_interior.mobile-balanced.glb');
  fs.writeFileSync(outPath, outGlb);

  const savingPct = (((buf.length - outGlb.length) / buf.length) * 100).toFixed(1);
  console.log(
    `  -> the_golden_oak_interior.mobile-balanced.glb: ${(outGlb.length / (1024 * 1024)).toFixed(2)} MB (saved ${savingPct}% vs .optimized.glb, deduplicated ${removedMats} material)`
  );
}

async function main() {
  await MeshoptSimplifier.ready;
  await MeshoptEncoder.ready;
  const [encoderModule, decoderModule] = await Promise.all([
    draco3d.createEncoderModule({}),
    draco3d.createDecoderModule({}),
  ]);

  fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });

  await generateWarriorLods(encoderModule, decoderModule);
  await generateCulinaryAssets(encoderModule, decoderModule);
  await generateOptimizedInteriorDerivative();

  console.log('\n=== Phase B 3D Model Optimization Complete ===');
}

main().catch((err) => {
  console.error('Optimizer failed:', err);
  process.exit(1);
});
