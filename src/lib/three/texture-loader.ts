import * as THREE from 'three';
import type { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import type { FoodRenderProfile } from './food-materials';

function resolveProfileTier(
  tierOrProfile?: FoodRenderProfile | 'low' | 'medium' | 'high' | string | null
): FoodRenderProfile {
  if (tierOrProfile === 'ultra-light' || tierOrProfile === 'low') return 'ultra-light';
  if (tierOrProfile === 'high-fidelity' || tierOrProfile === 'high') return 'high-fidelity';
  return 'balanced';
}

/**
 * Local-only Basis Universal transcoder path.
 * Strict CSP (`default-src 'self'`, `script-src 'self'`) forbids external CDNs.
 */
export const DEFAULT_LOCAL_BASIS_PATH = '/basis/';

export type GpuCompressedTextureFormat =
  | 'astc'
  | 'bptc'
  | 'etc2'
  | 's3tc'
  | 'pvrtc'
  | 'uncompressed';

export type TextureDeliveryFormat = 'ktx2' | 'webp' | 'jpeg' | 'png';

export interface TextureFormatSpec {
  id: string;
  container: TextureDeliveryFormat;
  gpuFormat: GpuCompressedTextureFormat;
  bitsPerPixel: number;
  vramReductionVsRgba8Pct: number;
  supportsAlpha: boolean;
  gpuUploadBlocking: 'minimal' | 'moderate' | 'high';
  recommendedMaps: readonly string[];
  targetHardware: string;
}

/**
 * Quantitative Texture Format Selection Matrix (Specification Section 6).
 * Compares GPU-compressed KTX2/Basis variants against WebP/JPEG/PNG delivery formats.
 */
export const TEXTURE_FORMAT_MATRIX: readonly TextureFormatSpec[] = [
  {
    id: 'ktx2-astc-4x4',
    container: 'ktx2',
    gpuFormat: 'astc',
    bitsPerPixel: 8,
    vramReductionVsRgba8Pct: 75,
    supportsAlpha: true,
    gpuUploadBlocking: 'minimal',
    recommendedMaps: ['baseColor', 'normal', 'orm', 'emissive'],
    targetHardware: 'Modern Android (Adreno 5xx+, Mali-Gxx) & iOS (A8+)',
  },
  {
    id: 'ktx2-etc2-rgba',
    container: 'ktx2',
    gpuFormat: 'etc2',
    bitsPerPixel: 8,
    vramReductionVsRgba8Pct: 75,
    supportsAlpha: true,
    gpuUploadBlocking: 'minimal',
    recommendedMaps: ['baseColor', 'orm', 'emissive'],
    targetHardware: 'Baseline WebGL2 Android & iOS devices',
  },
  {
    id: 'ktx2-bptc-bc7',
    container: 'ktx2',
    gpuFormat: 'bptc',
    bitsPerPixel: 8,
    vramReductionVsRgba8Pct: 75,
    supportsAlpha: true,
    gpuUploadBlocking: 'minimal',
    recommendedMaps: ['baseColor', 'normal', 'orm', 'emissive'],
    targetHardware: 'Desktop GPUs (NVIDIA, AMD, Intel, Apple Silicon)',
  },
  {
    id: 'ktx2-s3tc-bc3',
    container: 'ktx2',
    gpuFormat: 's3tc',
    bitsPerPixel: 8,
    vramReductionVsRgba8Pct: 75,
    supportsAlpha: true,
    gpuUploadBlocking: 'minimal',
    recommendedMaps: ['baseColor', 'orm'],
    targetHardware: 'Legacy Desktop GPUs without BC7',
  },
  {
    id: 'webp-lossy-or-lossless',
    container: 'webp',
    gpuFormat: 'uncompressed',
    bitsPerPixel: 32,
    vramReductionVsRgba8Pct: 0,
    supportsAlpha: true,
    gpuUploadBlocking: 'moderate',
    recommendedMaps: ['baseColor', 'orm', 'ui-poster'],
    targetHardware: 'Universal modern browser network fallback (small wire size, RGBA8 in VRAM)',
  },
  {
    id: 'jpeg-baseline',
    container: 'jpeg',
    gpuFormat: 'uncompressed',
    bitsPerPixel: 32,
    vramReductionVsRgba8Pct: 0,
    supportsAlpha: false,
    gpuUploadBlocking: 'moderate',
    recommendedMaps: ['opaque-baseColor'],
    targetHardware: 'Legacy opaque photo fallback (avoid for Normal/ORM due to 8x8 DCT block ringing)',
  },
  {
    id: 'png-rgba8',
    container: 'png',
    gpuFormat: 'uncompressed',
    bitsPerPixel: 32,
    vramReductionVsRgba8Pct: 0,
    supportsAlpha: true,
    gpuUploadBlocking: 'high',
    recommendedMaps: ['authoring-source', 'lossless-lut'],
    targetHardware: 'Lossless source only — large wire payload and full 32-bpp RGBA8 VRAM cost',
  },
] as const;

export interface TextureFormatCapabilities {
  astc: boolean;
  etc2: boolean;
  bptc: boolean;
  s3tc: boolean;
  pvrtc: boolean;
  webp: boolean;
  isWebGL2: boolean;
  maxAnisotropy: number;
  maxTextureSize: number;
  preferredGpuFormat: GpuCompressedTextureFormat;
  preferredDeliveryFormat: TextureDeliveryFormat;
}

export interface TextureProfileSettings {
  profile: FoodRenderProfile;
  maxDimension: 512 | 1024 | 2048 | number;
  anisotropy: number;
  generateMipmaps: boolean;
  minFilter: THREE.MinificationTextureFilter;
  magFilter: THREE.MagnificationTextureFilter;
  stripSecondaryMaps: boolean;
  vramBudgetMB: number;
}

/**
 * Calibrated Tier-Based Texture Profiles (Specification Section 6):
 * - `ultra-light` (2GB low-end phones): 512px cap, anisotropy 1, bilinear mip lookup (`LinearMipmapNearestFilter`).
 * - `balanced` (4–6GB mid-range phones): 1024px cap, anisotropy 4, trilinear mipmaps (`LinearMipmapLinearFilter`).
 * - `high-fidelity` (8GB+ flagship & desktop): 2048px cap, anisotropy 8, full trilinear mipmaps + all maps.
 */
export const TEXTURE_TIER_PROFILES: Record<FoodRenderProfile, TextureProfileSettings> = {
  'ultra-light': {
    profile: 'ultra-light',
    maxDimension: 512,
    anisotropy: 1,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapNearestFilter,
    magFilter: THREE.LinearFilter,
    stripSecondaryMaps: true,
    vramBudgetMB: 24,
  },
  balanced: {
    profile: 'balanced',
    maxDimension: 1024,
    anisotropy: 4,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    stripSecondaryMaps: false,
    vramBudgetMB: 64,
  },
  'high-fidelity': {
    profile: 'high-fidelity',
    maxDimension: 2048,
    anisotropy: 8,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    stripSecondaryMaps: false,
    vramBudgetMB: 160,
  },
};

export function getTextureProfileSettings(
  profileOrTier?: FoodRenderProfile | 'low' | 'medium' | 'high' | string
): TextureProfileSettings {
  const resolved = resolveProfileTier(profileOrTier);
  return TEXTURE_TIER_PROFILES[resolved];
}

/**
 * Enforces strict same-origin local decoder path safety.
 * Rejects external CDN origins (unpkg, jsdelivr, gstatic, or protocol-relative paths).
 */
export function sanitizeLocalDecoderPath(candidatePath?: string): string {
  if (!candidatePath) return DEFAULT_LOCAL_BASIS_PATH;
  const trimmed = candidatePath.trim();
  if (/^(https?:)?\/\//i.test(trimmed)) {
    throw new Error(
      `[texture-loader] External CDN decoder path "${trimmed}" is forbidden by CSP. Use a local path such as "${DEFAULT_LOCAL_BASIS_PATH}".`
    );
  }
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

/**
 * Estimates GPU VRAM consumption (in bytes) of a texture, accounting for
 * hardware block compression (8 bpp for ASTC 4x4 / ETC2 / BC7 vs 32 bpp RGBA8)
 * and the +33.3% mipmap pyramid chain when mipmaps are enabled.
 */
export function estimateTextureVramBytes(
  width: number,
  height: number,
  options: {
    gpuFormat?: GpuCompressedTextureFormat;
    hasMipmaps?: boolean;
  } = {}
): number {
  if (width <= 0 || height <= 0) return 0;
  const gpuFormat = options.gpuFormat ?? 'uncompressed';
  const hasMipmaps = options.hasMipmaps ?? true;
  const bytesPerPixel = gpuFormat === 'uncompressed' ? 4 : 1; // 8 bpp = 1 byte/texel for ASTC 4x4, ETC2 RGBA, BC7, S3TC BC3
  const baseBytes = width * height * bytesPerPixel;
  return hasMipmaps ? Math.ceil((baseBytes * 4) / 3) : baseBytes;
}

export interface GLRendererOrContextLike {
  extensions?: { has: (name: string) => boolean };
  capabilities?: {
    getMaxAnisotropy?: () => number;
    maxAnisotropy?: number;
    maxTextureSize?: number;
    isWebGL2?: boolean;
  };
  getExtension?: (name: string) => unknown;
  getParameter?: (pname: number) => unknown;
}

/**
 * Detects GPU hardware compressed texture support (ASTC, ETC2, BPTC, S3TC, PVRTC),
 * WebP support, maximum anisotropy, and selects the optimal texture format.
 * Safe in SSR / headless Node environments.
 */
export function detectTextureCapabilities(
  gl?: GLRendererOrContextLike | null
): TextureFormatCapabilities {
  const hasExt = (name: string): boolean => {
    if (!gl) return false;
    try {
      if (gl.extensions && typeof gl.extensions.has === 'function') {
        return Boolean(gl.extensions.has(name));
      }
      if (typeof gl.getExtension === 'function') {
        return Boolean(gl.getExtension(name));
      }
    } catch {
      return false;
    }
    return false;
  };

  const astc = hasExt('WEBGL_compressed_texture_astc');
  const etc2 = hasExt('WEBGL_compressed_texture_etc');
  const bptc = hasExt('EXT_texture_compression_bptc');
  const s3tc =
    hasExt('WEBGL_compressed_texture_s3tc') ||
    hasExt('WEBKIT_WEBGL_compressed_texture_s3tc') ||
    hasExt('MOZ_WEBGL_compressed_texture_s3tc');
  const pvrtc =
    hasExt('WEBGL_compressed_texture_pvrtc') ||
    hasExt('WEBKIT_WEBGL_compressed_texture_pvrtc');

  let maxAnisotropy = 1;
  let maxTextureSize = 2048;
  let isWebGL2 = false;

  if (gl?.capabilities) {
    if (typeof gl.capabilities.getMaxAnisotropy === 'function') {
      maxAnisotropy = Math.max(1, gl.capabilities.getMaxAnisotropy());
    } else if (typeof gl.capabilities.maxAnisotropy === 'number') {
      maxAnisotropy = Math.max(1, gl.capabilities.maxAnisotropy);
    }
    if (typeof gl.capabilities.maxTextureSize === 'number') {
      maxTextureSize = gl.capabilities.maxTextureSize;
    }
    if (typeof gl.capabilities.isWebGL2 === 'boolean') {
      isWebGL2 = gl.capabilities.isWebGL2;
    }
  }

  let preferredGpuFormat: GpuCompressedTextureFormat = 'uncompressed';
  if (astc) {
    preferredGpuFormat = 'astc';
  } else if (bptc) {
    preferredGpuFormat = 'bptc';
  } else if (etc2) {
    preferredGpuFormat = 'etc2';
  } else if (s3tc) {
    preferredGpuFormat = 's3tc';
  } else if (pvrtc) {
    preferredGpuFormat = 'pvrtc';
  }

  // Modern browsers universally decode WebP; SSR defaults to true as well
  const webp = true;
  const preferredDeliveryFormat: TextureDeliveryFormat =
    preferredGpuFormat !== 'uncompressed' ? 'ktx2' : webp ? 'webp' : 'png';

  return {
    astc,
    etc2,
    bptc,
    s3tc,
    pvrtc,
    webp,
    isWebGL2,
    maxAnisotropy,
    maxTextureSize,
    preferredGpuFormat,
    preferredDeliveryFormat,
  };
}

const basisAvailabilityCache = new Map<string, Promise<boolean>>();
const ktx2LoaderRegistry = new WeakMap<THREE.WebGLRenderer, KTX2Loader>();

/**
 * Checks whether local Basis Universal WASM decoder files exist under `public/basis/`
 * (same-origin `/basis/basis_transcoder.wasm`) before attempting KTX2 transcoding.
 * Never contacts external CDNs.
 */
export function checkLocalBasisTranscoderAvailable(
  localPath: string = DEFAULT_LOCAL_BASIS_PATH
): Promise<boolean> {
  const safePath = sanitizeLocalDecoderPath(localPath);
  const cached = basisAvailabilityCache.get(safePath);
  if (cached) return cached;

  const checkPromise = (async (): Promise<boolean> => {
    // Node / SSR environment check
    if (typeof window === 'undefined') {
      try {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const rel = safePath.replace(/^\/+/, '');
        const wasmDiskPath = path.join(process.cwd(), 'public', rel, 'basis_transcoder.wasm');
        return fs.existsSync(wasmDiskPath);
      } catch {
        return false;
      }
    }

    // Browser same-origin check
    if (typeof fetch !== 'function') return false;
    try {
      const response = await fetch(`${safePath}basis_transcoder.wasm`, {
        method: 'HEAD',
        cache: 'force-cache',
      });
      if (!response.ok) return false;
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      // Guard against SPA HTML 200 fallback pages masquerading as .wasm
      if (contentType.includes('text/html')) return false;
      return true;
    } catch {
      return false;
    }
  })();

  basisAvailabilityCache.set(safePath, checkPromise);
  return checkPromise;
}

/**
 * Resets cached Basis availability checks (primarily for unit tests).
 */
export function resetBasisTranscoderCheckCache(): void {
  basisAvailabilityCache.clear();
}

/**
 * Returns a configured `KTX2Loader` bound to local `/basis/` ONLY if the local
 * Basis WASM transcoder is present and `gl` is available; otherwise returns `null`
 * so callers cleanly fall back to WebP/PNG/glTF textures without errors.
 */
export async function getLocalKTX2Loader(
  gl: THREE.WebGLRenderer | null | undefined,
  localPath: string = DEFAULT_LOCAL_BASIS_PATH
): Promise<KTX2Loader | null> {
  if (!gl) return null;
  const safePath = sanitizeLocalDecoderPath(localPath);
  const available = await checkLocalBasisTranscoderAvailable(safePath);
  if (!available) return null;

  const existing = ktx2LoaderRegistry.get(gl);
  if (existing) return existing;

  const { KTX2Loader: ThreeKTX2Loader } = await import(
    'three/examples/jsm/loaders/KTX2Loader.js'
  );
  const loader = new ThreeKTX2Loader();
  loader.setTranscoderPath(safePath);
  loader.detectSupport(gl);
  ktx2LoaderRegistry.set(gl, loader);
  return loader;
}

// ============================================================================
// Color Space & Slot Classification
// ============================================================================

export const SRGB_COLOR_TEXTURE_SLOTS = [
  'map',
  'emissiveMap',
  'sheenColorMap',
  'specularColorMap',
] as const;

export const LINEAR_DATA_TEXTURE_SLOTS = [
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'alphaMap',
  'bumpMap',
  'displacementMap',
  'clearcoatMap',
  'clearcoatRoughnessMap',
  'clearcoatNormalMap',
  'sheenRoughnessMap',
  'specularIntensityMap',
  'transmissionMap',
  'thicknessMap',
  'anisotropyMap',
] as const;

export const SECONDARY_OPTIONAL_TEXTURE_SLOTS = [
  'clearcoatMap',
  'clearcoatRoughnessMap',
  'clearcoatNormalMap',
  'sheenColorMap',
  'sheenRoughnessMap',
  'specularIntensityMap',
  'specularColorMap',
  'transmissionMap',
  'thicknessMap',
  'anisotropyMap',
  'displacementMap',
  'bumpMap',
] as const;

const ALL_INSPECTED_SLOTS = [
  ...SRGB_COLOR_TEXTURE_SLOTS,
  ...LINEAR_DATA_TEXTURE_SLOTS,
] as const;

// ============================================================================
// Runtime Texture Optimizer (Deduplication, ColorSpace, Anisotropy, Downscale)
// ============================================================================

export interface TextureOptimizationStats {
  profile: FoodRenderProfile;
  uniqueTextures: number;
  deduplicatedSlots: number;
  downscaledTextures: number;
  colorSpacesFixed: number;
  strippedSecondaryMaps: number;
  anisotropyApplied: number;
  estimatedVramBeforeBytes: number;
  estimatedVramAfterBytes: number;
}

export interface OptimizeSceneTexturesCapabilities {
  maxAnisotropy?: number;
  getMaxAnisotropy?: () => number;
  capabilities?: {
    getMaxAnisotropy?: () => number;
    maxAnisotropy?: number;
  };
}

let nextImageObjectId = 1;
const imageIdentityMap = new WeakMap<object, number>();

function getImageDimensions(image: unknown): { width: number; height: number } {
  if (!image || typeof image !== 'object') return { width: 0, height: 0 };
  const img = image as {
    width?: number;
    height?: number;
    naturalWidth?: number;
    naturalHeight?: number;
    videoWidth?: number;
    videoHeight?: number;
  };
  const width = img.naturalWidth || img.width || img.videoWidth || 0;
  const height = img.naturalHeight || img.height || img.videoHeight || 0;
  return { width, height };
}

function computeByteBufferDigest(data: ArrayBufferView): string {
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  // Fast FNV-1a stride sample (samples up to 256 evenly spaced bytes + exact length)
  let hash = 2166136261;
  const step = Math.max(1, Math.floor(bytes.length / 256));
  for (let i = 0; i < bytes.length; i += step) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 16777619);
  }
  return `buf:${bytes.length}:${hash >>> 0}`;
}

