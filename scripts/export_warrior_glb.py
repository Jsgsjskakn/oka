import bpy
import os

output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "models", "warrior_scene.glb"))
os.makedirs(os.path.dirname(output_path), exist_ok=True)

print(f"Starting GLB export to: {output_path}")

# Ensure all mesh objects are visible and selectable
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        obj.hide_viewport = False
        obj.hide_render = False

bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        obj.select_set(True)

# Export to GLB
try:
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_materials='EXPORT',
        export_colors=True,
        export_normals=True,
        export_yup=True
    )
    print("GLB export operation completed.")
except Exception as e:
    print(f"Export error: {e}")
    # Fallback without use_selection if needed
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_apply=True
    )

if os.path.exists(output_path):
    size_bytes = os.path.getsize(output_path)
    print(f"Export SUCCESS: {output_path} ({size_bytes} bytes)")
else:
    print(f"Export FAILED: File was not created at {output_path}")
