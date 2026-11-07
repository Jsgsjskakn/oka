import bpy
from mathutils import Vector
import os

print("=== STARTING BLENDER BURGER EXPORT ===")

# 1. Identify burger mesh objects
burger_meshes = [
    obj for obj in bpy.data.objects
    if obj.type == "MESH" and ("bun" in obj.name or "lettuce" in obj.name or "vegi" in obj.name or "pPlane" in obj.name)
]
print(f"Found {len(burger_meshes)} burger meshes: {[o.name for o in burger_meshes]}")

# 2. Delete non-burger objects
for obj in list(bpy.data.objects):
    if obj not in burger_meshes:
        bpy.data.objects.remove(obj, do_unlink=True)

# 3. Unparent burger meshes while preserving world matrix
bpy.ops.object.select_all(action='DESELECT')
for obj in burger_meshes:
    matrix_world = obj.matrix_world.copy()
    obj.parent = None
    obj.matrix_world = matrix_world

# 4. Compute overall world bounding box
min_v = Vector((float('inf'), float('inf'), float('inf')))
max_v = Vector((float('-inf'), float('-inf'), float('-inf')))

for obj in burger_meshes:
    for corner in [obj.matrix_world @ Vector(v) for v in obj.bound_box]:
        for i in range(3):
            min_v[i] = min(min_v[i], corner[i])
            max_v[i] = max(max_v[i], corner[i])

print(f"Initial bounds: min={min_v}, max={max_v}")
center_x = (min_v.x + max_v.x) / 2.0
center_y = (min_v.y + max_v.y) / 2.0
bottom_z = min_v.z

print(f"Centering offset: dx={-center_x}, dy={-center_y}, dz={-bottom_z}")

# Shift meshes so (0,0) is center and base sits on Z=0
for obj in burger_meshes:
    obj.location.x -= center_x
    obj.location.y -= center_y
    obj.location.z -= bottom_z

# Apply all transforms (location, rotation, scale)
bpy.ops.object.select_all(action='DESELECT')
for obj in burger_meshes:
    obj.select_set(True)
bpy.context.view_layer.objects.active = burger_meshes[0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Verify new bounds
new_min = Vector((float('inf'), float('inf'), float('inf')))
new_max = Vector((float('-inf'), float('-inf'), float('-inf')))
for obj in burger_meshes:
    for corner in [obj.matrix_world @ Vector(v) for v in obj.bound_box]:
        for i in range(3):
            new_min[i] = min(new_min[i], corner[i])
            new_max[i] = max(new_max[i], corner[i])

print(f"New centered bounds: min={new_min}, max={new_max}")
print(f"New dimensions: {new_max - new_min}")

# Export master GLB
out_dir = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak\public\models\optimized"
os.makedirs(out_dir, exist_ok=True)
master_glb = os.path.join(out_dir, "golden-oak-burger-master.glb")

bpy.ops.export_scene.gltf(
    filepath=master_glb,
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_materials='EXPORT',
    export_image_format='AUTO',
    export_yup=True
)
print(f"Master GLB exported successfully to {master_glb}, size={os.path.getsize(master_glb)} bytes")
