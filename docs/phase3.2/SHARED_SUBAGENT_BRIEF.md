# PHASE 3.2 — SHARED BRIEF FOR ALL 5 SUB-AGENTS (from Lead Orchestrator)

Workspace: `C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak` (Next.js 16 + React 19 + three 0.185 + @react-three/fiber 9, Windows/PowerShell). Git checkpoint tag: `pre-phase3.2-checkpoint`.

## Mission
Turn the current fake "AR" (a `getUserMedia` <video> with an R3F canvas on top — dish lives in screen space, follows the phone, floats, and is force-normalised to a 1.4-unit extent in `ARScene.tsx`) into GENUINE world-tracked AR with real table placement, physically correct size, realistic food and ultra-efficient mobile performance.

## Confirmed root causes (Lead audit)
1. No WebXR session exists anywhere. `ar-capabilities.ts` only calls `navigator.xr.isSessionSupported('immersive-ar')`; nothing calls `requestSession`. `/ar/[dishId]` = `CameraFeed.tsx` video + `ARScene.tsx` Canvas with a fixed virtual camera => dish is a screen overlay.
2. "Placement" in `ARScene.tsx` only toggles a `placed` boolean; no hit test, no anchor.
3. `ARScene.tsx` `normalizedARTransform` scales EVERY dish so its max dimension = 1.4 units => no physical scale.
4. `ARViewer.tsx` (~L304-353) uses DeviceMotion as a "surface stability indicator" => fake tracking signal.
5. Platform reality: this is a WEB app (no android/ / ios/ native projects, no Capacitor). Genuine tracking paths available to us:
   - Android Chrome + ARCore: WebXR `immersive-ar` with `hit-test` (+ optional `anchors`, `dom-overlay`, `light-estimation`, `depth-sensing`).
   - Android fallback: Google Scene Viewer intent (`mode=ar_preferred`, `resizable=false` keeps real size).
   - iOS/iPadOS: Safari has NO WebXR immersive-ar. Genuine ARKit only via AR Quick Look (`<a rel="ar">` + USDZ; `#allowsContentScaling=0` keeps real size). A native ARKit app is out of scope for this web repo — say so honestly.
   - Everything else: ordinary 3D viewer; camera preview only as a clearly-labelled NON-tracked last resort.

## Shared contract — MANDATORY
`src/lib/xr/spatial-contract.ts` (Lead owned). 1 unit = 1 metre, +Y up, origin = footprint centre at ground contact (y=0 touches table), ±5% scale tolerance, `ARExperienceRoute`, `XRTrackingState`, `PlacementRecord`, `DishPhysicalSpec`, `computeRealWorldScaleFactor`, `EvidenceLabel`. Import from it; do NOT redefine. If you need a change, message the Lead.

## Cross-agent interfaces (signatures fixed now so you can work in parallel)
- SA2 provides `src/data/dish-dimensions.ts`:
  `export const DISH_PHYSICAL_SPECS: Record<string, DishPhysicalSpec>;`
  `export function getDishPhysicalSpec(dishSlug: string): DishPhysicalSpec;`
- SA2 provides `src/lib/xr/placement-math.ts` (pure, no three import):
  `computeDishPlacementTransform({ bboxMin:[x,y,z], bboxMax:[x,y,z], spec, userScale }): { uniformScale: number; offset: [number,number,number] }` (offset applied to the model inside the anchored group so base is at y=0, footprint centred)
  `isHorizontalSurface(normalY: number): boolean`, `clampUserScale(s: number): number`, `smoothReticlePosition(prev, next, alpha)`.
- SA2 provides `src/lib/xr/placement-reticle.ts`: `createPlacementReticle(): { object: THREE.Object3D; setState(s: 'scanning'|'surface-detected'|'hidden'): void; update(dtSeconds: number): void; dispose(): void }` (premium minimal gold ring, subtle scanning pulse, no neon).
- SA4 provides `src/lib/xr/ar-quality-profile.ts`:
  `resolveXRSessionQualityProfile(input): XRSessionQualityProfile` (fields at minimum: `profile: 'ultra-light'|'balanced'|'high-fidelity'`, `framebufferScaleFactor`, `foveation`, `shadowTechnique: 'contact-blob'|'contact-shadow-texture'|'shadow-map'`, `textureMaxDimension`, `lodTier`, `useLightEstimation`, `maxConcurrentDishes`)
  `class XRFrameTimeMonitor { constructor(opts); sample(frameTimeMs: number, nowMs: number): { action: 'hold'|'degrade'|'recover'; profile } }` — tracking stability > visual effects, hysteresis, no oscillation.
