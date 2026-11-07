import bpy
import os

downloads_tex = r"C:\Users\Pyiush Gupta\Downloads\textures"
os.makedirs(downloads_tex, exist_ok=True)

for img in bpy.data.images:
    if img.packed_file:
        fn = os.path.basename(img.filepath) or f"{img.name}"
        if not fn.endswith(".jpg") and not fn.endswith(".png"):
            fn += ".jpg"
        target_path = os.path.join(downloads_tex, fn)
        img.filepath_raw = target_path
        img.file_format = 'JPEG'
        img.save()
        print(f"Saved: {target_path} ({os.path.getsize(target_path)} bytes)")

out_dir = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak\public\models\optimized"
test_usdz = os.path.join(out_dir, "test_blender_burger_with_tex.usdz")
bpy.ops.wm.usd_export(
    filepath=test_usdz,
    selected_objects_only=False,
    export_materials=True,
    generate_preview_surface=True,
    export_textures_mode='KEEP',
    triangulate_meshes=True,
    convert_orientation=True
)
print(f"Exported USDZ: {test_usdz}, exists={os.path.exists(test_usdz)}, size={os.path.getsize(test_usdz)} bytes")
