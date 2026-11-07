import bpy
import os

out_dir = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak\public\models\optimized"
test_usdz = os.path.join(out_dir, "test_blender_burger.usdz")

bpy.ops.wm.usd_export(
    filepath=test_usdz,
    selected_objects_only=False,
    export_materials=True,
    generate_preview_surface=True,
    export_textures_mode='PACKED',
    triangulate_meshes=True,
    convert_orientation=True
)

print(f"Exported USDZ: {test_usdz}, exists={os.path.exists(test_usdz)}, size={os.path.getsize(test_usdz) if os.path.exists(test_usdz) else 0}")
