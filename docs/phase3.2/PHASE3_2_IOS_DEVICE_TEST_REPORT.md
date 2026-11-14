# PHASE 3.2 — IOS & IPADOS PHYSICAL DEVICE TEST SPECIFICATION & QA AUDIT REPORT

**Project:** The Golden Oak  
**System:** Apple AR Quick Look Pipeline & iOS Spatial Routing  
**Author:** Sub-Agent 5 (QA, Device Testing & Regression Engineer)  
**Lead Orchestrator:** 22cb5c35-3043-4ba7-a662-5d1b3225baa2  
**Baseline Git Tag:** `pre-phase3.2-checkpoint`  
**Date:** November 2026  

---

## 1. Executive Summary & Provenance Disclosure

> [!IMPORTANT]
> **STRICT HONESTY DISCLOSURE (`not-tested`) & PLATFORM REALITY**  
> This test report operates within an automated CI environment with **no physical iOS or iPadOS hardware connected**. In strict accordance with `docs/phase3.2/SHARED_SUBAGENT_BRIEF.md` and `src/lib/xr/spatial-contract.ts`:
> - Every physical device execution cell in the test matrix below is officially recorded as **`not-tested`**.
> - Zero physical device telemetry has been simulated or fabricated.
> - **Platform Reality:** WebKit on iOS/iPadOS **does not support the WebXR `immersive-ar` session mode**. In-browser world-tracked AR is technically unavailable in mobile Safari. Genuine ARKit tracking on iOS is achieved exclusively through **Apple AR Quick Look** (`<a rel="ar">` with `.usdz` assets).
> - **Real-Size Guarantee:** Quick Look anchor tags MUST append the `#allowsContentScaling=0` URL fragment to lock ARKit at 100% real-world scale and prevent accidental or misleading scaling by diners.

---

## 2. iOS / iPadOS Device Persona Matrix

The test matrix covers five representative Apple mobile devices spanning non-LiDAR and LiDAR architectures:

| Persona ID | Device Tier | Reference Device / Chipset | RAM (Estimated) | AR Architecture & Sensors | Target iOS/iPadOS Version | Target Route & USDZ Asset |
|---|---|---|---|---|---|---|
| **IOS-01** | Legacy / Entry | iPhone 11 (Apple A13 Bionic) | 4 GB | ARKit (Vision-only, No LiDAR) | iOS 16 / 17 | AR Quick Look (`#allowsContentScaling=0`) |
| **IOS-02** | Modern Standard | iPhone 14 (Apple A15 Bionic) | 6 GB | ARKit (Vision-only, No LiDAR) | iOS 17 / 18 | AR Quick Look (`#allowsContentScaling=0`) |
| **IOS-03** | Flagship LiDAR | iPhone 15 Pro (Apple A17 Pro) | 8 GB | ARKit + Hardware LiDAR Scanner | iOS 18 | AR Quick Look (`#allowsContentScaling=0`) |
| **IOS-04** | Standard Tablet | iPad 10th Gen (Apple A14 Bionic) | 4 GB | ARKit (Vision-only, No LiDAR) | iPadOS 17 / 18 | AR Quick Look (`#allowsContentScaling=0`) |
| **IOS-05** | Pro Tablet | iPad Pro 11" M4 (Apple M4 Chip) | 8 GB | ARKit + Hardware LiDAR Scanner | iPadOS 18 | AR Quick Look (`#allowsContentScaling=0`) |

---

## 3. The 14 Real-World Dining & Spatial Scenarios

1. **SCN-01: Bright Dining Room Lighting (>500 lux)**  
   - Direct sunlight or high-intensity restaurant lighting.  
   - Tests iOS sensor exposure and ARKit visual inertial odometry (VIO).

2. **SCN-02: Romantic Candlelit / Low Ambient Lighting (<50 lux)**  
   - Low-light restaurant dinner environment.  
   - Tests LiDAR instant range-finding (IOS-03/05) vs VIO degradation on non-LiDAR (IOS-01/02).

3. **SCN-03: Natural Oak / Timber Tabletop Surface**  
   - Rich natural wood grain dining surface.  
   - Baseline reference surface with abundant visual keypoints.

4. **SCN-04: Featureless White Matte Tablecloth**  
   - Smooth white cloth surface with low visual texture contrast.  
   - Stresses ARKit plane detection; non-LiDAR relies on boundary edges.

5. **SCN-05: Dark Slate / Black Charcoal Tabletop**  
   - Matte dark stone dining surface.  
   - Tests ambient light compensation and contact shadow depth perception.

6. **SCN-06: High Specularity / Lacquered Glass Tabletop**  
   - Highly reflective polished glass or polished black granite.  
   - Tests specular highlight rejection and surface hit-test stability.

7. **SCN-07: High-Frequency Textured Tablecloth**  
   - Patterned floral, mosaic, or checkered dining tablecloth.  
   - Verifies lack of high-frequency mesh vibration or jitter.

8. **SCN-08: Lateral Translation Across Table (1.5m Pan)**  
   - Lateral camera translation across the table width.  
   - Verifies 6DoF camera translation without anchor slippage.

9. **SCN-09: Close-Up Inspection to Full Table View (0.3m to 2.5m)**  
   - Distance variation from close macro inspection to seated dining overview.  
   - Verifies ARKit scale lock (`#allowsContentScaling=0`) prevents apparent resizing.

