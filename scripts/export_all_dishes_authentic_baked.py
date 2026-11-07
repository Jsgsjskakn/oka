import bpy
import bmesh
import os
import shutil
import math
from mathutils import Vector, Matrix

SOURCE_DIR = r"C:\Users\Pyiush Gupta\Downloads\.blends\BLENDER 3\3d models"
PUBLIC_MODELS_DIR = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak\public\models"
OPTIMIZED_DIR = os.path.join(PUBLIC_MODELS_DIR, "optimized")

os.makedirs(PUBLIC_MODELS_DIR, exist_ok=True)
os.makedirs(OPTIMIZED_DIR, exist_ok=True)

DISH_JOBS = [
    {
        "blend": "paneer_pizza.blend",
        "slugs": ["tandoori-paneer-pizza"],
        "exclude": ["Shadow_Catcher_Ground", "Cube", "Plane"],
        "target_size": 2.4,
        "mode": "paneer_pizza_hybrid",
    },
    {
        "blend": "chicken_pizza.blend",
        "slugs": ["chicken-tikka-pizza"],
        "exclude": ["Rustic_Wood_Table", "Cube", "Plane", "Shadow_Catcher_Ground"],
        "target_size": 2.4,
        "mode": "chicken_pizza_trim",
    },
    {
        "blend": "truffle_mushroom_pizza.blend",
        "slugs": ["mushroom-truffle-pizza"],
        "exclude": ["Cube", "Plane", "Shadow_Catcher_Ground", "Rustic_Wood_Table"],
        "target_size": 2.4,
        "mode": "truffle_pizza_direct",
    },
    {
        "blend": "bbq_chicken_overload_pizza.blend",
        "slugs": ["bbq-chicken-overload"],
        "exclude": ["Cube", "Plane", "Shadow_Catcher_Ground"],
        "target_size": 2.4,
        "mode": "bake_all",
    },
    {
        "blend": "chiken_burger.blend",
        "slugs": ["classic-smash-burger", "golden-oak-burger", "golden-oak-signature-burger"],
        "exclude": ["Cube", "Plane", "Shadow_Catcher_Ground", "Serving_Slate_Plate"],
        "target_size": 2.0,
        "mode": "chicken_burger_direct",
    },
    {
        "blend": "paneer_burger.blend",
        "slugs": ["crispy-paneer-burger"],
        "exclude": ["Serving_Slate_Plate", "Cube", "Plane", "Shadow_Catcher_Ground"],
        "target_size": 2.0,
        "mode": "paneer_burger_hybrid",
    },
    {
        "blend": "chowmein_noodles.blend",
        "slugs": ["wok-tossed-chow-mein"],
        "exclude": ["Table_Plane", "Cube", "Plane", "Shadow_Catcher_Ground"],
        "target_size": 2.2,
        "mode": "chowmein_hybrid",
    },
    {
        "blend": "_potatoes bolls .blend",
        "slugs": ["dynamite-chilli-potatoes"],
        "exclude": ["Studio_Backdrop_Floor_v60", "Studio_Slate_Table_v60", "Table_Plane", "Cube", "Plane"],
        "target_size": 2.2,
        "mode": "potatoes_bake",
    },
]

ROUGHNESS_DEFAULTS = {
    "Mat_Molten_Mozzarella_Cheese_Bed": 0.28,
    "Mat_Neapolitan_Cornicione_Crust": 0.72,
    "Mat_Tandoori_Paneer_Tikka": 0.45,
    "Mat_Roasted_Cherry_Tomato": 0.22,
    "Mat_Roasted_Green_Pepper": 0.30,
    "Mat_Roasted_Red_Pepper": 0.30,
    "Mat_Red_Onion_Slivers": 0.35,
    "Mat_Crust_V26": 0.72,
    "Mat_Cheese_V26": 0.28,
    "Mat_BBQ_V26": 0.12,
    "Mat_Chicken_V26": 0.40,
    "Mat_Bacon_V26": 0.32,
    "Mat_Onion_V26": 0.35,
    "Mat_Jalapeno_Skin_V26": 0.28,
    "Mat_Jalapeno_Flesh_V26": 0.38,
    "M_Crispy_Braised_Potato_v60.001": 0.24,
    "M_Dolsot_Stone_Pot_v60.001": 0.65,
    "M_Scallion_Garnish_v60.001": 0.40,
    "Mat_MasterChowMein": 0.22,
    "Mat_ArtisanalBowl": 0.55,
    "Mat_Slaw_TwoTone_V33": 0.38,
}


