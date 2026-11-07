'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { Zap, Moon, Cpu } from 'lucide-react';

export interface CameraTarget {
  position: [number, number, number] | THREE.Vector3;
  target: [number, number, number] | THREE.Vector3;
  fov?: number;
  dampingLambda?: number;
}

export interface FrameloopTelemetry {
  fps: number;
  isIdle: boolean;
  isTransitioning: boolean;
  isInteracting: boolean;
  estimatedWattage: number;
  totalFramesRendered: number;
}

interface DemandFrameloopContextValue {
  invalidate: () => void;
  requestFrames: (count?: number) => void;
  transitionTo: (target: CameraTarget, onComplete?: () => void) => void;
  cancelTransition: () => void;
  telemetry: FrameloopTelemetry;
}

const DemandFrameloopContext = createContext<DemandFrameloopContextValue | null>(null);

export function useDemandFrameloopContext() {
  return useContext(DemandFrameloopContext);
}

export interface DemandFrameloopControllerProps {
  controlsRef?: React.RefObject<OrbitControlsType | null>;
  targetCamera?: CameraTarget | null;
  onTargetReached?: () => void;
  deps?: ReadonlyArray<unknown>;
  onTelemetryChange?: (telemetry: FrameloopTelemetry) => void;
  dampingLambda?: number;
  epsilon?: number;
  enableTelemetry?: boolean;
  children?: ReactNode;
}

/**
 * DemandFrameloopController
 *
 * High-performance on-demand rendering coordinator for React Three Fiber.
 * Drops GPU rendering from unthrottled 60 FPS (3.8W-5.2W) to 0 FPS (~0.1W) when idle,
 * and completely halts frame requests + telemetry timers when `document.visibilityState === 'hidden'`.
 *
 * Automatically invalidates on:
 * - OrbitControls start, change, end, and inertial damping
 * - Table/dish selection, hover, and arbitrary prop dependencies
 * - Smooth camera transitions (interpolating until velocity < epsilon, then sleeping)
 * - Window resize, orientation changes, and tab visibility restoration
 */
