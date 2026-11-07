import bpy
from mathutils import Vector

print("=== CHECKING OBJECT PARENTS AND WORLD MATRICES ===")
for obj in bpy.data.objects:
    if obj.type == "MESH":
        print(f"Mesh Object: {obj.name}, parent={obj.parent.name if obj.parent else None}")
        mw = obj.matrix_world
        print(f"  matrix_world translation: {mw.to_translation()}")
        print(f"  matrix_world scale: {mw.to_scale()}")
        bb = [mw @ Vector(v) for v in obj.bound_box]
        min_c = Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)))
        max_c = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
        print(f"  world bounding box: min={min_c}, max={max_c}, size={max_c - min_c}")
