import bpy
import os
import sys

blend_dir = r"C:\Users\Pyiush Gupta\Downloads\.blends\BLENDER 3\3d models"
files = [
    "bbq_chicken_overload_pizza.blend",
    "chicken_pizza.blend",
    "chiken_burger.blend",
    "chowmein_noodles.blend",
    "noodles_bowl.blend",
    "paneer_burger.blend",
    "paneer_pizza.blend",
    "truffle_mushroom_pizza.blend",
    "_potatoes bolls .blend"
]

print("=== INSPECTING ALL 9 BLEND FILES ===")
for f in files:
    path = os.path.join(blend_dir, f)
    if not os.path.exists(path):
        print(f"File NOT found: {f}")
        continue
    
    bpy.ops.wm.open_mainfile(filepath=path)
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    poly_count = sum(len(m.data.polygons) for m in meshes)
    materials = list(bpy.data.materials)
    images = list(bpy.data.images)
    print(f"\n[FILE]: {f}")
    print(f"  Meshes ({len(meshes)}): {[m.name for m in meshes[:6]]}{'...' if len(meshes)>6 else ''}")
    print(f"  Total Polygons: {poly_count:,}")
    print(f"  Materials ({len(materials)}): {[m.name for m in materials[:5]]}")
    print(f"  Images ({len(images)}): {[img.name for img in images[:5]]}")
