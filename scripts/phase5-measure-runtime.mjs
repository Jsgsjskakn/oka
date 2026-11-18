#!/usr/bin/env node
/**
 * THE GOLDEN OAK — PHASE 5 RUNTIME MEASUREMENT HARNESS
 * Agent 5: Full AR / VR / 3D QA, Debugging & Cross-Device Validation Engineer
 *
 * Runs live headless Chromium (puppeteer-core) diagnostics against the production server
 * at http://localhost:3000.
 *
 * Measures:
 *   1. Hardware WebGL renderer and vendor strings (unmasked debug info)
 *   2. Zero console errors, zero uncaught page errors, zero failed requests
 *   3. Windows viewports (1366x768, 1440x900, 1920x1080) and emulated Android/iOS profiles
 *   4. Routes: /3d/tandoori-paneer-pizza, /ar/tandoori-paneer-pizza, /booking, /menu
 *   5. Network download time, decode/first visible time, frame time (avg & p95), JS heap memory
 *   6. 0-GLB asset isolation verification on /menu
 *
 * Output: docs/phase5/PHASE5_BASELINE_MEASUREMENTS.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUT_FILE = path.join(PROJECT_ROOT, 'docs', 'phase5', 'PHASE5_BASELINE_MEASUREMENTS.json');

const CHROME_EXECUTABLE_CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

function resolveChromeExecutable() {
  for (const c of CHROME_EXECUTABLE_CANDIDATES) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Chrome/Chromium executable not found.');
}

export const DEVICE_PROFILES = [
  // Windows Viewports
  {
    id: 'windows-1366x768',
    label: 'Windows Desktop HD (1366x768 @1x)',
    category: 'windows-desktop',
    evidenceType: 'physically-measured',
    viewport: { width: 1366, height: 768, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    cpuThrottle: 1,
  },
  {
    id: 'windows-1440x900',
    label: 'Windows Desktop Standard (1440x900 @1x)',
    category: 'windows-desktop',
    evidenceType: 'physically-measured',
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    cpuThrottle: 1,
  },
  {
    id: 'windows-1920x1080',
    label: 'Windows Desktop FHD (1920x1080 @1x)',
    category: 'windows-desktop',
    evidenceType: 'physically-measured',
    viewport: { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    cpuThrottle: 1,
  },
  // Emulated Android Personas
  {
    id: 'emulated-android-low',
    label: 'Low-End Android (2GB RAM, 360x800 @2x, 4x CPU throttle)',
    category: 'android-emulated',
    evidenceType: 'browser-emulated',
    viewport: { width: 360, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Moto G Power) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    cpuThrottle: 4,
  },
  {
    id: 'emulated-android-mid',
    label: 'Mid-Range Android (6GB RAM, 412x915 @2.625x, 2x CPU throttle)',
    category: 'android-emulated',
    evidenceType: 'browser-emulated',
    viewport: { width: 412, height: 915, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 6a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    cpuThrottle: 2,
  },
  {
    id: 'emulated-android-flagship',
    label: 'High-End Android Flagship (12GB RAM, 412x915 @3x, 1x CPU)',
    category: 'android-emulated',
    evidenceType: 'browser-emulated',
    viewport: { width: 412, height: 915, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    cpuThrottle: 1,
  },
  // Emulated iOS Persona
  {
    id: 'emulated-ios-iphone',
    label: 'iOS iPhone Safari (390x844 @3x, Apple UA)',
    category: 'ios-emulated',
    evidenceType: 'browser-emulated',
    viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    cpuThrottle: 1,
  },
];

export const TARGET_ROUTES = [
  {
    id: '3d-tandoori-paneer-pizza',
    path: '/3d/tandoori-paneer-pizza',
    label: '3D Dish Viewer: Tandoori Paneer Pizza',
    expect3DCanvas: true,
  },
  {
    id: 'ar-tandoori-paneer-pizza',
    path: '/ar/tandoori-paneer-pizza',
    label: 'AR Dish Experience: Tandoori Paneer Pizza',
    expect3DCanvas: true,
  },
  {
    id: 'booking-3d',
    path: '/booking',
    label: '3D Interactive Floorplan Booking',
    expect3DCanvas: true,
  },
  {
    id: 'menu-catalog',
    path: '/menu',
    label: 'Menu Catalog (0-GLB Isolation)',
    expect3DCanvas: false,
    assertZero3DBytes: true,
  },
];

async function measureRoute(browser, profile, routeSpec) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  await page.setViewport(profile.viewport);
  await page.setUserAgent(profile.userAgent);

  const client = await page.target().createCDPSession();
  await client.send('Performance.enable');
  await client.send('Network.enable');
  await client.send('Network.setCacheDisabled', { cacheDisabled: true });

  if (profile.cpuThrottle > 1) {
    await client.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuThrottle });
  }

  const consoleErrors = [];
  const uncaughtPageErrors = [];
  const failedRequests = [];
  const modelTransfers = [];
  const allTransferredAssets = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore favicon or non-critical 404 noise if any
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', (err) => {
    uncaughtPageErrors.push(err.message || String(err));
  });

  page.on('requestfailed', (req) => {
    failedRequests.push({
      url: req.url(),
      errorText: req.failure()?.errorText || 'unknown',
    });
  });

  page.on('response', (res) => {
    const url = res.url();
    const headers = res.headers();
    const contentLength = parseInt(headers['content-length'] || '0', 10);
    allTransferredAssets.push({ url, size: contentLength });

    const lower = url.toLowerCase();
    if (lower.endsWith('.glb') || lower.endsWith('.gltf') || lower.endsWith('.usdz') || lower.includes('.glb?')) {
      modelTransfers.push({
        url,
        status: res.status(),
        sizeBytes: contentLength,
      });
    }
  });

  const url = `${BASE_URL}${routeSpec.path}`;
  const navStart = Date.now();
  let navigationMs = 0;
  let httpStatus = 0;

  try {
    const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    navigationMs = Date.now() - navStart;
    httpStatus = res ? res.status() : 200;
  } catch (err) {
    navigationMs = Date.now() - navStart;
    httpStatus = 500;
    uncaughtPageErrors.push(`Navigation failed: ${err.message}`);
  }

  // Wait for 3D canvas if expected
  let canvasDetected = false;
  let firstVisibleMs = navigationMs;
  if (routeSpec.expect3DCanvas) {
    try {
      await page.waitForSelector('canvas', { timeout: 8000 });
      canvasDetected = true;
      firstVisibleMs = Date.now() - navStart;
    } catch {
      canvasDetected = false;
    }
  }

  // Probe WebGL Renderer & Vendor strings
  const webglInfo = await page.evaluate(() => {
    try {
      const canvas = document.querySelector('canvas') || document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return { vendor: 'unsupported', renderer: 'unsupported', glVersion: 'none' };
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        glVersion: gl.getParameter(gl.VERSION),
      };
    } catch (e) {
      return { vendor: 'error', renderer: e.message, glVersion: 'error' };
    }
  });

  // Sample frame times over 60 requestAnimationFrame calls
  const frameMetrics = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const frameTimes = [];
      let lastTime = performance.now();
      let framesCounted = 0;

      function onFrame(now) {
        const delta = now - lastTime;
        lastTime = now;
        if (delta > 0 && delta < 500) {
          frameTimes.push(delta);
        }
        framesCounted++;
        if (framesCounted < 60) {
          requestAnimationFrame(onFrame);
        } else {
          frameTimes.sort((a, b) => a - b);
          const avgFrameMs = frameTimes.reduce((sum, v) => sum + v, 0) / (frameTimes.length || 1);
          const p95Idx = Math.floor(frameTimes.length * 0.95);
          const p95FrameMs = frameTimes[p95Idx] || avgFrameMs;
          const fps = avgFrameMs > 0 ? 1000 / avgFrameMs : 60;
          resolve({
            sampleCount: frameTimes.length,
            avgFrameMs: Number(avgFrameMs.toFixed(2)),
            p95FrameMs: Number(p95FrameMs.toFixed(2)),
            estimatedFps: Number(fps.toFixed(1)),
          });
        }
      }
      requestAnimationFrame(onFrame);
    });
  });

  // Read CDP Performance metrics (Memory & Timing)
  const { metrics: rawMetrics } = await client.send('Performance.getMetrics');
  const perfMap = {};
  for (const m of rawMetrics) {
    perfMap[m.name] = m.value;
  }

  const jsHeapUsedMB = Number(((perfMap['JSHeapUsedSize'] || 0) / (1024 * 1024)).toFixed(2));
  const jsHeapTotalMB = Number(((perfMap['JSHeapTotalSize'] || 0) / (1024 * 1024)).toFixed(2));

  // Check 0-GLB isolation
  const glbCount = modelTransfers.length;
  const zeroGlbPass = routeSpec.assertZero3DBytes ? glbCount === 0 : undefined;

  // Retrieve shared perf telemetry if present
  const perfTelemetry = await page.evaluate(() => {
    const g = window;
    return g.__GOLDEN_OAK_PERF__ || g.__GOLDEN_OAK_3D_TELEMETRY__ || null;
  });

  await client.detach().catch(() => {});
  await page.close().catch(() => {});
  await context.close().catch(() => {});

  return {
    routeId: routeSpec.id,
    path: routeSpec.path,
    label: routeSpec.label,
    httpStatus,
    navigationMs,
    firstVisibleMs,
    canvasDetected,
    webgl: webglInfo,
    frameMetrics,
    memory: {
      jsHeapUsedMB,
      jsHeapTotalMB,
    },
    network: {
      totalTransfers: allTransferredAssets.length,
      modelTransfersCount: glbCount,
      modelTransfers,
      zeroGlbVerified: zeroGlbPass,
    },
    hygiene: {
      consoleErrorsCount: consoleErrors.length,
      consoleErrors,
      uncaughtErrorsCount: uncaughtPageErrors.length,
      uncaughtErrors: uncaughtPageErrors,
      failedRequestsCount: failedRequests.length,
      failedRequests,
    },
    perfTelemetry,
  };
}

async function runAllBenchmarks() {
  const executablePath = resolveChromeExecutable();
  console.log('======================================================================');
  console.log('The Golden Oak — Phase 5 Live Headless Chromium Runtime Diagnostics');
  console.log(`Base Server URL : ${BASE_URL}`);
  console.log(`Chrome Binary   : ${executablePath}`);
  console.log(`Profiles (${DEVICE_PROFILES.length})   : ${DEVICE_PROFILES.map((p) => p.id).join(', ')}`);
  console.log(`Routes (${TARGET_ROUTES.length})     : ${TARGET_ROUTES.map((r) => r.path).join(', ')}`);
  console.log('======================================================================\n');

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=default',
    ],
  });

  const benchmarkStart = new Date().toISOString();
  const resultsByProfile = [];

  try {
    for (const profile of DEVICE_PROFILES) {
      console.log(`[PROFILE START] ${profile.label} (${profile.id})`);
      const routeResults = [];

      for (const route of TARGET_ROUTES) {
        process.stdout.write(`  Measuring ${route.path.padEnd(30)} ... `);
        const result = await measureRoute(browser, profile, route);
        routeResults.push(result);
        console.log(`HTTP ${result.httpStatus} | Nav: ${result.navigationMs}ms | FPS: ${result.frameMetrics.estimatedFps} | Heap: ${result.memory.jsHeapUsedMB}MB | Errors: ${result.hygiene.consoleErrorsCount}`);
      }

      resultsByProfile.push({
        profileId: profile.id,
        label: profile.label,
        category: profile.category,
        evidenceType: profile.evidenceType,
        viewport: profile.viewport,
        cpuThrottle: profile.cpuThrottle,
        routes: routeResults,
      });
      console.log(`[PROFILE COMPLETE] ${profile.id}\n`);
    }
  } finally {
    await browser.close();
  }

  // Extract canonical hardware WebGL info from the first Windows profile
  const winProfile = resultsByProfile.find((p) => p.category === 'windows-desktop');
  const hardwareWebgl = winProfile?.routes[0]?.webgl || { vendor: 'unknown', renderer: 'unknown' };

  const finalReport = {
    title: 'The Golden Oak — Phase 5 Baseline Runtime Measurements',
    generatedAt: new Date().toISOString(),
    benchmarkStart,
    baseUrl: BASE_URL,
    chromeExecutable: executablePath,
    hostHardwareWebGL: {
      vendor: hardwareWebgl.vendor,
      renderer: hardwareWebgl.renderer,
      glVersion: hardwareWebgl.glVersion,
      evidenceLabel: `physically-measured (Windows host, ${hardwareWebgl.renderer})`,
    },
    qualityContractSummary: {
      zeroConsoleErrorsEnforced: resultsByProfile.every((p) => p.routes.every((r) => r.hygiene.consoleErrorsCount === 0)),
      zeroPageErrorsEnforced: resultsByProfile.every((p) => p.routes.every((r) => r.hygiene.uncaughtErrorsCount === 0)),
      zeroFailedRequestsEnforced: resultsByProfile.every((p) => p.routes.every((r) => r.hygiene.failedRequestsCount === 0)),
      menuZeroGlbIsolationEnforced: resultsByProfile.every((p) => {
        const menuRoute = p.routes.find((r) => r.routeId === 'menu-catalog');
        return menuRoute ? menuRoute.network.modelTransfersCount === 0 : true;
      }),
    },
    profiles: resultsByProfile,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(finalReport, null, 2), 'utf8');

  console.log('======================================================================');
  console.log(`Baseline measurements successfully written to:`);
  console.log(`  ${OUT_FILE}`);
  console.log(`Host WebGL Renderer: ${hardwareWebgl.renderer}`);
  console.log(`Quality Contract Summary:`);
  console.log(`  - Zero Console Errors: ${finalReport.qualityContractSummary.zeroConsoleErrorsEnforced ? 'PASS' : 'FAIL'}`);
  console.log(`  - Zero Page Errors   : ${finalReport.qualityContractSummary.zeroPageErrorsEnforced ? 'PASS' : 'FAIL'}`);
  console.log(`  - Zero Failed Reqs   : ${finalReport.qualityContractSummary.zeroFailedRequestsEnforced ? 'PASS' : 'FAIL'}`);
  console.log(`  - Menu 0-GLB Isolation: ${finalReport.qualityContractSummary.menuZeroGlbIsolationEnforced ? 'PASS' : 'FAIL'}`);
  console.log('======================================================================\n');

  return finalReport;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAllBenchmarks().catch((err) => {
    console.error('Fatal benchmark error:', err);
    process.exit(1);
  });
}
