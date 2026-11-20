import bpy
import bmesh
import os
import math
import random
from mathutils import Vector, noise

ROOT_DIR = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak"
BLEND_OUT_DIR = os.path.join(ROOT_DIR, "models", "blender-sources")
RAW_GLB_DIR = os.path.join(ROOT_DIR, "scratch", "phase7-1-raw")
TEX_DIR = os.path.join(ROOT_DIR, "scratch", "phase7-1-textures")
OPT_DIR = os.path.join(ROOT_DIR, "public", "models", "optimized")

for d in (BLEND_OUT_DIR, RAW_GLB_DIR, TEX_DIR, OPT_DIR):
    os.makedirs(d, exist_ok=True)


def generate_procedural_texture(filepath, width, height, palette_fn):
    """Generates a deterministic culinary surface texture and saves as JPEG."""
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


def make_pbr_material(name, tex_img, roughness, base_tint=(1.0, 1.0, 1.0)):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
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
    else:
        bsdf.inputs['Base Color'].default_value = (base_tint[0], base_tint[1], base_tint[2], 1.0)
    return mat


def add_spherical_uvs(obj):
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
            u = (v.co.x - min_x) / dx
            w = (v.co.y - min_y) / dy
            uv_layer[loop_idx].uv = (u, w)


def finalize_and_export(slug, blend_name, target_studio_span, target_physical_m, target_height_m=None):
    meshes = [o for o in list(bpy.data.objects) if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    for o in meshes:
        add_spherical_uvs(o)
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
    if target_height_m is not None:
        desired_studio_h = target_studio_span * (target_height_m / target_physical_m)
        studio_scale_z = desired_studio_h / cur_h
    else:
        studio_scale_z = studio_scale_xy

    for o in meshes:
        for v in o.data.vertices:
            v.co.x = (v.co.x - cx) * studio_scale_xy
            v.co.y = (v.co.y - cy) * studio_scale_xy
            v.co.z = (v.co.z - min_z) * studio_scale_z
        o.data.update()

    # Save native Blender 5.2 .blend source file
    blend_path = os.path.join(BLEND_OUT_DIR, blend_name)
    bpy.ops.wm.save_as_mainfile(filepath=blend_path, compress=True)

    # Export studio-normalized uncompressed raw High GLB (100% geometry, Q90 JPEG)
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

    # Export Balanced raw GLB (55% decimated via Blender DECIMATE modifier, Q78 JPEG)
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

    # Export Ultra-Light raw GLB (28% decimated via Blender DECIMATE modifier, Q62 JPEG)
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

    # Apply 50% decimation for lightweight mobile iOS Quick Look USDZ and scale to 1:1 physical metres
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
    print(f"[BLENDER 5.2 BUILT] {slug:28s} | high_tris: {high_tris:6d} | usdz_tris: {usdz_tris:6d} | blend: {blend_name} | usdz: {os.path.getsize(usdz_path)/1024:.1f} KB")


# ============================================================================
# DISH 1: TRUFFLE MUSHROOM RISOTTO (19.0 x 19.0 x 7.0 cm)
# ============================================================================
def build_truffle_mushroom_risotto():
    slug = "truffle-mushroom-risotto"
    bpy.ops.wm.read_factory_settings(use_empty=True)
    random.seed(101)
    d_tex = os.path.join(TEX_DIR, slug)
    os.makedirs(d_tex, exist_ok=True)

    img_porcelain = generate_procedural_texture(
        os.path.join(d_tex, "risotto_porcelain_bowl.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.94 + 0.02 * n1, 0.92 + 0.02 * n1, 0.88 + 0.02 * n2)
    )
    img_risotto = generate_procedural_texture(
        os.path.join(d_tex, "arborio_risotto_cream.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.88 + 0.06 * n2 - 0.08 * max(0, n3), 0.79 + 0.05 * n2 - 0.08 * max(0, n3), 0.62 + 0.04 * n1)
    )
    img_mushroom = generate_procedural_texture(
        os.path.join(d_tex, "roasted_cremini_mushroom.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.42 + 0.14 * n1 + 0.05 * n2, 0.28 + 0.10 * n1, 0.17 + 0.06 * n2)
    )
    img_truffle = generate_procedural_texture(
        os.path.join(d_tex, "black_perigord_truffle.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.14 + 0.12 * abs(n3), 0.11 + 0.10 * abs(n3), 0.09 + 0.08 * abs(n3))
    )

    mat_bowl = make_pbr_material("Mat_Risotto_Porcelain_Bowl", img_porcelain, 0.22)
    mat_rice = make_pbr_material("Mat_Arborio_Risotto_Cream", img_risotto, 0.24)
    mat_mush = make_pbr_material("Mat_Roasted_Cremini_Chanterelle", img_mushroom, 0.36)
    mat_truf = make_pbr_material("Mat_Black_Truffle_Shavings", img_truffle, 0.42)

    # 1. Wide-rimmed Italian risotto pasta bowl
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=1.1, depth=0.32, location=(0, 0, 0.16))
    bowl = bpy.context.active_object
    bowl.name = "Mesh_Risotto_Porcelain_Bowl"
    sub = bowl.modifiers.new("Sub", 'SUBSURF')
    sub.levels = 2
    bpy.ops.object.modifier_apply(modifier=sub.name)
    for v in bowl.data.vertices:
        r = math.hypot(v.co.x, v.co.y)
        if v.co.z > 0.18 and r < 0.78:
            v.co.z -= 0.16 * (1.0 - (r / 0.78) ** 2)
    bowl.data.materials.append(mat_bowl)

    # 2. Creamy Arborio risotto mound with grain micro-relief
    bpy.ops.mesh.primitive_uv_sphere_add(segments=72, ring_count=48, radius=0.76, location=(0, 0, 0.20))
    mound = bpy.context.active_object
    mound.name = "Mesh_Arborio_Risotto_Mound"
    for v in mound.data.vertices:
        v.co.z *= 0.28
        if v.co.z < 0:
            v.co.z *= 0.2
        n = noise.noise(Vector((v.co.x * 5.5, v.co.y * 5.5, v.co.z * 5.5)))
        n_grain = noise.noise(Vector((v.co.x * 22.0, v.co.y * 22.0, 1.2)))
        v.co.z += 0.025 * n + 0.008 * n_grain
    mound.data.materials.append(mat_rice)

    # 3. 14 Roasted Cremini & Chanterelle mushroom slices
    mush_objs = []
    for i in range(14):
        ang = (i / 14.0) * math.pi * 2.0 + random.uniform(-0.15, 0.15)
        dist = 0.15 + (i % 3) * 0.18 + random.uniform(-0.04, 0.04)
        mx = math.cos(ang) * dist
        my = math.sin(ang) * dist
        mz = 0.36 + 0.04 * (1.0 - dist)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=28, ring_count=16, radius=0.11, location=(mx, my, mz))
        m = bpy.context.active_object
        m.scale = (1.1, 0.75, 0.22)
        m.rotation_euler = (random.uniform(-0.35, 0.35), random.uniform(-0.35, 0.35), ang)
        m.data.materials.append(mat_mush)
        mush_objs.append(m)
    bpy.ops.object.select_all(action='DESELECT')
    for o in mush_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = mush_objs[0]
    bpy.ops.object.join()
    mush_objs[0].name = "Mesh_Roasted_Cremini_Slices"

    # 4. 10 Wavy Shaved Black Périgord Truffle Slices
    truf_objs = []
    for i in range(10):
        ang = (i / 10.0) * math.pi * 2.0 + 0.3
        dist = 0.08 + (i % 2) * 0.22
        tx = math.cos(ang) * dist
        ty = math.sin(ang) * dist
        tz = 0.40 + 0.02 * (i % 3)
        bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.085, depth=0.012, location=(tx, ty, tz))
        t = bpy.context.active_object
        for v in t.data.vertices:
            v.co.z += 0.008 * math.sin(v.co.x * 28.0) * math.cos(v.co.y * 28.0)
        t.rotation_euler = (random.uniform(0.1, 0.5), random.uniform(-0.4, 0.4), ang)
        t.data.materials.append(mat_truf)
        truf_objs.append(t)
    bpy.ops.object.select_all(action='DESELECT')
    for o in truf_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = truf_objs[0]
    bpy.ops.object.join()
    truf_objs[0].name = "Mesh_Shaved_Black_Truffle"

    finalize_and_export(slug, "truffle_mushroom_risotto.blend", 2.0, 0.19, 0.07)


# ============================================================================
# DISH 2: BUTTER CHICKEN BAO (18.0 x 18.0 x 7.0 cm)
# ============================================================================
def build_butter_chicken_bao():
    slug = "butter-chicken-bao"
    bpy.ops.wm.read_factory_settings(use_empty=True)
    random.seed(202)
    d_tex = os.path.join(TEX_DIR, slug)
    os.makedirs(d_tex, exist_ok=True)

    img_slate = generate_procedural_texture(
        os.path.join(d_tex, "charcoal_slate_platter.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.16 + 0.03 * n1, 0.16 + 0.03 * n1, 0.18 + 0.03 * n2)
    )
    img_bao = generate_procedural_texture(
        os.path.join(d_tex, "steamed_lotus_bao_dough.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.95 + 0.02 * n2, 0.91 + 0.02 * n1, 0.83 + 0.02 * n3)
    )
    img_makhani = generate_procedural_texture(
        os.path.join(d_tex, "makhani_butter_chicken_glaze.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.78 + 0.10 * n1, 0.28 + 0.08 * n2, 0.09 + 0.04 * n3)
    )
    img_slaw = generate_procedural_texture(
        os.path.join(d_tex, "pickled_onion_coriander_garnish.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.68 + 0.15 * n1, 0.18 + 0.25 * max(0, n2), 0.42 + 0.10 * n3)
    )

    mat_slate = make_pbr_material("Mat_Charcoal_Slate_Platter", img_slate, 0.62)
    mat_bao = make_pbr_material("Mat_Steamed_Lotus_Bao_Bun", img_bao, 0.68)
    mat_chicken = make_pbr_material("Mat_Makhani_Pulled_Chicken", img_makhani, 0.20)
    mat_garnish = make_pbr_material("Mat_Pickled_Slaw_And_Coriander", img_slaw, 0.34)

    # 1. Slate serving platter
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=1.05, depth=0.09, location=(0, 0, 0.045))
    platter = bpy.context.active_object
    platter.name = "Mesh_Charcoal_Slate_Platter"
    sub = platter.modifiers.new("Sub", 'SUBSURF')
    sub.levels = 2
    bpy.ops.object.modifier_apply(modifier=sub.name)
    platter.data.materials.append(mat_slate)

    # 2. Pair of folded C-shaped steamed gua bao buns
    bao_objs = []
    for side in (-0.38, 0.38):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=56, ring_count=36, radius=0.44, location=(side, 0, 0.28))
        b = bpy.context.active_object
        for v in b.data.vertices:
            v.co.x *= 0.72
            v.co.y *= 1.12
            v.co.z *= 0.68
            # Create open lotus pocket notch on top/front
            if v.co.z > 0.05 and v.co.y > -0.1:
                v.co.x *= 1.15
        b.rotation_euler = (0.15, 0.22 * (-1 if side < 0 else 1), 0.25 * (-1 if side < 0 else 1))
        b.data.materials.append(mat_bao)
        bao_objs.append(b)
    bpy.ops.object.select_all(action='DESELECT')
    for o in bao_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = bao_objs[0]
    bpy.ops.object.join()
    bao_objs[0].name = "Mesh_Steamed_Gua_Bao_Buns"

    # 3. Pulled butter chicken chunks nestled inside both bao buns
    chk_objs = []
    for side in (-0.38, 0.38):
        for k in range(10):
            cy = -0.22 + (k / 9.0) * 0.44
            cx = side + random.uniform(-0.08, 0.08)
            cz = 0.28 + random.uniform(-0.03, 0.07)
            bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.11, location=(cx, cy, cz))
            c = bpy.context.active_object
            for v in c.data.vertices:
                n = noise.noise(Vector((v.co.x * 12.0, v.co.y * 12.0, v.co.z * 12.0)))
                v.co *= (1.0 + 0.22 * n)
            c.data.materials.append(mat_chicken)
            chk_objs.append(c)
    bpy.ops.object.select_all(action='DESELECT')
    for o in chk_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = chk_objs[0]
    bpy.ops.object.join()
    chk_objs[0].name = "Mesh_Pulled_Butter_Chicken_Filling"

    # 4. Pickled red onion ribbons & herb crown
    gar_objs = []
    for side in (-0.38, 0.38):
        for k in range(8):
            ang = (k / 8.0) * math.pi * 2.0
            bpy.ops.mesh.primitive_torus_add(
                major_radius=0.08, minor_radius=0.015, major_segments=24, minor_segments=10,
                location=(side + 0.04 * math.cos(ang), -0.18 + k * 0.05, 0.39)
            )
            g = bpy.context.active_object
            g.rotation_euler = (random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5), ang)
            g.data.materials.append(mat_garnish)
            gar_objs.append(g)
    bpy.ops.object.select_all(action='DESELECT')
    for o in gar_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = gar_objs[0]
    bpy.ops.object.join()
    gar_objs[0].name = "Mesh_Pickled_Slaw_Garnish"

    finalize_and_export(slug, "butter_chicken_bao.blend", 2.0, 0.18, 0.07)


# ============================================================================
# DISH 3: DAHI KE KEBAB (22.0 x 16.0 x 4.5 cm)
# ============================================================================
def build_dahi_ke_kebab():
    slug = "dahi-ke-kebab"
    bpy.ops.wm.read_factory_settings(use_empty=True)
    random.seed(303)
    d_tex = os.path.join(TEX_DIR, slug)
    os.makedirs(d_tex, exist_ok=True)

    img_platter = generate_procedural_texture(
        os.path.join(d_tex, "ceramic_tasting_platter.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.20 + 0.03 * n1, 0.19 + 0.03 * n1, 0.17 + 0.02 * n2)
    )
    img_kebab = generate_procedural_texture(
        os.path.join(d_tex, "seared_golden_dahi_kebab.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.82 - 0.18 * max(0, n2), 0.56 - 0.15 * max(0, n2), 0.24 + 0.05 * n3)
    )
    img_chutney = generate_procedural_texture(
        os.path.join(d_tex, "pudina_mint_yogurt_chutney.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.24 + 0.06 * n1, 0.66 + 0.08 * n2, 0.34 + 0.05 * n3)
    )

    mat_platter = make_pbr_material("Mat_Oval_Ceramic_Platter", img_platter, 0.30)
    mat_kebab = make_pbr_material("Mat_Pan_Seared_Dahi_Kebab", img_kebab, 0.54)
    mat_chutney = make_pbr_material("Mat_Mint_Yogurt_Chutney", img_chutney, 0.20)

    # 1. Oval ceramic tasting platter (22 x 16 cm aspect ratio)
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=1.1, depth=0.08, location=(0, 0, 0.04))
    platter = bpy.context.active_object
    platter.name = "Mesh_Oval_Tasting_Platter"
    platter.scale = (1.0, 0.727, 1.0)
    sub = platter.modifiers.new("Sub", 'SUBSURF')
    sub.levels = 2
    bpy.ops.object.modifier_apply(modifier=sub.name)
    platter.data.materials.append(mat_platter)

    # 2. 6 Pan-seared hung-curd Dahi Ke Kebab medallions arranged in shingle arc
    keb_objs = []
    for i in range(6):
        t = (i / 5.0) - 0.5
        kx = t * 1.15 - 0.15
        ky = 0.16 * math.sin(t * math.pi)
        kz = 0.15 + i * 0.012
        bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.22, depth=0.11, location=(kx, ky, kz))
        k = bpy.context.active_object
        sub_k = k.modifiers.new("Sub", 'SUBSURF')
        sub_k.levels = 1
        bpy.ops.object.modifier_apply(modifier=sub_k.name)
        for v in k.data.vertices:
            n = noise.noise(Vector((v.co.x * 10.0, v.co.y * 10.0, v.co.z * 10.0)))
            v.co *= (1.0 + 0.06 * n)
        k.rotation_euler = (0.08, -0.18, t * 0.4)
        k.data.materials.append(mat_kebab)
        keb_objs.append(k)
    bpy.ops.object.select_all(action='DESELECT')
    for o in keb_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = keb_objs[0]
    bpy.ops.object.join()
    keb_objs[0].name = "Mesh_Dahi_Ke_Kebab_Medallions"

    # 3. Mint chutney dipping ramekin bowl
    bpy.ops.mesh.primitive_cylinder_add(vertices=36, radius=0.22, depth=0.14, location=(0.68, 0.05, 0.14))
    ram = bpy.context.active_object
    ram.name = "Mesh_Mint_Chutney_Dip"
    ram.data.materials.append(mat_chutney)

    finalize_and_export(slug, "dahi_ke_kebab.blend", 2.2, 0.22, 0.045)


# ============================================================================
# DISH 4: CRISPY CHILLI BABYCORN (20.0 x 20.0 x 5.5 cm)
# ============================================================================
def build_crispy_chilli_babycorn():
    slug = "crispy-chilli-babycorn"
    bpy.ops.wm.read_factory_settings(use_empty=True)
    random.seed(404)
    d_tex = os.path.join(TEX_DIR, slug)
    os.makedirs(d_tex, exist_ok=True)

    img_dish = generate_procedural_texture(
        os.path.join(d_tex, "wok_ceramic_shallow_bowl.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.18 + 0.02 * n1, 0.21 + 0.02 * n1, 0.20 + 0.02 * n2)
    )
    img_corn = generate_procedural_texture(
        os.path.join(d_tex, "schezwan_glazed_crispy_babycorn.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.80 + 0.10 * n1, 0.30 + 0.12 * n2, 0.08 + 0.04 * n3)
    )
    img_peppers = generate_procedural_texture(
        os.path.join(d_tex, "wok_tossed_capsicum_scallions.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.25 + 0.45 * max(0, n1), 0.62 - 0.25 * max(0, n1), 0.16 + 0.05 * n2)
    )

    mat_dish = make_pbr_material("Mat_Wok_Ceramic_Dish", img_dish, 0.35)
    mat_corn = make_pbr_material("Mat_Crispy_Chilli_Babycorn", img_corn, 0.24)
    mat_pep = make_pbr_material("Mat_Wok_Capsicum_And_Scallion", img_pep_img := img_peppers, 0.28)

    # 1. Shallow ceramic wok dish
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=1.05, depth=0.16, location=(0, 0, 0.08))
    dish = bpy.context.active_object
    dish.name = "Mesh_Wok_Shallow_Dish"
    sub = dish.modifiers.new("Sub", 'SUBSURF')
    sub.levels = 2
    bpy.ops.object.modifier_apply(modifier=sub.name)
    dish.data.materials.append(mat_dish)

    # 2. 18 Ridged Tempura-battered Crispy Chilli Babycorn Spears
    corn_objs = []
    for i in range(18):
        ang = (i / 18.0) * math.pi * 2.0 + random.uniform(-0.2, 0.2)
        dist = 0.12 + (i % 3) * 0.22
        cx = math.cos(ang) * dist
        cy = math.sin(ang) * dist
        cz = 0.18 + (i % 4) * 0.045
        bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=0.095, radius2=0.055, depth=0.46, location=(cx, cy, cz))
        c = bpy.context.active_object
        sub_c = c.modifiers.new("Sub", 'SUBSURF')
        sub_c.levels = 1
        bpy.ops.object.modifier_apply(modifier=sub_c.name)
        for v in c.data.vertices:
            ring = math.sin(v.co.z * 55.0)
            n = noise.noise(Vector((v.co.x * 16.0, v.co.y * 16.0, v.co.z * 16.0)))
            v.co.x *= (1.0 + 0.08 * ring + 0.10 * n)
            v.co.y *= (1.0 + 0.08 * ring + 0.10 * n)
        c.rotation_euler = (1.15 + random.uniform(-0.25, 0.25), random.uniform(-0.3, 0.3), ang + 0.7)
        c.data.materials.append(mat_corn)
        corn_objs.append(c)
    bpy.ops.object.select_all(action='DESELECT')
    for o in corn_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = corn_objs[0]
    bpy.ops.object.join()
    corn_objs[0].name = "Mesh_Crispy_Chilli_Babycorn_Spears"

    # 3. Wok-tossed bell pepper petals & spring onion rings
    pep_objs = []
    for i in range(14):
        ang = (i / 14.0) * math.pi * 2.0
        dist = 0.18 + (i % 2) * 0.28
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=18, ring_count=12, radius=0.085,
            location=(math.cos(ang) * dist, math.sin(ang) * dist, 0.24 + (i % 3) * 0.04)
        )
        p = bpy.context.active_object
        p.scale = (1.2, 0.8, 0.28)
        p.rotation_euler = (random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5), ang)
        p.data.materials.append(mat_pep)
        pep_objs.append(p)
    bpy.ops.object.select_all(action='DESELECT')
    for o in pep_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = pep_objs[0]
    bpy.ops.object.join()
    pep_objs[0].name = "Mesh_Wok_Bell_Peppers_And_Scallions"

    finalize_and_export(slug, "crispy_chilli_babycorn.blend", 2.0, 0.20, 0.055)


# ============================================================================
# DISH 5: DIM SUM PLATTER (22.0 x 22.0 x 6.5 cm)
# ============================================================================
def build_dim_sum_platter():
    slug = "dim-sum-platter"
    bpy.ops.wm.read_factory_settings(use_empty=True)
    random.seed(505)
    d_tex = os.path.join(TEX_DIR, slug)
    os.makedirs(d_tex, exist_ok=True)

    img_bamboo = generate_procedural_texture(
        os.path.join(d_tex, "woven_bamboo_steamer.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.76 + 0.08 * math.sin(v * 80.0) + 0.04 * n1, 0.58 + 0.06 * math.sin(v * 80.0), 0.34 + 0.04 * n2)
    )
    img_hargow = generate_procedural_texture(
        os.path.join(d_tex, "translucent_crystal_har_gow.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.94 + 0.03 * n1, 0.89 + 0.03 * n2, 0.86 + 0.02 * n3)
    )
    img_siumai = generate_procedural_texture(
        os.path.join(d_tex, "golden_wonton_siu_mai.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.92 + 0.04 * n1, 0.72 + 0.06 * n2, 0.28 + 0.05 * n3)
    )
    img_chili = generate_procedural_texture(
        os.path.join(d_tex, "crimson_chili_crisp_dip.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.68 + 0.12 * n2, 0.11 + 0.04 * n1, 0.05 + 0.02 * n3)
    )

    mat_bamboo = make_pbr_material("Mat_Woven_Bamboo_Steamer", img_bamboo, 0.68)
    mat_hargow = make_pbr_material("Mat_Pleated_Crystal_Har_Gow", img_hargow, 0.25)
    mat_siumai = make_pbr_material("Mat_Golden_Siu_Mai_Dumpling", img_siumai, 0.38)
    mat_chili = make_pbr_material("Mat_Chili_Crisp_Dipping_Sauce", img_chili, 0.14)

    # 1. Bamboo steamer basket with recessed floor and twin rim rings
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=1.1, depth=0.34, location=(0, 0, 0.17))
    basket = bpy.context.active_object
    basket.name = "Mesh_Bamboo_Steamer_Basket"
    sub = basket.modifiers.new("Sub", 'SUBSURF')
    sub.levels = 2
    bpy.ops.object.modifier_apply(modifier=sub.name)
    for v in basket.data.vertices:
        r = math.hypot(v.co.x, v.co.y)
        if v.co.z > 0.14 and r < 0.96:
            v.co.z = 0.14
    basket.data.materials.append(mat_bamboo)

    # 2. 4 Crescent pleated Har Gow crystal dumplings
    hg_objs = []
    for i in range(4):
        ang = (i / 4.0) * math.pi * 2.0 + 0.35
        hx = math.cos(ang) * 0.56
        hy = math.sin(ang) * 0.56
        bpy.ops.mesh.primitive_uv_sphere_add(segments=36, ring_count=24, radius=0.23, location=(hx, hy, 0.24))
        hg = bpy.context.active_object
        for v in hg.data.vertices:
            v.co.y *= 0.68
            v.co.z *= 0.76
            # Crescent curve + 12 top pleats
            v.co.y += 0.18 * (v.co.x ** 2)
            if v.co.z > 0.04:
                v.co.y += 0.018 * math.sin(v.co.x * 48.0)
        hg.rotation_euler = (0, 0, ang + 1.57)
        hg.data.materials.append(mat_hargow)
        hg_objs.append(hg)
    bpy.ops.object.select_all(action='DESELECT')
    for o in hg_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = hg_objs[0]
    bpy.ops.object.join()
    hg_objs[0].name = "Mesh_Pleated_Crystal_Har_Gow"

    # 3. 3 Fluted open-top Siu Mai dumplings
    sm_objs = []
    for i in range(3):
        ang = (i / 3.0) * math.pi * 2.0
        sx = math.cos(ang) * 0.42
        sy = math.sin(ang) * 0.42
        bpy.ops.mesh.primitive_cylinder_add(vertices=36, radius=0.18, depth=0.24, location=(sx, sy, 0.25))
        sm = bpy.context.active_object
        for v in sm.data.vertices:
            theta = math.atan2(v.co.y, v.co.x)
            flute = 1.0 + 0.07 * math.sin(theta * 10.0)
            waist = 0.88 + 0.15 * abs(v.co.z / 0.12)
            v.co.x *= flute * waist
            v.co.y *= flute * waist
        sm.data.materials.append(mat_siumai)
        sm_objs.append(sm)
    bpy.ops.object.select_all(action='DESELECT')
    for o in sm_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = sm_objs[0]
    bpy.ops.object.join()
    sm_objs[0].name = "Mesh_Fluted_Golden_Siu_Mai"

    # 4. Center chili crisp dipping saucer
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.18, depth=0.12, location=(0, 0, 0.20))
    dip = bpy.context.active_object
    dip.name = "Mesh_Chili_Crisp_Dipping_Saucer"
    dip.data.materials.append(mat_chili)

    finalize_and_export(slug, "dim_sum_platter.blend", 2.2, 0.22, 0.065)


# ============================================================================
# DISH 6: KAFFIR LIME MOCKTAIL (8.5 x 8.5 x 16.5 cm)
# ============================================================================
def build_kaffir_lime_mocktail():
    slug = "kaffir-lime-mocktail"
    bpy.ops.wm.read_factory_settings(use_empty=True)
    random.seed(606)
    d_tex = os.path.join(TEX_DIR, slug)
    os.makedirs(d_tex, exist_ok=True)

    img_glass = generate_procedural_texture(
        os.path.join(d_tex, "crystal_highball_glass.jpg"), 256, 256,
        lambda u, v, n1, n2, n3: (0.88 + 0.04 * v, 0.95 + 0.03 * v, 0.93 + 0.03 * n1)
    )
    img_liquid = generate_procedural_texture(
        os.path.join(d_tex, "emerald_kaffir_lime_cooler.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.22 + 0.14 * v + 0.04 * n2, 0.78 + 0.10 * v + 0.05 * n1, 0.42 + 0.08 * v)
    )
    img_lime = generate_procedural_texture(
        os.path.join(d_tex, "kaffir_lime_wheel_and_mint.jpg"), 512, 512,
        lambda u, v, n1, n2, n3: (0.18 + 0.12 * n1, 0.58 + 0.14 * n2, 0.16 + 0.06 * n3)
    )

    mat_glass = make_pbr_material("Mat_Crystal_Highball_Glass", img_glass, 0.08)
    mat_liquid = make_pbr_material("Mat_Emerald_Kaffir_Cooler", img_liquid, 0.12)
    mat_lime = make_pbr_material("Mat_Kaffir_Lime_And_Mint_Crown", img_lime, 0.36)

    # 1. Faceted heavy-base crystal highball Collins tumbler
    bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=0.40, radius2=0.45, depth=1.65, location=(0, 0, 0.825))
    glass = bpy.context.active_object
    glass.name = "Mesh_Crystal_Highball_Tumbler"
    sub = glass.modifiers.new("Sub", 'SUBSURF')
    sub.levels = 1
    bpy.ops.object.modifier_apply(modifier=sub.name)
    glass.data.materials.append(mat_glass)

    # 2. Inner emerald kaffir lime cooler column + suspended ice cubes
    bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=0.36, radius2=0.41, depth=1.35, location=(0, 0, 0.76))
    liq = bpy.context.active_object
    liq.name = "Mesh_Emerald_Kaffir_Cooler_Liquid"
    liq.data.materials.append(mat_liquid)

    # 3. Kaffir lime wheel on rim, submerged citrus wheels, mint leaf crown & bamboo straw
    gar_objs = []
    # Rim kaffir lime wheel
    bpy.ops.mesh.primitive_cylinder_add(vertices=36, radius=0.22, depth=0.04, location=(0.38, 0.0, 1.62))
    wheel = bpy.context.active_object
    wheel.rotation_euler = (0.3, 1.2, 0.0)
    wheel.data.materials.append(mat_lime)
    gar_objs.append(wheel)

    # Mint leaf cluster
    for i in range(6):
        ang = (i / 6.0) * math.pi * 2.0
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=20, ring_count=12, radius=0.12,
            location=(-0.12 + 0.10 * math.cos(ang), 0.10 * math.sin(ang), 1.52 + 0.03 * (i % 2))
        )
        leaf = bpy.context.active_object
        leaf.scale = (1.3, 0.65, 0.18)
        leaf.rotation_euler = (0.35, -0.25, ang)
        leaf.data.materials.append(mat_lime)
        gar_objs.append(leaf)

    # Bamboo cocktail straw
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.028, depth=1.75, location=(-0.14, -0.10, 1.05))
    straw = bpy.context.active_object
    straw.rotation_euler = (0.12, -0.16, 0.0)
    straw.data.materials.append(mat_lime)
    gar_objs.append(straw)

    bpy.ops.object.select_all(action='DESELECT')
    for o in gar_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = gar_objs[0]
    bpy.ops.object.join()
    gar_objs[0].name = "Mesh_Kaffir_Lime_Wheel_Mint_And_Straw"

    finalize_and_export(slug, "kaffir_lime_mocktail.blend", 0.85, 0.085, 0.165)


print("================================================================")
print("PHASE 7.1 BLENDER 5.2 SIX DEDICATED FOOD MODELS BUILDER")
print("================================================================")
build_truffle_mushroom_risotto()
build_butter_chicken_bao()
build_dahi_ke_kebab()
build_crispy_chilli_babycorn()
build_dim_sum_platter()
build_kaffir_lime_mocktail()
print("================================================================")
print("ALL 6 DEDICATED BLENDER 5.2 MODELS & USDZ ARCHIVES CREATED")
print("================================================================")
