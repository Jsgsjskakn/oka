import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PROJECT_ROOT = process.cwd();

console.log('================================================================');
console.log('  AGENT 10: PHASE 2 MASTER INTEGRITY & REGRESSION AUDIT SUITE');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

// -----------------------------------------------------------------------------
// CHECK 1: Safety & Non-Destruction Verification
// -----------------------------------------------------------------------------
console.log('--- 1. Safety & Non-Destruction Checks ---');

const originalInterior = path.join(PROJECT_ROOT, 'public/models/the_golden_oak_interior.glb');
const originalWarrior = path.join(PROJECT_ROOT, 'public/models/warrior_scene.glb');
const optimizedWarrior = path.join(PROJECT_ROOT, 'public/models/warrior_model.glb');
const localHdr = path.join(PROJECT_ROOT, 'public/textures/forest_env.hdr');

assert(fs.existsSync(originalInterior), 'Original interior model public/models/the_golden_oak_interior.glb exists');
const interiorStat = fs.statSync(originalInterior);
assert(interiorStat.size > 10_000_000, `Original interior model intact (${(interiorStat.size / (1024 * 1024)).toFixed(2)} MB)`);

assert(fs.existsSync(originalWarrior), 'Original warrior scene public/models/warrior_scene.glb exists');
const warriorStat = fs.statSync(originalWarrior);
assert(warriorStat.size > 10_000_000, `Original warrior scene intact (${(warriorStat.size / (1024 * 1024)).toFixed(2)} MB)`);

assert(fs.existsSync(optimizedWarrior), 'Optimized warrior model public/models/warrior_model.glb exists');
const optWarriorStat = fs.statSync(optimizedWarrior);
assert(optWarriorStat.size > 600_000 && optWarriorStat.size < 700_000, `Optimized warrior model size verified (${(optWarriorStat.size / 1024).toFixed(1)} KB)`);

assert(fs.existsSync(localHdr), 'Local environment texture public/textures/forest_env.hdr exists');
const hdrStat = fs.statSync(localHdr);
assert(hdrStat.size > 1_500_000, `Local HDR texture intact (${(hdrStat.size / (1024 * 1024)).toFixed(2)} MB)`);

// Check convex schema
const convexSchema = path.join(PROJECT_ROOT, 'convex/schema.ts');
assert(fs.existsSync(convexSchema), 'Convex schema exists');
const schemaContent = fs.readFileSync(convexSchema, 'utf8');
assert(schemaContent.includes('restaurants: defineTable'), 'Convex restaurants table intact');
assert(schemaContent.includes('dishes: defineTable'), 'Convex dishes table intact');
assert(schemaContent.includes('tables: defineTable'), 'Convex tables table intact');
assert(schemaContent.includes('bookings: defineTable'), 'Convex bookings table intact');
assert(schemaContent.includes('orders: defineTable'), 'Convex orders table intact');

// Check .env.local
const envLocal = path.join(PROJECT_ROOT, '.env.local');
assert(fs.existsSync(envLocal), '.env.local exists');
const envContent = fs.readFileSync(envLocal, 'utf8');
assert(envContent.includes('NEXT_PUBLIC_CONVEX_URL'), 'NEXT_PUBLIC_CONVEX_URL present');

// -----------------------------------------------------------------------------
// CHECK 2: Table Architecture & 3D Mapping Verification
// -----------------------------------------------------------------------------
console.log('\n--- 2. Architectural 3D Table Mapping & Capacities (28 Tables) ---');

const mappingFile = path.join(PROJECT_ROOT, 'src/lib/constants/restaurant3DMapping.ts');
assert(fs.existsSync(mappingFile), 'restaurant3DMapping.ts exists');
const mappingContent = fs.readFileSync(mappingFile, 'utf8');

// Parse RESTAURANT_3D_TABLES from code
const tableMatch = mappingContent.match(/tableNumber:\s*(\d+)/g);
const tableNumbers = tableMatch ? tableMatch.map(m => parseInt(m.split(':')[1].trim())) : [];
assert(tableNumbers.length === 28, `Found exactly 28 table numbers defined (found ${tableNumbers.length})`);

// Verify consecutive 1..28
const allPresent = Array.from({ length: 28 }, (_, i) => i + 1).every(num => tableNumbers.includes(num));
assert(allPresent, 'All 28 tables (T01 through T28) are sequentially defined');

// Verify TableColliders implementation
const collidersFile = path.join(PROJECT_ROOT, 'src/components/booking/TableColliders.tsx');
assert(fs.existsSync(collidersFile), 'TableColliders.tsx component exists');
const collidersContent = fs.readFileSync(collidersFile, 'utf8');
assert(collidersContent.includes('cylinderGeometry'), 'Uses low-poly cylinderGeometry for proxy raycasting');
assert(collidersContent.includes('raycast={() => null}'), 'Bypasses visual marker mesh raycast for performance');

