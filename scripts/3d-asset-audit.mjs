#!/usr/bin/env node
/**
 * Phase A: Exhaustive Binary 3D Asset, HDR Texture & Draco Decoder Auditor
 * The Golden Oak — Production 3D Pipeline Audit
 *
 * Inspects binary GLB headers, glTF 2.0 JSON + BIN chunks, embedded PNG/JPEG/WebP/KTX2
 * texture headers, Radiance RGBE (.hdr) environment maps, USDZ/USDA packages,
 * and Draco WASM/JS decoders using 100% deterministic binary parsing.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DEFAULT_OUTPUT_PATH =
  process.argv[2] ||
  'C:\\Users\\Pyiush Gupta\\.gemini\\antigravity\\brain\\22cb5c35-3043-4ba7-a662-5d1b3225baa2\\agent1_asset_audit.json';

const COMPONENT_TYPE_NAMES = {
  5120: 'BYTE (int8)',
  5121: 'UNSIGNED_BYTE (uint8)',
  5122: 'SHORT (int16)',
  5123: 'UNSIGNED_SHORT (uint16)',
  5125: 'UNSIGNED_INT (uint32)',
  5126: 'FLOAT (float32)',
};

const COMPONENT_BYTE_SIZES = {
  5120: 1,
  5121: 1,
  5122: 2,
  5123: 2,
  5125: 4,
  5126: 4,
};

const TYPE_COMPONENT_COUNTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

const FILTER_ENUM_NAMES = {
  9728: 'NEAREST',
  9729: 'LINEAR',
  9984: 'NEAREST_MIPMAP_NEAREST',
  9985: 'LINEAR_MIPMAP_NEAREST',
  9986: 'NEAREST_MIPMAP_LINEAR',
  9987: 'LINEAR_MIPMAP_LINEAR',
};

const WRAP_ENUM_NAMES = {
  33071: 'CLAMP_TO_EDGE',
  33648: 'MIRRORED_REPEAT',
  10497: 'REPEAT',
};

/**
 * Parse binary image dimensions and format metadata from raw bytes inside GLB BIN chunk.
 */
function parseBinaryImageHeader(buf) {
  if (!buf || buf.length < 12) {
    return { format: 'unknown', width: null, height: null };
  }

  // 1. PNG: 89 50 4E 47 0D 0A 1A 0A + IHDR at offset 8
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf.length >= 26
  ) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    const bitDepth = buf[24];
    const colorType = buf[25];
    return { format: 'image/png', width, height, bitDepth, colorType };
  }

  // 2. JPEG: FF D8 ... scan for SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) {
        offset++;
        continue;
      }
      // Skip padding 0xFF bytes
      while (offset < buf.length && buf[offset] === 0xff) offset++;
      if (offset >= buf.length) break;
      const marker = buf[offset];
      offset++;

      // Standalone markers without length
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
        continue;
      }
      if (offset + 2 > buf.length) break;
      const segLength = buf.readUInt16BE(offset);
      if (segLength < 2) break;

      const isSOF =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);

      if (isSOF && offset + 7 < buf.length) {
        const precision = buf[offset + 2];
        const height = buf.readUInt16BE(offset + 3);
        const width = buf.readUInt16BE(offset + 5);
        const components = buf[offset + 7];
        return { format: 'image/jpeg', width, height, precision, components };
      }

      offset += segLength;
    }
    return { format: 'image/jpeg', width: null, height: null };
  }

  // 3. WebP: 'RIFF' .... 'WEBP'
  if (
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP' &&
    buf.length >= 30
  ) {
    const chunkType = buf.toString('ascii', 12, 16);
    if (chunkType === 'VP8 ' && buf.length >= 30) {
      const width = buf.readUInt16LE(26) & 0x3fff;
      const height = buf.readUInt16LE(28) & 0x3fff;
      return { format: 'image/webp', subFormat: 'VP8', width, height };
    }
    if (chunkType === 'VP8L' && buf.length >= 25) {
      const b0 = buf[21];
      const b1 = buf[22];
      const b2 = buf[23];
      const b3 = buf[24];
      const width = 1 + (((b1 & 0x3f) << 8) | b0);
      const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      return { format: 'image/webp', subFormat: 'VP8L', width, height };
    }
    if (chunkType === 'VP8X' && buf.length >= 30) {
      const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
      return { format: 'image/webp', subFormat: 'VP8X', width, height };
    }
    return { format: 'image/webp', width: null, height: null };
  }

  // 4. KTX2: AB 4B 54 58 20 32 30 BB 0D 0A 1A 0A
  if (
    buf[0] === 0xab &&
    buf[1] === 0x4b &&
    buf[2] === 0x54 &&
    buf[3] === 0x58 &&
    buf[4] === 0x20 &&
    buf[5] === 0x32 &&
    buf[6] === 0x30 &&
    buf.length >= 48
  ) {
    const vkFormat = buf.readUInt32LE(12);
    const width = buf.readUInt32LE(20);
    const height = buf.readUInt32LE(24);
    const levelCount = buf.readUInt32LE(40);
    const supercompressionScheme = buf.readUInt32LE(44);
    return {
      format: 'image/ktx2',
      width,
      height,
      vkFormat,
      levelCount,
      supercompressionScheme,
    };
  }

  return { format: 'unknown', width: null, height: null };
}

