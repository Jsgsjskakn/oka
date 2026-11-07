/**
 * Multi-Signal Device & GPU Capability Detection Architecture
 *
 * Evaluates WebGL2/WebGL1 hardware limits, unmasked GPU architecture families,
 * compressed texture extensions (ASTC, ETC2, BPTC, S3TC, PVRTC), WebGPU availability,
 * logical CPU concurrency, JS heap & optional deviceMemory hints, physical pixel
 * fill-rate pressure, network/Data-Saver status, battery saver, reduced-motion
 * accessibility preferences, and W3C Compute Pressure (where supported).
 *
 * CRITICAL INVARIANT:
 * `navigator.deviceMemory` alone NEVER determines rendering quality. Safari/iOS and
 * Firefox do not expose `deviceMemory` (`undefined`), Chromium clamps it to 8 GB,
 * budget phones often advertise inflated RAM paired with weak entry GPUs, and a
 * single browser tab can only safely allocate a fraction of total system memory.
 */

export type PrimaryEnvironment = 'web-desktop' | 'phone';

export type DevicePlatform =
  | 'android'
  | 'ios'
  | 'windows'
  | 'macos'
  | 'tablet'
  | 'other';

export type DeviceLogicalTier = 'low-end' | 'mid-range' | 'high-end';

export type RenderingProfileName = 'ultra-light' | 'balanced' | 'high-fidelity';

export type GpuArchitectureTier =
  | 'low-end'
  | 'mid-range'
  | 'high-end'
  | 'software'
  | 'unknown';

export type GpuVendorFamily =
  | 'adreno'
  | 'mali'
  | 'immortalis'
  | 'xclipse'
  | 'powervr'
  | 'apple'
  | 'nvidia'
  | 'amd'
  | 'intel'
  | 'software'
  | 'unknown';

export type ThermalPressureState =
  | 'nominal'
  | 'fair'
  | 'serious'
  | 'critical'
  | 'unsupported';

export type EffectiveNetworkType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

export type PreferredCompressedFormat =
  | 'astc'
  | 'bptc'
  | 's3tc'
  | 'etc2'
  | 'pvrtc'
  | 'etc1'
  | 'rgba8';

export interface CompressedTextureSupport {
  astc: boolean;
  etc2: boolean;
  etc1: boolean;
  s3tc: boolean;
  bptc: boolean;
  pvrtc: boolean;
  ktx2Supported: boolean;
  preferredFormat: PreferredCompressedFormat;
}

export interface GpuClassification {
  vendorFamily: GpuVendorFamily;
  gpuTier: GpuArchitectureTier;
  isDiscreteGpu: boolean;
  isSoftwareGpu: boolean;
  matchedRule: string;
}

export interface WebGLProbeResult {
  webgl2Available: boolean;
  webgl1Available: boolean;
  gpuVendor?: string;
  gpuRenderer?: string;
  gpuVendorFamily: GpuVendorFamily;
  gpuTier: GpuArchitectureTier;
  isDiscreteGpu: boolean;
  isSoftwareGpu: boolean;
  maxTextureSize: number;
  maxRenderbufferSize: number;
  maxVertexUniformVectors: number;
  maxTextureImageUnits: number;
  maxAnisotropyHardware: number;
  compressedTextures: CompressedTextureSupport;
}

export interface MemorySnapshot {
  /** Optional rough device RAM GiB (undefined on Safari/iOS & Firefox; clamped <= 8 on Chromium) */
  deviceMemoryGb?: number;
  /** Chromium V8 JS heap ceiling in bytes, if exposed */
  jsHeapSizeLimitBytes?: number;
  /** Chromium V8 total allocated JS heap in bytes, if exposed */
  totalJSHeapSizeBytes?: number;
  /** Chromium V8 active used JS heap in bytes, if exposed */
  usedJSHeapSizeBytes?: number;
  /** Ratio usedJSHeapSize / jsHeapSizeLimit (0..1), if exposed */
  jsHeapUtilization?: number;
  /** Conservative per-tab safe GPU + JS asset memory budget in MiB */
  estimatedAvailableTabBudgetMb: number;
}

export interface ScreenFillRateMetrics {
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  physicalWidth: number;
  physicalHeight: number;
  physicalPixelCount: number;
  fillRatePressure: 'low' | 'moderate' | 'high' | 'extreme';
}

export interface NetworkCapabilityMetrics {
  saveData: boolean;
  effectiveType: EffectiveNetworkType;
  downlinkMbps?: number;
  rttMs?: number;
  isConstrainedNetwork: boolean;
}

export interface CapabilityClassificationBreakdown {
  gpuScore: number;
  cpuScore: number;
  memoryScore: number;
  apiScore: number;
  fillRatePenalty: number;
  networkPenalty: number;
  compositeScore: number;
  logicalTier: DeviceLogicalTier;
  androidTier: DeviceLogicalTier | null;
  recommendedProfile: RenderingProfileName;
  ramSignalPresent: boolean;
  reasons: string[];
}

export interface ExtendedDeviceCapabilities {
  // Legacy-compatible fields
  devicePixelRatio: number;
  hardwareConcurrency: number;
  deviceMemory?: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  prefersReducedMotion: boolean;
  isLowPower: boolean;
  gpuRenderer?: string;
  isDiscreteGpu: boolean;
  isSoftwareGpu: boolean;

  // Extended multi-signal fields
  environment: PrimaryEnvironment;
  platform: DevicePlatform;
  logicalTier: DeviceLogicalTier;
  androidTier: DeviceLogicalTier | null;
  recommendedProfile: RenderingProfileName;
  gpuVendor?: string;
  gpuVendorFamily: GpuVendorFamily;
  gpuTier: GpuArchitectureTier;
  webgl2Available: boolean;
  webgl1Available: boolean;
  webgpuAvailable: boolean;
  maxTextureSize: number;
  maxRenderbufferSize: number;
  maxVertexUniformVectors: number;
  maxTextureImageUnits: number;
  maxAnisotropyHardware: number;
  compressedTextures: CompressedTextureSupport;
  ktx2Supported: boolean;
  astcSupported: boolean;
  etc2Supported: boolean;
  memory: MemorySnapshot;
  screen: ScreenFillRateMetrics;
  network: NetworkCapabilityMetrics;
  batteryLevel?: number;
  batteryCharging?: boolean;
  thermalState: ThermalPressureState;
  computePressureSupported: boolean;
  classification: CapabilityClassificationBreakdown;
}

export interface CapabilityInputOverrides {
  userAgent?: string;
  devicePixelRatio?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  isTouch?: boolean;
  prefersReducedMotion?: boolean;
  isLowPower?: boolean;
  batteryLevel?: number;
  batteryCharging?: boolean;
  webgpuAvailable?: boolean;
  webglProbe?: Partial<WebGLProbeResult>;
  jsHeapSizeLimitBytes?: number;
  usedJSHeapSizeBytes?: number;
  totalJSHeapSizeBytes?: number;
  saveData?: boolean;
  effectiveType?: EffectiveNetworkType;
  downlinkMbps?: number;
  rttMs?: number;
  thermalState?: ThermalPressureState;
}

