/**
 * THE GOLDEN OAK — WebXR Session Manager & Tracking State Machine
 * Sub-Agent 1: AR Tracking & Spatial Architect (Phase 3.2)
 *
 * Implements genuine WebXR `immersive-ar` session negotiation with fallback ladders
 * and a pure, fully unit-testable tracking state machine compliant with `spatial-contract.ts`.
 */

import type {
  XRTrackingState,
  PlacementRecord,
} from './spatial-contract';

export interface WebXRSupportCheckResult {
  supported: boolean;
  isSecureContext: boolean;
  hasXRApi: boolean;
  reason:
    | 'supported'
    | 'insecure-context'
    | 'xr-api-missing'
    | 'immersive-ar-unsupported'
    | 'probe-error';
}

export interface RequestXRSessionOptions {
  domOverlayRoot?: HTMLElement | null;
  requiredFeatures?: string[];
  optionalFeatures?: string[];
  navigatorRef?: unknown;
}

export const DEFAULT_REQUIRED_FEATURES: readonly string[] = ['hit-test'];
export const DEFAULT_OPTIONAL_FEATURES: readonly string[] = [
  'anchors',
  'dom-overlay',
  'light-estimation',
  'local-floor',
  'depth-sensing',
];

/**
 * Checks whether WebXR `immersive-ar` is supported on the current device and environment.
 * Pure and mockable via optional navigatorRef and windowRef.
 */
export async function checkWebXRImmersiveArSupport(
  navigatorRef?: unknown,
  isSecureContextOverride?: boolean
): Promise<WebXRSupportCheckResult> {
  const isSecure =
    typeof isSecureContextOverride === 'boolean'
      ? isSecureContextOverride
      : typeof window !== 'undefined'
      ? Boolean(window.isSecureContext)
      : true;

  if (!isSecure) {
    return {
      supported: false,
      isSecureContext: false,
      hasXRApi: false,
      reason: 'insecure-context',
    };
  }

  const nav =
    navigatorRef !== undefined
      ? (navigatorRef as { xr?: { isSessionSupported?: (mode: string) => Promise<boolean> } })
      : typeof navigator !== 'undefined'
      ? (navigator as { xr?: { isSessionSupported?: (mode: string) => Promise<boolean> } })
      : null;

  if (!nav?.xr || typeof nav.xr.isSessionSupported !== 'function') {
    return {
      supported: false,
      isSecureContext: true,
      hasXRApi: false,
      reason: 'xr-api-missing',
    };
  }

  try {
    const supported = await nav.xr.isSessionSupported('immersive-ar');
    return {
      supported: Boolean(supported),
      isSecureContext: true,
      hasXRApi: true,
      reason: supported ? 'supported' : 'immersive-ar-unsupported',
    };
  } catch {
    return {
      supported: false,
      isSecureContext: true,
      hasXRApi: true,
      reason: 'probe-error',
    };
  }
}

/**
 * Feature request candidate tiers for graceful degradation.
 * If experimental features (like depth-sensing or local-floor) cause requestSession to reject,
 * we step down through conservative feature profiles.
 */
export function buildSessionInitCandidates(
  options: RequestXRSessionOptions = {}
): XRSessionInit[] {
  const root = options.domOverlayRoot ?? undefined;
  const domOverlayFeature = root ? ({ root } as unknown as XRDOMOverlayInit) : undefined;

  const candidates: XRSessionInit[] = [];

  // Tier 1: Full candidate (hit-test + anchors + dom-overlay + light-estimation + local-floor + depth-sensing)
  const fullOptional = [
    'anchors',
    ...(root ? ['dom-overlay'] : []),
    'light-estimation',
    'local-floor',
    'depth-sensing',
  ];
  const tier1: Record<string, unknown> = {
    requiredFeatures: options.requiredFeatures ?? [...DEFAULT_REQUIRED_FEATURES],
    optionalFeatures: fullOptional,
  };
  if (domOverlayFeature) {
    tier1.domOverlay = domOverlayFeature;
  }
  candidates.push(tier1 as XRSessionInit);

  // Tier 2: Core spatial candidate (hit-test + anchors + dom-overlay + light-estimation)
  const coreOptional = [
    'anchors',
    ...(root ? ['dom-overlay'] : []),
    'light-estimation',
  ];
  const tier2: Record<string, unknown> = {
    requiredFeatures: ['hit-test'],
    optionalFeatures: coreOptional,
  };
  if (domOverlayFeature) {
    tier2.domOverlay = domOverlayFeature;
  }
  candidates.push(tier2 as XRSessionInit);

  // Tier 3: Minimal UI candidate (hit-test + dom-overlay)
  const tier3: Record<string, unknown> = {
    requiredFeatures: ['hit-test'],
    optionalFeatures: root ? ['dom-overlay'] : [],
  };
  if (domOverlayFeature) {
    tier3.domOverlay = domOverlayFeature;
  }
  candidates.push(tier3 as XRSessionInit);

  // Tier 4: Bare hit-test only
  candidates.push({
    requiredFeatures: ['hit-test'],
  });

  return candidates;
}

/**
 * Requests a genuine WebXR `immersive-ar` session with graceful retry across feature tiers.
 */
