import bpy
from mathutils import Vector
import os
import shutil

print("=== GOLDEN OAK: REALISTIC BURGER PRODUCTION EXPORT PIPELINE ===")

# Target output directory
OUT_DIR = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak\public\models\optimized"
os.makedirs(OUT_DIR, exist_ok=True)

# 1. Identify burger meshes
burger_meshes = [
    obj for obj in bpy.data.objects
    if obj.type == "MESH" and ("bun" in obj.name or "lettuce" in obj.name or "vegi" in obj.name or "pPlane" in obj.name)
]
print(f"Detected {len(burger_meshes)} burger meshes: {[o.name for o in burger_meshes]}")

# 2. Delete non-burger objects (cameras, lights, unused empties)
for obj in list(bpy.data.objects):
    if obj not in burger_meshes:
        bpy.data.objects.remove(obj, do_unlink=True)

# 3. Unparent burger meshes while preserving exact world matrix
bpy.ops.object.select_all(action='DESELECT')
for obj in burger_meshes:
    matrix_world = obj.matrix_world.copy()
    obj.parent = None
    obj.matrix_world = matrix_world

# 4. Compute overall world bounding box
min_v = Vector((float('inf'), float('inf'), float('inf')))
max_v = Vector((float('-inf'), float('-inf'), float('-inf')))

for obj in burger_meshes:
    for corner in [obj.matrix_world @ Vector(v) for v in obj.bound_box]:
        for i in range(3):
            min_v[i] = min(min_v[i], corner[i])
            max_v[i] = max(max_v[i], corner[i])

center_x = (min_v.x + max_v.x) / 2.0
center_y = (min_v.y + max_v.y) / 2.0
bottom_z = min_v.z

print(f"Computed bounds: min={min_v}, max={max_v}")
print(f"Applying centering offset: dx={-center_x}, dy={-center_y}, dz={-bottom_z}")

# Shift meshes so (0,0) is center and base sits on Z=0
for obj in burger_meshes:
    obj.location.x -= center_x
    obj.location.y -= center_y
    obj.location.z -= bottom_z

# Apply all transforms (location, rotation, scale)
bpy.ops.object.select_all(action='DESELECT')
for obj in burger_meshes:
    obj.select_set(True)
bpy.context.view_layer.objects.active = burger_meshes[0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Cache original texture dimensions
orig_img_sizes = {}
for img in bpy.data.images:
    orig_img_sizes[img.name] = tuple(img.size)
print(f"Cached texture sizes: {orig_img_sizes}")

def export_tier(filename, decimate_ratio=None, max_tex_dim=None, draco_quant=(14, 10, 12)):
    print(f"\n--- Exporting Tier: {filename} (decimate={decimate_ratio}, max_tex={max_tex_dim}) ---")
    
    # 1. Apply or remove decimation modifiers
    for obj in burger_meshes:
        # Clear any existing decimate modifier
        for mod in list(obj.modifiers):
            if mod.name == "LOD_Decimate":
                obj.modifiers.remove(mod)
        if decimate_ratio and decimate_ratio < 1.0:
            mod = obj.modifiers.new("LOD_Decimate", "DECIMATE")
            mod.ratio = decimate_ratio
            mod.use_collapse_triangulate = True

    # 2. Scale textures if max_tex_dim is specified
    for img in bpy.data.images:
        orig_w, orig_h = orig_img_sizes[img.name]
        if max_tex_dim and (orig_w > max_tex_dim or orig_h > max_tex_dim):
            scale_fac = max_tex_dim / max(orig_w, orig_h)
            new_w = max(64, int(orig_w * scale_fac))
            new_h = max(64, int(orig_h * scale_fac))
            img.scale(new_w, new_h)
            print(f"  Scaled image {img.name} -> ({new_w}, {new_h})")
        else:
            if img.size[0] != orig_w or img.size[1] != orig_h:
                img.scale(orig_w, orig_h)

    # 3. Export Draco GLB
    out_path = os.path.join(OUT_DIR, filename)
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_materials='EXPORT',
        export_image_format='AUTO',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=7,
        export_draco_position_quantization=draco_quant[0],
        export_draco_normal_quantization=draco_quant[1],
        export_draco_texcoord_quantization=draco_quant[2],
        export_yup=True
    )
    st = os.stat(out_path)
    print(f"  Exported {filename}: {st.st_size:,} bytes")
    return out_path

# Tier 1: High Fidelity (Flagship & Desktop)
# Full 11.7k triangles, full 1024-2048 textures, 14-bit position Draco
export_tier("golden-oak-burger-high.glb", decimate_ratio=1.0, max_tex_dim=2048, draco_quant=(14, 10, 12))

# Tier 2: Balanced (Mid-range Android 4-6GB RAM & standard iPhone)
# ~5.8k triangles (50% decimate), 1024 textures clamped, 13-bit position Draco
export_tier("golden-oak-burger-balanced.glb", decimate_ratio=0.50, max_tex_dim=1024, draco_quant=(13, 9, 11))

# Tier 3: Ultra-Light (Low-end Android 2GB RAM)
# ~2.9k triangles (25% decimate), 512 textures clamped, 12-bit position Draco
export_tier("golden-oak-burger-ultralight.glb", decimate_ratio=0.25, max_tex_dim=512, draco_quant=(12, 8, 10))

# Also create alias realistic naming
for tier in ["high", "balanced", "ultralight"]:
    src = os.path.join(OUT_DIR, f"golden-oak-burger-{tier}.glb")
    dst = os.path.join(OUT_DIR, f"golden-oak-burger-realistic-{tier}.glb")
    shutil.copy2(src, dst)
    print(f"Copied alias: {dst}")

print("\n=== ALL TIERS EXPORTED SUCCESSFULLY ===")
