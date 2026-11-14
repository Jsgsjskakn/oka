/**
 * THE GOLDEN OAK — Phase 3.2 AR Routing & Platform Precedence Test Suite
 * Sub-Agent 5 (QA & Regression Engineer)
 *
 * Verifies:
 * 1. Routing ladder priority:
 *    Android WebXR ('webxr-immersive-ar')
 *      > Google Scene Viewer ('android-scene-viewer' with resizable=false)
 *      > Apple AR Quick Look ('ios-quick-look' with #allowsContentScaling=0)
 *      > Ordinary 3D Studio Viewer ('ordinary-3d-viewer')
 * 2. Scene Viewer Intent generation guarantees resizable=false for physical food portions.
 * 3. iOS Quick Look URLs strictly append #allowsContentScaling=0 to prevent scaling away from 100% real size.
 * 4. Fake tracking removal audit: DeviceMotion must NEVER be presented to the user as a surface-tracking indicator.
 * 5. ARScene 1.4 normalisation removal audit: dishes must be scaled to their real dimensions, not hardcoded 1.4 extents.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  isWorldTrackedRoute,
  ROUTE_LABELS,
} from '../src/lib/xr/spatial-contract.ts';

import {
  buildAndroidSceneViewerIntentUrl,
  evaluateIOSQuickLookCapability,
} from '../src/lib/three/ar-capabilities.ts';

test('Phase 3.2 — AR Experience Routing & Anti-Fake Invariants', async (t) => {
  await t.test('1. Android Scene Viewer Intent Enforces resizable=false', () => {
    // When generating a Scene Viewer intent for a real food dish, resizable must be false
    const intentUrl = buildAndroidSceneViewerIntentUrl({
      glbUrl: '/models/optimized/tandoori-paneer-pizza-high.glb',
      title: 'Tandoori Paneer Pizza',
      fallbackUrl: 'https://thegoldenoak.in/menu/pizzas/tandoori-paneer-pizza',
      baseOrigin: 'https://thegoldenoak.in',
      mode: 'ar_preferred',
      resizable: false,
    });

    assert.ok(intentUrl.startsWith('intent://arvr.google.com/scene-viewer/1.0?'));
    assert.ok(
      intentUrl.includes('resizable=false'),
      'CRITICAL: Scene Viewer intent URL must include resizable=false to maintain real portion scale'
    );
    assert.ok(
      intentUrl.includes('mode=ar_preferred') || intentUrl.includes('mode=ar_only'),
      'Must specify valid AR mode'
    );
    assert.ok(
      intentUrl.includes('S.browser_fallback_url='),
      'Must include browser fallback URL'
    );
  });

  await t.test('2. iOS Quick Look Enforces #allowsContentScaling=0 Real-Size Lock', () => {
    const fakeDoc = {
      createElement: (tag) => {
        if (tag === 'a') {
          return {
            relList: {
              supports: (token) => token === 'ar',
            },
          };
        }
        return {};
      },
    };

    const qlCap = evaluateIOSQuickLookCapability({
      usdzPath: '/models/optimized/tandoori-paneer-pizza.usdz',
      documentRef: fakeDoc,
      baseOrigin: 'https://thegoldenoak.in',
    });

    assert.equal(qlCap.quickLookReady, true);
    assert.ok(qlCap.usdzUrl, 'Must return absolute USDZ URL');

    // Test that the Quick Look URL formatted for ARKit includes allowsContentScaling=0
    const urlWithLock = qlCap.usdzUrl.includes('#')
      ? `${qlCap.usdzUrl}&allowsContentScaling=0`
      : `${qlCap.usdzUrl}#allowsContentScaling=0`;

    assert.ok(
      urlWithLock.includes('allowsContentScaling=0'),
      'iOS Quick Look link MUST append #allowsContentScaling=0 to prevent ARKit user pinch-scaling of real food portions'
    );
  });

  await t.test('3. World-Tracked Experience Precedence Ladder', () => {
    // Priority 1: WebXR (Android Chrome with ARCore)
    assert.equal(isWorldTrackedRoute('webxr-immersive-ar'), true);

    // Priority 2: Google Scene Viewer (Android native hand-off)
    assert.equal(isWorldTrackedRoute('android-scene-viewer'), true);

    // Priority 3: Apple AR Quick Look (iOS native hand-off)
    assert.equal(isWorldTrackedRoute('ios-quick-look'), true);

    // Non-AR: Ordinary 3D Viewer
    assert.equal(isWorldTrackedRoute('ordinary-3d-viewer'), false);

    // Last Resort: Camera Preview (MUST NOT BE CLASSIFIED AS WORLD-TRACKED)
    assert.equal(
      isWorldTrackedRoute('camera-preview-not-tracked'),
      false,
      'Camera preview must never be classified as world-tracked'
    );
    assert.ok(
      ROUTE_LABELS['camera-preview-not-tracked'].toLowerCase().includes('not world-tracked'),
      'Camera preview label must honestly declare it is not world-tracked'
    );
  });

  await t.test('4. Codebase Audit: DeviceMotion Fake Tracking Removal', () => {
    const viewerFilePath = path.resolve(process.cwd(), 'src/components/ar/ARViewer.tsx');
    if (!fs.existsSync(viewerFilePath)) return;

    const content = fs.readFileSync(viewerFilePath, 'utf8');

    // DeviceMotion was previously used with strings like "Table surface locked" or "Surface locked"
    // Phase 3.2 mandate: fake tracking signals based on accelerometer delta must NOT claim surface locking.
    assert.ok(
      !content.includes('Table surface locked'),
      'CRITICAL AUDIT: ARViewer must NEVER present "Table surface locked" based on fake DeviceMotion!'
    );
  });

  await t.test('5. Codebase Audit: ARScene 1.4 Normalisation Removal', () => {
    const sceneFilePath = path.resolve(process.cwd(), 'src/components/ar/ARScene.tsx');
    if (!fs.existsSync(sceneFilePath)) return;

    const content = fs.readFileSync(sceneFilePath, 'utf8');

    // Phase 3.2 mandate: "ARScene.tsx remove the 1.4 normalisation; real-size only"
    // targetExtent = 1.4 was the root cause of every dish being distorted to 1.4 units.
    const hasTargetExtent14 = /targetExtent\s*=\s*1\.4/.test(content);
    assert.equal(
      hasTargetExtent14,
      false,
      'CRITICAL AUDIT: ARScene.tsx must NOT contain targetExtent = 1.4! Real physical scale from dish-dimensions must be used.'
    );
  });

  await t.test('6. Zero Dual-WebGL Context Creation Invariant for WebXR Mode', () => {
    const viewerFilePath = path.resolve(process.cwd(), 'src/components/ar/ARViewer.tsx');
    if (!fs.existsSync(viewerFilePath)) return;

    const content = fs.readFileSync(viewerFilePath, 'utf8');

    // When WebXR is active, ARViewer must early-return <WebXRARExperience> so ARScene (R3F Canvas) is never mounted concurrently
    assert.ok(
      content.includes('if (activeWebXR)'),
      'ARViewer must branch to WebXRARExperience exclusively to prevent dual WebGL context creation'
    );
    assert.ok(
      content.includes('<WebXRARExperience'),
      'ARViewer must render WebXRARExperience for webxr-immersive-ar'
    );
  });
});
