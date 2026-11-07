import bpy
import os

blend_dir = r"C:\Users\Pyiush Gupta\Downloads\.blends\BLENDER 3\3d models"
files = [
    ("bbq-chicken-overload", "bbq_chicken_overload_pizza.blend"),
    ("chicken-tikka-pizza", "chicken_pizza.blend"),
    ("classic-smash-burger", "chiken_burger.blend"),
    ("crispy-paneer-burger", "paneer_burger.blend"),
    ("wok-tossed-chow-mein", "chowmein_noodles.blend"),
    ("tandoori-paneer-pizza", "paneer_pizza.blend"),
    ("mushroom-truffle-pizza", "truffle_mushroom_pizza.blend"),
    ("dynamite-chilli-potatoes", "_potatoes bolls .blend"),
]

for slug, f in files:
    path = os.path.join(blend_dir, f)
    bpy.ops.wm.open_mainfile(filepath=path)
    all_objs = [(o.name, o.type) for o in bpy.data.objects]
    mesh_objs = [o for o in bpy.data.objects if o.type == 'MESH']
    print(f"\n==============================")
    print(f"SLUG: {slug} | FILE: {f}")
    print(f"Total objects: {len(all_objs)}")
    print(f"Objects: {all_objs[:15]}")
    # Check for any table, floor, camera, light
    non_food = [o.name for o in bpy.data.objects if any(k in o.name.lower() for k in ['table', 'floor', 'camera', 'light', 'cube', 'plane', 'room', 'ground'])]
    print(f"Potential background/scene objects: {non_food}")
