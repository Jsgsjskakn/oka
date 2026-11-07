import bpy

print("=== OBJECTS ===")
for obj in bpy.data.objects:
    print(f"{obj.name} | type={obj.type} | location={obj.location} | scale={obj.scale}")
    if obj.type == "MESH":
        mats = [m.name for m in obj.data.materials if m]
        print(f"   mesh={obj.data.name}, verts={len(obj.data.vertices)}, polygons={len(obj.data.polygons)}, mats={mats}")

print("\n=== MATERIALS ===")
for mat in bpy.data.materials:
    print(f"Material: {mat.name}, use_nodes={mat.use_nodes}")
    if mat.use_nodes:
        for node in mat.node_tree.nodes:
            if node.type == "TEX_IMAGE" and node.image:
                print(f"   node: {node.name} -> image: {node.image.name}, size={tuple(node.image.size)}, packed={node.image.packed_file is not None}")
            elif node.type == "BSDF_PRINCIPLED":
                print(f"   BSDF: {node.name}")

print("\n=== IMAGES ===")
for img in bpy.data.images:
    print(f"Image: {img.name}, size={tuple(img.size)}, packed={img.packed_file is not None}")
