import bpy

for mat in bpy.data.materials:
    bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    roughness = bsdf.inputs['Roughness'].default_value
    metallic = bsdf.inputs['Metallic'].default_value
    ior = bsdf.inputs['IOR'].default_value if 'IOR' in bsdf.inputs else 'N/A'
    print(f"Material: {mat.name} -> Roughness={roughness}, Metallic={metallic}, IOR={ior}")