/**
 * Collect all texture indices referenced inside a glTF material (including extensions).
 */
function collectMaterialTextures(mat) {
  const texRefs = [];
  if (!mat || typeof mat !== 'object') return texRefs;

  const pbr = mat.pbrMetallicRoughness;
  if (pbr) {
    if (pbr.baseColorTexture?.index !== undefined) {
      texRefs.push({ slot: 'baseColorTexture', index: pbr.baseColorTexture.index });
    }
    if (pbr.metallicRoughnessTexture?.index !== undefined) {
      texRefs.push({ slot: 'metallicRoughnessTexture', index: pbr.metallicRoughnessTexture.index });
    }
  }
  if (mat.normalTexture?.index !== undefined) {
    texRefs.push({ slot: 'normalTexture', index: mat.normalTexture.index });
  }
  if (mat.occlusionTexture?.index !== undefined) {
    texRefs.push({ slot: 'occlusionTexture', index: mat.occlusionTexture.index });
  }
  if (mat.emissiveTexture?.index !== undefined) {
    texRefs.push({ slot: 'emissiveTexture', index: mat.emissiveTexture.index });
  }

  if (mat.extensions) {
    for (const [extName, extVal] of Object.entries(mat.extensions)) {
      if (extVal && typeof extVal === 'object') {
        for (const [k, v] of Object.entries(extVal)) {
          if (v && typeof v === 'object' && typeof v.index === 'number') {
            texRefs.push({ slot: `${extName}.${k}`, index: v.index });
          }
        }
      }
    }
  }
  return texRefs;
}

/**
 * Audit a single binary .glb file on disk.
 */
function auditGlbFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const gzipSize = zlib.gzipSync(buf, { level: 6 }).length;
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');

  if (buf.length < 20) {
    return {
      file: relPath,
      fileSizeBytes: buf.length,
      validGlb: false,
      error: 'File shorter than minimum 20-byte GLB header + chunk header',
    };
  }

  const magicUint32 = buf.readUInt32LE(0);
  const magicAscii = buf.toString('ascii', 0, 4);
  const version = buf.readUInt32LE(4);
  const headerTotalLength = buf.readUInt32LE(8);

  const validMagic = magicUint32 === 0x46546c67 && magicAscii === 'glTF';
  if (!validMagic) {
    return {
      file: relPath,
      fileSizeBytes: buf.length,
      validGlb: false,
      magicAscii,
      magicHex: `0x${magicUint32.toString(16).toUpperCase()}`,
      error: 'Invalid GLB magic header',
    };
  }

  // Parse chunks
  const chunks = [];
  let offset = 12;
  let jsonChunkBuf = null;
  let binChunkBuf = null;

  while (offset + 8 <= buf.length) {
    const chunkLength = buf.readUInt32LE(offset);
    const chunkType = buf.readUInt32LE(offset + 4);
    const dataStart = offset + 8;
    const dataEnd = Math.min(dataStart + chunkLength, buf.length);
    const chunkSlice = buf.subarray(dataStart, dataEnd);

    let chunkTypeName = `0x${chunkType.toString(16).toUpperCase()}`;
    if (chunkType === 0x4e4f534a) {
      chunkTypeName = 'JSON';
      if (!jsonChunkBuf) jsonChunkBuf = chunkSlice;
    } else if (chunkType === 0x004e4942) {
      chunkTypeName = 'BIN';
      if (!binChunkBuf) binChunkBuf = chunkSlice;
    }

    chunks.push({
      type: chunkTypeName,
      byteOffset: offset,
      byteLength: chunkLength,
    });

    offset = dataStart + chunkLength;
  }

  if (!jsonChunkBuf) {
    return {
      file: relPath,
      fileSizeBytes: buf.length,
      validGlb: false,
      error: 'Missing JSON chunk in GLB',
    };
  }

  const rawJsonStr = jsonChunkBuf.toString('utf8');
  const hasNullBytePadding = rawJsonStr.includes('\0');
  const gltf = JSON.parse(rawJsonStr.replace(/\0+$/g, '').trim());

  const scenes = gltf.scenes || [];
  const nodes = gltf.nodes || [];
  const meshes = gltf.meshes || [];
  const materials = gltf.materials || [];
  const textures = gltf.textures || [];
  const samplers = gltf.samplers || [];
  const images = gltf.images || [];
  const accessors = gltf.accessors || [];
  const bufferViews = gltf.bufferViews || [];
  const buffers = gltf.buffers || [];
  const animations = gltf.animations || [];
  const skins = gltf.skins || [];
  const cameras = gltf.cameras || [];
  const punctualLights = gltf.extensions?.KHR_lights_punctual?.lights || [];

  // Scene graph traversal for reachable nodes & instantiated mesh/primitive counts
  const reachableNodes = new Set();
  const nodeInstanceMeshCounts = new Map(); // meshIndex -> instance count in scene

  function traverseNode(nodeIdx) {
    if (nodeIdx < 0 || nodeIdx >= nodes.length) return;
    const isFirstVisit = !reachableNodes.has(nodeIdx);
    reachableNodes.add(nodeIdx);
    const node = nodes[nodeIdx];
    if (typeof node.mesh === 'number') {
      nodeInstanceMeshCounts.set(node.mesh, (nodeInstanceMeshCounts.get(node.mesh) || 0) + 1);
    }
    // Even if DAG shares nodes, traverse children for accurate instance counts
    if (Array.isArray(node.children)) {
      for (const childIdx of node.children) {
        if (isFirstVisit || !reachableNodes.has(childIdx)) {
          traverseNode(childIdx);
        } else {
          // DAG shared subtree
          countSubtreeInstances(childIdx, new Set());
        }
      }
    }
  }

  function countSubtreeInstances(nodeIdx, visitedInPath) {
    if (visitedInPath.has(nodeIdx) || nodeIdx < 0 || nodeIdx >= nodes.length) return;
    visitedInPath.add(nodeIdx);
    const node = nodes[nodeIdx];
    if (typeof node.mesh === 'number') {
      nodeInstanceMeshCounts.set(node.mesh, (nodeInstanceMeshCounts.get(node.mesh) || 0) + 1);
    }
    if (Array.isArray(node.children)) {
      for (const c of node.children) countSubtreeInstances(c, visitedInPath);
    }
  }

  if (scenes.length > 0) {
    for (const sc of scenes) {
      for (const rootIdx of sc.nodes || []) {
        traverseNode(rootIdx);
      }
    }
  }

  // Geometry & Primitive inspection
  let uniquePrimitiveCount = 0;
  let uniquePrimitiveVerticesSum = 0;
  let uniquePrimitiveTrianglesSum = 0;
  const uniquePositionAccessors = new Set();
  let deduplicatedAccessorVertices = 0;

  let sceneInstantiatedMeshNodes = 0;
  let sceneEstimatedDrawCalls = 0;
  let sceneInstantiatedVertices = 0;
  let sceneInstantiatedTriangles = 0;

  let dracoCompressedPrimitives = 0;
  let dracoTotalCompressedBytes = 0;
  const dracoBufferViewsSeen = new Set();

  const attributeSummary = {};
  const usedMaterials = new Set();
  const usedAccessors = new Set();
  const usedBufferViews = new Set();

  // Bounding box across unique POSITION accessors
  const overallMin = [Infinity, Infinity, Infinity];
  const overallMax = [-Infinity, -Infinity, -Infinity];

  meshes.forEach((mesh, meshIdx) => {
    const instancesInScene = nodeInstanceMeshCounts.get(meshIdx) || 0;
    if (instancesInScene > 0) {
      sceneInstantiatedMeshNodes += instancesInScene;
    }

    for (const prim of mesh.primitives || []) {
      uniquePrimitiveCount++;
      const mode = prim.mode ?? 4; // 4 = TRIANGLES
      if (typeof prim.material === 'number') {
        usedMaterials.add(prim.material);
      }

      // Attributes
      const attrs = prim.attributes || {};
      let primVertices = 0;
      for (const [attrName, accIdx] of Object.entries(attrs)) {
        usedAccessors.add(accIdx);
        const acc = accessors[accIdx];
        if (!acc) continue;
        if (typeof acc.bufferView === 'number') usedBufferViews.add(acc.bufferView);

        const compName = COMPONENT_TYPE_NAMES[acc.componentType] || String(acc.componentType);
        if (!attributeSummary[attrName]) {
          attributeSummary[attrName] = { primitiveCount: 0, componentTypes: new Set(), types: new Set() };
        }
        attributeSummary[attrName].primitiveCount++;
        attributeSummary[attrName].componentTypes.add(compName);
        attributeSummary[attrName].types.add(acc.type);

        if (attrName === 'POSITION') {
          primVertices = acc.count || 0;
          if (!uniquePositionAccessors.has(accIdx)) {
            uniquePositionAccessors.add(accIdx);
            deduplicatedAccessorVertices += primVertices;
          }
          if (Array.isArray(acc.min) && Array.isArray(acc.max)) {
            for (let axis = 0; axis < 3; axis++) {
              if (acc.min[axis] < overallMin[axis]) overallMin[axis] = acc.min[axis];
              if (acc.max[axis] > overallMax[axis]) overallMax[axis] = acc.max[axis];
            }
          }
        }
      }

      // Triangles / Indices
      let primTriangles = 0;
      if (typeof prim.indices === 'number') {
        usedAccessors.add(prim.indices);
        const idxAcc = accessors[prim.indices];
        if (idxAcc) {
          if (typeof idxAcc.bufferView === 'number') usedBufferViews.add(idxAcc.bufferView);
          const idxCount = idxAcc.count || 0;
          if (mode === 4) primTriangles = Math.floor(idxCount / 3);
          else if (mode === 5 || mode === 6) primTriangles = Math.max(0, idxCount - 2);
        }
      } else if (mode === 4 && primVertices > 0) {
        primTriangles = Math.floor(primVertices / 3);
      }

      // Draco extension check
      const dracoExt = prim.extensions?.KHR_draco_mesh_compression;
      if (dracoExt) {
        dracoCompressedPrimitives++;
        if (typeof dracoExt.bufferView === 'number') {
          usedBufferViews.add(dracoExt.bufferView);
          if (!dracoBufferViewsSeen.has(dracoExt.bufferView)) {
            dracoBufferViewsSeen.add(dracoExt.bufferView);
            dracoTotalCompressedBytes += bufferViews[dracoExt.bufferView]?.byteLength || 0;
          }
        }
      }

      uniquePrimitiveVerticesSum += primVertices;
      uniquePrimitiveTrianglesSum += primTriangles;

      if (instancesInScene > 0) {
        sceneEstimatedDrawCalls += instancesInScene;
        sceneInstantiatedVertices += primVertices * instancesInScene;
        sceneInstantiatedTriangles += primTriangles * instancesInScene;
      }
    }
  });

  // Track animations & skins accessors/bufferViews
  for (const anim of animations) {
    for (const s of anim.samplers || []) {
      if (typeof s.input === 'number') usedAccessors.add(s.input);
      if (typeof s.output === 'number') usedAccessors.add(s.output);
    }
  }
  for (const skin of skins) {
    if (typeof skin.inverseBindMatrices === 'number') usedAccessors.add(skin.inverseBindMatrices);
  }
  for (const accIdx of usedAccessors) {
    const acc = accessors[accIdx];
    if (acc && typeof acc.bufferView === 'number') usedBufferViews.add(acc.bufferView);
    if (acc?.sparse) {
      if (typeof acc.sparse.indices?.bufferView === 'number') usedBufferViews.add(acc.sparse.indices.bufferView);
      if (typeof acc.sparse.values?.bufferView === 'number') usedBufferViews.add(acc.sparse.values.bufferView);
    }
  }

  // Materials & Textures analysis
  const usedTextures = new Set();
  const materialDetails = materials.map((mat, idx) => {
    const texRefs = collectMaterialTextures(mat);
    for (const r of texRefs) usedTextures.add(r.index);

    const pbr = mat.pbrMetallicRoughness || {};
    return {
      index: idx,
      name: mat.name || `Material_${idx}`,
      usedByMesh: usedMaterials.has(idx),
      alphaMode: mat.alphaMode || 'OPAQUE',
      doubleSided: Boolean(mat.doubleSided),
      baseColorFactor: pbr.baseColorFactor || [1, 1, 1, 1],
      metallicFactor: pbr.metallicFactor ?? 1,
      roughnessFactor: pbr.roughnessFactor ?? 1,
      emissiveFactor: mat.emissiveFactor || [0, 0, 0],
      textureSlots: texRefs.map((r) => r.slot),
      extensions: mat.extensions ? Object.keys(mat.extensions) : [],
    };
  });

  // Duplicate material signature check
  const matSigGroups = new Map();
  materials.forEach((mat, idx) => {
    const clone = { ...mat };
    delete clone.name;
    const sig = JSON.stringify(clone);
    if (!matSigGroups.has(sig)) matSigGroups.set(sig, []);
    matSigGroups.get(sig).push(mat.name || `Material_${idx}`);
  });
  const duplicateMaterialGroups = Array.from(matSigGroups.values()).filter((g) => g.length > 1);

  // Samplers & Textures & Images
  const usedImages = new Set();
  const samplerDetails = samplers.map((s, idx) => {
    const minFilterName = s.minFilter ? FILTER_ENUM_NAMES[s.minFilter] || String(s.minFilter) : 'DEFAULT (LINEAR_MIPMAP_LINEAR)';
    const magFilterName = s.magFilter ? FILTER_ENUM_NAMES[s.magFilter] || String(s.magFilter) : 'DEFAULT (LINEAR)';
    const usesMipmaps =
      !s.minFilter || (s.minFilter >= 9984 && s.minFilter <= 9987);
    return {
      index: idx,
      magFilter: magFilterName,
      minFilter: minFilterName,
      usesMipmaps,
      wrapS: s.wrapS ? WRAP_ENUM_NAMES[s.wrapS] || String(s.wrapS) : 'REPEAT',
      wrapT: s.wrapT ? WRAP_ENUM_NAMES[s.wrapT] || String(s.wrapT) : 'REPEAT',
    };
  });

  textures.forEach((tex) => {
    if (typeof tex.source === 'number') usedImages.add(tex.source);
    const basisuSource = tex.extensions?.KHR_texture_basisu?.source;
    if (typeof basisuSource === 'number') usedImages.add(basisuSource);
    const webpSource = tex.extensions?.EXT_texture_webp?.source;
    if (typeof webpSource === 'number') usedImages.add(webpSource);
  });

  let totalEmbeddedImageBytes = 0;
  let estimatedGpuTextureVramBytes = 0;

  const imageDetails = images.map((img, idx) => {
    let byteLength = 0;
    let parsedHeader = { format: 'external_or_uri', width: null, height: null };

    if (typeof img.bufferView === 'number') {
      usedBufferViews.add(img.bufferView);
      const bv = bufferViews[img.bufferView];
      if (bv && binChunkBuf) {
        const start = bv.byteOffset || 0;
        byteLength = bv.byteLength || 0;
        totalEmbeddedImageBytes += byteLength;
        const slice = binChunkBuf.subarray(start, start + byteLength);
        parsedHeader = parseBinaryImageHeader(slice);
      }
    }

    // Estimate uncompressed RGBA8 VRAM + 1.33x mipmap chain
    let estimatedVramBytes = 0;
    if (parsedHeader.width && parsedHeader.height) {
      if (parsedHeader.format === 'image/ktx2') {
        // BasisU/BC7/ASTC ~1 byte per pixel + mipmaps
        estimatedVramBytes = Math.round(parsedHeader.width * parsedHeader.height * 1.333);
      } else {
        // Decoded to RGBA8 on GPU + mipmaps
        estimatedVramBytes = Math.round(parsedHeader.width * parsedHeader.height * 4 * 1.333);
      }
      estimatedGpuTextureVramBytes += estimatedVramBytes;
    }

    return {
      index: idx,
      name: img.name || `Image_${idx}`,
      usedByTexture: usedImages.has(idx),
      declaredMimeType: img.mimeType || null,
      detectedFormat: parsedHeader.format,
      width: parsedHeader.width,
      height: parsedHeader.height,
      byteLength,
      estimatedGpuVramBytes: estimatedVramBytes,
      hasExternalUri: Boolean(img.uri && !img.uri.startsWith('data:')),
    };
  });

  // Unused resource detection
  const unusedNodes = [];
  nodes.forEach((n, idx) => {
    if (!reachableNodes.has(idx)) unusedNodes.push(n.name || `Node_${idx}`);
  });

  const unusedMeshes = [];
  meshes.forEach((m, idx) => {
    if (!nodeInstanceMeshCounts.has(idx)) unusedMeshes.push(m.name || `Mesh_${idx}`);
  });

  const unusedMaterials = [];
  materials.forEach((m, idx) => {
    if (!usedMaterials.has(idx)) unusedMaterials.push(m.name || `Material_${idx}`);
  });

  const unusedTextures = [];
  textures.forEach((t, idx) => {
    if (!usedTextures.has(idx)) unusedTextures.push(t.name || `Texture_${idx}`);
  });

  const unusedImages = [];
  images.forEach((img, idx) => {
    if (!usedImages.has(idx)) unusedImages.push(img.name || `Image_${idx}`);
  });

  const unusedAccessorsCount = accessors.length - usedAccessors.size;
  const unusedBufferViewsCount = bufferViews.length - usedBufferViews.size;

  // Serialize attributeSummary sets
  const serializedAttributes = {};
  for (const [k, v] of Object.entries(attributeSummary)) {
    serializedAttributes[k] = {
      primitiveCount: v.primitiveCount,
      componentTypes: Array.from(v.componentTypes),
      types: Array.from(v.types),
    };
  }

  // Estimate GPU vertex + index buffer VRAM (uncompressed on GPU)
  let estimatedGpuGeometryVramBytes = 0;
  for (const accIdx of usedAccessors) {
    const acc = accessors[accIdx];
    if (!acc) continue;
    const compBytes = COMPONENT_BYTE_SIZES[acc.componentType] || 4;
    const elemCount = TYPE_COMPONENT_COUNTS[acc.type] || 1;
    estimatedGpuGeometryVramBytes += (acc.count || 0) * compBytes * elemCount;
  }

  const hasValidBounds = Number.isFinite(overallMin[0]) && Number.isFinite(overallMax[0]);

  return {
    file: relPath,
    fileSizeBytes: buf.length,
    fileSizeKB: Number((buf.length / 1024).toFixed(2)),
    fileSizeMB: Number((buf.length / (1024 * 1024)).toFixed(3)),
    gzipTransferBytes: gzipSize,
    gzipTransferKB: Number((gzipSize / 1024).toFixed(2)),
    validGlb: true,
    header: {
      magic: magicAscii,
      magicHex: `0x${magicUint32.toString(16).toUpperCase()}`,
      version,
      declaredByteLength: headerTotalLength,
      lengthMatchesDisk: headerTotalLength === buf.length,
      chunks,
      jsonChunkBytes: jsonChunkBuf.length,
      jsonChunkSpecCompliantPadding: !hasNullBytePadding,
      binChunkBytes: binChunkBuf ? binChunkBuf.length : 0,
    },
    assetMeta: gltf.asset || {},
    extensionsUsed: gltf.extensionsUsed || [],
    extensionsRequired: gltf.extensionsRequired || [],
    compressionFlags: {
      usesDraco: (gltf.extensionsUsed || []).includes('KHR_draco_mesh_compression') || dracoCompressedPrimitives > 0,
      dracoCompressedPrimitives,
      dracoTotalCompressedBytes,
      usesMeshopt: (gltf.extensionsUsed || []).includes('EXT_meshopt_compression'),
      usesMeshQuantization: (gltf.extensionsUsed || []).includes('KHR_mesh_quantization'),
      usesKtx2BasisU: (gltf.extensionsUsed || []).includes('KHR_texture_basisu'),
      usesWebPTextures:
        (gltf.extensionsUsed || []).includes('EXT_texture_webp') ||
        imageDetails.some((i) => i.detectedFormat === 'image/webp'),
    },
    counts: {
      scenes: scenes.length,
      nodes: nodes.length,
      reachableNodes: reachableNodes.size,
      meshes: meshes.length,
      uniquePrimitives: uniquePrimitiveCount,
      sceneInstantiatedMeshNodes,
      estimatedUnbatchedDrawCalls: sceneEstimatedDrawCalls,
      materials: materials.length,
      textures: textures.length,
      samplers: samplers.length,
      images: images.length,
      accessors: accessors.length,
      bufferViews: bufferViews.length,
      buffers: buffers.length,
      animations: animations.length,
      skins: skins.length,
      cameras: cameras.length,
      punctualLights: punctualLights.length,
    },
    geometry: {
      uniquePrimitiveVertices: uniquePrimitiveVerticesSum,
      deduplicatedAccessorVertices,
      uniquePrimitiveTriangles: uniquePrimitiveTrianglesSum,
      sceneInstantiatedVertices,
      sceneInstantiatedTriangles,
      attributes: serializedAttributes,
      localAccessorBounds: hasValidBounds
        ? {
            min: overallMin.map((v) => Number(v.toFixed(5))),
            max: overallMax.map((v) => Number(v.toFixed(5))),
            size: [
              Number((overallMax[0] - overallMin[0]).toFixed(5)),
              Number((overallMax[1] - overallMin[1]).toFixed(5)),
              Number((overallMax[2] - overallMin[2]).toFixed(5)),
            ],
          }
        : null,
    },
    memoryEstimates: {
      totalEmbeddedImageBytes,
      estimatedGpuTextureVramBytes,
      estimatedGpuTextureVramMB: Number((estimatedGpuTextureVramBytes / (1024 * 1024)).toFixed(3)),
      estimatedGpuGeometryVramBytes,
      estimatedGpuGeometryVramMB: Number((estimatedGpuGeometryVramBytes / (1024 * 1024)).toFixed(3)),
      totalEstimatedGpuVramMB: Number(
        ((estimatedGpuTextureVramBytes + estimatedGpuGeometryVramBytes) / (1024 * 1024)).toFixed(3)
      ),
    },
    unusedOrRedundant: {
      unusedNodesCount: unusedNodes.length,
      unusedNodes: unusedNodes.slice(0, 25),
      unusedMeshesCount: unusedMeshes.length,
      unusedMeshes: unusedMeshes.slice(0, 25),
      unusedMaterialsCount: unusedMaterials.length,
      unusedMaterials,
      unusedTexturesCount: unusedTextures.length,
      unusedImagesCount: unusedImages.length,
      unusedAccessorsCount,
      unusedBufferViewsCount,
      duplicateMaterialGroupCount: duplicateMaterialGroups.length,
      duplicateMaterialGroups: duplicateMaterialGroups.slice(0, 15),
    },
    materials: materialDetails,
    samplers: samplerDetails,
    images: imageDetails,
  };
}