export function DemandFrameloopController({
  controlsRef,
  targetCamera,
  onTargetReached,
  deps = [],
  onTelemetryChange,
  dampingLambda = 5.5,
  epsilon = 0.001,
  enableTelemetry = false,
  children,
}: DemandFrameloopControllerProps) {
  const { invalidate, size, controls: contextControls } = useThree();
  const controlsPropRef = useRef(controlsRef);

  useEffect(() => {
    controlsPropRef.current = controlsRef;
  }, [controlsRef]);

  // Document visibility state (suspends frame invalidation & telemetry polling when hidden)
  const [isDocumentVisible, setIsDocumentVisible] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.visibilityState !== 'hidden' : true
  );
  const isHiddenRef = useRef<boolean>(false);

  useEffect(() => {
    isHiddenRef.current = !isDocumentVisible;
  }, [isDocumentVisible]);

  const safeInvalidate = useCallback(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    invalidate();
  }, [invalidate]);

  // Transition state
  const currentTargetRef = useRef<CameraTarget | null>(null);
  const onTargetReachedRef = useRef<(() => void) | undefined>(onTargetReached);

  useEffect(() => {
    onTargetReachedRef.current = onTargetReached;
  }, [onTargetReached]);

  // Instance-safe reusable scratch vectors for useFrame (eliminates per-frame heap allocations)
  const scratchTargetPos = useRef(new THREE.Vector3());
  const scratchTargetLook = useRef(new THREE.Vector3());

  // Interaction & Damping State
  const isInteractingRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const dampingFramesRemaining = useRef(0);
  const extraFramesRequested = useRef(0);

  // Telemetry state
  const frameTimestamps = useRef<number[]>([]);
  const totalFramesCount = useRef(0);
  const [telemetry, setTelemetry] = useState<FrameloopTelemetry>({
    fps: 0,
    isIdle: true,
    isTransitioning: false,
    isInteracting: false,
    estimatedWattage: 0.1,
    totalFramesRendered: 0,
  });

  // Listen to document visibility changes: halt background work when hidden, refresh once on wake
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      const visible = document.visibilityState !== 'hidden';
      isHiddenRef.current = !visible;
      setIsDocumentVisible(visible);

      if (!visible) {
        isInteractingRef.current = false;
        dampingFramesRemaining.current = 0;
        extraFramesRequested.current = 0;
        frameTimestamps.current = [];
        if (enableTelemetry || onTelemetryChange) {
          const hiddenSnapshot: FrameloopTelemetry = {
            fps: 0,
            isIdle: true,
            isTransitioning: false,
            isInteracting: false,
            estimatedWattage: 0.05,
            totalFramesRendered: totalFramesCount.current,
          };
          setTelemetry(hiddenSnapshot);
          onTelemetryChange?.(hiddenSnapshot);
        }
      } else {
        extraFramesRequested.current = 2;
        invalidate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [invalidate, enableTelemetry, onTelemetryChange]);

  // Track targetCamera prop changes
  useEffect(() => {
    if (targetCamera) {
      currentTargetRef.current = targetCamera;
      isTransitioningRef.current = true;
      safeInvalidate();
    } else {
      currentTargetRef.current = null;
      isTransitioningRef.current = false;
    }
  }, [targetCamera, safeInvalidate]);

  // Request extra consecutive frames (e.g. for animations or transitions)
  const requestFrames = useCallback(
    (count = 10) => {
      if (isHiddenRef.current) return;
      extraFramesRequested.current = Math.max(extraFramesRequested.current, count);
      safeInvalidate();
    },
    [safeInvalidate]
  );

  // Public transition function
  const transitionTo = useCallback(
    (target: CameraTarget, onComplete?: () => void) => {
      currentTargetRef.current = target;
      isTransitioningRef.current = true;
      onTargetReachedRef.current = onComplete;
      safeInvalidate();
    },
    [safeInvalidate]
  );

  const cancelTransition = useCallback(() => {
    currentTargetRef.current = null;
    isTransitioningRef.current = false;
  }, []);

  // Invalidate on dependencies change (e.g. table selection, dish switch, hover, filter change)
  useEffect(() => {
    if (isHiddenRef.current) return;
    safeInvalidate();
    // Wake up a few frames to let any CSS/HTML/shadow transition settle cleanly
    extraFramesRequested.current = 5;
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  // Invalidate on viewport size or window resize
  useEffect(() => {
    safeInvalidate();
    const handleResize = () => safeInvalidate();
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [size.width, size.height, safeInvalidate]);

  // Wire up OrbitControls events
  useEffect(() => {
    const controls = controlsRef?.current || (contextControls as OrbitControlsType | null);
    if (!controls) return;

    const handleStart = () => {
      isInteractingRef.current = true;
      // If user drags, cancel programmatic camera glide to prioritize user intent
      if (isTransitioningRef.current) {
        cancelTransition();
      }
      safeInvalidate();
    };

    const handleChange = () => {
      safeInvalidate();
    };

    const handleEnd = () => {
      isInteractingRef.current = false;
      // Allow up to 60 frames for OrbitControls inertia damping to settle smoothly
      dampingFramesRemaining.current = 60;
      safeInvalidate();
    };

    controls.addEventListener('start', handleStart);
    controls.addEventListener('change', handleChange);
    controls.addEventListener('end', handleEnd);

    return () => {
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('change', handleChange);
      controls.removeEventListener('end', handleEnd);
    };
  }, [controlsRef, contextControls, safeInvalidate, cancelTransition]);

  // Main demand frame hook
  useFrame((state, delta) => {
    // Hard guard: never schedule frames when document tab is hidden
    if (isHiddenRef.current || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) {
      dampingFramesRemaining.current = 0;
      extraFramesRequested.current = 0;
      return;
    }

    const now = performance.now();
    frameTimestamps.current.push(now);
    totalFramesCount.current += 1;

    let needsAnotherDemandFrame = false;
    const clampedDelta = Math.min(delta, 0.1);
    const camera = state.camera;
    const controls = controlsPropRef.current?.current || (state.controls as OrbitControlsType | null);

    // 1. Process active camera transition / glide
    if (currentTargetRef.current && isTransitioningRef.current) {
      const target = currentTargetRef.current;
      const targetPos = scratchTargetPos.current;
      if (target.position instanceof THREE.Vector3) {
        targetPos.copy(target.position);
      } else {
        targetPos.set(target.position[0], target.position[1], target.position[2]);
      }

      const targetLook = scratchTargetLook.current;
      if (target.target instanceof THREE.Vector3) {
        targetLook.copy(target.target);
      } else {
        targetLook.set(target.target[0], target.target[1], target.target[2]);
      }

      const lambda = target.dampingLambda || dampingLambda;

      // Instant snap when reduced motion is requested (dampingLambda >= 900)
      if (lambda >= 900) {
        camera.position.copy(targetPos);
        if (controls) {
          controls.target.copy(targetLook);
          controls.update();
        } else {
          camera.lookAt(targetLook);
        }
        if (target.fov && (camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
          const perspCam = camera as THREE.PerspectiveCamera;
          perspCam.fov = target.fov;
          perspCam.updateProjectionMatrix();
        }
        isTransitioningRef.current = false;
        currentTargetRef.current = null;
        if (onTargetReachedRef.current) {
          onTargetReachedRef.current();
        }
        return;
      }

      // Smoothly damp camera position towards destination
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetPos.x, lambda, clampedDelta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetPos.y, lambda, clampedDelta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetPos.z, lambda, clampedDelta);

      // Smoothly damp controls target
      if (controls) {
        controls.target.x = THREE.MathUtils.damp(controls.target.x, targetLook.x, lambda, clampedDelta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, targetLook.y, lambda, clampedDelta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, targetLook.z, lambda, clampedDelta);
        controls.update();
      } else {
        camera.lookAt(targetLook);
      }

      // Smoothly damp FOV if target specifies fov
      let fovSettled = true;
      if (target.fov && (camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        const perspCam = camera as THREE.PerspectiveCamera;
        perspCam.fov = THREE.MathUtils.damp(perspCam.fov, target.fov, lambda, clampedDelta);
        perspCam.updateProjectionMatrix();
        if (Math.abs(perspCam.fov - target.fov) > 0.05) {
          fovSettled = false;
        }
      }

      // Check distance to target
      const posDistSq = camera.position.distanceToSquared(targetPos);
      const targetDistSq = controls ? controls.target.distanceToSquared(targetLook) : 0;
      const epsilonSq = epsilon * epsilon;

      if (posDistSq > epsilonSq || targetDistSq > epsilonSq || !fovSettled) {
        needsAnotherDemandFrame = true;
      } else {
        // Snap exactly to target to eliminate sub-pixel float drift
        camera.position.copy(targetPos);
        if (controls) {
          controls.target.copy(targetLook);
          controls.update();
        } else {
          camera.lookAt(targetLook);
        }
        if (target.fov && (camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
          const perspCam = camera as THREE.PerspectiveCamera;
          perspCam.fov = target.fov;
          perspCam.updateProjectionMatrix();
        }
        isTransitioningRef.current = false;
        currentTargetRef.current = null;
        if (onTargetReachedRef.current) {
          onTargetReachedRef.current();
        }
        // One final settle frame, then fall asleep
        needsAnotherDemandFrame = false;
      }
    }

    // 2. Handle inertia damping after user releases pointer
    if (dampingFramesRemaining.current > 0) {
      dampingFramesRemaining.current -= 1;
      if (controls && controls.enableDamping) {
        const moved = Boolean((controls as unknown as { update?: () => boolean }).update?.());
        // If OrbitControls reports that it has completely ceased moving, end damping early
        if (!moved && dampingFramesRemaining.current < 45) {
          dampingFramesRemaining.current = 0;
        } else {
          needsAnotherDemandFrame = true;
        }
      } else {
        needsAnotherDemandFrame = true;
      }
    }

    // 3. User is actively dragging / touching
    if (isInteractingRef.current) {
      needsAnotherDemandFrame = true;
    }

    // 4. Extra frames requested (e.g. for UI transitions)
    if (extraFramesRequested.current > 0) {
      extraFramesRequested.current -= 1;
      needsAnotherDemandFrame = true;
    }

    // Schedule next frame if animation or interaction is active
    if (needsAnotherDemandFrame) {
      safeInvalidate();
    }
  });

  // Telemetry periodic polling (every 280ms ONLY while document is visible!)
  useEffect(() => {
    if (!enableTelemetry && !onTelemetryChange) return;
    if (!isDocumentVisible) return;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      const now = performance.now();
      // Remove timestamps older than 1000ms
      frameTimestamps.current = frameTimestamps.current.filter((t) => now - t <= 1000);
      const recentFps = frameTimestamps.current.length;

      // If no frames in the last 250ms, mark as completely idle (0 FPS)
      const lastFrameTime = frameTimestamps.current[frameTimestamps.current.length - 1] || 0;
      const isActuallyIdle = now - lastFrameTime > 250 || recentFps === 0;
      const currentFps = isActuallyIdle ? 0 : recentFps;

      // Estimated GPU draw power:
      // Mobile / integrated baseline idle: ~0.1W - 0.2W
      // Active rendering at 60 FPS: ~4.2W - 4.8W
      const wattage = isActuallyIdle
        ? 0.1
        : Number((0.6 + (currentFps / 60) * 3.8).toFixed(1));

      const updated: FrameloopTelemetry = {
        fps: currentFps,
        isIdle: isActuallyIdle,
        isTransitioning: isTransitioningRef.current,
        isInteracting: isInteractingRef.current,
        estimatedWattage: wattage,
        totalFramesRendered: totalFramesCount.current,
      };

      setTelemetry(updated);
      onTelemetryChange?.(updated);
    }, 280);

    return () => clearInterval(interval);
  }, [enableTelemetry, onTelemetryChange, isDocumentVisible]);

  if (!children) {
    return null;
  }

  return (
    <DemandFrameloopContext.Provider
      value={{
        invalidate: safeInvalidate,
        requestFrames,
        transitionTo,
        cancelTransition,
        telemetry,
      }}
    >
      {children}
    </DemandFrameloopContext.Provider>
  );
}

/**
 * DemandFrameloopBadge
 *
 * Floating HUD pill displaying real-time FPS, idle sleep state, and GPU power consumption.
 * Visibly demonstrates the drop to 0 FPS / 0.1W when idle, and 60 FPS / 4.2W upon interaction.
 */
export function DemandFrameloopBadge({
  telemetry,
  className = '',
}: {
  telemetry: FrameloopTelemetry;
  className?: string;
}) {
  const isZeroFps = telemetry.isIdle || telemetry.fps === 0;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono border backdrop-blur-xl transition-all duration-300 select-none shadow-lg ${
        isZeroFps
          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30 shadow-emerald-950/30'
          : 'bg-[#18130C]/90 text-[#F0C36B] border-[#F0C36B]/40 shadow-[#F0C36B]/20 animate-pulse'
      } ${className}`}
      title="On-Demand Energy Efficiency Monitor (Phase 2 Architect)"
    >
      <div className="flex items-center gap-1.5">
        {isZeroFps ? (
          <Moon className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Zap className="w-3.5 h-3.5 text-[#F0C36B]" />
        )}
        <span className="font-bold tracking-wider">
          {telemetry.fps} FPS
        </span>
      </div>

      <span className="opacity-40">|</span>

      <span className="text-[10px] tracking-wide">
        {isZeroFps ? (
          <span className="text-emerald-300 font-semibold">SLEEPING (0 FPS)</span>
        ) : telemetry.isTransitioning ? (
          <span className="text-[#F0C36B] font-semibold">GLIDING (DEMAND)</span>
        ) : (
          <span className="text-[#F0C36B] font-semibold">ACTIVE (DEMAND)</span>
        )}
      </span>

      <span className="opacity-40">|</span>

      <div className="flex items-center gap-1 text-[10px]">
        <Cpu className="w-3 h-3 opacity-70" />
        <span>~{telemetry.estimatedWattage.toFixed(1)}W (EST)</span>
      </div>
    </div>
  );
}
