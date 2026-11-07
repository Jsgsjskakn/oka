import bpy
import os

out_dir = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak\public\models\optimized"
test_usdz = os.path.join(out_dir, "test_blender_burger.usdz")

for mode in ['KEEP', 'PRESERVE', 'NEW']:
    print(f"\n--- Trying export_textures_mode={mode} ---")
    try:
        bpy.ops.wm.usd_export(
            filepath=test_usdz,
            selected_objects_only=False,
            export_materials=True,
            generate_preview_surface=True,
            export_textures_mode=mode,
            triangulate_meshes=True,
            convert_orientation=True
        )
        print(f"SUCCESS with {mode}! Exists={os.path.exists(test_usdz)}, Size={os.path.getsize(test_usdz)} bytes")
        break
    except Exception as e:
        print(f"Error with {mode}: {e}")