function getImageSignature(texture: THREE.Texture): string {
  const image = texture.image as
    | {
        src?: string;
        currentSrc?: string;
        data?: ArrayBufferView;
        width?: number;
        height?: number;
      }
    | undefined;

  if (!image) {
    return `empty:${texture.uuid}`;
  }
  if (typeof image.currentSrc === 'string' && image.currentSrc.length > 0) {
    return `src:${image.currentSrc}`;
  }
  if (typeof image.src === 'string' && image.src.length > 0) {
    return `src:${image.src}`;
  }
  if (image.data && ArrayBuffer.isView(image.data)) {
    return `data:${image.width || 0}x${image.height || 0}:${computeByteBufferDigest(image.data)}`;
  }
  if (typeof image === 'object') {
    let id = imageIdentityMap.get(image);
    if (!id) {
      id = nextImageObjectId++;
      imageIdentityMap.set(image, id);
    }
    return `obj:${id}`;
  }
  return `uuid:${texture.uuid}`;
}

function getTextureDedupKey(texture: THREE.Texture, targetColorSpace: THREE.ColorSpace): string {
  const imgSig = getImageSignature(texture);
  const ox = texture.offset.x.toFixed(4);
  const oy = texture.offset.y.toFixed(4);
  const rx = texture.repeat.x.toFixed(4);
  const ry = texture.repeat.y.toFixed(4);
  const rot = texture.rotation.toFixed(4);
  return `${imgSig}|cs:${targetColorSpace}|w:${texture.wrapS},${texture.wrapT}|uv:${ox},${oy},${rx},${ry},${rot}|fy:${texture.flipY ? 1 : 0}`;
}

