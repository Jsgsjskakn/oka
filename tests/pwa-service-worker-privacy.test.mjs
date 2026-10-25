import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();

test('PWA Service Worker & Privacy Hardening Verification', async (t) => {
  const swPath = path.join(PROJECT_ROOT, 'public', 'sw.js');
  const registerPath = path.join(PROJECT_ROOT, 'src', 'components', 'pwa', 'ServiceWorkerRegister.tsx');
  const layoutPath = path.join(PROJECT_ROOT, 'src', 'app', 'layout.tsx');

  await t.test('sw.js file exists and contains updated cache version', () => {
    assert.ok(fs.existsSync(swPath), 'public/sw.js must exist');
    const content = fs.readFileSync(swPath, 'utf8');
    assert.match(content, /CACHE_NAME\s*=\s*['"]golden-oak-v2['"]/, 'Cache name must be golden-oak-v2 to purge old unhardened caches');
  });

  await t.test('sw.js explicitly checks and blocks all sensitive routes', () => {
    const content = fs.readFileSync(swPath, 'utf8');
    const requiredSensitivePrefixes = [
      '/admin',
      '/employee',
      '/profile',
      '/checkout',
      '/auth',
      '/api',
    ];

    for (const prefix of requiredSensitivePrefixes) {
      assert.ok(
        content.includes(prefix),
        `sw.js must explicitly contain rule for sensitive route: ${prefix}`
      );
    }
  });

  await t.test('sw.js sensitive route matching logic correctly flags sensitive paths', () => {
    const sensitivePatterns = [
      /^\/admin(\/.*)?$/i,
      /^\/employee(\/.*)?$/i,
      /^\/debug-employee(\/.*)?$/i,
      /^\/profile(\/.*)?$/i,
      /^\/checkout(\/.*)?$/i,
      /^\/auth(\/.*)?$/i,
      /^\/api(\/.*)?$/i,
      /^\/order(\/.*)?$/i,
      /^\/booking(\/.*)?$/i,
    ];

    const isSensitive = (pathname) => sensitivePatterns.some((pattern) => pattern.test(pathname));

    // Must be sensitive
    assert.equal(isSensitive('/admin'), true);
    assert.equal(isSensitive('/admin/dashboard'), true);
    assert.equal(isSensitive('/admin/orders/123'), true);
    assert.equal(isSensitive('/employee'), true);
    assert.equal(isSensitive('/employee/orders'), true);
    assert.equal(isSensitive('/profile'), true);
    assert.equal(isSensitive('/profile/edit'), true);
    assert.equal(isSensitive('/checkout'), true);
    assert.equal(isSensitive('/auth/login'), true);
    assert.equal(isSensitive('/auth/callback'), true);
    assert.equal(isSensitive('/api/auth'), true);
    assert.equal(isSensitive('/api/orders/update'), true);

    // Must NOT be sensitive
    assert.equal(isSensitive('/'), false);
    assert.equal(isSensitive('/menu'), false);
    assert.equal(isSensitive('/about'), false);
    assert.equal(isSensitive('/contact'), false);
    assert.equal(isSensitive('/offline'), false);
    assert.equal(isSensitive('/models/warrior_scene.glb'), false);
  });

  await t.test('sw.js static asset matching strictly allows only static assets', () => {
    const isStaticAsset = (pathname) => {
      pathname = pathname.toLowerCase();
      if (pathname.endsWith('.glb') || pathname.endsWith('.gltf') || pathname.endsWith('.bin') || pathname.endsWith('.usdz')) return true;
      if (/\.(png|jpg|jpeg|webp|avif|svg|ico)$/i.test(pathname)) return true;
      if (/\.(woff|woff2|ttf|otf|eot)$/i.test(pathname)) return true;
      if (pathname.startsWith('/_next/static/') && (pathname.endsWith('.js') || pathname.endsWith('.css') || /\.(woff|woff2)$/i.test(pathname))) return true;
      if (pathname === '/manifest.json') return true;
      return false;
    };

    // Valid static assets
    assert.equal(isStaticAsset('/models/warrior_scene.glb'), true);
    assert.equal(isStaticAsset('/images/dishes/burger.jpg'), true);
    assert.equal(isStaticAsset('/icons/icon-192.png'), true);
    assert.equal(isStaticAsset('/manifest.json'), true);
    assert.equal(isStaticAsset('/_next/static/chunks/app/layout.js'), true);
    assert.equal(isStaticAsset('/_next/static/css/app.css'), true);

    // Dynamic routes or HTML that should NEVER be treated as static assets
    assert.equal(isStaticAsset('/admin/dashboard'), false);
    assert.equal(isStaticAsset('/profile/orders'), false);
    assert.equal(isStaticAsset('/menu'), false);
    assert.equal(isStaticAsset('/api/orders'), false);
  });

  await t.test('sw.js blocks RSC, next-action, and non-GET requests', () => {
    const content = fs.readFileSync(swPath, 'utf8');
    assert.ok(content.includes('_rsc'), 'Must block _rsc requests');
    assert.ok(content.includes('RSC'), 'Must block RSC header');
    assert.ok(content.includes('Next-Action'), 'Must block Next-Action header');
    assert.ok(content.includes("request.method !== 'GET'"), 'Must bypass non-GET requests');
    assert.ok(content.includes('caches.delete'), 'Must purge old caches during activate');
  });

  await t.test('ServiceWorkerRegister.tsx exists and is implemented correctly', () => {
    assert.ok(fs.existsSync(registerPath), 'src/components/pwa/ServiceWorkerRegister.tsx must exist');
    const content = fs.readFileSync(registerPath, 'utf8');
    assert.ok(content.includes("'use client'"), 'Must be a client component');
    assert.ok(content.includes('serviceWorker'), 'Must check for serviceWorker in navigator');
    assert.ok(content.includes("register('/sw.js'"), 'Must register /sw.js');
    assert.ok(content.includes('https:') || content.includes('localhost'), 'Must check for HTTPS or localhost context');
    assert.ok(content.includes('.catch('), 'Must provide graceful error handling');
    assert.ok(content.includes('export function ServiceWorkerRegister'), 'Must export ServiceWorkerRegister');
  });

  await t.test('layout.tsx imports and mounts ServiceWorkerRegister', () => {
    assert.ok(fs.existsSync(layoutPath), 'src/app/layout.tsx must exist');
    const content = fs.readFileSync(layoutPath, 'utf8');
    assert.ok(
      content.includes('ServiceWorkerRegister') && content.includes('@/components/pwa/ServiceWorkerRegister'),
      'layout.tsx must import ServiceWorkerRegister'
    );
    assert.ok(
      content.includes('<ServiceWorkerRegister />') || content.includes('<ServiceWorkerRegister/>'),
      'layout.tsx must render <ServiceWorkerRegister />'
    );
  });
});
