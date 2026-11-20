# THE GOLDEN OAK — PHASE 7 3D ASSET RECONSTRUCTION REPORT

**Agent 1 & Agent 4:** Food 3D Reconstruction Specialist & GLB/USDZ Mobile Optimization Engineer  
**Date:** 2026-11-20  
**Pipelines Executed:** [scripts/phase7-pbr-calibrate-glbs.mjs](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/scripts/phase7-pbr-calibrate-glbs.mjs), [scripts/phase7-export-optimized-usdz.py](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/scripts/phase7-export-optimized-usdz.py), [scripts/phase5-build-dish-manifest.mjs](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/scripts/phase5-build-dish-manifest.mjs)

---

## 1. Critical Asset Defects Discovered & Reconstructed in Phase 7

During our Phase 7 binary inspection of `public/models/optimized/*` using **Blender 5.2 LTS** and Node.js glTF/USDZ binary parsers, we uncovered and fixed **four major 3D asset defects**:

1. **Defect P7-01 — Un-decimated 158K–308K Triangle Counts Inside 5 iOS Quick Look USDZ Archives**:
   - `bbq-chicken-overload.usdz` had **308,043 triangles** (`13,194.12 KB`), `dynamite-chilli-potatoes.usdz` had **297,522 triangles** (`16,952.60 KB`), `crispy-paneer-burger.usdz` had **233,034 triangles** (`10,116.75 KB`), `wok-tossed-chow-mein.usdz` had **209,245 triangles** (`10,624.32 KB`), and `mushroom-truffle-pizza.usdz` had **158,932 triangles** (`7,407.66 KB`) because they had been exported on `2026-11-07` prior to the Phase 3.2/Phase 5 mesh decimation.
   - **Reconstruction Fix**: Rebuilt all 5 USDZ archives in Blender 5.2 from the decimated, topology-verified mobile meshes (`6,112` to `9,981` triangles), cutting USDZ triangle counts by **95%–97%** and file sizes by **94.3%–95.0%**.

2. **Defect P7-02 — Missing Embedded Textures (`export_textures_mode='KEEP'`) in 5 Blender USDZ Exports & Untextured Legacy Phase 2 Primitives in 4 USDZ Exports**:
   - In Phase 6, importing the 5 large USDZ files into Blender 5.2 emitted:
     `WARNING Couldn't open image file '0/clean_reference_texture.png'`, `WARNING Couldn't open image file '0/test_quad_pizza.png'`, `WARNING Couldn't open image file '0/panko_crisp_perfection.png'`.
   - Furthermore, `tandoori-paneer-pizza.usdz` (`1,896` tris), `chicken-tikka-pizza.usdz`, `classic-smash-burger.usdz` (`2,108` tris), and `golden-oak-burger.usdz` were still the `2026-11-01` untextured primitive meshes rather than the authentic textured Blender food models!
   - **Reconstruction Fix**: In [scripts/phase7-export-optimized-usdz.py](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/scripts/phase7-export-optimized-usdz.py), we unpacked all in-memory glTF textures to disk as calibrated JPEG textures and exported via Blender 5.2 `bpy.ops.wm.usd_export(..., export_textures_mode='NEW', generate_preview_surface=True)`. Every textured dish USDZ now embeds both the `.usdc` binary crate and `textures/*.jpg` inside the 64-byte aligned USDZ package.

3. **Defect P7-03 — Incorrect 1.70m–2.39m Physical Dimensions Inside USDZ Files for iOS AR Quick Look**:
   - Because the studio GLB meshes are normalized to `~2.0m–2.4m` width for studio turntable camera framing (and scaled at runtime in WebXR by `modelScaleFactor = 0.06..0.1267`), exporting those GLB meshes directly to USDZ without applying `modelScaleFactor` caused iOS AR Quick Look (which reads USDZ natively at `1 unit = 1 metre` with `#allowsContentScaling=0`) to render pizzas **2.39 metres wide** and burgers **1.70 metres wide**!
   - **Reconstruction Fix**: Applied exact vertex-level metric scaling (`targetFootprintM / currentFootprintM`) and ground-plane alignment (`z_min = 0.0000m`, footprint centered at `(0, 0, 0)`) during USDZ generation in Blender 5.2. Every reconstructed USDZ now has exact 1:1 physical dimensions (`30.0 × 30.0 cm` pizzas, `12.0 × 12.0 cm` burgers, `12.5 × 12.5 cm` signature burger, `18.0 × 18.0 cm` chow mein, `19.6 × 20.0 cm` dynamite chilli potatoes).