/**
 * Pure JS box-filter downsampler for RGBA/RGB/Luminance TypedArray image buffers
 * (`DataTexture` and headless tests). Preserves exact channel fidelity and saves
 * 16x VRAM when downscaling 2048x2048 -> 512x512.
 */
function downsampleTypedArrayImage(
  srcData: Uint8Array | Uint8ClampedArray,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): Uint8Array | Uint8ClampedArray {
  const totalPixels = srcW * srcH;
  const channels = totalPixels > 0 ? Math.max(1, Math.round(srcData.length / totalPixels)) : 4;
  const OutputCtor = srcData instanceof Uint8ClampedArray ? Uint8ClampedArray : Uint8Array;
  const out = new OutputCtor(dstW * dstH * channels);

  const scaleX = srcW / dstW;
  const scaleY = srcH / dstH;

  for (let y = 0; y < dstH; y++) {
    const y0 = Math.floor(y * scaleY);
    const y1 = Math.min(srcH, Math.max(y0 + 1, Math.floor((y + 1) * scaleY)));

    for (let x = 0; x < dstW; x++) {
      const x0 = Math.floor(x * scaleX);
      const x1 = Math.min(srcW, Math.max(x0 + 1, Math.floor((x + 1) * scaleX)));

      const count = (x1 - x0) * (y1 - y0);
      const dstIdx = (y * dstW + x) * channels;

      for (let c = 0; c < channels; c++) {
        let sum = 0;
        for (let sy = y0; sy < y1; sy++) {
          const rowBase = sy * srcW;
          for (let sx = x0; sx < x1; sx++) {
            sum += srcData[(rowBase + sx) * channels + c];
          }
        }
        out[dstIdx + c] = Math.round(sum / count);
      }
    }
  }

  return out;
}

