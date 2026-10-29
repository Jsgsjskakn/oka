import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();

test('Cinematic Particle Tree Preloader - Architecture & Visual Direction Verification', async (t) => {
  const particleMapPath = path.join(PROJECT_ROOT, 'src', 'components', 'preloader', 'oakTreeParticleMap.ts');
  const treeCompPath = path.join(PROJECT_ROOT, 'src', 'components', 'preloader', 'CinematicParticleTree.tsx');
  const preloaderCompPath = path.join(PROJECT_ROOT, 'src', 'components', 'preloader', 'CinematicPreloader.tsx');
  const mobileShellPath = path.join(PROJECT_ROOT, 'src', 'components', 'layout', 'MobileShell.tsx');

  await t.test('1. Core component files exist in src/components/preloader/', () => {
    assert.ok(fs.existsSync(particleMapPath), 'oakTreeParticleMap.ts must exist');
    assert.ok(fs.existsSync(treeCompPath), 'CinematicParticleTree.tsx must exist');
    assert.ok(fs.existsSync(preloaderCompPath), 'CinematicPreloader.tsx must exist');
  });

  await t.test('2. Oak tree particle map adheres to luxury gold palette & deterministic seeding', () => {
    const content = fs.readFileSync(particleMapPath, 'utf8');

    // Verify palette constants
    assert.match(content, /#D4AF37/i, 'Must contain Primary Metallic Gold #D4AF37');
    assert.match(content, /#F7D98B/i, 'Must contain Highlight Gold #F7D98B');
    assert.match(content, /#9C6B18/i, 'Must contain Deep Amber #9C6B18');

    // Forbidden color validation (no blue, purple, nebula gradients)
    assert.doesNotMatch(content, /#0000FF|#800080|#4B0082|rgb\(\s*0\s*,\s*0\s*,\s*255/i, 'Must not contain blue or purple');

    // Verify tree anatomical layers
    assert.match(content, /'root'/, 'Must contain root layer');
    assert.match(content, /'trunk'/, 'Must contain trunk layer');
    assert.match(content, /'branch'/, 'Must contain branch layer');
    assert.match(content, /'canopy'/, 'Must contain canopy layer');
    assert.match(content, /'apex'/, 'Must contain apex layer');

    // Verify deterministic PRNG algorithm
    assert.match(content, /mulberry32|seed/i, 'Must implement deterministic seeded pseudo-random number generator');
  });

  await t.test('3. Canvas 2D engine implements exact 8-second timeline & pure black background', () => {
    const content = fs.readFileSync(treeCompPath, 'utf8');

    // Pure black background #000000
    assert.match(content, /#000000/, 'Must use pure black background #000000');
    assert.match(content, /ctx\.fillStyle\s*=\s*['"]#000000['"]/, 'Canvas clear must use pure #000000');

    // 8-second nominal timeline check
    assert.match(content, /8\.0/, 'Timeline must anchor to 8.0 seconds');
    assert.match(content, /elapsed\s*>=\s*5\.0/, 'Phase D typography must reveal after 5.0s');

    // Typography: "The Golden Oak" & "RESTAURANT & LOUNGE"
    assert.match(content, /The Golden Oak/, 'Must render brand name "The Golden Oak"');
    assert.match(content, /RESTAURANT & LOUNGE/, 'Must render subtitle "RESTAURANT & LOUNGE"');

    // Monotonic 0% to 100% counter
    assert.match(content, /rawProgress/, 'Must calculate smooth progress');
    assert.match(content, /lastReportedProgressRef/, 'Must strictly enforce monotonic progress progression');

    // Accessibility & Escape key
    assert.match(content, /prefers-reduced-motion/, 'Must respect prefers-reduced-motion user preference');
    assert.match(content, /'Escape'/, 'Must support Escape key for immediate skip');
  });

  await t.test('4. Interactive depth & pointer reactivity', () => {
    const content = fs.readFileSync(treeCompPath, 'utf8');

    // Pointer lerping and depth displacement
    assert.match(content, /pointerTargetRef/, 'Must track pointer coordinates');
    assert.match(content, /pointerCurrentRef/, 'Must smoothly lerp pointer coordinates');
    assert.match(content, /repulsionRadius/, 'Must provide gentle localized repulsion effect');
    assert.match(content, /depthMultiplier/, 'Must differentiate depth response by anatomical layer (trunk vs canopy)');
  });

  await t.test('5. Global preloader lifecycle, session storage, and safety unblocking', () => {
    const content = fs.readFileSync(preloaderCompPath, 'utf8');

    // Session storage key
    assert.match(content, /tgo_cinematic_preloader_seen/, 'Must use dedicated session storage key');

    // Smooth exit transition
    assert.match(content, /opacity-0/, 'Must transition to opacity-0 on exit');
    assert.match(content, /duration-800|duration-700/, 'Must use smooth exit transition duration');

    // Anti-entrapment safety timeout
    assert.match(content, /12000/, 'Must have fail-safe timeout to prevent trapping the user');
  });

  await t.test('6. MobileShell mounts CinematicPreloader and preserves admin/employee isolation', () => {
    const content = fs.readFileSync(mobileShellPath, 'utf8');

    assert.match(content, /import\s*{\s*CinematicPreloader\s*}\s*from\s*['"]@\/components\/preloader\/CinematicPreloader['"]/, 'MobileShell must import CinematicPreloader');
    assert.match(content, /<CinematicPreloader\s*\/>/, 'MobileShell must render CinematicPreloader');

    // Isolation check: Admin and employee portals must return before MobileShell JSX
    const adminIdx = content.indexOf("pathname?.startsWith('/admin')");
    const preloaderIdx = content.indexOf('<CinematicPreloader');
    assert.ok(adminIdx !== -1, 'Must check for /admin route');
    assert.ok(preloaderIdx > adminIdx, 'Preloader must be mounted after admin/employee isolation check');
  });
});
