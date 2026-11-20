import bpy
import os
import math
import shutil
import random
from mathutils import Vector, noise

ROOT_DIR = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak"
BLEND_OUT_DIR = os.path.join(ROOT_DIR, "models", "blender-sources")
RAW_GLB_DIR = os.path.join(ROOT_DIR, "scratch", "phase7-2-raw")
TEX_DIR = os.path.join(ROOT_DIR, "scratch", "phase7-2-textures")
OPT_DIR = os.path.join(ROOT_DIR, "public", "models", "optimized")

for d in (BLEND_OUT_DIR, RAW_GLB_DIR, TEX_DIR, OPT_DIR):
    os.makedirs(d, exist_ok=True)

# Copy the 8 original Blender source files into models/blender-sources/ so all 23 dishes have local repo .blend sources
ORIG_BLENDS = [
    (r"C:\Users\Pyiush Gupta\Downloads\.blends\BLENDER 3\3d models\paneer_pizza.blend", "paneer_pizza.blend"),
    (r"C:\Users\Pyiush Gupta\Downloads\.blends\BLENDER 3\3d models\chicken_pizza.blend", "chicken_pizza.blend"),
    (r"C:\Users\Pyiush Gupta\Downloads\.blends\BLENDER 3\3d models\truffle_mushroom_pizza.blend", "truffle_mushroom_pizza.blend"),
    (r"C:\Users\Pyiush Gupta\Downloads\.blends\BLENDER 3\3d models\bbq_chicken_overload_pizza.blend", "bbq_chicken_overload_pizza.blend"),
    (r"C:\Users\Pyiush Gupta\Downloads\.blends\BLENDER 3\3d models\chiken_burger.blend", "chiken_burger.blend"),
    (r"C:\Users\Pyiush Gupta\Downloads\.blends\BLENDER 3\3d models\chiken_burger.blend", "classic_smash_burger.blend"),
    (r"C:\Users\Pyiush Gupta\Downloads\.blends\BLENDER 3\3d models\paneer_burger.blend", "paneer_burger.blend"),
    (r"C:\Users\Pyiush Gupta\Downloads\.blends\BLENDER 4\noodles_bowl.blend", "chowmein_noodles.blend"),
    (r"C:\Users\Pyiush Gupta\Downloads\.blends\BLENDER 3\3d models\_potatoes bolls .blend", "dynamite_chilli_potatoes.blend"),
]
for src_p, dst_name in ORIG_BLENDS:
    dst_p = os.path.join(BLEND_OUT_DIR, dst_name)
    if os.path.exists(src_p) and not os.path.exists(dst_p):
        shutil.copyfile(src_p, dst_p)


def generate_procedural_texture(filepath, width, height, palette_fn):
    img = bpy.data.images.new(name=os.path.basename(filepath), width=width, height=height, alpha=False)
    pixels = [1.0] * (width * height * 4)
    for y in range(height):
        v = y / float(height)
        for x in range(width):
            u = x / float(width)
            n1 = noise.noise(Vector((u * 6.0, v * 6.0, 0.5)))
            n2 = noise.noise(Vector((u * 18.0, v * 18.0, 1.7)))
            n3 = noise.noise(Vector((u * 42.0, v * 42.0, 3.1)))
            r, g, b = palette_fn(u, v, n1, n2, n3)
            idx = (y * width + x) * 4
            pixels[idx] = max(0.0, min(1.0, r))
            pixels[idx + 1] = max(0.0, min(1.0, g))
            pixels[idx + 2] = max(0.0, min(1.0, b))
            pixels[idx + 3] = 1.0
    img.pixels.foreach_set(pixels)
    img.filepath_raw = filepath
    img.file_format = 'JPEG'
    bpy.context.scene.render.image_settings.file_format = 'JPEG'
    bpy.context.scene.render.image_settings.quality = 88
    img.save()
    img.filepath = filepath
    img.source = 'FILE'
    return img


def make_pbr_material(name, tex_img, roughness):
    mat = bpy.data.materials.new(name=name)
    nt = mat.node_tree
    nt.nodes.clear()
    out_node = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Metallic'].default_value = 0.0
    bsdf.inputs['Roughness'].default_value = roughness
    nt.links.new(bsdf.outputs['BSDF'], out_node.inputs['Surface'])
    if tex_img is not None:
        tex_node = nt.nodes.new('ShaderNodeTexImage')
        tex_node.image = tex_img
        nt.links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])
    return mat


def add_planar_uvs(obj):
    me = obj.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    uv_layer = me.uv_layers.active.data
    xs = [v.co.x for v in me.vertices] or [0.0]
    ys = [v.co.y for v in me.vertices] or [0.0]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    dx = max(max_x - min_x, 0.0001)
    dy = max(max_y - min_y, 0.0001)
    for poly in me.polygons:
        for loop_idx in poly.loop_indices:
            v = me.vertices[me.loops[loop_idx].vertex_index]
            uv_layer[loop_idx].uv = ((v.co.x - min_x) / dx, (v.co.y - min_y) / dy)


