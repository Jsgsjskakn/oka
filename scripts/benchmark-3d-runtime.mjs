#!/usr/bin/env node
/**
 * Real Headless Chromium + CDP 3D Runtime Benchmark Harness for The Golden Oak
 * ============================================================================
 * Profiles real un-mocked runtime telemetry across 5 device personas and all
 * key routes (/, /menu, /3d/golden-oak-signature-burger, /ar, /ar/golden-oak-signature-burger, /booking):
 *   1. Exact cold-cache network bytes transferred (Total, JS, .glb, Draco WASM/JS, .hdr, Images)
 *   2. WebGL frame pacing (Active Orbit FPS, P95 frame time ms) & True GPU Idle Sleep (0 WebGL frames/s)
 *   3. CDP Performance metrics (JSHeapUsedSize, JSHeapTotalSize, ScriptDuration, TaskDuration) & Long Tasks >50ms
 *   4. Live `window.__GOLDEN_OAK_3D_TELEMETRY__` snapshots (draw calls, triangles, geometries, textures, tier, DPR)
 *
 * Usage:
 *   node scripts/benchmark-3d-runtime.mjs --url http://localhost:3000
 *   node scripts/benchmark-3d-runtime.mjs --url http://localhost:3000 --out ./measured_runtime_benchmarks.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const DEFAULT_OUT_PATH =
  'C:\\Users\\Pyiush Gupta\\.gemini\\antigravity\\brain\\22cb5c35-3043-4ba7-a662-5d1b3225baa2\\measured_runtime_benchmarks.json';

export const DEVICE_PERSONAS = [
  {
    id: 'low-end-android',
    label: 'Low-end Android (2GB RAM, 4x CPU throttle, Fast 3G/4G, 360x800 @2x)',
    viewport: {
      width: 360,
      height: 800,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    },
    userAgent:
      'Mozilla/5.0 (Linux; Android 11; Moto G Power) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    cpuThrottle: 4,
    deviceMemory: 2,
    hardwareConcurrency: 4,
    network: {
      offline: false,
      // Fast 3G / entry 4G (~1.6 Mbps down, 750 Kbps up, 150ms RTT)
      downloadThroughput: Math.floor((1.6 * 1024 * 1024) / 8),
      uploadThroughput: Math.floor((750 * 1024) / 8),
      latency: 150,
      effectiveType: '3g',
      saveData: false,
    },
  },
  {
    id: 'mid-range-android',
    label: 'Mid-range Android (6GB RAM, 2x CPU throttle, 4G, 412x915 @2.625x)',
    viewport: {
      width: 412,
      height: 915,
      deviceScaleFactor: 2.625,
      isMobile: true,
      hasTouch: true,
    },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 6a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    cpuThrottle: 2,
    deviceMemory: 6,
    hardwareConcurrency: 6,
    network: {
      offline: false,
      // Regular 4G (~9 Mbps down, 1.5 Mbps up, 70ms RTT)
      downloadThroughput: Math.floor((9 * 1024 * 1024) / 8),
      uploadThroughput: Math.floor((1.5 * 1024 * 1024) / 8),
      latency: 70,
      effectiveType: '4g',
      saveData: false,
    },
  },
  {
    id: 'high-end-android',
    label: 'High-end Android (12GB RAM, 1x CPU, WiFi, 412x915 @3x)',
    viewport: {
      width: 412,
      height: 915,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    cpuThrottle: 1,
    deviceMemory: 12,
    hardwareConcurrency: 8,
    network: {
      offline: false,
      downloadThroughput: Math.floor((30 * 1024 * 1024) / 8),
      uploadThroughput: Math.floor((15 * 1024 * 1024) / 8),
      latency: 20,
      effectiveType: '4g',
      saveData: false,
    },
  },
  {
    id: 'ios-iphone-safari',
    label: 'iOS iPhone Safari Profile (390x844 @3x, Apple Mobile UA)',
    viewport: {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    cpuThrottle: 1,
    deviceMemory: 4,
    hardwareConcurrency: 6,
    network: {
      offline: false,
      downloadThroughput: Math.floor((20 * 1024 * 1024) / 8),
      uploadThroughput: Math.floor((10 * 1024 * 1024) / 8),
      latency: 30,
      effectiveType: '4g',
      saveData: false,
    },
  },
  {
    id: 'desktop-high-fidelity',
    label: 'Desktop High-Fidelity (1440x900 @1.5x)',
    viewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1.5,
      isMobile: false,
      hasTouch: false,
    },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    cpuThrottle: 1,
    deviceMemory: 16,
    hardwareConcurrency: 12,
    network: {
      offline: false,
      downloadThroughput: Math.floor((100 * 1024 * 1024) / 8),
      uploadThroughput: Math.floor((50 * 1024 * 1024) / 8),
      latency: 5,
      effectiveType: '4g',
      saveData: false,
    },
  },
];

export const BENCHMARK_ROUTES = [
  {
    id: 'home',
    path: '/',
    expectsCanvasInitially: false,
    scrollToLazy3D: true,
    pauseAutoRotateSelector: 'button[title="Pause auto-rotation"], button[aria-label="Pause rotation"]',
  },
  {
    id: 'menu',
    path: '/menu',
    expectsCanvasInitially: false,
    assertZero3DBytes: true,
  },
  {
    id: 'dish-3d-viewer',
    path: '/3d/golden-oak-signature-burger',
    expectsCanvasInitially: true,
    pauseAutoRotateSelector: 'button[aria-label*="Pause" i], button[title*="Rotate" i]',
  },
  {
    id: 'ar-lounge',
    path: '/ar',
    expectsCanvasInitially: false,
  },
  {
    id: 'ar-dish-scene',
    path: '/ar/golden-oak-signature-burger',
    expectsCanvasInitially: true,
  },
  {
    id: 'booking-floorplan',
    path: '/booking',
    expectsCanvasInitially: true,
  },
];

function parseArgs(argv) {
  const opts = {
    baseUrl: 'http://localhost:3000',
    outPath: DEFAULT_OUT_PATH,
    personaFilter: null,
    routeFilter: null,
    help: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg === '--url' && argv[i + 1]) {
      opts.baseUrl = argv[++i].replace(/\/+$/, '');
    } else if (arg.startsWith('--url=')) {
      opts.baseUrl = arg.slice('--url='.length).replace(/\/+$/, '');
    } else if (arg === '--out' && argv[i + 1]) {
      opts.outPath = path.resolve(argv[++i]);
    } else if (arg.startsWith('--out=')) {
      opts.outPath = path.resolve(arg.slice('--out='.length));
    } else if (arg === '--personas' && argv[i + 1]) {
      opts.personaFilter = argv[++i]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (arg === '--routes' && argv[i + 1]) {
      opts.routeFilter = argv[++i]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return opts;
}

export function resolveChromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(
    `Could not locate a local Chrome/Edge executable. Set CHROME_PATH env var. Checked: ${candidates.join(', ')}`
  );
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function summarizeNetworkRecords(records) {
  let totalBytes = 0;
  let jsBytes = 0;
  let glbBytes = 0;
  let dracoBytes = 0;
  let hdrBytes = 0;
  let imageBytes = 0;
  let cssAndFontBytes = 0;
  const fetched3DAssets = [];

  for (const rec of records.values()) {
    const bytes = Math.max(0, rec.finishedBytes ?? rec.streamedBytes ?? 0);
    totalBytes += bytes;

    const cleanUrl = (rec.url || '').split('?')[0].toLowerCase();
    const mime = (rec.mimeType || '').toLowerCase();

    const isGlb = cleanUrl.endsWith('.glb') || cleanUrl.endsWith('.gltf') || mime.includes('gltf');
    const isDraco =
      cleanUrl.includes('/draco/') ||
      cleanUrl.includes('draco_decoder') ||
      cleanUrl.includes('draco_wasm') ||
      cleanUrl.endsWith('.wasm');
    const isHdr = cleanUrl.endsWith('.hdr') || cleanUrl.endsWith('.exr');

    if (isGlb) {
      glbBytes += bytes;
      fetched3DAssets.push({ type: 'glb', url: rec.url, bytes, status: rec.status ?? 0 });
    } else if (isDraco) {
      dracoBytes += bytes;
      fetched3DAssets.push({ type: 'draco', url: rec.url, bytes, status: rec.status ?? 0 });
    } else if (isHdr) {
      hdrBytes += bytes;
      fetched3DAssets.push({ type: 'hdr', url: rec.url, bytes, status: rec.status ?? 0 });
    } else if (cleanUrl.endsWith('.js') || cleanUrl.endsWith('.mjs') || mime.includes('javascript')) {
      jsBytes += bytes;
    } else if (
      mime.startsWith('image/') ||
      /\.(png|jpe?g|webp|avif|gif|svg|ico)$/.test(cleanUrl)
    ) {
      imageBytes += bytes;
    } else if (
      mime.includes('css') ||
      mime.includes('font') ||
      /\.(css|woff2?|ttf|otf)$/.test(cleanUrl)
    ) {
      cssAndFontBytes += bytes;
    }
  }

  return {
    requestCount: records.size,
    totalBytes,
    totalKB: Number((totalBytes / 1024).toFixed(1)),
    jsBytes,
    jsKB: Number((jsBytes / 1024).toFixed(1)),
    glbBytes,
    glbKB: Number((glbBytes / 1024).toFixed(1)),
    dracoBytes,
    dracoKB: Number((dracoBytes / 1024).toFixed(1)),
    hdrBytes,
    hdrKB: Number((hdrBytes / 1024).toFixed(1)),
    imageBytes,
    imageKB: Number((imageBytes / 1024).toFixed(1)),
    cssAndFontBytes,
    zero3DAssetsTransferred: glbBytes === 0 && dracoBytes === 0 && hdrBytes === 0,
    fetched3DAssets,
  };
}

function extractCdpPerfMetrics(metricsList) {
  const map = {};
  for (const item of metricsList || []) {
    map[item.name] = item.value;
  }
  return {
    jsHeapUsedBytes: map.JSHeapUsedSize ?? 0,
    jsHeapUsedMB: Number(((map.JSHeapUsedSize ?? 0) / (1024 * 1024)).toFixed(2)),
    jsHeapTotalBytes: map.JSHeapTotalSize ?? 0,
    jsHeapTotalMB: Number(((map.JSHeapTotalSize ?? 0) / (1024 * 1024)).toFixed(2)),
    scriptDurationSec: Number((map.ScriptDuration ?? 0).toFixed(3)),
    taskDurationSec: Number((map.TaskDuration ?? 0).toFixed(3)),
    layoutDurationSec: Number((map.LayoutDuration ?? 0).toFixed(3)),
    recalcStyleDurationSec: Number((map.RecalcStyleDuration ?? 0).toFixed(3)),
    domNodes: map.Nodes ?? 0,
    jsEventListeners: map.JSEventListeners ?? 0,
  };
}

async function sampleActiveOrbitAndFrames(page, durationMs = 1500) {
  const hasVisibleCanvas = await page.evaluate(() => {
    const canvases = Array.from(document.querySelectorAll('canvas'));
    const visible = canvases.find((c) => {
      const r = c.getBoundingClientRect();
      return r.width > 40 && r.height > 40;
    });
    const target = visible || canvases[0];
    if (!target) return false;
    target.scrollIntoView({ behavior: 'instant', block: 'center' });
    return true;
  });

  if (!hasVisibleCanvas) {
    return {
      canvasFound: false,
      avgRafFps: 0,
      webglRenderedFps: 0,
      webglRenderedFrames: 0,
      webglDrawCalls: 0,
      p95FrameTimeMs: 0,
      maxFrameTimeMs: 0,
      droppedFramesOver33ms: 0,
    };
  }

  // Run in-page rAF + WebGL draw-frame sampler concurrently with direct canvas PointerEvents
  // (dispatching directly on canvas avoids accidentally clicking overlapping <a href> overlays)
  return page.evaluate((sampleMs) => {
    return new Promise((resolve) => {
      const canvases = Array.from(document.querySelectorAll('canvas'));
      const target =
        canvases.find((c) => c.getBoundingClientRect().width > 40) || canvases[0];
      const rect = target ? target.getBoundingClientRect() : { left: 180, top: 300, width: 200, height: 200 };
      const startX = rect.left + rect.width * 0.3;
      const endX = rect.left + rect.width * 0.7;
      const centerY = rect.top + rect.height * 0.5;

      const emitPtr = (type, clientX, clientY, buttons) => {
        if (!target) return;
        const ev = new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'touch',
          isPrimary: true,
          clientX,
          clientY,
          buttons,
        });
        target.dispatchEvent(ev);
        if (type !== 'pointerdown') {
          document.dispatchEvent(ev);
        }
      };

      const w = window;
      const startDraws = w.__GOLDEN_OAK_WEBGL_DRAW_CALLS__ || 0;
      const startFrames = w.__GOLDEN_OAK_WEBGL_RENDER_FRAMES__ || 0;
      const deltas = [];
      let prev = performance.now();
      const start = prev;
      let dragEnded = false;

      emitPtr('pointerdown', startX, centerY, 1);

      function tick(now) {
        deltas.push(now - prev);
        prev = now;
        const progress = Math.min(1, (now - start) / (sampleMs * 0.75));
        if (progress < 1) {
          const x = startX + (endX - startX) * progress;
          const y = centerY + Math.sin(progress * Math.PI) * 12;
          emitPtr('pointermove', x, y, 1);
        } else if (!dragEnded) {
          dragEnded = true;
          emitPtr('pointerup', endX, centerY, 0);
        }

        if (now - start < sampleMs) {
          requestAnimationFrame(tick);
        } else {
          if (!dragEnded) {
            emitPtr('pointerup', endX, centerY, 0);
          }
          const elapsedSec = Math.max(0.001, (now - start) / 1000);
          const sorted = [...deltas].slice(1).sort((a, b) => a - b);
          const p95 =
            sorted.length > 0
              ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
              : 0;
          const max = sorted.length > 0 ? sorted[sorted.length - 1] : 0;
          const dropped = sorted.filter((d) => d > 33.4).length;
          const endFrames = w.__GOLDEN_OAK_WEBGL_RENDER_FRAMES__ || 0;
          const endDraws = w.__GOLDEN_OAK_WEBGL_DRAW_CALLS__ || 0;
          const webglFrames = Math.max(0, endFrames - startFrames);

          resolve({
            canvasFound: true,
            avgRafFps: Number((sorted.length / elapsedSec).toFixed(1)),
            webglRenderedFps: Number((webglFrames / elapsedSec).toFixed(1)),
            webglRenderedFrames: webglFrames,
            webglDrawCalls: Math.max(0, endDraws - startDraws),
            p95FrameTimeMs: Number(p95.toFixed(2)),
            maxFrameTimeMs: Number(max.toFixed(2)),
            droppedFramesOver33ms: dropped,
          });
        }
      }
      requestAnimationFrame(tick);
    });
  }, durationMs);
}

async function sampleIdleWebglSleep(page, idleWindowMs = 1400) {
  // Let OrbitControls damping settle first (~900ms) before measuring stillness idle window
  await sleep(950);

  return page.evaluate((windowMs) => {
    return new Promise((resolve) => {
      const w = window;
      const startFrames = w.__GOLDEN_OAK_WEBGL_RENDER_FRAMES__ || 0;
      const startDraws = w.__GOLDEN_OAK_WEBGL_DRAW_CALLS__ || 0;
      const startTs = performance.now();

      setTimeout(() => {
        const elapsedSec = Math.max(0.001, (performance.now() - startTs) / 1000);
        const endFrames = w.__GOLDEN_OAK_WEBGL_RENDER_FRAMES__ || 0;
        const endDraws = w.__GOLDEN_OAK_WEBGL_DRAW_CALLS__ || 0;
        const renderedFrames = Math.max(0, endFrames - startFrames);
        const drawCalls = Math.max(0, endDraws - startDraws);
        const idleWebglFps = Number((renderedFrames / elapsedSec).toFixed(2));
        resolve({
          sampleDurationMs: windowMs,
          idleWebglRenderedFrames: renderedFrames,
          idleWebglDrawCalls: drawCalls,
          idleWebglFps,
          confirmedZeroGpuSleep: renderedFrames === 0,
        });
      }, windowMs);
    });
  }, idleWindowMs);
}

async function profileRouteForPersona(browser, baseUrl, persona, routeSpec) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const client = await page.createCDPSession();

  const networkRecords = new Map();

  client.on('Network.requestWillBeSent', (evt) => {
    if (!networkRecords.has(evt.requestId)) {
      networkRecords.set(evt.requestId, {
        url: evt.request?.url || '',
        resourceType: evt.type || 'Other',
        mimeType: '',
        status: null,
        streamedBytes: 0,
        finishedBytes: null,
      });
    }
  });

  client.on('Network.responseReceived', (evt) => {
    const rec = networkRecords.get(evt.requestId) || {
      url: evt.response?.url || '',
      resourceType: evt.type || 'Other',
      streamedBytes: 0,
      finishedBytes: null,
    };
    rec.url = evt.response?.url || rec.url;
    rec.mimeType = evt.response?.mimeType || rec.mimeType || '';
    rec.status = evt.response?.status ?? rec.status;
    networkRecords.set(evt.requestId, rec);
  });

  client.on('Network.dataReceived', (evt) => {
    const rec = networkRecords.get(evt.requestId);
    if (rec) {
      rec.streamedBytes += evt.encodedDataLength || evt.dataLength || 0;
    }
  });

  client.on('Network.loadingFinished', (evt) => {
    const rec = networkRecords.get(evt.requestId);
    if (rec) {
      rec.finishedBytes = evt.encodedDataLength ?? rec.streamedBytes;
    }
  });

  try {
    await client.send('Performance.enable');
    await client.send('Network.enable');
    await client.send('Network.setCacheDisabled', { cacheDisabled: true });
    await client.send('Emulation.setCPUThrottlingRate', { rate: persona.cpuThrottle });
    await client.send('Network.emulateNetworkConditions', {
      offline: persona.network.offline,
      latency: persona.network.latency,
      downloadThroughput: persona.network.downloadThroughput,
      uploadThroughput: persona.network.uploadThroughput,
    });
    await client.send('Emulation.setUserAgentOverride', {
      userAgent: persona.userAgent,
      platform: persona.id.includes('ios')
        ? 'iPhone'
        : persona.viewport.isMobile
          ? 'Linux armv8l'
          : 'Win32',
    });
    await page.setViewport(persona.viewport);

    // Pre-navigation instrumentation: hardware caps, preloader bypass, LongTask observer, & WebGL draw counter
    await page.evaluateOnNewDocument(
      (hwCaps) => {
        try {
          sessionStorage.setItem('tgo_cinematic_preloader_seen', 'true');
        } catch {
          // Ignore storage sandbox errors
        }

        try {
          Object.defineProperty(navigator, 'deviceMemory', {
            get: () => hwCaps.deviceMemory,
            configurable: true,
          });
          Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => hwCaps.hardwareConcurrency,
            configurable: true,
          });
          Object.defineProperty(navigator, 'connection', {
            get: () => ({
              effectiveType: hwCaps.effectiveType,
              saveData: hwCaps.saveData,
              rtt: hwCaps.latency,
              downlink: Number(((hwCaps.downloadThroughput * 8) / (1024 * 1024)).toFixed(2)),
              addEventListener: () => {},
              removeEventListener: () => {},
            }),
            configurable: true,
          });
        } catch {
          // Ignore property redefinition failures
        }

        window.__GOLDEN_OAK_LONGTASKS__ = [];
        if (typeof PerformanceObserver !== 'undefined') {
          try {
            const obs = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                window.__GOLDEN_OAK_LONGTASKS__.push({
                  startTime: Number(entry.startTime.toFixed(1)),
                  duration: Number(entry.duration.toFixed(1)),
                });
              }
            });
            obs.observe({ type: 'longtask', buffered: true });
          } catch {
            // LongTask observer unsupported
          }
        }

        // Ground-truth WebGL draw-call & distinct rendered-frame counter
        window.__GOLDEN_OAK_WEBGL_DRAW_CALLS__ = 0;
        window.__GOLDEN_OAK_WEBGL_RENDER_FRAMES__ = 0;
        let lastDrawFrameStamp = -1;

        const hookWebGLProto = (Proto) => {
          if (!Proto || Proto.__goldenOakHooked) return;
          Proto.__goldenOakHooked = true;
          for (const method of [
            'drawElements',
            'drawArrays',
            'drawElementsInstanced',
            'drawArraysInstanced',
          ]) {
            const orig = Proto[method];
            if (typeof orig === 'function') {
              Proto[method] = function (...args) {
                window.__GOLDEN_OAK_WEBGL_DRAW_CALLS__ += 1;
                const nowBucket = Math.floor(performance.now() / 6);
                if (nowBucket !== lastDrawFrameStamp) {
                  lastDrawFrameStamp = nowBucket;
                  window.__GOLDEN_OAK_WEBGL_RENDER_FRAMES__ += 1;
                }
                return orig.apply(this, args);
              };
            }
          }
        };

        if (typeof WebGLRenderingContext !== 'undefined') {
          hookWebGLProto(WebGLRenderingContext.prototype);
        }
        if (typeof WebGL2RenderingContext !== 'undefined') {
          hookWebGLProto(WebGL2RenderingContext.prototype);
        }
      },
      {
        deviceMemory: persona.deviceMemory,
        hardwareConcurrency: persona.hardwareConcurrency,
        effectiveType: persona.network.effectiveType,
        saveData: persona.network.saveData,
        latency: persona.network.latency,
        downloadThroughput: persona.network.downloadThroughput,
      }
    );

    const targetUrl = `${baseUrl}${routeSpec.path}`;
    const navStart = Date.now();
    const response = await page.goto(targetUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    const navDurationMs = Date.now() - navStart;
    const httpStatus = response ? response.status() : 0;

    // Settle initial hydration / lazy Suspense chunks
    await sleep(routeSpec.expectsCanvasInitially ? 2800 : 1000);

    const initialNetwork = summarizeNetworkRecords(networkRecords);

    let afterScrollNetwork = null;
    if (routeSpec.scrollToLazy3D) {
      // Scroll smoothly to ARPromoSection to trigger IntersectionObserver lazy 3D mount
      await page.evaluate(() => {
        const rotateBtn = document.querySelector('button[aria-label="Toggle auto-rotate"]');
        const promoHeading =
          document.getElementById('ar-promo-heading') ||
          rotateBtn?.closest('section') ||
          Array.from(document.querySelectorAll('section')).find((s) =>
            s.textContent?.includes('Interactive 3D Experience')
          );
        if (promoHeading) {
          promoHeading.scrollIntoView({ behavior: 'instant', block: 'center' });
        } else {
          window.scrollTo(0, Math.floor(document.body.scrollHeight * 0.55));
        }
      });
      try {
        await page.waitForSelector('canvas', { timeout: 15000 });
      } catch {
        // Fallback if canvas takes longer on 3G
      }
      await sleep(persona.cpuThrottle >= 4 ? 4500 : 2500);
      afterScrollNetwork = summarizeNetworkRecords(networkRecords);
    } else if (routeSpec.expectsCanvasInitially) {
      try {
        await page.waitForSelector('canvas', { timeout: 18000 });
      } catch {
        // Record gracefully even if WebGL fallback UI triggered
      }
      await sleep(persona.cpuThrottle >= 4 ? 3500 : 1800);
    }

    const finalNetwork = afterScrollNetwork || summarizeNetworkRecords(networkRecords);

    // Measure Active Orbit FPS if a canvas exists on this route
    const hasCanvas = await page.evaluate(() => document.querySelectorAll('canvas').length > 0);
    let activeOrbitMetrics = null;
    let idleSleepMetrics = null;

    if (hasCanvas) {
      activeOrbitMetrics = await sampleActiveOrbitAndFrames(page, 1400);

      // If route has an optional continuous auto-rotate button (e.g., ARPromoSection / DishViewer),
      // pause auto-rotate before testing demand-loop idle stillness sleep
      if (routeSpec.pauseAutoRotateSelector) {
        await page.evaluate((selector) => {
          const candidates = Array.from(document.querySelectorAll(selector));
          for (const btn of candidates) {
            if (!(btn instanceof HTMLElement)) continue;
            const ariaPressed = btn.getAttribute('aria-pressed');
            const title = btn.getAttribute('title') || '';
            const label = btn.getAttribute('aria-label') || '';
            // Only click if rotation is currently active (never toggle an idle paused turntable ON)
            if (ariaPressed === 'true' || /pause/i.test(title) || /pause/i.test(label)) {
              btn.click();
              break;
            }
          }
        }, routeSpec.pauseAutoRotateSelector);
      }

      idleSleepMetrics = await sampleIdleWebglSleep(page, 1400);
    }

    // Collect CDP Performance metrics, LongTasks (>50ms), and window.__GOLDEN_OAK_3D_TELEMETRY__
    const { metrics: rawPerfMetrics } = await client.send('Performance.getMetrics');
    const cdpPerf = extractCdpPerfMetrics(rawPerfMetrics);

    const pageRuntimeState = await page.evaluate(() => {
      const longTasks = Array.isArray(window.__GOLDEN_OAK_LONGTASKS__)
        ? window.__GOLDEN_OAK_LONGTASKS__
        : [];
      const totalBlockingTimeMs = longTasks.reduce(
        (sum, t) => sum + Math.max(0, (t.duration || 0) - 50),
        0
      );
      const maxLongTaskMs = longTasks.reduce((m, t) => Math.max(m, t.duration || 0), 0);

      return {
        canvasCount: document.querySelectorAll('canvas').length,
        totalWebglDrawCallsCumulative: window.__GOLDEN_OAK_WEBGL_DRAW_CALLS__ || 0,
        totalWebglRenderFramesCumulative: window.__GOLDEN_OAK_WEBGL_RENDER_FRAMES__ || 0,
        longTasks: {
          count: longTasks.length,
          totalBlockingTimeMs: Number(totalBlockingTimeMs.toFixed(1)),
          maxDurationMs: Number(maxLongTaskMs.toFixed(1)),
        },
        sceneTelemetry: window.__GOLDEN_OAK_3D_TELEMETRY__ || {},
      };
    });

    return {
      routeId: routeSpec.id,
      path: routeSpec.path,
      httpStatus,
      navigationMs: navDurationMs,
      initialAboveFoldNetwork: routeSpec.scrollToLazy3D ? initialNetwork : undefined,
      network: finalNetwork,
      menuZero3DVerified: routeSpec.assertZero3DBytes
        ? finalNetwork.zero3DAssetsTransferred
        : undefined,
      canvasCount: pageRuntimeState.canvasCount,
      activeOrbit: activeOrbitMetrics,
      idleSleep: idleSleepMetrics,
      cdpPerformance: cdpPerf,
      longTasks: pageRuntimeState.longTasks,
      webglCumulative: {
        drawCalls: pageRuntimeState.totalWebglDrawCallsCumulative,
        renderedFrames: pageRuntimeState.totalWebglRenderFramesCumulative,
      },
      sceneTelemetry: pageRuntimeState.sceneTelemetry,
    };
  } finally {
    try {
      await client.detach();
    } catch {
      // Ignore detach error
    }
    await context.close();
  }
}

export async function runBenchmarks(options = {}) {
  const opts = {
    baseUrl: options.baseUrl || 'http://localhost:3000',
    outPath: options.outPath || DEFAULT_OUT_PATH,
    personaFilter: options.personaFilter || null,
    routeFilter: options.routeFilter || null,
  };

  const executablePath = resolveChromeExecutable();
  const personas = opts.personaFilter
    ? DEVICE_PERSONAS.filter((p) => opts.personaFilter.includes(p.id))
    : DEVICE_PERSONAS;
  const routes = opts.routeFilter
    ? BENCHMARK_ROUTES.filter((r) => opts.routeFilter.includes(r.id) || opts.routeFilter.includes(r.path))
    : BENCHMARK_ROUTES;

  console.log('======================================================================');
  console.log('The Golden Oak — Real Headless Chromium + CDP 3D Runtime Benchmark');
  console.log(`Target Base URL : ${opts.baseUrl}`);
  console.log(`Chrome Binary   : ${executablePath}`);
  console.log(`Personas (${personas.length})    : ${personas.map((p) => p.id).join(', ')}`);
  console.log(`Routes (${routes.length})      : ${routes.map((r) => r.path).join(', ')}`);
  console.log('======================================================================');

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--enable-precise-memory-info',
      '--js-flags=--expose-gc',
    ],
  });

  const startedAt = new Date().toISOString();
  const resultsByPersona = {};

  try {
    for (const persona of personas) {
      console.log(`\n[Persona] ${persona.label}`);
      const routeResults = {};

      for (const routeSpec of routes) {
        process.stdout.write(`  -> Profiling ${routeSpec.path} ... `);
        const res = await profileRouteForPersona(browser, opts.baseUrl, persona, routeSpec);
        routeResults[routeSpec.path] = res;

        const orbitSummary = res.activeOrbit
          ? `orbit=${res.activeOrbit.webglRenderedFps}fps (rAF ${res.activeOrbit.avgRafFps}fps), idle=${res.idleSleep?.idleWebglFps ?? 'n/a'}fps`
          : 'no-canvas';
        console.log(
          `HTTP ${res.httpStatus} | total=${res.network.totalKB}KB (glb=${res.network.glbKB}KB, draco=${res.network.dracoKB}KB, hdr=${res.network.hdrKB}KB) | heap=${res.cdpPerformance.jsHeapUsedMB}MB | ${orbitSummary}`
        );
      }

      resultsByPersona[persona.id] = {
        persona: {
          id: persona.id,
          label: persona.label,
          viewport: persona.viewport,
          cpuThrottle: persona.cpuThrottle,
          deviceMemoryGB: persona.deviceMemory,
          hardwareConcurrency: persona.hardwareConcurrency,
          network: persona.network,
        },
        routes: routeResults,
      };
    }
  } finally {
    await browser.close();
  }

  const output = {
    generatedAt: new Date().toISOString(),
    startedAt,
    baseUrl: opts.baseUrl,
    chromeExecutable: executablePath,
    methodology:
      'Real Headless Chromium + Chrome DevTools Protocol (Performance.getMetrics, Network.loadingFinished with cache disabled, Emulation.setCPUThrottlingRate, Network.emulateNetworkConditions, PerformanceObserver longtask, WebGLRenderingContext draw-frame instrumentation, and window.__GOLDEN_OAK_3D_TELEMETRY__). Zero mocked or estimated metrics.',
    personas: resultsByPersona,
  };

  fs.mkdirSync(path.dirname(opts.outPath), { recursive: true });
  fs.writeFileSync(opts.outPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\nSaved measured runtime benchmarks to: ${opts.outPath}`);

  return output;
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectExecution) {
  const cliOpts = parseArgs(process.argv);
  if (cliOpts.help) {
    console.log(
      [
        'Usage: node scripts/benchmark-3d-runtime.mjs [options]',
        '',
        'Options:',
        '  --url <url>          Base server URL (default: http://localhost:3000)',
        `  --out <path>         Output JSON path (default: ${DEFAULT_OUT_PATH})`,
        '  --personas <ids>     Optional comma-separated persona IDs',
        '  --routes <paths>     Optional comma-separated route IDs or paths',
        '  --help, -h           Show this help message',
      ].join('\n')
    );
    process.exit(0);
  }

  runBenchmarks(cliOpts).catch((err) => {
    console.error('[benchmark-3d-runtime] Fatal error:', err);
    process.exit(1);
  });
}