def setup_cycles_gpu():
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type = 'OPTIX'
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        scene.cycles.device = 'GPU'
    except Exception as e:
        print("  [WARN] GPU setup fallback:", e)
    scene.cycles.samples = 1
    scene.cycles.bake_type = 'EMIT'
    scene.render.bake.use_pass_direct = False
    scene.render.bake.use_pass_indirect = False
    scene.render.bake.use_pass_color = True
    scene.render.bake.margin = 8


def filter_and_delete_unwanted(exclude_names):
    view_objs = set(bpy.context.view_layer.objects)
    exclude_exact = {ex.lower() for ex in exclude_names}
    keep_meshes = []
    for obj in list(bpy.data.objects):
        if obj.type != 'MESH':
            continue
        in_view = (obj in view_objs) and (not obj.hide_get()) and (not obj.hide_render)
        oname = obj.name.lower()
        is_excluded = (oname in exclude_exact) or any(
            oname.startswith(ex) for ex in ("studio_backdrop", "studio_slate", "serving_slate", "rustic_wood", "shadow_catcher", "table_plane")
        )
        if in_view and not is_excluded:
            keep_meshes.append(obj)
        else:
            bpy.data.objects.remove(obj, do_unlink=True)
    return keep_meshes


def apply_modifiers_and_store_orig_coords(meshes, decimate_rules=None):
    for obj in list(meshes):
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj

        if obj.data.users > 1:
            obj.data = obj.data.copy()

        # Apply existing modifiers in ORIGINAL Blender space
        for mod in list(obj.modifiers):
            if mod.show_viewport and mod.show_render:
                try:
                    bpy.ops.object.modifier_apply(modifier=mod.name)
                except Exception as e:
                    print(f"  [WARN] modifier_apply {mod.name} on {obj.name}: {e}")
                    obj.modifiers.remove(mod)
            else:
                obj.modifiers.remove(mod)

        # Optional decimation before UV unwrap (e.g. high-poly noodles)
        if decimate_rules:
            for prefix, ratio in decimate_rules.items():
                if prefix.lower() in obj.name.lower():
                    dec = obj.modifiers.new(name="PreBakeDecimate", type='DECIMATE')
                    dec.ratio = ratio
                    bpy.ops.object.modifier_apply(modifier=dec.name)
                    print(f"  [DECIMATE] {obj.name} ratio={ratio} -> {len(obj.data.polygons)} polys")

        # Store local Object & Generated coordinates into vertex attributes BEFORE joining!
        me = obj.data
        if "OrigObjCo" not in me.attributes:
            attr_obj = me.attributes.new(name="OrigObjCo", type='FLOAT_VECTOR', domain='POINT')
        else:
            attr_obj = me.attributes["OrigObjCo"]

        if "OrigGenCo" not in me.attributes:
            attr_gen = me.attributes.new(name="OrigGenCo", type='FLOAT_VECTOR', domain='POINT')
        else:
            attr_gen = me.attributes["OrigGenCo"]

        xs = [v.co.x for v in me.vertices] or [0.0]
        ys = [v.co.y for v in me.vertices] or [0.0]
        zs = [v.co.z for v in me.vertices] or [0.0]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        min_z, max_z = min(zs), max(zs)
        dx = (max_x - min_x) if (max_x > min_x) else 1.0
        dy = (max_y - min_y) if (max_y > min_y) else 1.0
        dz = (max_z - min_z) if (max_z > min_z) else 1.0

        for i, v in enumerate(me.vertices):
            attr_obj.data[i].vector = (v.co.x, v.co.y, v.co.z)
            attr_gen.data[i].vector = (
                (v.co.x - min_x) / dx,
                (v.co.y - min_y) / dy,
                (v.co.z - min_z) / dz,
            )


