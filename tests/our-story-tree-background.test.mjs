import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

test('Our Story (/about) Stationary Oak Tree Background Verification', async (t) => {
  await t.test('1. AboutPage imports and mounts StationaryOakTreeBackground', () => {
    const aboutPath = path.join(ROOT_DIR, 'src/app/about/page.tsx');
    assert.ok(fs.existsSync(aboutPath), 'src/app/about/page.tsx must exist');
    const content = fs.readFileSync(aboutPath, 'utf-8');

    assert.match(
      content,
      /import\s*\{\s*StationaryOakTreeBackground\s*\}\s*from\s*['"]@\/components\/home\/StationaryOakTreeBackground['"]/,
      'Must import StationaryOakTreeBackground'
    );
    assert.match(
      content,
      /<StationaryOakTreeBackground\s+isFixed=\{true\}\s*\/>/,
      'Must mount StationaryOakTreeBackground with isFixed={true}'
    );
  });

  await t.test('2. StationaryOakTreeBackground supports isFixed and className props', () => {
    const componentPath = path.join(ROOT_DIR, 'src/components/home/StationaryOakTreeBackground.tsx');
    assert.ok(fs.existsSync(componentPath), 'StationaryOakTreeBackground.tsx must exist');
    const content = fs.readFileSync(componentPath, 'utf-8');

    assert.match(content, /isFixed\?:\s*boolean/, 'Props interface must include optional isFixed');
    assert.match(content, /className\?:\s*string/, 'Props interface must include optional className');
    assert.match(content, /isFixed\s*\?\s*['"]fixed['"]\s*:\s*['"]absolute['"]/, 'Must dynamically toggle fixed vs absolute positioning');
  });

  await t.test('3. Both Home and Our Story pages share the exact same Oak Tree geometry', () => {
    const homeSectionPath = path.join(ROOT_DIR, 'src/components/home/HomeReservationAndLocationSection.tsx');
    const homeContent = fs.readFileSync(homeSectionPath, 'utf-8');
    assert.match(homeContent, /<StationaryOakTreeBackground\s*\/>/, 'Home page must mount StationaryOakTreeBackground');

    const treePath = path.join(ROOT_DIR, 'src/components/home/StationaryOakTreeBackground.tsx');
    const treeContent = fs.readFileSync(treePath, 'utf-8');
    assert.match(treeContent, /generateOakParticleMap/, 'Must use canonical generateOakParticleMap from preloader');
  });
});
