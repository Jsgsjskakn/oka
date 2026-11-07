import bpy

rna = bpy.ops.wm.usd_export.get_rna_type()
for prop in rna.properties:
    print(f"Prop: {prop.identifier} ({prop.type})")
