import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  MIN_AR_LIGHT_INTENSITY,
  MAX_AR_LIGHT_INTENSITY,
  WEBXR_RECOMMENDED_FEATURES,
  resolveAbsoluteAssetUrl,
  extractUsdzPath,
  resolveTieredModelPath,
  buildAndroidSceneViewerIntentUrl,
  evaluateIOSQuickLookCapability,
  probeWebXRCapability,
  detectARPlatformEnvironment,
  detectARCapabilityMatrix,
  estimateLightingFromRgba,
  hasMeaningfulLightChange,
  evaluateMotionStability,
} from '../src/lib/three/ar-capabilities.ts';

function fillRgba16x16(r, g, b, a = 255) {
  const buf = new Uint8ClampedArray(16 * 16 * 4);
  for (let i = 0; i < buf.length; i += 4) {
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = a;
  }
  return buf;
}

test('Agent 5: Cross-Platform AR Capabilities & Mobile Camera Pipeline Verification', async (t) => {
  await t.test('1. Android ARCore Scene Viewer Intent URL Generation', () => {
    const intentUrl = buildAndroidSceneViewerIntentUrl({
      glbUrl: '/models/warrior_model.glb',
      title: 'Tandoori Paneer & Truffle Pizza',
      fallbackUrl: 'https://thegoldenoak.in/ar/tandoori-paneer-pizza?table=4#top',
      baseOrigin: 'https://thegoldenoak.in',
      mode: 'ar_preferred',
    });

    assert.ok(
      intentUrl.startsWith('intent://arvr.google.com/scene-viewer/1.0?'),
      'Must start with official Google Scene Viewer intent scheme'
    );
    assert.ok(
      intentUrl.includes(
        `file=${encodeURIComponent('https://thegoldenoak.in/models/warrior_model.glb')}`
      ),
      'Must encode absolute HTTPS GLB file URL'
    );
    assert.ok(intentUrl.includes('mode=ar_preferred'), 'Must request ar_preferred mode');
    assert.ok(
      intentUrl.includes(`title=${encodeURIComponent('Tandoori Paneer & Truffle Pizza')}`),
      'Must properly URL-encode dish title special characters'
    );
    assert.ok(
      intentUrl.includes('package=com.google.android.googlequicksearchbox'),
      'Must target Google Search / ARCore Scene Viewer package'
    );
    assert.ok(
      intentUrl.includes('action=android.intent.action.VIEW'),
      'Must specify android.intent.action.VIEW'
    );
    assert.ok(
      intentUrl.includes(
        `S.browser_fallback_url=${encodeURIComponent('https://thegoldenoak.in/ar/tandoori-paneer-pizza?table=4#top')};end;`
      ),
      'Must safely URI-encode S.browser_fallback_url and terminate with ;end;'
    );

    assert.equal(
      buildAndroidSceneViewerIntentUrl({
        glbUrl: '   ',
        title: 'Empty',
        fallbackUrl: 'https://thegoldenoak.in/ar',
      }),
      '',
      'Must return empty string if glbUrl is missing'
    );
  });

  await t.test('2. iOS Safari AR Quick Look Readiness Logic (Strict Dual Check)', () => {
    // Case A: Browser supports rel="ar", but dish has NO .usdz asset authored yet
    const missingUsdz = evaluateIOSQuickLookCapability({
      supportsRelAr: true,
      usdzPath: null,
      baseOrigin: 'https://thegoldenoak.in',
    });
    assert.equal(missingUsdz.quickLookReady, false, 'Must NEVER mark Quick Look ready without USDZ');
    assert.equal(missingUsdz.supportsRelAr, true);
    assert.equal(missingUsdz.usdzUrl, null);
    assert.equal(missingUsdz.reason, 'missing-usdz-asset');

    // Case B: Browser supports rel="ar", but path points to .glb instead of .usdz
    const wrongExt = evaluateIOSQuickLookCapability({
      supportsRelAr: true,
      usdzPath: '/models/warrior_model.glb',
      baseOrigin: 'https://thegoldenoak.in',
    });
    assert.equal(wrongExt.quickLookReady, false);
    assert.equal(wrongExt.reason, 'invalid-usdz-extension');

    // Case C: Dish has valid .usdz path, but browser does NOT support rel="ar" (e.g. Android/Desktop)
    const unsupportedBrowser = evaluateIOSQuickLookCapability({
      supportsRelAr: false,
      usdzPath: '/models/tandoori-paneer-pizza.usdz',
      baseOrigin: 'https://thegoldenoak.in',
    });
    assert.equal(unsupportedBrowser.quickLookReady, false);
    assert.equal(unsupportedBrowser.reason, 'rel-ar-unsupported');

    // Case D: Both rel="ar" supported AND valid .usdz asset path configured
    const readyQuickLook = evaluateIOSQuickLookCapability({
      supportsRelAr: true,
      usdzPath: '/models/tandoori-paneer-pizza.usdz?v=2',
      baseOrigin: 'https://thegoldenoak.in',
    });
    assert.equal(readyQuickLook.quickLookReady, true);
    assert.equal(readyQuickLook.reason, 'ready');
    assert.equal(
      readyQuickLook.usdzUrl,
      'https://thegoldenoak.in/models/tandoori-paneer-pizza.usdz?v=2'
    );
  });

  await t.test('3. WebXR Probe & Cross-Platform Capability Matrix (Android, iOS, iPadOS, Desktop)', async () => {
    // 3a. Android Chrome with WebXR immersive-ar support
    const androidWebXRMatrix = await detectARCapabilityMatrix({
      glbPath: '/models/warrior_model.glb',
      usdzPath: null,
      dishTitle: 'Signature Smash Burger',
      baseOrigin: 'https://thegoldenoak.in',
      navigatorRef: {
        userAgent:
          'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
        platform: 'Linux armv81',
        maxTouchPoints: 5,
        xr: {
          isSessionSupported: async (mode) => mode === 'immersive-ar',
        },
        mediaDevices: {
          getUserMedia: async () => ({}),
          enumerateDevices: async () => [{ kind: 'videoinput', label: 'Back Camera' }],
        },
      },
      documentRef: {
        createElement: () => ({ relList: { supports: () => false } }),
      },
      windowRef: { innerWidth: 412, isSecureContext: true },
    });

    assert.equal(androidWebXRMatrix.platform.platformFamily, 'android');
    assert.equal(androidWebXRMatrix.webxr.supported, true);
    assert.deepEqual(androidWebXRMatrix.webxr.recommendedFeatures, WEBXR_RECOMMENDED_FEATURES);
    assert.equal(androidWebXRMatrix.sceneViewer.ready, true);
    assert.equal(androidWebXRMatrix.recommendedMode, 'webxr-immersive-ar');

    // 3b. Android Chrome/Browser without WebXR session support -> falls back to Camera AR + Scene Viewer
    const androidSceneViewerMatrix = await detectARCapabilityMatrix({
      glbPath: '/models/warrior_model.glb',
      usdzPath: null,
      dishTitle: 'Signature Smash Burger',
      baseOrigin: 'https://thegoldenoak.in',
      navigatorRef: {
        userAgent:
          'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
        platform: 'Linux armv81',
        maxTouchPoints: 5,
        xr: {
          isSessionSupported: async () => false,
        },
        mediaDevices: {
          getUserMedia: async () => ({}),
          enumerateDevices: async () => [{ kind: 'videoinput' }],
        },
      },
      documentRef: {
        createElement: () => ({ relList: { supports: () => false } }),
      },
      windowRef: { innerWidth: 390, isSecureContext: true },
    });

    assert.equal(androidSceneViewerMatrix.webxr.supported, false);
    assert.equal(androidSceneViewerMatrix.sceneViewer.ready, true);
    assert.equal(androidSceneViewerMatrix.recommendedMode, 'camera-ar-with-scene-viewer');

    // 3c. iOS Safari WITHOUT .usdz asset -> reports missing-usdz-asset honestly & enables in-browser Camera AR
    const iosNoUsdzMatrix = await detectARCapabilityMatrix({
      glbPath: '/models/warrior_model.glb',
      usdzPath: null,
      dishTitle: 'Tandoori Paneer Pizza',
      baseOrigin: 'https://thegoldenoak.in',
      navigatorRef: {
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        platform: 'iPhone',
        maxTouchPoints: 5,
        mediaDevices: {
          getUserMedia: async () => ({}),
          enumerateDevices: async () => [{ kind: 'videoinput' }],
        },
      },
      documentRef: {
        createElement: () => ({ relList: { supports: (token) => token === 'ar' } }),
      },
      windowRef: { innerWidth: 393, isSecureContext: true },
    });

    assert.equal(iosNoUsdzMatrix.platform.platformFamily, 'ios');
    assert.equal(iosNoUsdzMatrix.quickLook.quickLookReady, false);
    assert.equal(iosNoUsdzMatrix.quickLook.reason, 'missing-usdz-asset');
    assert.equal(iosNoUsdzMatrix.canRunInBrowserCameraAR, true);
    assert.equal(iosNoUsdzMatrix.recommendedMode, 'in-browser-camera-ar');

    // 3d. iPadOS 17+ Desktop-class UA (Macintosh + maxTouchPoints: 5) with .usdz authored
    const iPadOSMatrix = await detectARCapabilityMatrix({
      glbPath: '/models/warrior_model.glb',
      usdzPath: '/models/warrior_model.usdz',
      dishTitle: 'Tandoori Paneer Pizza',
      baseOrigin: 'https://thegoldenoak.in',
      navigatorRef: {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
        platform: 'MacIntel',
        maxTouchPoints: 5,
        mediaDevices: {
          getUserMedia: async () => ({}),
          enumerateDevices: async () => [{ kind: 'videoinput' }],
        },
      },
      documentRef: {
        createElement: () => ({ relList: { supports: (token) => token === 'ar' } }),
      },
      windowRef: { innerWidth: 1024, isSecureContext: true },
    });

    assert.equal(iPadOSMatrix.platform.platformFamily, 'ipados');
    assert.equal(iPadOSMatrix.platform.isIPadOS, true);
    assert.equal(iPadOSMatrix.platform.isDesktop, false);
    assert.equal(iPadOSMatrix.quickLook.quickLookReady, true);
    assert.equal(iPadOSMatrix.recommendedMode, 'camera-ar-with-quick-look');

    // 3e. Windows/macOS Desktop WITH webcam vs WITHOUT camera
    const desktopWithWebcam = await detectARCapabilityMatrix({
      glbPath: '/models/warrior_model.glb',
      navigatorRef: {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        platform: 'Win32',
        maxTouchPoints: 0,
        mediaDevices: {
          getUserMedia: async () => ({}),
          enumerateDevices: async () => [{ kind: 'videoinput', label: 'Integrated Webcam' }],
        },
      },
      windowRef: { innerWidth: 1440, isSecureContext: true },
    });
    assert.equal(desktopWithWebcam.platform.isDesktop, true);
    assert.equal(desktopWithWebcam.recommendedMode, 'desktop-3d-or-webcam');

    const desktopNoCamera = await detectARCapabilityMatrix({
      glbPath: '/models/warrior_model.glb',
      navigatorRef: {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        platform: 'MacIntel',
        maxTouchPoints: 0,
        mediaDevices: {
          getUserMedia: async () => ({}),
          enumerateDevices: async () => [{ kind: 'audioinput', label: 'Built-in Mic' }],
        },
      },
      windowRef: { innerWidth: 1728, isSecureContext: true },
    });
    assert.equal(desktopNoCamera.canRunInBrowserCameraAR, false);
    assert.equal(desktopNoCamera.recommendedMode, 'fallback-3d-only');

    // 3f. WebXR security rejection is caught gracefully
    const xrErrorProbe = await probeWebXRCapability({
      xr: {
        isSessionSupported: async () => {
          throw new Error('SecurityError: XR blocked by Permissions-Policy');
        },
      },
    });
    assert.equal(xrErrorProbe.supported, false);
    assert.equal(xrErrorProbe.reason, 'security-or-probe-error');
  });

  await t.test('4. Real-World 16x16 Luma & Color-Temperature Light Estimator Bounds [0.45, 1.65]', () => {
    // Pitch dark frame -> strictly clamped at MIN_AR_LIGHT_INTENSITY (0.45)
    const darkPixels = fillRgba16x16(0, 0, 0);
    const darkEst = estimateLightingFromRgba(darkPixels);
    assert.equal(darkEst.luma, 0);
    assert.equal(darkEst.ambientIntensity, MIN_AR_LIGHT_INTENSITY);
    assert.equal(darkEst.directionalIntensity, MIN_AR_LIGHT_INTENSITY);
    assert.equal(darkEst.hemisphereIntensity, MIN_AR_LIGHT_INTENSITY);
    assert.equal(darkEst.lightingLabel, 'dim-candlelight');

    // Pure white overexposed frame -> strictly clamped at MAX_AR_LIGHT_INTENSITY (1.65)
    const brightPixels = fillRgba16x16(255, 255, 255);
    const brightEst = estimateLightingFromRgba(brightPixels);
    assert.equal(brightEst.luma, 1);
    assert.ok(brightEst.ambientIntensity <= MAX_AR_LIGHT_INTENSITY);
    assert.equal(brightEst.directionalIntensity, MAX_AR_LIGHT_INTENSITY);
    assert.ok(brightEst.hemisphereIntensity <= MAX_AR_LIGHT_INTENSITY);
    assert.equal(brightEst.lightingLabel, 'bright-daylight');

    // Warm candlelit restaurant booth (amber-heavy RGB)
    const warmRestaurantPixels = fillRgba16x16(210, 140, 68);
    const warmEst = estimateLightingFromRgba(warmRestaurantPixels);
    assert.ok(warmEst.warmth > 0.25, `Expected positive warmth, got ${warmEst.warmth}`);
    assert.ok(warmEst.kelvinApprox < 4000, `Expected warm Kelvin < 4000K, got ${warmEst.kelvinApprox}`);
    assert.equal(warmEst.lightingLabel, 'warm-indoor');
    assert.ok(
      warmEst.ambientIntensity >= 0.45 && warmEst.ambientIntensity <= 1.65,
      'Warm ambient intensity must remain inside [0.45, 1.65]'
    );

    // Cool daylight patio window (blue-enriched RGB)
    const coolDaylightPixels = fillRgba16x16(165, 205, 250);
    const coolEst = estimateLightingFromRgba(coolDaylightPixels);
    assert.ok(coolEst.warmth < 0, `Expected cool negative warmth, got ${coolEst.warmth}`);
    assert.ok(coolEst.kelvinApprox > 4800, `Expected cool Kelvin > 4800K, got ${coolEst.kelvinApprox}`);

    // Temporal smoothing & meaningful change guard
    const smoothed = estimateLightingFromRgba(brightPixels, darkEst);
    assert.ok(
      smoothed.luma > 0.25 && smoothed.luma < 0.5,
      `Expected smoothed luma transition (~0.35), got ${smoothed.luma}`
    );
    assert.equal(hasMeaningfulLightChange(darkEst, smoothed), true);
    assert.equal(hasMeaningfulLightChange(warmEst, { ...warmEst }), false);
  });

  await t.test('5. Helper Utilities & Motion Stability Scoring', () => {
    assert.equal(
      resolveAbsoluteAssetUrl('/models/warrior_model.glb', 'https://thegoldenoak.in/'),
      'https://thegoldenoak.in/models/warrior_model.glb'
    );
    assert.equal(extractUsdzPath({ modelPath: '/models/a.glb' }), null);
    assert.equal(
      extractUsdzPath({ modelPath: '/models/a.glb', usdzPath: '/models/a.usdz' }),
      '/models/a.usdz'
    );
    assert.equal(
      resolveTieredModelPath(
        {
          modelPath: '/models/high.glb',
          lodPaths: { low: '/models/low.glb', medium: '/models/med.glb' },
        },
        'low'
      ),
      '/models/low.glb'
    );

    const steady = evaluateMotionStability({ accelDelta: 0.1, rotationRateDeg: 2 }, 1);
    assert.equal(steady.level, 'stable');
    assert.equal(steady.recommendRecenter, false);

    const shaky = evaluateMotionStability({ accelDelta: 7.5, rotationRateDeg: 180 }, 0.2);
    assert.equal(shaky.level, 'excessive-motion');
    assert.equal(shaky.recommendRecenter, true);

    const envProfile = detectARPlatformEnvironment({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; wv) Version/4.0 Chrome/127.0.0.0 Mobile Safari/537.36 Instagram',
      maxTouchPoints: 5,
    });
    assert.equal(envProfile.isAndroid, true);
    assert.equal(envProfile.isInAppWebView, true);
  });

  await t.test('6. Static Pipeline Audit: ARScene.tsx, CameraFeed.tsx, & ARViewer.tsx Bottleneck Elimination', () => {
    const arSceneSrc = fs.readFileSync(path.resolve('src/components/ar/ARScene.tsx'), 'utf8');
    const cameraFeedSrc = fs.readFileSync(path.resolve('src/components/ar/CameraFeed.tsx'), 'utf8');
    const arViewerSrc = fs.readFileSync(path.resolve('src/components/ar/ARViewer.tsx'), 'utf8');

    // 6a. preserveDrawingBuffer MUST be false (never true) in ARScene.tsx
    assert.match(
      arSceneSrc,
      /preserveDrawingBuffer:\s*false/,
      'ARScene.tsx must explicitly set preserveDrawingBuffer: false to eliminate TBDR mobile GPU copies'
    );
    assert.doesNotMatch(
      arSceneSrc,
      /preserveDrawingBuffer:\s*true/,
      'ARScene.tsx must NOT enable preserveDrawingBuffer: true'
    );

    // 6b. Synchronous snapshot bridge present
    assert.match(
      arSceneSrc,
      /gl\.render\s*\(\s*scene\s*,\s*camera\s*\)/,
      'ARScene.tsx must synchronously call gl.render(scene, camera) inside snapshot provider'
    );
    assert.match(
      arSceneSrc,
      /gl\.domElement\.toDataURL\s*\(\s*['"]image\/png['"]\s*\)/,
      'ARScene.tsx must extract PNG immediately after synchronous gl.render'
    );

    // 6c. Zero top-level useGLTF.preload in ARScene.tsx
    assert.doesNotMatch(
      arSceneSrc,
      /useGLTF\.preload\s*\(/,
      'ARScene.tsx must have ZERO module-scope useGLTF.preload calls'
    );

    // 6d. Demand frameloop + visibilitychange render suspension in ARScene.tsx
    assert.match(
      arSceneSrc,
      /frameloop=\{isPageHidden\s*\?\s*['"]never['"]\s*:\s*isAnimatingPlacement\s*\?\s*['"]always['"]\s*:\s*['"]demand['"]\}/,
      'ARScene.tsx must throttle frameloop to demand when idle and never when hidden'
    );
    assert.match(
      arSceneSrc,
      /addEventListener\s*\(\s*['"]visibilitychange['"]/,
      'ARScene.tsx must listen to visibilitychange'
    );
    assert.match(
      arSceneSrc,
      /removeEventListener\s*\(\s*['"]visibilitychange['"]/,
      'ARScene.tsx must clean up visibilitychange listener'
    );

    // 6e. No unbudgeted directional castShadow + per-instance cloned material disposal + telemetry
    assert.doesNotMatch(
      arSceneSrc,
      /<directionalLight[^>]*\bcastShadow\b/,
      'ARScene.tsx directionalLight must NOT use unbudgeted castShadow'
    );
    assert.match(
      arSceneSrc,
      /mat\.dispose\s*\(\s*\)/,
      'ARScene.tsx must dispose cloned per-instance materials on dish switch / unmount'
    );
    assert.match(
      arSceneSrc,
      /__GOLDEN_OAK_3D_TELEMETRY__/,
      'ARScene.tsx must publish metrics to window.__GOLDEN_OAK_3D_TELEMETRY__'
    );

    // 6f. CameraFeed.tsx suspends MediaStream tracks on visibilitychange & unmount
    assert.match(
      cameraFeedSrc,
      /addEventListener\s*\(\s*['"]visibilitychange['"]/,
      'CameraFeed.tsx must suspend camera hardware on visibilitychange'
    );
    assert.match(
      cameraFeedSrc,
      /removeEventListener\s*\(\s*['"]visibilitychange['"]/,
      'CameraFeed.tsx must clean up visibilitychange listener'
    );
    assert.match(
      cameraFeedSrc,
      /track\.stop\s*\(\s*\)/,
      'CameraFeed.tsx must stop hardware camera tracks on hide/unmount'
    );
    assert.match(
      cameraFeedSrc,
      /playsInline/,
      'CameraFeed.tsx must include playsInline for iOS Safari compatibility'
    );

    // 6g. ARViewer.tsx composites video + WebGL + Golden Oak watermark & runs 16x16 light estimation every 1500ms
    assert.match(
      arViewerSrc,
      /1500/,
      'ARViewer.tsx must sample 16x16 ambient camera lighting at 1500ms intervals'
    );
    assert.match(
      arViewerSrc,
      /THE GOLDEN OAK/,
      'ARViewer.tsx photo compositor must render Golden Oak watermark'
    );
    assert.match(
      arViewerSrc,
      /Re-center on Table/,
      'ARViewer.tsx must provide 1-tap Re-center on Table recovery UX'
    );
  });
});
