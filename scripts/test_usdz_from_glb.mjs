import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';

// Setup DRACOLoader for Node.js
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('public/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const glbBuf = fs.readFileSync('public/models/optimized/golden-oak-burger-master.glb');
const ab = glbBuf.buffer.slice(glbBuf.byteOffset, glbBuf.byteOffset + glbBuf.byteLength);

loader.parse(ab, '', async (gltf) => {
  console.log('GLTF loaded successfully! Scene children:', gltf.scene.children.length);
  const exporter = new USDZExporter();
  try {
    const usdzArrayBuf = await exporter.parseAsync(gltf.scene, {
      quickLookCompatible: true,
      includeAnchoringProperties: true,
      ar: {
        anchoring: { type: 'plane' },
        planeAnchoring: { alignment: 'horizontal' },
      },
    });
    const outUsdz = 'public/models/optimized/test_usdz_from_glb.usdz';
    fs.writeFileSync(outUsdz, Buffer.from(usdzArrayBuf));
    console.log(`Exported USDZ to ${outUsdz}, size=${fs.statSync(outUsdz).size} bytes`);
  } catch (err) {
    console.error('USDZExporter error:', err);
  }
}, (err) => console.error('GLTF parse error:', err));
