import bpy
from mathutils import Vector
import os
import shutil
import sys

print("==================================================================")
print("=== THE GOLDEN OAK: MASTER MULTI-DISH 3D & AR EXPORT PIPELINE  ===")
print("==================================================================")

BLEND_DIR = r"C:\Users\Pyiush Gupta\Downloads\.blends\BLENDER 3\3d models"
OUT_DIR = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak\public\models\optimized"
ROOT_MODELS_DIR = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak\public\models"

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(ROOT_MODELS_DIR, exist_ok=True)

DISH_SPECS = [
    {
        "slug": "tandoori-paneer-pizza",
        "file": "paneer_pizza.blend",
        "target_radius": 1.2,
        "exclude_keywords": ["camera", "cam_", "cube", "light", "shadow_catcher"],
    },
    {
        "slug": "chicken-tikka-pizza",
        "file": "chicken_pizza.blend",
        "target_radius": 1.2,
        "exclude_keywords": ["rustic_wood_table", "cam_", "camera", "light_"],
    },
    {
        "slug": "mushroom-truffle-pizza",
        "file": "truffle_mushroom_pizza.blend",
        "target_radius": 1.2,
        "exclude_keywords": ["cube", "camera", "light"],
    },
    {
        "slug": "bbq-chicken-overload",
        "file": "bbq_chicken_overload_pizza.blend",
        "target_radius": 1.2,
        "exclude_keywords": ["camera", "cam_", "cube", "light", "shadow_catcher"],
    },
    {
        "slug": "classic-smash-burger",
        "file": "chiken_burger.blend",
        "target_radius": 0.85,
        "exclude_keywords": ["studio_", "camera", "light"],
    },
    {
        "slug": "crispy-paneer-burger",
        "file": "paneer_burger.blend",
        "target_radius": 0.85,
        "exclude_keywords": ["light", "camera"],
    },
    {
        "slug": "wok-tossed-chow-mein",
        "file": "chowmein_noodles.blend",
        "target_radius": 1.1,
        "exclude_keywords": ["table_plane", "cube", "light", "cam_", "camera"],
    },
    {
        "slug": "dynamite-chilli-potatoes",
        "file": "_potatoes bolls .blend",
        "target_radius": 1.0,
        "exclude_keywords": [
            "studio_backdrop",
            "studio_slate_table",
            "camera",
            "light",
            "studio_fill",
            "studio_key",
            "studio_rim",
        ],
    },
]

