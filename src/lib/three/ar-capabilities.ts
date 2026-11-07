/**
 * Cross-Platform AR Capability Detection, Native Launchers, & Real-World Light Estimation
 *
 * Designed for The Golden Oak spatial dining pipeline:
 * 1. Honest feature-first capability detection (WebXR `immersive-ar`, Android ARCore Scene Viewer,
 *    iOS Safari AR Quick Look `<a rel="ar">`, MediaDevices camera availability).
 * 2. Standards-compliant Android Scene Viewer `intent://` URI builder with safe fallback URL.
 * 3. Strict iOS Quick Look readiness guard requiring BOTH `relList.supports('ar')` AND a verified
 *    non-null `.usdz` asset path so users never hit broken 404 USDZ links.
 * 4. Lightweight 16x16 RGBA real-world room luminance & color-temperature estimator with
 *    clamped intensity bounds [0.45, 1.65] and temporal smoothing.
 * 5. Passive motion stability scoring for table surface guidance without intrusive permission prompts.
 */

export const WEBXR_RECOMMENDED_FEATURES = [
  'hit-test',
  'dom-overlay',
  'light-estimation',
] as const;

export const MIN_AR_LIGHT_INTENSITY = 0.45;
export const MAX_AR_LIGHT_INTENSITY = 1.65;

export type ARPlatformFamily = 'android' | 'ios' | 'ipados' | 'desktop' | 'unknown';

export type RecommendedARMode =
  | 'webxr-immersive-ar'
  | 'camera-ar-with-scene-viewer'
  | 'camera-ar-with-quick-look'
  | 'in-browser-camera-ar'
  | 'desktop-3d-or-webcam'
  | 'fallback-3d-only';

export type QuickLookUnavailableReason =
  | 'ready'
  | 'missing-usdz-asset'
  | 'invalid-usdz-extension'
  | 'rel-ar-unsupported';

export interface QuickLookCapability {
  quickLookReady: boolean;
  supportsRelAr: boolean;
  usdzUrl: string | null;
  reason: QuickLookUnavailableReason;
}

export interface SceneViewerCapability {
  ready: boolean;
  intentUrl: string | null;
  reason: 'ready' | 'not-android' | 'missing-glb-url';
}

export interface WebXRCapability {
  supported: boolean;
  apiPresent: boolean;
  recommendedFeatures: readonly string[];
  reason: 'supported' | 'session-unsupported' | 'xr-api-missing' | 'security-or-probe-error';
}

export interface ARPlatformProfile {
  platformFamily: ARPlatformFamily;
  isAndroid: boolean;
  isIOS: boolean;
  isIPadOS: boolean;
  isMobileOrTablet: boolean;
  isDesktop: boolean;
  isInAppWebView: boolean;
  hasTouch: boolean;
  isSecureContext: boolean;
  supportsGetUserMedia: boolean;
}

export interface ARCapabilityMatrix {
  platform: ARPlatformProfile;
  webxr: WebXRCapability;
  sceneViewer: SceneViewerCapability;
  quickLook: QuickLookCapability;
  hasCameraApi: boolean;
  hasVideoInputDevice: boolean;
  canRunInBrowserCameraAR: boolean;
  recommendedMode: RecommendedARMode;
  modeSummary: string;
}

export interface SceneViewerIntentOptions {
  glbUrl: string;
  title: string;
  fallbackUrl: string;
  baseOrigin?: string;
  mode?: 'ar_preferred' | 'ar_only' | '3d_preferred';
  resizable?: boolean;
}

export interface QuickLookCheckOptions {
  usdzPath?: string | null;
  supportsRelAr?: boolean;
  baseOrigin?: string;
  documentRef?: { createElement?: (tagName: string) => unknown } | null;
}

export interface AREnvironmentInput {
  userAgent?: string;
  platform?: string;
  maxTouchPoints?: number;
  innerWidth?: number;
  isSecureContext?: boolean;
  hasGetUserMedia?: boolean;
}

export interface XRSystemLike {
  isSessionSupported?: (mode: string) => Promise<boolean>;
}

export interface MediaDevicesLike {
  getUserMedia?: (constraints: unknown) => Promise<unknown>;
  enumerateDevices?: () => Promise<Array<{ kind?: string; label?: string }>>;
}