/**
 * Downscales an uncompressed texture's underlying `HTMLImageElement`, `ImageBitmap`,
 * `HTMLCanvasElement`, `OffscreenCanvas`, or `DataTexture` pixel buffer if either
 * dimension exceeds `maxDimension`.
 *
 * Example: 2048x2048 RGBA8 + mipmaps = 21.33 MB VRAM -> 512x512 = 1.33 MB VRAM (16x savings).
 */
export function downscaleTextureIfOversized(
  texture: THREE.Texture,
  maxDimension: number
): { downscaled: boolean; prevWidth: number; prevHeight: number; width: number; height: number } {
  if ((texture as THREE.CompressedTexture).isCompressedTexture) {
    const { width, height } = getImageDimensions(texture.image);
    return { downscaled: false, prevWidth: width, prevHeight: height, width, height };
  }

  const { width: srcW, height: srcH } = getImageDimensions(texture.image);
  if (srcW <= 0 || srcH <= 0 || (srcW <= maxDimension && srcH <= maxDimension)) {
    return { downscaled: false, prevWidth: srcW, prevHeight: srcH, width: srcW, height: srcH };
  }

  const ratio = maxDimension / Math.max(srcW, srcH);
  const dstW = Math.max(1, Math.round(srcW * ratio));
  const dstH = Math.max(1, Math.round(srcH * ratio));

  const imgAny = texture.image as {
    data?: Uint8Array | Uint8ClampedArray;
    width?: number;
    height?: number;
  };

  // Path 1: DataTexture / raw pixel buffer (`{ data, width, height }`)
  if (
    imgAny &&
    imgAny.data &&
    (imgAny.data instanceof Uint8Array || imgAny.data instanceof Uint8ClampedArray)
  ) {
    const resizedBuffer = downsampleTypedArrayImage(imgAny.data, srcW, srcH, dstW, dstH);
    texture.userData = {
      ...(texture.userData || {}),
      __originalDimensions: { width: srcW, height: srcH },
    };
    texture.image = {
      data: resizedBuffer,
      width: dstW,
      height: dstH,
    } as TextureImageData;
    texture.needsUpdate = true;
    return { downscaled: true, prevWidth: srcW, prevHeight: srcH, width: dstW, height: dstH };
  }

  // Path 2: Browser OffscreenCanvas or DOM <canvas> for HTMLImageElement / ImageBitmap / Canvas
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      const offscreen = new OffscreenCanvas(dstW, dstH);
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(texture.image as CanvasImageSource, 0, 0, dstW, dstH);
        texture.userData = {
          ...(texture.userData || {}),
          __originalDimensions: { width: srcW, height: srcH },
        };
        texture.image = offscreen as unknown as HTMLCanvasElement;
        texture.needsUpdate = true;
        return { downscaled: true, prevWidth: srcW, prevHeight: srcH, width: dstW, height: dstH };
      }
    }

    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
      const canvas = document.createElement('canvas');
      canvas.width = dstW;
      canvas.height = dstH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(texture.image as CanvasImageSource, 0, 0, dstW, dstH);
        texture.userData = {
          ...(texture.userData || {}),
          __originalDimensions: { width: srcW, height: srcH },
        };
        texture.image = canvas;
        texture.needsUpdate = true;
        return { downscaled: true, prevWidth: srcW, prevHeight: srcH, width: dstW, height: dstH };
      }
    }
  } catch {
    // If taint/CORS or non-drawable mock prevents canvas draw, leave original intact safely
  }

  return { downscaled: false, prevWidth: srcW, prevHeight: srcH, width: srcW, height: srcH };
}

