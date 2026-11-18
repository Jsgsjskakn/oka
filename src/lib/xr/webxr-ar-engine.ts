/**
 * THE GOLDEN OAK — WebXR AR Engine (Phase 3.2)
 * Sub-Agent 1: AR Tracking & Spatial Architect
 *
 * Genuine world-tracked WebXR `immersive-ar` engine built with vanilla Three.js:
 * - Real table plane detection via viewer-space hit-test source.
 * - Horizontal surface normal validation (cos(15 deg) ~ 0.9659 threshold).
 * - Anchor-based placement (XRAnchor or fixed reference-space matrix fallback).
 * - Dish follows ONLY the anchor space pose, never the camera.
 * - Physical 1:1 real size scaling (1 unit = 1m) without DPR/viewport bias.
 * - Tracking-limited retention (keeps last pose without teleporting).
 * - Deliberate post-placement pinch-scale [0.5, 2.0] and yaw rotation.
 * - Adaptive light estimation with XREstimatedLight and neutral fallback.
 * - Deterministic GPU resource disposal on session end.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { XREstimatedLight } from 'three/examples/jsm/webxr/XREstimatedLight.js';

import { applyCanonicalColorPipeline } from '../three/color-pipeline.ts';
import { perfMark } from '../three/perf-telemetry.ts';

import type {
  XRTrackingState,
  PlacementRecord,
  PlacementAnchorKind,
  DishPhysicalSpec,
} from './spatial-contract.ts';
import {
  REAL_SIZE_USER_SCALE,
  cmToMetres,
} from './spatial-contract.ts';
import {
  computeDishPlacementTransform,
  isHorizontalSurface,
  clampUserScale,
} from './placement-math.ts';
import { createPlacementReticle } from './placement-reticle.ts';
import { getDishPhysicalSpec } from '../../data/dish-dimensions.ts';

import {
  resolveXRSessionQualityProfile,
  XRFrameTimeMonitor,
} from './ar-quality-profile.ts';
import type { XRSessionQualityProfile } from './ar-quality-profile.ts';

// ---------------------------------------------------------------------------
// Interfaces & Contract Signatures
// ---------------------------------------------------------------------------

export interface PlacementReticleInstance {
  object: THREE.Object3D;
  setState: (s: 'scanning' | 'surface-detected' | 'hidden') => void;
  update: (dtSeconds: number) => void;
  dispose: () => void;
}

export interface WebXRAREngineDependencies {
  getDishPhysicalSpec?: (dishSlug: string) => DishPhysicalSpec;
  computeDishPlacementTransform?: (params: {
    bboxMin: [number, number, number];
    bboxMax: [number, number, number];
    spec: DishPhysicalSpec;
    userScale: number;
  }) => { uniformScale: number; offset: [number, number, number] };
  isHorizontalSurface?: (normalY: number) => boolean;
  createPlacementReticle?: () => PlacementReticleInstance;
  createRenderer?: (profile: XRSessionQualityProfile) => THREE.WebGLRenderer;
}

export interface WebXRAREngineOptions {
  session: XRSession;
  dishSlug: string;
  modelUrl: string;
  upgradeModelUrl?: string;
  container?: HTMLElement | null;
  onTrackingStateChange?: (state: XRTrackingState, details?: unknown) => void;
  onPlacementComplete?: (record: PlacementRecord) => void;
  onModelLoaded?: () => void;
  onError?: (err: Error) => void;
  qualityProfile?: XRSessionQualityProfile;
  dependencies?: WebXRAREngineDependencies;
}

// ---------------------------------------------------------------------------
// Default Fallback Implementations for SA2 Contracts
// ---------------------------------------------------------------------------

export function defaultIsHorizontalSurface(normalY: number): boolean {
  return isHorizontalSurface(normalY);
}

export function defaultClampUserScale(s: number): number {
  return clampUserScale(s);
}

export function defaultGetDishPhysicalSpec(dishSlug: string): DishPhysicalSpec {
  return getDishPhysicalSpec(dishSlug);
}

export function defaultComputeDishPlacementTransform(params: {
  bboxMin: [number, number, number];
  bboxMax: [number, number, number];
  spec: DishPhysicalSpec;
  userScale: number;
}): { uniformScale: number; offset: [number, number, number] } {
  const res = computeDishPlacementTransform({
    bboxMin: params.bboxMin,
    bboxMax: params.bboxMax,
    spec: params.spec,
    userScale: params.userScale,
  });
  return {
    uniformScale: res.uniformScale,
    offset: res.offset,
  };
}

export function defaultCreatePlacementReticle(): PlacementReticleInstance {
  return createPlacementReticle();
}

// ---------------------------------------------------------------------------
// WebXRAREngine Implementation
// ---------------------------------------------------------------------------

export class WebXRAREngine {
  private session: XRSession;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  private refSpace: XRReferenceSpace | null = null;
  private viewerSpace: XRReferenceSpace | null = null;
  private hitTestSource: XRHitTestSource | null = null;

  private reticle: PlacementReticleInstance;
  private dishGroup: THREE.Group;
  private modelContainer: THREE.Group;
  private loadedModelRoot: THREE.Object3D | null = null;
  private contactShadowMesh: THREE.Mesh | null = null;

  private xrEstimatedLight: THREE.Object3D | null = null;
  private hemisphereLight: THREE.HemisphereLight;
  private keyDirectionalLight: THREE.DirectionalLight;
  private fillDirectionalLight: THREE.DirectionalLight;

  private dishSlug: string;
  private modelUrl: string;
  private upgradeModelUrl?: string;
  private dishPhysicalSpec: DishPhysicalSpec;

  private isPlaced = false;
  private currentAnchor: { anchorSpace: XRSpace; delete?: () => void } | null = null;
  private fixedPoseMatrix: number[] | null = null;
  private lastHitPose: XRPose | null = null;
  private lastHitTestResult: XRHitTestResult | null = null;

  private userScale = REAL_SIZE_USER_SCALE;
  private userYawRad = 0;
  private rawModelBBox: { min: [number, number, number]; max: [number, number, number] } | null = null;

  private trackingState: XRTrackingState = 'scanning';
  private frameTimeMonitor: XRFrameTimeMonitor;
  private qualityProfile: XRSessionQualityProfile;

  private firstXRFrameFired = false;
  private firstSurfaceHitFired = false;
  private modelLoaded = false;
  private gltfLoader: GLTFLoader | null = null;
  private dracoLoader: DRACOLoader | null = null;
  private ktx2Loader: KTX2Loader | null = null;

  private lastFrameTimestamp = 0;
  private disposed = false;

  private onTrackingStateChange?: (state: XRTrackingState, details?: unknown) => void;
  private onPlacementComplete?: (record: PlacementRecord) => void;
  private onModelLoaded?: () => void;
  private onError?: (err: Error) => void;

  private isHorizontalSurfaceFn: (normalY: number) => boolean;
  private computeTransformFn: (params: {
    bboxMin: [number, number, number];
    bboxMax: [number, number, number];
    spec: DishPhysicalSpec;
    userScale: number;
  }) => { uniformScale: number; offset: [number, number, number] };

  constructor(options: WebXRAREngineOptions) {
    this.session = options.session;
    this.dishSlug = options.dishSlug;
    this.modelUrl = options.modelUrl;
    this.upgradeModelUrl = options.upgradeModelUrl;

    this.onTrackingStateChange = options.onTrackingStateChange;
    this.onPlacementComplete = options.onPlacementComplete;
    this.onModelLoaded = options.onModelLoaded;
    this.onError = options.onError;

    const deps = options.dependencies ?? {};
    this.isHorizontalSurfaceFn = deps.isHorizontalSurface ?? defaultIsHorizontalSurface;
    this.computeTransformFn = deps.computeDishPlacementTransform ?? defaultComputeDishPlacementTransform;
    const getSpec = deps.getDishPhysicalSpec ?? defaultGetDishPhysicalSpec;
    this.dishPhysicalSpec = getSpec(this.dishSlug);

    this.qualityProfile =
      options.qualityProfile ??
      resolveXRSessionQualityProfile({
        saveData: false,
        batteryState: 'good',
        thermalState: 'nominal',
      });

    this.frameTimeMonitor = new XRFrameTimeMonitor({
      initialProfile: this.qualityProfile,
      targetFrameTimeMs: 16.67,
    });

    // 1. Renderer Setup
    this.renderer =
      deps.createRenderer?.(this.qualityProfile) ??
      new THREE.WebGLRenderer({
        alpha: true,
        antialias: this.qualityProfile.antialias,
        powerPreference: this.qualityProfile.powerPreference,
      });
    this.renderer.setPixelRatio(1);
    if (typeof window !== 'undefined') {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    this.renderer.xr.enabled = true;

    // Phase 5 Task 2: Apply canonical colour pipeline (Khronos PBR Neutral, SRGBColorSpace, Exposure 1.0)
    applyCanonicalColorPipeline(this.renderer);

    if (options.container && this.renderer.domElement) {
      options.container.appendChild(this.renderer.domElement);
    } else if (typeof document !== 'undefined' && document.body && this.renderer.domElement) {
      this.renderer.domElement.style.position = 'fixed';
      this.renderer.domElement.style.inset = '0';
      this.renderer.domElement.style.width = '100vw';
      this.renderer.domElement.style.height = '100vh';
      this.renderer.domElement.style.zIndex = '0';
      document.body.appendChild(this.renderer.domElement);
    }

    // 2. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();

    // 3. Lighting Setup
    this.hemisphereLight = new THREE.HemisphereLight('#FFF6E8', '#241B14', this.qualityProfile.environmentIntensity);
    this.keyDirectionalLight = new THREE.DirectionalLight('#FFFDF8', 1.25);
    this.keyDirectionalLight.position.set(3, 5, 3);
    this.fillDirectionalLight = new THREE.DirectionalLight('#FFE8C2', 0.45);
    this.fillDirectionalLight.position.set(-2, 4, -2);

    this.scene.add(this.hemisphereLight);
    this.scene.add(this.keyDirectionalLight);
    this.scene.add(this.fillDirectionalLight);

    if (this.qualityProfile.useLightEstimation && typeof XREstimatedLight === 'function') {
      try {
        const estLight = new XREstimatedLight(this.renderer);
        estLight.addEventListener('estimationstart', () => {
          this.scene.add(estLight);
          if (estLight.environment) {
            this.scene.environment = estLight.environment;
          }
        });
        estLight.addEventListener('estimationend', () => {
          this.scene.remove(estLight);
        });
        this.xrEstimatedLight = estLight;
      } catch {
        // Fallback to static hemisphere
      }
    }

    // 4. Reticle Setup
    const reticleFactory = deps.createPlacementReticle ?? defaultCreatePlacementReticle;
    this.reticle = reticleFactory();
    this.scene.add(this.reticle.object);

    // 5. Dish Scene Hierarchy
    this.dishGroup = new THREE.Group();
    this.dishGroup.matrixAutoUpdate = false;
    this.dishGroup.visible = false;
    this.scene.add(this.dishGroup);

    this.modelContainer = new THREE.Group();
    this.dishGroup.add(this.modelContainer);

    // Attach Ground Contact Shadow
    this.setupContactShadow();

    // Bind event handlers
    this.handleSelect = this.handleSelect.bind(this);
    this.handleSessionEnd = this.handleSessionEnd.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

    this.session.addEventListener('select', this.handleSelect);
    this.session.addEventListener('end', this.handleSessionEnd);
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  public async start(): Promise<void> {
    try {
      // 1. Establish reference space with fallback order (local-floor -> local)
      try {
        this.refSpace = await this.session.requestReferenceSpace('local-floor');
        this.renderer.xr.setReferenceSpaceType('local-floor');
        await this.renderer.xr.setSession(this.session);
      } catch {
        this.refSpace = await this.session.requestReferenceSpace('local');
        this.renderer.xr.setReferenceSpaceType('local');
        await this.renderer.xr.setSession(this.session);
      }

      this.viewerSpace = await this.session.requestReferenceSpace('viewer');

      // Request hit test source from viewer space
      if (this.session.requestHitTestSource) {
        this.hitTestSource =
          (await this.session.requestHitTestSource({
            space: this.viewerSpace,
          })) ?? null;
      }

      // Parallelize: load model asynchronously, never block camera loop
      void this.loadDishModel(this.modelUrl);

      // Start animation loop
      this.renderer.setAnimationLoop(this.onXRFrame.bind(this));

      this.setTrackingState('scanning');
    } catch (err) {
      const error = err as Error;
      this.onError?.(error);
      this.setTrackingState('error', error.message);
    }
  }

  // ---------------------------------------------------------------------------
  // Frame Loop & Tracking Pipeline
  // ---------------------------------------------------------------------------

  private onXRFrame(timestamp: number, frame?: XRFrame): void {
    if (this.disposed || !frame || !this.refSpace) return;

    if (!this.firstXRFrameFired) {
      this.firstXRFrameFired = true;
      perfMark('ar:first-xr-frame');
    }

    // 1. Frame-time Monitoring
    const deltaMs = this.lastFrameTimestamp ? timestamp - this.lastFrameTimestamp : 16.67;
    this.lastFrameTimestamp = timestamp;
    const dtSeconds = Math.min(deltaMs * 0.001, 0.1);

    this.frameTimeMonitor.sample(deltaMs, performance.now());

    // 2. Viewer Pose & Tracking Integrity
    const viewerPose = frame.getViewerPose(this.refSpace);
    if (!viewerPose || viewerPose.emulatedPosition) {
      if (this.trackingState !== 'tracking-limited') {
        const reason = !viewerPose ? 'pose-lost' : 'emulated-position';
        perfMark('ar:tracking-lost', { reason });
        this.setTrackingState('tracking-limited', reason);
        this.reticle.setState('hidden');
      }
      // Render without teleporting or modifying dish pose
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.trackingState === 'tracking-limited') {
      perfMark('ar:tracking-restored');
      this.setTrackingState(this.isPlaced ? 'placed' : 'scanning');
    }

    // 3. Scanning & Hit-Test Pipeline
    if (!this.isPlaced && this.hitTestSource) {
      const hitTestResults = frame.getHitTestResults(this.hitTestSource);
      if (hitTestResults.length > 0) {
        const hitPose = hitTestResults[0].getPose(this.refSpace);
        if (hitPose) {
          const orientation = hitPose.transform.orientation;
          const quat = new THREE.Quaternion(orientation.x, orientation.y, orientation.z, orientation.w);
          const surfaceNormal = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);

          const isHorizontal = this.isHorizontalSurfaceFn(surfaceNormal.y);

          if (isHorizontal) {
            if (!this.firstSurfaceHitFired) {
              this.firstSurfaceHitFired = true;
              perfMark('ar:first-surface-hit');
            }
            this.reticle.object.position.set(
              hitPose.transform.position.x,
              hitPose.transform.position.y,
              hitPose.transform.position.z
            );
            this.reticle.object.quaternion.copy(quat);
            this.reticle.setState('surface-detected');

            this.lastHitTestResult = hitTestResults[0];
            this.lastHitPose = hitPose;

            if (this.trackingState !== 'surface-detected') {
              this.setTrackingState('surface-detected');
            }
          } else {
            this.reticle.setState('scanning');
            if (this.trackingState !== 'scanning') {
              this.setTrackingState('scanning');
            }
          }
        }
      } else {
        this.reticle.setState('scanning');
        if (this.trackingState !== 'scanning') {
          this.setTrackingState('scanning');
        }
      }

      this.reticle.update(dtSeconds);
    }

    // 4. Placed Model World-Tracking Pipeline
    if (this.isPlaced) {
      if (this.currentAnchor && this.currentAnchor.anchorSpace) {
        const anchorPose = frame.getPose(this.currentAnchor.anchorSpace, this.refSpace);
        if (anchorPose) {
          // Strictly apply anchor space transform matrix to dish group
          this.dishGroup.matrix.fromArray(anchorPose.transform.matrix);
          this.dishGroup.matrix.decompose(
            this.dishGroup.position,
            this.dishGroup.quaternion,
            this.dishGroup.scale
          );
        }
      } else if (this.fixedPoseMatrix) {
        // Fixed reference-space pose matrix (device lacks anchors)
        this.dishGroup.matrix.fromArray(this.fixedPoseMatrix);
        this.dishGroup.matrix.decompose(
          this.dishGroup.position,
          this.dishGroup.quaternion,
          this.dishGroup.scale
        );
      }
    }

    // 5. Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  // ---------------------------------------------------------------------------
  // Placement & Anchor Creation
  // ---------------------------------------------------------------------------

  public async placeDish(): Promise<boolean> {
    if (this.isPlaced || !this.lastHitTestResult || !this.lastHitPose) {
      return false;
    }

    let anchorKind: PlacementAnchorKind = 'reference-space-pose';

    // 1. Genuine XRAnchor creation
    const hitWithAnchor = this.lastHitTestResult as unknown as {
      createAnchor?: () => Promise<{ anchorSpace: XRSpace; delete?: () => void }>;
    };

    if (typeof hitWithAnchor.createAnchor === 'function') {
      try {
        this.currentAnchor = await hitWithAnchor.createAnchor();
        anchorKind = 'xr-anchor';
      } catch {
        this.fixedPoseMatrix = Array.from(this.lastHitPose.transform.matrix);
        anchorKind = 'reference-space-pose';
      }
    } else {
      this.fixedPoseMatrix = Array.from(this.lastHitPose.transform.matrix);
      anchorKind = 'reference-space-pose';
    }

    this.isPlaced = true;
    this.dishGroup.visible = true;
    this.reticle.setState('hidden');

    this.updateModelPlacementTransform();

    perfMark('ar:first-placement', { dishSlug: this.dishSlug, anchorKind });
    if (this.modelLoaded) {
      perfMark('ar:model-visible', { dishSlug: this.dishSlug });
    }

    const record: PlacementRecord = {
      dishSlug: this.dishSlug,
      anchorKind,
      initialPoseMatrix: Array.from(this.lastHitPose.transform.matrix),
      userScale: this.userScale,
      userYawRad: this.userYawRad,
      placedAtMs: Date.now(),
    };

    this.onPlacementComplete?.(record);
    this.setTrackingState('placed', record);

    // If upgrade model is configured and different from initial, upgrade LOD in background
    if (this.upgradeModelUrl && this.upgradeModelUrl !== this.modelUrl) {
      void this.upgradeLod(this.upgradeModelUrl);
    }

    return true;
  }

  private handleSelect(): void {
    if (!this.isPlaced && this.trackingState === 'surface-detected') {
      void this.placeDish();
    }
  }

  // ---------------------------------------------------------------------------
  // User Scale & Rotation Manipulations (deliberate, post-placement only)
  // ---------------------------------------------------------------------------

  public getUserScale(): number {
    return this.userScale;
  }

  public getUserYaw(): number {
    return this.userYawRad;
  }

  public setUserScale(scale: number): void {
    this.userScale = defaultClampUserScale(scale);
    this.updateModelPlacementTransform();
  }

  public setUserYaw(yawRad: number): void {
    this.userYawRad = yawRad;
    this.updateModelPlacementTransform();
  }

  public resetRealSize(): void {
    this.userScale = REAL_SIZE_USER_SCALE;
    this.updateModelPlacementTransform();
  }

  public reposition(): void {
    if (this.currentAnchor?.delete) {
      try {
        this.currentAnchor.delete();
      } catch {
        // Anchor cleanup
      }
    }
    this.currentAnchor = null;
    this.fixedPoseMatrix = null;
    this.isPlaced = false;
    this.dishGroup.visible = false;

    this.reticle.setState('scanning');
    this.setTrackingState('scanning');
  }

  public resetPlacement(): void {
    this.reposition();
  }

  public getModelContainer(): THREE.Group {
    return this.modelContainer;
  }

  public getLoadedModelRoot(): THREE.Object3D | null {
    return (
      this.loadedModelRoot ??
      (this.modelContainer.children[0] as THREE.Object3D | undefined) ??
      null
    );
  }

  public init(): Promise<void> {
    return this.start();
  }

  // ---------------------------------------------------------------------------
  // Model Loading, Ground Contact Alignment & Progressive LOD
  // ---------------------------------------------------------------------------

  private getOrCreateLoaders(): {
    gltfLoader: GLTFLoader;
    dracoLoader: DRACOLoader;
  } {
    if (!this.dracoLoader) {
      this.dracoLoader = new DRACOLoader();
      this.dracoLoader.setDecoderPath('/draco/');
    }
    if (!this.gltfLoader) {
      this.gltfLoader = new GLTFLoader();
      this.gltfLoader.setDRACOLoader(this.dracoLoader);
      try {
        if (!this.ktx2Loader) {
          this.ktx2Loader = new KTX2Loader();
          this.ktx2Loader.setTranscoderPath('/basis-ktx2/');
          this.ktx2Loader.detectSupport(this.renderer);
        }
        this.gltfLoader.setKTX2Loader(this.ktx2Loader);
      } catch {
        // Optional KTX2 support
      }
    }
    return { gltfLoader: this.gltfLoader, dracoLoader: this.dracoLoader };
  }

  private async loadDishModel(url: string): Promise<void> {
    const { gltfLoader } = this.getOrCreateLoaders();

    try {
      const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
        gltfLoader.load(url, resolve, undefined, reject);
      });

      if (this.disposed) return;
      const root = gltf.scene;

      // Calculate raw model bounds
      root.updateMatrixWorld(true);
      const bbox = new THREE.Box3().setFromObject(root);

      this.rawModelBBox = {
        min: [bbox.min.x, bbox.min.y, bbox.min.z],
        max: [bbox.max.x, bbox.max.y, bbox.max.z],
      };

      this.disposeObjectHierarchy(this.modelContainer);
      this.modelContainer.clear();
      this.loadedModelRoot = root;
      this.modelContainer.add(root);

      this.modelLoaded = true;
      this.updateModelPlacementTransform();

      perfMark('ar:model-ready', { dishSlug: this.dishSlug, url });
      if (this.isPlaced) {
        perfMark('ar:model-visible', { dishSlug: this.dishSlug });
      }

      this.onModelLoaded?.();
    } catch (err) {
      this.onError?.(err as Error);
    }
  }

  /**
   * Progressively upgrades placed model to target LOD without disturbing the established world anchor.
   */
  public async upgradeLod(targetModelUrl: string): Promise<boolean> {
    if (this.disposed || !this.isPlaced || !targetModelUrl || targetModelUrl === this.modelUrl) {
      return false;
    }

    const { gltfLoader } = this.getOrCreateLoaders();

    try {
      const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
        gltfLoader.load(targetModelUrl, resolve, undefined, reject);
      });

      if (this.disposed || !this.isPlaced) {
        this.disposeObjectHierarchy(gltf.scene);
        return false;
      }

      const newRoot = gltf.scene;
      newRoot.updateMatrixWorld(true);
      const bbox = new THREE.Box3().setFromObject(newRoot);

      this.rawModelBBox = {
        min: [bbox.min.x, bbox.min.y, bbox.min.z],
        max: [bbox.max.x, bbox.max.y, bbox.max.z],
      };

      // Safely dispose old model
      this.disposeObjectHierarchy(this.modelContainer);
      this.modelContainer.clear();
      this.loadedModelRoot = newRoot;
      this.modelContainer.add(newRoot);

      this.modelUrl = targetModelUrl;

      // Re-apply scale & offset to new root without touching dishGroup anchor
      this.updateModelPlacementTransform();

      perfMark('model:full-quality', { dishSlug: this.dishSlug, url: targetModelUrl });
      return true;
    } catch {
      // LOD upgrade failure is non-fatal: retain current lightweight model
      return false;
    }
  }

  private updateModelPlacementTransform(): void {
    // modelContainer stays at (0, 0, 0) with scale (1, 1, 1) and handles yaw rotation around centered anchor origin
    this.modelContainer.position.set(0, 0, 0);
    this.modelContainer.scale.set(1, 1, 1);
    this.modelContainer.rotation.y = this.userYawRad;

    if (!this.rawModelBBox) return;

    const transform = this.computeTransformFn({
      bboxMin: this.rawModelBBox.min,
      bboxMax: this.rawModelBBox.max,
      spec: this.dishPhysicalSpec,
      userScale: this.userScale,
    });

    // Apply scale and offset to the inner loaded model child so pivot point is centered
    const targetRoot =
      this.loadedModelRoot ??
      (this.modelContainer.children[0] as THREE.Object3D | undefined) ??
      null;

    if (targetRoot) {
      targetRoot.scale.set(
        transform.uniformScale,
        transform.uniformScale,
        transform.uniformScale
      );
      targetRoot.position.set(...transform.offset);
    }

    // Align contact shadow to ground plane (y=0)
    if (this.contactShadowMesh) {
      const realFootprintM = cmToMetres(
        Math.max(this.dishPhysicalSpec.dimensions.widthCm, this.dishPhysicalSpec.dimensions.depthCm)
      );
      const radius = (realFootprintM * 0.55) * this.userScale;
      this.contactShadowMesh.scale.set(radius, radius, 1);
    }
  }

  private setupContactShadow(): void {
    // Ground plane disc at y = 0
    const geo = new THREE.CircleGeometry(1, 32);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      color: 0x0C0805,
      transparent: true,
      opacity: this.qualityProfile.shadowTechnique === 'contact-blob' ? 0.45 : 0.6,
      depthWrite: false,
    });

    this.contactShadowMesh = new THREE.Mesh(geo, mat);
    this.contactShadowMesh.position.set(0, 0.001, 0); // 1mm above table to avoid z-fighting
    this.dishGroup.add(this.contactShadowMesh);
  }

  // ---------------------------------------------------------------------------
  // Lifecycle & Cleanup
  // ---------------------------------------------------------------------------

  private setTrackingState(state: XRTrackingState, details?: unknown): void {
    this.trackingState = state;
    this.onTrackingStateChange?.(state, details);
  }

  private handleSessionEnd(): void {
    perfMark('ar:session-ended', { dishSlug: this.dishSlug });
    this.dispose();
    this.setTrackingState('session-ended');
  }

  private handleVisibilityChange(): void {
    if (document.hidden && this.session) {
      // Pause or suspend on tab hide
      this.setTrackingState('tracking-limited', 'document-hidden');
    }
  }

  private disposeMaterialAndTextures(material: THREE.Material): void {
    const mat = material as unknown as Record<string, unknown>;
    const textureSlots = [
      'map',
      'normalMap',
      'roughnessMap',
      'metalnessMap',
      'aoMap',
      'emissiveMap',
      'sheenColorMap',
      'specularColorMap',
      'clearcoatNormalMap',
      'clearcoatRoughnessMap',
      'transmissionMap',
      'thicknessMap',
    ];
    for (const slot of textureSlots) {
      const tex = mat[slot];
      if (tex && typeof (tex as { dispose?: () => void }).dispose === 'function') {
        (tex as { dispose: () => void }).dispose();
      }
    }
    material.dispose();
  }

  private disposeObjectHierarchy(root: THREE.Object3D): void {
    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => this.disposeMaterialAndTextures(m));
        } else if (mesh.material) {
          this.disposeMaterialAndTextures(mesh.material);
        }
      }
    });
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    this.session.removeEventListener('select', this.handleSelect);
    this.session.removeEventListener('end', this.handleSessionEnd);
    if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    this.renderer.setAnimationLoop(null);

    if (this.hitTestSource?.cancel) {
      this.hitTestSource.cancel();
      this.hitTestSource = null;
    }

    if (this.currentAnchor?.delete) {
      try {
        this.currentAnchor.delete();
      } catch {
        // Anchor cleanup
      }
      this.currentAnchor = null;
    }

    this.reticle.dispose();

    this.loadedModelRoot = null;

    // Dispose scene meshes, geometries, materials, and textures
    this.disposeObjectHierarchy(this.scene);

    if (this.dracoLoader) {
      this.dracoLoader.dispose();
      this.dracoLoader = null;
    }
    if (this.ktx2Loader) {
      this.ktx2Loader.dispose();
      this.ktx2Loader = null;
    }

    this.renderer.dispose();
    if (this.renderer?.domElement?.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