export interface NavigatorLike {
  userAgent?: string;
  platform?: string;
  maxTouchPoints?: number;
  xr?: XRSystemLike;
  mediaDevices?: MediaDevicesLike;
}

export interface DetectARCapabilitiesOptions {
  glbPath?: string | null;
  usdzPath?: string | null;
  dishTitle?: string;
  fallbackUrl?: string;
  baseOrigin?: string;
  navigatorRef?: NavigatorLike | null;
  documentRef?: { createElement?: (tagName: string) => unknown } | null;
  windowRef?: { innerWidth?: number; isSecureContext?: boolean; location?: { origin?: string; href?: string } } | null;
}

export type ARLightingLabel =
  | 'dim-candlelight'
  | 'warm-indoor'
  | 'balanced-indoor'
  | 'bright-daylight';

export interface RealWorldLightEstimate {
  /** Normalized Rec.709 scene luminance in [0, 1] */
  luma: number;
  /** Red-vs-blue warmth index in [-1, 1] (>0 = warm candle/amber, <0 = cool daylight) */
  warmth: number;
  /** Approximate correlated color temperature in Kelvin [2600, 6500] */
  kelvinApprox: number;
  /** Clamped ambient light intensity in [0.45, 1.65] */
  ambientIntensity: number;
  /** Clamped primary directional key light intensity in [0.45, 1.65] */
  directionalIntensity: number;
  /** Clamped hemisphere fill intensity in [0.45, 1.65] */
  hemisphereIntensity: number;
  /** Subtle physically plausible tint color in hex (#rrggbb) */
  lightTintHex: string;
  /** Ground contact shadow opacity adapted to scene brightness */
  contactShadowOpacity: number;
  /** Human-readable ambient condition label */
  lightingLabel: ARLightingLabel;
}

export type SurfaceStabilityLevel = 'stable' | 'moving' | 'excessive-motion';

export interface MotionSampleInput {
  /** Magnitude of linear acceleration delta (m/s^2) excluding steady gravity */
  accelDelta?: number;
  /** Magnitude of device rotation rate (deg/s) */
  rotationRateDeg?: number;
}

