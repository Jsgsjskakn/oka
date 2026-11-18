# THE GOLDEN OAK — PHASE 6
## REAL DEVICE VALIDATION, AR ACCURACY & PRODUCTION SIGN-OFF REPORT

**Lead QA Architect & AR/VR Performance Engineer:** Gemini 4 Argon  
**Coordination Roster:** Lead Orchestrator + 6 Specialized Phase 6 Agents (+ 7th Phase 5 Continuity & Regression Guard)  
**Git Safety Checkpoint:** `pre-phase6-checkpoint` (`8d4d95d`)  
**Canonical Upper-Case Provenance Labels:** `PHYSICALLY-MEASURED` · `BROWSER-EMULATED` · `AUTOMATED` · `ESTIMATED` · `NOT-TESTED`

---

## 1. Executive Production Sign-Off Verdict (Final Acceptance Rule)

> **FINAL PHASE 6 SIGN-OFF STATUS: CODE, ARCHITECTURE, 3D/AR/VR ENGINES, CANONICAL COLOUR PIPELINE & FULL REGRESSION SUITE VERIFIED (`673 / 673` Automated Tests Passing, `0` TypeScript Errors, `0` ESLint Errors) — FULL UNCONDITIONAL PRODUCTION READINESS IS WITHHELD PENDING PHYSICAL ANDROID/iOS TABLETOP AR TESTING, PHYSICAL VR HEADSET TESTING, AND PHYSICAL CALIPER DISH SCALE VALIDATION (`NOT-TESTED`)**

In strict adherence to the Phase 6 Final Acceptance Rule (*"Do not declare full production readiness while critical physical-device AR placement, tracking stability, dish scale or VR validation remains untested. Preserve working Phase 5 systems. Fix only verified defects. No fabricated benchmarks, no false PASS statuses, and no unnecessary redesign"*):

1. **Why Unconditional Production Sign-Off Is Formally Withheld (`NOT-TESTED` Gates):**
   - **Gate 1 — Physical Android ARCore & iOS ARKit Tabletop Testing (`NOT-TESTED`):** Zero physical Android handsets (`2GB / 4GB / 6GB / 8GB+`) or Apple devices (`Older iPhone / Recent iPhone / iPad`) are attached to this CI workstation (`adb devices` not available). All browser/CDP mobile viewport and mocked WebXR tests are classified as **`BROWSER-EMULATED`** or **`AUTOMATED`**, never converted into a physical-device `PASS`.
   - **Gate 2 — Physical VR Headset Testing (`NOT-TESTED`):** Zero physical VR headsets (`Meta Quest 3`, `Apple Vision Pro`) are attached to this CI workstation. WebXR `immersive-vr` session initiation, `y = 0.75m` dining pedestal placement, and single-context R3F suspension are verified as **`AUTOMATED`**, while physical HMD stereo frame timing and optical comfort remain **`NOT-TESTED`**.
   - **Gate 3 — Physical Plated Dish Scale Caliper Verification (`ESTIMATED` / `scaleValidated: false`):** All 23 dish configurations in `src/data/dish-dimensions.ts` and `src/data/dish-asset-manifest.ts` use `dimensionSource: 'estimated-typical-portion'` (`ESTIMATED`) and explicitly carry **`scaleValidated: false`** until physical kitchen caliper measurements against an ISO/IEC 7810 ID-1 credit-card / ruler reference are recorded.
   - **Gate 4 — 6 Untextured `gourmet-wok-bowl` Placeholders & 3 Cross-Recipe Stand-Ins (`colorValidated: false`):** While 14 menu dishes have authentic dish-specific textured 3D models (`colorValidated: true`), 6 dishes (`truffle-mushroom-risotto`, `butter-chicken-bao`, `dahi-ke-kebab`, `crispy-chilli-babycorn`, `dim-sum-platter`, and procedural `sizzling-manchurian` / `kaffir-lime-mocktail`) have `0` embedded textures (`isSharedPlaceholder: true`, `colorValidated: false`), and 3 dishes (`pepperoni-blast`, `farmhouse-veggie`, `truffle-mushroom-cheese-burger`) share another recipe's geometry/textures (`isSharedPlaceholder: true`, `colorValidated: false`).

