import type { Object3D, Mesh, Material } from 'three';

/**
 * Authentic, rich PBR material palette for the 3D Warrior Model.
 * Provides vibrant colors, natural skin tones, ruby crimson cape,
 * gleaming gold trim, and polished steel armor.
 */
export const WARRIOR_MATERIAL_PALETTE: Record<
  string,
  { color: [number, number, number]; roughness: number; metalness: number }
> = {
  Skin_Mat: { color: [0.82, 0.62, 0.48], roughness: 0.5, metalness: 0.0 },
  Crimson_Cape_Mat: { color: [0.85, 0.12, 0.12], roughness: 0.45, metalness: 0.05 },
  Gold_Trim_Mat: { color: [0.95, 0.78, 0.25], roughness: 0.28, metalness: 0.7 },
  Talwar_Brass_Mat: { color: [0.90, 0.72, 0.20], roughness: 0.3, metalness: 0.65 },
  Talwar_Blade_Mat: { color: [0.85, 0.88, 0.92], roughness: 0.2, metalness: 0.8 },
  Steel_Armor_Mat: { color: [0.65, 0.68, 0.72], roughness: 0.35, metalness: 0.7 },
  Dark_Iron_Mat: { color: [0.28, 0.29, 0.32], roughness: 0.45, metalness: 0.4 },
  Leather_Mat: { color: [0.45, 0.28, 0.15], roughness: 0.6, metalness: 0.05 },
  Hair_Beard_Mat: { color: [0.12, 0.08, 0.05], roughness: 0.6, metalness: 0.0 },
  Floor_Stone_Mat: { color: [0.38, 0.36, 0.34], roughness: 0.8, metalness: 0.0 },
  Cornea_Mat: { color: [1.0, 1.0, 1.0], roughness: 0.1, metalness: 0.0 },
  Sclera_Mat: { color: [0.95, 0.95, 0.95], roughness: 0.2, metalness: 0.0 },
  Iris_Mat: { color: [0.25, 0.15, 0.08], roughness: 0.1, metalness: 0.0 },
  Pupil_Black: { color: [0.02, 0.02, 0.02], roughness: 0.1, metalness: 0.0 },
};

/**
 * Traverses a 3D object hierarchy and ensures every material has its vibrant
 * color, roughness, and metalness applied so it renders vividly in all lighting.
 */
export function enhanceWarriorMaterials(obj: Object3D) {
  obj.traverse((child) => {
    if ((child as Mesh).isMesh) {
      const mesh = child as Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat: Material) => {
        if (!mat) return;
        const palette = WARRIOR_MATERIAL_PALETTE[mat.name];
        if (palette && 'color' in mat) {
          (mat as any).color.setRGB(palette.color[0], palette.color[1], palette.color[2]);
          if ('roughness' in mat) (mat as any).roughness = palette.roughness;
          if ('metalness' in mat) (mat as any).metalness = palette.metalness;
          mat.needsUpdate = true;
        }
      });
    }
  });
}