export interface MotionStabilityState {
  level: SurfaceStabilityLevel;
  /** Normalized stability score in [0, 1] where 1 = rock solid */
  stabilityScore: number;
  guidanceText: string;
  recommendRecenter: boolean;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function toHexByte(channel: number): string {
  return Math.round(clamp(channel, 0, 255))
    .toString(16)
    .padStart(2, '0');
}

/**
 * Resolves a potentially relative asset URL (e.g. `/models/warrior_model.glb`)
 * against an origin so external native viewers (Scene Viewer / Quick Look) receive a full URL.
 */
export function resolveAbsoluteAssetUrl(assetPath: string, baseOrigin?: string): string {
  const trimmed = (assetPath || '').trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const origin =
    (baseOrigin || (typeof window !== 'undefined' ? window.location.origin : '') || 'https://thegoldenoak.in')
      .trim()
      .replace(/\/+$/, '');

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${origin}${normalizedPath}`;
}

/**
 * Safely extracts an optional `.usdz` path from a ModelConfig without requiring schema mutations.
 */
export function extractUsdzPath(modelConfig: unknown): string | null {
  if (!modelConfig || typeof modelConfig !== 'object') return null;
  const record = modelConfig as Record<string, unknown>;
  const candidate = record.culinaryUsdzPath ?? record.usdzPath ?? record.iosUsdzPath ?? null;
  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate.trim();
  }
  return null;
}

/**
 * Safely resolves the best GLB model path for the current quality tier, checking optional
 * peer-configured `arModelPath` or `lodPaths` before falling back to `config.modelPath`.
 */
export function resolveTieredModelPath(
  modelConfig: { modelPath: string } & Record<string, unknown>,
  tier: 'high' | 'medium' | 'low'
): string {
  const arOverride = modelConfig.arModelPath;
  if (typeof arOverride === 'string' && arOverride.trim().length > 0) {
    return arOverride.trim();
  }

  const lodPaths =
    (modelConfig.culinaryAssetLodPaths as Record<string, unknown> | undefined) ||
    (modelConfig.lodPaths as Record<string, unknown> | undefined);
  if (lodPaths && typeof lodPaths === 'object') {
    const tierKey = tier === 'low' ? 'ultraLight' : tier === 'medium' ? 'balanced' : 'high';
    const tierPath = lodPaths[tierKey] || lodPaths[tier];
    if (typeof tierPath === 'string' && tierPath.trim().length > 0) {
      return (tierPath as string).trim();
    }
  }

  return modelConfig.modelPath;
}

/**
 * Probes whether the current browser supports `<a rel="ar">` for Apple AR Quick Look.
 */
export function supportsAnchorRelAr(
  documentRef?: { createElement?: (tagName: string) => unknown } | null
): boolean {
  try {
    const doc = documentRef !== undefined ? documentRef : typeof document !== 'undefined' ? document : null;
    if (!doc || typeof doc.createElement !== 'function') return false;
    const anchor = doc.createElement('a') as {
      relList?: { supports?: (token: string) => boolean };
    } | null;
    return Boolean(anchor?.relList?.supports?.('ar'));
  } catch {
    return false;
  }
}

/**
 * Evaluates iOS Safari AR Quick Look readiness.
 * CRITICAL: Requires BOTH `rel="ar"` browser support AND a non-null `.usdz` asset path
 * so users are never sent to broken 404 USDZ links.
 */
export function evaluateIOSQuickLookCapability(options: QuickLookCheckOptions): QuickLookCapability {
  const supportsRelAr =
    typeof options.supportsRelAr === 'boolean'
      ? options.supportsRelAr
      : supportsAnchorRelAr(options.documentRef);

  if (!supportsRelAr) {
    return {
      quickLookReady: false,
      supportsRelAr: false,
      usdzUrl: null,
      reason: 'rel-ar-unsupported',
    };
  }

  const rawUsdz = typeof options.usdzPath === 'string' ? options.usdzPath.trim() : '';
  if (!rawUsdz) {
    return {
      quickLookReady: false,
      supportsRelAr: true,
      usdzUrl: null,
      reason: 'missing-usdz-asset',
    };
  }

  // Strip query/hash when checking extension
  const cleanPath = rawUsdz.split('?')[0].split('#')[0].toLowerCase();
  if (!cleanPath.endsWith('.usdz') && !cleanPath.endsWith('.reality')) {
    return {
      quickLookReady: false,
      supportsRelAr: true,
      usdzUrl: null,
      reason: 'invalid-usdz-extension',
    };
  }

  return {
    quickLookReady: true,
    supportsRelAr: true,
    usdzUrl: resolveAbsoluteAssetUrl(rawUsdz, options.baseOrigin),
    reason: 'ready',
  };
}

/**
 * Builds a standards-compliant Google ARCore Scene Viewer `intent://` URL for Android.
 * Includes `mode=ar_preferred` and a safe encoded `S.browser_fallback_url` so devices
 * without Google Play Services for AR gracefully return to the web experience instead of crashing.
 */
export function buildAndroidSceneViewerIntentUrl(options: SceneViewerIntentOptions): string {
  const absoluteGlbUrl = resolveAbsoluteAssetUrl(options.glbUrl, options.baseOrigin);
  if (!absoluteGlbUrl) {
    return '';
  }

  const mode = options.mode ?? 'ar_preferred';
  const resizable = options.resizable ?? true;
  const cleanTitle = (options.title || 'The Golden Oak Dish').trim();
  const absoluteFallbackUrl = resolveAbsoluteAssetUrl(
    options.fallbackUrl || '/',
    options.baseOrigin
  );

  const schemeMatch = absoluteGlbUrl.match(/^(https?):\/\//i);
  const scheme = schemeMatch ? schemeMatch[1].toLowerCase() : 'https';

  const queryParams = [
    `file=${encodeURIComponent(absoluteGlbUrl)}`,
    `mode=${encodeURIComponent(mode)}`,
    `title=${encodeURIComponent(cleanTitle)}`,
    `resizable=${resizable ? 'true' : 'false'}`,
  ].join('&');

  // Android Intent URI specification: S.browser_fallback_url must be URI-encoded so semicolons/hashes cannot break Intent parsing
  const encodedFallback = encodeURIComponent(absoluteFallbackUrl);

  return `intent://arvr.google.com/scene-viewer/1.0?${queryParams}#Intent;scheme=${scheme};package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodedFallback};end;`;
}

/**
 * Async probe for WebXR `immersive-ar` support.
 */
export async function probeWebXRCapability(nav?: NavigatorLike | null): Promise<WebXRCapability> {
  const targetNav = nav !== undefined ? nav : typeof navigator !== 'undefined' ? (navigator as unknown as NavigatorLike) : null;

  if (!targetNav?.xr || typeof targetNav.xr.isSessionSupported !== 'function') {
    return {
      supported: false,
      apiPresent: false,
      recommendedFeatures: WEBXR_RECOMMENDED_FEATURES,
      reason: 'xr-api-missing',
    };
  }

  try {
    const supported = Boolean(await targetNav.xr.isSessionSupported('immersive-ar'));
    return {
      supported,
      apiPresent: true,
      recommendedFeatures: WEBXR_RECOMMENDED_FEATURES,
      reason: supported ? 'supported' : 'session-unsupported',
    };
  } catch {
    return {
      supported: false,
      apiPresent: true,
      recommendedFeatures: WEBXR_RECOMMENDED_FEATURES,
      reason: 'security-or-probe-error',
    };
  }
}

/**
 * Honest platform & environment classification combining UA signals, touch capabilities
 * (handling iPadOS 13+ desktop-class Safari UA), secure context, and camera API presence.
 */
export function detectARPlatformEnvironment(input?: AREnvironmentInput): ARPlatformProfile {
  const ua =
    input?.userAgent ??
    (typeof navigator !== 'undefined' ? navigator.userAgent : '') ??
    '';
  const platform =
    input?.platform ??
    (typeof navigator !== 'undefined' ? navigator.platform : '') ??
    '';
  const maxTouchPoints =
    input?.maxTouchPoints ??
    (typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0);
  const isSecureContext =
    input?.isSecureContext ??
    (typeof window !== 'undefined' && typeof window.isSecureContext === 'boolean'
      ? window.isSecureContext
      : true);
  const supportsGetUserMedia =
    input?.hasGetUserMedia ??
    Boolean(
      typeof navigator !== 'undefined' &&
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === 'function'
    );

  const isAndroid = /Android/i.test(ua);
  const isExplicitIOSPhone = /iPhone|iPod/i.test(ua);
  const isExplicitIPad = /iPad/i.test(ua);
  // iPadOS 13+ Safari identifies as Macintosh in UA/platform with multi-touch hardware (maxTouchPoints > 1)
  const isDesktopClassIPadOS =
    !isAndroid &&
    !isExplicitIOSPhone &&
    (/Macintosh|MacIntel/i.test(ua) || /MacIntel/i.test(platform)) &&
    maxTouchPoints > 1;

  const isIPadOS = isExplicitIPad || isDesktopClassIPadOS;
  const isIOS = isExplicitIOSPhone;
  const hasTouch = maxTouchPoints > 0;

  let platformFamily: ARPlatformFamily = 'unknown';
  if (isAndroid) {
    platformFamily = 'android';
  } else if (isIPadOS) {
    platformFamily = 'ipados';
  } else if (isIOS) {
    platformFamily = 'ios';
  } else if (/Windows|Macintosh|Linux|CrOS|X11/i.test(ua) || !hasTouch) {
    platformFamily = 'desktop';
  }

  const isMobileOrTablet = isAndroid || isIOS || isIPadOS;
  const isDesktop = !isMobileOrTablet;
  const isInAppWebView =
    /FBAN|FBAV|Instagram|Line\/|wv\)|WebView|Snapchat|TikTok/i.test(ua);

  return {
    platformFamily,
    isAndroid,
    isIOS,
    isIPadOS,
    isMobileOrTablet,
    isDesktop,
    isInAppWebView,
    hasTouch,
    isSecureContext,
    supportsGetUserMedia,
  };
}

/**
 * Full async Cross-Platform AR Capability Matrix resolver across WebXR, Android ARCore Scene Viewer,
 * iOS/iPadOS Quick Look, in-browser Camera AR, and Desktop 3D / Webcam preview modes.
 */
export async function detectARCapabilityMatrix(
  options: DetectARCapabilitiesOptions = {}
): Promise<ARCapabilityMatrix> {
  const nav =
    options.navigatorRef !== undefined
      ? options.navigatorRef
      : typeof navigator !== 'undefined'
        ? (navigator as unknown as NavigatorLike)
        : null;
  const win =
    options.windowRef !== undefined
      ? options.windowRef
      : typeof window !== 'undefined'
        ? window
        : null;
  const doc =
    options.documentRef !== undefined
      ? options.documentRef
      : typeof document !== 'undefined'
        ? document
        : null;

  const baseOrigin =
    options.baseOrigin ||
    win?.location?.origin ||
    'https://thegoldenoak.in';

  const fallbackUrl =
    options.fallbackUrl ||
    win?.location?.href ||
    `${baseOrigin}/ar`;

  const platform = detectARPlatformEnvironment({
    userAgent: nav?.userAgent,
    platform: nav?.platform,
    maxTouchPoints: nav?.maxTouchPoints,
    innerWidth: win?.innerWidth,
    isSecureContext: win?.isSecureContext ?? true,
    hasGetUserMedia: Boolean(nav?.mediaDevices && typeof nav.mediaDevices.getUserMedia === 'function'),
  });

  const webxr = await probeWebXRCapability(nav);

  const quickLook = evaluateIOSQuickLookCapability({
    usdzPath: options.usdzPath,
    baseOrigin,
    documentRef: doc,
  });

  let sceneViewer: SceneViewerCapability;
  if (!platform.isAndroid) {
    sceneViewer = {
      ready: false,
      intentUrl: null,
      reason: 'not-android',
    };
  } else if (!options.glbPath || !options.glbPath.trim()) {
    sceneViewer = {
      ready: false,
      intentUrl: null,
      reason: 'missing-glb-url',
    };
  } else {
    const intentUrl = buildAndroidSceneViewerIntentUrl({
      glbUrl: options.glbPath,
      title: options.dishTitle || 'The Golden Oak Dish',
      fallbackUrl,
      baseOrigin,
      mode: 'ar_preferred',
    });
    sceneViewer = {
      ready: Boolean(intentUrl),
      intentUrl: intentUrl || null,
      reason: intentUrl ? 'ready' : 'missing-glb-url',
    };
  }

  // Probe video input devices non-intrusively (enumerateDevices does not trigger permission prompt)
  let hasVideoInputDevice = platform.isMobileOrTablet && platform.supportsGetUserMedia;
  if (nav?.mediaDevices && typeof nav.mediaDevices.enumerateDevices === 'function') {
    try {
      const devices = await nav.mediaDevices.enumerateDevices();
      if (Array.isArray(devices) && devices.length > 0) {
        hasVideoInputDevice = devices.some((d) => d.kind === 'videoinput');
      }
    } catch {
      // Keep heuristic fallback if enumerateDevices is restricted prior to permission
    }
  }

  const hasCameraApi = platform.isSecureContext && platform.supportsGetUserMedia;
  const canRunInBrowserCameraAR = hasCameraApi && hasVideoInputDevice;

  let recommendedMode: RecommendedARMode;
  let modeSummary: string;

  if (platform.isDesktop) {
    if (canRunInBrowserCameraAR) {
      recommendedMode = 'desktop-3d-or-webcam';
      modeSummary = 'Desktop detected — Interactive 3D Studio recommended, optional Webcam AR preview available';
    } else {
      recommendedMode = 'fallback-3d-only';
      modeSummary = 'Desktop without rear camera — Interactive 3D Studio Viewer active';
    }
  } else if (webxr.supported) {
    recommendedMode = 'webxr-immersive-ar';
    modeSummary = 'WebXR Immersive AR & Live Camera AR ready';
  } else if (platform.isAndroid && sceneViewer.ready && canRunInBrowserCameraAR) {
    recommendedMode = 'camera-ar-with-scene-viewer';
    modeSummary = 'In-browser Camera AR active + Native ARCore Scene Viewer available';
  } else if ((platform.isIOS || platform.isIPadOS) && quickLook.quickLookReady && canRunInBrowserCameraAR) {
    recommendedMode = 'camera-ar-with-quick-look';
    modeSummary = 'In-browser Camera AR active + Apple AR Quick Look available';
  } else if (canRunInBrowserCameraAR) {
    recommendedMode = 'in-browser-camera-ar';
    modeSummary =
      platform.isIOS || platform.isIPadOS
        ? 'Optimized iOS Safari WebGL + Camera AR active (USDZ Quick Look asset pending)'
        : 'In-browser WebGL Camera AR active';
  } else {
    recommendedMode = 'fallback-3d-only';
    modeSummary = 'Camera unavailable — Interactive 3D Studio fallback recommended';
  }

  return {
    platform,
    webxr,
    sceneViewer,
    quickLook,
    hasCameraApi,
    hasVideoInputDevice,
    canRunInBrowserCameraAR,
    recommendedMode,
    modeSummary,
  };
}

/**
 * Default neutral-warm restaurant light estimate used prior to first camera sample.
 */
export const DEFAULT_AR_LIGHT_ESTIMATE: RealWorldLightEstimate = {
  luma: 0.52,
  warmth: 0.08,
  kelvinApprox: 4300,
  ambientIntensity: 0.88,
  directionalIntensity: 0.92,
  hemisphereIntensity: 0.65,
  lightTintHex: '#fff6ea',
  contactShadowOpacity: 0.38,
  lightingLabel: 'balanced-indoor',
};

/**
 * Pure real-world lighting estimator operating on a downsampled RGBA pixel buffer (e.g. 16x16 = 256 pixels).
 * - Computes average Rec.709 luminance (`luma`) and red/blue color temperature balance (`warmth`).
 * - Clamps intensities strictly within safe bounds [0.45, 1.65] so 3D dishes never blow out or turn pitch black.
 * - Applies exponential smoothing when `previous` is provided for flicker-free adaptation.
 */
export function estimateLightingFromRgba(
  pixels: ArrayLike<number>,
  previous?: RealWorldLightEstimate | null
): RealWorldLightEstimate {
  const length = pixels?.length ?? 0;
  const pixelCount = Math.floor(length / 4);

  if (pixelCount <= 0) {
    return previous ?? DEFAULT_AR_LIGHT_ESTIMATE;
  }

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumLuma = 0;

  for (let i = 0; i < pixelCount * 4; i += 4) {
    const r = clamp(Number(pixels[i]) || 0, 0, 255) / 255;
    const g = clamp(Number(pixels[i + 1]) || 0, 0, 255) / 255;
    const b = clamp(Number(pixels[i + 2]) || 0, 0, 255) / 255;

    sumR += r;
    sumG += g;
    sumB += b;
    // ITU-R BT.709 relative luminance
    sumLuma += 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  const avgR = sumR / pixelCount;
  const avgG = sumG / pixelCount;
  const avgB = sumB / pixelCount;
  const rawLuma = clamp(sumLuma / pixelCount, 0, 1);

  // Warmth in [-1, 1]: positive when red/amber dominates blue (candlelight/incandescent), negative in cool daylight
  const chromaDenom = Math.max(0.08, avgR + avgB);
  const rawWarmth = clamp((avgR - avgB) / chromaDenom, -1, 1);

  const smoothing = previous ? 0.35 : 1.0;
  const luma = previous ? previous.luma + (rawLuma - previous.luma) * smoothing : rawLuma;
  const warmth = previous ? previous.warmth + (rawWarmth - previous.warmth) * smoothing : rawWarmth;

  // Map luma [0..1] to safe clamped intensity bounds [0.45..1.65]
  const rawAmbient = MIN_AR_LIGHT_INTENSITY + luma * (MAX_AR_LIGHT_INTENSITY - MIN_AR_LIGHT_INTENSITY) * 0.88;
  const rawDirectional = MIN_AR_LIGHT_INTENSITY + Math.pow(luma, 0.9) * (MAX_AR_LIGHT_INTENSITY - MIN_AR_LIGHT_INTENSITY);
  const rawHemisphere = MIN_AR_LIGHT_INTENSITY + luma * 0.72;

  const ambientIntensity = Number(
    clamp(rawAmbient, MIN_AR_LIGHT_INTENSITY, MAX_AR_LIGHT_INTENSITY).toFixed(3)
  );
  const directionalIntensity = Number(
    clamp(rawDirectional, MIN_AR_LIGHT_INTENSITY, MAX_AR_LIGHT_INTENSITY).toFixed(3)
  );
  const hemisphereIntensity = Number(
    clamp(rawHemisphere, MIN_AR_LIGHT_INTENSITY, MAX_AR_LIGHT_INTENSITY).toFixed(3)
  );

  // Approximate Kelvin [2600K warm candlelight .. 6500K cool daylight]
  const kelvinApprox = Math.round(clamp(4600 - warmth * 1850, 2600, 6500));

  // Subtle white-balanced tint (kept high-value pastel so food textures always stay appetizing)
  const tintStrength = 0.22;
  const normMax = Math.max(0.05, avgR, avgG, avgB);
  const nr = avgR / normMax;
  const ng = avgG / normMax;
  const nb = avgB / normMax;

  const tintR = 255 * (1 - tintStrength + tintStrength * clamp(nr * 1.04, 0.78, 1.0));
  const tintG = 255 * (1 - tintStrength + tintStrength * clamp(ng, 0.8, 1.0));
  const tintB = 255 * (1 - tintStrength + tintStrength * clamp(nb * 1.02, 0.72, 1.0));
  const lightTintHex = `#${toHexByte(tintR)}${toHexByte(tintG)}${toHexByte(tintB)}`;

  // Stronger contact shadow in bright rooms, softer shadow in dim candlelight
  const contactShadowOpacity = Number(clamp(0.24 + luma * 0.28, 0.22, 0.52).toFixed(3));

  let lightingLabel: ARLightingLabel = 'balanced-indoor';
  if (luma < 0.26) {
    lightingLabel = 'dim-candlelight';
  } else if (warmth > 0.16 && luma < 0.65) {
    lightingLabel = 'warm-indoor';
  } else if (luma > 0.72) {
    lightingLabel = 'bright-daylight';
  }

  return {
    luma: Number(luma.toFixed(3)),
    warmth: Number(warmth.toFixed(3)),
    kelvinApprox,
    ambientIntensity,
    directionalIntensity,
    hemisphereIntensity,
    lightTintHex,
    contactShadowOpacity,
    lightingLabel,
  };
}

/**
 * Returns true only when ambient lighting has shifted enough to justify invalidating a demand frame.
 */
export function hasMeaningfulLightChange(
  prev: RealWorldLightEstimate,
  next: RealWorldLightEstimate
): boolean {
  return (
    Math.abs(prev.ambientIntensity - next.ambientIntensity) >= 0.035 ||
    Math.abs(prev.directionalIntensity - next.directionalIntensity) >= 0.04 ||
    Math.abs(prev.warmth - next.warmth) >= 0.08 ||
    prev.lightingLabel !== next.lightingLabel
  );
}

/**
 * Evaluates passive device motion stability so users receive gentle table-tracking guidance
 * and a 1-tap "Re-center on Table" recovery prompt if rapid movement causes visual drift.
 */
export function evaluateMotionStability(
  sample: MotionSampleInput,
  previousScore = 1
): MotionStabilityState {
  const accel = Math.max(0, Number(sample.accelDelta) || 0);
  const rot = Math.max(0, Number(sample.rotationRateDeg) || 0);

  // Combined normalized motion penalty in [0, 1]
  const rawPenalty = clamp(accel / 5.5 + rot / 140, 0, 1);
  const instantScore = 1 - rawPenalty;
  const stabilityScore = Number(
    clamp(previousScore * 0.55 + instantScore * 0.45, 0, 1).toFixed(3)
  );

  if (stabilityScore < 0.42) {
    return {
      level: 'excessive-motion',
      stabilityScore,
      guidanceText: 'Move phone slowly — tap Re-center if dish drifted',
      recommendRecenter: true,
    };
  }

  if (stabilityScore < 0.75) {
    return {
      level: 'moving',
      stabilityScore,
      guidanceText: 'Stabilizing table view… hold steady',
      recommendRecenter: false,
    };
  }

  return {
    level: 'stable',
    stabilityScore,
    guidanceText: 'Table surface locked',
    recommendRecenter: false,
  };
}
