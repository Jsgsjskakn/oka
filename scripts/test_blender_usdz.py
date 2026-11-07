import bpy
import os

out_dir = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak\public\models\optimized"
test_usdz = os.path.join(out_dir, "test_burger.usdz")

# Check if bpy.ops.wm.usd_export exists
if hasattr(bpy.ops.wm, 'usd_export'):
    print("bpy.ops.wm.usd_export is AVAILABLE!")
    # Test exporting
    try:
        bpy.ops.wm.usd_export(
            filepath=test_usdz,
            selected_objects_only=False,
            export_textures=True
        )
        print(f"Exported USDZ to {test_usdz}, size={os.path.getsize(test_usdz)} bytes")
    except Exception as e:
        print(f"USD export failed: {e}")
else:
    print("bpy.ops.wm.usd_export is NOT available")
