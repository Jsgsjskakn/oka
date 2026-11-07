import bpy
import os

out_dir = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak\public\models\optimized"
tex_dir = os.path.join(out_dir, "textures")
os.makedirs(tex_dir, exist_ok=True)

# Save each packed image to disk in tex_dir
for img in bpy.data.images:
    if img.packed_file:
        fn = os.path.basename(img.filepath) or f"{img.name}"
        if not fn.endswith(".jpg") and not fn.endswith(".png"):
            fn += ".jpg"
        target_path = os.path.join(tex_dir, fn)
        img.filepath_raw = target_path
        img.file_format = 'JPEG'
        img.save()
        print(f"Saved packed image: {img.name} -> {target_path} ({os.path.getsize(target_path)} bytes)")

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