// Module-level cached WebGL probe so re-renders / resize events NEVER create extra GL contexts
let cachedWebGLProbe: WebGLProbeResult | null = null;

/**
 * Resets the module-level WebGL probe cache (intended for deterministic unit tests).
 */
export function resetWebGLProbeCache(): void {
  cachedWebGLProbe = null;
}

const DEFAULT_COMPRESSED_TEXTURES: CompressedTextureSupport = {
  astc: false,
  etc2: false,
  etc1: false,
  s3tc: false,
  bptc: false,
  pvrtc: false,
  ktx2Supported: false,
  preferredFormat: 'rgba8',
};

/**
 * Selects the optimal GPU-compressed texture transcode target for KTX2 BasisU.
 */
export function resolvePreferredCompressedFormat(
  flags: Omit<CompressedTextureSupport, 'ktx2Supported' | 'preferredFormat'>
): PreferredCompressedFormat {
  if (flags.astc) return 'astc';
  if (flags.bptc) return 'bptc';
  if (flags.etc2) return 'etc2';
  if (flags.s3tc) return 's3tc';
  if (flags.pvrtc) return 'pvrtc';
  if (flags.etc1) return 'etc1';
  return 'rgba8';
}

export interface GpuClassificationContext {
  platform?: DevicePlatform;
  isDesktop?: boolean;
  webgl2Available?: boolean;
  webgpuAvailable?: boolean;
  maxTextureSize?: number;
  hardwareConcurrency?: number;
  devicePixelRatio?: number;
  viewportWidth?: number;
  viewportHeight?: number;
}

/**
 * Classifies unmasked WebGL renderer strings across mobile SoCs and desktop GPUs.
 * Handles masked Safari strings ("Apple GPU") via corroborated hardware signals.
 */
