# PHASE 3.2 — ANDROID PHYSICAL DEVICE TEST SPECIFICATION & QA AUDIT REPORT

**Project:** The Golden Oak  
**System:** WebXR Spatial AR Engine & Android Routing Pipeline  
**Author:** Sub-Agent 5 (QA, Device Testing & Regression Engineer)  
**Lead Orchestrator:** 22cb5c35-3043-4ba7-a662-5d1b3225baa2  
**Baseline Git Tag:** `pre-phase3.2-checkpoint`  
**Date:** November 2026  

---

## 1. Executive Summary & Provenance Disclosure

> [!IMPORTANT]
> **STRICT HONESTY DISCLOSURE (`not-tested`)**  
> This test report operates within an automated cloud/container CI environment with **no physical Android hardware connected**. In strict accordance with `docs/phase3.2/SHARED_SUBAGENT_BRIEF.md` and `src/lib/xr/spatial-contract.ts`:
> - Every physical device execution cell in the test matrix below is officially classified and recorded as **`not-tested`**.
> - Zero physical device telemetry has been simulated, approximated, or fabricated.
> - All software routing, state machines, degradation math, and fallback ladders are independently validated via automated test suites (`tests/phase3-2-*.test.mjs`).

This document defines the **exhaustive physical testing matrix, 14 real-world dining scenarios, precise reproducible test protocols, and critical pass/fail acceptance criteria** for testing Android mobile devices against The Golden Oak's Phase 3.2 AR experience.

---

## 2. Android Device Persona Matrix

The test matrix covers six calibrated Android device personas representing the global restaurant diner demographic:

| Persona ID | Device Tier | Reference Device / Chipset | RAM | GPU Family & Model | Google Play Services for AR (ARCore) | Target Experience Route |
|---|---|---|---|---|---|---|
| **AND-01** | Ultra-Light / Entry | Redmi A2 / Moto E13 (Unisoc T606) | 2 GB | ARM Mali-G57 MP1 | **Unsupported** | Google Scene Viewer or 3D Viewer |
| **AND-02** | Budget / Mid-Low | Galaxy A14 5G (Dimensity 700) | 4 GB | ARM Mali-G57 MC2 | **Supported** | WebXR `immersive-ar` (Ultra-Light) |
| **AND-03** | Marketing RAM Trap | Redmi Note 11 (Snapdragon 680) | 8 GB | Qualcomm Adreno 610 | **Supported** | WebXR `immersive-ar` (Ultra-Light, RAM ignored) |
| **AND-04** | Balanced Mid-Range | Pixel 7a (Google Tensor G2) | 8 GB | ARM Mali-G710 MP7 | **Supported** | WebXR `immersive-ar` (Balanced) |
| **AND-05** | Balanced Mid-Range | Galaxy A54 (Exynos 1380) | 6 GB | ARM Mali-G68 MP5 | **Supported** | WebXR `immersive-ar` (Balanced) |
| **AND-06** | High-Fidelity Flagship | Galaxy S24 Ultra (Snapdragon 8 Gen 3) | 12 GB | Qualcomm Adreno 750 | **Supported** | WebXR `immersive-ar` (High-Fidelity) |

---

## 3. The 14 Real-World Dining & Spatial Scenarios

Each physical test run must execute these 14 standardized dining room environments:

1. **SCN-01: Bright Lighting (>500 lux)**  
   - Direct sunlight or high-intensity warm dining spotlight.  
   - Verifies camera sensor gain, exposure compensation, and lack of white-out tracking failure.

2. **SCN-02: Dim Lighting (<50 lux)**  
   - Intimate dinner ambient lighting (<50 lux) with candlelit accents.  
   - Verifies ARCore feature point extraction in low signal-to-noise ratio.

3. **SCN-03: Light Natural Wood Grain Tabletop**  
   - Premium oak/pine restaurant dining table with natural wood grain patterns.  
   - High visual feature count; baseline expected optimal surface.

4. **SCN-04: Plain White Matte Tablecloth**  
   - Monochromatic, textureless white cloth with minimal contrast.  
   - Stresses plane estimation and feature tracking on feature-sparse surfaces.

5. **SCN-05: Dark Matte Slate / Charcoal Tabletop**  
   - Dark grey/black stone or dark lacquered wood dining table.  
   - Verifies normal estimation and contrast shadow visibility.

6. **SCN-06: Highly Reflective / Polished Glass / Marble Tabletop**  
   - Polished granite, lacquered glass, or mirror-sheen dining surface.  
   - Stresses specular rejection; verifies hit-test stability without bouncing.

7. **SCN-07: High-Contrast Textured / Patterned Tablecloth**  
   - Checkered, floral, or mosaic restaurant tablecloth.  
   - Dense visual keypoints; tests against high-frequency depth estimation noise.

8. **SCN-08: Lateral Translation (1.5m Left/Right Pan)**  
   - Diner shifts seated position or passes phone to companion across 1.5 metres.  
   - Verifies 6DoF camera translation without anchor shearing or displacement.

9. **SCN-09: Distance Variation (0.3m Close-Up to 2.5m Room View)**  
   - Diner zooms in from full dining table view (2.5m) to inspect micro-garnishes (0.3m).  
   - Verifies depth buffer precision, near-clip plane clipping, and zero scale alteration.

10. **SCN-10: Full 360-Degree Orbit Around Dish**  
    - Diner stands up and walks completely around the table-placed dish at 1m radius.  
    - Verifies continuous anchor pose stability, occlusion, and absence of yaw rotation jitter.

11. **SCN-11: Severe Camera Occlusion (Hand Over Lens)**  
    - Diner momentarily places hand or menu over rear camera for 2–3 seconds.  
    - **Pass invariant:** State transitions to `tracking-limited`; **dish position & anchor are 100% preserved** (no wiping, no dislodgement).