def patch_material_coord_nodes(mat, orig_uv_name=None):
    if not mat or not mat.node_tree:
        return
    nt = mat.node_tree
    for node in list(nt.nodes):
        if node.type == 'TEX_COORD':
            if node.outputs['Object'].is_linked:
                attr_node = nt.nodes.new('ShaderNodeAttribute')
                attr_node.attribute_name = "OrigObjCo"
                for link in list(node.outputs['Object'].links):
                    nt.links.new(attr_node.outputs['Vector'], link.to_socket)
            if node.outputs['Generated'].is_linked:
                attr_node = nt.nodes.new('ShaderNodeAttribute')
                attr_node.attribute_name = "OrigGenCo"
                for link in list(node.outputs['Generated'].links):
                    nt.links.new(attr_node.outputs['Vector'], link.to_socket)
            if orig_uv_name and node.outputs['UV'].is_linked:
                uv_node = nt.nodes.new('ShaderNodeUVMap')
                uv_node.uv_map = orig_uv_name
                for link in list(node.outputs['UV'].links):
                    nt.links.new(uv_node.outputs['UV'], link.to_socket)


def separate_and_join_meshes_by_material(meshes):
    # First, separate any multi-material meshes by material so every mesh has exactly 1 material
    single_mat_meshes = []
    for obj in list(meshes):
        used_slots = {p.material_index for p in obj.data.polygons}
        if len(obj.material_slots) > 1 and len(used_slots) > 1:
            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.separate(type='MATERIAL')
            bpy.ops.object.mode_set(mode='OBJECT')
            for sep_obj in bpy.context.selected_objects:
                # Keep only the active material on each separated piece
                if len(sep_obj.data.polygons) > 0:
                    mat_idx = sep_obj.data.polygons[0].material_index
                    mat = sep_obj.material_slots[mat_idx].material if mat_idx < len(sep_obj.material_slots) else None
                    sep_obj.data.materials.clear()
                    if mat:
                        sep_obj.data.materials.append(mat)
                    for p in sep_obj.data.polygons:
                        p.material_index = 0
                    single_mat_meshes.append(sep_obj)
        else:
            if len(obj.material_slots) > 1 and len(used_slots) == 1:
                mat_idx = next(iter(used_slots))
                mat = obj.material_slots[mat_idx].material if mat_idx < len(obj.material_slots) else None
                obj.data.materials.clear()
                if mat:
                    obj.data.materials.append(mat)
                for p in obj.data.polygons:
                    p.material_index = 0
            single_mat_meshes.append(obj)

    mat_groups = {}
    for obj in single_mat_meshes:
        if len(obj.material_slots) >= 1 and obj.material_slots[0].material:
            mname = obj.material_slots[0].material.name
            mat_groups.setdefault(mname, []).append(obj)

    joined_objs = []
    for key, group in mat_groups.items():
        if len(group) == 1:
            joined_objs.append(group[0])
        else:
            bpy.ops.object.select_all(action='DESELECT')
            for o in group:
                o.select_set(True)
            bpy.context.view_layer.objects.active = group[0]
            bpy.ops.object.join()
            joined_objs.append(group[0])
            print(f"  [JOIN] {len(group)} objects -> {group[0].name} ({key})")
    return joined_objs


def clean_non_gltf_shader_links(mat):
    if not mat or not mat.node_tree:
        return
    nt = mat.node_tree
    bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not bsdf:
        return

    r_in = bsdf.inputs.get('Roughness')
    if r_in and r_in.is_linked:
        from_node = r_in.links[0].from_node
        if from_node.type != 'TEX_IMAGE':
            for l in list(r_in.links):
                nt.links.remove(l)
            r_in.default_value = ROUGHNESS_DEFAULTS.get(mat.name, 0.38)

    n_in = bsdf.inputs.get('Normal')
    if n_in and n_in.is_linked:
        from_node = n_in.links[0].from_node
        if from_node.type == 'BUMP':
            for l in list(n_in.links):
                nt.links.remove(l)

    if mat.name in ROUGHNESS_DEFAULTS and (not r_in or not r_in.is_linked):
        r_in.default_value = ROUGHNESS_DEFAULTS[mat.name]


