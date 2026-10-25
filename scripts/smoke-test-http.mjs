const BASE_URL = 'http://localhost:1111';

const routesToTest = [
  // 1. Customer Public Pages
  { path: '/', expectedStatus: [200], name: 'Landing Page' },
  { path: '/menu', expectedStatus: [200], name: 'Menu Page' },
  { path: '/3d/classic-smash-burger', expectedStatus: [200], name: '3D Dish Viewer' },
  { path: '/ar/classic-smash-burger', expectedStatus: [200], name: 'AR Dish Experience' },
  { path: '/booking', expectedStatus: [200], name: 'Table Reservation Page' },
  { path: '/cart', expectedStatus: [200], name: 'Cart Page' },
  { path: '/checkout', expectedStatus: [200], name: 'Checkout Page' },
  { path: '/profile', expectedStatus: [200], name: 'Customer Profile Page' },
  { path: '/about', expectedStatus: [200], name: 'About Page' },
  { path: '/contact', expectedStatus: [200], name: 'Contact Page' },
  { path: '/privacy', expectedStatus: [200], name: 'Privacy Page' },
  { path: '/terms', expectedStatus: [200], name: 'Terms Page' },
  { path: '/offline', expectedStatus: [200], name: 'Offline Fallback Page' },

  // 2. Auth & Portals
  { path: '/admin/login', expectedStatus: [200], name: 'Admin Login' },
  { path: '/employee/login', expectedStatus: [200], name: 'Employee Login' },
  { path: '/admin/dashboard', expectedStatus: [307, 308, 200], name: 'Admin Dashboard (Auth Protected / Redirect)' },
  { path: '/employee/orders', expectedStatus: [307, 308, 200], name: 'Employee Orders (Auth Protected / Redirect)' },

  // 3. Health & Static Assets
  { path: '/api/health', expectedStatus: [200], name: 'Production Health API' },
  { path: '/manifest.json', expectedStatus: [200], name: 'PWA Web Manifest' },
  { path: '/models/warrior_scene.glb', expectedStatus: [200], name: 'Shared 3D GLB Model Asset' },

  // 4. Negative Route / 404 Tests
  { path: '/3d/non-existent-dish-slug-12345', expectedStatus: [404, 200], checkNotFoundContent: true, name: 'Invalid 3D Slug (Renders 404 Page)' },
  { path: '/ar/non-existent-dish-slug-12345', expectedStatus: [404, 200], checkNotFoundContent: true, name: 'Invalid AR Slug (Renders 404 Page)' },
  { path: '/random-definitely-nonexistent-route-xyz', expectedStatus: [404, 200], checkNotFoundContent: true, name: 'Random 404 Route' },
];

async function runSmokeTests() {
  console.log('================================================================');
  console.log('THE GOLDEN OAK: LIVE HTTP SMOKE TEST SUITE (PORT 1111)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  for (const route of routesToTest) {
    const url = `${BASE_URL}${route.path}`;
    const start = Date.now();
    try {
      const res = await fetch(url, { redirect: 'manual' });
      const latency = Date.now() - start;
      let ok = route.expectedStatus.includes(res.status);

      if (route.checkNotFoundContent) {
        const body = await res.text();
        const has404Content = body.includes('Page Not Found') || body.includes('404');
        if (!has404Content && res.status !== 404) {
          ok = false;
        }
      }

      if (ok) {
        console.log(`✓ [${res.status}] ${route.name.padEnd(45)} (${latency}ms)`);
        passed++;
      } else {
        console.error(`✗ [${res.status} != ${route.expectedStatus.join('/')}] ${route.name.padEnd(45)} URL: ${url}`);
        failed++;
      }
    } catch (err) {
      console.error(`✗ [CONN_FAIL] ${route.name.padEnd(45)} Error: ${err.message}`);
      failed++;
    }
  }

  console.log('\n================================================================');
  console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTests();