12. **SCN-12: Rapid Motion & Relocalisation Recovery**  
    - Rapid shake / quick phone sweep causing brief visual tracking loss, followed by pointing back at table.  
    - Verifies rapid relocalisation and clean state machine recovery from `tracking-limited` to `placed`.

13. **SCN-13: Dish Repositioning & Multi-Dish Lifecycle**  
    - Diner taps "Reposition", moves reticle to new table spot, and taps to place again.  
    - Verifies clean state reset, disposal of old anchor, and instantaneous re-anchoring.

14. **SCN-14: Extended 10–20 Minute Dining Session**  
    - Continuous active WebXR session running for 15 minutes on table.  
    - Verifies thermal stability, zero memory leak (deterministic garbage collection), and steady frame times.

---

## 4. Acceptance Criteria & Quantitative Targets

| Measurement Metric | Unit | Ultra-Light Tier (AND-01..03) | Balanced Tier (AND-04..05) | High-Fidelity Tier (AND-06) | Critical Failure Boundary |
|---|---|---|---|---|---|
| **Tracking Acquisition Latency** | Seconds | $\le 4.0\text{ s}$ | $\le 2.5\text{ s}$ | $\le 1.5\text{ s}$ | $> 8.0\text{ s}$ |
| **Ground Contact Residual Gap** | Millimetres | $\le 2.0\text{ mm}$ | $\le 2.0\text{ mm}$ | $\le 2.0\text{ mm}$ | $> 5.0\text{ mm}$ (floating/penetrating) |
| **Real Scale Footprint Accuracy** | Error % | $\le \pm 5.0\%$ | $\le \pm 5.0\%$ | $\le \pm 5.0\%$ | $> \pm 10.0\%$ |
| **60s Orbit Drift** | Centimetres | $\le 4.0\text{ cm}$ | $\le 2.5\text{ cm}$ | $\le 1.5\text{ cm}$ | $> 8.0\text{ cm}$ |
| **Relocalisation Recovery Time** | Seconds | $\le 2.5\text{ s}$ | $\le 1.5\text{ s}$ | $\le 1.0\text{ s}$ | $> 4.0\text{ s}$ (or lost dish) |
| **Sustained Frame Rate** | FPS | $\ge 30\text{ FPS}$ | $\ge 55\text{ FPS}$ | $\ge 58\text{ FPS}$ | $< 25\text{ FPS}$ |
| **95th Percentile Frame Time** | Milliseconds | $\le 33.3\text{ ms}$ | $\le 18.0\text{ ms}$ | $\le 16.7\text{ ms}$ | $> 40.0\text{ ms}$ |
| **Memory Growth (15 min run)** | MB / min | $\le 0.5\text{ MB/min}$ | $\le 0.5\text{ MB/min}$ | $\le 0.5\text{ MB/min}$ | $> 5.0\text{ MB/min}$ (leak) |
| **Thermal Throttling Drop** | Steps | Drops to Step 5 gracefully | Drops $\le 2$ steps | Drops $\le 1$ step | App crash / WebGL context lost |

---

## 5. Physical Execution Matrix (All Scenarios × All Personas)

*Status Key: `not-tested` (no physical devices in CI/cloud environment; verified via unit & state machine tests).*

| Scenario ID | SCN Name | AND-01 (2GB Mali) | AND-02 (4GB Mali) | AND-03 (8GB Adreno 610) | AND-04 (Pixel 7a) | AND-05 (Galaxy A54) | AND-06 (S24 Ultra) |
|---|---|---|---|---|---|---|---|
| **SCN-01** | Bright Lighting | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-02** | Dim Restaurant Lighting | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-03** | Natural Wood Table | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-04** | Plain White Tablecloth | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-05** | Dark Slate Table | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-06** | Reflective Glass/Marble | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-07** | Textured Pattern Cloth | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-08** | Lateral Translation (1.5m) | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-09** | Distance Variation (0.3-2.5m) | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-10** | 360-Degree Orbit | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-11** | Camera Occlusion (3s) | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-12** | Rapid Motion / Relocalise | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-13** | Reposition & Reset Size | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |
| **SCN-14** | 15-Minute Thermal Run | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` | `not-tested` |

---

## 6. Reproducible Physical Testing Procedure for Field QA Engineers

1. **Hardware Preparation**:
   - Ensure target device has Google Chrome 120+ installed.
   - Verify Google Play Services for AR (ARCore) is up to date via Google Play Store.
   - Charge battery to $\ge 80\%$; disconnect charger to allow natural thermal dissipation.
2. **Environment Setup**:
   - Calibrate ambient illuminance with lux meter (SCN-01 $\ge 500\text{ lux}$, SCN-02 $\le 50\text{ lux}$).
   - Set up test table with specified material surface.
3. **Execution Steps**:
   - Navigate to `https://<staging-url>/ar/tandoori-paneer-pizza`.
   - Tap **"View in AR"**.
   - Observe WebXR prompt: grant camera permission if requested.
   - Point device at tabletop; record time to reticle transition from `scanning` to `surface-detected`.
   - Tap screen to place dish; verify anchor creation (`placed` state).
   - Place physical measuring ruler next to virtual dish; photograph side-by-side to verify footprint diameter and ground contact ($y=0$).
   - Perform lateral move (SCN-08), distance move (SCN-09), and 360-degree orbit (SCN-10), recording any jitter or drift.
   - Cover camera lens with card for 3 seconds; verify overlay displays "Tracking Limited" and dish DOES NOT move or vanish.
   - Uncover camera; verify relocalisation completes within 1.5 seconds.
   - Record FPS and memory using Chrome Remote DevTools (`chrome://inspect`).
