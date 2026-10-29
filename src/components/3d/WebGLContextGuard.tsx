'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  Component,
  ErrorInfo,
  ReactNode,
} from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RotateCw, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { reinitializeSceneWebGL } from './webglRecovery';

export { reinitializeSceneWebGL };

export interface WebGLContextGuardProps {
  /** Optional callback fired immediately when webglcontextlost occurs */
  onContextLost?: (event: Event) => void;
  /** Optional callback fired when webglcontextrestored occurs and scene is reinitialized */
  onContextRestored?: () => void;
  /** Optional callback fired after custom scene reinitialization (e.g. for custom material passes) */
  onReinitialize?: (scene: THREE.Scene, gl: THREE.WebGLRenderer) => void;
  /** Max milliseconds to wait for context restore before triggering onTimeout (defaults to 5000ms) */
  restoreTimeoutMs?: number;
  /** Optional callback triggered if the browser fails to restore context within restoreTimeoutMs */
  onRestoreTimeout?: () => void;
  /** Name tag for logging and telemetry */
  canvasName?: string;
}

/**
 * WebGLContextGuard
 *
 * Essential lifecycle and recovery component rendered INSIDE an R3F <Canvas>.
 *
 * Capabilities:
 * 1. Attaches listeners for `webglcontextlost` and `webglcontextrestored` to the canvas DOM element.
 * 2. Calls `event.preventDefault()` on `webglcontextlost` — without this, the browser will NEVER
 *    restore the WebGL context on mobile/desktop GPUs.
 * 3. On context restore, traverses the scene, re-flags all materials and textures (`needsUpdate = true`),
 *    and requests fresh frames from R3F (`invalidate()`).
 * 4. Manages a recovery timeout to gracefully degrade to fallback UI if the GPU cannot reclaim VRAM.
 * 5. Dispatches custom window events `golden-oak:webgl-context-lost` and `golden-oak:webgl-context-restored`.
 */
export function WebGLContextGuard({
  onContextLost,
  onContextRestored,
  onReinitialize,
  restoreTimeoutMs = 5000,
  onRestoreTimeout,
  canvasName = 'Unnamed Canvas',
}: WebGLContextGuardProps) {
  const { gl, scene, invalidate } = useThree();
  const restoreTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLostRef = useRef(false);

  useEffect(() => {
    const canvasElement = gl.domElement;
    if (!canvasElement) return;

    const handleContextLost = (event: Event) => {
      // CRITICAL: event.preventDefault() instructs the browser that the application
      // intends to recover from the context loss, allowing `webglcontextrestored` to fire.
      event.preventDefault();
      isLostRef.current = true;

      console.warn(`[WebGLContextGuard] Context lost on [${canvasName}]. Preventing default to allow recovery.`);

      // Dispatch global notification for external telemetry / status banners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('golden-oak:webgl-context-lost', {
            detail: { canvasName, timestamp: Date.now() },
          })
        );
      }

      onContextLost?.(event);

      // Start recovery timeout guard
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = setTimeout(() => {
        if (isLostRef.current) {
          console.error(
            `[WebGLContextGuard] Context restore timed out after ${restoreTimeoutMs}ms on [${canvasName}]. Triggering fallback.`
          );
          onRestoreTimeout?.();
        }
      }, restoreTimeoutMs);
    };

    const handleContextRestored = () => {
      isLostRef.current = false;
      if (restoreTimerRef.current) {
        clearTimeout(restoreTimerRef.current);
        restoreTimerRef.current = null;
      }

      console.info(`[WebGLContextGuard] Context successfully restored on [${canvasName}]. Re-initializing scene...`);

      // 1. Re-initialize all standard Three.js materials, textures, and geometry attributes
      const { meshesUpdated, texturesUpdated } = reinitializeSceneWebGL(scene, gl);
      console.info(
        `[WebGLContextGuard] Re-initialized ${meshesUpdated} meshes and ${texturesUpdated} textures on [${canvasName}].`
      );

      // 2. Custom reinitialization hook (e.g. warrior materials, PBR architectural tuning)
      onReinitialize?.(scene, gl);

      // 3. Invalidate R3F frame loop to force render
      invalidate();

      // 4. Dispatch global restored notification
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('golden-oak:webgl-context-restored', {
            detail: { canvasName, timestamp: Date.now(), meshesUpdated, texturesUpdated },
          })
        );
        // Refresh contact shadows if any
        window.dispatchEvent(new CustomEvent('golden-oak:refresh-shadow'));
      }

      onContextRestored?.();
    };

    canvasElement.addEventListener('webglcontextlost', handleContextLost, false);
    canvasElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    return () => {
      canvasElement.removeEventListener('webglcontextlost', handleContextLost, false);
      canvasElement.removeEventListener('webglcontextrestored', handleContextRestored, false);
      if (restoreTimerRef.current) {
        clearTimeout(restoreTimerRef.current);
      }
      try {
        gl.renderLists?.dispose?.();
        gl.dispose?.();
      } catch {
        // Safe no-op if context already torn down
      }
    };
  }, [gl, scene, invalidate, onContextLost, onContextRestored, onReinitialize, restoreTimeoutMs, onRestoreTimeout, canvasName]);

  return null;
}

export interface WebGLErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error | null, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  name?: string;
  customMessage?: string;
  className?: string;
}

export interface WebGLErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRecovering: boolean;
}

/**
 * Universal WebGL Error Boundary
 *
 * Catches:
 * - Initial WebGL context creation failures (devices without WebGL, disabled hardware acceleration)
 * - Three.js shader compilation failures
 * - Out of VRAM allocations
 *
 * Provides a graceful, luxury-styled fallback with a retry mechanism.
 */
export class WebGLErrorBoundary extends Component<
  WebGLErrorBoundaryProps,
  WebGLErrorBoundaryState
> {
  constructor(props: WebGLErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<WebGLErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[WebGLErrorBoundary:${this.props.name || 'Canvas'}] Caught WebGL/3D render error:`,
      error,
      errorInfo
    );
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ isRecovering: true }, () => {
      setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null, isRecovering: false });
        this.props.onReset?.();
      }, 150);
    });
  };

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.reset);
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={`w-full h-full min-h-[280px] flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-[#0C0908] border border-[#F0C36B]/30 shadow-2xl backdrop-blur-xl ${
            this.props.className || ''
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-[#F0C36B]/10 border border-[#F0C36B]/30 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-[#F0C36B]" />
          </div>
          <h4 className="text-base font-serif font-medium text-[#F8F2E8] mb-1.5">
            {this.props.name ? `${this.props.name} 3D View Suspended` : '3D Viewport Suspended'}
          </h4>
          <p className="text-xs text-[#C8B89E] max-w-sm mb-5 leading-relaxed">
            {this.props.customMessage ||
              'Hardware acceleration or WebGL encountered an issue. System resources may be constrained.'}
          </p>
          <button
            type="button"
            onClick={this.reset}
            disabled={this.state.isRecovering}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F0C36B] text-black font-semibold text-xs tracking-wider uppercase shadow-lg shadow-[#D4AF37]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${this.state.isRecovering ? 'animate-spin' : ''}`} />
            <span>{this.state.isRecovering ? 'Reloading...' : 'Retry 3D View'}</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