export function classifyGpuRenderer(
  renderer: string | undefined,
  ctx: GpuClassificationContext = {}
): GpuClassification {
  if (!renderer || !renderer.trim()) {
    // Fallback heuristic from GL hardware limits when debug info is completely unavailable
    if (ctx.webgl2Available && (ctx.maxTextureSize ?? 0) >= 16384) {
      return {
        vendorFamily: 'unknown',
        gpuTier: 'mid-range',
        isDiscreteGpu: false,
        isSoftwareGpu: false,
        matchedRule: 'unmasked-unavailable:webgl2-16k-fallback',
      };
    }
    if (ctx.webgl2Available === false && (ctx.maxTextureSize ?? 4096) <= 4096) {
      return {
        vendorFamily: 'unknown',
        gpuTier: 'low-end',
        isDiscreteGpu: false,
        isSoftwareGpu: false,
        matchedRule: 'unmasked-unavailable:legacy-gl-limits',
      };
    }
    return {
      vendorFamily: 'unknown',
      gpuTier: 'unknown',
      isDiscreteGpu: false,
      isSoftwareGpu: false,
      matchedRule: 'unmasked-unavailable',
    };
  }

  const lower = renderer.toLowerCase();

  // 1. Software rasterizers (SwiftShader, Mesa llvmpipe/lavapipe/softpipe, Basic Render Driver)
  if (
    lower.includes('swiftshader') ||
    lower.includes('llvmpipe') ||
    lower.includes('softpipe') ||
    lower.includes('lavapipe') ||
    lower.includes('software') ||
    lower.includes('microsoft basic render') ||
    lower.includes('gdi generic')
  ) {
    return {
      vendorFamily: 'software',
      gpuTier: 'software',
      isDiscreteGpu: false,
      isSoftwareGpu: true,
      matchedRule: 'software-rasterizer',
    };
  }

  // 2. Qualcomm Adreno (Android phones & tablets)
  if (lower.includes('adreno')) {
    const match = lower.match(/adreno\s*(?:\(tm\))?\s*(\d{3,4})([a-z]*)/i);
    const modelNum = match ? parseInt(match[1], 10) : NaN;

    if (!Number.isNaN(modelNum)) {
      // Flagship Adreno: 730, 732, 735, 740, 750, 825, 830, 840+
      if (modelNum >= 730) {
        return {
          vendorFamily: 'adreno',
          gpuTier: 'high-end',
          isDiscreteGpu: false,
          isSoftwareGpu: false,
          matchedRule: `adreno-flagship-${modelNum}`,
        };
      }

      // Entry 7xx exception: Adreno 702 (wearable / ultra-budget)
      if (modelNum === 702) {
        return {
          vendorFamily: 'adreno',
          gpuTier: 'low-end',
          isDiscreteGpu: false,
          isSoftwareGpu: false,
          matchedRule: 'adreno-entry-702',
        };
      }

      // Mid-range Adreno: 618..660, 710, 720, 725
      if ((modelNum >= 618 && modelNum <= 699) || (modelNum >= 710 && modelNum < 730)) {
        return {
          vendorFamily: 'adreno',
          gpuTier: 'mid-range',
          isDiscreteGpu: false,
          isSoftwareGpu: false,
          matchedRule: `adreno-midrange-${modelNum}`,
        };
      }

      // Low-end Adreno: 3xx, 4xx, 5xx (505/506/509/512), 610, 612, 615, 616
      return {
        vendorFamily: 'adreno',
        gpuTier: 'low-end',
        isDiscreteGpu: false,
        isSoftwareGpu: false,
        matchedRule: `adreno-lowend-${modelNum}`,
      };
    }

    return {
      vendorFamily: 'adreno',
      gpuTier: 'mid-range',
      isDiscreteGpu: false,
      isSoftwareGpu: false,
      matchedRule: 'adreno-generic',
    };
  }

  // 3. ARM Immortalis (Flagship ray-tracing mobile GPUs: Immortalis-G715, G720, G925)
  if (lower.includes('immortalis')) {
    return {
      vendorFamily: 'immortalis',
      gpuTier: 'high-end',
      isDiscreteGpu: false,
      isSoftwareGpu: false,
      matchedRule: 'arm-immortalis-flagship',
    };
  }

  // 4. Samsung Xclipse (AMD RDNA mobile GPUs)
  if (lower.includes('xclipse')) {
    const match = lower.match(/xclipse\s*(\d{3})/i);
    const num = match ? parseInt(match[1], 10) : 920;
    return {
      vendorFamily: 'xclipse',
      gpuTier: num >= 900 ? 'high-end' : 'mid-range',
      isDiscreteGpu: false,
      isSoftwareGpu: false,
      matchedRule: `samsung-xclipse-${num}`,
    };
  }

  // 5. ARM Mali
  if (lower.includes('mali')) {
    // Legacy Utgard / Midgard: Mali-400, Mali-450, Mali-T6xx/T7xx/T8xx
    if (/mali[-\s]*(4\d\d|t\d\d\d)/i.test(lower)) {
      return {
        vendorFamily: 'mali',
        gpuTier: 'low-end',
        isDiscreteGpu: false,
        isSoftwareGpu: false,
        matchedRule: 'mali-legacy-utgard-midgard',
      };
    }

    const gMatch = lower.match(/mali[-\s]*g(\d{2,3})(?:\s*mc(\d+))?/i);
    if (gMatch) {
      const gModel = parseInt(gMatch[1], 10);
      const mcCores = gMatch[2] ? parseInt(gMatch[2], 10) : undefined;

      // Entry Bifrost / Valhall: G31, G51, G52, and G57 (MC1-MC2 or unspecified entry SoC)
      if (gModel <= 52 || (gModel === 57 && (mcCores === undefined || mcCores <= 2))) {
        return {
          vendorFamily: 'mali',
          gpuTier: 'low-end',
          isDiscreteGpu: false,
          isSoftwareGpu: false,
          matchedRule: `mali-entry-g${gModel}`,
        };
      }

      // Upper-flagship multi-core Mali-G710 MC10 / G715 / G720
      if (gModel >= 715 || (gModel === 710 && mcCores !== undefined && mcCores >= 10)) {
        return {
          vendorFamily: 'mali',
          gpuTier: 'high-end',
          isDiscreteGpu: false,
          isSoftwareGpu: false,
          matchedRule: `mali-flagship-g${gModel}`,
        };
      }

      // Mid-range Valhall / Bifrost: G57 MC3+, G68, G71, G72, G76, G77, G78, G610, G615, G710
      return {
        vendorFamily: 'mali',
        gpuTier: 'mid-range',
        isDiscreteGpu: false,
        isSoftwareGpu: false,
        matchedRule: `mali-midrange-g${gModel}`,
      };
    }

    return {
      vendorFamily: 'mali',
      gpuTier: 'low-end',
      isDiscreteGpu: false,
      isSoftwareGpu: false,
      matchedRule: 'mali-generic-conservative',
    };
  }

  // 6. Imagination PowerVR (GE8320, GE8100, Rogue, IMG BXM — entry mobile)
  if (
    lower.includes('powervr') ||
    lower.includes('rogue') ||
    /\bge8\d{3}\b/i.test(lower) ||
    lower.includes('img bxm')
  ) {
    return {
      vendorFamily: 'powervr',
      gpuTier: 'low-end',
      isDiscreteGpu: false,
      isSoftwareGpu: false,
      matchedRule: 'powervr-mobile-lowend',
    };
  }

  // 7. Apple Silicon & Apple A-Series GPUs
  if (lower.includes('apple')) {
    // Apple M1 / M2 / M3 / M4 (Mac & iPad Pro)
    if (/apple\s+m[1-9]/i.test(lower)) {
      return {
        vendorFamily: 'apple',
        gpuTier: 'high-end',
        isDiscreteGpu: Boolean(ctx.isDesktop ?? true),
        isSoftwareGpu: false,
        matchedRule: 'apple-m-series',
      };
    }

    // Explicit Apple A-series identifier (e.g. "Apple A17 Pro GPU", "Apple A14 GPU")
    const aMatch = lower.match(/apple\s+a(\d{1,2})/i);
    if (aMatch) {
      const aGen = parseInt(aMatch[1], 10);
      if (aGen >= 15) {
        return {
          vendorFamily: 'apple',
          gpuTier: 'high-end',
          isDiscreteGpu: false,
          isSoftwareGpu: false,
          matchedRule: `apple-a${aGen}-flagship`,
        };
      }
      if (aGen >= 11) {
        return {
          vendorFamily: 'apple',
          gpuTier: 'mid-range',
          isDiscreteGpu: false,
          isSoftwareGpu: false,
          matchedRule: `apple-a${aGen}-midrange`,
        };
      }
      return {
        vendorFamily: 'apple',
        gpuTier: 'low-end',
        isDiscreteGpu: false,
        isSoftwareGpu: false,
        matchedRule: `apple-a${aGen}-legacy`,
      };
    }

    // Masked Safari desktop Mac ("Apple GPU" on macOS)
    if (ctx.isDesktop || ctx.platform === 'macos') {
      return {
        vendorFamily: 'apple',
        gpuTier: 'high-end',
        isDiscreteGpu: true,
        isSoftwareGpu: false,
        matchedRule: 'apple-macos-masked-gpu',
      };
    }

    // Masked Mobile Safari ("Apple GPU" on iPhone / iPad where navigator.deviceMemory is undefined)
    const maxDim = Math.max(ctx.viewportWidth ?? 390, ctx.viewportHeight ?? 844);
    const minDim = Math.min(ctx.viewportWidth ?? 390, ctx.viewportHeight ?? 844);
    const dpr = ctx.devicePixelRatio ?? 2;
    const cores = ctx.hardwareConcurrency ?? 4;
    const maxTex = ctx.maxTextureSize ?? 16384;

    if (ctx.webgl2Available === false || maxTex < 8192 || minDim <= 320) {
      return {
        vendorFamily: 'apple',
        gpuTier: 'low-end',
        isDiscreteGpu: false,
        isSoftwareGpu: false,
        matchedRule: 'apple-ios-legacy-masked',
      };
    }

    // Modern flagship iPhones (A15–A18 Pro: 3x Super Retina XDR >= 844pt tall, 6+ threads or WebGPU)
    if (
      ctx.webgpuAvailable ||
      (maxTex >= 16384 && dpr >= 3 && maxDim >= 844 && cores >= 6)
    ) {
      return {
        vendorFamily: 'apple',
        gpuTier: 'high-end',
        isDiscreteGpu: false,
        isSoftwareGpu: false,
        matchedRule: 'apple-ios-flagship-masked',
      };
    }

    return {
      vendorFamily: 'apple',
      gpuTier: 'mid-range',
      isDiscreteGpu: false,
      isSoftwareGpu: false,
      matchedRule: 'apple-ios-midrange-masked',
    };
  }

  // 8. NVIDIA Desktop / Laptop Discrete GPUs
  if (
    lower.includes('nvidia') ||
    lower.includes('geforce') ||
    lower.includes('rtx') ||
    lower.includes('gtx') ||
    lower.includes('quadro')
  ) {
    const isEntryLegacy = /\b(gt\s*7[123]0|mx1[135]0|geforce\s*9[12]0m)\b/i.test(lower);
    return {
      vendorFamily: 'nvidia',
      gpuTier: isEntryLegacy ? 'mid-range' : 'high-end',
      isDiscreteGpu: true,
      isSoftwareGpu: false,
      matchedRule: isEntryLegacy ? 'nvidia-entry-discrete' : 'nvidia-high-performance',
    };
  }

  // 9. AMD Radeon GPUs
  if (lower.includes('radeon') || lower.includes('amd')) {
    const isHighEndRadeon =
      /\b(radeon\s*rx|radeon\s*pro|radeon\s*vii|radeon\s*[678][89]0m)\b/i.test(lower);
    const isGenericApu =
      !isHighEndRadeon &&
      (lower.includes('radeon(tm) graphics') || /\bvega\s*[3678]\b/i.test(lower));
    return {
      vendorFamily: 'amd',
      gpuTier: isGenericApu ? 'mid-range' : 'high-end',
      isDiscreteGpu: !isGenericApu,
      isSoftwareGpu: false,
      matchedRule: isGenericApu ? 'amd-integrated-apu' : 'amd-radeon-discrete',
    };
  }

  // 10. Intel Arc / Iris Xe / UHD / HD Graphics
  if (lower.includes('intel')) {
    if (lower.includes('arc')) {
      return {
        vendorFamily: 'intel',
        gpuTier: 'high-end',
        isDiscreteGpu: true,
        isSoftwareGpu: false,
        matchedRule: 'intel-arc-discrete',
      };
    }
    if (lower.includes('iris')) {
      // High-efficiency integrated GPU (Iris Xe / Iris Plus / Iris Pro)
      const hasStrongDesktopCpu = Boolean(ctx.isDesktop && (ctx.hardwareConcurrency ?? 0) >= 12);
      return {
        vendorFamily: 'intel',
        gpuTier: hasStrongDesktopCpu ? 'high-end' : 'mid-range',
        isDiscreteGpu: false,
        isSoftwareGpu: false,
        matchedRule: hasStrongDesktopCpu ? 'intel-iris-xe-high-cpu' : 'intel-iris-midrange',
      };
    }
    if (/\b(hd\s*graphics\s*[2345]\d{2,3}|uhd\s*graphics\s*60[05])\b/i.test(lower)) {
      return {
        vendorFamily: 'intel',
        gpuTier: 'low-end',
        isDiscreteGpu: false,
        isSoftwareGpu: false,
        matchedRule: 'intel-legacy-igpu',
      };
    }
    return {
      vendorFamily: 'intel',
      gpuTier: 'mid-range',
      isDiscreteGpu: false,
      isSoftwareGpu: false,
      matchedRule: 'intel-uhd-standard',
    };
  }

  return {
    vendorFamily: 'unknown',
    gpuTier: 'unknown',
    isDiscreteGpu: false,
    isSoftwareGpu: false,
    matchedRule: 'unrecognized-renderer',
  };
}