def bake_object_material_emit(obj, mat, img_size=1024, reuse_existing_uv=False):
    nt = mat.node_tree
    bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    out_node = next((n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL' and n.is_active_output), None)
    if not out_node:
        out_node = next((n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'), None)
    if not bsdf or not out_node:
        return

    base_in = bsdf.inputs['Base Color']
    if not base_in.is_linked:
        clean_non_gltf_shader_links(mat)
        return

    from_node = base_in.links[0].from_node
    if from_node.type == 'TEX_IMAGE':
        clean_non_gltf_shader_links(mat)
        return

    me = obj.data
    orig_uv_name = me.uv_layers[0].name if len(me.uv_layers) > 0 else None
    patch_material_coord_nodes(mat, orig_uv_name=orig_uv_name)

    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    if reuse_existing_uv and orig_uv_name:
        bake_uv_name = orig_uv_name
        me.uv_layers.active = me.uv_layers[bake_uv_name]
    else:
        bake_uv_name = "UV_Bake"
        if bake_uv_name not in me.uv_layers:
            me.uv_layers.new(name=bake_uv_name)
        me.uv_layers.active = me.uv_layers[bake_uv_name]
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(66.0), island_margin=0.008)
        bpy.ops.object.mode_set(mode='OBJECT')

    color_source_socket = base_in.links[0].from_socket
    emit_node = nt.nodes.new('ShaderNodeEmission')
    nt.links.new(color_source_socket, emit_node.inputs['Color'])
    nt.links.new(emit_node.outputs['Emission'], out_node.inputs['Surface'])

    img_name = f"Baked_{mat.name}_{img_size}"
    if img_name in bpy.data.images:
        bpy.data.images.remove(bpy.data.images[img_name])
    baked_img = bpy.data.images.new(name=img_name, width=img_size, height=img_size, alpha=False)
    baked_img.colorspace_settings.name = 'sRGB'

    tex_node = nt.nodes.new('ShaderNodeTexImage')
    tex_node.image = baked_img
    for n in nt.nodes:
        n.select = False
    tex_node.select = True
    nt.nodes.active = tex_node

    print(f"  [BAKE] Baking {mat.name} on {obj.name} ({img_size}x{img_size}, uv={bake_uv_name})...")
    bpy.ops.object.bake(type='EMIT', pass_filter={'EMIT'}, margin=8, use_clear=True)
    baked_img.pack()

    for uvl in list(me.uv_layers):
        if uvl.name != bake_uv_name:
            me.uv_layers.remove(uvl)
    me.uv_layers[0].name = "UVMap"

    nt.links.new(bsdf.outputs['BSDF'], out_node.inputs['Surface'])
    nt.nodes.remove(emit_node)
    for l in list(base_in.links):
        nt.links.remove(l)
    nt.links.new(tex_node.outputs['Color'], base_in)

    clean_non_gltf_shader_links(mat)


def process_paneer_pizza_hybrid(meshes):
    setup_cycles_gpu()
    apply_modifiers_and_store_orig_coords(meshes)
    meshes = separate_and_join_meshes_by_material(meshes)
    for obj in meshes:
        mat = obj.material_slots[0].material if obj.material_slots else None
        if not mat or not mat.node_tree:
            continue
        nt = mat.node_tree
        bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not bsdf:
            continue

        if mat.name in ("Mat_Molten_Mozzarella_Cheese_Bed", "Mat_Neapolitan_Cornicione_Crust"):
            # Connect master_pizza_centered_2k.png directly on existing UVMap!
            tex = next((n for n in nt.nodes if n.type == 'TEX_IMAGE' and n.image), None)
            if tex:
                tex.image.pack()
                for l in list(bsdf.inputs['Base Color'].links):
                    nt.links.remove(l)
                nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
            clean_non_gltf_shader_links(mat)
        else:
            bake_object_material_emit(obj, mat, img_size=1024, reuse_existing_uv=False)
    return meshes


def process_chicken_pizza_trim(meshes):
    obj = meshes[0]
    me = obj.data
    attr = me.attributes.get('CrustMask')
    if attr:
        vals = [d.color[0] for d in attr.data]
        bm = bmesh.new()
        bm.from_mesh(me)
        bm.verts.ensure_lookup_table()
        verts_to_del = [v for i, v in enumerate(bm.verts) if vals[i] > 0.3]
        bmesh.ops.delete(bm, geom=verts_to_del, context='VERTS')

        dough_mat = bpy.data.materials.new(name="Mat_Baked_Dough_Rim")
        dough_mat.use_nodes = True
        d_bsdf = next(n for n in dough_mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        d_bsdf.inputs['Base Color'].default_value = (0.74, 0.54, 0.32, 1.0)
        d_bsdf.inputs['Roughness'].default_value = 0.75
        me.materials.append(dough_mat)
        dough_slot_idx = len(me.materials) - 1

        b_edges = [e for e in bm.edges if e.is_boundary]
        if b_edges:
            ret = bmesh.ops.extrude_edge_only(bm, edges=b_edges)
            ext_verts = [ele for ele in ret['geom'] if isinstance(ele, bmesh.types.BMVert)]
            ext_faces = [ele for ele in ret['geom'] if isinstance(ele, bmesh.types.BMFace)]
            for v in ext_verts:
                v.co.z = 0.0
            for f in ext_faces:
                f.material_index = dough_slot_idx
            cap_ret = bmesh.ops.contextual_create(bm, geom=ext_verts)
            for f in cap_ret.get('faces', []):
                f.material_index = dough_slot_idx

        bm.to_mesh(me)
        bm.free()
        me.update()

    for uvl in list(me.uv_layers):
        if uvl.name != "UV_Toppings":
            me.uv_layers.remove(uvl)
    if len(me.uv_layers) > 0:
        me.uv_layers[0].name = "UVMap"

    mat = me.materials[0]
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    tex_top = next((n for n in nt.nodes if n.type == 'TEX_IMAGE' and n.image and 'master_chicken_pizza_top' in n.image.name), None)
    if tex_top:
        tex_top.image.pack()
        for l in list(bsdf.inputs['Base Color'].links):
            nt.links.remove(l)
        nt.links.new(tex_top.outputs['Color'], bsdf.inputs['Base Color'])
    tex_rough = next((n for n in nt.nodes if n.type == 'TEX_IMAGE' and n.image and 'chicken_pizza_rough' in n.image.name), None)
    if tex_rough:
        tex_rough.image.pack()
    clean_non_gltf_shader_links(mat)
    bsdf.inputs['Roughness'].default_value = 0.36
    return [obj]


def process_truffle_pizza_direct(meshes):
    for obj in meshes:
        for slot in obj.material_slots:
            mat = slot.material
            if not mat or not mat.node_tree:
                continue
            nt = mat.node_tree
            bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if not bsdf:
                continue
            if mat.name == "Mat_Baked_Dough_Base":
                for l in list(bsdf.inputs['Base Color'].links):
                    nt.links.remove(l)
                bsdf.inputs['Base Color'].default_value = (0.72, 0.52, 0.30, 1.0)
                bsdf.inputs['Roughness'].default_value = 0.75
            else:
                for n in nt.nodes:
                    if n.type == 'TEX_IMAGE' and n.image:
                        n.image.pack()
            clean_non_gltf_shader_links(mat)
    return meshes


def process_chicken_burger_direct(meshes):
    for obj in meshes:
        for slot in obj.material_slots:
            mat = slot.material
            if not mat or not mat.node_tree:
                continue
            for n in mat.node_tree.nodes:
                if n.type == 'TEX_IMAGE' and n.image:
                    n.image.pack()
            clean_non_gltf_shader_links(mat)
    return meshes


def process_paneer_burger_hybrid(meshes):
    setup_cycles_gpu()
    apply_modifiers_and_store_orig_coords(meshes)
    meshes = separate_and_join_meshes_by_material(meshes)
    for obj in meshes:
        mat = obj.material_slots[0].material if obj.material_slots else None
        if not mat or not mat.node_tree:
            continue
        nt = mat.node_tree
        bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not bsdf:
            continue

        if mat.name == "bun_001":
            tex = next((n for n in nt.nodes if n.type == 'TEX_IMAGE' and n.image and 'baseColor' in n.image.name), None)
            if tex:
                tex.image.pack()
                for l in list(bsdf.inputs['Base Color'].links):
                    nt.links.remove(l)
                nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
            bsdf.inputs['Roughness'].default_value = 0.35
            clean_non_gltf_shader_links(mat)
        elif mat.name == "Mat_Panko_Photo_Clean_V33":
            tex = next((n for n in nt.nodes if n.type == 'TEX_IMAGE' and n.image), None)
            if tex:
                tex.image.pack()
                for l in list(bsdf.inputs['Base Color'].links):
                    nt.links.remove(l)
                nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
            bsdf.inputs['Roughness'].default_value = 0.50
            clean_non_gltf_shader_links(mat)
        elif mat.name == "Mat_Chutney_Liquid_V33":
            for l in list(bsdf.inputs['Base Color'].links):
                nt.links.remove(l)
            bsdf.inputs['Base Color'].default_value = (0.14, 0.42, 0.09, 1.0)
            bsdf.inputs['Roughness'].default_value = 0.18
            clean_non_gltf_shader_links(mat)
        elif mat.name == "Mat_Slaw_TwoTone_V33":
            bake_object_material_emit(obj, mat, img_size=1024, reuse_existing_uv=False)
        else:
            clean_non_gltf_shader_links(mat)
    return meshes


def create_chowmein_noodle_texture():
    img_name = "Baked_ChowMein_SoySesame_1024"
    if img_name in bpy.data.images:
        bpy.data.images.remove(bpy.data.images[img_name])
    w, h = 512, 512
    img = bpy.data.images.new(name=img_name, width=w, height=h, alpha=False)
    img.colorspace_settings.name = 'sRGB'

    # Generate rich wok-tossed soy-sesame caramelized noodle texture matching Mat_MasterChowMein ColorRamp
    pixels = [1.0] * (w * h * 4)
    for y in range(h):
        vy = y / h
        s1 = math.sin(vy * math.pi * 12.0)
        s2 = math.cos(vy * math.pi * 29.0)
        for x in range(w):
            vx = x / w
            n = 0.5 + 0.25 * math.sin(vx * math.pi * 16.0 + s1 * 2.5) + 0.15 * math.cos((vx + vy) * math.pi * 24.0 + s2) + 0.10 * math.sin((vx * 37.0 - vy * 19.0) * math.pi)
            # Map n (0..1) to golden-brown caramelized soy-sesame noodle palette from blend_originals/chowmein_noodles.png
            r = 0.34 + 0.28 * n
            g = 0.13 + 0.15 * n
            b = 0.025 + 0.045 * n
            idx = (y * w + x) * 4
            pixels[idx] = min(1.0, max(0.0, r))
            pixels[idx + 1] = min(1.0, max(0.0, g))
            pixels[idx + 2] = min(1.0, max(0.0, b))
            pixels[idx + 3] = 1.0
    img.pixels[:] = pixels
    img.pack()
    return img


def process_chowmein_hybrid(meshes):
    setup_cycles_gpu()
    decimate_rules = {
        "Noodles_BaseEnsemble": 0.14,
        "Noodles_OverWeave": 0.14,
        "Donburi_Bowl": 0.25,
    }
    apply_modifiers_and_store_orig_coords(meshes, decimate_rules=decimate_rules)
    meshes = separate_and_join_meshes_by_material(meshes)
    for obj in meshes:
        mat = obj.material_slots[0].material if obj.material_slots else None
        if not mat or not mat.node_tree:
            continue
        nt = mat.node_tree
        bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not bsdf:
            continue

        if mat.name == "Mat_MasterChowMein":
            # Assign continuous seam-free 3D UVs to the joined noodles and connect caramelized soy-sesame texture
            me = obj.data
            for uvl in list(me.uv_layers):
                me.uv_layers.remove(uvl)
            uv_layer = me.uv_layers.new(name="UVMap")
            me.uv_layers.active = uv_layer
            uv_data = uv_layer.data
            for poly in me.polygons:
                for li in poly.loop_indices:
                    v = me.vertices[me.loops[li].vertex_index]
                    uv_data[li].uv = (v.co.x * 14.0 + v.co.z * 6.0, v.co.y * 14.0 - v.co.z * 6.0)

            noodle_img = create_chowmein_noodle_texture()
            tex_node = nt.nodes.new('ShaderNodeTexImage')
            tex_node.image = noodle_img
            for l in list(bsdf.inputs['Base Color'].links):
                nt.links.remove(l)
            nt.links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])
            bsdf.inputs['Roughness'].default_value = 0.22
            clean_non_gltf_shader_links(mat)
        elif mat.name == "Mat_ArtisanalBowl":
            for l in list(bsdf.inputs['Base Color'].links):
                nt.links.remove(l)
            bsdf.inputs['Base Color'].default_value = (0.09, 0.075, 0.055, 1.0)
            bsdf.inputs['Roughness'].default_value = 0.45
            clean_non_gltf_shader_links(mat)
        else:
            clean_non_gltf_shader_links(mat)
    return meshes


def process_potatoes_bake(meshes):
    setup_cycles_gpu()
    apply_modifiers_and_store_orig_coords(meshes)
    meshes = separate_and_join_meshes_by_material(meshes)
    for obj in meshes:
        mat = obj.material_slots[0].material if obj.material_slots else None
        if not mat or not mat.node_tree:
            continue
        nt = mat.node_tree
        bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not bsdf:
            continue

        if mat.name == "M_Crispy_Braised_Potato_v60.001":
            bake_object_material_emit(obj, mat, img_size=2048, reuse_existing_uv=False)
        elif mat.name in ("M_Dolsot_Stone_Pot_v60.001", "M_Scallion_Garnish_v60.001"):
            bake_object_material_emit(obj, mat, img_size=1024, reuse_existing_uv=False)
        elif mat.name == "M_Toasted_Sesame_v60.001":
            for l in list(bsdf.inputs['Base Color'].links):
                nt.links.remove(l)
            bsdf.inputs['Base Color'].default_value = (0.83, 0.67, 0.42, 1.0)
            bsdf.inputs['Roughness'].default_value = 0.42
            clean_non_gltf_shader_links(mat)
        else:
            clean_non_gltf_shader_links(mat)
    return meshes


def process_bake_all(meshes):
    setup_cycles_gpu()
    apply_modifiers_and_store_orig_coords(meshes)
    meshes = separate_and_join_meshes_by_material(meshes)
    for obj in meshes:
        mat = obj.material_slots[0].material if obj.material_slots else None
        if not mat or not mat.node_tree:
            continue
        is_hero = any(k in mat.name for k in ("Crust", "Cheese"))
        bake_object_material_emit(
            obj,
            mat,
            img_size=2048 if is_hero else 1024,
            reuse_existing_uv=False,
        )
    return meshes


def normalize_world_bounds(meshes, target_size):
    for obj in meshes:
        me = obj.data
        for attr_name in ("OrigObjCo", "OrigGenCo"):
            if attr_name in me.attributes:
                me.attributes.remove(me.attributes[attr_name])

    min_x = min_y = min_z = float('inf')
    max_x = max_y = max_z = float('-inf')

    for obj in meshes:
        mw = obj.matrix_world
        for v in obj.data.vertices:
            co = mw @ v.co
            if co.x < min_x: min_x = co.x
            if co.y < min_y: min_y = co.y
            if co.z < min_z: min_z = co.z
            if co.x > max_x: max_x = co.x
            if co.y > max_y: max_y = co.y
            if co.z > max_z: max_z = co.z

    center_x = (min_x + max_x) * 0.5
    center_y = (min_y + max_y) * 0.5
    bottom_z = min_z
    max_horiz = max(max_x - min_x, max_y - min_y, 0.001)
    scale_mult = target_size / max_horiz

    T = Matrix.Translation(Vector((-center_x, -center_y, -bottom_z)))
    S = Matrix.Scale(scale_mult, 4)
    M = S @ T

    for obj in meshes:
        obj.data.transform(M @ obj.matrix_world)
        obj.matrix_world = Matrix.Identity(4)
        obj.data.update()

    print(f"  [BOUNDS] Normalized horiz={max_horiz:.3f}m -> {target_size}m (scale={scale_mult:.2f}x)")


def scale_all_images(max_dim):
    for img in bpy.data.images:
        if img.size[0] > 0 and img.size[1] > 0:
            w, h = img.size[0], img.size[1]
            if w > max_dim or h > max_dim:
                scale = max_dim / max(w, h)
                nw = max(4, int(round(w * scale)))
                nh = max(4, int(round(h * scale)))
                img.scale(nw, nh)


def decimate_for_tier(meshes, ratio):
    if ratio >= 0.999:
        return
    for obj in meshes:
        if len(obj.data.polygons) > 600:
            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            dec = obj.modifiers.new(name="TierDecimate", type='DECIMATE')
            dec.ratio = ratio
            try:
                bpy.ops.object.modifier_apply(modifier=dec.name)
            except Exception:
                obj.modifiers.remove(dec)


def export_glb(filepath, draco=True):
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials='EXPORT',
        export_image_format='JPEG',
        export_image_quality=90,
        export_draco_mesh_compression_enable=draco,
        export_draco_mesh_compression_level=7,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12,
    )


def export_usdz(filepath):
    try:
        bpy.ops.wm.usd_export(
            filepath=filepath,
            selected_objects_only=False,
            export_materials=True,
            export_textures=True,
            overwrite_textures=True,
            relative_paths=True,
        )
    except Exception as e:
        print(f"  [WARN] USDZ export note: {e}")


import sys
only_filter = set(sys.argv[sys.argv.index("--") + 1:]) if "--" in sys.argv else None

for job in DISH_JOBS:
    primary_slug = job["slugs"][0]
    if only_filter and primary_slug not in only_filter:
        continue

    blend_path = os.path.join(SOURCE_DIR, job["blend"])
    print(f"\n=======================================================")
    print(f"PROCESSING: {job['blend']} -> {job['slugs']} (mode={job['mode']})")
    print(f"=======================================================")

    bpy.ops.wm.open_mainfile(filepath=blend_path)
    meshes = filter_and_delete_unwanted(job["exclude"])
    print(f"  Visible clean meshes: {[o.name for o in meshes]}")

    mode = job["mode"]
    if mode == "paneer_pizza_hybrid":
        meshes = process_paneer_pizza_hybrid(meshes)
    elif mode == "chicken_pizza_trim":
        meshes = process_chicken_pizza_trim(meshes)
    elif mode == "truffle_pizza_direct":
        meshes = process_truffle_pizza_direct(meshes)
    elif mode == "chicken_burger_direct":
        meshes = process_chicken_burger_direct(meshes)
    elif mode == "paneer_burger_hybrid":
        meshes = process_paneer_burger_hybrid(meshes)
    elif mode == "chowmein_hybrid":
        meshes = process_chowmein_hybrid(meshes)
    elif mode == "potatoes_bake":
        meshes = process_potatoes_bake(meshes)
    elif mode == "bake_all":
        meshes = process_bake_all(meshes)

    normalize_world_bounds(meshes, job["target_size"])

    scale_all_images(2048)
    high_path = os.path.join(OPTIMIZED_DIR, f"{primary_slug}-high.glb")
    export_glb(high_path, draco=True)

    scale_all_images(1024)
    usdz_path = os.path.join(OPTIMIZED_DIR, f"{primary_slug}.usdz")
    export_usdz(usdz_path)

    decimate_for_tier(meshes, 0.60)
    bal_path = os.path.join(OPTIMIZED_DIR, f"{primary_slug}-balanced.glb")
    export_glb(bal_path, draco=True)
    root_path = os.path.join(PUBLIC_MODELS_DIR, f"{primary_slug}.glb")
    shutil.copy2(bal_path, root_path)

    scale_all_images(512)
    decimate_for_tier(meshes, 0.55)
    ul_path = os.path.join(OPTIMIZED_DIR, f"{primary_slug}-ultralight.glb")
    export_glb(ul_path, draco=True)

    for extra_slug in job["slugs"][1:]:
        shutil.copy2(high_path, os.path.join(OPTIMIZED_DIR, f"{extra_slug}-high.glb"))
        shutil.copy2(bal_path, os.path.join(OPTIMIZED_DIR, f"{extra_slug}-balanced.glb"))
        shutil.copy2(ul_path, os.path.join(OPTIMIZED_DIR, f"{extra_slug}-ultralight.glb"))
        shutil.copy2(bal_path, os.path.join(PUBLIC_MODELS_DIR, f"{extra_slug}.glb"))
        if os.path.exists(usdz_path):
            shutil.copy2(usdz_path, os.path.join(OPTIMIZED_DIR, f"{extra_slug}.usdz"))

    print(f"  [DONE] {primary_slug}: high={os.path.getsize(high_path)//1024}KB, bal={os.path.getsize(bal_path)//1024}KB, ul={os.path.getsize(ul_path)//1024}KB")

print("\nSELECTED AUTHENTIC BLEND MODELS BAKED & EXPORTED SUCCESSFULLY!")
