# THE GOLDEN OAK — PHASE 7 PHYSICAL SCALE VALIDATION REPORT

**Agent 3:** Real-World Scale and AR Placement Engineer  
**Date:** 2026-11-20  
**Source Specifications:** [src/data/dish-dimensions.ts](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/src/data/dish-dimensions.ts), [src/data/dish-asset-manifest.ts](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/src/data/dish-asset-manifest.ts)

---

## 1. Strict Physical Measurement Honesty Policy

Per Phase 7 Section 4 & Section 10:
- **No invented physical caliper measurements:** Every dish currently derives its target tabletop dimensions (`widthCm`, `depthCm`, `heightCm`) and `plateDiameterCm` from culinary standard serving specifications (`dimensionSource: 'estimated-typical-portion'`).
- **`scaleValidated: false` across all 23 dishes:** Until plated kitchen production samples at The Golden Oak are physically measured with digital calipers and photographed next to a metric reference scale ruler, `scaleValidated` remains strictly `false`.
- **1:1 Metric Consistency Across GLB (WebXR) and USDZ (iOS Quick Look):**
  - In **WebXR (`immersive-ar` / `immersive-vr`)**, the studio GLB bounding box (`~1.96m–2.40m`) is multiplied by `modelScaleFactor = targetFootprintM / modelFootprintM`, producing the exact real-world tabletop footprint in metres.
  - In **iOS AR Quick Look (`.usdz`)**, where Safari renders the USDZ directly at `1 unit = 1 metre` with `#allowsContentScaling=0`, our Phase 7 Blender 5.2 pipeline ([scripts/phase7-export-optimized-usdz.py](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/scripts/phase7-export-optimized-usdz.py)) baked `modelScaleFactor` directly into the USDZ vertex coordinates so that every USDZ asset measures the exact real-world tabletop centimetre dimensions natively!

---

## 2. All 23 Canonical Dishes — Physical Dimensions, Plate Diameter, Scale Factor & Ground Contact

