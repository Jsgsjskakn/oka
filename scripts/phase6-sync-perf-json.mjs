import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const perfPath = path.join(root, 'docs/phase6/PHASE6_PERFORMANCE_COMPARISON.json');
const manifestPath = path.join(root, 'docs/phase5/dish-asset-manifest.json');
const virtualExecPath = path.join(root, 'docs/phase6/PHASE6_VIRTUAL_DEVICE_EXECUTION.json');
const artifactDir = 'C:/Users/Pyiush Gupta/.gemini/antigravity/brain/22cb5c35-3043-4ba7-a662-5d1b3225baa2';

const perf = JSON.parse(fs.readFileSync(perfPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const virtualExec = JSON.parse(fs.readFileSync(virtualExecPath, 'utf8'));

const archetypes = [
  'tandoori-paneer-pizza',
  'chicken-tikka-pizza',
  'mushroom-truffle-pizza',
  'bbq-chicken-overload',
  'classic-smash-burger',
  'crispy-paneer-burger',
  'wok-tossed-chow-mein',
  'dynamite-chilli-potatoes',
  'truffle-mushroom-risotto',
  'butter-chicken-bao',
];

perf.tenDishArchetypeBreakdown = archetypes.map((slug) => {
  const e = manifest[slug];
  return {
    slug: e.dishId,
    culinaryCategory: e.culinaryCategory,
    highGlbPath: e.profiles.high.path,
    highSizeBytes: e.profiles.high.sizeBytes,
    highSizeKB: e.profiles.high.sizeKb,
    highTriangles: e.profiles.high.triangleCount,
    balancedGlbPath: e.profiles.balanced.path,
    balancedSizeBytes: e.profiles.balanced.sizeBytes,
    balancedSizeKB: e.profiles.balanced.sizeKb,
    balancedTriangles: e.profiles.balanced.triangleCount,
    ultraLightGlbPath: e.profiles.ultraLight.path,
    ultraLightSizeBytes: e.profiles.ultraLight.sizeBytes,
    ultraLightSizeKB: e.profiles.ultraLight.sizeKb,
    ultraLightTriangles: e.profiles.ultraLight.triangleCount,
    usdzPath: e.profiles.usdz.path,
    usdzSizeBytes: e.profiles.usdz.sizeBytes,
    usdzSizeKB: e.profiles.usdz.sizeKb,
    scaleValidated: e.scaleValidated,
    colorValidated: e.colorValidated,
    groundContactValidated: e.groundContactValidated,
    provenance: 'AUTOMATED',
  };
});

perf.virtualDeviceExecutionSummary = {
  executedAt: virtualExec.executedAt,
  toolsInstalledAndUsed: virtualExec.toolsInstalledAndUsed,
  totalVirtualPersonasTested: virtualExec.virtualDeviceResults.length,
  evidencePath: 'docs/phase6/PHASE6_VIRTUAL_DEVICE_EXECUTION.json',
  results: virtualExec.virtualDeviceResults,
};

fs.writeFileSync(perfPath, JSON.stringify(perf, null, 2) + '\n', 'utf8');

const deliverables = [
  'PHASE6_ANDROID_PHYSICAL_TESTS.md',
  'PHASE6_IOS_PHYSICAL_TESTS.md',
  'PHASE6_AR_TRACKING_VALIDATION.md',
  'PHASE6_VR_DEVICE_VALIDATION.md',
  'PHASE6_DISH_SCALE_COLOUR_AUDIT.md',
  'PHASE6_PERFORMANCE_COMPARISON.json',
  'PHASE6_REGRESSION_REPORT.md',
  'PHASE6_FINAL_PRODUCTION_SIGNOFF.md',
  'PHASE6_VIRTUAL_DEVICE_EXECUTION.json',
  'PHASE6_EVIDENCE_COMPLETENESS_AUDIT.md',
];

for (const file of deliverables) {
  const src = path.join(root, 'docs/phase6', file);
  const dst = path.join(artifactDir, file);
  fs.copyFileSync(src, dst);
  console.log(`Synced: ${file} (${fs.statSync(src).size} bytes)`);
}
