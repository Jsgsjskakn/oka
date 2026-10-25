// The Golden Oak - High-Performance Luxury Restaurant PWA Service Worker
// Privacy Hardened - Version 2.0.0
// Strict privacy policy: NEVER cache sensitive/protected routes, auth tokens, or user data.
// ONLY cache immutable static assets (3D models, images, fonts, Next.js static JS/CSS chunks).

const CACHE_NAME = 'golden-oak-v2';

// Safe, non-sensitive static assets pre-cached during service worker installation
const STATIC_ASSETS = [
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/models/warrior_scene.glb',
];

// Sensitive route patterns that MUST NEVER be cached or intercepted by Service Worker
const SENSITIVE_PATTERNS = [
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

/**
 * Checks whether a URL points to a sensitive or protected route
 */
function isSensitiveRoute(url) {
  const pathname = url.pathname;
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(pathname));
}

/**
 * Checks whether a URL represents an immutable static asset
 * Allowed: .glb 3D models, images, web fonts, Next.js static chunks, manifest/favicon
 */
function isStaticAsset(url) {
  const pathname = url.pathname.toLowerCase();

  // 1. 3D Models (.glb, .gltf, .bin, .usdz)
  if (pathname.endsWith('.glb') || pathname.endsWith('.gltf') || pathname.endsWith('.bin') || pathname.endsWith('.usdz')) {
    return true;
  }

  // 2. Static Images
  if (/\.(png|jpg|jpeg|webp|avif|svg|ico)$/i.test(pathname)) {
    return true;
  }

  // 3. Web Fonts
  if (/\.(woff|woff2|ttf|otf|eot)$/i.test(pathname)) {
    return true;
  }

  // 4. Next.js Static Chunks (immutable JS/CSS bundles with hashes in /_next/static/)
  if (pathname.startsWith('/_next/static/') && (pathname.endsWith('.js') || pathname.endsWith('.css') || /\.(woff|woff2)$/i.test(pathname))) {
    return true;
  }

  // 5. Manifest
  if (pathname === '/manifest.json') {
    return true;
  }

  return false;
}

// Installation: Pre-cache core offline assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('[SW] Cache addAll skipped non-critical asset:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activation: Purge outdated caches to clean up legacy or potentially sensitive cached entries
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => {
              console.log('[SW] Purging outdated or legacy cache:', key);
              return caches.delete(key);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch Interception: Strict Privacy & Caching Rules
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // RULE 1: Only handle GET requests. Skip mutations (POST, PUT, DELETE, PATCH, etc.)
  if (request.method !== 'GET') {
    return;
  }

  // RULE 2: Never intercept WebSockets, SSE, Convex real-time streams, or non-HTTP protocols
  if (url.protocol.startsWith('ws') || url.pathname.includes('/convex')) {
    return;
  }

  // RULE 3: Strict Privacy - NEVER intercept or cache sensitive routes
  // (/admin, /employee, /profile, /checkout, /auth, /api, /order, /booking)
  if (isSensitiveRoute(url)) {
    return;
  }

  // RULE 4: Never cache Next.js RSC data requests or Server Actions
  // These contain dynamic server-side component payloads or user session state
  if (
    url.searchParams.has('_rsc') ||
    request.headers.get('RSC') === '1' ||
    request.headers.get('Next-Action') ||
    request.headers.get('Next-Router-State-Tree')
  ) {
    return;
  }

  // RULE 5: Never cache requests with Authorization credentials
  if (request.headers.has('Authorization')) {
    return;
  }

  // RULE 6: Navigation requests (HTML pages) -> Network-First with Offline Fallback
  // Notice: The HTML response is NEVER saved into cache to avoid storing user-specific pages
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline').then((fallback) => {
          return (
            fallback ||
            new Response('Offline - The Golden Oak', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' },
            })
          );
        });
      })
    );
    return;
  }

  // RULE 7: Static Assets Only (3D Models, Images, Fonts, JS/CSS Chunks)
  // Cache-First strategy with network fallback and background cache update
  if (isStaticAsset(url)) {
    // Only cache same-origin assets to prevent cross-origin data leakage
    if (url.origin === self.location.origin) {
      event.respondWith(
        caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(request).then((networkResponse) => {
            // Verify valid response before caching
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          });
        })
      );
      return;
    }
  }

  // RULE 8: Fallthrough default -> Let browser handle normal network fetch directly without caching
  return;
});