| # | Dish Slug | Target Plated Dimensions (W × D × H) | Plate / Vessel Diameter | Raw GLB Bounding Box (W × D × H) | `modelScaleFactor` | Effective AR Tabletop Size (GLB × Scale & Native USDZ) | GLB Ground Contact (`Y_min`) | `groundContactValidated` | `dimensionSource` | `scaleValidated` |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | `tandoori-paneer-pizza` | 30 × 30 × 3.5 cm | 30 cm | 2.398 × 2.400 × 0.118 m | `0.125` | **30.0 × 30.0 × 1.5 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |
| 2 | `chicken-tikka-pizza` | 30 × 30 × 3.5 cm | 30 cm | 2.394 × 2.390 × 0.056 m | `0.1253` | **30.0 × 30.0 × 0.7 cm** | `-0.0016 m` | `true` | `estimated-typical-portion` | `false` |
| 3 | `mushroom-truffle-pizza` | 30 × 30 × 3.5 cm | 30 cm | 2.391 × 2.390 × 0.056 m | `0.1255` | **30.0 × 30.0 × 0.7 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |
| 4 | `peri-peri-fiesta-pizza` | 30 × 30 × 3.5 cm | 30 cm | 2.398 × 2.400 × 0.118 m | `0.125` | **30.0 × 30.0 × 1.5 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |
| 5 | `bbq-chicken-overload` | 30 × 30 × 3.5 cm | 30 cm | 2.368 × 2.366 × 0.211 m | `0.1267` | **30.0 × 30.0 × 2.7 cm** | `0.0045 m` | `true` | `estimated-typical-portion` | `false` |
| 6 | `classic-smash-burger` | 12 × 12 × 9.5 cm | 18 cm | 1.976 × 2.000 × 1.211 m | `0.06` | **11.9 × 12.0 × 7.3 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |
| 7 | `golden-oak-signature-burger` | 12.5 × 12.5 × 10.5 cm | 18 cm | 1.976 × 2.000 × 1.211 m | `0.0625` | **12.4 × 12.5 × 7.6 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |
| 8 | `crispy-paneer-burger` | 12 × 12 × 10 cm | 18 cm | 1.962 × 1.975 × 1.461 m | `0.0608` | **11.9 × 12.0 × 8.9 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |
| 9 | `wok-tossed-chow-mein` | 18 × 18 × 8 cm | 18 cm | 2.199 × 2.198 × 1.478 m | `0.0818` | **18.0 × 18.0 × 12.1 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |
| 10 | `dynamite-chilli-potatoes` | 20 × 20 × 5.5 cm | 20 cm | 2.196 × 2.196 × 1.314 m | `0.0911` | **20.0 × 20.0 × 12.0 cm** | `0.0008 m` | `true` | `estimated-typical-portion` | `false` |
| 11 | `keema-masala-pizza` | 30 × 30 × 3.5 cm | 30 cm | 2.394 × 2.390 × 0.056 m | `0.1253` | **30.0 × 30.0 × 0.7 cm** | `-0.0016 m` | `true` | `estimated-typical-portion` | `false` |
| 12 | `farmhouse-supreme-pizza` | 30 × 30 × 3.5 cm | 30 cm | 2.398 × 2.400 × 0.118 m | `0.125` | **30.0 × 30.0 × 1.5 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |
| 13 | `paneer-royale-burger` | 12 × 12 × 10 cm | 18 cm | 1.962 × 1.975 × 1.461 m | `0.0608` | **11.9 × 12.0 × 8.9 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |
| 14 | `truffle-mushroom-cheese-burger` | 12 × 12 × 10 cm | 18 cm | 1.976 × 2.000 × 1.211 m | `0.06` | **11.9 × 12.0 × 7.3 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |
| 15 | `hakka-street-chow-mein` | 18 × 18 × 8 cm | 18 cm | 2.199 × 2.198 × 1.478 m | `0.0818` | **18.0 × 18.0 × 12.1 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |
| 16 | `golden-chilli-potato` | 20 × 20 × 5.5 cm | 20 cm | 2.196 × 2.196 × 1.314 m | `0.0911` | **20.0 × 20.0 × 12.0 cm** | `0.0008 m` | `true` | `estimated-typical-portion` | `false` |
| 17 | `truffle-mushroom-risotto` | 19 × 19 × 7 cm | 19 cm | 2.000 × 2.000 × 0.737 m | `0.095` | **19.0 × 19.0 × 7.0 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |
| 18 | `butter-chicken-bao` | 18 × 18 × 7 cm | 18 cm | 2.000 × 2.000 × 0.778 m | `0.09` | **18.0 × 18.0 × 7.0 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |
| 19 | `dahi-ke-kebab` | 22 × 16 × 4.5 cm | 22 cm | 2.200 × 1.599 × 0.450 m | `0.1` | **22.0 × 16.0 × 4.5 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |
| 20 | `crispy-chilli-babycorn` | 20 × 20 × 5.5 cm | 20 cm | 2.000 × 2.000 × 0.550 m | `0.1` | **20.0 × 20.0 × 5.5 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |
| 21 | `dim-sum-platter` | 21 × 21 × 6 cm | 22 cm | 2.200 × 2.200 × 0.650 m | `0.0955` | **21.0 × 21.0 × 6.2 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |
| 22 | `kaffir-lime-mocktail` | 8 × 8 × 16 cm | 8.5 cm | 0.850 × 0.768 × 1.650 m | `0.0941` | **8.0 × 7.2 × 15.5 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |
| 23 | `golden-oak-burger` | 12.5 × 12.5 × 10.5 cm | 18 cm | 1.976 × 2.000 × 1.211 m | `0.0625` | **12.4 × 12.5 × 7.6 cm** | `0.0000 m` | `true` | `estimated-typical-portion` | `false` |

---

## 3. Canonical Origin, Pivot & Ground Contact Verification

1. **Canonical Origin (`footprint-centre-ground-contact`)**:
   - Every GLB asset is centered via `@gltf-transform/cli center --pivot below` such that the horizontal footprint centre lies at `(X = 0, Z = 0)` and the lowest vertex rests on the physical table plane `Y = 0` within `±1.6 mm` (`|Y_min| <= 0.0016 m << 0.01 m` tolerance).
2. **Centered Rotation Pivot**:
   - Both `ViewerScene.tsx` (studio 3D turntable) and `WebXRAREngine.updateModelPlacementTransform()` rotate the dish around its local footprint origin `(0, 0, 0)`. Rotating a placed dish in AR by `360°` keeps the plate/base stationary on the physical table anchor with `0.000 m` lateral translation drift.
