import bpy
import os
import shutil

ROOT_DIR = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak"
OPT_DIR = os.path.join(ROOT_DIR, "public", "models", "optimized")
TEX_SCRATCH = os.path.join(ROOT_DIR, "scratch", "phase7-usdz-tex")

os.makedirs(TEX_SCRATCH, exist_ok=True)

USDZ_JOBS = [
    ("tandoori-paneer-pizza", "tandoori-paneer-pizza-ultralight.glb", ["tandoori-paneer-pizza.usdz"], 0.30),
    ("chicken-tikka-pizza", "chicken-tikka-pizza-ultralight.glb", ["chicken-tikka-pizza.usdz"], 0.30),
    ("mushroom-truffle-pizza", "mushroom-truffle-pizza-ultralight.glb", ["mushroom-truffle-pizza.usdz"], 0.30),
    ("bbq-chicken-overload", "bbq-chicken-overload-ultralight.glb", ["bbq-chicken-overload.usdz"], 0.30),
    ("classic-smash-burger", "classic-smash-burger-ultralight.glb", ["classic-smash-burger.usdz"], 0.12),
    ("golden-oak-burger", "golden-oak-burger-ultralight.glb", ["golden-oak-burger.usdz", "golden-oak-burger-realistic.usdz"], 0.125),
    ("crispy-paneer-burger", "crispy-paneer-burger-ultralight.glb", ["crispy-paneer-burger.usdz"], 0.12),
    ("wok-tossed-chow-mein", "wok-tossed-chow-mein-ultralight.glb", ["wok-tossed-chow-mein.usdz"], 0.18),
    ("dynamite-chilli-potatoes", "dynamite-chilli-potatoes-ultralight.glb", ["dynamite-chilli-potatoes.usdz"], 0.20),
]

print("================================================================")
print("PHASE 7 BLENDER 5.2 MOBILE USDZ RECONSTRUCTION & 1:1 AR SCALING")
print("================================================================")

for slug, glb_name, usdz_outputs, target_footprint_m in USDZ_JOBS:
    glb_path = os.path.join(OPT_DIR, glb_name)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=glb_path)

    # 1. Unpack & save packed glTF images to disk as compact JPEGs so USDZ embeds them in textures/
    dish_tex_dir = os.path.join(TEX_SCRATCH, slug)
    if os.path.exists(dish_tex_dir):
        shutil.rmtree(dish_tex_dir)
    os.makedirs(dish_tex_dir, exist_ok=True)

    saved_tex_count = 0
    for idx, img in enumerate(list(bpy.data.images)):
        if img.name in ("Render Result", "Viewer Node"):
            continue
        if img.size[0] == 0 or img.size[1] == 0:
            continue
        tex_filename = f"{slug}_tex_{idx}.jpg"
        tex_disk_path = os.path.join(dish_tex_dir, tex_filename)
        if img.packed_file:
            img.unpack(method='REMOVE')
        img.filepath_raw = tex_disk_path
        img.file_format = 'JPEG'
        img.save()
        img.filepath = tex_disk_path
        img.source = 'FILE'
        saved_tex_count += 1

    # 2. Unparent all meshes, keep world transforms, delete non-mesh objects, and apply transforms
    meshes = [o for o in list(bpy.data.objects) if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    for o in list(bpy.data.objects):
        if o.type != 'MESH':
            bpy.data.objects.remove(o, do_unlink=True)

    meshes = [o for o in list(bpy.data.objects) if o.type == 'MESH']

    all_verts = [v.co for o in meshes for v in o.data.vertices]
    min_x = min(v.x for v in all_verts)
    max_x = max(v.x for v in all_verts)
    min_y = min(v.y for v in all_verts)
    max_y = max(v.y for v in all_verts)
    min_z = min(v.z for v in all_verts)
    max_z = max(v.z for v in all_verts)

    cur_w = max_x - min_x
    cur_d = max_y - min_y
    cur_footprint = max(cur_w, cur_d, 0.0001)
    scale_factor = target_footprint_m / cur_footprint

    cx = 0.5 * (min_x + max_x)
    cy = 0.5 * (min_y + max_y)

    # 3. Center footprint at (0,0), align bottom at z=0.0000m, and scale to exact real-world metres
    for o in meshes:
        for v in o.data.vertices:
            v.co.x = (v.co.x - cx) * scale_factor
            v.co.y = (v.co.y - cy) * scale_factor
            v.co.z = (v.co.z - min_z) * scale_factor
        o.data.update()

    new_verts = [v.co for o in meshes for v in o.data.vertices]
    nw = max(v.x for v in new_verts) - min(v.x for v in new_verts)
    nd = max(v.y for v in new_verts) - min(v.y for v in new_verts)
    nh = max(v.z for v in new_verts) - min(v.z for v in new_verts)
    nz_min = min(v.z for v in new_verts)
    tris = sum(len(o.data.polygons) for o in meshes)

    # 4. Export USDZ with packed textures
    primary_usdz = os.path.join(OPT_DIR, usdz_outputs[0])
    bpy.ops.wm.usd_export(
        filepath=primary_usdz,
        selected_objects_only=False,
        export_materials=True,
        generate_preview_surface=True,
        export_textures_mode='NEW',
        overwrite_textures=True,
    )

    for extra_name in usdz_outputs[1:]:
        shutil.copyfile(primary_usdz, os.path.join(OPT_DIR, extra_name))

    after_kb = os.path.getsize(primary_usdz) / 1024.0
    print(
        f"[USDZ OK] {slug:28s} | {after_kb:7.1f} KB | "
        f"tris: {tris:6d} | tex: {saved_tex_count} | "
        f"dims: {nw*100:.1f}x{nd*100:.1f}x{nh*100:.1f}cm (z_min={nz_min:.4f}m)"
    )

print("================================================================")
print("ALL PHASE 7 USDZ ASSETS EXPORTED SUCCESSFULLY")
print("================================================================")