type TextureImageData = THREE.Texture['image'];

function resolveHardwareMaxAnisotropy(
  glCapabilities?: OptimizeSceneTexturesCapabilities | number | null
): number {
  if (typeof glCapabilities === 'number') {
    return Math.max(1, glCapabilities);
  }
  if (!glCapabilities) {
    return 16;
  }
  if (typeof glCapabilities.getMaxAnisotropy === 'function') {
    return Math.max(1, glCapabilities.getMaxAnisotropy());
  }
  if (typeof glCapabilities.maxAnisotropy === 'number') {
    return Math.max(1, glCapabilities.maxAnisotropy);
  }
  if (glCapabilities.capabilities) {
    if (typeof glCapabilities.capabilities.getMaxAnisotropy === 'function') {
      return Math.max(1, glCapabilities.capabilities.getMaxAnisotropy());
    }
    if (typeof glCapabilities.capabilities.maxAnisotropy === 'number') {
      return Math.max(1, glCapabilities.capabilities.maxAnisotropy);
    }
  }
  return 16;
}

/**
 * Runtime Scene Texture Optimizer:
 * 1. Deduplicates identical texture references across materials in a loaded model.
 * 2. Enforces `SRGBColorSpace` on BaseColor/Emissive and `NoColorSpace` on Normal/Roughness/Metallic/ORM maps.
 * 3. Clamps `anisotropy` to `Math.min(profile.anisotropy, gl.capabilities.getMaxAnisotropy())`.
 * 4. Applies tier mipmap filters (`LinearMipmapNearestFilter` on `ultra-light`, trilinear on `balanced`+).
 * 5. Downscales oversized uncompressed textures exceeding the device tier's `maxDimension`.
 */
