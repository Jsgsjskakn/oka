import bpy

for mat in bpy.data.materials:
    print(f"\n=================== MATERIAL: {mat.name} ===================")
    for node in mat.node_tree.nodes:
        print(f"Node: {node.name} ({node.type})")
    for link in mat.node_tree.links:
        print(f"  Link: {link.from_node.name}.{link.from_socket.name} -> {link.to_node.name}.{link.to_socket.name}")