/**
 * Probes WebGL2/WebGL1 limits, unmasked GPU renderer, and hardware compressed
 * texture formats on a single disposable offscreen canvas, immediately releasing
 * the context via `WEBGL_lose_context` and caching the result at module scope.
 */
export function probeWebGLCapabilities(
  ctxHint: GpuClassificationContext = {},
  forceRefresh = false
): WebGLProbeResult {
  if (cachedWebGLProbe && !forceRefresh) {
    // Re-evaluate GPU classification if platform/screen context hints changed while reusing GL probe
    const reclassified = classifyGpuRenderer(cachedWebGLProbe.gpuRenderer, {
      ...ctxHint,
      webgl2Available: cachedWebGLProbe.webgl2Available,
      maxTextureSize: cachedWebGLProbe.maxTextureSize,
    });
    return {
      ...cachedWebGLProbe,
      gpuVendorFamily: reclassified.vendorFamily,
      gpuTier: reclassified.gpuTier,
      isDiscreteGpu: reclassified.isDiscreteGpu,
      isSoftwareGpu: reclassified.isSoftwareGpu,
    };
  }

  if (typeof document === 'undefined') {
    return {
      webgl2Available: false,
      webgl1Available: false,
      gpuVendor: undefined,
      gpuRenderer: undefined,
      gpuVendorFamily: 'unknown',
      gpuTier: 'unknown',
      isDiscreteGpu: false,
      isSoftwareGpu: false,
      maxTextureSize: 4096,
      maxRenderbufferSize: 4096,
      maxVertexUniformVectors: 256,
      maxTextureImageUnits: 16,
      maxAnisotropyHardware: 1,
      compressedTextures: { ...DEFAULT_COMPRESSED_TEXTURES },
    };
  }

  let webgl2Available = false;
  let webgl1Available = false;
  let gpuVendor: string | undefined;
  let gpuRenderer: string | undefined;
  let maxTextureSize = 4096;
  let maxRenderbufferSize = 4096;
  let maxVertexUniformVectors = 256;
  let maxTextureImageUnits = 8;
  let maxAnisotropyHardware = 1;
  let compressedTextures: CompressedTextureSupport = { ...DEFAULT_COMPRESSED_TEXTURES };

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    let gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl2', { powerPreference: 'default' }) as WebGL2RenderingContext | null;
      if (gl) {
        webgl2Available = true;
        webgl1Available = true;
      }
    } catch {
      gl = null;
    }

    if (!gl) {
      try {
        gl = (canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
        if (gl) {
          webgl1Available = true;
        }
      } catch {
        gl = null;
      }
    }

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuVendor = String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '');
        gpuRenderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
      }
      if (!gpuRenderer) {
        gpuRenderer = String(gl.getParameter(gl.RENDERER) || '');
      }
      if (!gpuVendor) {
        gpuVendor = String(gl.getParameter(gl.VENDOR) || '');
      }

      maxTextureSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 4096;
      maxRenderbufferSize = Number(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)) || 4096;
      maxVertexUniformVectors = Number(gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)) || 256;
      maxTextureImageUnits = Number(gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)) || 8;

      const anisoExt =
        gl.getExtension('EXT_texture_filter_anisotropic') ||
        gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
        gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
      if (anisoExt) {
        maxAnisotropyHardware =
          Number(gl.getParameter(anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT)) || 1;
      }

      const astc = Boolean(gl.getExtension('WEBGL_compressed_texture_astc'));
      const etc2 = Boolean(gl.getExtension('WEBGL_compressed_texture_etc'));
      const etc1 = Boolean(gl.getExtension('WEBGL_compressed_texture_etc1'));
      const s3tc = Boolean(
        gl.getExtension('WEBGL_compressed_texture_s3tc') ||
          gl.getExtension('MOZ_WEBGL_compressed_texture_s3tc') ||
          gl.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc')
      );
      const bptc = Boolean(gl.getExtension('EXT_texture_compression_bptc'));
      const pvrtc = Boolean(
        gl.getExtension('WEBGL_compressed_texture_pvrtc') ||
          gl.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc')
      );

      const preferredFormat = resolvePreferredCompressedFormat({
        astc,
        etc2,
        etc1,
        s3tc,
        bptc,
        pvrtc,
      });

      compressedTextures = {
        astc,
        etc2,
        etc1,
        s3tc,
        bptc,
        pvrtc,
        ktx2Supported: webgl2Available && preferredFormat !== 'rgba8',
        preferredFormat,
      };

      // Immediately release temporary WebGL context so we never consume browser context slots
      const loseContext = gl.getExtension('WEBGL_lose_context');
      loseContext?.loseContext();
    }
  } catch {
    // WebGL blocked or unavailable in environment
  }

  const gpuInfo = classifyGpuRenderer(gpuRenderer, {
    ...ctxHint,
    webgl2Available,
    maxTextureSize,
  });

  cachedWebGLProbe = {
    webgl2Available,
    webgl1Available,
    gpuVendor,
    gpuRenderer,
    gpuVendorFamily: gpuInfo.vendorFamily,
    gpuTier: gpuInfo.gpuTier,
    isDiscreteGpu: gpuInfo.isDiscreteGpu,
    isSoftwareGpu: gpuInfo.isSoftwareGpu,
    maxTextureSize,
    maxRenderbufferSize,
    maxVertexUniformVectors,
    maxTextureImageUnits,
    maxAnisotropyHardware,
    compressedTextures,
  };

  return cachedWebGLProbe;
}

/**
 * Detects platform and primary environment ('web-desktop' vs 'phone').
 */
