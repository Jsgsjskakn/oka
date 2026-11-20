# THE GOLDEN OAK — PHASE 7 AR ACCURACY & SPATIAL PLACEMENT REPORT

**Agent 3:** Real-World Scale and AR Placement Engineer  
**Date:** 2026-11-20  
**Core Engine Files:** [src/lib/xr/webxr-ar-engine.ts](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/src/lib/xr/webxr-ar-engine.ts), [src/lib/xr/webxr-session.ts](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/src/lib/xr/webxr-session.ts), [src/lib/xr/placement-math.ts](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/src/lib/xr/placement-math.ts), [src/lib/three/ar-capabilities.ts](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/src/lib/three/ar-capabilities.ts)

---

## 1. Strict Separation of the 4 AR Execution Paths

The Golden Oak strictly separates its four runtime execution paths and never conflates camera-overlay preview with world-tracked spatial AR:

| Execution Route | Platform / Runtime | Spatial Tracking Engine | Real-World Scale Lock Mechanism | Phase 7 Asset Served |
| :--- | :--- | :--- | :--- | :--- |
| **1. `webxr-immersive-ar`** | Android Chrome + Google Play Services for AR (ARCore) | W3C WebXR `immersive-ar` (`local-floor`, `hit-test`, `anchors`, `dom-overlay`) | `computeRealWorldScaleFactor()` (`1 unit = 1.0 m`) + `Real Size (1:1)` button locks `userScale = 1.0` | Progressive GLB (`*-ultralight.glb` -> `*-balanced.glb`) |
| **2. `android-scene-viewer`** | Android Devices without WebXR `immersive-ar` | Native Google ARCore Scene Viewer Intent (`intent://arvr.google.com/scene-viewer/1.0`) | `mode=ar_preferred&resizable=false` locks 1:1 metric scale | Device-tier GLB (`*-ultralight.glb` or `*-balanced.glb`) |
| **3. `ios-quick-look`** | iPhone & iPad (iOS / iPadOS Safari) | Native Apple ARKit Quick Look (`<a rel="ar" href="...usdz#allowsContentScaling=0">`) | `#allowsContentScaling=0` fragment + **Phase 7 1:1 pre-scaled USDZ geometry (`12cm–30cm`)** | Reconstructed Phase 7 `.usdz` (`374 KB – 1.19 MB`, embedded JPEG textures) |
| **4. `camera-preview-not-tracked`** | Desktop browsers or devices without ARCore/ARKit | Non-spatial camera video backdrop / studio 3D fallback | Clearly badged **"Camera Preview (Not World-Tracked AR)"**; `isWorldTrackedRoute() === false` | Studio 3D Progressive GLB |

---

## 2. WebXR Spatial Accuracy & Phase 6/7 Continuity Invariants

1. **Horizontal Plane Detection & Surface Normal Validation**:
   - `isHorizontalTableHit(hitMatrix, 20°)` in [src/lib/xr/placement-math.ts](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/src/lib/xr/placement-math.ts) dot-products the hit pose's `+Y` up vector against world up `(0, 1, 0)` and rejects vertical walls or tilted surfaces exceeding `20°`.
2. **Persistent `XRAnchor` & Camera-Independent World Lock**:
   - On tap-to-place (`placeAtCurrentReticle()`), `WebXRAREngine` creates a hardware `XRAnchor` (`hitTestResult.createAnchor()`) and updates `anchorRootGroup.matrix` from `frame.getPose(anchor.anchorSpace, referenceSpace)` every XR frame, with `matrixAutoUpdate = false`.
   - Moving or rotating the phone camera changes only the WebXR viewer pose; the placed dish remains locked to its physical table coordinate.
3. **Centered Rotation Pivot & Table Contact (`Y = 0`)**:
   - `updateModelPlacementTransform()` centers the horizontal bounding-box pivot at `(0, 0, 0)` and sets `offsetY = -bbox.min.y * finalScale`.
   - User yaw rotation (`rotatePlacedDish(deltaRadians)`) rotates `placedModelContainer.rotation.y` around `(0, 0, 0)` with **zero circular translation orbit** and **zero vertical sink/float**.
4. **Zero-Drift Progressive LOD Upgrade (`upgradeLod()`)**:
   - When `WebXRAREngine.upgradeLod(higherLodScene, newLodTier, newGlbUrl)` swaps `ultra-light` for `balanced`, it preserves `placedPoseMatrix`, `activeAnchor`, `userYawRadians`, and `userScaleMultiplier` while deep-disposing the previous LOD clone via `disposeObject3DTree()`.
5. **Tracking Loss & Recovery**:
   - When `frame.getPose(viewerSpace, referenceSpace)` returns `null` or `emulatedPosition === true`, `xrTrackingReducer` transitions to `tracking-limited`, hides the reticle, freezes the last valid world transform of the placed dish, and automatically restores `ready-to-place` / `placed` once `emulatedPosition === false` for consecutive frames.
