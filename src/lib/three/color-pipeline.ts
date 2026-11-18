/**
 * THE GOLDEN OAK — PHASE 5 CANONICAL COLOUR PIPELINE (Lead Orchestrator owned)
 *
 * ONE colour pipeline for every renderer that shows food:
 *   - 3D dish viewer (ViewerScene / R3F)
 *   - Camera-preview fallback (ARScene / R3F)
 *   - WebXR immersive-ar engine (vanilla three)
 *   - WebXR immersive-vr viewer (if implemented)
 *   - 3D booking floorplan (food is not shown there, but it shares the same output transform
 *     so brand colours match across the site)
 *
 * Why Khronos PBR Neutral (THREE.NeutralToneMapping)?
 *   ACES Filmic shifts hue and desaturates mid/high values (reds -> orange, yellows -> washed),
 *   which changes how real food looks. Khronos PBR Neutral was designed for e-commerce/product
 *   rendering: base colours under neutral lighting map back to (almost exactly) their authored
 *   sRGB value, highlights are compressed without hue shift. This is a correctness choice, not
 *   an exposure/saturation hack — DO NOT compensate wrong texture decoding with exposure.
 *
 * Rules:
 *   - outputColorSpace = SRGBColorSpace (display-referred output).
 *   - baseColor / emissive textures must be SRGBColorSpace; normal / ORM / roughness / metalness /
 *     occlusion textures must be NoColorSpace (linear data). GLTFLoader already does this — any
 *     custom texture code must follow `TEXTURE_SLOT_COLOR_SPACE`.
 *   - Exposure is 1.0 everywhere. Per-tier exposure differences are forbidden (colour must not
 *     depend on device tier).
 *   - Food materials must not receive artificial emissive tints (it adds light that does not
 *     exist in the scene and washes colours out).
 */
import * as THREE from 'three';

export const CANONICAL_TONE_MAPPING = THREE.NeutralToneMapping;
export const CANONICAL_TONE_MAPPING_NAME = 'NeutralToneMapping (Khronos PBR Neutral)' as const;
export const CANONICAL_OUTPUT_COLOR_SPACE = THREE.SRGBColorSpace;
export const CANONICAL_EXPOSURE = 1.0;

export type TextureSlot =
  | 'map'
  | 'emissiveMap'
  | 'sheenColorMap'
  | 'specularColorMap'
  | 'normalMap'
  | 'roughnessMap'
  | 'metalnessMap'
  | 'aoMap'
  | 'clearcoatNormalMap'
  | 'clearcoatRoughnessMap'
  | 'transmissionMap'
  | 'thicknessMap';

/** Colour textures are sRGB; data textures are linear (NoColorSpace). */
export const TEXTURE_SLOT_COLOR_SPACE: Record<TextureSlot, THREE.ColorSpace> = {
  map: THREE.SRGBColorSpace,
  emissiveMap: THREE.SRGBColorSpace,
  sheenColorMap: THREE.SRGBColorSpace,
  specularColorMap: THREE.SRGBColorSpace,
  normalMap: THREE.NoColorSpace,
  roughnessMap: THREE.NoColorSpace,
  metalnessMap: THREE.NoColorSpace,
  aoMap: THREE.NoColorSpace,
  clearcoatNormalMap: THREE.NoColorSpace,
  clearcoatRoughnessMap: THREE.NoColorSpace,
  transmissionMap: THREE.NoColorSpace,
  thicknessMap: THREE.NoColorSpace,
};

export interface ColorPipelineTarget {
  outputColorSpace: THREE.ColorSpace | string;
  toneMapping: THREE.ToneMapping;
  toneMappingExposure: number;
}

/** Apply the canonical pipeline to any WebGLRenderer (R3F `gl` or vanilla). */
export function applyCanonicalColorPipeline(renderer: ColorPipelineTarget): void {
  renderer.outputColorSpace = CANONICAL_OUTPUT_COLOR_SPACE;
  renderer.toneMapping = CANONICAL_TONE_MAPPING;
  renderer.toneMappingExposure = CANONICAL_EXPOSURE;
}

/** R3F `<Canvas gl={...}>` props that match the canonical pipeline. */
export const CANONICAL_R3F_GL_PROPS = {
  outputColorSpace: CANONICAL_OUTPUT_COLOR_SPACE,
  toneMapping: CANONICAL_TONE_MAPPING,
  toneMappingExposure: CANONICAL_EXPOSURE,
} as const;

export interface ColorPipelineAuditIssue {
  materialName: string;
  slot: TextureSlot;
  expected: THREE.ColorSpace | string;
  actual: THREE.ColorSpace | string;
}

/**
 * Walks a loaded scene and reports texture slots whose colour space violates
 * `TEXTURE_SLOT_COLOR_SPACE`. Pure inspection — never mutates.
 */
export function auditSceneTextureColorSpaces(root: THREE.Object3D): ColorPipelineAuditIssue[] {
  const issues: ColorPipelineAuditIssue[] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of materials) {
      if (!mat) continue;
      const record = mat as unknown as Record<string, unknown>;
      for (const slot of Object.keys(TEXTURE_SLOT_COLOR_SPACE) as TextureSlot[]) {
        const tex = record[slot] as THREE.Texture | null | undefined;
        if (!tex || !(tex as THREE.Texture).isTexture) continue;
        const expected = TEXTURE_SLOT_COLOR_SPACE[slot];
        if (tex.colorSpace !== expected) {
          issues.push({ materialName: mat.name || '(unnamed)', slot, expected, actual: tex.colorSpace });
        }
      }
    }
  });
  return issues;
}
