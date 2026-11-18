# THE GOLDEN OAK — PHASE 5 SHARED CONTRACT (Lead Orchestrator)

Workspace: `C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak` · Git checkpoint: `pre-phase5-checkpoint` · Baseline: `572/572` tests, `0` tsc errors, `0` eslint errors.
**Baseline production server (pre-Phase-5 build) is running at `http://localhost:3000`** — use it for BEFORE measurements. Do not stop it. The Lead rebuilds at the end for AFTER measurements.

## 0. Lead discovery findings (verified by code inspection)
1. **No VR implementation exists.** Zero references to `immersive-vr` in `src/`. Any VR claim in earlier reports is unbacked.
2. **Colour pipeline is inconsistent across renderers.**
   - `ViewerScene.tsx` (~L274-299): `ACESFilmicToneMapping` + per-tier `toneMappingExposure` (colour depends on device tier).
   - `Restaurant3DFloorplan.tsx` (~L1154): ACES + tier exposure.
   - `src/lib/xr/webxr-ar-engine.ts`: no tone mapping set → three default `NoToneMapping` → AR shows different colours than the 3D viewer.
   - `ARScene.tsx` (R3F): R3F default ACES.
   ACES shifts hue/desaturates food (reds→orange, yellows washed out).
3. **`src/lib/three/food-materials.ts` modifies food appearance:** adds an artificial `emissive = warmScatterHex` (~L462) to food (adds light that isn't in the scene → washed out/glowing), clearcoat up to 0.6 (plastic shine), sheen, `envMapIntensity` up to 1.45. Must be audited against reference photos.
4. **Phase 3.2 LOD budgets are violated:** `bbq-chicken-overload` balanced 44,032 / ultra-light 42,416 tris; `crispy-paneer-burger` balanced 35,302 / ultra-light 33,112 tris (ultra-light target 5.5K–9.5K). "Ultra-light" is barely lighter than "high" for these dishes.
5. **Phase 4 benchmark history is not backed by measurement artifacts.** `docs/phase4/PHASE4_BEFORE_AFTER_BENCHMARKS.json` lists per-phase LCP values (1850/1280/1120/890 ms) labelled `browser-emulated` with no script output proving them. Phase 5 must replace them with numbers produced by a committed script run in this session.
6. Reference food photos exist in `dish_images_named/` (use for colour validation).

## 1. Canonical shared modules (import, never fork)
| Concern | Single source of truth |
|---|---|
| Coordinates / scale / placement types | `src/lib/xr/spatial-contract.ts` (1 unit = 1 m, +Y up, origin = footprint centre at ground contact) |
| Colour pipeline | `src/lib/three/color-pipeline.ts` — `applyCanonicalColorPipeline(renderer)`, `CANONICAL_R3F_GL_PROPS`, `TEXTURE_SLOT_COLOR_SPACE`, `auditSceneTextureColorSpaces` (Khronos PBR Neutral, sRGB out, exposure 1.0 everywhere, no tier-dependent exposure) |
| Performance telemetry | `src/lib/three/perf-telemetry.ts` — `perfMark`, `perfCount`, `perfDuration`, `perfSnapshot` → `window.__GOLDEN_OAK_PERF__` |
| Device profiling | `src/lib/three/device-capabilities.ts` → `quality-manager.ts` → `src/lib/xr/ar-quality-profile.ts` (XR). No new profiling engine. |
| Model loading / caching / disposal | `src/lib/three/progressive-asset-loader.ts`, `texture-loader.ts`, `resource-disposal.ts`. No second loader engine. One shared GLTFLoader+DRACOLoader+KTX2Loader instance set per renderer. |
| Dish asset manifest | `src/data/dish-asset-manifest.ts` (+ `docs/phase5/dish-asset-manifest.json`) — produced by Agent 2's script; consumed by everyone. Physical dims stay in `src/data/dish-dimensions.ts`. |

## 2. Ownership (edit only your files; message the owner otherwise)
| Agent | ID | Files | Reports (`docs/phase5/`) |
|---|---|---|---|
| A1 AR Engine & Tracking | `701cdc0e-7a02-4d03-a457-14a9c809544a` | `src/lib/xr/webxr-session.ts`, `webxr-ar-engine.ts`, `placement-math.ts`, `placement-reticle.ts`, `src/components/ar/**` EXCEPT `ARScene.tsx`, `src/lib/three/ar-capabilities.ts`, `src/app/ar/**` | `PHASE5_AR_ENGINE_AUDIT.md`, `PHASE5_AR_STARTUP_BENCHMARKS.json` |
| A2 Food Models & Colour | `c5e9bd81-b621-4998-9bca-d60b78bf154a` | `public/models/optimized/**`, `src/data/model-config.ts`, `src/data/dish-dimensions.ts`, `src/data/dish-asset-manifest.ts`, `src/lib/three/food-materials.ts`, `src/components/viewer/warrior-materials.ts`, `scripts/phase5-*asset*.mjs`, `scripts/phase5-*color*.mjs` | `PHASE5_3D_DISH_ASSET_AUDIT.md`, `PHASE5_DISH_COLOR_AND_SCALE_VALIDATION.md` |
| A3 Adaptive Perf & VR | `74a836c8-3af1-4471-9990-26d92a0c37aa` | `src/lib/three/device-capabilities.ts`, `quality-manager.ts`, `progressive-asset-loader.ts`, `texture-loader.ts`, `resource-disposal.ts`, `src/hooks/useQualityTier.ts`, `src/lib/xr/ar-quality-profile.ts`, `src/components/viewer/**` (incl. `ViewerScene.tsx`), `src/components/ar/ARScene.tsx`, new VR files `src/lib/xr/webxr-vr-*.ts`, `src/components/viewer/VR*.tsx` | `PHASE5_ADAPTIVE_DEVICE_PROFILES.md`, `PHASE5_VR_PERFORMANCE_REPORT.md`, `PHASE5_MEMORY_AND_GPU_REPORT.md` |
| A4 3D Booking | `9909f45e-f0de-472a-833a-29da2cccd9ac` | `src/components/booking/**`, `src/lib/constants/restaurant3DMapping.ts`, `src/app/booking/**`, read-only `convex/tables.ts` / `convex/bookings.ts` (propose backend edits to Lead) | `PHASE5_3D_BOOKING_OPTIMIZATION.md` |
| A5 QA / Cross-device | `b50b6e55-cf9b-46e3-bc2a-4f68b3b12a67` | `tests/phase5-*.test.mjs`, `scripts/phase5-measure-*.mjs`, `docs/phase5/PHASE5_BASELINE_MEASUREMENTS.json`, `docs/phase5/PHASE5_AFTER_MEASUREMENTS.json` | `PHASE5_ANDROID_DEVICE_TESTS.md`, `PHASE5_IOS_DEVICE_TESTS.md`, `PHASE5_WINDOWS_TESTS.md` |
| Lead | `22cb5c35-3043-4ba7-a662-5d1b3225baa2` | `spatial-contract.ts`, `color-pipeline.ts`, `perf-telemetry.ts`, builds, server, commits | `PHASE5_FINAL_ACCEPTANCE_REPORT.md` |

## 3. Rules
- Do NOT run `npm run build`, `npm start`, `npm run dev`, `git commit/push`. Do NOT stop the server on :3000. You MAY run `npx tsc --noEmit`, `npx eslint <files>`, `node --test <files>`, and read-only puppeteer measurements against `http://localhost:3000`.
- Keep all existing tests green. If an old test encodes behaviour we are deliberately correcting (e.g. asserts ACES, tier exposure, emissive warm scatter, the old LOD numbers), report it to the Lead with the reason BEFORE changing it.
- Evidence labels on every number: `physically-measured` | `browser-emulated` | `automated` | `estimated` | `not-tested`. The Windows host running headless Chromium is a real Windows machine: label host-browser timings `physically-measured (Windows host, <GPU renderer string>)` only if you record the actual WebGL renderer string; if it is SwiftShader/software, say so. No physical Android/iOS devices or VR headsets are connected → those cells are `not-tested` with an exact protocol.
- Never: camera overlay presented as AR; per-device scale changes; exposure/saturation hacks to hide decoding bugs; decimation that destroys recognisable food; loading all dish models at once.
- Instrument with `perfMark` from `perf-telemetry.ts` (network, decode, GPU upload, tracking measured separately).
- When done, reply to the Lead with: files changed, root causes found (symptom → cause → file:line → fix), verification commands + results, open risks.