def process_dish(spec):
    slug = spec["slug"]
    file_name = spec["file"]
    blend_path = os.path.join(BLEND_DIR, file_name)
    target_radius = spec.get("target_radius", 1.0)
    exclude_keys = spec.get("exclude_keywords", [])

    print(f"\n>>> PROCESSING DISH: {slug} from {file_name} <<<")
    if not os.path.exists(blend_path):
        print(f"ERROR: File not found: {blend_path}")
        return False

    bpy.ops.wm.open_mainfile(filepath=blend_path)

    # 1. Identify food meshes vs excluded / background objects
    food_meshes = []
    remove_objs = []

    for obj in list(bpy.data.objects):
        obj_name_lower = obj.name.lower()
        is_excluded = any(k in obj_name_lower for k in exclude_keys)
        if obj.type != "MESH" or is_excluded:
            remove_objs.append(obj)
        else:
            food_meshes.append(obj)

    print(f"Removing {len(remove_objs)} non-food objects...")
    for obj in remove_objs:
        bpy.data.objects.remove(obj, do_unlink=True)

    if not food_meshes:
        print(f"ERROR: No food meshes detected for {slug}!")
        return False

    print(f"Retained {len(food_meshes)} food mesh objects.")

    # 2. Unparent meshes while preserving world transform
    bpy.ops.object.select_all(action='DESELECT')
    for obj in food_meshes:
        matrix_world = obj.matrix_world.copy()
        obj.parent = None
        obj.matrix_world = matrix_world

    # 3. Compute overall bounding box
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

    print(f"Raw bounds: min={min_v}, max={max_v}, max_dim={max_dim:.3f}")

    # Scale factor to normalize size
    scale_mult = 1.0
    if max_dim > 0.001:
        # Normalize so major dimension is ~ 2 * target_radius
        scale_mult = (target_radius * 2.0) / max_dim

    print(f"Centering and applying scale normalization: mult={scale_mult:.4f}")

    for obj in food_meshes:
        obj.location.x -= center_x
        obj.location.y -= center_y
        obj.location.z -= bottom_z
        obj.scale *= scale_mult

    # Apply all transforms
    bpy.ops.object.select_all(action='DESELECT')
    for obj in food_meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = food_meshes[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Count total triangles
    total_triangles = sum(len(m.data.polygons) for m in food_meshes)
    print(f"Total base triangles across meshes: {total_triangles:,}")

    # Cache original texture dimensions
    orig_img_sizes = {}
    for img in bpy.data.images:
        orig_img_sizes[img.name] = tuple(img.size)

    def export_tier(out_filename, decimate_ratio=1.0, max_tex=2048, draco_quant=(14, 10, 12)):
        # Decimate if needed
        for obj in food_meshes:
            for mod in list(obj.modifiers):
                if mod.name == "LOD_Decimate":
                    obj.modifiers.remove(mod)
            if decimate_ratio < 0.999:
                mod = obj.modifiers.new("LOD_Decimate", "DECIMATE")
                mod.ratio = max(0.05, min(1.0, decimate_ratio))
                mod.use_collapse_triangulate = True

        # Scale textures
        for img in bpy.data.images:
            if img.name not in orig_img_sizes:
                continue
            orig_w, orig_h = orig_img_sizes[img.name]
            if orig_w == 0 or orig_h == 0:
                continue
            if max_tex and (orig_w > max_tex or orig_h > max_tex):
                fac = max_tex / max(orig_w, orig_h)
                nw = max(64, int(orig_w * fac))
                nh = max(64, int(orig_h * fac))
                img.scale(nw, nh)
            else:
                if img.size[0] != orig_w or img.size[1] != orig_h:
                    img.scale(orig_w, orig_h)

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
        size_bytes = os.path.getsize(out_path)
        print(f"  [GLB] Exported {out_filename}: {size_bytes:,} bytes")
        return out_path

    # Compute decimation ratios based on base triangle count
    # If base is > 500k (like noodles), cap high tier to ~120k
    if total_triangles > 400000:
        high_ratio = 120000 / total_triangles
        bal_ratio = 45000 / total_triangles
        ultra_ratio = 18000 / total_triangles
    elif total_triangles > 150000:
        high_ratio = 90000 / total_triangles
        bal_ratio = 35000 / total_triangles
        ultra_ratio = 15000 / total_triangles
    elif total_triangles > 40000:
        high_ratio = 1.0
        bal_ratio = 0.50
        ultra_ratio = 0.25
    else:
        high_ratio = 1.0
        bal_ratio = 0.65
        ultra_ratio = 0.35

    # 1. High tier
    high_file = f"{slug}-high.glb"
    export_tier(high_file, decimate_ratio=high_ratio, max_tex=2048, draco_quant=(14, 10, 12))

    # 2. Balanced tier
    bal_file = f"{slug}-balanced.glb"
    export_tier(bal_file, decimate_ratio=bal_ratio, max_tex=1024, draco_quant=(13, 9, 11))

    # 3. Ultra-light tier
    ultra_file = f"{slug}-ultralight.glb"
    export_tier(ultra_file, decimate_ratio=ultra_ratio, max_tex=512, draco_quant=(12, 8, 10))

    # 4. Copy high tier as root public/models/${slug}.glb
    root_glb_path = os.path.join(ROOT_MODELS_DIR, f"{slug}.glb")
    shutil.copy2(os.path.join(OUT_DIR, high_file), root_glb_path)
    print(f"  [ROOT] Synced default fallback: {root_glb_path}")

    # 5. Export USDZ for iOS AR Quick Look
    usdz_file = f"{slug}.usdz"
    usdz_path = os.path.join(OUT_DIR, usdz_file)
    try:
        # Clear modifiers before USD export
        for obj in food_meshes:
            for mod in list(obj.modifiers):
                if mod.name == "LOD_Decimate":
                    obj.modifiers.remove(mod)
        if hasattr(bpy.ops.wm, 'usd_export'):
            bpy.ops.wm.usd_export(
                filepath=usdz_path,
                selected_objects_only=False,
                export_textures=True
            )
            print(f"  [USDZ] Exported {usdz_file}: {os.path.getsize(usdz_path):,} bytes")
    except Exception as e:
        print(f"  [USDZ WARNING] USDZ export skipped: {e}")

    return True

print("\nStarting pipeline execution across all dishes...")
for spec in DISH_SPECS:
    try:
        process_dish(spec)
    except Exception as e:
        print(f"CRITICAL ERROR on {spec['slug']}: {e}")

print("\n==================================================================")
print("=== COMPLETED ALL DISH 3D & AR EXPORTS ===")
print("==================================================================")
