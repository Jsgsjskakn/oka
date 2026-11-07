import bpy
import os

out_dir = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak\public\models\optimized"
test_glb = os.path.join(out_dir, "test_burger_draco.glb")

bpy.ops.export_scene.gltf(
    filepath=test_glb,
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_materials='EXPORT',
    export_image_format='AUTO',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=7,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
    export_yup=True
)

print(f"Exported Draco GLB to {test_glb}, size={os.path.getsize(test_glb)} bytes")
