import bpy

print("=== TESTING IMAGE SCALE IN BLENDER ===")
for img in bpy.data.images:
    print(f"Original: {img.name}, size={tuple(img.size)}")
    orig_w, orig_h = img.size
    img.scale(orig_w // 2, orig_h // 2)
    print(f"Rescaled: {img.name}, new size={tuple(img.size)}")
