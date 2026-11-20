# THE GOLDEN OAK — PHASE 7 DEVICE-ADAPTIVE LOADING REPORT

**Agent 5:** Cross-Device QA and Regression Engineer  
**Date:** 2026-11-20  
**Implementation Files:** [src/lib/three/device-capabilities.ts](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/src/lib/three/device-capabilities.ts), [src/lib/three/progressive-asset-loader.ts](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/src/lib/three/progressive-asset-loader.ts), [src/lib/xr/ar-quality-profile.ts](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/src/lib/xr/ar-quality-profile.ts)

---

## 1. Multi-Signal Device-Adaptive Loading Matrix

Per Phase 7 Section 6 (*"Do not choose quality using RAM alone"*), quality selection and progressive LOD upgrades combine **WebGL unmasked GPU architecture classification**, **device memory (`navigator.deviceMemory`)**, **JS heap residency utilization**, **rolling frame-time / FPS telemetry**, **W3C Compute Pressure thermal state**, and **Network Information API (`saveData` / `effectiveType`)**:

| Device Tier / Persona | Initial Asset Loaded | Progressive Upgrade Policy | Max Texture Cap | Framebuffer / DPR Scale | Shadow & Light Estimation | Resource Disposal Policy |
| :--- | :---: | :--- | :---: | :---: | :--- | :--- |
| **2GB Android** (e.g., Redmi A2 / Moto E13, Mali-G52 / Adreno 610) | **Ultra-Light GLB** (`55–258 KB`) | **Strictly Locked to Ultra-Light** (`upgradeSequence: []`, reason: `2gb-device-memory-ultra-light-lock`) | `512 px` (`256 px` in Ultra-Light GLB) | `0.75x` XR framebuffer / `DPR 1.0` | Planar contact blob (zero FBO); light estimation disabled | Aggressive deterministic clone & material disposal on dish switch |
| **4GB Android (Entry GPU)** (e.g., Galaxy A14 5G, Adreno 619 / Mali-G57) | **Ultra-Light GLB** | **Blocked from upgrading** (`gpu-tier-low-end-ultra-light-lock`) | `512 px` | `0.75x` XR framebuffer / `DPR 1.0` | Planar contact blob | Aggressive disposal |
| **4GB Android (Capable Mid GPU)** (e.g., Adreno 642L, safe heap & FPS) | **Ultra-Light GLB first** | **Upgrades to Balanced ONLY when safe** (`heap < 65%`, `FPS >= 48`, `thermal == nominal`); capped at `balanced` | `1024 px` (`512 px` in Balanced GLB) | `1.0x` XR framebuffer / `DPR 1.25` | Contact shadow texture; light estimation enabled if granted | Atomic LOD swap (`replaceLodSceneSafely`) disposes Ultra-Light clone immediately |
| **6GB Android** (e.g., Pixel 6a / Galaxy A52s, Mali-G78 / Adreno 642L) | **Ultra-Light GLB first -> Balanced default** | **Upgrades automatically to Balanced** (`6gb-android-balanced-default-cap`) | `1024 px` | `1.0x` XR framebuffer / `DPR 1.25` | Contact shadow texture + WebXR light estimation | Shared LRU buffer cache + deterministic clone disposal |
| **8GB+ Budget Android Trap** (8GB RAM + weak Adreno 610 / Mali-G52) | **Ultra-Light GLB** | **Strictly Locked to Ultra-Light** (RAM ignored when GPU tier is `low-end`) | `512 px` | `0.75x` XR framebuffer / `DPR 1.0` | Planar contact blob | Aggressive disposal |
| **8GB+ Flagship Android** (e.g., Galaxy S24 / Pixel 8 Pro, Adreno 740/750 / Immortalis-G720) | **Ultra-Light -> Balanced -> High Fidelity** | **Full progressive upgrade to High Fidelity** when GPU is `high-end`, `heap < 80%`, and `thermal == nominal` | `2048 px` | `1.0x` XR framebuffer / `DPR 1.5` | Directional shadow map + WebXR light estimation | Shared LRU buffer cache (`48 MB` cap) |
| **Apple iPhone / iPad (iOS Safari)** (`deviceMemory: undefined`, Apple GPU) | **Ultra-Light -> Balanced / High Fidelity** (3D) or **Reconstructed USDZ** (`374 KB–1.19 MB`, Quick Look AR) | Never penalized for `deviceMemory === undefined`; classified via Apple GPU & screen metrics | `1024–2048 px` | `DPR 1.25–1.5` | Contact shadow + Quick Look native ARKit lighting | Deterministic WebGL context guard & resource disposal |

---

## 2. Verification in Automated Regression Suite

All device-adaptive rules are verified by [tests/phase7-dish-authenticity-and-optimization.test.mjs](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/tests/phase7-dish-authenticity-and-optimization.test.mjs) (Section 5) and [tests/adaptive-quality.test.mjs](file:///C:/Users/Pyiush%20Gupta/.gemini/antigravity/scratch/the-golden-oak/tests/adaptive-quality.test.mjs):
- `2GB Android`: verified `initialLodProfile === 'ultra-light'`, `effectiveTargetProfile === 'ultra-light'`, `upgradeSequence.length === 0`.
- `4GB Android`: verified Ultra-Light initial load, blocked upgrade under low-end GPU or `>= 65%` heap pressure, and permitted `balanced` upgrade (capped at `balanced`) under mid-range GPU + `40%` heap + `58 FPS`.
- `6GB Android`: verified `balanced` default profile.
- `8GB+ Android`: verified `ultra-light` lock on Adreno 610 (`low-end` GPU), `balanced` cap on `mid-range` GPU, and `high-fidelity` unlock only on `high-end` GPU.
