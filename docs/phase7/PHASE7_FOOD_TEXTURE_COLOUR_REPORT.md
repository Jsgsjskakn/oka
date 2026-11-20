# THE GOLDEN OAK — PHASE 7 FOOD TEXTURE & COLOUR PIPELINE REPORT

**Agent 2:** PBR Texture and Colour Specialist  
**Date:** 2026-11-20  
**Implementation Files:** [src/lib/three/color-pipeline.ts](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/src/lib/three/color-pipeline.ts), [scripts/phase7-pbr-calibrate-glbs.mjs](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/scripts/phase7-pbr-calibrate-glbs.mjs)

---

## 1. Canonical Colour Management Invariants (Preserved from Phase 5/6)

All 3D and XR renderers (`ViewerScene.tsx`, `WebXRAREngine`, `WebXRVRViewer`, `Restaurant3DFloorplan.tsx`, `HeroWarriorCanvas.tsx`, `PromoWarriorCanvas.tsx`) enforce the canonical Khronos PBR Neutral colour pipeline via `applyCanonicalColorPipeline(renderer)`:

- **Tone Mapping:** `THREE.NeutralToneMapping` (Khronos PBR Neutral — zero hue shift on warm reds, golden crusts, saffron/turmeric glazes, and fresh greens).
- **Output Colour Space:** `THREE.SRGBColorSpace`.
- **Tone Mapping Exposure:** `1.0` (neutral studio/tabletop exposure).
- **Texture Slot Colour Spaces:**
  - Color data slots (`map`, `emissiveMap`): `THREE.SRGBColorSpace`.
  - Non-color linear data slots (`normalMap`, `roughnessMap`, `metalnessMap`, `aoMap`, `bumpMap`): `THREE.NoColorSpace` (Linear).

---

## 2. Phase 7 Dielectric Food PBR Material Calibration (Before vs After)

Organic foods, baked crusts, cheeses, vegetables, sauces, ceramic plates, and glass containers are **dielectrics** (`metallicFactor = 0.0`). Non-zero metallic values darken diffuse albedo and produce unnatural metallic reflections, while ultra-low roughness values (`< 0.10`) produce plastic mirror highlights.

In Phase 7, [scripts/phase7-pbr-calibrate-glbs.mjs](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/scripts/phase7-pbr-calibrate-glbs.mjs) calibrated **30 materials across all 33 binary GLB files** (`11 archetypes × 3 LODs`):

