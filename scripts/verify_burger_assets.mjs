import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import draco3d from 'draco3d';

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
  console.log(`USDZ OK: ${diskPath} (${entryCount} entries, 64-byte aligned)`);
}

async function verifyAll() {
  const decoderModule = await draco3d.createDecoderModule({});
  const glbFiles = [
    'public/models/optimized/golden-oak-burger-high.glb',
    'public/models/optimized/golden-oak-burger-balanced.glb',
    'public/models/optimized/golden-oak-burger-ultralight.glb',
    'public/models/optimized/golden-oak-burger-realistic-high.glb',
    'public/models/optimized/golden-oak-burger-realistic-balanced.glb',
    'public/models/optimized/golden-oak-burger-realistic-ultralight.glb',
  ];

  for (const f of glbFiles) {
    const buf = fs.readFileSync(f);
    assert.equal(buf.readUInt32LE(0), 0x46546c67, `GLB magic error in ${f}`);
    const jsonLen = buf.readUInt32LE(12);
    const jsonRaw = buf.subarray(20, 20 + jsonLen);

    // Check padding: must not end with null byte
    let hasNullPad = false;
    for (let i = jsonRaw.length - 1; i >= 0; i--) {
      if (jsonRaw[i] === 0x00) { hasNullPad = true; break; }
      if (jsonRaw[i] === 0x20) continue;
      break;
    }
    assert.equal(hasNullPad, false, `Must have 0x20 space padding in ${f}`);

    const gltf = JSON.parse(jsonRaw.toString('utf8').trimEnd());
    assert.ok((gltf.extensionsUsed || []).includes('KHR_draco_mesh_compression'));

    const binChunk = buf.subarray(20 + jsonLen + 8);
    for (const mesh of gltf.meshes) {
      for (const prim of mesh.primitives) {
        const ext = prim.extensions?.KHR_draco_mesh_compression;
        assert.ok(ext);
        const bv = gltf.bufferViews[ext.bufferView];
        const slice = binChunk.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);

        const decoder = new decoderModule.Decoder();
        const decBuf = new decoderModule.DecoderBuffer();
        decBuf.Init(new Int8Array(slice), slice.length);
        const dracoMesh = new decoderModule.Mesh();
        const status = decoder.DecodeBufferToMesh(decBuf, dracoMesh);
        assert.equal(status.ok(), true);
        assert.ok(dracoMesh.num_points() > 0);
        assert.ok(dracoMesh.num_faces() > 0);

        decoderModule.destroy(dracoMesh);
        decoderModule.destroy(decBuf);
        decoderModule.destroy(decoder);
      }
    }
    console.log(`GLB OK: ${f} (${(buf.length / 1024).toFixed(1)} KB, Draco valid, 0x20 pad)`);
  }

  verifyUsdzArchive('public/models/optimized/golden-oak-burger.usdz');
  verifyUsdzArchive('public/models/optimized/golden-oak-burger-realistic.usdz');
}

verifyAll().then(() => console.log('ALL VERIFICATIONS PASSED!')).catch(console.error);