export function optimizeSceneTextures(
  root: THREE.Object3D,
  profileOrSettings: FoodRenderProfile | Partial<TextureProfileSettings>,
  glCapabilities?: OptimizeSceneTexturesCapabilities | number | null
): TextureOptimizationStats {
  const baseProfile =
    typeof profileOrSettings === 'string'
      ? getTextureProfileSettings(profileOrSettings)
      : {
          ...getTextureProfileSettings(profileOrSettings.profile ?? 'balanced'),
          ...profileOrSettings,
        };

  const hwMaxAnisotropy = resolveHardwareMaxAnisotropy(glCapabilities);
  const clampedAnisotropy = Math.max(1, Math.min(baseProfile.anisotropy, hwMaxAnisotropy));

  const canonicalTextures = new Map<string, THREE.Texture>();
  const beforeTextures = new Set<THREE.Texture>();
  const processedCanonical = new Set<THREE.Texture>();

  let deduplicatedSlots = 0;
  let downscaledTextures = 0;
  let colorSpacesFixed = 0;
  let strippedSecondaryMaps = 0;
  let estimatedVramBeforeBytes = 0;

  const srgbSet = new Set<string>(SRGB_COLOR_TEXTURE_SLOTS);

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh || !mesh.isMesh || !mesh.material) return;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of materials) {
      if (!mat) continue;
      const matRecord = mat as unknown as Record<string, THREE.Texture | null | undefined>;

      // Strip secondary physical detail maps on memory-constrained ultra-light profile
      if (baseProfile.stripSecondaryMaps) {
        for (const secSlot of SECONDARY_OPTIONAL_TEXTURE_SLOTS) {
          const existingSec = matRecord[secSlot];
          if (existingSec && existingSec.isTexture) {
            if (!beforeTextures.has(existingSec)) {
              beforeTextures.add(existingSec);
              const dims = getImageDimensions(existingSec.image);
              estimatedVramBeforeBytes += estimateTextureVramBytes(dims.width, dims.height, {
                gpuFormat: (existingSec as THREE.CompressedTexture).isCompressedTexture
                  ? 'astc'
                  : 'uncompressed',
                hasMipmaps: existingSec.generateMipmaps,
              });
            }
            matRecord[secSlot] = null;
            strippedSecondaryMaps++;
            mat.needsUpdate = true;
          }
        }
      }

      for (const slot of ALL_INSPECTED_SLOTS) {
        const tex = matRecord[slot];
        if (!tex || !tex.isTexture) continue;

        if (!beforeTextures.has(tex)) {
          beforeTextures.add(tex);
          const dims = getImageDimensions(tex.image);
          estimatedVramBeforeBytes += estimateTextureVramBytes(dims.width, dims.height, {
            gpuFormat: (tex as THREE.CompressedTexture).isCompressedTexture
              ? 'astc'
              : 'uncompressed',
            hasMipmaps: tex.generateMipmaps,
          });
        }

        const expectedColorSpace = srgbSet.has(slot)
          ? THREE.SRGBColorSpace
          : THREE.NoColorSpace;

        const dedupKey = getTextureDedupKey(tex, expectedColorSpace);
        let canonical = canonicalTextures.get(dedupKey);

        if (!canonical) {
          canonical = tex;
          canonicalTextures.set(dedupKey, canonical);
        } else if (canonical !== tex) {
          matRecord[slot] = canonical;
          deduplicatedSlots++;
          mat.needsUpdate = true;
          if (!tex.userData?.__sharedCached) {
            tex.dispose();
          }
        }

        if (!processedCanonical.has(canonical)) {
          processedCanonical.add(canonical);

          if (canonical.colorSpace !== expectedColorSpace) {
            canonical.colorSpace = expectedColorSpace;
            canonical.needsUpdate = true;
            colorSpacesFixed++;
          }

          canonical.anisotropy = clampedAnisotropy;

          const isCompressed = Boolean((canonical as THREE.CompressedTexture).isCompressedTexture);
          if (!isCompressed) {
            canonical.generateMipmaps = baseProfile.generateMipmaps;
            canonical.minFilter = baseProfile.minFilter;
            canonical.magFilter = baseProfile.magFilter;

            const ds = downscaleTextureIfOversized(canonical, baseProfile.maxDimension);
            if (ds.downscaled) {
              downscaledTextures++;
            }
          } else if (canonical.mipmaps && canonical.mipmaps.length > 1) {
            canonical.minFilter = baseProfile.minFilter;
            canonical.magFilter = baseProfile.magFilter;
          }
        }
      }
    }
  });

  let estimatedVramAfterBytes = 0;
  for (const tex of processedCanonical) {
    const dims = getImageDimensions(tex.image);
    estimatedVramAfterBytes += estimateTextureVramBytes(dims.width, dims.height, {
      gpuFormat: (tex as THREE.CompressedTexture).isCompressedTexture ? 'astc' : 'uncompressed',
      hasMipmaps: tex.generateMipmaps || Boolean(tex.mipmaps && tex.mipmaps.length > 1),
    });
  }

  return {
    profile: baseProfile.profile,
    uniqueTextures: processedCanonical.size,
    deduplicatedSlots,
    downscaledTextures,
    colorSpacesFixed,
    strippedSecondaryMaps,
    anisotropyApplied: clampedAnisotropy,
    estimatedVramBeforeBytes,
    estimatedVramAfterBytes,
  };
}

// ============================================================================
// Shared Ref-Counted Texture Cache
// ============================================================================

interface RefCountedTextureEntry {
  key: string;
  texture: THREE.Texture;
  refCount: number;
}

/**
 * Ref-counted Shared Texture Registry (`SharedTextureCache`).
 * Prevents duplicate network fetches and duplicate GPU texture uploads across
 * dishes, pedestals, and route transitions, disposing GPU memory strictly when
 * `refCount` reaches 0.
 */
export class SharedTextureCache {
  private entries = new Map<string, RefCountedTextureEntry>();
  private inflight = new Map<string, Promise<THREE.Texture>>();

  /**
   * Synchronously acquires or registers a texture under `key` and increments its ref count.
   */
  acquire(key: string, factory: () => THREE.Texture): THREE.Texture {
    const existing = this.entries.get(key);
    if (existing) {
      existing.refCount += 1;
      return existing.texture;
    }

    const texture = factory();
    texture.userData = {
      ...(texture.userData || {}),
      __sharedCached: true,
      __sharedCacheKey: key,
    };
    this.entries.set(key, { key, texture, refCount: 1 });
    return texture;
  }

  /**
   * Asynchronously loads or reuses an in-flight / cached texture under `key`
   * and increments its ref count for the caller.
   */
  async getOrLoad(key: string, loaderFn: () => Promise<THREE.Texture>): Promise<THREE.Texture> {
    const existing = this.entries.get(key);
    if (existing) {
      existing.refCount += 1;
      return existing.texture;
    }

    let pending = this.inflight.get(key);
    if (!pending) {
      pending = loaderFn().then((tex) => {
        tex.userData = {
          ...(tex.userData || {}),
          __sharedCached: true,
          __sharedCacheKey: key,
        };
        this.entries.set(key, { key, texture: tex, refCount: 0 });
        this.inflight.delete(key);
        return tex;
      }).catch((err) => {
        this.inflight.delete(key);
        throw err;
      });
      this.inflight.set(key, pending);
    }

    const resolvedTex = await pending;
    const entry = this.entries.get(key);
    if (entry) {
      entry.refCount += 1;
      return entry.texture;
    }
    // Edge case if cleared mid-await
    this.entries.set(key, { key, texture: resolvedTex, refCount: 1 });
    return resolvedTex;
  }

  /**
   * Increments the reference count of an already cached texture.
   */
  retain(key: string): THREE.Texture | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    entry.refCount += 1;
    return entry.texture;
  }

  /**
   * Decrements the reference count for `key`. When `refCount <= 0`, disposes
   * the GPU texture and removes it from the registry.
   * Returns `true` if the texture was disposed on this call.
   */
  release(key: string): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;
    entry.refCount -= 1;
    if (entry.refCount <= 0) {
      this.entries.delete(key);
      delete entry.texture.userData.__sharedCached;
      entry.texture.dispose();
      return true;
    }
    return false;
  }

  getRefCount(key: string): number {
    return this.entries.get(key)?.refCount ?? 0;
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  get size(): number {
    return this.entries.size;
  }

  getStats(): { cachedTextures: number; inflightLoads: number; totalRefs: number } {
    let totalRefs = 0;
    for (const entry of this.entries.values()) {
      totalRefs += entry.refCount;
    }
    return {
      cachedTextures: this.entries.size,
      inflightLoads: this.inflight.size,
      totalRefs,
    };
  }

  clear(forceDispose: boolean = true): void {
    if (forceDispose) {
      for (const entry of this.entries.values()) {
        delete entry.texture.userData.__sharedCached;
        entry.texture.dispose();
      }
    }
    this.entries.clear();
    this.inflight.clear();
  }
}