2. **What Is 100% Verified & Signed Off Today (`PHYSICALLY-MEASURED` / `AUTOMATED` / `BROWSER-EMULATED`):**
   - **Mandatory Phase 5 Continuity (Section 1):** All 10 Phase 5 core systems are preserved intact (`673 / 673` tests passing across `94` suites, `0` failures).
   - **3 Verified Phase 5 Defects Fixed (`P6-01`, `P6-02`, `P6-03`):**
     - **Defect P6-01 (`scripts/phase5-build-dish-manifest.mjs`, `src/data/dish-asset-manifest.ts`, `src/data/dish-dimensions.ts`):** Eliminated the false `scaleValidated: true` and legacy `cfg.arScale` (`0.18`) bug; enforced `modelScaleFactor = targetFootprintM / modelFootprintM`, bound `scaleValidated: false` (`dimensionSource: 'estimated-typical-portion'`), and set `colorValidated: false` on all 6 untextured placeholders and 3 cross-recipe stand-ins.
     - **Defect P6-02 (`src/lib/xr/webxr-ar-engine.ts`):** Decoupled inner child `loadedModelRoot` (`scale` + `offset`) from outer `modelContainer` (`rotation.y = userYawRad`, `position = (0,0,0)`), eliminating orbital arc swing when rotating off-center raw meshes; updated `this.modelUrl = targetModelUrl` on `upgradeLod`; and emitted `perfMark('ar:session-ended')` in `handleSessionEnd`.
     - **Defect P6-03 (`src/lib/xr/webxr-vr-viewer.ts`):** Negotiated `local-floor -> local` reference space and called `renderer.xr.setReferenceSpaceType(...)` **before** `await renderer.xr.setSession(session)`, and removed the unused `refSpace` variable (`0` ESLint warnings).

---

## 2. All 8 Required Phase 6 Deliverables Index

| # | Deliverable File | Owner | Provenance & Verification Status |
| :- | :--- | :--- | :--- |
| 1 | [`docs/phase6/PHASE6_ANDROID_PHYSICAL_TESTS.md`](./PHASE6_ANDROID_PHYSICAL_TESTS.md) | Agent 1 (`74a836c8`) | `PHYSICALLY-MEASURED` (Host Draco/GLB) · `BROWSER-EMULATED` · `AUTOMATED` · `NOT-TESTED` (Physical Android phones) |
| 2 | [`docs/phase6/PHASE6_IOS_PHYSICAL_TESTS.md`](./PHASE6_IOS_PHYSICAL_TESTS.md) | Agent 2 (`ff968476`) | `PHYSICALLY-MEASURED` (Binary USDZ) · `BROWSER-EMULATED` · `AUTOMATED` · `NOT-TESTED` (Physical iPhone/iPad) |
| 3 | [`docs/phase6/PHASE6_AR_TRACKING_VALIDATION.md`](./PHASE6_AR_TRACKING_VALIDATION.md) | Agent 3 (`701cdc0e`) | `AUTOMATED` (`23/23` AR tracking tests pass, Defect P6-02 fixed) · `NOT-TESTED` (Physical tabletop SLAM) |
| 4 | [`docs/phase6/PHASE6_VR_DEVICE_VALIDATION.md`](./PHASE6_VR_DEVICE_VALIDATION.md) | Agent 4 (`9909f45e`) | `AUTOMATED` (`18/18` VR tests pass, Defect P6-03 fixed) · `NOT-TESTED` (Physical Quest 3 / Vision Pro) |
| 5 | [`docs/phase6/PHASE6_DISH_SCALE_COLOUR_AUDIT.md`](./PHASE6_DISH_SCALE_COLOUR_AUDIT.md) | Agent 5 (`c5e9bd81`) | `PHYSICALLY-MEASURED` (GLB/USDZ/Draco) · `AUTOMATED` (Defect P6-01 fixed) · `ESTIMATED` (`scaleValidated: false`) |
| 6 | [`docs/phase6/PHASE6_PERFORMANCE_COMPARISON.json`](./PHASE6_PERFORMANCE_COMPARISON.json) | Agent 6 (`b50b6e55`) | `PHYSICALLY-MEASURED` · `BROWSER-EMULATED` · `AUTOMATED` · `ESTIMATED` · `NOT-TESTED` |
| 7 | [`docs/phase6/PHASE6_REGRESSION_REPORT.md`](./PHASE6_REGRESSION_REPORT.md) | Agent 6 (`b50b6e55`) | `AUTOMATED` (`673 / 673` tests passing across `94` suites, `0` failures) |
| 8 | [`docs/phase6/PHASE6_FINAL_PRODUCTION_SIGNOFF.md`](./PHASE6_FINAL_PRODUCTION_SIGNOFF.md) | Lead QA Architect | Final Sign-Off Synthesis |

---

## 3. Section 1 Mandatory Phase 5 Continuity Verification Matrix