10. **SCN-10: 360-Degree Continuous Orbit Around Placed Dish**  
    - Complete walk-around orbit at 1m distance.  
    - Verifies continuous spatial anchoring, PBR environment reflections, and smooth rendering.

11. **SCN-11: Total Camera Lens Occlusion (Hand Over Sensor, 3s)**  
    - Hand momentarily covers rear camera lenses for 3 seconds.  
    - Verifies ARKit tracking state pause and zero anchor drift upon uncovering.

12. **SCN-12: Rapid Motion Shake & Relocalisation**  
    - Rapid hand tilt or brisk movement away from table, then returning to original angle.  
    - Verifies ARKit relocalisation speed and seamless visual reconnection.

13. **SCN-13: Dish Switching & Multi-Model Loading**  
    - Diner returns to menu, selects a different dish, and launches Quick Look again.  
    - Verifies iOS memory cache disposal and zero memory footprint compounding.

14. **SCN-14: Sustained 10–20 Minute Dining Interaction**  
    - Extended viewing session in AR Quick Look.  
    - Verifies zero thermal warning, zero iOS memory pressure jetsam kill, and battery efficiency.

---

## 4. Acceptance Criteria & Quantitative Targets

| Measurement Metric | Unit | Non-LiDAR Devices (IOS-01, 02, 04) | LiDAR Devices (IOS-03, 05) | Critical Failure Boundary |
|---|---|---|---|---|
| **Quick Look Launch Latency** | Seconds | $\le 1.8\text{ s}$ | $\le 1.2\text{ s}$ | $> 4.0\text{ s}$ |
| **Plane Detection Latency** | Seconds | $\le 2.5\text{ s}$ | $\le 0.5\text{ s}$ (instantaneous) | $> 6.0\text{ s}$ |
| **Ground Contact Residual Gap** | Millimetres | $\le 2.0\text{ mm}$ | $\le 1.0\text{ mm}$ | $> 5.0\text{ mm}$ |
| **Real Scale Footprint Accuracy** | Error % | $\le \pm 5.0\%$ | $\le \pm 3.0\%$ | $> \pm 10.0\%$ |
| **Scale Lock (`allowsContentScaling=0`)** | Boolean | **True** (pinch-to-scale disabled) | **True** (pinch-to-scale disabled) | **False** (scale distorted) |
| **60s Orbit Drift** | Centimetres | $\le 2.0\text{ cm}$ | $\le 1.0\text{ cm}$ | $> 5.0\text{ cm}$ |
| **Relocalisation Recovery Time** | Seconds | $\le 1.5\text{ s}$ | $\le 0.5\text{ s}$ | $> 3.0\text{ s}$ |
| **USDZ Payload Size** | Megabytes | $\le 15.0\text{ MB}$ | $\le 15.0\text{ MB}$ | $> 25.0\text{ MB}$ |
| **Frame Rate in Quick Look** | FPS | 60 FPS locked | 60–120 FPS (ProMotion) | $< 45\text{ FPS}$ |

---

## 5. Physical Execution Matrix (All Scenarios × All Personas)

*Status Key: `not-tested` (no physical devices in CI/cloud environment; verified via unit & contract tests).*

| Scenario ID | SCN Name | IOS-01 (iPhone 11) | IOS-02 (iPhone 14) | IOS-03 (iPhone 15 Pro) | IOS-04 (iPad 10th) | IOS-05 (iPad Pro M4) |
|---|---|---|---|---|---|---|
| **SCN-01** | Bright Lighting | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-02** | Dim Restaurant Lighting | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-03** | Natural Wood Table | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-04** | Plain White Tablecloth | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-05** | Dark Slate Table | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-06** | Reflective Glass/Marble | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-07** | Textured Pattern Cloth | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-08** | Lateral Translation (1.5m) | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-09** | Distance Variation (0.3-2.5m) | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-10** | 360-Degree Orbit | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-11** | Camera Occlusion (3s) | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-12** | Rapid Motion / Relocalise | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-13** | Dish Switching & Reload | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-14** | 15-Minute Thermal Run | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |

---

## 6. Reproducible Physical Testing Procedure for Field QA Engineers

1. **Hardware Preparation**:
   - Ensure iPhone or iPad is running target iOS/iPadOS version (iOS 16+).
   - Use native Safari browser (third-party iOS browsers must also invoke Quick Look via WebKit).
   - Verify battery is $\ge 70\%$.
2. **Execution Steps**:
   - Navigate to `https://<staging-url>/menu`.
   - Select any menu dish (e.g. `tandoori-paneer-pizza`) and tap **"View in AR"**.
   - Verify that the app detects iOS Safari and surfaces the Apple AR Quick Look action link.
   - Inspect the link URL in DOM: verify it points to `/models/optimized/<dish>.usdz#allowsContentScaling=0`.
   - Tap the Quick Look link: verify native iOS AR Quick Look sheet slides up.
   - Point device at tabletop:
     - On LiDAR devices (iPhone 15 Pro / iPad Pro M4), verify table surface is recognized almost instantaneously ($\le 0.5\text{s}$).
     - On non-LiDAR devices, slowly sweep camera over surface until ARKit detects plane.
   - Confirm dish appears anchored to table with base touching the surface ($y=0$).
   - Attempt to pinch with two fingers: **confirm model does NOT scale** (verifies `#allowsContentScaling=0`).
   - Use physical ruler to verify real physical diameter matches menu specification ($\pm 5\%$).
   - Perform 360-degree orbit around table: verify dish maintains exact anchored coordinates without sliding.