4. **Defect P7-04 — Non-Zero Metallic Factors & Mirror-Like Plastic Roughness on Organic Food GLBs**:
   - `classic-smash-burger` and `golden-oak-burger` had `metallicFactor: 0.074` on `lettuce_001` and `metallicFactor: 0.118` on `vegies_001`.
   - `crispy-paneer-burger` had `roughnessFactor: 0.02` on `Mat_Sweet_Chili_V33` and `0.10` on `Mat_Cheddar_Gourmet_V33`; `dynamite-chilli-potatoes` had `roughnessFactor: 0.05` on diced bell peppers.
   - **Reconstruction Fix**: Calibrated all 33 binary GLB files (`11 archetypes × 3 LODs`) via [scripts/phase7-pbr-calibrate-glbs.mjs](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/scripts/phase7-pbr-calibrate-glbs.mjs) to enforce `metallicFactor = 0.0`, `emissiveFactor = [0, 0, 0]`, and natural culinary roughness ranges (`0.14–0.75`).

---

## 2. Reconstructed Archetype Inventory (Before vs After Phase 7)

| Archetype ID | Source Blender File | High GLB Tris / Size | Balanced GLB Tris / Size | Ultra-Light GLB Tris / Size | Phase 6 USDZ Size | Phase 7 USDZ Size | USDZ Embedded Textures | USDZ Physical Dimensions |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `tandoori-paneer-pizza` | `paneer_pizza.blend` | 43,531 / 527.44 KB | 22,548 / 250.45 KB | 9,981 / 120.87 KB | 216.36 KB (untextured primitive) | **610.92 KB** (9,981 tris) | **6 JPEGs** | `30.0 × 30.0 × 1.5 cm` |
| `chicken-tikka-pizza` | `chicken_pizza.blend` | 40,959 / 247.52 KB | 20,480 / 126.00 KB | 8,190 / 55.43 KB | 307.16 KB (untextured primitive) | **1,190.59 KB** (8,190 tris) | **1 JPEG** | `30.0 × 30.0 × 0.7 cm` |
| `mushroom-truffle-pizza` | `truffle_mushroom_pizza.blend` | 29,340 / 406.43 KB | 19,437 / 172.66 KB | 6,112 / 68.42 KB | 7,407.66 KB (158,932 tris, 0 tex) | **374.40 KB** (6,112 tris) | **2 JPEGs** | `30.0 × 30.0 × 0.7 cm` |
| `bbq-chicken-overload` | `bbq_chicken_overload_pizza.blend` | 47,969 / 1,570.78 KB | 21,523 / 684.03 KB | 8,959 / 258.29 KB | 13,194.12 KB (308,043 tris, 0 tex) | **727.85 KB** (8,959 tris) | **8 JPEGs** | `30.0 × 29.1 × 2.6 cm` |
| `classic-smash-burger` | `chiken_burger.blend` | 12,080 / 1,193.93 KB | 12,080 / 361.12 KB | 12,080 / 150.61 KB | 233.83 KB (untextured primitive) | **687.03 KB** (12,080 tris) | **6 JPEGs** | `11.9 × 12.0 × 7.3 cm` |
| `golden-oak-burger` | `chiken_burger.blend` | 12,080 / 1,193.93 KB | 12,080 / 361.12 KB | 12,080 / 150.61 KB | 233.83 KB (vertex color only) | **687.02 KB** (12,080 tris) | **6 JPEGs** | `12.4 × 12.5 × 7.6 cm` |
| `crispy-paneer-burger` | `paneer_burger.blend` | 41,292 / 893.98 KB | 19,560 / 374.98 KB | 9,230 / 152.71 KB | 10,116.75 KB (233,034 tris, 0 tex) | **577.77 KB** (9,230 tris) | **4 JPEGs** | `12.0 × 12.0 × 8.9 cm` |
| `wok-tossed-chow-mein` | `chowmein_noodles.blend` | 30,158 / 469.16 KB | 20,762 / 263.96 KB | 6,538 / 148.84 KB | 10,624.32 KB (209,245 tris, 0 tex) | **530.04 KB** (6,538 tris) | **1 JPEG** | `18.0 × 18.0 × 12.1 cm` |
| `dynamite-chilli-potatoes` | `_potatoes bolls .blend` | 32,742 / 725.29 KB | 19,862 / 291.64 KB | 6,704 / 123.84 KB | 16,952.60 KB (297,522 tris, 0 tex) | **929.09 KB** (6,704 tris) | **3 JPEGs** | `19.6 × 20.0 × 11.7 cm` |
| `gourmet-wok-bowl` (Placeholder) | Procedural | 4,896 / 17.91 KB | 2,352 / 9.21 KB | 816 / 3.55 KB | 171.76 KB | **171.76 KB** (4,896 tris) | 0 (Placeholder) | `24.4 × 24.4 × 8.6 cm` |
| `kaffir-lime-mocktail` (Placeholder) | Procedural | 960 / 8.95 KB | 512 / 4.49 KB | 224 / 2.27 KB | 78.31 KB | **78.31 KB** (960 tris) | 0 (Placeholder) | `8.2 × 8.2 × 16.5 cm` |