| # | Preserved Phase 5 System | Module Path | Phase 6 Continuity Status | Provenance Label |
| :- | :--- | :--- | :--- | :--- |
| 1 | **Unified Colour Pipeline** | [`src/lib/three/color-pipeline.ts`](../../src/lib/three/color-pipeline.ts) | **INTACT (`PASS`)** — Khronos PBR Neutral (`NeutralToneMapping`), `SRGBColorSpace`, fixed `1.0` exposure across all 5 renderers. | `AUTOMATED` |
| 2 | **Dish-Specific Asset Manifest** | [`src/data/dish-asset-manifest.ts`](../../src/data/dish-asset-manifest.ts) | **INTACT + DEFECT P6-01 FIXED (`PASS`)** — All 23 dishes carry exact `modelScaleFactor`, `dimensionSource: 'estimated-typical-portion'`, `scaleValidated: false`, and honest `colorValidated` flags (`14` `true`, `9` `false`). | `PHYSICALLY-MEASURED` + `AUTOMATED` |
| 3 | **Balanced & Ultra-Light LODs** | `public/models/optimized/*.glb` | **INTACT (`PASS`)** — `bbq-chicken-overload` (`21,523` Balanced / `8,959` Ultra-Light tris) and `crispy-paneer-burger` (`19,560` Balanced / `9,230` Ultra-Light tris) fit tier budgets. | `PHYSICALLY-MEASURED` |
| 4 | **Progressive Model Loading** | [`src/lib/three/progressive-asset-loader.ts`](../../src/lib/three/progressive-asset-loader.ts) | **INTACT (`PASS`)** — 4-stage `ultra-light -> balanced -> high` pipeline, `AbortController` obsolete request cancellation, LRU cache, and residency guard. | `AUTOMATED` |
| 5 | **AR Session & Anchor Management** | [`src/lib/xr/webxr-ar-engine.ts`](../../src/lib/xr/webxr-ar-engine.ts) | **INTACT + DEFECT P6-02 FIXED (`PASS`)** — `local-floor -> local`, viewer-space `hit-test`, $n_y \ge \cos 15^\circ$, `XRAnchor`, decoupled inner/outer yaw pivot, zero-drift `upgradeLod`, and `ar:session-ended` telemetry. | `AUTOMATED` |
| 6 | **VR Immersive Viewer** | [`src/lib/xr/webxr-vr-viewer.ts`](../../src/lib/xr/webxr-vr-viewer.ts) | **INTACT + DEFECT P6-03 FIXED (`PASS`)** — `setReferenceSpaceType` before `setSession`, 1:1 scale on `y = 0.75m` dining pedestal, single WebGL context (`ViewerScene` suspended), fixed foveation, deep disposal. | `AUTOMATED` |
| 7 | **Shared Performance Telemetry** | [`src/lib/three/perf-telemetry.ts`](../../src/lib/three/perf-telemetry.ts) | **INTACT (`PASS`)** — Separates network fetch, Draco decode, GPU upload, scene init, first visible frame, and AR/VR startup in `window.__GOLDEN_OAK_PERF__`. | `AUTOMATED` |
| 8 | **Device-Adaptive Quality Profiles** | [`src/lib/xr/ar-quality-profile.ts`](../../src/lib/xr/ar-quality-profile.ts) | **INTACT (`PASS`)** — Multi-signal GPU + WebGL2 + memory + thermal scoring; RAM never decides alone; iPhone `deviceMemory === undefined` never penalized. | `AUTOMATED` |
| 9 | **3D Booking Floorplan** | [`src/components/booking/Restaurant3DFloorplan.tsx`](../../src/components/booking/Restaurant3DFloorplan.tsx) | **INTACT (`PASS`)** — `52` draw calls (`64` batched meshes), 1:1 backend sync across all 14 tables, 5-min atomic hold, touch-drag guard, `booking3d:*` marks. | `PHYSICALLY-MEASURED` (Windows D3D11) + `AUTOMATED` |
| 10 | **Memory & GPU Disposal** | [`src/lib/three/resource-disposal.ts`](../../src/lib/three/resource-disposal.ts) | **INTACT (`PASS`)** — 12–27 texture slot disposal, Draco/KTX2 worker teardown, `+0.42 MB` heap delta across 50x rapid dish switches, `0` leaked materials. | `AUTOMATED` |

---

## 4. Phase 4 vs Phase 5 vs Phase 6 Separated Performance Comparison (Section 6)

Full dataset: [`docs/phase6/PHASE6_PERFORMANCE_COMPARISON.json`](./PHASE6_PERFORMANCE_COMPARISON.json).
*(Note: Idle `0 FPS` from `frameloop="demand"` is strictly classified as an energy-saving sleep state and is NEVER cited as active rendering performance.)*

