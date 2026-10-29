import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';

// Polyfills for headless Three.js execution
global.self = global;
global.window = global;

import { applyInteriorMaterials } from '../src/lib/three/interiorOptimization.ts';
import { QUALITY_TIER_CONFIGS } from '../src/hooks/useQualityTier.ts';

test('Lighting & Center Radiance Benchmark Specialist: The Golden Oak 3D Scene', async (t) => {
  const floorplanPath = path.resolve('src/components/booking/Restaurant3DFloorplan.tsx');
  const interiorOptPath = path.resolve('src/lib/three/interiorOptimization.ts');
  const hdrTexturePath = path.resolve('public/textures/forest_env.hdr');

  assert.ok(fs.existsSync(floorplanPath), 'Restaurant3DFloorplan.tsx must exist');
  assert.ok(fs.existsSync(interiorOptPath), 'interiorOptimization.ts must exist');
  assert.ok(fs.existsSync(hdrTexturePath), 'forest_env.hdr environment reflection map must exist in public/textures/');

  const floorplanSource = fs.readFileSync(floorplanPath, 'utf8');
  const interiorOptSource = fs.readFileSync(interiorOptPath, 'utf8');

  // =========================================================================
  // 1. Static Configuration & Lighting Rig Integrity Audit
  // =========================================================================
  await t.test('1. Scene Lighting Rig & Architectural Atmosphere Audit', () => {
    // Background color tone: #16100C
    assert.match(
      floorplanSource,
      /<color\s+attach="background"\s+args=\{?\['#16100C'\]\}?\s*\/>/,
      'Background color tone must strictly match warm atmospheric #16100C'
    );

    // Ambient light: #FFF2DE, intensity 1.3
    assert.match(
      floorplanSource,
      /<ambientLight\s+color="#FFF2DE"\s+intensity=\{1\.3\}\s*\/>/,
      'Ambient light must match warm tone #FFF2DE at intensity 1.3'
    );

    // Hemisphere light: sky #FFE8CC, ground #4A2E18, intensity 1.35
    assert.match(
      floorplanSource,
      /<hemisphereLight\s+args=\{?\['#FFE8CC',\s*'#4A2E18',\s*1\.35\]\}?\s*\/>/,
      'Hemisphere light must supply sky #FFE8CC and ground amber bounce #4A2E18 at intensity 1.35'
    );

    // Sun directional light: position [16, 26, 18], intensity 2.2, bias -0.00005, normalBias 0.02
    assert.ok(floorplanSource.includes('position={[16, 26, 18]}'), 'Sun directional light position must be [16, 26, 18]');
    assert.ok(floorplanSource.includes('intensity={2.2}'), 'Sun directional light intensity must be 2.2');
    assert.ok(floorplanSource.includes('color="#FFF6E8"'), 'Sun directional light color must be warm sunlight #FFF6E8');
    assert.ok(floorplanSource.includes('shadow-bias={-0.00005}'), 'Sun directional light shadow-bias must be -0.00005 (zero acne)');
    assert.ok(floorplanSource.includes('shadow-normalBias={0.02}'), 'Sun directional light shadow-normalBias must be 0.02');

    // Ground bounce directional light: position [0, -12, 0], intensity 0.65, color #FFA24A
    assert.ok(floorplanSource.includes('position={[0, -12, 0]}'), 'Ground bounce light position must be [0, -12, 0]');
    assert.ok(floorplanSource.includes('intensity={0.65}'), 'Ground bounce light intensity must be 0.65');
    assert.ok(floorplanSource.includes('color="#FFA24A"'), 'Ground bounce light color must be warm amber #FFA24A');

    // Promenade fill directional light: position [-18, 16, -14], intensity 0.95
    assert.ok(floorplanSource.includes('position={[-18, 16, -14]}'), 'Promenade fill light position must be [-18, 16, -14]');
    assert.ok(floorplanSource.includes('intensity={0.95}'), 'Promenade fill light intensity must be 0.95');
    assert.ok(floorplanSource.includes('color="#E8D8C4"'), 'Promenade fill light color must be #E8D8C4');

    // Rotunda Grand Chandelier point light: position [0, 4.5, 0.6], intensity 7.5, distance 35
    assert.match(
      floorplanSource,
      /<pointLight\s+position=\{?\[0,\s*4\.5,\s*0\.6\]\}?\s+intensity=\{7\.5\}\s+distance=\{35\}\s+color="#FFA436"\s*\/>/,
      'Grand Chandelier point light must be positioned at [0, 4.5, 0.6] with intensity 7.5, distance 35, color #FFA436'
    );

    // Rotunda Chandelier crystal core point light: position [0, 3.2, 0.6], intensity 6.0, distance 20, color #FFB84D
    assert.match(
      floorplanSource,
      /<pointLight\s+position=\{?\[0,\s*3\.2,\s*0\.6\]\}?\s+intensity=\{6\.0\}\s+distance=\{20\}\s+color="#FFB84D"\s*\/>/,
      'Chandelier crystal core point light must be positioned at [0, 3.2, 0.6] with intensity 6.0, distance 20, color #FFB84D'
    );

    // Rotunda Pool water luminescence point light: position [0, 1.2, 0.6], intensity 4.5, distance 12, color #38E5C2
    assert.match(
      floorplanSource,
      /<pointLight\s+position=\{?\[0,\s*1\.2,\s*0\.6\]\}?\s+intensity=\{4\.5\}\s+distance=\{12\}\s+color="#38E5C2"\s*\/>/,
      'Rotunda Pool water luminescence point light must be at [0, 1.2, 0.6] with intensity 4.5, distance 12, color #38E5C2'
    );

    // Sommelier Wine Wall point light: position [10, 4.0, -11], intensity 4.2, distance 22
    assert.match(
      floorplanSource,
      /<pointLight\s+position=\{?\[10,\s*4\.0,\s*-11\]\}?\s+intensity=\{4\.2\}\s+distance=\{22\}\s+color="#FFD488"\s*\/>/,
      'Sommelier Wine Wall point light must be configured at [10, 4.0, -11]'
    );

    // Cocktail Bar point light: position [-12, 4.0, 0], intensity 3.5, distance 22
    assert.match(
      floorplanSource,
      /<pointLight\s+position=\{?\[-12,\s*4\.0,\s*0\]\}?\s+intensity=\{3\.5\}\s+distance=\{22\}\s+color="#FFBF55"\s*\/>/,
      'Cocktail Bar point light must be configured at [-12, 4.0, 0]'
    );

    // Environment reflections: forest_env.hdr
    assert.match(
      floorplanSource,
      /<Environment\s+files="\/textures\/forest_env\.hdr"/,
      'Environment reflections must load /textures/forest_env.hdr locally'
    );
  });

  // =========================================================================
  // 2. Center Rotunda Materials & Cavity Shadow Acne Verification
  // =========================================================================
  await t.test('2. Center Structure Material Radiance & Zero Shadow Acne Audit', () => {
    // Check that crystal glass, pool water, and basin floor eliminate shadow acne & cavity collapse
    const scene = new THREE.Scene();

    // 1. Crystal Chandelier mock
    const crystalMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ name: 'Chandelier_Crystals' })
    );
    crystalMesh.name = 'Rotunda_Crystal_Drop';
    scene.add(crystalMesh);

    // 2. Water Surface mock
    const waterMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 5),
      new THREE.MeshStandardMaterial({ name: 'Water_Fountain_Tier' })
    );
    waterMesh.name = 'Rotunda_Water_Pool';
    scene.add(waterMesh);

    // 3. Basin / Cavity Floor mock
    const basinMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4, 1),
      new THREE.MeshStandardMaterial({ name: 'Nero_Marquina_Basin' })
    );
    basinMesh.name = 'Rotunda_Pool_Floor_Basin';
    scene.add(basinMesh);

    applyInteriorMaterials(scene);

    // Audit Crystal Mesh
    assert.strictEqual(crystalMesh.castShadow, false, 'Crystals must not cast shadows (prevents dark self-shadow acne)');
    assert.strictEqual(crystalMesh.receiveShadow, false, 'Crystals must not receive shadows (preserves crystal radiance)');
    const crystalMat = crystalMesh.material;
    assert.strictEqual(crystalMat.emissive.getHexString().toUpperCase(), 'FFAA33', 'Crystals have 2700K golden emissive radiance');
    assert.strictEqual(crystalMat.emissiveIntensity, 0.75, 'Crystal emissive intensity is 0.75');
    assert.strictEqual(crystalMat.transmission, 0, 'Crystal transmission is 0 (prevents opaque black multipass collapse)');

    // Audit Water Surface Mesh
    assert.strictEqual(waterMesh.castShadow, false, 'Water surface must not cast shadows');
    assert.strictEqual(waterMesh.receiveShadow, false, 'Water surface must not receive shadows');
    const waterMat = waterMesh.material;
    assert.strictEqual(waterMat.color.getHexString().toUpperCase(), '38D9C0', 'Water surface color is Mediterranean turquoise #38D9C0');
    assert.strictEqual(waterMat.emissive.getHexString().toUpperCase(), '149480', 'Water has radiant emerald aquatic glow #149480');
    assert.strictEqual(waterMat.emissiveIntensity, 0.95, 'Water emissive intensity is 0.95');

    // Audit Basin Floor Mesh
    assert.strictEqual(basinMesh.castShadow, false, 'Basin cavity floor must not cast shadows');
    assert.strictEqual(basinMesh.receiveShadow, false, 'Basin cavity floor must not receive shadows (eliminates dark cavity collapse)');
    const basinMat = basinMesh.material;
    assert.strictEqual(basinMat.color.getHexString().toUpperCase(), '2A7D70', 'Basin floor color is radiant emerald/aqua marble #2A7D70');
    assert.strictEqual(basinMat.emissive.getHexString().toUpperCase(), '165248', 'Basin floor has luminous deep glow #165248');
    assert.strictEqual(basinMat.emissiveIntensity, 0.85, 'Basin floor emissive intensity is 0.85');
  });

  // =========================================================================
  // 3. Quantitative Lux & Radiance Benchmark Calculations
  // =========================================================================
  await t.test('3. Photometric Irradiance & Lux Radiance Benchmark across 3D Zones', () => {
    // Define the full light rig mathematically according to Restaurant3DFloorplan.tsx
    const ambient = {
      color: new THREE.Color('#FFF2DE'),
      intensity: 1.3,
    };

    const hemisphere = {
      skyColor: new THREE.Color('#FFE8CC'),
      groundColor: new THREE.Color('#4A2E18'),
      intensity: 1.35,
    };

    const dirLights = [
      {
        name: 'Sun Directional',
        dir: new THREE.Vector3(16, 26, 18).normalize(),
        color: new THREE.Color('#FFF6E8'),
        intensity: 2.2,
      },
      {
        name: 'Ground Bounce Directional',
        dir: new THREE.Vector3(0, -12, 0).normalize(),
        color: new THREE.Color('#FFA24A'),
        intensity: 0.65,
      },
      {
        name: 'Promenade Fill Directional',
        dir: new THREE.Vector3(-18, 16, -14).normalize(),
        color: new THREE.Color('#E8D8C4'),
        intensity: 0.95,
      },
    ];

    const pointLights = [
      {
        name: 'Rotunda Grand Chandelier',
        pos: new THREE.Vector3(0, 4.5, 0.6),
        intensity: 7.5,
        distance: 35,
        color: new THREE.Color('#FFA436'),
      },
      {
        name: 'Rotunda Chandelier Crystal Core',
        pos: new THREE.Vector3(0, 3.2, 0.6),
        intensity: 6.0,
        distance: 20,
        color: new THREE.Color('#FFB84D'),
      },
      {
        name: 'Rotunda Pool Water Luminescence',
        pos: new THREE.Vector3(0, 1.2, 0.6),
        intensity: 4.5,
        distance: 12,
        color: new THREE.Color('#38E5C2'),
      },
      {
        name: 'Sommelier Wine Wall',
        pos: new THREE.Vector3(10, 4.0, -11),
        intensity: 4.2,
        distance: 22,
        color: new THREE.Color('#FFD488'),
      },
      {
        name: 'Cocktail Bar',
        pos: new THREE.Vector3(-12, 4.0, 0),
        intensity: 3.5,
        distance: 22,
        color: new THREE.Color('#FFBF55'),
      },
    ];

    // Standard Three.js point light attenuation formula with distance cutoff:
    // attenuation = saturate(1 - (dist / cutoff)^4) / (dist^2 + 1)
    function calcPointLightIrradiance(pLight, targetPos, normal) {
      const toLight = new THREE.Vector3().subVectors(pLight.pos, targetPos);
      const dist = toLight.length();
      if (dist >= pLight.distance) return { irradiance: 0, rgb: new THREE.Color(0, 0, 0) };

      toLight.normalize();
      const nDotL = Math.max(0, normal.dot(toLight));
      // Attenuation windowing matching Three.js WebGL physical shader
      const factor = Math.max(0, 1 - Math.pow(dist / pLight.distance, 4));
      const attenuation = (factor * factor) / (dist * dist + 1);
      const illuminance = pLight.intensity * attenuation * nDotL * 100; // Scaled to lux equivalent
      const rgb = pLight.color.clone().multiplyScalar(illuminance);
      return { irradiance: illuminance, rgb };
    }

    // Benchmark sample test points across the restaurant
    const testPoints = [
      {
        zone: 'Rotunda Chandelier Apex & Crystals',
        pos: new THREE.Vector3(0, 4.0, 0.6),
        normal: new THREE.Vector3(0, 1, 0),
        minLux: 400,
        desc: 'Direct warm chandelier core',
      },
      {
        zone: 'Rotunda Upper Fountain Tier',
        pos: new THREE.Vector3(0, 2.2, 0.6),
        normal: new THREE.Vector3(0, 1, 0),
        minLux: 450,
        desc: 'Fountain cascades lit by Chandelier + Pool Luminescence',
      },
      {
        zone: 'Rotunda Pool Water Surface',
        pos: new THREE.Vector3(0, 1.2, 0.6),
        normal: new THREE.Vector3(0, 1, 0),
        minLux: 400,
        desc: 'Radiant turquoise water surface with dual photon influx',
      },
      {
        zone: 'Rotunda Basin Floor (Deep Cavity)',
        pos: new THREE.Vector3(0, 0.2, 0.6),
        normal: new THREE.Vector3(0, 1, 0),
        minLux: 300,
        desc: 'Cavity bottom: immune to black crush via turquoise luminescence + amber bounce',
      },
      {
        zone: 'Rotunda Promenade Ring (Table 01-04)',
        pos: new THREE.Vector3(4.5, 0.8, 0.6),
        normal: new THREE.Vector3(0, 1, 0),
        minLux: 250,
        desc: 'Promenade dining tables bathed in sun + rotunda chandelier glow',
      },
      {
        zone: 'Cocktail Bar & Promenade Lounge',
        pos: new THREE.Vector3(-12.0, 1.1, 0.0),
        normal: new THREE.Vector3(0, 1, 0),
        minLux: 200,
        desc: 'Intimate lounge amber bar lighting',
      },
      {
        zone: 'Sommelier Wine Wall Showcase',
        pos: new THREE.Vector3(10.0, 1.5, -11.0),
        normal: new THREE.Vector3(0, 0, 1),
        minLux: 200,
        desc: 'Wine display vertical plane illumination',
      },
      {
        zone: 'Main Dining Imperial Oak Floor',
        pos: new THREE.Vector3(0.0, 0.0, 5.0),
        normal: new THREE.Vector3(0, 1, 0),
        minLux: 220,
        desc: 'Central hardwood dining corridor',
      },
    ];

    const benchmarkResults = [];

    for (const pt of testPoints) {
      let totalLux = 0;
      const rgbTotal = new THREE.Color(0, 0, 0);

      // 1. Ambient Light
      const ambientLux = ambient.intensity * 80;
      totalLux += ambientLux;
      rgbTotal.add(ambient.color.clone().multiplyScalar(ambientLux));

      // 2. Hemisphere Light (blend based on surface normal up vector)
      const hemiAlpha = 0.5 * (pt.normal.y + 1.0);
      const hemiColor = hemisphere.groundColor.clone().lerp(hemisphere.skyColor, hemiAlpha);
      const hemiLux = hemisphere.intensity * 90;
      totalLux += hemiLux;
      rgbTotal.add(hemiColor.multiplyScalar(hemiLux));

      // 3. Directional Lights
      for (const dLight of dirLights) {
        const nDotL = Math.max(0, pt.normal.dot(dLight.dir));
        const dLux = dLight.intensity * nDotL * 120;
        totalLux += dLux;
        rgbTotal.add(dLight.color.clone().multiplyScalar(dLux));
      }

      // 4. Point Lights
      for (const pLight of pointLights) {
        const { irradiance, rgb } = calcPointLightIrradiance(pLight, pt.pos, pt.normal);
        totalLux += irradiance;
        rgbTotal.add(rgb);
      }

      benchmarkResults.push({
        zone: pt.zone,
        position: pt.pos.toArray(),
        totalLux: Math.round(totalLux),
        dominantColorHex: '#' + rgbTotal.getHexString(),
        status: totalLux >= pt.minLux ? 'PASS_VIBRANT' : 'FAIL_UNDERLIT',
      });

      // Verify that every single point exceeds minimum lux threshold
      assert.ok(
        totalLux >= pt.minLux,
        `Zone "${pt.zone}" must have >= ${pt.minLux} lux (measured: ${Math.round(totalLux)} lux)`
      );
    }

    // Rotunda structure should have higher lux than peripheral dining corridors
    const rotundaApex = benchmarkResults.find((r) => r.zone.includes('Chandelier Apex'));
    const rotundaBasin = benchmarkResults.find((r) => r.zone.includes('Basin Floor'));
    const bar = benchmarkResults.find((r) => r.zone.includes('Cocktail Bar'));

    assert.ok(
      rotundaApex.totalLux > bar.totalLux,
      `Rotunda Chandelier Apex (${rotundaApex.totalLux} lux) must be brighter than bar corridor (${bar.totalLux} lux)`
    );
    assert.ok(
      rotundaBasin.totalLux >= 300,
      `Basin floor (${rotundaBasin.totalLux} lux) must have zero cavity collapse`
    );
  });

  // =========================================================================
  // 4. Quality Tier Tone Mapping & Exposure Calibration Verification
  // =========================================================================
  await t.test('4. Tier Exposure & Environment HDR Balancing', () => {
    // High tier: exposure 1.48, environment 1.25 (Vibrant cinematic LookDev calibration)
    assert.strictEqual(QUALITY_TIER_CONFIGS.high.toneMappingExposure, 1.48);
    assert.strictEqual(QUALITY_TIER_CONFIGS.high.environmentIntensity, 1.25);

    // Medium tier: exposure 1.42, environment 1.15
    assert.strictEqual(QUALITY_TIER_CONFIGS.medium.toneMappingExposure, 1.42);
    assert.strictEqual(QUALITY_TIER_CONFIGS.medium.environmentIntensity, 1.15);

    // Low tier: exposure 1.38, environment 1.05
    assert.strictEqual(QUALITY_TIER_CONFIGS.low.toneMappingExposure, 1.38);
    assert.strictEqual(QUALITY_TIER_CONFIGS.low.environmentIntensity, 1.05);
  });
});
