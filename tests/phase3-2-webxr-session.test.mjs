/**
 * THE GOLDEN OAK — Phase 3.2 WebXR Session & State Machine Automated Test Suite
 * Sub-Agent 5 (QA & Regression Engineer)
 *
 * Verifies:
 * 1. Support checking logic (secure context, missing xr, unsupported mode, probe error, supported)
 * 2. Session initialization fallback candidates (Tier 1 full down to Tier 4 bare hit-test)
 * 3. Graceful requestSession fallback ladder with mocked navigator.xr
 * 4. Pure state machine transitions: scanning -> surface-detected -> placed -> tracking-limited (anchor preserved!) -> recovered -> reposition -> session-ended
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  checkWebXRImmersiveArSupport,
  buildSessionInitCandidates,
  requestWebXRImmersiveArSession,
  initialXRTrackingState,
  xrTrackingReducer,
  DEFAULT_REQUIRED_FEATURES,
  DEFAULT_OPTIONAL_FEATURES,
} from '../src/lib/xr/webxr-session.ts';

test('Phase 3.2 — WebXR Session Negotiation & Tracking State Machine', async (t) => {
  await t.test('1. WebXR Support Probing (checkWebXRImmersiveArSupport)', async () => {
    // A. Insecure context
    const insecureRes = await checkWebXRImmersiveArSupport({}, false);
    assert.equal(insecureRes.supported, false);
    assert.equal(insecureRes.isSecureContext, false);
    assert.equal(insecureRes.reason, 'insecure-context');

    // B. Missing navigator.xr API (e.g. desktop non-XR browser or Safari)
    const missingXrRes = await checkWebXRImmersiveArSupport({}, true);
    assert.equal(missingXrRes.supported, false);
    assert.equal(missingXrRes.hasXRApi, false);
    assert.equal(missingXrRes.reason, 'xr-api-missing');

    // C. Device where immersive-ar is unsupported
    const unsupportedNav = {
      xr: {
        isSessionSupported: async (mode) => mode === 'inline',
      },
    };
    const unsupportedRes = await checkWebXRImmersiveArSupport(unsupportedNav, true);
    assert.equal(unsupportedRes.supported, false);
    assert.equal(unsupportedRes.hasXRApi, true);
    assert.equal(unsupportedRes.reason, 'immersive-ar-unsupported');

    // D. Probe error (e.g. security/permission exception)
    const errorNav = {
      xr: {
        isSessionSupported: async () => {
          throw new Error('Permission query denied');
        },
      },
    };
    const errorRes = await checkWebXRImmersiveArSupport(errorNav, true);
    assert.equal(errorRes.supported, false);
    assert.equal(errorRes.reason, 'probe-error');

    // E. Supported (Android Chrome + ARCore)
    const supportedNav = {
      xr: {
        isSessionSupported: async (mode) => mode === 'immersive-ar',
      },
    };
    const supportedRes = await checkWebXRImmersiveArSupport(supportedNav, true);
    assert.equal(supportedRes.supported, true);
    assert.equal(supportedRes.hasXRApi, true);
    assert.equal(supportedRes.reason, 'supported');
  });

  await t.test('2. Candidate Feature Profiles Generation & Fallback Tiers', () => {
    assert.deepEqual(DEFAULT_REQUIRED_FEATURES, ['hit-test'], 'hit-test must be the default required feature');
    assert.ok(DEFAULT_OPTIONAL_FEATURES.includes('anchors'), 'anchors must be an optional feature');
    assert.ok(DEFAULT_OPTIONAL_FEATURES.includes('dom-overlay'), 'dom-overlay must be an optional feature');
    assert.ok(DEFAULT_OPTIONAL_FEATURES.includes('light-estimation'), 'light-estimation must be optional');

    // Without DOM overlay root
    const candidatesNoOverlay = buildSessionInitCandidates();
    assert.equal(candidatesNoOverlay.length, 4, 'Must create 4 progressive fallback tiers');
    assert.deepEqual(candidatesNoOverlay[0].requiredFeatures, ['hit-test']);
    assert.deepEqual(candidatesNoOverlay[3], { requiredFeatures: ['hit-test'] }, 'Tier 4 must be bare hit-test only');

    // With DOM overlay root
    const dummyElement = { id: 'overlay-root' };
    const candidatesWithOverlay = buildSessionInitCandidates({ domOverlayRoot: dummyElement });
    assert.equal(candidatesWithOverlay.length, 4);
    assert.ok(candidatesWithOverlay[0].domOverlay, 'Tier 1 must specify domOverlay when root is provided');
    assert.ok(candidatesWithOverlay[0].optionalFeatures.includes('dom-overlay'));
    assert.deepEqual(candidatesWithOverlay[3], { requiredFeatures: ['hit-test'] }, 'Tier 4 bare candidate has no overlay requirement');
  });

  await t.test('3. requestWebXRImmersiveArSession Graceful Degradation Ladder', async () => {
    // Missing XR API throws
    await assert.rejects(
      async () => requestWebXRImmersiveArSession({ navigatorRef: {} }),
      /WebXR API.*not available/
    );

    // Tier 1 direct success
    const mockSession = { mode: 'immersive-ar', id: 'session-123' };
    const successNav = {
      xr: {
        requestSession: async (mode, init) => {
          assert.equal(mode, 'immersive-ar');
          assert.deepEqual(init.requiredFeatures, ['hit-test']);
          return mockSession;
        },
      },
    };
    const res1 = await requestWebXRImmersiveArSession({ navigatorRef: successNav });
    assert.equal(res1, mockSession);

    // Tier 1 & 2 reject (e.g. experimental depth-sensing / light-estimation unsupported), Tier 3 succeeds
    let attempts = 0;
    const fallbackNav = {
      xr: {
        requestSession: async (mode, init) => {
          attempts++;
          if (attempts < 3) {
            throw new Error(`Unsupported optional feature in tier ${attempts}`);
          }
          return { ...mockSession, fallbackTier: attempts };
        },
      },
    };
    const resFallback = await requestWebXRImmersiveArSession({ navigatorRef: fallbackNav });
    assert.equal(resFallback.fallbackTier, 3, 'Should successfully fall back to Tier 3');
    assert.equal(attempts, 3, 'Should have made exactly 3 attempts');

    // All tiers reject throws the final error
    const allFailNav = {
      xr: {
        requestSession: async () => {
          throw new Error('User denied immersive-ar permission');
        },
      },
    };
    await assert.rejects(
      async () => requestWebXRImmersiveArSession({ navigatorRef: allFailNav }),
      /User denied immersive-ar permission/
    );
  });

  await t.test('4. XR Tracking State Machine Pure Reducer Transitions', () => {
    // Initial state
    let state = { ...initialXRTrackingState };
    assert.equal(state.status, 'idle');
    assert.equal(state.isPlaced, false);
    assert.equal(state.placementRecord, null);

    // 1. Support Check
    state = xrTrackingReducer(state, { type: 'START_CHECK' });
    assert.equal(state.status, 'checking-support');

    state = xrTrackingReducer(state, { type: 'SUPPORT_RESOLVED', supported: false, reason: 'No XR' });
    assert.equal(state.status, 'unsupported');
    assert.equal(state.errorMessage, 'No XR');

    state = xrTrackingReducer(state, { type: 'SUPPORT_RESOLVED', supported: true });
    assert.equal(state.status, 'idle');
    assert.equal(state.errorMessage, null);

    // 2. Session Request & Denial
    state = xrTrackingReducer(state, { type: 'REQUEST_SESSION' });
    assert.equal(state.status, 'requesting-session');

    state = xrTrackingReducer(state, { type: 'SESSION_DENIED', error: 'User dismissed prompt' });
    assert.equal(state.status, 'session-denied');
    assert.equal(state.errorMessage, 'User dismissed prompt');

    // 3. Session Start -> Scanning
    state = xrTrackingReducer(state, { type: 'SESSION_STARTED' });
    assert.equal(state.status, 'scanning');
    assert.equal(state.hasViewerPose, false);
    assert.equal(state.hasHorizontalSurface, false);

    // Viewer pose found
    state = xrTrackingReducer(state, { type: 'VIEWER_POSE_FOUND' });
    assert.equal(state.hasViewerPose, true);
    assert.equal(state.status, 'scanning');

    // Surface detected
    state = xrTrackingReducer(state, { type: 'SURFACE_HIT' });
    assert.equal(state.status, 'surface-detected');
    assert.equal(state.hasHorizontalSurface, true);

    // Surface momentarily lost during scanning
    state = xrTrackingReducer(state, { type: 'SURFACE_LOST' });
    assert.equal(state.status, 'scanning');
    assert.equal(state.hasHorizontalSurface, false);

    // Surface re-detected
    state = xrTrackingReducer(state, { type: 'SURFACE_HIT' });
    assert.equal(state.status, 'surface-detected');

    // 4. Dish Placed
    const mockPlacementRecord = {
      dishSlug: 'tandoori-paneer-pizza',
      anchorKind: 'xr-anchor',
      initialPoseMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -1, 1],
      userScale: 1.0,
      userYawRad: 0,
      placedAtMs: Date.now(),
    };
    state = xrTrackingReducer(state, { type: 'DISH_PLACED', record: mockPlacementRecord });
    assert.equal(state.status, 'placed');
    assert.equal(state.isPlaced, true);
    assert.deepEqual(state.placementRecord, mockPlacementRecord);

    // Crucial invariant: when dish is placed, temporary SURFACE_LOST does NOT dislodge it
    state = xrTrackingReducer(state, { type: 'SURFACE_LOST' });
    assert.equal(state.status, 'placed', 'Placed dish must remain placed even if hit-test is lost');
    assert.equal(state.isPlaced, true);

    // 5. Tracking Limited (camera covered / user moves too quickly)
    // CRITICAL: MUST PRESERVE ANCHOR AND PLACEMENT RECORD!
    state = xrTrackingReducer(state, { type: 'TRACKING_LIMITED', reason: 'pose-lost' });
    assert.equal(state.status, 'tracking-limited');
    assert.equal(state.trackingLimitedReason, 'pose-lost');
    assert.equal(state.isPlaced, true, 'Placed status must remain true during tracking interruption');
    assert.deepEqual(state.placementRecord, mockPlacementRecord, 'Placement record must NEVER be wiped during tracking loss');

    // Tracking recovers
    state = xrTrackingReducer(state, { type: 'TRACKING_RECOVERED' });
    assert.equal(state.status, 'placed', 'Recovers cleanly back to placed state');
    assert.equal(state.trackingLimitedReason, null);

    // 6. User repositions dish
    state = xrTrackingReducer(state, { type: 'REPOSITION_REQUESTED' });
    assert.equal(state.isPlaced, false, 'Reposition clears placed flag');
    assert.equal(state.placementRecord, null, 'Reposition clears placement record');
    // If surface was active, transitions to surface-detected; else scanning
    assert.ok(state.status === 'surface-detected' || state.status === 'scanning');

    // 7. Session Ended
    state = xrTrackingReducer(state, { type: 'SESSION_ENDED' });
    assert.equal(state.status, 'session-ended');
    assert.equal(state.isPlaced, false);
    assert.equal(state.placementRecord, null);
    assert.equal(state.hasViewerPose, false);

    // 8. General Error
    state = xrTrackingReducer(state, { type: 'ERROR', error: 'WebGL context crashed' });
    assert.equal(state.status, 'error');
    assert.equal(state.errorMessage, 'WebGL context crashed');
  });
});