def finalize_and_export(slug, blend_name, target_studio_span, target_physical_m, target_height_m):
    meshes = [o for o in list(bpy.data.objects) if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    for o in meshes:
        add_planar_uvs(o)
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.shade_smooth()

    all_verts = [v.co for o in meshes for v in o.data.vertices]
    min_x, max_x = min(v.x for v in all_verts), max(v.x for v in all_verts)
    min_y, max_y = min(v.y for v in all_verts), max(v.y for v in all_verts)
    min_z, max_z = min(v.z for v in all_verts), max(v.z for v in all_verts)

    cur_span = max(max_x - min_x, max_y - min_y, 0.0001)
    cur_h = max(max_z - min_z, 0.0001)
    cx = 0.5 * (min_x + max_x)
    cy = 0.5 * (min_y + max_y)

    studio_scale_xy = target_studio_span / cur_span
    desired_studio_h = target_studio_span * (target_height_m / target_physical_m)
    studio_scale_z = desired_studio_h / cur_h

    for o in meshes:
        for v in o.data.vertices:
            v.co.x = (v.co.x - cx) * studio_scale_xy
            v.co.y = (v.co.y - cy) * studio_scale_xy
            v.co.z = (v.co.z - min_z) * studio_scale_z
        o.data.update()

    blend_path = os.path.join(BLEND_OUT_DIR, blend_name)
    bpy.ops.wm.save_as_mainfile(filepath=blend_path, compress=True)
    if os.path.exists(blend_path + "1"):
        os.remove(blend_path + "1")

    high_raw_path = os.path.join(RAW_GLB_DIR, f"{slug}-high-raw.glb")
    bpy.ops.export_scene.gltf(
        filepath=high_raw_path,
        export_format='GLB',
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials='EXPORT',
        export_image_format='JPEG',
        export_jpeg_quality=90,
    )
    high_tris = sum(len(o.data.polygons) for o in meshes)

    for o in meshes:
        dec = o.modifiers.new(name="BalDecimate", type='DECIMATE')
        dec.ratio = 0.55
    bal_raw_path = os.path.join(RAW_GLB_DIR, f"{slug}-balanced-raw.glb")
    bpy.ops.export_scene.gltf(
        filepath=bal_raw_path,
        export_format='GLB',
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials='EXPORT',
        export_image_format='JPEG',
        export_jpeg_quality=78,
    )
    for o in meshes:
        o.modifiers.clear()

    for o in meshes:
        dec = o.modifiers.new(name="UltraDecimate", type='DECIMATE')
        dec.ratio = 0.28
    ultra_raw_path = os.path.join(RAW_GLB_DIR, f"{slug}-ultralight-raw.glb")
    bpy.ops.export_scene.gltf(
        filepath=ultra_raw_path,
        export_format='GLB',
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials='EXPORT',
        export_image_format='JPEG',
        export_jpeg_quality=62,
    )

    for o in meshes:
        o.modifiers.clear()
        dec = o.modifiers.new(name="UsdzDecimate", type='DECIMATE')
        dec.ratio = 0.50
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier=dec.name)

    phys_scale = target_physical_m / target_studio_span
    for o in meshes:
        for v in o.data.vertices:
            v.co.x *= phys_scale
            v.co.y *= phys_scale
            v.co.z *= phys_scale
        o.data.update()

    usdz_path = os.path.join(OPT_DIR, f"{slug}.usdz")
    bpy.ops.wm.usd_export(
        filepath=usdz_path,
        selected_objects_only=False,
        export_materials=True,
        generate_preview_surface=True,
        export_textures_mode='NEW',
        overwrite_textures=True,
    )
    usdz_tris = sum(len(o.data.polygons) for o in meshes)
    print(f"[PHASE 7.2 BUILT] {slug:32s} | high_tris: {high_tris:6d} | usdz_tris: {usdz_tris:6d} | blend: {blend_name} | usdz: {os.path.getsize(usdz_path)/1024:.1f} KB")


def build_pizza_base_and_cheese(mat_crust, mat_cheese, seed_offset):
    # 1. Blistered Neapolitan cornicione crust ring + flat dough base
    bpy.ops.mesh.primitive_cylinder_add(vertices=72, radius=1.2, depth=0.075, location=(0, 0, 0.0375))
    crust = bpy.context.active_object
    crust.name = "Mesh_Artisan_Pizza_Crust"
    sub = crust.modifiers.new("Sub", 'SUBSURF')
    sub.levels = 2
    bpy.ops.object.modifier_apply(modifier=sub.name)
    for v in crust.data.vertices:
        r = math.hypot(v.co.x, v.co.y)
        n = noise.noise(Vector((v.co.x * 4.5 + seed_offset, v.co.y * 4.5, v.co.z * 4.5)))
        if r > 0.96 and v.co.z > 0.02:
            v.co.z += 0.038 * math.sin(((r - 0.96) / 0.24) * math.pi) + 0.008 * n
        elif r <= 0.96 and v.co.z > 0.04:
            v.co.z = 0.045 + 0.004 * n
    crust.data.materials.append(mat_crust)

    # 2. Molten mozzarella & sauce bed
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=1.02, depth=0.035, location=(0, 0, 0.048))
    cheese = bpy.context.active_object
    cheese.name = "Mesh_Mozzarella_Sauce_Bed"
    sub2 = cheese.modifiers.new("Sub", 'SUBSURF')
    sub2.levels = 2
    bpy.ops.object.modifier_apply(modifier=sub2.name)
    for v in cheese.data.vertices:
        n = noise.noise(Vector((v.co.x * 7.0 + seed_offset, v.co.y * 7.0, 1.0)))
        if v.co.z > 0.04:
            v.co.z += 0.008 * n
    cheese.data.materials.append(mat_cheese)