| Separated Pipeline Stage / Metric | Phase 4 Verified | Phase 5 Verified | Phase 6 Verified | Provenance Label |
| :--- | ---: | ---: | ---: | :--- |
| **1. Network Transfer (`tandoori-paneer-pizza` Ultra-Light GLB, Localhost)** | `14.2 ms` (`316.9 KB`) | `9.8 ms` (`120.7 KB`) | **`9.6 ms` (`120.7 KB`)** | `PHYSICALLY-MEASURED` (Windows 11 D3D11 Chromium) |
| **2. Model Draco Decoding (`bbq-chicken-overload` Ultra-Light, Host CPU)** | `61.0 ms` (`42,416` tris) | `2.58 ms` (`8,959` tris) | **`2.58 ms` (`8,959` tris — 23.6x faster)** | `PHYSICALLY-MEASURED` (Google `draco3d` WASM) |
| **3. Model Draco Decoding (`crispy-paneer-burger` Ultra-Light, Host CPU)** | `39.0 ms` (`33,112` tris) | `2.50 ms` (`9,230` tris) | **`2.50 ms` (`9,230` tris — 15.6x faster)** | `PHYSICALLY-MEASURED` (Google `draco3d` WASM) |
| **4. GPU Buffer & Texture Upload (`tandoori-paneer-pizza`, Windows D3D11)** | `18.4 ms` | `11.2 ms` | **`11.0 ms`** | `PHYSICALLY-MEASURED` (Windows 11 Intel UHD D3D11) |
| **5. Scene Initialization (`ViewerScene` / `Restaurant3DFloorplan`)** | `42.0 ms` | `28.5 ms` | **`27.9 ms`** | `PHYSICALLY-MEASURED` (Windows 11 Intel UHD D3D11) |
| **6. First Visible 3D Model Frame (`/3d/tandoori-paneer-pizza`, Host)** | `312 ms` | `248 ms` | **`245 ms`** | `PHYSICALLY-MEASURED` (Windows 11 Intel UHD D3D11) |
| **7. First Visible 3D Model Frame (Emulated 2GB Android, 4x CPU Throttle)** | `4,120 ms` | `3,692 ms` | **`3,692 ms`** | `BROWSER-EMULATED` (Headless Chromium 4x CPU Throttle) |
| **8. Active Interactive Rendering FPS (`/3d` & `/booking` Orbit)** | `60.1 FPS` (`16.6 ms`) | `60.5 FPS` (`16.5 ms`) | **`60.6 FPS` (`16.5 ms` active frame time)** | `PHYSICALLY-MEASURED` (Windows 11 Intel UHD D3D11) |
| **9. Demand-Loop Idle Sleep State (Stationary Scene Power Saving)** | `0 FPS` (`isIdle: true`) | `0 FPS` (`isIdle: true`) | **`0 FPS` (`isIdle: true`, ~0.05W idle GPU draw)** | `PHYSICALLY-MEASURED` (Energy-saving sleep state, NOT active FPS) |
| **10. Physical Mobile AR Camera Startup & Real Plane Detection Time** | — | — | **`NOT-TESTED`** | `NOT-TESTED` (Requires physical Android ARCore / iOS ARKit phone) |

---

## 5. Required Actions to Unlock Unconditional Final Production Sign-Off

To transition the 4 remaining `NOT-TESTED` / `ESTIMATED` gates to `PHYSICALLY-MEASURED` `PASS`:
1. **Execute Physical Android Handset Protocol (`PHASE6_ANDROID_PHYSICAL_TESTS.md` Section 8):** Connect physical 2GB, 4GB, 6GB, and 8GB+ Android phones via USB (`adb devices`), open `https://the-golden-oak.vercel.app` in Chrome, inspect `window.__GOLDEN_OAK_PERF__` via `chrome://inspect`, and record real ARCore plane-detection latency, 15-minute tabletop anchor drift, battery discharge (`mAh`), and thermal behavior (`°C`).
2. **Execute Physical iOS Handset Protocol (`PHASE6_IOS_PHYSICAL_TESTS.md` Section 9):** Open `https://the-golden-oak.vercel.app` in Safari on physical iPhone 11/12, iPhone 15/16 Pro, and iPad, launch AR Quick Look (`<a rel="ar">`), verify `#allowsContentScaling=0` 1:1 scale lock and LiDAR plane placement, and record Xcode Instruments memory/thermal telemetry.
3. **Execute Physical VR Headset Protocol (`PHASE6_VR_DEVICE_VALIDATION.md` Section 7):** Open `/3d/tandoori-paneer-pizza` in Meta Quest 3 Browser or Apple Vision Pro Safari, tap **View in VR**, and verify 72Hz/90Hz stereo frame timing and `y = 0.75m` dining pedestal alignment.
4. **Complete Physical Kitchen Caliper Measurement & 9 Remaining Dish Scans (`PHASE6_DISH_SCALE_COLOUR_AUDIT.md`):** Measure plated restaurant dishes with digital calipers to flip `scaleValidated` from `false` (`ESTIMATED`) to `true` (`PHYSICALLY-MEASURED`), and replace the 6 untextured `gourmet-wok-bowl` placeholders and 3 cross-recipe stand-ins with dedicated photogrammetry scans.
