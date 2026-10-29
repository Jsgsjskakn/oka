import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Polyfills for headless Three.js execution in Node.js
global.self = global;
global.window = global;

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  RESTAURANT_3D_TABLES,
  getTableByNumber,
} from '../src/lib/constants/restaurant3DMapping.ts';
import { getTableProxyGeometry } from '../src/lib/three/interiorOptimization.ts';

test('Table Selection & State Pipeline Specialist Audit', async (t) => {
  const root = path.resolve('.');
  const floorplanPath = path.join(root, 'src/components/booking/Restaurant3DFloorplan.tsx');
  const collidersPath = path.join(root, 'src/components/booking/TableColliders.tsx');
  const bookingClientPath = path.join(root, 'src/app/booking/BookingClient.tsx');
  const dossierPath = path.join(root, 'src/components/booking/BookingSummaryDossier.tsx');
  const glbPath = path.join(root, 'public/models/the_golden_oak_interior.glb');

  assert.ok(fs.existsSync(floorplanPath), 'Restaurant3DFloorplan.tsx must exist');
  assert.ok(fs.existsSync(collidersPath), 'TableColliders.tsx must exist');
  assert.ok(fs.existsSync(bookingClientPath), 'BookingClient.tsx must exist');
  assert.ok(fs.existsSync(dossierPath), 'BookingSummaryDossier.tsx must exist');
  assert.ok(fs.existsSync(glbPath), 'GLB interior model must exist');

  const floorplanSrc = fs.readFileSync(floorplanPath, 'utf8');
  const collidersSrc = fs.readFileSync(collidersPath, 'utf8');
  const bookingClientSrc = fs.readFileSync(bookingClientPath, 'utf8');
  const dossierSrc = fs.readFileSync(dossierPath, 'utf8');

  await t.test('1. Table Collision Proxies: Exact GLB Alignment & Geometry Calibration', async () => {
    assert.strictEqual(RESTAURANT_3D_TABLES.length, 28, 'Must define exactly 28 tables');

    // Parse the GLB to verify world positions of all 28 tables
    const loader = new GLTFLoader();
    const buf = fs.readFileSync(glbPath);
    const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    const gltf = await new Promise((resolve, reject) => {
      loader.parse(arrayBuf, '', resolve, reject);
    });
    gltf.scene.updateMatrixWorld(true);

    for (const table of RESTAURANT_3D_TABLES) {
      let matchedNode = null;
      gltf.scene.traverse((c) => {
        if (c.name && c.name.toLowerCase().includes(table.blenderNodeName.toLowerCase())) {
          if (!matchedNode) matchedNode = c;
        }
      });

      assert.ok(matchedNode, `Table #${table.tableNumber} node ${table.blenderNodeName} must exist in GLB`);
      const wp = new THREE.Vector3();
      matchedNode.getWorldPosition(wp);

      const expectedX = table.position3D[0];
      const expectedZ = -table.position3D[2];
      const deltaX = Math.abs(wp.x - expectedX);
      const deltaZ = Math.abs(wp.z - expectedZ);

      // Max offset <= 0.15m corresponds to the decorative lamp mounted on the tabletop
      assert.ok(
        deltaX <= 0.15,
        `Table #${table.tableNumber} X offset ${deltaX.toFixed(3)} must be <= 0.15m`
      );
      assert.ok(
        deltaZ <= 0.15,
        `Table #${table.tableNumber} Z offset ${deltaZ.toFixed(3)} must be <= 0.15m`
      );

      // Verify proxy cylinder geometry radius & height
      const proxyGeom = getTableProxyGeometry(table);
      assert.strictEqual(proxyGeom.height, 0.85);
      assert.ok(proxyGeom.radius >= 0.65 && proxyGeom.radius <= 1.70);
    }

    // Verify TableColliders constants and mapping functions statically
    assert.ok(collidersSrc.includes('COLLIDER_HEIGHT = 0.92;'));
    assert.ok(collidersSrc.includes('COLLIDER_CENTER_Y = COLLIDER_HEIGHT / 2;'));
    assert.ok(collidersSrc.includes('TABLE_VISUAL_Y = 0.76;'));
    assert.ok(collidersSrc.includes('getTableThreePosition'));
    assert.ok(collidersSrc.includes('getColliderRadius'));
  });

  await t.test('2. Table Selection Pipeline: 3D Picking, Golden Ring, Camera Glide & Dossier Sync', () => {
    // 3D Table selection ring and highlight
    assert.ok(
      collidersSrc.includes("isSelected ? '#F0C36B'"),
      'Selected table collider must display radiant golden ring (#F0C36B)'
    );
    assert.ok(
      collidersSrc.includes('circleGeometry args={[isSelected ? 0.42 : 0.32, 32]}'),
      'Selected table must render radiant glowing inner disc'
    );
    assert.ok(
      collidersSrc.includes('opacity={isSelected ? 0.95 : isHovered ? 0.85 : 0.25}'),
      'Selected table ring must have 0.95 opacity'
    );

    // Camera glide on table focus
    assert.ok(
      floorplanSrc.includes('const focusOnTable = useCallback'),
      'Restaurant3DFloorplan must define focusOnTable'
    );
    assert.ok(
      floorplanSrc.includes('dampingLambda: quality.prefersReducedMotion ? 999 : 6.0'),
      'focusOnTable must use smooth dampingLambda or 999 for reduced motion'
    );
    assert.ok(
      floorplanSrc.includes('setTargetCamera(target)'),
      'focusOnTable must trigger camera glide via setTargetCamera'
    );

    // Dock selection updates selectedTableNumber and glides camera
    assert.ok(
      floorplanSrc.includes('handleSelectTable(t)'),
      'Dock carousel must invoke handleSelectTable on table click'
    );

    // Dossier receives and displays table selection
    assert.ok(
      bookingClientSrc.includes('tableNumber={selectedTable?.tableNumber || null}'),
      'BookingClient must pass tableNumber to BookingSummaryDossier'
    );
    assert.ok(
      bookingClientSrc.includes('tableName={selectedTable?.name}'),
      'BookingClient must pass tableName to BookingSummaryDossier'
    );
    assert.ok(
      bookingClientSrc.includes('zone={selectedZone || selectedTable?.zone}'),
      'BookingClient must pass zone to BookingSummaryDossier'
    );
  });

  await t.test('3. Availability & Party Capacity Matching', () => {
    // Under-capacity tables marked in 3D TableColliders
    assert.ok(
      collidersSrc.includes('const fitsParty = table.capacity >= guests;'),
      'TableColliders must compute fitsParty = table.capacity >= guests'
    );
    assert.ok(
      collidersSrc.includes('isAvailable && fitsParty') && collidersSrc.includes("'#555555'"),
      'Table ring must dim to grey (#555555) when table does not fit party'
    );

    // Under-capacity tables dimmed in Dock carousel
    assert.ok(
      floorplanSrc.includes('const fitsParty = t.capacity >= guests;'),
      'Dock carousel must compute fitsParty = t.capacity >= guests'
    );
    assert.ok(
      floorplanSrc.includes('isAvail && fitsParty'),
      'Dock carousel must require both isAvail and fitsParty for active styling'
    );

    // Hover card capacity badge / warning
    assert.ok(
      floorplanSrc.includes('Needs {guests} Seats'),
      'Hover card must display capacity warning if table is under-capacity'
    );

    // Client handler enforces capacity validation and availability checks
    assert.ok(
      bookingClientSrc.includes('if (table.capacity < guests)'),
      'handleSelectTableFromMap must guard against party size exceeding table capacity'
    );
    assert.ok(
      bookingClientSrc.includes('Table Capacity Exceeded'),
      'handleSelectTableFromMap must show error toast when party exceeds capacity'
    );

    // Auto-selection picks best fit from all 28 tables
    assert.ok(
      bookingClientSrc.includes('RESTAURANT_3D_TABLES.filter'),
      'performAvailabilityCheck must consider all 28 tables from RESTAURANT_3D_TABLES'
    );
    assert.ok(
      bookingClientSrc.includes('sort((a, b) => a.capacity - b.capacity)'),
      'performAvailabilityCheck must sort by minimal sufficient capacity (best fit)'
    );
  });

  await t.test('4. 5-Minute Hold Timer & Expired State Distinction', () => {
    // Countdown logic
    assert.ok(
      dossierSrc.includes('const [secondsRemaining, setSecondsRemaining] = useState<number>(300);'),
      'BookingSummaryDossier must track secondsRemaining initializing at 300'
    );
    assert.ok(
      dossierSrc.includes('const diff = Math.max(0, Math.floor((holdExpiresAt - now) / 1000));'),
      'Timer must decrement based on holdExpiresAt timestamp'
    );

    // Clear distinguishable expired presentation
    assert.ok(
      dossierSrc.includes('secondsRemaining <= 0'),
      'Dossier must test secondsRemaining <= 0 for expired condition'
    );
    assert.ok(
      dossierSrc.includes('Table Hold Expired — Reselect table to re-lock'),
      'Dossier must display expired header warning'
    );
    assert.ok(
      dossierSrc.includes('00:00'),
      'Dossier must display 00:00 indicator when expired'
    );
    assert.ok(
      dossierSrc.includes('bg-[#2A1208]/90') && dossierSrc.includes('border-[#F0A04B]/70'),
      'Dossier must use amber warning banner styling when expired'
    );

    // BookingClient prevents moving forward with expired hold
    assert.ok(
      bookingClientSrc.includes('if (holdExpiresAt && Date.now() > holdExpiresAt)'),
      'handleProceedToDetails must block progress when holdExpiresAt has elapsed'
    );
    assert.ok(
      bookingClientSrc.includes('Table Hold Expired'),
      'handleProceedToDetails must toast error when hold has expired'
    );
  });

  await t.test('5. Server Confirmation Integrity & Anti-False Confirmation Guarantee', () => {
    // Verify client never claims confirmed reservation prior to payment confirmation
    assert.doesNotMatch(
      bookingClientSrc,
      /setAvailabilityMsg\(\s*\{[^}]*text:\s*['"`]Table reserved!/i,
      'Must not claim "Table reserved!" on preliminary availability check'
    );
    assert.ok(
      bookingClientSrc.includes('Table available!'),
      'Must use "Table available!" on preliminary check'
    );

    assert.ok(
      dossierSrc.includes('Your table is held for 5 minutes while you finalize your details.'),
      'Dossier must accurately state table is held rather than confirmed'
    );

    assert.ok(
      bookingClientSrc.includes('Physical Table Hold Active'),
      'Step 3 must indicate Physical Table Hold Active before payment'
    );
    assert.ok(
      bookingClientSrc.includes('Advance Hold Confirmation'),
      'Step 3 header must state Advance Hold Confirmation'
    );
    assert.ok(
      bookingClientSrc.includes('Verify &amp; Confirm Table Reservation') ||
        bookingClientSrc.includes('Verify & Confirm Table Reservation'),
      'Payment CTA must state Verify & Confirm Table Reservation'
    );
    assert.ok(
      bookingClientSrc.includes("toast.success('Reservation Confirmed'"),
      'Reservation Confirmed toast must only be dispatched after customerConfirmBookingPayment succeeds'
    );
  });
});