export function detectPlatformAndEnvironment(
  ua: string,
  isTouch: boolean,
  viewportWidth: number,
  viewportHeight: number
): {
  platform: DevicePlatform;
  environment: PrimaryEnvironment;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
} {
  const minDimension = Math.min(viewportWidth, viewportHeight);
  const isAndroidUA = /Android/i.test(ua);
  const isIPhoneUA = /iPhone|iPod/i.test(ua);
  const isIPadUA = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && isTouch);
  const isMobileUA = /Android.*Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    (isAndroidUA && minDimension < 600);
  const isTabletUA = isIPadUA || /tablet|(android(?!.*mobile))/i.test(ua);

  const isTablet =
    isTabletUA || (isTouch && minDimension >= 600 && minDimension <= 1024 && !isMobileUA);
  const isMobile = !isTablet && (isMobileUA || (isTouch && minDimension < 600));
  const isDesktop = !isMobile && !isTablet;

  let platform: DevicePlatform = 'other';
  if (isAndroidUA && isMobile) {
    platform = 'android';
  } else if (isIPhoneUA) {
    platform = 'ios';
  } else if (isTablet) {
    platform = isAndroidUA ? 'android' : 'tablet';
  } else if (/Windows/i.test(ua)) {
    platform = 'windows';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    platform = 'macos';
  }

  // Two Primary Environments per Section 2: 'phone' vs 'web-desktop'
  const environment: PrimaryEnvironment = isMobile ? 'phone' : 'web-desktop';

  return {
    platform,
    environment,
    isMobile,
    isTablet,
    isDesktop,
  };
}

/**
 * Evaluates physical pixel count and fragment fill-rate pressure.
 */
export function evaluateScreenFillRate(
  viewportWidth: number,
  viewportHeight: number,
  devicePixelRatio: number,
  environment: PrimaryEnvironment
): ScreenFillRateMetrics {
  const safeDpr = Math.max(1, devicePixelRatio || 1);
  const physicalWidth = Math.round(viewportWidth * safeDpr);
  const physicalHeight = Math.round(viewportHeight * safeDpr);
  const physicalPixelCount = physicalWidth * physicalHeight;

  let fillRatePressure: ScreenFillRateMetrics['fillRatePressure'] = 'low';
  if (environment === 'phone') {
    if (physicalPixelCount >= 3_800_000 || safeDpr >= 3.5) {
      fillRatePressure = 'extreme';
    } else if (physicalPixelCount >= 2_400_000 || safeDpr >= 2.75) {
      fillRatePressure = 'high';
    } else if (physicalPixelCount >= 1_400_000) {
      fillRatePressure = 'moderate';
    }
  } else {
    if (physicalPixelCount >= 8_200_000) {
      // 4K UHD+ (3840x2160 = 8.29M pixels)
      fillRatePressure = 'extreme';
    } else if (physicalPixelCount >= 4_500_000) {
      // Retina QHD / 5K scaled
      fillRatePressure = 'high';
    } else if (physicalPixelCount >= 2_200_000) {
      fillRatePressure = 'moderate';
    }
  }

  return {
    viewportWidth,
    viewportHeight,
    devicePixelRatio: safeDpr,
    physicalWidth,
    physicalHeight,
    physicalPixelCount,
    fillRatePressure,
  };
}

/**
 * Estimates conservative per-tab memory headroom without trusting raw system RAM alone.
 */
export function evaluateMemorySnapshot(
  deviceMemoryGb: number | undefined,
  environment: PrimaryEnvironment,
  jsHeapSizeLimitBytes?: number,
  totalJSHeapSizeBytes?: number,
  usedJSHeapSizeBytes?: number
): MemorySnapshot {
  const jsHeapUtilization =
    jsHeapSizeLimitBytes && jsHeapSizeLimitBytes > 0 && typeof usedJSHeapSizeBytes === 'number'
      ? Math.min(1, Math.max(0, usedJSHeapSizeBytes / jsHeapSizeLimitBytes))
      : undefined;

  // Browser tabs can NEVER safely consume total device RAM.
  // Mobile OS Jetsam / LMK kills tabs well below physical capacity (~120–350 MB on 2–6 GB phones).
  let estimatedAvailableTabBudgetMb: number;
  if (typeof deviceMemoryGb === 'number') {
    if (deviceMemoryGb <= 2) {
      estimatedAvailableTabBudgetMb = 96;
    } else if (deviceMemoryGb <= 4) {
      estimatedAvailableTabBudgetMb = 180;
    } else if (deviceMemoryGb <= 6) {
      estimatedAvailableTabBudgetMb = 260;
    } else {
      estimatedAvailableTabBudgetMb = environment === 'phone' ? 380 : 640;
    }
  } else {
    // Safari / Firefox where navigator.deviceMemory is undefined:
    // Use conservative per-environment tab ceiling rather than assuming extreme low or infinite RAM.
    estimatedAvailableTabBudgetMb = environment === 'phone' ? 220 : 480;
  }

  if (jsHeapSizeLimitBytes && jsHeapSizeLimitBytes > 0) {
    const heapCapMb = Math.round((jsHeapSizeLimitBytes / (1024 * 1024)) * 0.28);
    estimatedAvailableTabBudgetMb = Math.min(
      estimatedAvailableTabBudgetMb,
      Math.max(80, heapCapMb)
    );
  }

  return {
    deviceMemoryGb,
    jsHeapSizeLimitBytes,
    totalJSHeapSizeBytes,
    usedJSHeapSizeBytes,
    jsHeapUtilization,
    estimatedAvailableTabBudgetMb,
  };
}

/**
 * Transparent multi-factor scoring & profile classification algorithm.
 *
 * Evaluates GPU architecture + GL limits, Graphics API & compressed texture hardware,
 * CPU concurrency, bounded memory hints (neutral when undefined), fill-rate pressure,
 * network/Data-Saver, battery saver, accessibility reduced-motion, and thermal pressure.
 */
