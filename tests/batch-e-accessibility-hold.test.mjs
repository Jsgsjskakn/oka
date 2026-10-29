import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Batch E: Accessibility & Reservation Hold Expiration Verification', async (t) => {
  const floorplanPath = path.resolve('src/components/booking/Restaurant3DFloorplan.tsx');
  const dossierPath = path.resolve('src/components/booking/BookingSummaryDossier.tsx');

  assert.ok(fs.existsSync(floorplanPath), 'Restaurant3DFloorplan.tsx must exist');
  assert.ok(fs.existsSync(dossierPath), 'BookingSummaryDossier.tsx must exist');

  const floorplanSrc = fs.readFileSync(floorplanPath, 'utf8');
  const dossierSrc = fs.readFileSync(dossierPath, 'utf8');

  await t.test('1. Camera Preset Accessibility & aria-pressed', () => {
    assert.ok(
      floorplanSrc.includes("aria-pressed={viewMode === 'eyelevel'}"),
      'Dining preset button must have aria-pressed attribute'
    );
    assert.ok(
      floorplanSrc.includes("aria-pressed={viewMode === 'perspective'}"),
      'Perspective preset button must have aria-pressed attribute'
    );
    assert.ok(
      floorplanSrc.includes("aria-pressed={viewMode === 'rotunda'}"),
      'Rotunda preset button must have aria-pressed attribute'
    );
    assert.ok(
      floorplanSrc.includes("aria-pressed={viewMode === 'bar'}"),
      'Bar preset button must have aria-pressed attribute'
    );
    assert.ok(
      floorplanSrc.includes("aria-pressed={viewMode === 'vip'}"),
      'VIP preset button must have aria-pressed attribute'
    );
    assert.ok(
      floorplanSrc.includes("aria-pressed={viewMode === 'topdown'}"),
      'Top-Down preset button must have aria-pressed attribute'
    );
  });

  await t.test('2. Visible Keyboard Focus Indicators', () => {
    assert.ok(
      floorplanSrc.includes('focus-visible:ring-2 focus-visible:ring-[#F0C36B] focus-visible:outline-none'),
      'Preset and action buttons must include focus-visible high-contrast gold ring'
    );
  });

  await t.test('3. Reduced Motion Camera Transition Snapping', () => {
    assert.ok(
      floorplanSrc.includes('quality.prefersReducedMotion'),
      'handleSwitchPreset must check quality.prefersReducedMotion'
    );
    assert.ok(
      floorplanSrc.includes('dampingLambda: 999'),
      'Must apply instant snapping (dampingLambda: 999) when prefersReducedMotion is enabled'
    );
  });

  await t.test('4. 3D Viewport Landmark Region', () => {
    assert.ok(
      floorplanSrc.includes('role="region"'),
      'Canvas viewport container must define role="region"'
    );
    assert.ok(
      floorplanSrc.includes('aria-label="3D Interactive Restaurant Floorplan"'),
      'Canvas viewport container must define accessible aria-label'
    );
  });

  await t.test('5. Expired Table Hold Presentation in BookingSummaryDossier', () => {
    assert.ok(
      dossierSrc.includes('secondsRemaining <= 0'),
      'Dossier must check for expired secondsRemaining <= 0'
    );
    assert.ok(
      dossierSrc.includes('Table Hold Expired — Reselect table to re-lock'),
      'Dossier must display clear expired warning message'
    );
    assert.ok(
      dossierSrc.includes('bg-[#2A1208]/90') && dossierSrc.includes('border-[#F0A04B]/70'),
      'Dossier must use amber/red visual treatment for expired hold'
    );
    assert.ok(
      dossierSrc.includes('AlertTriangle'),
      'Dossier must import and display AlertTriangle icon on expired hold'
    );
  });
});