# ============================================================================
# 1. PERI-PERI FIESTA PIZZA (30.0 x 30.0 x 3.5 cm)
# ============================================================================
def build_peri_peri_fiesta_pizza():
    slug = "peri-peri-fiesta-pizza"
    bpy.ops.wm.read_factory_settings(use_empty=True)
    random.seed(7201)
    d_tex = os.path.join(TEX_DIR, slug)
    os.makedirs(d_tex, exist_ok=True)

    img_crust = generate_procedural_texture(
        os.path.join(d_tex, "peri_crust.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.76 - 0.16 * max(0, n2), 0.52 - 0.14 * max(0, n2), 0.26 + 0.04 * n3)
    )
    img_cheese = generate_procedural_texture(
        os.path.join(d_tex, "peri_mozzarella_base.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.92 - 0.12 * max(0, n1), 0.68 - 0.22 * max(0, n1), 0.32 + 0.05 * n2)
    )
    img_chicken = generate_procedural_texture(
        os.path.join(d_tex, "peri_spiced_chicken.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.78 + 0.08 * n1, 0.26 + 0.08 * n2, 0.10 + 0.04 * n3)
    )
    img_corn_chili = generate_procedural_texture(
        os.path.join(d_tex, "fiesta_corn_and_chili.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.94 - 0.20 * max(0, n2), 0.76 - 0.45 * max(0, n2), 0.14 + 0.05 * n3)
    )

    mat_crust = make_pbr_material("Mat_Peri_Artisan_Crust", img_crust, 0.72)
    mat_cheese = make_pbr_material("Mat_Peri_Mozzarella_Bed", img_cheese, 0.28)
    mat_chicken = make_pbr_material("Mat_Peri_Grilled_Chicken", img_chicken, 0.40)
    mat_fiesta = make_pbr_material("Mat_Fiesta_Corn_Chili_Swirl", img_corn_chili, 0.24)

    build_pizza_base_and_cheese(mat_crust, mat_cheese, 1.1)

    # 3. 16 Charred Peri-Peri Chicken Breast Strips
    chk_objs = []
    for i in range(16):
        ang = (i / 16.0) * math.pi * 2.0 + random.uniform(-0.1, 0.1)
        dist = 0.26 + (i % 3) * 0.24
        bpy.ops.mesh.primitive_cube_add(size=0.14, location=(math.cos(ang) * dist, math.sin(ang) * dist, 0.082))
        c = bpy.context.active_object
        c.scale = (1.45, 0.65, 0.35)
        sub = c.modifiers.new("Sub", 'SUBSURF')
        sub.levels = 1
        bpy.ops.object.modifier_apply(modifier=sub.name)
        c.rotation_euler = (0.0, 0.0, ang + 0.4)
        c.data.materials.append(mat_chicken)
        chk_objs.append(c)
    bpy.ops.object.select_all(action='DESELECT')
    for o in chk_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = chk_objs[0]
    bpy.ops.object.join()
    chk_objs[0].name = "Mesh_Peri_Peri_Chicken_Strips"

    # 4. Roasted Sweet Corn Kernels, Red Chili Rings & Peri Aioli Swirl
    gar_objs = []
    for i in range(24):
        ang = (i / 24.0) * math.pi * 2.0 + 0.2
        dist = 0.15 + (i % 4) * 0.21
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=16, ring_count=10, radius=0.045,
            location=(math.cos(ang) * dist, math.sin(ang) * dist, 0.08)
        )
        g = bpy.context.active_object
        g.scale = (1.1, 0.85, 0.65)
        g.data.materials.append(mat_fiesta)
        gar_objs.append(g)
    for r_ring in (0.32, 0.64, 0.86):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=r_ring, minor_radius=0.016, major_segments=48, minor_segments=10,
            location=(0, 0, 0.085)
        )
        sw = bpy.context.active_object
        sw.data.materials.append(mat_fiesta)
        gar_objs.append(sw)
    bpy.ops.object.select_all(action='DESELECT')
    for o in gar_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = gar_objs[0]
    bpy.ops.object.join()
    gar_objs[0].name = "Mesh_Fiesta_Corn_Chili_And_Aioli"

    finalize_and_export(slug, "peri_peri_fiesta_pizza.blend", 2.4, 0.30, 0.035)


# ============================================================================
# 2. PANEER ROYALE BURGER (12.0 x 12.0 x 10.0 cm)
# ============================================================================
def build_paneer_royale_burger():
    slug = "paneer-royale-burger"
    bpy.ops.wm.read_factory_settings(use_empty=True)
    random.seed(7202)
    d_tex = os.path.join(TEX_DIR, slug)
    os.makedirs(d_tex, exist_ok=True)

    img_bun = generate_procedural_texture(
        os.path.join(d_tex, "royale_nigella_brioche_bun.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.82 - 0.15 * max(0, n3), 0.54 - 0.12 * max(0, n3), 0.22 + 0.04 * n1)
    )
    img_paneer = generate_procedural_texture(
        os.path.join(d_tex, "shahi_herb_crusted_paneer.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.86 + 0.06 * n1, 0.62 + 0.08 * n2, 0.24 + 0.05 * n3)
    )
    img_makhani = generate_procedural_texture(
        os.path.join(d_tex, "saffron_makhani_cheddar_melt.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.94 + 0.04 * n1, 0.64 + 0.08 * n2, 0.14 + 0.04 * n3)
    )
    img_greens = generate_procedural_texture(
        os.path.join(d_tex, "pickled_onion_and_arugula.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.28 + 0.35 * max(0, n2), 0.64 - 0.25 * max(0, n2), 0.22 + 0.15 * max(0, n2))
    )

    mat_bun = make_pbr_material("Mat_Royale_Nigella_Brioche", img_bun, 0.44)
    mat_paneer = make_pbr_material("Mat_Shahi_Paneer_Steak", img_paneer, 0.52)
    mat_cheese = make_pbr_material("Mat_Saffron_Makhani_Cheese", img_makhani, 0.24)
    mat_greens = make_pbr_material("Mat_Royale_Onion_And_Arugula", img_greens, 0.36)

    # 1. Brioche Heel + Crown Buns
    bpy.ops.mesh.primitive_cylinder_add(vertices=56, radius=0.92, depth=0.32, location=(0, 0, 0.16))
    heel = bpy.context.active_object
    sub_h = heel.modifiers.new("Sub", 'SUBSURF')
    sub_h.levels = 1
    bpy.ops.object.modifier_apply(modifier=sub_h.name)
    heel.data.materials.append(mat_bun)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=56, ring_count=32, radius=0.95, location=(0, 0, 1.02))
    crown = bpy.context.active_object
    for v in crown.data.vertices:
        if v.co.z < 0:
            v.co.z *= 0.22
        else:
            v.co.z *= 0.62
    crown.data.materials.append(mat_bun)
    bpy.ops.object.select_all(action='DESELECT')
    heel.select_set(True)
    crown.select_set(True)
    bpy.context.view_layer.objects.active = heel
    bpy.ops.object.join()
    heel.name = "Mesh_Royale_Brioche_Buns"

    # 2. Thick Shahi Spiced Paneer Steak Slab
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.94, depth=0.38, location=(0, 0, 0.54))
    patty = bpy.context.active_object
    patty.name = "Mesh_Shahi_Paneer_Steak_Patty"
    sub_p = patty.modifiers.new("Sub", 'SUBSURF')
    sub_p.levels = 2
    bpy.ops.object.modifier_apply(modifier=sub_p.name)
    for v in patty.data.vertices:
        n = noise.noise(Vector((v.co.x * 8.0, v.co.y * 8.0, v.co.z * 8.0)))
        v.co.x *= (1.0 + 0.05 * n)
        v.co.y *= (1.0 + 0.05 * n)
    patty.data.materials.append(mat_paneer)

    # 3. Draped Saffron Makhani Cheddar Cheese Slice
    bpy.ops.mesh.primitive_cube_add(size=1.42, location=(0, 0, 0.76))
    ch = bpy.context.active_object
    ch.name = "Mesh_Saffron_Makhani_Cheese_Melt"
    ch.scale = (1.0, 1.0, 0.04)
    sub_c = ch.modifiers.new("Sub", 'SUBSURF')
    sub_c.levels = 2
    bpy.ops.object.modifier_apply(modifier=sub_c.name)
    for v in ch.data.vertices:
        r = math.hypot(v.co.x, v.co.y)
        if r > 0.72:
            v.co.z -= 0.14 * (r - 0.72)
    ch.data.materials.append(mat_cheese)

    # 4. Pickled Masala Onion Rings & Wild Arugula Ruffle
    gr_objs = []
    for i in range(10):
        ang = (i / 10.0) * math.pi * 2.0
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.32, minor_radius=0.045, major_segments=28, minor_segments=12,
            location=(0.45 * math.cos(ang), 0.45 * math.sin(ang), 0.86 + (i % 2) * 0.04)
        )
        ring = bpy.context.active_object
        ring.rotation_euler = (0.2 * math.sin(ang), 0.2 * math.cos(ang), ang)
        ring.data.materials.append(mat_greens)
        gr_objs.append(ring)
    bpy.ops.object.select_all(action='DESELECT')
    for o in gr_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = gr_objs[0]
    bpy.ops.object.join()
    gr_objs[0].name = "Mesh_Pickled_Onion_And_Arugula"

    finalize_and_export(slug, "paneer_royale_burger.blend", 2.0, 0.12, 0.10)


# ============================================================================
# 3. HAKKA STREET CHOW MEIN (18.0 x 18.0 x 8.0 cm)
# ============================================================================
def build_hakka_street_chow_mein():
    slug = "hakka-street-chow-mein"
    bpy.ops.wm.read_factory_settings(use_empty=True)
    random.seed(7203)
    d_tex = os.path.join(TEX_DIR, slug)
    os.makedirs(d_tex, exist_ok=True)

    img_bowl = generate_procedural_texture(
        os.path.join(d_tex, "street_terracotta_wok_bowl.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.22 + 0.04 * n1, 0.16 + 0.03 * n1, 0.14 + 0.02 * n2)
    )
    img_noodles = generate_procedural_texture(
        os.path.join(d_tex, "hakka_chili_garlic_noodles.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.72 + 0.10 * math.sin(u * 60.0 + n1 * 4.0), 0.38 + 0.08 * n2, 0.14 + 0.04 * n3)
    )
    img_veggies = generate_procedural_texture(
        os.path.join(d_tex, "shredded_cabbage_and_peppers.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.30 + 0.45 * max(0, n1), 0.68 - 0.25 * max(0, n1), 0.22 + 0.20 * max(0, n2))
    )
    img_garlic = generate_procedural_texture(
        os.path.join(d_tex, "crispy_garlic_and_scallions.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.84 - 0.35 * max(0, n2), 0.68 + 0.12 * max(0, n2), 0.26)
    )

    mat_bowl = make_pbr_material("Mat_Street_Terracotta_Bowl", img_bowl, 0.50)
    mat_noodles = make_pbr_material("Mat_Hakka_Chili_Garlic_Noodles", img_noodles, 0.20)
    mat_veggies = make_pbr_material("Mat_Hakka_Peppers_And_Cabbage", img_veggies, 0.32)
    mat_garlic = make_pbr_material("Mat_Crispy_Garlic_Scallion_Top", img_garlic, 0.42)

    # 1. Wide-flared street noodle bowl
    bpy.ops.mesh.primitive_cone_add(vertices=64, radius1=0.68, radius2=1.1, depth=0.58, location=(0, 0, 0.29))
    bowl = bpy.context.active_object
    bowl.name = "Mesh_Street_Flared_Wok_Bowl"
    sub = bowl.modifiers.new("Sub", 'SUBSURF')
    sub.levels = 1
    bpy.ops.object.modifier_apply(modifier=sub.name)
    bowl.data.materials.append(mat_bowl)

    # 2. High-flame wok-tossed Hakka noodle nest (22 braided torus noodle strands)
    nd_objs = []
    for i in range(22):
        ang = (i / 22.0) * math.pi * 2.0
        r_maj = 0.25 + (i % 4) * 0.14
        bpy.ops.mesh.primitive_torus_add(
            major_radius=r_maj, minor_radius=0.042, major_segments=32, minor_segments=10,
            location=(0.18 * math.cos(ang), 0.18 * math.sin(ang), 0.48 + (i % 5) * 0.045)
        )
        n = bpy.context.active_object
        n.rotation_euler = (0.35 * math.sin(i), 0.35 * math.cos(i), ang)
        n.data.materials.append(mat_noodles)
        nd_objs.append(n)
    bpy.ops.object.select_all(action='DESELECT')
    for o in nd_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = nd_objs[0]
    bpy.ops.object.join()
    nd_objs[0].name = "Mesh_Hakka_Wok_Noodle_Strands"

    # 3. Shredded cabbage, julienned bell peppers & bean sprouts
    vg_objs = []
    for i in range(16):
        ang = (i / 16.0) * math.pi * 2.0
        dist = 0.18 + (i % 3) * 0.22
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=16, radius=0.028, depth=0.36,
            location=(math.cos(ang) * dist, math.sin(ang) * dist, 0.66 + (i % 3) * 0.035)
        )
        v = bpy.context.active_object
        v.rotation_euler = (1.3, 0.3 * math.sin(i), ang + 0.6)
        v.data.materials.append(mat_veggies)
        vg_objs.append(v)
    bpy.ops.object.select_all(action='DESELECT')
    for o in vg_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = vg_objs[0]
    bpy.ops.object.join()
    vg_objs[0].name = "Mesh_Julienne_Cabbage_And_Peppers"

    # 4. Crispy fried garlic chips & scallion greens
    gar_objs = []
    for i in range(12):
        ang = (i / 12.0) * math.pi * 2.0
        dist = 0.12 + (i % 2) * 0.25
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=14, ring_count=10, radius=0.055,
            location=(math.cos(ang) * dist, math.sin(ang) * dist, 0.74)
        )
        g = bpy.context.active_object
        g.scale = (1.2, 0.7, 0.3)
        g.data.materials.append(mat_garlic)
        gar_objs.append(g)
    bpy.ops.object.select_all(action='DESELECT')
    for o in gar_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = gar_objs[0]
    bpy.ops.object.join()
    gar_objs[0].name = "Mesh_Crispy_Garlic_And_Scallions"

    finalize_and_export(slug, "hakka_street_chow_mein.blend", 2.2, 0.18, 0.08)


# ============================================================================
# 4. GOLDEN CHILLI POTATO (20.0 x 20.0 x 5.5 cm)
# ============================================================================
def build_golden_chilli_potato():
    slug = "golden-chilli-potato"
    bpy.ops.wm.read_factory_settings(use_empty=True)
    random.seed(7204)
    d_tex = os.path.join(TEX_DIR, slug)
    os.makedirs(d_tex, exist_ok=True)

    img_platter = generate_procedural_texture(
        os.path.join(d_tex, "matte_black_gold_porcelain_boat.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.15 + 0.03 * n1, 0.14 + 0.03 * n1, 0.13 + 0.02 * n2)
    )
    img_wedges = generate_procedural_texture(
        os.path.join(d_tex, "amber_honey_chilli_potato_fingers.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.86 + 0.08 * n1, 0.38 + 0.10 * n2, 0.08 + 0.04 * n3)
    )
    img_capsicum = generate_procedural_texture(
        os.path.join(d_tex, "caramelized_capsicum_shallots.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.24 + 0.42 * max(0, n1), 0.58 - 0.22 * max(0, n1), 0.18 + 0.08 * n2)
    )

    mat_platter = make_pbr_material("Mat_Golden_Porcelain_Boat", img_platter, 0.30)
    mat_wedges = make_pbr_material("Mat_Honey_Chilli_Potato_Fingers", img_wedges, 0.22)
    mat_caps = make_pbr_material("Mat_Wok_Capsicum_And_Sesame", img_capsicum, 0.28)

    # 1. Shallow curved porcelain appetizer platter
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=1.08, depth=0.14, location=(0, 0, 0.07))
    boat = bpy.context.active_object
    boat.name = "Mesh_Porcelain_Appetizer_Platter"
    sub = boat.modifiers.new("Sub", 'SUBSURF')
    sub.levels = 2
    bpy.ops.object.modifier_apply(modifier=sub.name)
    boat.data.materials.append(mat_platter)

    # 2. 22 Stacked Crispy Finger-Cut Honey-Chilli Potato Wedges (Batonnet Log Stack)
    wd_objs = []
    for i in range(22):
        layer = i // 6
        idx_in_layer = i % 6
        ang = (idx_in_layer / 6.0) * math.pi + layer * 0.65 + random.uniform(-0.12, 0.12)
        offset = (idx_in_layer - 2.5) * 0.13
        wx = math.cos(ang + 1.57) * offset
        wy = math.sin(ang + 1.57) * offset
        wz = 0.18 + layer * 0.075
        bpy.ops.mesh.primitive_cube_add(size=0.14, location=(wx, wy, wz))
        w = bpy.context.active_object
        w.scale = (3.4, 0.68, 0.58)
        sub_w = w.modifiers.new("Sub", 'SUBSURF')
        sub_w.levels = 1
        bpy.ops.object.modifier_apply(modifier=sub_w.name)
        w.rotation_euler = (random.uniform(-0.12, 0.12), random.uniform(-0.15, 0.15), ang)
        w.data.materials.append(mat_wedges)
        wd_objs.append(w)
    bpy.ops.object.select_all(action='DESELECT')
    for o in wd_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = wd_objs[0]
    bpy.ops.object.join()
    wd_objs[0].name = "Mesh_Honey_Chilli_Potato_Fingers"

    # 3. Wok-blistered capsicum triangles, shallots & sesame garnish
    cp_objs = []
    for i in range(14):
        ang = (i / 14.0) * math.pi * 2.0
        dist = 0.16 + (i % 3) * 0.20
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=16, ring_count=12, radius=0.08,
            location=(math.cos(ang) * dist, math.sin(ang) * dist, 0.28 + (i % 3) * 0.05)
        )
        c = bpy.context.active_object
        c.scale = (1.3, 0.85, 0.30)
        c.rotation_euler = (0.3, -0.2, ang)
        c.data.materials.append(mat_caps)
        cp_objs.append(c)
    bpy.ops.object.select_all(action='DESELECT')
    for o in cp_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = cp_objs[0]
    bpy.ops.object.join()
    cp_objs[0].name = "Mesh_Caramelized_Capsicum_And_Sesame"

    finalize_and_export(slug, "golden_chilli_potato.blend", 2.2, 0.20, 0.055)


# ============================================================================
# 5. KEEMA MASALA PIZZA (30.0 x 30.0 x 3.5 cm)
# ============================================================================
def build_keema_masala_pizza():
    slug = "keema-masala-pizza"
    bpy.ops.wm.read_factory_settings(use_empty=True)
    random.seed(7205)
    d_tex = os.path.join(TEX_DIR, slug)
    os.makedirs(d_tex, exist_ok=True)

    img_crust = generate_procedural_texture(
        os.path.join(d_tex, "keema_spiced_crust.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.74 - 0.15 * max(0, n2), 0.49 - 0.12 * max(0, n2), 0.24 + 0.04 * n3)
    )
    img_cheese = generate_procedural_texture(
        os.path.join(d_tex, "bhuna_masala_mozzarella.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.88 - 0.16 * max(0, n1), 0.62 - 0.22 * max(0, n1), 0.28 + 0.04 * n2)
    )
    img_keema = generate_procedural_texture(
        os.path.join(d_tex, "spiced_lamb_keema_mince.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.46 + 0.12 * n1, 0.22 + 0.08 * n2, 0.11 + 0.04 * n3)
    )
    img_chili = generate_procedural_texture(
        os.path.join(d_tex, "green_chili_ginger_coriander.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.22 + 0.45 * max(0, n2), 0.66 - 0.12 * max(0, n2), 0.18 + 0.08 * n3)
    )

    mat_crust = make_pbr_material("Mat_Keema_Stone_Crust", img_crust, 0.74)
    mat_cheese = make_pbr_material("Mat_Bhuna_Mozzarella_Bed", img_cheese, 0.28)
    mat_keema = make_pbr_material("Mat_Spiced_Minced_Keema", img_keema, 0.46)
    mat_garnish = make_pbr_material("Mat_Green_Chili_Ginger_Coriander", img_chili, 0.34)

    build_pizza_base_and_cheese(mat_crust, mat_cheese, 2.5)

    # 3. 24 Coarse-ground spiced lamb keema clusters
    km_objs = []
    for i in range(24):
        ang = (i / 24.0) * math.pi * 2.0 + random.uniform(-0.12, 0.12)
        dist = 0.16 + (i % 4) * 0.21
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=20, ring_count=14, radius=0.075,
            location=(math.cos(ang) * dist, math.sin(ang) * dist, 0.078)
        )
        k = bpy.context.active_object
        for v in k.data.vertices:
            n = noise.noise(Vector((v.co.x * 18.0, v.co.y * 18.0, v.co.z * 18.0)))
            v.co *= (1.0 + 0.26 * n)
            v.co.z *= 0.48
        k.data.materials.append(mat_keema)
        km_objs.append(k)
    bpy.ops.object.select_all(action='DESELECT')
    for o in km_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = km_objs[0]
    bpy.ops.object.join()
    km_objs[0].name = "Mesh_Spiced_Minced_Keema_Clusters"

    # 4. Sliced green chili coins, ginger julienne & red onion rings
    gr_objs = []
    for i in range(16):
        ang = (i / 16.0) * math.pi * 2.0 + 0.15
        dist = 0.24 + (i % 3) * 0.24
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=20, radius=0.045, depth=0.018,
            location=(math.cos(ang) * dist, math.sin(ang) * dist, 0.088)
        )
        ch = bpy.context.active_object
        ch.data.materials.append(mat_garnish)
        gr_objs.append(ch)
    bpy.ops.object.select_all(action='DESELECT')
    for o in gr_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = gr_objs[0]
    bpy.ops.object.join()
    gr_objs[0].name = "Mesh_Green_Chili_Ginger_And_Coriander"

    finalize_and_export(slug, "keema_masala_pizza.blend", 2.4, 0.30, 0.035)


# ============================================================================
# 6. FARMHOUSE SUPREME PIZZA (30.0 x 30.0 x 3.5 cm)
# ============================================================================
def build_farmhouse_supreme_pizza():
    slug = "farmhouse-supreme-pizza"
    bpy.ops.wm.read_factory_settings(use_empty=True)
    random.seed(7206)
    d_tex = os.path.join(TEX_DIR, slug)
    os.makedirs(d_tex, exist_ok=True)

    img_crust = generate_procedural_texture(
        os.path.join(d_tex, "farmhouse_pizzeria_crust.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.78 - 0.14 * max(0, n2), 0.55 - 0.12 * max(0, n2), 0.28 + 0.04 * n3)
    )
    img_cheese = generate_procedural_texture(
        os.path.join(d_tex, "marinara_mozzarella_bed.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.94 - 0.10 * max(0, n1), 0.82 - 0.18 * max(0, n1), 0.56 + 0.05 * n2)
    )
    img_olives = generate_procedural_texture(
        os.path.join(d_tex, "kalamata_olives_and_mushrooms.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.24 + 0.26 * max(0, n1), 0.20 + 0.22 * max(0, n1), 0.18 + 0.18 * max(0, n1))
    )
    img_peppers = generate_procedural_texture(
        os.path.join(d_tex, "tri_bell_peppers_and_babycorn.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.35 + 0.50 * max(0, n1), 0.68 - 0.20 * max(0, n2), 0.18 + 0.06 * n3)
    )

    mat_crust = make_pbr_material("Mat_Farmhouse_Artisan_Crust", img_crust, 0.72)
    mat_cheese = make_pbr_material("Mat_Farmhouse_Mozzarella_Bed", img_cheese, 0.28)
    mat_olives = make_pbr_material("Mat_Kalamata_Olives_And_Mushrooms", img_olives, 0.32)
    mat_peppers = make_pbr_material("Mat_Farmhouse_Garden_Peppers", img_peppers, 0.30)

    build_pizza_base_and_cheese(mat_crust, mat_cheese, 3.8)

    # 3. 16 Sliced Black Kalamata Olive Rings & 12 Button Mushroom Slices
    om_objs = []
    for i in range(16):
        ang = (i / 16.0) * math.pi * 2.0
        dist = 0.22 + (i % 3) * 0.26
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.052, minor_radius=0.020, major_segments=20, minor_segments=10,
            location=(math.cos(ang) * dist, math.sin(ang) * dist, 0.082)
        )
        ol = bpy.context.active_object
        ol.data.materials.append(mat_olives)
        om_objs.append(ol)
    for i in range(12):
        ang = (i / 12.0) * math.pi * 2.0 + 0.26
        dist = 0.30 + (i % 2) * 0.32
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=20, radius=0.085, depth=0.018,
            location=(math.cos(ang) * dist, math.sin(ang) * dist, 0.080)
        )
        ms = bpy.context.active_object
        ms.scale = (1.1, 0.85, 1.0)
        ms.rotation_euler = (0, 0, ang)
        ms.data.materials.append(mat_olives)
        om_objs.append(ms)
    bpy.ops.object.select_all(action='DESELECT')
    for o in om_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = om_objs[0]
    bpy.ops.object.join()
    om_objs[0].name = "Mesh_Black_Olives_And_Mushrooms"

    # 4. Roasted Tri-Bell Pepper Strips & Golden Babycorn Coins
    pp_objs = []
    for i in range(18):
        ang = (i / 18.0) * math.pi * 2.0 + 0.1
        dist = 0.18 + (i % 3) * 0.25
        bpy.ops.mesh.primitive_cube_add(
            size=0.10,
            location=(math.cos(ang) * dist, math.sin(ang) * dist, 0.084)
        )
        p = bpy.context.active_object
        p.scale = (1.8, 0.45, 0.28)
        p.rotation_euler = (0, 0, ang + 0.8)
        p.data.materials.append(mat_peppers)
        pp_objs.append(p)
    bpy.ops.object.select_all(action='DESELECT')
    for o in pp_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = pp_objs[0]
    bpy.ops.object.join()
    pp_objs[0].name = "Mesh_Farmhouse_Peppers_And_Corn"

    finalize_and_export(slug, "farmhouse_supreme_pizza.blend", 2.4, 0.30, 0.035)


# ============================================================================
# 7. TRUFFLE MUSHROOM CHEESE BURGER (12.0 x 12.0 x 10.0 cm)
# ============================================================================
def build_truffle_mushroom_cheese_burger():
    slug = "truffle-mushroom-cheese-burger"
    bpy.ops.wm.read_factory_settings(use_empty=True)
    random.seed(7207)
    d_tex = os.path.join(TEX_DIR, slug)
    os.makedirs(d_tex, exist_ok=True)

    img_bun = generate_procedural_texture(
        os.path.join(d_tex, "truffle_poppy_brioche_bun.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.76 - 0.14 * max(0, n3), 0.48 - 0.12 * max(0, n3), 0.22 + 0.04 * n1)
    )
    img_patty = generate_procedural_texture(
        os.path.join(d_tex, "peppercorn_seared_gourmet_patty.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.34 + 0.08 * n1, 0.20 + 0.06 * n2, 0.13 + 0.04 * n3)
    )
    img_swiss = generate_procedural_texture(
        os.path.join(d_tex, "molten_aged_swiss_gruyere.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.95 + 0.03 * n1, 0.89 + 0.04 * n2, 0.68 + 0.04 * n3)
    )
    img_mush = generate_procedural_texture(
        os.path.join(d_tex, "sauteed_truffle_mushrooms_aioli.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.44 + 0.14 * n1, 0.32 + 0.10 * n2, 0.22 + 0.08 * n3)
    )

    mat_bun = make_pbr_material("Mat_Truffle_Poppy_Brioche", img_bun, 0.42)
    mat_patty = make_pbr_material("Mat_Peppercorn_Seared_Patty", img_patty, 0.48)
    mat_swiss = make_pbr_material("Mat_Molten_Swiss_Gruyere", img_swiss, 0.26)
    mat_mush = make_pbr_material("Mat_Sauteed_Truffle_Mushrooms", img_mush, 0.24)

    # 1. Brioche Heel + Crown Buns
    bpy.ops.mesh.primitive_cylinder_add(vertices=56, radius=0.92, depth=0.30, location=(0, 0, 0.15))
    heel = bpy.context.active_object
    sub_h = heel.modifiers.new("Sub", 'SUBSURF')
    sub_h.levels = 1
    bpy.ops.object.modifier_apply(modifier=sub_h.name)
    heel.data.materials.append(mat_bun)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=56, ring_count=32, radius=0.95, location=(0, 0, 1.04))
    crown = bpy.context.active_object
    for v in crown.data.vertices:
        if v.co.z < 0:
            v.co.z *= 0.20
        else:
            v.co.z *= 0.60
    crown.data.materials.append(mat_bun)
    bpy.ops.object.select_all(action='DESELECT')
    heel.select_set(True)
    crown.select_set(True)
    bpy.context.view_layer.objects.active = heel
    bpy.ops.object.join()
    heel.name = "Mesh_Truffle_Brioche_Buns"

    # 2. Seared Peppercorn Gourmet Patty
    bpy.ops.mesh.primitive_cylinder_add(vertices=56, radius=0.95, depth=0.36, location=(0, 0, 0.50))
    patty = bpy.context.active_object
    patty.name = "Mesh_Seared_Gourmet_Patty"
    sub_p = patty.modifiers.new("Sub", 'SUBSURF')
    sub_p.levels = 2
    bpy.ops.object.modifier_apply(modifier=sub_p.name)
    for v in patty.data.vertices:
        n = noise.noise(Vector((v.co.x * 9.0, v.co.y * 9.0, v.co.z * 9.0)))
        v.co.x *= (1.0 + 0.06 * n)
        v.co.y *= (1.0 + 0.06 * n)
    patty.data.materials.append(mat_patty)

    # 3. Molten Swiss Gruyère Cheese Blanket
    bpy.ops.mesh.primitive_cube_add(size=1.44, location=(0, 0, 0.72))
    sw = bpy.context.active_object
    sw.name = "Mesh_Swiss_Gruyere_Cheese_Blanket"
    sw.scale = (1.0, 1.0, 0.04)
    sub_s = sw.modifiers.new("Sub", 'SUBSURF')
    sub_s.levels = 2
    bpy.ops.object.modifier_apply(modifier=sub_s.name)
    for v in sw.data.vertices:
        r = math.hypot(v.co.x, v.co.y)
        if r > 0.70:
            v.co.z -= 0.16 * (r - 0.70)
    sw.rotation_euler = (0, 0, 0.35)
    sw.data.materials.append(mat_swiss)

    # 4. Crown of Sautéed Wild Cremini/Shiitake Mushrooms & Truffle Aioli
    ms_objs = []
    for i in range(14):
        ang = (i / 14.0) * math.pi * 2.0
        dist = 0.25 + (i % 3) * 0.24
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=22, ring_count=14, radius=0.18,
            location=(math.cos(ang) * dist, math.sin(ang) * dist, 0.84 + (i % 2) * 0.04)
        )
        m = bpy.context.active_object
        m.scale = (1.15, 0.75, 0.24)
        m.rotation_euler = (0.25 * math.sin(ang), 0.25 * math.cos(ang), ang)
        m.data.materials.append(mat_mush)
        ms_objs.append(m)
    bpy.ops.object.select_all(action='DESELECT')
    for o in ms_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = ms_objs[0]
    bpy.ops.object.join()
    ms_objs[0].name = "Mesh_Sauteed_Wild_Mushrooms_And_Aioli"

    finalize_and_export(slug, "truffle_mushroom_cheese_burger.blend", 2.0, 0.12, 0.10)


# ============================================================================
# 8. GOLDEN OAK SIGNATURE BURGER (12.5 x 12.5 x 10.5 cm — Double-Patty Crown)
# ============================================================================
def build_golden_oak_signature_burger():
    slug = "golden-oak-signature-burger"
    bpy.ops.wm.read_factory_settings(use_empty=True)
    random.seed(7208)
    d_tex = os.path.join(TEX_DIR, slug)
    os.makedirs(d_tex, exist_ok=True)

    img_bun = generate_procedural_texture(
        os.path.join(d_tex, "signature_gold_sesame_brioche.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.84 - 0.14 * max(0, n3), 0.54 - 0.12 * max(0, n3), 0.22 + 0.05 * n1)
    )
    img_patty = generate_procedural_texture(
        os.path.join(d_tex, "double_flame_grilled_angus_patty.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.36 + 0.10 * n1, 0.20 + 0.06 * n2, 0.12 + 0.04 * n3)
    )
    img_cheddar = generate_procedural_texture(
        os.path.join(d_tex, "aged_smoked_gold_cheddar.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.96 + 0.03 * n1, 0.68 + 0.06 * n2, 0.14 + 0.04 * n3)
    )
    img_toppings = generate_procedural_texture(
        os.path.join(d_tex, "caramelized_onion_lettuce_tomato.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.34 + 0.42 * max(0, n1), 0.66 - 0.24 * max(0, n1), 0.18 + 0.08 * n2)
    )

    mat_bun = make_pbr_material("Mat_Signature_Gold_Brioche", img_bun, 0.42)
    mat_patty = make_pbr_material("Mat_Double_Flame_Grilled_Patty", img_patty, 0.46)
    mat_cheddar = make_pbr_material("Mat_Smoked_Aged_Cheddar", img_cheddar, 0.26)
    mat_toppings = make_pbr_material("Mat_Signature_Lettuce_Tomato_Onion", img_toppings, 0.34)

    # 1. Artisan Brioche Heel + High-Dome Sesame Crown
    bpy.ops.mesh.primitive_cylinder_add(vertices=56, radius=0.94, depth=0.30, location=(0, 0, 0.15))
    heel = bpy.context.active_object
    sub_h = heel.modifiers.new("Sub", 'SUBSURF')
    sub_h.levels = 1
    bpy.ops.object.modifier_apply(modifier=sub_h.name)
    heel.data.materials.append(mat_bun)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=56, ring_count=32, radius=0.96, location=(0, 0, 1.18))
    crown = bpy.context.active_object
    for v in crown.data.vertices:
        if v.co.z < 0:
            v.co.z *= 0.20
        else:
            v.co.z *= 0.64
    crown.data.materials.append(mat_bun)
    bpy.ops.object.select_all(action='DESELECT')
    heel.select_set(True)
    crown.select_set(True)
    bpy.context.view_layer.objects.active = heel
    bpy.ops.object.join()
    heel.name = "Mesh_Signature_Brioche_Buns"

    # 2. Double Flame-Grilled Patties
    pt_objs = []
    for pz in (0.44, 0.78):
        bpy.ops.mesh.primitive_cylinder_add(vertices=56, radius=0.96, depth=0.24, location=(0, 0, pz))
        p = bpy.context.active_object
        sub_p = p.modifiers.new("Sub", 'SUBSURF')
        sub_p.levels = 1
        bpy.ops.object.modifier_apply(modifier=sub_p.name)
        for v in p.data.vertices:
            n = noise.noise(Vector((v.co.x * 8.0, v.co.y * 8.0, v.co.z * 8.0)))
            v.co.x *= (1.0 + 0.05 * n)
            v.co.y *= (1.0 + 0.05 * n)
        p.data.materials.append(mat_patty)
        pt_objs.append(p)
    bpy.ops.object.select_all(action='DESELECT')
    for o in pt_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = pt_objs[0]
    bpy.ops.object.join()
    pt_objs[0].name = "Mesh_Double_Angus_Patties"

    # 3. Double Smoked Cheddar Cheese Melts
    ch_objs = []
    for idx_c, cz in enumerate((0.58, 0.92)):
        bpy.ops.mesh.primitive_cube_add(size=1.45, location=(0, 0, cz))
        c = bpy.context.active_object
        c.scale = (1.0, 1.0, 0.035)
        sub_c = c.modifiers.new("Sub", 'SUBSURF')
        sub_c.levels = 2
        bpy.ops.object.modifier_apply(modifier=sub_c.name)
        for v in c.data.vertices:
            r = math.hypot(v.co.x, v.co.y)
            if r > 0.72:
                v.co.z -= 0.14 * (r - 0.72)
        c.rotation_euler = (0, 0, idx_c * 0.78)
        c.data.materials.append(mat_cheddar)
        ch_objs.append(c)
    bpy.ops.object.select_all(action='DESELECT')
    for o in ch_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = ch_objs[0]
    bpy.ops.object.join()
    ch_objs[0].name = "Mesh_Double_Smoked_Cheddar"

    # 4. Crisp Ruffled Lettuce, Vine Tomato & Caramelized Onion Rings
    tp_objs = []
    for i in range(12):
        ang = (i / 12.0) * math.pi * 2.0
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.34, minor_radius=0.048, major_segments=24, minor_segments=10,
            location=(0.48 * math.cos(ang), 0.48 * math.sin(ang), 1.02)
        )
        t = bpy.context.active_object
        t.rotation_euler = (0.2 * math.sin(ang), 0.2 * math.cos(ang), ang)
        t.data.materials.append(mat_toppings)
        tp_objs.append(t)
    bpy.ops.object.select_all(action='DESELECT')
    for o in tp_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = tp_objs[0]
    bpy.ops.object.join()
    tp_objs[0].name = "Mesh_Signature_Lettuce_Tomato_Onion"

    finalize_and_export(slug, "golden_oak_signature_burger.blend", 2.0, 0.125, 0.105)


print("================================================================")
print("PHASE 7.2 BLENDER 5.2 SEVEN DEDICATED DISH RECONSTRUCTIONS")
print("================================================================")
build_peri_peri_fiesta_pizza()
build_paneer_royale_burger()
build_hakka_street_chow_mein()
build_golden_chilli_potato()
build_keema_masala_pizza()
build_farmhouse_supreme_pizza()
build_truffle_mushroom_cheese_burger()
build_golden_oak_signature_burger()
print("================================================================")
print("ALL 8 DEDICATED BLENDER 5.2 MODELS & USDZ ARCHIVES CREATED")
print("================================================================")