export function scoreDeviceCapabilities(params: {
  environment: PrimaryEnvironment;
  platform: DevicePlatform;
  isTablet: boolean;
  hardwareConcurrency: number;
  prefersReducedMotion: boolean;
  isLowPower: boolean;
  webgpuAvailable: boolean;
  webgl: WebGLProbeResult;
  memory: MemorySnapshot;
  screen: ScreenFillRateMetrics;
  network: NetworkCapabilityMetrics;
  thermalState: ThermalPressureState;
}): CapabilityClassificationBreakdown {
  const {
    environment,
    platform,
    hardwareConcurrency,
    prefersReducedMotion,
    isLowPower,
    webgpuAvailable,
    webgl,
    memory,
    screen,
    network,
    thermalState,
  } = params;

  const reasons: string[] = [];
  const ramSignalPresent = typeof memory.deviceMemoryGb === 'number';

  // 1. GPU Architecture & Hardware Limits (0..42 pts)
  let gpuScore = 18;
  if (webgl.isSoftwareGpu || webgl.gpuTier === 'software' || !webgl.webgl1Available) {
    gpuScore = 0;
    reasons.push('software-or-missing-webgl');
  } else if (webgl.gpuTier === 'high-end') {
    gpuScore = 36;
    if (webgl.maxTextureSize >= 16384 && webgl.maxRenderbufferSize >= 16384) {
      gpuScore += 6;
    } else if (webgl.maxTextureSize >= 8192) {
      gpuScore += 3;
    }
    reasons.push(`gpu:high-end(${webgl.gpuVendorFamily})`);
  } else if (webgl.gpuTier === 'mid-range') {
    gpuScore = 23;
    if (webgl.maxTextureSize >= 8192) {
      gpuScore += 4;
    }
    reasons.push(`gpu:mid-range(${webgl.gpuVendorFamily})`);
  } else if (webgl.gpuTier === 'low-end') {
    gpuScore = 6;
    reasons.push(`gpu:low-end(${webgl.gpuVendorFamily})`);
  } else {
    // Unknown GPU string: score from GL hardware limits
    if (webgl.webgl2Available && webgl.maxTextureSize >= 16384) {
      gpuScore = 22;
    } else if (webgl.webgl2Available && webgl.maxTextureSize >= 8192) {
      gpuScore = 16;
    } else {
      gpuScore = 8;
    }
    reasons.push(`gpu:inferred-from-gl-limits(maxTex=${webgl.maxTextureSize})`);
  }

  // 2. Graphics API & Hardware Compressed Texture Support (0..18 pts)
  let apiScore = 0;
  if (webgl.webgl2Available) {
    apiScore += 8;
  } else if (webgl.webgl1Available) {
    apiScore += 2;
  }
  if (webgpuAvailable) {
    apiScore += 5;
    reasons.push('api:webgpu-available');
  }
  if (webgl.compressedTextures.ktx2Supported) {
    apiScore += 5;
    reasons.push(`tex:${webgl.compressedTextures.preferredFormat}`);
  }

  // 3. CPU Concurrency (0..16 pts)
  let cpuScore = 5;
  if (hardwareConcurrency >= 10) {
    cpuScore = 16;
  } else if (hardwareConcurrency >= 8) {
    cpuScore = 13;
  } else if (hardwareConcurrency >= 6) {
    cpuScore = 10;
  } else if (hardwareConcurrency >= 4) {
    cpuScore = 5;
  } else {
    cpuScore = 1;
  }

  // 4. Memory & JS Heap Headroom (0..14 pts — bounded so RAM alone NEVER decides!)
  let memoryScore = 8; // Neutral baseline when navigator.deviceMemory is undefined (Safari/iOS, Firefox)
  if (ramSignalPresent) {
    const gb = memory.deviceMemoryGb!;
    if (gb >= 8) {
      memoryScore = 12;
    } else if (gb >= 4) {
      memoryScore = 8;
    } else if (gb >= 3) {
      memoryScore = 4;
    } else {
      memoryScore = 1;
      reasons.push(`memory:low-hint(${gb}GB)`);
    }
  } else {
    // Corroborate neutral baseline on flagship GPUs when browser omits deviceMemory
    if (webgl.gpuTier === 'high-end') {
      memoryScore = 10;
    }
    reasons.push('memory:unreported-neutral-baseline');
  }

  if (memory.jsHeapSizeLimitBytes) {
    if (memory.jsHeapSizeLimitBytes >= 3.5 * 1024 * 1024 * 1024) {
      memoryScore = Math.min(14, memoryScore + 2);
    } else if (memory.jsHeapSizeLimitBytes < 700 * 1024 * 1024) {
      memoryScore = Math.max(0, memoryScore - 5);
      reasons.push('memory:tight-js-heap-limit');
    }
  }
  if (typeof memory.jsHeapUtilization === 'number' && memory.jsHeapUtilization > 0.8) {
    memoryScore = Math.max(0, memoryScore - 8);
    reasons.push('memory:high-heap-utilization');
  }

  // 5. Screen Resolution & Fill-Rate Pressure Penalty (0..-10 pts)
  let fillRatePenalty = 0;
  if (webgl.gpuTier !== 'high-end') {
    if (screen.fillRatePressure === 'extreme') {
      fillRatePenalty = 8;
      reasons.push('fillrate:extreme-dpr-penalty');
    } else if (screen.fillRatePressure === 'high') {
      fillRatePenalty = 3;
    }
  }

  // 6. Network / Bandwidth Penalty (0..-12 pts)
  let networkPenalty = 0;
  if (network.isConstrainedNetwork) {
    networkPenalty = 12;
    reasons.push('network:constrained-or-savedata');
  } else if (network.effectiveType === '3g') {
    networkPenalty = 8;
    reasons.push('network:3g-bandwidth-cap');
  }

  const compositeScore = Math.max(
    0,
    Math.min(100, gpuScore + apiScore + cpuScore + memoryScore - fillRatePenalty - networkPenalty)
  );

  // Determine Logical Hardware Tier ('low-end' | 'mid-range' | 'high-end')
  let logicalTier: DeviceLogicalTier;
  if (
    webgl.isSoftwareGpu ||
    !webgl.webgl1Available ||
    webgl.gpuTier === 'low-end' ||
    (ramSignalPresent && memory.deviceMemoryGb! <= 2) ||
    compositeScore < 40
  ) {
    // Note:
    // - Even if an entry Android phone advertises 8GB RAM, a 'low-end' GPU (e.g. Adreno 610 / Mali-G52)
    //   stays in 'low-end' logical rendering capability because GPU fill-rate & bandwidth are the bottleneck.
    // - Conversely, when 2GB total system RAM is explicitly reported (~96 MB safe per-tab budget),
    //   logicalTier is capped at 'low-end' to prevent OS Low-Memory-Killer (LMK) tab termination.
    // - Missing deviceMemory (Safari/iOS, Firefox) has ramSignalPresent === false and is never penalized.
    logicalTier = 'low-end';
    if (ramSignalPresent && memory.deviceMemoryGb! <= 2) {
      reasons.push('cap:2gb-ram-tab-budget->ultra-light');
    }
  } else if (
    compositeScore >= 68 &&
    (environment === 'web-desktop' ? webgl.gpuTier !== 'unknown' : webgl.gpuTier === 'high-end')
  ) {
    logicalTier = 'high-end';
  } else {
    logicalTier = 'mid-range';
  }

  // Map Logical Tier -> Base Rendering Profile, applying safety/power/network/thermal caps
  let recommendedProfile: RenderingProfileName =
    logicalTier === 'high-end'
      ? 'high-fidelity'
      : logicalTier === 'mid-range'
        ? 'balanced'
        : 'ultra-light';

  if (webgl.isSoftwareGpu || !webgl.webgl1Available) {
    recommendedProfile = 'ultra-light';
    reasons.push('override:software-gpu->ultra-light');
  } else if (prefersReducedMotion) {
    recommendedProfile = 'ultra-light';
    reasons.push('override:prefers-reduced-motion->ultra-light');
  } else if (isLowPower) {
    recommendedProfile = 'ultra-light';
    reasons.push('override:low-battery-power->ultra-light');
  } else if (thermalState === 'critical') {
    recommendedProfile = 'ultra-light';
    reasons.push('override:thermal-critical->ultra-light');
  } else if (network.isConstrainedNetwork) {
    recommendedProfile = 'ultra-light';
    reasons.push('override:save-data-or-2g->ultra-light');
  } else {
    if (thermalState === 'serious' && recommendedProfile === 'high-fidelity') {
      recommendedProfile = 'balanced';
      reasons.push('cap:thermal-serious->balanced');
    }
    if (network.effectiveType === '3g' && recommendedProfile === 'high-fidelity') {
      recommendedProfile = 'balanced';
      reasons.push('cap:network-3g->balanced');
    }
  }

  const androidTier: DeviceLogicalTier | null = platform === 'android' ? logicalTier : null;

  return {
    gpuScore,
    cpuScore,
    memoryScore,
    apiScore,
    fillRatePenalty,
    networkPenalty,
    compositeScore,
    logicalTier,
    androidTier,
    recommendedProfile,
    ramSignalPresent,
    reasons,
  };
}