export const sharedTextureCache = new SharedTextureCache();

// ============================================================================
// Progressive Texture Loader
// ============================================================================

export interface ProgressiveTextureOptions {
  url: string;
  previewUrl?: string;
  placeholderHex?: string;
  colorSpace?: THREE.ColorSpace;
  profile?: FoodRenderProfile;
  maxAnisotropy?: number;
  gl?: THREE.WebGLRenderer | null;
  cache?: SharedTextureCache;
  customLoader?: (url: string) => Promise<THREE.Texture>;
  onPreview?: (previewTexture: THREE.Texture) => void;
  onHighRes?: (highResTexture: THREE.Texture) => void;
  onError?: (error: unknown) => void;
}

export interface ProgressiveTextureHandle {
  previewTexture: THREE.Texture;
  promise: Promise<THREE.Texture>;
  abort: () => void;
  release: () => void;
}

/**
 * Creates a zero-network 4x4 warm culinary placeholder `DataTexture` (64 bytes!)
 * for instant first-frame rendering without black/white texture pop.
 */
export function createWarmPlaceholderTexture(
  hexColor: string = '#C89B62',
  colorSpace: THREE.ColorSpace = THREE.SRGBColorSpace
): THREE.DataTexture {
  const color = new THREE.Color(hexColor);
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const data = new Uint8Array(4 * 4 * 4);
  for (let i = 0; i < 16; i++) {
    const base = i * 4;
    data[base] = r;
    data[base + 1] = g;
    data[base + 2] = b;
    data[base + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, 4, 4, THREE.RGBAFormat);
  tex.colorSpace = colorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

async function loadBestAvailableTexture(
  url: string,
  options: {
    gl?: THREE.WebGLRenderer | null;
    customLoader?: (url: string) => Promise<THREE.Texture>;
  }
): Promise<THREE.Texture> {
  if (/^(https?:)?\/\/(unpkg\.com|cdn\.jsdelivr\.net)/i.test(url)) {
    throw new Error(`[texture-loader] External CDN texture URL "${url}" blocked by CSP policy.`);
  }

  if (options.customLoader) {
    return options.customLoader(url);
  }

  // Honest local KTX2 path: only attempt if URL ends with .ktx2 AND local /basis/ WASM exists
  if (url.toLowerCase().endsWith('.ktx2')) {
    const ktx2Loader = await getLocalKTX2Loader(options.gl ?? null);
    if (ktx2Loader) {
      return ktx2Loader.loadAsync(url);
    }
    // Fallback to sibling .webp or .png when local Basis WASM is not installed
    const webpFallback = url.replace(/\.ktx2$/i, '.webp');
    const texLoader = new THREE.TextureLoader();
    return texLoader.loadAsync(webpFallback);
  }

  const texLoader = new THREE.TextureLoader();
  return texLoader.loadAsync(url);
}

/**
 * Progressive Texture Loader:
 * 1. Synchronously provides a tiny 64-byte warm `DataTexture` preview so meshes render immediately.
 * 2. Optionally upgrades to `previewUrl` (low-res thumbnail) if provided.
 * 3. Loads the full texture through `SharedTextureCache`, applies tier `maxDimension` downscaling,
 *    `colorSpace`, mipmap filters, and clamped `anisotropy`, then swaps cleanly and disposes the temporary preview.
 */
export function loadProgressiveTexture(
  options: ProgressiveTextureOptions
): ProgressiveTextureHandle {
  const profileSettings = getTextureProfileSettings(options.profile ?? 'balanced');
  const colorSpace = options.colorSpace ?? THREE.SRGBColorSpace;
  const cache = options.cache ?? sharedTextureCache;
  const cacheKey = `${options.url}|${profileSettings.profile}|${colorSpace}`;

  const syntheticPreview = createWarmPlaceholderTexture(
    options.placeholderHex ?? '#C89B62',
    colorSpace
  );
  options.onPreview?.(syntheticPreview);

  let aborted = false;
  let acquiredHighRes = false;
  let lowResUrlTex: THREE.Texture | null = null;

  const disposePreviews = () => {
    syntheticPreview.dispose();
    if (lowResUrlTex) {
      lowResUrlTex.dispose();
      lowResUrlTex = null;
    }
  };

  if (options.previewUrl) {
    loadBestAvailableTexture(options.previewUrl, {
      gl: options.gl,
      customLoader: options.customLoader,
    })
      .then((lowTex) => {
        if (aborted || acquiredHighRes) {
          lowTex.dispose();
          return;
        }
        lowTex.colorSpace = colorSpace;
        lowTex.needsUpdate = true;
        lowResUrlTex = lowTex;
        options.onPreview?.(lowTex);
      })
      .catch(() => {
        // Ignore optional low-res preview errors; synthetic preview remains active
      });
  }

  const promise = cache
    .getOrLoad(cacheKey, async () => {
      const tex = await loadBestAvailableTexture(options.url, {
        gl: options.gl,
        customLoader: options.customLoader,
      });
      tex.colorSpace = colorSpace;
      const hwAniso = options.gl?.capabilities?.getMaxAnisotropy?.() ?? 8;
      tex.anisotropy = Math.max(
        1,
        Math.min(options.maxAnisotropy ?? profileSettings.anisotropy, hwAniso)
      );
      if (!(tex as THREE.CompressedTexture).isCompressedTexture) {
        tex.generateMipmaps = profileSettings.generateMipmaps;
        tex.minFilter = profileSettings.minFilter;
        tex.magFilter = profileSettings.magFilter;
        downscaleTextureIfOversized(tex, profileSettings.maxDimension);
      }
      tex.needsUpdate = true;
      return tex;
    })
    .then((highResTex) => {
      if (aborted) {
        cache.release(cacheKey);
        return syntheticPreview;
      }
      acquiredHighRes = true;
      disposePreviews();
      options.onHighRes?.(highResTex);
      return highResTex;
    })
    .catch((err) => {
      options.onError?.(err);
      return syntheticPreview;
    });

  return {
    previewTexture: syntheticPreview,
    promise,
    abort: () => {
      aborted = true;
    },
    release: () => {
      aborted = true;
      disposePreviews();
      if (acquiredHighRes) {
        acquiredHighRes = false;
        cache.release(cacheKey);
      }
    },
  };
}

// ============================================================================
// ORM Channel Packing Utility (R = Ambient Occlusion, G = Roughness, B = Metallic)
// ============================================================================

export type ORMChannelInput =
  | Uint8Array
  | Uint8ClampedArray
  | THREE.DataTexture
  | { data: Uint8Array | Uint8ClampedArray; width?: number; height?: number }
  | null
  | undefined;

export interface PackORMTextureOptions {
  width: number;
  height: number;
  ao?: ORMChannelInput;
  roughness?: ORMChannelInput;
  metalness?: ORMChannelInput;
  /** Default AO [0..255] when `ao` channel is omitted (default 255 = unoccluded 1.0) */
  defaultAO?: number;
  /** Default Roughness [0..255] when `roughness` channel is omitted (default 128 = ~0.5) */
  defaultRoughness?: number;
  /** Default Metallic [0..255] when `metalness` channel is omitted (default 0 = dielectric food) */
  defaultMetalness?: number;
  flipY?: boolean;
}

function extractSingleChannelByte(
  buffer: Uint8Array | Uint8ClampedArray,
  pixelIndex: number,
  stride: number
): number {
  return buffer[pixelIndex * stride] ?? 0;
}

function unwrapChannelBuffer(
  input: ORMChannelInput,
  pixelCount: number
): { buffer: Uint8Array | Uint8ClampedArray; stride: number } | null {
  if (!input) return null;

  let raw: Uint8Array | Uint8ClampedArray | undefined;
  if (input instanceof Uint8Array || input instanceof Uint8ClampedArray) {
    raw = input;
  } else if ((input as THREE.DataTexture).isDataTexture) {
    const imgData = (input as THREE.DataTexture).image?.data;
    if (imgData instanceof Uint8Array || imgData instanceof Uint8ClampedArray) {
      raw = imgData;
    }
  } else if (typeof input === 'object' && 'data' in input && input.data) {
    raw = input.data;
  }

  if (!raw || pixelCount <= 0) return null;
  const stride = Math.max(1, Math.round(raw.length / pixelCount));
  if (raw.length < pixelCount * stride) {
    throw new Error(
      `[packORMTexture] Channel buffer length (${raw.length}) is smaller than expected pixel count (${pixelCount}).`
    );
  }
  return { buffer: raw, stride };
}

/**
 * Packs separate Ambient Occlusion, Roughness, and Metallic grayscale/RGBA maps into a
 * single glTF-standard ORM `THREE.DataTexture`:
 * - Red [R]: Ambient Occlusion (`aoMap`)
 * - Green [G]: Roughness (`roughnessMap`)
 * - Blue [B]: Metallic (`metalnessMap`)
 * - Alpha [A]: 255
 *
 * Cuts 3 separate GPU texture uploads and samplers down to 1 linear texture (`NoColorSpace`),
 * saving 66.7% VRAM across PBR surface maps.
 */
export function packORMTexture(options: PackORMTextureOptions): THREE.DataTexture {
  const {
    width,
    height,
    ao,
    roughness,
    metalness,
    defaultAO = 255,
    defaultRoughness = 128,
    defaultMetalness = 0,
    flipY = false,
  } = options;

  if (width <= 0 || height <= 0) {
    throw new Error(`[packORMTexture] Invalid dimensions ${width}x${height}`);
  }

  const pixelCount = width * height;
  const aoSource = unwrapChannelBuffer(ao, pixelCount);
  const roughSource = unwrapChannelBuffer(roughness, pixelCount);
  const metalSource = unwrapChannelBuffer(metalness, pixelCount);

  const packed = new Uint8Array(pixelCount * 4);
  const fallbackR = Math.min(255, Math.max(0, Math.round(defaultAO)));
  const fallbackG = Math.min(255, Math.max(0, Math.round(defaultRoughness)));
  const fallbackB = Math.min(255, Math.max(0, Math.round(defaultMetalness)));

  for (let i = 0; i < pixelCount; i++) {
    const outIdx = i * 4;
    packed[outIdx] = aoSource
      ? extractSingleChannelByte(aoSource.buffer, i, aoSource.stride)
      : fallbackR;
    packed[outIdx + 1] = roughSource
      ? extractSingleChannelByte(roughSource.buffer, i, roughSource.stride)
      : fallbackG;
    packed[outIdx + 2] = metalSource
      ? extractSingleChannelByte(metalSource.buffer, i, metalSource.stride)
      : fallbackB;
    packed[outIdx + 3] = 255;
  }

  const ormTexture = new THREE.DataTexture(packed, width, height, THREE.RGBAFormat);
  ormTexture.name = 'GoldenOak_PackedORM';
  ormTexture.colorSpace = THREE.NoColorSpace;
  ormTexture.flipY = flipY;
  ormTexture.generateMipmaps = true;
  ormTexture.minFilter = THREE.LinearMipmapLinearFilter;
  ormTexture.magFilter = THREE.LinearFilter;
  ormTexture.needsUpdate = true;

  return ormTexture;
}