| Archetype | Material Name | Culinary Surface | Phase 6 `metallic` | Phase 7 `metallic` | Phase 6 `roughness` | Phase 7 `roughness` | Visual Impact |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `tandoori-paneer-pizza` | `Mat_Tandoori_Mayo_Drizzle` | Spiced mayo emulsion | 0.0000 | **0.0000** | 0.3800 | **0.3200** | Natural creamy emulsion specular highlight |
| `bbq-chicken-overload` | `Mat_BBQ_V26` | Smoky BBQ glaze drizzle | 0.0000 | **0.0000** | 0.1200 | **0.1400** | Viscous glaze sheen without mirror aliasing |
| `bbq-chicken-overload` | `Mat_Jalapeno_Seed_V26` | Jalapeño seed core | 0.0000 | **0.0000** | 0.2400 | **0.4200** | Matte organic seed texture |
| `classic-smash-burger` & `golden-oak-burger` | `bun_001` | Toasted brioche bun & patty | 0.0000 | **0.0000** | 0.2692 | **0.4400** | Eliminated plastic sheen on brioche bread crust |
| `classic-smash-burger` & `golden-oak-burger` | `lettuce_001` | Ruffled green leaf lettuce | 0.0740 | **0.0000** | 0.2944 | **0.4200** | Removed metallic tint; natural crisp leaf lamina |
| `classic-smash-burger` & `golden-oak-burger` | `vegies_001` | Vine tomato & pickles | 0.1181 | **0.0000** | 0.4455 | **0.3800** | Removed 11.8% metallic artifact; moist cut tomato |
| `crispy-paneer-burger` | `bun_001` | Brioche bun crown & heel | 0.0000 | **0.0000** | 0.3500 | **0.4400** | Warm baked bread crust finish |
| `crispy-paneer-burger` | `Mat_Cheddar_Gourmet_V33` | Melted cheddar slice | 0.0000 | **0.0000** | 0.1000 | **0.3000** | Fixed mirror-plastic cheese -> warm dairy melt |
| `crispy-paneer-burger` | `Mat_Sweet_Chili_V33` | Sweet chili glaze | 0.0000 | **0.0000** | 0.0200 | **0.1400** | Fixed 0.02 mirror glass -> realistic sauce gloss |
| `crispy-paneer-burger` | `Mat_Chutney_Liquid_V33` | Mint coriander chutney | 0.0000 | **0.0000** | 0.1800 | **0.2200** | Herb puree micro-roughness |
| `crispy-paneer-burger` | `Mat_Panko_Photo_Clean_V33` | Fried panko paneer crust | 0.0000 | **0.0000** | 0.5000 | **0.5800** | Crispy golden panko crumb scatter |
| `crispy-paneer-burger` | `Mat_Carrot_V33` | Julienned carrot slaw | 0.0000 | **0.0000** | 0.1200 | **0.3400** | Fixed wet-plastic carrot -> fresh dressed slaw |
| `wok-tossed-chow-mein` | `Mat_Cabbage` | Stir-fried napa cabbage | 0.0000 | **0.0000** | 0.1800 | **0.3400** | Natural wok-tossed vegetable leaf |
| `wok-tossed-chow-mein` | `Mat_Carrot` | Wok-tossed carrot | 0.0000 | **0.0000** | 0.1600 | **0.3200** | Balanced vegetable sheen |
| `wok-tossed-chow-mein` | `Mat_SauteedOnion` | Caramelized onion | 0.0000 | **0.0000** | 0.1200 | **0.2800** | Translucent sautéed allium finish |
| `wok-tossed-chow-mein` | `Mat_ScallionCore` | Scallion white stem | 0.0000 | **0.0000** | 0.1800 | **0.3500** | Fibrous scallion ring texture |
| `wok-tossed-chow-mein` | `Mat_ScallionGreen` | Scallion green top | 0.0000 | **0.0000** | 0.2000 | **0.3800** | Fresh cut herb top |
| `wok-tossed-chow-mein` | `Mat_SesameSeed` | Toasted sesame seeds | 0.0000 | **0.0000** | 0.2200 | **0.4800** | Matte toasted seed hull |
| `dynamite-chilli-potatoes` | `M_Diced_Pepper_Yellow_v60.001` | Diced yellow bell pepper | 0.0000 | **0.0000** | 0.0500 | **0.2600** | Fixed 0.05 mirror -> roasted pepper skin |
| `dynamite-chilli-potatoes` | `M_Diced_Pepper_Red_v60.001` | Diced red bell pepper | 0.0000 | **0.0000** | 0.0500 | **0.2600** | Fixed 0.05 mirror -> roasted pepper skin |
| `dynamite-chilli-potatoes` | `M_Diced_Pepper_Green_v60.001` | Diced green bell pepper | 0.0000 | **0.0000** | 0.0500 | **0.2600** | Fixed 0.05 mirror -> roasted pepper skin |
| `dynamite-chilli-potatoes` | `M_Toasted_Sesame_v60.001` | Toasted sesame garnish | 0.0000 | **0.0000** | 0.4200 | **0.4800** | Matte toasted sesame seed |
| `gourmet-wok-bowl` | `Mat_Ceramic_Plate` / `Mat_Glossy_Sauce` | Ceramic bowl & glaze | 0.04 / 0.02 | **0.0000** | 0.16 / 0.12 | **0.18 / 0.14** | Pure dielectric ceramic & glaze |
| `kaffir-lime-mocktail` | `Mat_Glass_Container` / `Mat_Beverage_Liquid` | Highball glass & cooler | 0.06 / 0.00 | **0.0000** | 0.06 / 0.08 | **0.08 / 0.12** | Pure dielectric glass & liquid |

---

## 3. Texture Resolution & Compression Tiers Across LODs

| LOD Profile | Max Texture Dimension | Format | Texture VRAM Range (Authentic Dishes) | Target Device Tier |
| :--- | :---: | :---: | :---: | :--- |
| **High Fidelity (`-high.glb`)** | `1024×1024` – `2048×2048` | Embedded JPEG / PNG (sRGB BaseColor, Linear Normal/ORM) | `4.61 MB` – `33.07 MB` | Desktop, iPad Pro, 8GB+ Flagship Android / Recent iPhone |
| **Balanced (`-balanced.glb`)** | `512×512` – `1024×1024` | Embedded JPEG / PNG | `1.78 MB` – `11.34 MB` | 6GB Mid-Range Android, 4GB Android (when safe), Standard iPhone |
| **Ultra-Light (`-ultralight.glb`)** | `256×256` – `512×512` | Embedded JPEG / PNG | `0.45 MB` – `3.14 MB` | 2GB Low-End Android, 4GB Initial Paint, Thermal/Memory Fallback |
| **iOS Quick Look (`.usdz`)** | `256×256` – `512×512` | Packed `textures/*.jpg` (JPEG Q85) | `0.35 MB` – `2.80 MB` | iPhone / iPad Safari Native AR Quick Look |
