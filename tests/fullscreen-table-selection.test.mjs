import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Fullscreen UI & Interaction Specialist: Table Selection Audit', async (t) => {
  const root = path.resolve('.');
  const floorplanPath = path.join(root, 'src/components/booking/Restaurant3DFloorplan.tsx');
  const bookingClientPath = path.join(root, 'src/app/booking/BookingClient.tsx');

  assert.ok(fs.existsSync(floorplanPath), 'Restaurant3DFloorplan.tsx must exist');
  assert.ok(fs.existsSync(bookingClientPath), 'BookingClient.tsx must exist');

  const floorplanSrc = fs.readFileSync(floorplanPath, 'utf8');
  const bookingClientSrc = fs.readFileSync(bookingClientPath, 'utf8');

  await t.test('1. Non-Fullscreen Unified Card Architecture (Zero Gap Integration)', () => {
    // Canvas viewport top border and rounding
    assert.ok(
      floorplanSrc.includes('rounded-t-2xl') &&
        floorplanSrc.includes('border-t border-x border-[#F0C36B]/40'),
      'Canvas viewport must have rounded-t-2xl and matching border-t border-x border-[#F0C36B]/40'
    );

    // Fullscreen trigger bottom border and rounding
    assert.ok(
      floorplanSrc.includes('rounded-b-2xl') &&
        floorplanSrc.includes('border-b border-x border-[#F0C36B]/40'),
      'Fullscreen trigger button must have rounded-b-2xl and matching border-b border-x border-[#F0C36B]/40'
    );

    // Grouped together with zero gap (w-full flex flex-col)
    assert.ok(
      floorplanSrc.includes("<div className={isFullscreenMode ? 'contents' : 'w-full flex flex-col'}>"),
      'Canvas viewport and bottom trigger button must be wrapped in w-full flex flex-col to ensure 0 gap integration'
    );

    // Proportioned height to prevent vertical clipping on standard laptop displays
    assert.ok(
      floorplanSrc.includes('h-[360px] sm:h-[400px] md:h-[420px]'),
      'Canvas viewport must specify h-[360px] sm:h-[400px] md:h-[420px] for laptop display proportioning'
    );
  });

  await t.test('2. No Duplicate or Conflicting Fullscreen Triggers in BookingClient', () => {
    // In BookingClient.tsx, Restaurant3DFloorplan is passed isFullscreen and onToggleFullscreen
    assert.ok(
      bookingClientSrc.includes('isFullscreen={openFullscreen3D}'),
      'BookingClient must pass openFullscreen3D to Restaurant3DFloorplan'
    );
    assert.ok(
      bookingClientSrc.includes('onToggleFullscreen={setOpenFullscreen3D}'),
      'BookingClient must pass setOpenFullscreen3D callback'
    );

    // Ensure no redundant fullscreen buttons in BookingClient outside the floorplan
    const bookingStateMatches = bookingClientSrc.match(/openFullscreen3D/g) || [];
    const bookingSetterMatches = bookingClientSrc.match(/setOpenFullscreen3D/g) || [];
    // Only the useState declaration and component props
    assert.equal(
      bookingStateMatches.length,
      2,
      'openFullscreen3D state should only be referenced for useState declaration and isFullscreen prop'
    );
    assert.equal(
      bookingSetterMatches.length,
      2,
      'setOpenFullscreen3D setter should only be referenced for useState declaration and onToggleFullscreen prop'
    );
  });

  await t.test('3. Portal-Based DOM Breakout & Fullscreen Stacking', () => {
    // Must use createPortal to break out of CSS backdrop-filter containment
    assert.ok(
      floorplanSrc.includes('createPortal(content, document.body)'),
      'Must mount to document.body via createPortal to break out of parent backdrop-filter'
    );

    // Viewport coverage and maximum z-index
    assert.ok(
      floorplanSrc.includes('w-screen h-screen fixed inset-0 z-[99999] bg-[#0E0A08]'),
      'Fullscreen layout must use w-screen h-screen fixed inset-0 z-[99999] bg-[#0E0A08]'
    );
  });

  await t.test('4. YouTube-Style Top-Left Back Button', () => {
    // Prominent Back to Table button with gold styling
    assert.ok(
      floorplanSrc.includes('Back to Table'),
      'Must include "Back to Table" text'
    );
    assert.ok(
      floorplanSrc.includes('from-[#F0C36B] to-[#D4A346]'),
      'Back button must feature gold gradient styling'
    );
    assert.ok(
      floorplanSrc.includes('aria-label="Back to Table Selection"'),
      'Back button must have accessible aria-label="Back to Table Selection"'
    );
  });

  await t.test('5. Keyboard Navigation & Escape Handler', () => {
    // Escape key handling
    assert.ok(
      floorplanSrc.includes("if (e.key === 'Escape')"),
      'Must listen for Escape key press'
    );
    assert.ok(
      floorplanSrc.includes('handleToggleFullscreen(false)'),
      'Escape key must trigger handleToggleFullscreen(false)'
    );

    // Native fullscreenchange listener
    assert.ok(
      floorplanSrc.includes("document.addEventListener('fullscreenchange'"),
      'Must listen to document fullscreenchange to keep state in sync'
    );
  });

  await t.test('6. Bottom 28-Table Selector Dock & Confirmation', () => {
    // 28 Table selector in fullscreen
    assert.ok(
      floorplanSrc.includes('RESTAURANT_3D_TABLES.map'),
      'Dock must map over all 28 restaurant tables'
    );
    assert.ok(
      floorplanSrc.includes('aria-label="Table quick selector"'),
      'Dock carousel must have accessible landmark/aria-label'
    );
    assert.ok(
      floorplanSrc.includes('aria-pressed={isCur}'),
      'Dock table buttons must include aria-pressed state'
    );

    // Confirm button with check icon and return action
    assert.ok(
      floorplanSrc.includes('Confirm') && floorplanSrc.includes('& Return'),
      'Dock must provide a "Confirm Table & Return" button'
    );
    assert.ok(
      floorplanSrc.includes('aria-label="Confirm Table Selection and Return"'),
      'Confirm button must include accessible aria-label'
    );
  });
});
