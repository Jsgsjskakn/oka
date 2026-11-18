# THE GOLDEN OAK — PHASE 6 SHARED QA & PRODUCTION SIGN-OFF CONTRACT

**Workspace:** `C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak`  
**Git Safety Checkpoint:** `pre-phase6-checkpoint` (`8d4d95d`)  
**Baseline Test Status:** `648 / 648` tests passing across `94` suites, `0` TypeScript errors, `0` ESLint errors.  
**Live Server:** `http://localhost:3000` (must remain running; do not stop it).

---

## 1. Mandatory Phase 5 Continuity & Bug-Fix-Only Rule
1. **Preserve working Phase 5 implementations:** `src/lib/three/color-pipeline.ts`, `src/data/dish-asset-manifest.ts`, Balanced/Ultra-Light LODs (`public/models/optimized/*.glb`), `src/lib/three/progressive-asset-loader.ts`, `src/lib/xr/webxr-ar-engine.ts`, `src/lib/xr/webxr-vr-viewer.ts`, `src/lib/three/perf-telemetry.ts`, `src/lib/xr/ar-quality-profile.ts`, `src/components/booking/Restaurant3DFloorplan.tsx`, and `src/lib/three/resource-disposal.ts`.
2. **Fix ONLY verified defects discovered during Phase 6 independent inspection:**
   - **Defect P6-01 (`scripts/phase5-build-dish-manifest.mjs` & `src/data/dish-asset-manifest.ts`):**
     - `scaleFactor` previously preferred `cfg.arScale` (`0.18`, a legacy studio turntable factor) over `physicalSpec.modelScaleFactor` (`0.125`), and set `scaleValidated: true` using a loose `0.5..2.0` ratio check even though all 23 dishes in `src/data/dish-dimensions.ts` have `dimensionSource: 'estimated-typical-portion'` and `scaleValidated: false`.
     - `colorValidated` was hardcoded `true` for all 23 dishes, including the 6 untextured `gourmet-wok-bowl` placeholder dishes (`texturesCount === 0`) and 3 cross-recipe stand-in dishes (`pepperoni-blast`, `farmhouse-veggie`, `truffle-mushroom-cheese-burger`).
     - **Required Fix (Agent 5 — Food Asset Scale & Colour Engineer):** Use `physicalSpec.modelScaleFactor` (`targetFootprintM / modelFootprintM`), add `dimensionSource: physicalSpec.dimensionSource`, set `scaleValidated: physicalSpec.scaleValidated` (`false` until physical caliper verification), and set `colorValidated: true` ONLY for the 14 dishes that have embedded textures (`texturesCount > 0`) AND represent their authentic recipe archetype (`colorValidated: false` for the 6 untextured `gourmet-wok-bowl` placeholders and 3 cross-recipe stand-ins).
   - **Defect P6-02 (`src/lib/xr/webxr-ar-engine.ts`):**
     - `updateModelPlacementTransform` applied `position.set(...transform.offset)` and `rotation.y = this.userYawRad` on the same `modelContainer` (`M = T(offset) * R_y(yaw) * S(scale)`), which swings an off-center raw mesh in an arc when rotated instead of rotating around its centered footprint. Apply `scale` and `offset` on the inner model child (`loadedModelRoot`) while keeping `modelContainer.position = (0,0,0)` and `modelContainer.rotation.y = this.userYawRad`.
     - `upgradeLod(targetModelUrl)` did not update `this.modelUrl = targetModelUrl` after a successful swap.
     - `handleSessionEnd()` did not emit `perfMark('ar:session-ended')`.
     - **Required Fix (Agent 3 — ARCore, ARKit & WebXR Tracking Engineer):** Fix all three in `src/lib/xr/webxr-ar-engine.ts` and add unit tests in `tests/phase6-production-signoff.test.mjs`.
   - **Defect P6-03 (`src/lib/xr/webxr-vr-viewer.ts`):**
     - `start()` called `await renderer.xr.setSession(session)` before setting `renderer.xr.setReferenceSpaceType('local-floor' / 'local')` and left an unused `refSpace` variable (ESLint warning at line 325).
     - **Required Fix (Agent 4 — VR Headset Performance Engineer):** Negotiate `local-floor -> local` and call `renderer.xr.setReferenceSpaceType(...)` before `await renderer.xr.setSession(session)`, removing the unused variable warning.

---

## 2. Strict Upper-Case Provenance Labels (Section 8)
Every claim, table row, and metric across all 8 Phase 6 deliverables MUST carry one of the five exact labels:
- **`PHYSICALLY-MEASURED`** — Measured on actual hardware present in this session:
  - Windows 11 workstation with hardware Direct3D11 GPU (`ANGLE (Intel, Intel(R) UHD Graphics (0x0000A78B) Direct3D11 vs_5_0 ps_5_0, D3D11)`) running headless Chromium against `http://localhost:3000`.
  - Binary `.glb` / `.usdz` files on disk and real Google `draco3d` WASM decompression timings on the host CPU.