/**
 * Checks whether the W3C Compute Pressure API (`PressureObserver`) is supported in the current runtime.
 * Note: Currently supported in Chromium 125+ in secure contexts; unsupported in Safari and Firefox.
 */
export function isComputePressureSupported(): boolean {
  return typeof globalThis !== 'undefined' && 'PressureObserver' in globalThis;
}

/**
 * Safely subscribes to W3C `PressureObserver('cpu')` thermal/compute states when available.
 * Honestly reports `'unsupported'` on browsers without Compute Pressure API support.
 */
export function observeThermalPressure(
  onChange: (state: ThermalPressureState) => void
): () => void {
  if (!isComputePressureSupported()) {
    onChange('unsupported');
    return () => {};
  }

  let disconnected = false;
  let observerInstance: { observe: (source: string, opts?: { sampleInterval?: number }) => Promise<void>; disconnect: () => void } | null = null;

  try {
    const PressureObserverCtor = (globalThis as unknown as {
      PressureObserver: new (
        cb: (records: Array<{ state?: ThermalPressureState }>) => void
      ) => {
        observe: (source: string, opts?: { sampleInterval?: number }) => Promise<void>;
        disconnect: () => void;
      };
    }).PressureObserver;

    observerInstance = new PressureObserverCtor((records) => {
      if (disconnected || !records || records.length === 0) return;
      const latest = records[records.length - 1];
      if (
        latest?.state === 'nominal' ||
        latest?.state === 'fair' ||
        latest?.state === 'serious' ||
        latest?.state === 'critical'
      ) {
        onChange(latest.state);
      }
    });

    observerInstance.observe('cpu', { sampleInterval: 2000 }).catch(() => {
      if (!disconnected) {
        onChange('unsupported');
      }
    });
  } catch {
    onChange('unsupported');
    return () => {};
  }

  return () => {
    disconnected = true;
    try {
      observerInstance?.disconnect();
    } catch {
      // Safe no-op
    }
  };
}

/**
 * Comprehensive, SSR-safe multi-signal device capability detector.
 * Supports deterministic overrides for unit testing all Android, iOS, and desktop profiles.
 */