// Verify 3D <-> 2D switching in BookingClient
const bookingClientFile = path.join(PROJECT_ROOT, 'src/app/booking/BookingClient.tsx');
const bookingClientContent = fs.readFileSync(bookingClientFile, 'utf8');
assert(bookingClientContent.includes('Restaurant3DFloorplan'), 'Restaurant3DFloorplan imported in BookingClient');
assert(bookingClientContent.includes('RestaurantFloorMap'), 'RestaurantFloorMap imported in BookingClient');
assert(bookingClientContent.includes('onSwitchTo2D={() => setView3DMode(false)}'), '3D to 2D switch callback wired');
assert(bookingClientContent.includes('onSwitchTo3D={() => setView3DMode(true)}'), '2D to 3D switch callback wired');

// Verify 3D Error Boundary
const floorplanFile = path.join(PROJECT_ROOT, 'src/components/booking/Restaurant3DFloorplan.tsx');
const floorplanContent = fs.readFileSync(floorplanFile, 'utf8');
assert(floorplanContent.includes('ThreeDErrorBoundary'), 'ThreeDErrorBoundary implemented in Restaurant3DFloorplan');
assert(floorplanContent.includes('Switch to 2D Floorplan'), 'Fallback button to 2D blueprint in ErrorBoundary');

// -----------------------------------------------------------------------------
// CHECK 3: Warrior 3D Showcase & Mobile Touch Trap Verification
// -----------------------------------------------------------------------------
console.log('\n--- 3. Warrior 3D Showcase & Mobile Scroll-Trap Resolution ---');

const promoCanvasFile = path.join(PROJECT_ROOT, 'src/components/home/PromoWarriorCanvas.tsx');
assert(fs.existsSync(promoCanvasFile), 'PromoWarriorCanvas.tsx exists');
const promoCanvasContent = fs.readFileSync(promoCanvasFile, 'utf8');

assert(promoCanvasContent.includes('enableZoom={false}'), 'OrbitControls enableZoom={false} prevents mobile scroll zoom-trap');
assert(promoCanvasContent.includes('enablePan={false}'), 'OrbitControls enablePan={false} prevents viewport displacement');
assert(
  promoCanvasContent.includes('/models/warrior_model.glb') || promoCanvasContent.includes('/models/warrior_scene.glb'),
  'Loads warrior model (optimized 647 KB warrior_model.glb or warrior_scene.glb)'
);

const promoSectionFile = path.join(PROJECT_ROOT, 'src/components/home/ARPromoSection.tsx');
const promoSectionContent = fs.readFileSync(promoSectionFile, 'utf8');
assert(promoSectionContent.includes('PromoWarriorCanvas'), 'ARPromoSection embeds PromoWarriorCanvas');
assert(promoSectionContent.includes('PREVIEW_DISHES'), 'Preview dish switcher pills implemented');
assert(promoSectionContent.includes('Launch 3D Food Lounge'), 'Launch 3D Food Lounge CTA linked');
assert(promoSectionContent.includes('Preview on My Table (AR)'), 'Preview on My Table (AR) CTA linked');

// -----------------------------------------------------------------------------
// CHECK 4: R3F Cache Poisoning & Disposal Regression Protection
// -----------------------------------------------------------------------------
console.log('\n--- 4. R3F Cache Lifecycle & Memory Regression Checks ---');

const arSceneFile = path.join(PROJECT_ROOT, 'src/components/ar/ARScene.tsx');
const arSceneContent = fs.readFileSync(arSceneFile, 'utf8');
assert(!arSceneContent.includes('geometry.dispose()'), 'ARScene does not call geometry.dispose() on cloned meshes');

const viewerSceneFile = path.join(PROJECT_ROOT, 'src/components/viewer/ViewerScene.tsx');
const viewerSceneContent = fs.readFileSync(viewerSceneFile, 'utf8');
assert(!viewerSceneContent.includes('disposeObject(clonedScene)'), 'ViewerScene does not poison glTF cache with disposeObject');
assert(viewerSceneContent.includes('frames={1}'), 'ContactShadows optimized to frames={1} to save draw calls');

// -----------------------------------------------------------------------------
// CHECK 5: Quality Tier Controller Verification
// -----------------------------------------------------------------------------
console.log('\n--- 5. Adaptive Quality Tier Controller Verification ---');

const qualityTierFile = path.join(PROJECT_ROOT, 'src/hooks/useQualityTier.ts');
assert(fs.existsSync(qualityTierFile), 'useQualityTier.ts hook exists');
const qualityTierContent = fs.readFileSync(qualityTierFile, 'utf8');
assert(qualityTierContent.includes('QUALITY_TIER_CONFIGS'), 'Calibrated QUALITY_TIER_CONFIGS defined');
assert(qualityTierContent.includes('isMobile: boolean'), 'Detects mobile devices for low tier clamping');
assert(qualityTierContent.includes('prefersReducedMotion'), 'Honors accessibility reduced motion preferences');

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`  AUDIT RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