export async function requestWebXRImmersiveArSession(
  options: RequestXRSessionOptions = {}
): Promise<XRSession> {
  const nav =
    options.navigatorRef !== undefined
      ? (options.navigatorRef as { xr?: { requestSession: (mode: string, init?: XRSessionInit) => Promise<XRSession> } })
      : typeof navigator !== 'undefined'
      ? (navigator as { xr?: { requestSession: (mode: string, init?: XRSessionInit) => Promise<XRSession> } })
      : null;

  if (!nav?.xr || typeof nav.xr.requestSession !== 'function') {
    throw new Error('WebXR API (navigator.xr.requestSession) is not available in this environment');
  }

  const candidates = buildSessionInitCandidates(options);
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    try {
      const session = await nav.xr.requestSession('immersive-ar', candidate);
      return session;
    } catch (err) {
      lastError = err as Error;
      // Step down to next conservative candidate
    }
  }

  throw lastError ?? new Error('WebXR immersive-ar session request failed across all feature tiers');
}

// ---------------------------------------------------------------------------
// Pure State Machine & Reducer for XR Tracking
// ---------------------------------------------------------------------------

export interface XRTrackingStateMachine {
  status: XRTrackingState;
  errorMessage: string | null;
  isSupported: boolean | null;
  hasViewerPose: boolean;
  hasHorizontalSurface: boolean;
  isPlaced: boolean;
  placementRecord: PlacementRecord | null;
  trackingLimitedReason: 'pose-lost' | 'emulated-position' | null;
}

export const initialXRTrackingState: XRTrackingStateMachine = {
  status: 'idle',
  errorMessage: null,
  isSupported: null,
  hasViewerPose: false,
  hasHorizontalSurface: false,
  isPlaced: false,
  placementRecord: null,
  trackingLimitedReason: null,
};

export type XRTrackingAction =
  | { type: 'START_CHECK' }
  | { type: 'SUPPORT_RESOLVED'; supported: boolean; reason?: string }
  | { type: 'REQUEST_SESSION' }
  | { type: 'SESSION_STARTED' }
  | { type: 'SESSION_DENIED'; error: string }
  | { type: 'VIEWER_POSE_FOUND' }
  | { type: 'SURFACE_HIT' }
  | { type: 'SURFACE_LOST' }
  | { type: 'DISH_PLACED'; record: PlacementRecord }
  | { type: 'TRACKING_LIMITED'; reason: 'pose-lost' | 'emulated-position' }
  | { type: 'TRACKING_RECOVERED' }
  | { type: 'REPOSITION_REQUESTED' }
  | { type: 'SESSION_ENDED' }
  | { type: 'ERROR'; error: string };

/**
 * Pure reducer that strictly enforces valid state transitions according to spatial-contract.ts.
 */
export function xrTrackingReducer(
  state: XRTrackingStateMachine,
  action: XRTrackingAction
): XRTrackingStateMachine {
  switch (action.type) {
    case 'START_CHECK':
      return {
        ...state,
        status: 'checking-support',
        errorMessage: null,
      };

    case 'SUPPORT_RESOLVED':
      return {
        ...state,
        status: action.supported ? 'idle' : 'unsupported',
        isSupported: action.supported,
        errorMessage: action.supported ? null : action.reason ?? 'WebXR immersive-ar unsupported',
      };

    case 'REQUEST_SESSION':
      return {
        ...state,
        status: 'requesting-session',
        errorMessage: null,
      };

    case 'SESSION_STARTED':
      return {
        ...state,
        status: 'scanning',
        hasViewerPose: false,
        hasHorizontalSurface: false,
        isPlaced: false,
        placementRecord: null,
        trackingLimitedReason: null,
        errorMessage: null,
      };

    case 'SESSION_DENIED':
      return {
        ...state,
        status: 'session-denied',
        errorMessage: action.error,
      };

    case 'VIEWER_POSE_FOUND':
      if (state.status === 'tracking-limited') {
        return {
          ...state,
          status: state.isPlaced ? 'placed' : state.hasHorizontalSurface ? 'surface-detected' : 'scanning',
          hasViewerPose: true,
          trackingLimitedReason: null,
        };
      }
      return {
        ...state,
        hasViewerPose: true,
      };

    case 'SURFACE_HIT':
      if (state.status === 'placed' || state.status === 'tracking-limited') {
        return { ...state, hasHorizontalSurface: true };
      }
      return {
        ...state,
        status: 'surface-detected',
        hasHorizontalSurface: true,
      };

    case 'SURFACE_LOST':
      if (state.status === 'placed' || state.status === 'tracking-limited') {
        return { ...state, hasHorizontalSurface: false };
      }
      return {
        ...state,
        status: 'scanning',
        hasHorizontalSurface: false,
      };

    case 'DISH_PLACED':
      return {
        ...state,
        status: 'placed',
        isPlaced: true,
        placementRecord: action.record,
      };

    case 'TRACKING_LIMITED':
      return {
        ...state,
        status: 'tracking-limited',
        trackingLimitedReason: action.reason,
      };

    case 'TRACKING_RECOVERED':
      return {
        ...state,
        status: state.isPlaced ? 'placed' : state.hasHorizontalSurface ? 'surface-detected' : 'scanning',
        trackingLimitedReason: null,
      };

    case 'REPOSITION_REQUESTED':
      return {
        ...state,
        status: state.hasHorizontalSurface ? 'surface-detected' : 'scanning',
        isPlaced: false,
        placementRecord: null,
      };

    case 'SESSION_ENDED':
      return {
        ...state,
        status: 'session-ended',
        hasViewerPose: false,
        hasHorizontalSurface: false,
        isPlaced: false,
        placementRecord: null,
        trackingLimitedReason: null,
      };

    case 'ERROR':
      return {
        ...state,
        status: 'error',
        errorMessage: action.error,
      };

    default:
      return state;
  }
}

export const requestWebXRSession = requestWebXRImmersiveArSession;

