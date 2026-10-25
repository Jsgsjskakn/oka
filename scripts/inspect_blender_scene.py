import bpy

print("=" * 60)
print("BLENDER SCENE INSPECTION: warrior_scene.blend")
print("=" * 60)

print(f"Blender Version: {bpy.app.version_string}")
print(f"Scene Name: {bpy.context.scene.name}")

print("\n--- OBJECTS IN SCENE ---")
for obj in bpy.data.objects:
    print(f"Name: {obj.name} | Type: {obj.type} | Location: {obj.location} | Scale: {obj.scale} | Dimensions: {obj.dimensions}")

print("\n--- MESHES IN SCENE ---")
for mesh in bpy.data.meshes:
    print(f"Mesh: {mesh.name} | Vertices: {len(mesh.vertices)} | Polygons: {len(mesh.polygons)} | Materials: {[m.name for m in mesh.materials if m]}")

print("\n--- MATERIALS IN SCENE ---")
for mat in bpy.data.materials:
    use_nodes = getattr(mat, 'use_nodes', False)
    print(f"Material: {mat.name} | Use Nodes: {use_nodes}")
    if use_nodes and mat.node_tree:
        for node in mat.node_tree.nodes:
            if node.type == 'BSDF_PRINCIPLED':
                base_color = node.inputs.get('Base Color')
                color_val = base_color.default_value[:] if base_color and hasattr(base_color, 'default_value') else "linked"
                print(f"   -> Principled BSDF found (Base Color: {color_val})")

print("\n--- CAMERAS & LIGHTS ---")
cameras = [o for o in bpy.data.objects if o.type == 'CAMERA']
lights = [o for o in bpy.data.objects if o.type == 'LIGHT']
print(f"Cameras ({len(cameras)}): {[c.name for c in cameras]}")
print(f"Lights ({len(lights)}): {[l.name for l in lights]}")
print("=" * 60)