/**
 * Audit a Radiance RGBE (.hdr) file on disk.
 */
function auditHdrFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const gzipSize = zlib.gzipSync(buf, { level: 6 }).length;
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');

  // Read ASCII header up to resolution line (e.g. "-Y 512 +X 1024\n")
  const maxHeaderScan = Math.min(buf.length, 4096);
  const asciiHead = buf.toString('ascii', 0, maxHeaderScan);
  const lines = asciiHead.split(/\r?\n/);

  const magic = lines[0] || '';
  let format = null;
  let exposure = 1.0;
  let width = null;
  let height = null;
  let resolutionLine = null;

  for (const line of lines) {
    if (line.startsWith('FORMAT=')) {
      format = line.slice('FORMAT='.length).trim();
    } else if (line.startsWith('EXPOSURE=')) {
      exposure = parseFloat(line.slice('EXPOSURE='.length).trim());
    } else if (/^[+-]Y\s+\d+\s+[+-]X\s+\d+/.test(line)) {
      resolutionLine = line.trim();
      const match = line.match(/[+-]Y\s+(\d+)\s+[+-]X\s+(\d+)/);
      if (match) {
        height = parseInt(match[1], 10);
        width = parseInt(match[2], 10);
      }
      break;
    }
  }

  const texels = width && height ? width * height : 0;
  // HalfFloat RGBA16F GPU texture + PMREM cubemap mipmap overhead (~8 bytes/texel * 1.33)
  const estimatedGpuFloat16VramBytes = Math.round(texels * 8 * 1.333);

  return {
    file: relPath,
    fileSizeBytes: buf.length,
    fileSizeKB: Number((buf.length / 1024).toFixed(2)),
    fileSizeMB: Number((buf.length / (1024 * 1024)).toFixed(3)),
    gzipTransferBytes: gzipSize,
    gzipTransferKB: Number((gzipSize / 1024).toFixed(2)),
    magic,
    format,
    exposure,
    resolutionLine,
    width,
    height,
    texelCount: texels,
    decodedRgbeBufferBytes: texels * 4,
    estimatedGpuHalfFloatVramBytes: estimatedGpuFloat16VramBytes,
    estimatedGpuHalfFloatVramMB: Number((estimatedGpuFloat16VramBytes / (1024 * 1024)).toFixed(3)),
  };
}

