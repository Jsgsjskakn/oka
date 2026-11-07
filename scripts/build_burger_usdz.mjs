import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OPTIMIZED_DIR = path.join(ROOT_DIR, 'public', 'models', 'optimized');

// Read the balanced GLB to get the mesh primitives and vertex positions
import draco3d from 'draco3d';

async function generateBurgerUsdz() {
  const decoderModule = await draco3d.createDecoderModule({});
  
  const glbPath = path.join(OPTIMIZED_DIR, 'golden-oak-burger-balanced.glb');
  const buf = fs.readFileSync(glbPath);
  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
  const gltf = JSON.parse(jsonStr.trimEnd());
  const binChunk = buf.subarray(20 + jsonLen + 8);

  const scene = new THREE.Scene();

  // Vibrant food PBR material definitions matching real burger
  const MAT_MAP = [
    // bun_001 (Brioche Bun + flame-grilled patty): warm golden-brown brioche glaze
    new THREE.MeshStandardMaterial({
      name: 'BriocheBun_Patty_Mat',
      color: new THREE.Color(0.85, 0.52, 0.22),
      roughness: 0.35,
      metalness: 0.02,
    }),
    // lettuce_001: fresh crisp emerald ruffled leaf
    new THREE.MeshStandardMaterial({
      name: 'FreshLettuce_Mat',
      color: new THREE.Color(0.32, 0.72, 0.18),
      roughness: 0.28,
      metalness: 0.05,
    }),
    // vegies_001: ripe vine tomato red / pickles / cheddar
    new THREE.MeshStandardMaterial({
      name: 'GourmetToppings_Mat',
      color: new THREE.Color(0.88, 0.22, 0.15),
      roughness: 0.40,
      metalness: 0.08,
    }),
  ];

  for (let mIdx = 0; mIdx < gltf.meshes.length; mIdx++) {
    const meshDef = gltf.meshes[mIdx];
    for (const prim of meshDef.primitives) {
      const dracoExt = prim.extensions?.KHR_draco_mesh_compression;
      if (!dracoExt) continue;
      const bv = gltf.bufferViews[dracoExt.bufferView];
      const slice = binChunk.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);

      const decoder = new decoderModule.Decoder();
      const decBuf = new decoderModule.DecoderBuffer();
      decBuf.Init(new Int8Array(slice), slice.length);
      const dracoMesh = new decoderModule.Mesh();
      const status = decoder.DecodeBufferToMesh(decBuf, dracoMesh);

      if (!status.ok()) {
        console.error(`Failed to decode draco mesh ${mIdx}`);
        continue;
      }

      const numPoints = dracoMesh.num_points();
      const numFaces = dracoMesh.num_faces();

      // Extract positions
      const posAttrId = dracoExt.attributes.POSITION;
      const posAttr = decoder.GetAttribute(dracoMesh, posAttrId);
      const posArray = new Float32Array(numPoints * 3);
      decoder.GetAttributeFloatForAllPoints(dracoMesh, posAttr, posArray);

      // Extract normals
      const normAttrId = dracoExt.attributes.NORMAL;
      const normAttr = decoder.GetAttribute(dracoMesh, normAttrId);
      const normArray = new Float32Array(numPoints * 3);
      decoder.GetAttributeFloatForAllPoints(dracoMesh, normAttr, normArray);

      // Extract indices
      const indices = new Uint32Array(numFaces * 3);
      const ia = new decoderModule.DracoInt32Array();
      for (let i = 0; i < numFaces; i++) {
        decoder.GetFaceFromMesh(dracoMesh, i, ia);
        indices[i * 3] = ia.GetValue(0);
        indices[i * 3 + 1] = ia.GetValue(1);
        indices[i * 3 + 2] = ia.GetValue(2);
      }
      decoderModule.destroy(ia);

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      geom.setAttribute('normal', new THREE.BufferAttribute(normArray, 3));
      geom.setIndex(new THREE.BufferAttribute(indices, 1));

      const matIndex = prim.material ?? 0;
      const mat = MAT_MAP[matIndex] || MAT_MAP[0];
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = meshDef.name || `BurgerPart_${mIdx}`;
      scene.add(mesh);

      decoderModule.destroy(dracoMesh);
      decoderModule.destroy(decBuf);
      decoderModule.destroy(decoder);
    }
  }

  scene.updateMatrixWorld(true);

  const exporter = new USDZExporter();
  const arrayBuf = await exporter.parseAsync(scene, {
    quickLookCompatible: true,
    includeAnchoringProperties: true,
    ar: {
      anchoring: { type: 'plane' },
      planeAnchoring: { alignment: 'horizontal' },
    },
  });

  const outBuf = Buffer.from(arrayBuf);
  const usdzTargets = ['golden-oak-burger.usdz', 'golden-oak-burger-realistic.usdz'];
  for (const name of usdzTargets) {
    const p = path.join(OPTIMIZED_DIR, name);
    fs.writeFileSync(p, outBuf);
    console.log(`Exported USDZ: ${name} (${(outBuf.length / 1024).toFixed(2)} KB)`);
  }
}

generateBurgerUsdz().catch(console.error);