export function detectExtendedDeviceCapabilities(
  overrides?: CapabilityInputOverrides
): ExtendedDeviceCapabilities {
  const isSSR =
    !overrides && (typeof window === 'undefined' || typeof navigator === 'undefined');

  if (isSSR) {
    const defaultMemory = evaluateMemorySnapshot(undefined, 'web-desktop');
    const defaultScreen = evaluateScreenFillRate(1280, 800, 1, 'web-desktop');
    const defaultNetwork: NetworkCapabilityMetrics = {
      saveData: false,
      effectiveType: 'unknown',
      isConstrainedNetwork: false,
    };
    const defaultWebGL: WebGLProbeResult = {
      webgl2Available: true,
      webgl1Available: true,
      gpuVendor: undefined,
      gpuRenderer: undefined,
      gpuVendorFamily: 'unknown',
      gpuTier: 'mid-range',
      isDiscreteGpu: false,
      isSoftwareGpu: false,
      maxTextureSize: 8192,
      maxRenderbufferSize: 8192,
      maxVertexUniformVectors: 1024,
      maxTextureImageUnits: 16,
      maxAnisotropyHardware: 4,
      compressedTextures: { ...DEFAULT_COMPRESSED_TEXTURES },
    };
    const classification = scoreDeviceCapabilities({
      environment: 'web-desktop',
      platform: 'other',
      isTablet: false,
      hardwareConcurrency: 4,
      prefersReducedMotion: false,
      isLowPower: false,
      webgpuAvailable: false,
      webgl: defaultWebGL,
      memory: defaultMemory,
      screen: defaultScreen,
      network: defaultNetwork,
      thermalState: 'unsupported',
    });

    return {
      devicePixelRatio: 1,
      hardwareConcurrency: 4,
      deviceMemory: undefined,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouch: false,
      prefersReducedMotion: false,
      isLowPower: false,
      gpuRenderer: undefined,
      isDiscreteGpu: false,
      isSoftwareGpu: false,
      environment: 'web-desktop',
      platform: 'other',
      logicalTier: classification.logicalTier,
      androidTier: null,
      recommendedProfile: classification.recommendedProfile,
      gpuVendor: undefined,
      gpuVendorFamily: 'unknown',
      gpuTier: 'mid-range',
      webgl2Available: true,
      webgl1Available: true,
      webgpuAvailable: false,
      maxTextureSize: 8192,
      maxRenderbufferSize: 8192,
      maxVertexUniformVectors: 1024,
      maxTextureImageUnits: 16,
      maxAnisotropyHardware: 4,
      compressedTextures: { ...DEFAULT_COMPRESSED_TEXTURES },
      ktx2Supported: false,
      astcSupported: false,
      etc2Supported: false,
      memory: defaultMemory,
      screen: defaultScreen,
      network: defaultNetwork,
      thermalState: 'unsupported',
      computePressureSupported: false,
      classification,
    };
  }

  const ua =
    overrides?.userAgent ??
    (typeof navigator !== 'undefined' ? navigator.userAgent || '' : '');

  const dpr =
    overrides?.devicePixelRatio ??
    (typeof window !== 'undefined' && typeof window.devicePixelRatio === 'number'
      ? window.devicePixelRatio
      : 1);

  const viewportWidth =
    overrides?.viewportWidth ??
    (typeof window !== 'undefined' && typeof window.innerWidth === 'number'
      ? window.innerWidth
      : 1280);

  const viewportHeight =
    overrides?.viewportHeight ??
    (typeof window !== 'undefined' && typeof window.innerHeight === 'number'
      ? window.innerHeight
      : 800);

  const hardwareConcurrency =
    overrides?.hardwareConcurrency ??
    (typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
      ? navigator.hardwareConcurrency
      : 4);

  const deviceMemory =
    overrides && 'deviceMemory' in overrides
      ? overrides.deviceMemory
      : typeof navigator !== 'undefined'
        ? (navigator as unknown as { deviceMemory?: number }).deviceMemory
        : undefined;

  const isTouch =
    overrides?.isTouch ??
    Boolean(
      (typeof navigator !== 'undefined' &&
        navigator.maxTouchPoints &&
        navigator.maxTouchPoints > 0) ||
        (typeof window !== 'undefined' && 'ontouchstart' in window)
    );

  const { platform, environment, isMobile, isTablet, isDesktop } =
    detectPlatformAndEnvironment(ua, isTouch, viewportWidth, viewportHeight);

  let prefersReducedMotion = overrides?.prefersReducedMotion ?? false;
  if (overrides?.prefersReducedMotion === undefined) {
    try {
      if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      }
    } catch {
      prefersReducedMotion = false;
    }
  }

  const batteryLevel = overrides?.batteryLevel;
  const batteryCharging = overrides?.batteryCharging;
  const derivedLowBattery =
    typeof batteryLevel === 'number' && batteryCharging === false && batteryLevel <= 0.2;
  const isLowPower = Boolean(overrides?.isLowPower || derivedLowBattery);

  const webgpuAvailable =
    overrides?.webgpuAvailable ??
    Boolean(typeof navigator !== 'undefined' && 'gpu' in navigator);

  // WebGL hardware probe (uses cached browser result unless test overrides provided)
  let webgl: WebGLProbeResult;
  if (overrides?.webglProbe) {
    const p = overrides.webglProbe;
    const webgl2Available = p.webgl2Available ?? true;
    const webgl1Available = p.webgl1Available ?? webgl2Available;
    const maxTextureSize = p.maxTextureSize ?? 8192;
    const classified = classifyGpuRenderer(p.gpuRenderer, {
      platform,
      isDesktop,
      webgl2Available,
      webgpuAvailable,
      maxTextureSize,
      hardwareConcurrency,
      devicePixelRatio: dpr,
      viewportWidth,
      viewportHeight,
    });
    const rawCompressed = {
      astc: p.compressedTextures?.astc ?? false,
      etc2: p.compressedTextures?.etc2 ?? false,
      etc1: p.compressedTextures?.etc1 ?? false,
      s3tc: p.compressedTextures?.s3tc ?? false,
      bptc: p.compressedTextures?.bptc ?? false,
      pvrtc: p.compressedTextures?.pvrtc ?? false,
    };
    const preferredFormat =
      p.compressedTextures?.preferredFormat ?? resolvePreferredCompressedFormat(rawCompressed);
    webgl = {
      webgl2Available,
      webgl1Available,
      gpuVendor: p.gpuVendor,
      gpuRenderer: p.gpuRenderer,
      gpuVendorFamily: p.gpuVendorFamily ?? classified.vendorFamily,
      gpuTier: p.gpuTier ?? classified.gpuTier,
      isDiscreteGpu: p.isDiscreteGpu ?? classified.isDiscreteGpu,
      isSoftwareGpu: p.isSoftwareGpu ?? classified.isSoftwareGpu,
      maxTextureSize,
      maxRenderbufferSize: p.maxRenderbufferSize ?? maxTextureSize,
      maxVertexUniformVectors: p.maxVertexUniformVectors ?? 1024,
      maxTextureImageUnits: p.maxTextureImageUnits ?? 16,
      maxAnisotropyHardware: p.maxAnisotropyHardware ?? 8,
      compressedTextures: {
        ...rawCompressed,
        ktx2Supported:
          p.compressedTextures?.ktx2Supported ?? (webgl2Available && preferredFormat !== 'rgba8'),
        preferredFormat,
      },
    };
  } else {
    webgl = probeWebGLCapabilities({
      platform,
      isDesktop,
      webgpuAvailable,
      hardwareConcurrency,
      devicePixelRatio: dpr,
      viewportWidth,
      viewportHeight,
    });
  }

  // Chromium performance.memory snapshot (safe feature-detection)
  const perfMem =
    typeof performance !== 'undefined'
      ? (
          performance as unknown as {
            memory?: {
              jsHeapSizeLimit?: number;
              totalJSHeapSize?: number;
              usedJSHeapSize?: number;
            };
          }
        ).memory
      : undefined;

  const memory = evaluateMemorySnapshot(
    deviceMemory,
    environment,
    overrides?.jsHeapSizeLimitBytes ?? perfMem?.jsHeapSizeLimit,
    overrides?.totalJSHeapSizeBytes ?? perfMem?.totalJSHeapSize,
    overrides?.usedJSHeapSizeBytes ?? perfMem?.usedJSHeapSize
  );

  const screen = evaluateScreenFillRate(viewportWidth, viewportHeight, dpr, environment);

  // Network Information API (Chromium / Android WebView; safely optional elsewhere)
  const navConn =
    typeof navigator !== 'undefined'
      ? (
          navigator as unknown as {
            connection?: {
              saveData?: boolean;
              effectiveType?: string;
              downlink?: number;
              rtt?: number;
            };
          }
        ).connection
      : undefined;

  const rawEffType = overrides?.effectiveType ?? navConn?.effectiveType;
  const effectiveType: EffectiveNetworkType =
    rawEffType === 'slow-2g' || rawEffType === '2g' || rawEffType === '3g' || rawEffType === '4g'
      ? rawEffType
      : 'unknown';
  const saveData = Boolean(overrides?.saveData ?? navConn?.saveData ?? false);
  const network: NetworkCapabilityMetrics = {
    saveData,
    effectiveType,
    downlinkMbps: overrides?.downlinkMbps ?? navConn?.downlink,
    rttMs: overrides?.rttMs ?? navConn?.rtt,
    isConstrainedNetwork:
      saveData || effectiveType === 'slow-2g' || effectiveType === '2g',
  };

  const computePressureSupported = isComputePressureSupported();
  const thermalState: ThermalPressureState =
    overrides?.thermalState ?? (computePressureSupported ? 'nominal' : 'unsupported');

  const classification = scoreDeviceCapabilities({
    environment,
    platform,
    isTablet,
    hardwareConcurrency,
    prefersReducedMotion,
    isLowPower,
    webgpuAvailable,
    webgl,
    memory,
    screen,
    network,
    thermalState,
  });

  return {
    devicePixelRatio: dpr,
    hardwareConcurrency,
    deviceMemory,
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    prefersReducedMotion,
    isLowPower,
    gpuRenderer: webgl.gpuRenderer,
    isDiscreteGpu: webgl.isDiscreteGpu,
    isSoftwareGpu: webgl.isSoftwareGpu,
    environment,
    platform,
    logicalTier: classification.logicalTier,
    androidTier: classification.androidTier,
    recommendedProfile: classification.recommendedProfile,
    gpuVendor: webgl.gpuVendor,
    gpuVendorFamily: webgl.gpuVendorFamily,
    gpuTier: webgl.gpuTier,
    webgl2Available: webgl.webgl2Available,
    webgl1Available: webgl.webgl1Available,
    webgpuAvailable,
    maxTextureSize: webgl.maxTextureSize,
    maxRenderbufferSize: webgl.maxRenderbufferSize,
    maxVertexUniformVectors: webgl.maxVertexUniformVectors,
    maxTextureImageUnits: webgl.maxTextureImageUnits,
    maxAnisotropyHardware: webgl.maxAnisotropyHardware,
    compressedTextures: webgl.compressedTextures,
    ktx2Supported: webgl.compressedTextures.ktx2Supported,
    astcSupported: webgl.compressedTextures.astc,
    etc2Supported: webgl.compressedTextures.etc2,
    memory,
    screen,
    network,
    batteryLevel,
    batteryCharging,
    thermalState,
    computePressureSupported,
    classification,
  };
}