/**
 * Audit USDZ / USDA files if any exist.
 */
function auditUsdzOrUsdaFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const gzipSize = zlib.gzipSync(buf, { level: 6 }).length;
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
  const ext = path.extname(filePath).toLowerCase();

  // USDZ is an uncompressed 64-byte-aligned ZIP archive starting with PK\x03\x04 (0x04034B50)
  const isZipMagic =
    buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
  const isUsdaAscii = buf.toString('ascii', 0, Math.min(32, buf.length)).startsWith('#usda');

  // Parse ZIP local file headers if USDZ
  const entries = [];
  if (isZipMagic) {
    let offset = 0;
    while (offset + 30 <= buf.length && buf.readUInt32LE(offset) === 0x04034b50) {
      const compressionMethod = buf.readUInt16LE(offset + 8);
      const compressedSize = buf.readUInt32LE(offset + 18);
      const uncompressedSize = buf.readUInt32LE(offset + 22);
      const fileNameLen = buf.readUInt16LE(offset + 26);
      const extraLen = buf.readUInt16LE(offset + 28);
      const name = buf.toString('utf8', offset + 30, offset + 30 + fileNameLen);
      const dataOffset = offset + 30 + fileNameLen + extraLen;
      entries.push({
        name,
        compressionMethod,
        uncompressedStore: compressionMethod === 0,
        dataOffset,
        aligned64Bytes: dataOffset % 64 === 0,
        byteLength: compressedSize,
        uncompressedSize,
      });
      offset = dataOffset + compressedSize;
    }
  }

  return {
    file: relPath,
    extension: ext,
    fileSizeBytes: buf.length,
    fileSizeKB: Number((buf.length / 1024).toFixed(2)),
    gzipTransferBytes: gzipSize,
    validZipContainer: isZipMagic,
    validUsdaAscii: isUsdaAscii,
    usdzSpecCompliant:
      ext === '.usdz'
        ? isZipMagic &&
          entries.length > 0 &&
          entries.every((e) => e.uncompressedStore && e.aligned64Bytes)
        : isUsdaAscii,
    entries,
  };
}