- SA1 provides the WebXR engine (`src/lib/xr/webxr-ar-engine.ts`, vanilla three `WebGLRenderer` with `xr.enabled`, NOT the R3F demand loop) + React wrapper `src/components/ar/WebXRARExperience.tsx`, and consumes SA2/SA4 modules above.

## File ownership (edit ONLY your files; ask the owner otherwise)
- SA1 Tracking: `src/lib/xr/webxr-session.ts`, `src/lib/xr/webxr-ar-engine.ts`, `src/components/ar/WebXRARExperience.tsx`, `src/components/ar/ARTrackingStatus.tsx`, `src/components/ar/ARViewer.tsx`, `src/components/ar/ARHeader.tsx`, `src/components/ar/ARControls.tsx`, `src/lib/three/ar-capabilities.ts`, `docs/phase3.2/PHASE3_2_AR_TRACKING_IMPLEMENTATION.md`, input section for `PHASE3_2_AR_ARCHITECTURE_AUDIT.md` (send to Lead).
- SA2 Placement/Dimensions: `src/data/dish-dimensions.ts`, `src/lib/xr/placement-math.ts`, `src/lib/xr/placement-reticle.ts`, `src/components/ar/ARScene.tsx` (remove the 1.4 normalisation; real-size only), `scripts/phase3-2-measure-dish-dimensions.mjs`, `docs/phase3.2/PHASE3_2_DISH_DIMENSION_VALIDATION.json`.
- SA3 Food assets: `public/models/optimized/**` (never modify the 8 originals in `public/models/*.glb` root — tests guard them), `src/data/model-config.ts` (mappings), `scripts/phase3-2-optimize-dish-assets.mjs`, `docs/phase3.2/PHASE3_2_DISH_ASSET_OPTIMIZATION_REPORT.md`.
- SA4 Performance: `src/lib/xr/ar-quality-profile.ts`, `scripts/phase3-2-benchmarks.mjs`, `docs/phase3.2/PHASE3_2_PERFORMANCE_BENCHMARKS.json`. Read-only use of `src/lib/three/device-capabilities.ts`, `quality-manager.ts`, `src/hooks/useQualityTier.ts` (propose edits to Lead).
- SA5 QA: `tests/phase3-2-*.test.mjs`, `docs/phase3.2/PHASE3_2_ANDROID_DEVICE_TEST_REPORT.md`, `docs/phase3.2/PHASE3_2_IOS_DEVICE_TEST_REPORT.md`, `docs/phase3.2/PHASE3_2_REGRESSION_TEST_REPORT.md`.
- Lead: `src/lib/xr/spatial-contract.ts`, final integration, `PHASE3_2_AR_ARCHITECTURE_AUDIT.md`, `PHASE3_2_FINAL_PRODUCTION_ACCEPTANCE.md`, git commits.

## Rules
- Do NOT run `npm run build`, `npm start`, `npm run dev` or `git commit/push` — Lead only (shared `.next`). You MAY run `npx tsc --noEmit`, `npx eslint <your files>`, `node --test <test files>`.
- Keep ALL existing tests passing (`npm test` currently 478/478). If an old test encodes the fake behaviour (e.g. asserts the 1.4 normalisation), report it to the Lead with the reason before changing it.
- `node --test` runs .ts directly (type stripping): use `import type` for type-only imports and explicit `.ts` extensions are NOT available for relative runtime imports from tests — keep pure modules importable (see existing tests for patterns).
- No new runtime dependencies without Lead approval. No secrets. No CDN URLs (strict CSP: `/draco/`, `/basis-ktx2/` are local).
- HONESTY: label every result `physically-measured | browser-or-device-emulated | automated-test | estimated | not-tested`. We have NO physical phones in this environment — never fabricate device measurements. Dish dimensions without a physical measurement are `estimated-typical-portion` and `scaleValidated: false`.
- Forbidden: camera-facing overlays called AR, CSS positioning over camera, fake plane detection, DeviceMotion presented as tracking, moving the dish every frame to follow the camera.
- When done, reply to the Lead with: files changed, what you verified (commands + results), open risks, and anything another agent must integrate.
