import bpy
from mathutils import Vector
import os
import shutil

BLEND_DIR = r"C:\Users\Pyiush Gupta\Downloads\.blends\BLENDER 3\3d models"
OUT_DIR = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak\public\models\optimized"
ROOT_MODELS_DIR = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak\public\models"

blend_path = os.path.join(BLEND_DIR, "_potatoes bolls .blend")
slug = "dynamite-chilli-potatoes"
target_radius = 1.0

print(f">>> EXPORTING {slug} <<<")
bpy.ops.wm.open_mainfile(filepath=blend_path)

# Ensure all collections are active and unhidden in the view layer
def unhide_collections(layer_col):
    layer_col.exclude = False
    layer_col.hide_viewport = False
    for child in layer_col.children:
        unhide_collections(child)

unhide_collections(bpy.context.view_layer.layer_collection)

exclude_keys = [
    "studio_backdrop",
    "studio_slate_table",
    "camera",
    "light",
    "studio_fill",
    "studio_key",
    "studio_rim",
    "mushroom_slice", # potatoes dish doesn't need mushrooms
]

food_meshes = []
remove_objs = []

for obj in list(bpy.data.objects):
    name_l = obj.name.lower()
    is_excluded = any(k in name_l for k in exclude_keys)
    if obj.type != "MESH" or is_excluded:
        remove_objs.append(obj)
    else:
        # Link to main scene collection if not already visible
        if obj.name not in bpy.context.scene.collection.objects:
            try:
                bpy.context.scene.collection.objects.link(obj)
            except Exception:
                pass
        food_meshes.append(obj)

print(f"Removing {len(remove_objs)} non-food objects...")
for obj in remove_objs:
    bpy.data.objects.remove(obj, do_unlink=True)

# Unparent
for obj in food_meshes:
    matrix_world = obj.matrix_world.copy()
    obj.parent = None
    obj.matrix_world = matrix_world

# Compute bounds
min_v = Vector((float('inf'), float('inf'), float('inf')))
max_v = Vector((float('-inf'), float('-inf'), float('-inf')))

for obj in food_meshes:
    for corner in [obj.matrix_world @ Vector(v) for v in obj.bound_box]:
        for i in range(3):
            min_v[i] = min(min_v[i], corner[i])
            max_v[i] = max(max_v[i], corner[i])

center_x = (min_v.x + max_v.x) / 2.0
center_y = (min_v.y + max_v.y) / 2.0
bottom_z = min_v.z
extent_x = max_v.x - min_v.x
extent_y = max_v.y - min_v.y
max_dim = max(extent_x, extent_y)

scale_mult = 1.0
if max_dim > 0.001:
    scale_mult = (target_radius * 2.0) / max_dim

for obj in food_meshes:
    obj.location.x -= center_x
    obj.location.y -= center_y
    obj.location.z -= bottom_z
    obj.scale *= scale_mult

# Apply transforms individually without using view_layer selection operator
for obj in food_meshes:
    # Set matrix_world as applied directly
    mesh = obj.data
    mesh.transform(obj.matrix_world)
    obj.matrix_world.identity()

print("Transforms applied successfully to all meshes.")
total_triangles = sum(len(m.data.polygons) for m in food_meshes)
print(f"Total base triangles: {total_triangles:,}")

def export_tier(out_filename, decimate_ratio=1.0, max_tex=2048, draco_quant=(14, 10, 12)):
    for obj in food_meshes:
        for mod in list(obj.modifiers):
            if mod.name == "LOD_Decimate":
                obj.modifiers.remove(mod)
        if decimate_ratio < 0.999:
            mod = obj.modifiers.new("LOD_Decimate", "DECIMATE")
            mod.ratio = max(0.08, min(1.0, decimate_ratio))
            mod.use_collapse_triangulate = True

    out_path = os.path.join(OUT_DIR, out_filename)
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
    print(f"  Exported {out_filename}: {os.path.getsize(out_path):,} bytes")
    return out_path

# Export 3 tiers
export_tier(f"{slug}-high.glb", decimate_ratio=1.0, max_tex=2048, draco_quant=(14, 10, 12))
export_tier(f"{slug}-balanced.glb", decimate_ratio=0.50, max_tex=1024, draco_quant=(13, 9, 11))
export_tier(f"{slug}-ultralight.glb", decimate_ratio=0.25, max_tex=512, draco_quant=(12, 8, 10))

root_path = os.path.join(ROOT_MODELS_DIR, f"{slug}.glb")
shutil.copy2(os.path.join(OUT_DIR, f"{slug}-high.glb"), root_path)
print(f"Root synced: {root_path}")
print("=== DYNAMITE POTATOES EXPORT COMPLETE ===")
