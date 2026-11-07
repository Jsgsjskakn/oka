import bpy
from mathutils import Vector

min_v = Vector((float('inf'), float('inf'), float('inf')))
max_v = Vector((float('-inf'), float('-inf'), float('-inf')))

mesh_objs = [obj for obj in bpy.data.objects if obj.type == 'MESH']
for obj in mesh_objs:
    matrix = obj.matrix_world
    for corner in [matrix @ Vector(v) for v in obj.bound_box]:
        for i in range(3):
            min_v[i] = min(min_v[i], corner[i])
            max_v[i] = max(max_v[i], corner[i])

size = max_v - min_v
center = (max_v + min_v) / 2.0
print(f"World Bounding Box:")
print(f"  Min: {min_v}")
print(f"  Max: {max_v}")
print(f"  Size: {size}")
print(f"  Center: {center}")
