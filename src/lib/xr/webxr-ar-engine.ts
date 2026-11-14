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

import type {
  XRTrackingState,
  PlacementRecord,
  PlacementAnchorKind,
  DishPhysicalSpec,
} from './spatial-contract';
import {
  REAL_SIZE_USER_SCALE,
  cmToMetres,
} from './spatial-contract';
import {
  computeDishPlacementTransform,
  isHorizontalSurface,
  clampUserScale,
} from './placement-math';
import { createPlacementReticle } from './placement-reticle';
import { getDishPhysicalSpec } from '../../data/dish-dimensions';

import {
  resolveXRSessionQualityProfile,
  XRFrameTimeMonitor,
} from './ar-quality-profile';
import type { XRSessionQualityProfile } from './ar-quality-profile';

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
}

export interface WebXRAREngineOptions {
  session: XRSession;
  dishSlug: string;
  modelUrl: string;
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
  private contactShadowMesh: THREE.Mesh | null = null;

  private xrEstimatedLight: THREE.Object3D | null = null;
  private hemisphereLight: THREE.HemisphereLight;
  private keyDirectionalLight: THREE.DirectionalLight;
  private fillDirectionalLight: THREE.DirectionalLight;

  private dishSlug: string;
  private modelUrl: string;
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
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: this.qualityProfile.antialias,
      powerPreference: this.qualityProfile.powerPreference,
    });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;

    if (options.container) {
      options.container.appendChild(this.renderer.domElement);
    } else {
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
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  public async start(): Promise<void> {
    try {
      this.renderer.xr.setReferenceSpaceType('local');
      await this.renderer.xr.setSession(this.session);

      // Request reference spaces
      try {
        this.refSpace = await this.session.requestReferenceSpace('local-floor');
      } catch {
        this.refSpace = await this.session.requestReferenceSpace('local');
      }

      this.viewerSpace = await this.session.requestReferenceSpace('viewer');

      // Request hit test source from viewer space
      if (this.session.requestHitTestSource) {
        this.hitTestSource =
          (await this.session.requestHitTestSource({
            space: this.viewerSpace,
          })) ?? null;
      }

      // Load model asynchronously
      void this.loadDishModel();

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
        this.setTrackingState('tracking-limited', reason);
        this.reticle.setState('hidden');
      }
      // Render without teleporting or modifying dish pose
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.trackingState === 'tracking-limited') {
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

  public init(): Promise<void> {
    return this.start();
  }

  // ---------------------------------------------------------------------------
  // Model Loading & Ground Contact Alignment
  // ---------------------------------------------------------------------------

  private async loadDishModel(): Promise<void> {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    try {
      const ktx2Loader = new KTX2Loader();
      ktx2Loader.setTranscoderPath('/basis-ktx2/');
      ktx2Loader.detectSupport(this.renderer);
      gltfLoader.setKTX2Loader(ktx2Loader);
    } catch {
      // Optional KTX2 support
    }

    try {
      const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
        gltfLoader.load(this.modelUrl, resolve, undefined, reject);
      });

      const root = gltf.scene;

      // Calculate raw model bounds
      root.updateMatrixWorld(true);
      const bbox = new THREE.Box3().setFromObject(root);

      this.rawModelBBox = {
        min: [bbox.min.x, bbox.min.y, bbox.min.z],
        max: [bbox.max.x, bbox.max.y, bbox.max.z],
      };

      this.modelContainer.clear();
      this.modelContainer.add(root);

      this.updateModelPlacementTransform();
      this.onModelLoaded?.();
    } catch (err) {
      this.onError?.(err as Error);
    } finally {
      dracoLoader.dispose();
    }
  }

  private updateModelPlacementTransform(): void {
    if (!this.rawModelBBox) return;

    const transform = this.computeTransformFn({
      bboxMin: this.rawModelBBox.min,
      bboxMax: this.rawModelBBox.max,
      spec: this.dishPhysicalSpec,
      userScale: this.userScale,
    });

    this.modelContainer.scale.set(
      transform.uniformScale,
      transform.uniformScale,
      transform.uniformScale
    );
    this.modelContainer.position.set(...transform.offset);
    this.modelContainer.rotation.y = this.userYawRad;

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
    this.dispose();
    this.setTrackingState('session-ended');
  }

  private handleVisibilityChange(): void {
    if (document.hidden && this.session) {
      // Pause or suspend on tab hide
      this.setTrackingState('tracking-limited', 'document-hidden');
    }
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    this.session.removeEventListener('select', this.handleSelect);
    this.session.removeEventListener('end', this.handleSessionEnd);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

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

    // Dispose scene meshes, geometries, materials
    this.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