- **`BROWSER-EMULATED`** — Measured in Chromium with mobile viewport, DPR, user-agent, or mocked WebXR runtime emulation. **NEVER convert `BROWSER-EMULATED` into a physical-device `PASS`!**
- **`AUTOMATED`** — Verified by deterministic Node 24 test suite assertions (`node --test`).
- **`ESTIMATED`** — Analytical GPU VRAM equations and typical restaurant portion dimensions (`dimensionSource: 'estimated-typical-portion'`, `scaleValidated: false`).
- **`NOT-TESTED`** — Physical Android handsets (`2GB / 4GB / 6GB / 8GB+`), physical Apple devices (`Older iPhone / Recent iPhone / iPad`), physical VR headsets (`Meta Quest 3 / Apple Vision Pro`), and physical caliper measurements of plated restaurant food.

---

## 3. Six Specialized Phase 6 Agents (+ 7th Regression & Continuity Integrator)

| Agent | Conversation ID | Phase 6 Role | Owned Deliverable(s) in `docs/phase6/` |
| :--- | :--- | :--- | :--- |
| **Agent 1** | `74a836c8-3af1-4471-9990-26d92a0c37aa` | **Android Physical Device QA Engineer** (2GB, 4GB, 6GB, 8GB+ flagship matrix, Chrome + ARCore Scene Viewer & WebXR, separating `BROWSER-EMULATED` from `NOT-TESTED` physical handsets) | `docs/phase6/PHASE6_ANDROID_PHYSICAL_TESTS.md` |
| **Agent 2** | `ff968476-d175-47db-ab1d-08f871914146` | **iOS Safari and AR Quick Look QA Engineer** (Older iPhone, Recent iPhone, iPad matrix, Safari WebGL, `<a rel="ar"><img /></a>`, `.usdz` `metersPerUnit = 1`, `#allowsContentScaling=0`, separating `BROWSER-EMULATED` from `NOT-TESTED` physical iOS devices) | `docs/phase6/PHASE6_IOS_PHYSICAL_TESTS.md` |
| **Agent 3** | `701cdc0e-7a02-4d03-a457-14a9c809544a` | **ARCore, ARKit and WebXR Tracking Engineer** (Fix Defect P6-02 in `webxr-ar-engine.ts`; verify horizontal plane detection, hit-test placement, persistent `XRAnchor`, tracking loss/recovery, zero-drift `upgradeLod`, reposition/removal, and native vs WebXR vs camera-overlay separation) | `docs/phase6/PHASE6_AR_TRACKING_VALIDATION.md` |
| **Agent 4** | `9909f45e-f0de-472a-833a-29da2cccd9ac` | **VR Headset Performance Engineer** (Fix Defect P6-03 in `webxr-vr-viewer.ts`; verify `immersive-vr` session start, 1:1 metric scale, `y = 0.75m` floor pedestal, single active WebGL context, frame-time stability, safe exit & disposal; Meta Quest 3 & Apple Vision Pro labeled `NOT-TESTED` on physical hardware) | `docs/phase6/PHASE6_VR_DEVICE_VALIDATION.md` |
| **Agent 5** | `c5e9bd81-b621-4998-9bca-d60b78bf154a` | **Food Asset Scale and Colour Validation Engineer** (Fix Defect P6-01 in `scripts/phase5-build-dish-manifest.mjs` & regenerate `src/data/dish-asset-manifest.ts` + `docs/phase5/dish-asset-manifest.json`; validate all 23 dishes for GLB/USDZ dimensions, pivot/ground contact, plate diameter/height, roughness/metallic/sRGB/exposure 1.0, reference photo comparison, keeping unmeasured scale `ESTIMATED` / `scaleValidated: false`) | `docs/phase6/PHASE6_DISH_SCALE_COLOUR_AUDIT.md` |
| **Agent 6** | `b50b6e55-cf9b-46e3-bc2a-4f68b3b12a67` | **Performance, Memory and Regression Auditor** (Compare Phase 4 baseline, Phase 5 measurements, and Phase 6 results separating network transfer, decode, GPU upload, scene init, first visible frame, AR startup, and active vs idle FPS; write `tests/phase6-production-signoff.test.mjs`) | `docs/phase6/PHASE6_PERFORMANCE_COMPARISON.json` & `docs/phase6/PHASE6_REGRESSION_REPORT.md` & `tests/phase6-production-signoff.test.mjs` |
| **Agent 7** | `fc182d0e-aa63-4105-aa26-29210cbed6f9` | **Phase 5 Continuity & Full-Stack Regression Guard** (Verify all 10 Phase 5 systems in Section 1 remain 100% intact with zero regressions across e-commerce, booking, security, and 3D/AR/VR) | Assists Agent 6 & Lead Orchestrator |
| **Lead** | `22cb5c35-3043-4ba7-a662-5d1b3225baa2` | **Lead QA Architect & AR/VR Performance Engineer** (Coordinate all agents, resolve conflicts, verify full test suite/build, and author `docs/phase6/PHASE6_FINAL_PRODUCTION_SIGNOFF.md`) | `docs/phase6/PHASE6_FINAL_PRODUCTION_SIGNOFF.md` |
