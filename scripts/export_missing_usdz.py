import bpy
import os

OUT_DIR = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak\public\models\optimized"

dishes = [
    ("bbq-chicken-overload", "bbq-chicken-overload-balanced.glb"),
    ("crispy-paneer-burger", "crispy-paneer-burger-balanced.glb"),
    ("mushroom-truffle-pizza", "mushroom-truffle-pizza-balanced.glb"),
    ("wok-tossed-chow-mein", "wok-tossed-chow-mein-balanced.glb"),
    ("dynamite-chilli-potatoes", "dynamite-chilli-potatoes-balanced.glb"),
]

for slug, glb_file in dishes:
    glb_path = os.path.join(OUT_DIR, glb_file)
    usdz_path = os.path.join(OUT_DIR, f"{slug}.usdz")
    print(f"\nConverting {glb_file} -> {slug}.usdz ...")
    
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    try:
        bpy.ops.wm.usd_export(
            filepath=usdz_path,
            selected_objects_only=False,
            export_materials=True,
            generate_preview_surface=True,
            export_textures_mode='KEEP'
        )
        print(f"  Exported {usdz_path}: {os.path.getsize(usdz_path):,} bytes")
    except Exception as e:
        print(f"  Error on {slug}: {e}")

print("=== ALL MISSING USDZ FILES EXPORTED ===")