/**
 * Audit Draco decoder files in public/draco.
 */
function auditDecoderFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const gzipSize = zlib.gzipSync(buf, { level: 6 }).length;
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
  const ext = path.extname(filePath).toLowerCase();

  let validWasmMagic = null;
  if (ext === '.wasm' && buf.length >= 8) {
    validWasmMagic =
      buf[0] === 0x00 && buf[1] === 0x61 && buf[2] === 0x73 && buf[3] === 0x6d;
  }

  return {
    file: relPath,
    extension: ext,
    fileSizeBytes: buf.length,
    fileSizeKB: Number((buf.length / 1024).toFixed(2)),
    gzipTransferBytes: gzipSize,
    gzipTransferKB: Number((gzipSize / 1024).toFixed(2)),
    validWasmMagic,
  };
}

/**
 * Recursively list files under a directory.
 */
function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results.sort();
}

function main() {
  const modelsDir = path.join(ROOT_DIR, 'public', 'models');
  const texturesDir = path.join(ROOT_DIR, 'public', 'textures');
  const dracoDir = path.join(ROOT_DIR, 'public', 'draco');

  const allModelFiles = walkFiles(modelsDir);
  const glbFiles = allModelFiles.filter((f) => f.toLowerCase().endsWith('.glb'));
  const usdFiles = allModelFiles.filter((f) => {
    const l = f.toLowerCase();
    return l.endsWith('.usdz') || l.endsWith('.usda');
  });

  const allTextureFiles = walkFiles(texturesDir);
  const hdrFiles = allTextureFiles.filter((f) => f.toLowerCase().endsWith('.hdr'));

  const dracoFiles = walkFiles(dracoDir);

  const glbAudits = glbFiles.map(auditGlbFile);
  const usdAudits = usdFiles.map(auditUsdzOrUsdaFile);
  const hdrAudits = hdrFiles.map(auditHdrFile);
  const decoderAudits = dracoFiles.map(auditDecoderFile);

  // Separate primary/legacy public/models/*.glb from public/models/optimized/*
  const sourceModels = glbAudits.filter((a) => !a.file.startsWith('public/models/optimized/'));
  const optimizedDerivativeModels = glbAudits.filter((a) =>
    a.file.startsWith('public/models/optimized/')
  );

  // HDR comparison
  const origHdr = hdrAudits.find((h) => h.file === 'public/textures/forest_env.hdr');
  const optHdr = hdrAudits.find((h) => h.file === 'public/textures/forest_env.optimized.hdr');
  const hdrComparison =
    origHdr && optHdr
      ? {
          originalFile: origHdr.file,
          optimizedFile: optHdr.file,
          originalBytes: origHdr.fileSizeBytes,
          optimizedBytes: optHdr.fileSizeBytes,
          byteReductionPct: Number(
            (((origHdr.fileSizeBytes - optHdr.fileSizeBytes) / origHdr.fileSizeBytes) * 100).toFixed(2)
          ),
          originalDimensions: `${origHdr.width}x${origHdr.height}`,
          optimizedDimensions: `${optHdr.width}x${optHdr.height}`,
          texelReductionPct: Number(
            (((origHdr.texelCount - optHdr.texelCount) / origHdr.texelCount) * 100).toFixed(2)
          ),
        }
      : null;

  const report = {
    auditTimestamp: new Date().toISOString(),
    projectRoot: ROOT_DIR,
    summary: {
      totalGlbFiles: glbAudits.length,
      sourceGlbCount: sourceModels.length,
      optimizedDerivativeGlbCount: optimizedDerivativeModels.length,
      totalUsdzFiles: usdAudits.length,
      totalHdrFiles: hdrAudits.length,
      totalDecoderFiles: decoderAudits.length,
      sourceModelsTotalBytes: sourceModels.reduce((acc, m) => acc + m.fileSizeBytes, 0),
      optimizedDerivativesTotalBytes: optimizedDerivativeModels.reduce(
        (acc, m) => acc + m.fileSizeBytes,
        0
      ),
      dracoWasmPairTransferKB: Number(
        decoderAudits
          .filter((d) => d.file.endsWith('.wasm') || d.file.endsWith('wrapper.js'))
          .reduce((acc, d) => acc + d.gzipTransferKB, 0)
          .toFixed(2)
      ),
    },
    hdrComparison,
    decoders: decoderAudits,
    environmentMaps: hdrAudits,
    sourceModels,
    optimizedDerivativeModels,
    usdAssets: usdAudits,
  };

  fs.mkdirSync(path.dirname(DEFAULT_OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(DEFAULT_OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log(`=== 3D Asset Binary Audit Complete ===`);
  console.log(`Saved audit JSON -> ${DEFAULT_OUTPUT_PATH}`);
  console.log(`\nSource GLB Models (${sourceModels.length}):`);
  for (const m of sourceModels) {
    console.log(
      `  - ${m.file}: ${m.fileSizeKB} KB (gzip: ${m.gzipTransferKB} KB) | nodes=${m.counts?.nodes} meshes=${m.counts?.meshes} sceneDrawCalls=${m.counts?.estimatedUnbatchedDrawCalls} uniqueTris=${m.geometry?.uniquePrimitiveTriangles} sceneTris=${m.geometry?.sceneInstantiatedTriangles} mats=${m.counts?.materials} imgs=${m.counts?.images} draco=${m.compressionFlags?.usesDraco}`
    );
  }
  if (optimizedDerivativeModels.length > 0) {
    console.log(`\nOptimized Derivative GLB Models (${optimizedDerivativeModels.length}):`);
    for (const m of optimizedDerivativeModels) {
      console.log(
        `  - ${m.file}: ${m.fileSizeKB} KB (gzip: ${m.gzipTransferKB} KB) | nodes=${m.counts?.nodes} meshes=${m.counts?.meshes} sceneDrawCalls=${m.counts?.estimatedUnbatchedDrawCalls} uniqueTris=${m.geometry?.uniquePrimitiveTriangles} sceneTris=${m.geometry?.sceneInstantiatedTriangles} mats=${m.counts?.materials} imgs=${m.counts?.images} draco=${m.compressionFlags?.usesDraco}`
      );
    }
  }
  if (usdAudits.length > 0) {
    console.log(`\nUSDZ/USDA Assets (${usdAudits.length}):`);
    for (const u of usdAudits) {
      console.log(
        `  - ${u.file}: ${u.fileSizeKB} KB | specCompliant=${u.usdzSpecCompliant} entries=${u.entries.length}`
      );
    }
  }
  console.log(`\nHDR Environment Maps (${hdrAudits.length}):`);
  for (const h of hdrAudits) {
    console.log(`  - ${h.file}: ${h.fileSizeKB} KB | ${h.width}x${h.height} (${h.format})`);
  }
  console.log(`\nDraco Decoders (${decoderAudits.length}):`);
  for (const d of decoderAudits) {
    console.log(
      `  - ${d.file}: ${d.fileSizeKB} KB (gzip: ${d.gzipTransferKB} KB) | wasmMagic=${d.validWasmMagic}`
    );
  }
}

main();
