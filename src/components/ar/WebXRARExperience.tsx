'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ARHeader } from './ARHeader';
import { ARTrackingStatus } from './ARTrackingStatus';
import { requestWebXRImmersiveArSession } from '@/lib/xr/webxr-session';
import { WebXRAREngine } from '@/lib/xr/webxr-ar-engine';
import type { XRTrackingState, PlacementRecord } from '@/lib/xr/spatial-contract';
import { ROUTE_LABELS } from '@/lib/xr/spatial-contract';
import { resolveXRSessionQualityProfile } from '@/lib/xr/ar-quality-profile';
import { Sparkles } from 'lucide-react';

export interface WebXRARExperienceProps {
  dishSlug: string;
  modelUrl: string;
  upgradeModelUrl?: string;
  dishTitle?: string;
  onExit: () => void;
  onFallback?: (reason: string) => void;
  className?: string;
}

export function WebXRARExperience({
  dishSlug,
  modelUrl,
  upgradeModelUrl,
  dishTitle,
  onExit,
  onFallback,
  className = '',
}: WebXRARExperienceProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<WebXRAREngine | null>(null);
  const sessionRef = useRef<XRSession | null>(null);

  const [trackingState, setTrackingState] = useState<XRTrackingState>('requesting-session');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [userScale, setUserScale] = useState<number>(1.0);
  const [isPlaced, setIsPlaced] = useState<boolean>(false);
  const [needsUserGesture, setNeedsUserGesture] = useState<boolean>(false);

  // Touch gesture tracking state for 2-finger pinch & twist
  const touchStateRef = useRef<{
    initialDistance: number;
    initialAngle: number;
    initialScale: number;
    initialYaw: number;
  }>({
    initialDistance: 0,
    initialAngle: 0,
    initialScale: 1.0,
    initialYaw: 0,
  });

  const handleExit = useCallback(async () => {
    try {
      if (sessionRef.current) {
        await sessionRef.current.end();
      }
    } catch {
      // Session may already be closed
    } finally {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      onExit();
    }
  }, [onExit]);

  const handleReposition = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resetPlacement();
      setIsPlaced(false);
      setTrackingState('scanning');
    }
  }, []);

  const handleResetScale = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resetRealSize();
      setUserScale(1.0);
    }
  }, []);

  // Multi-touch gestures for pinch-to-scale and two-finger rotate (only active after placement)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isPlaced || e.touches.length !== 2) return;

    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    touchStateRef.current = {
      initialDistance: distance,
      initialAngle: angle,
      initialScale: engineRef.current ? engineRef.current.getUserScale() : 1.0,
      initialYaw: engineRef.current ? engineRef.current.getUserYaw() : 0,
    };
  }, [isPlaced]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPlaced || e.touches.length !== 2 || !engineRef.current) return;

    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    const { initialDistance, initialAngle, initialScale, initialYaw } = touchStateRef.current;

    if (initialDistance > 0) {
      const scaleMultiplier = distance / initialDistance;
      const targetScale = initialScale * scaleMultiplier;
      engineRef.current.setUserScale(targetScale);
      setUserScale(engineRef.current.getUserScale());
    }

    const angleDelta = angle - initialAngle;
    engineRef.current.setUserYaw(initialYaw - angleDelta);
  }, [isPlaced]);

  const startSession = useCallback(async () => {
    if (!overlayRef.current) return;
    setNeedsUserGesture(false);
    setTrackingState('requesting-session');
    setErrorMessage(undefined);

    try {
      // Request session with domOverlay pointing to our overlay root
      const session = await requestWebXRImmersiveArSession({
        domOverlayRoot: overlayRef.current,
      });

      sessionRef.current = session;

      // Session ended listener
      session.addEventListener('end', () => {
        setTrackingState('session-ended');
        onExit();
      });

      // Initialize quality profile
      const qualityProfile = resolveXRSessionQualityProfile({
        grantedXRFeatures: ['hit-test', 'dom-overlay'],
        saveData: false,
      });

      // Initialize WebXR AR Engine
      const engine = new WebXRAREngine({
        session,
        dishSlug,
        modelUrl,
        upgradeModelUrl,
        container: canvasContainerRef.current,
        qualityProfile,
        onTrackingStateChange: (state, details) => {
          setTrackingState(state);
          if (state === 'placed') {
            setIsPlaced(true);
          } else if (state === 'scanning' || state === 'surface-detected') {
            setIsPlaced(false);
          }
          if (typeof details === 'string') {
            setErrorMessage(details);
          }
        },
        onPlacementComplete: (record: PlacementRecord) => {
          setIsPlaced(true);
          setUserScale(record.userScale);
        },
        onError: (err) => {
          setErrorMessage(err.message);
          setTrackingState('error');
        },
      });

      engineRef.current = engine;
      await engine.init();
    } catch (err) {
      const error = err as Error;
      const msg = error.message || 'Failed to initialize WebXR';
      // If error is security or user activation related, present explicit user gesture button
      if (
        error.name === 'SecurityError' ||
        error.name === 'NotAllowedError' ||
        /gesture|activation|user/i.test(msg)
      ) {
        setNeedsUserGesture(true);
        setTrackingState('idle');
      } else {
        setErrorMessage(msg);
        setTrackingState('error');
        onFallback?.(msg);
      }
    }
  }, [dishSlug, modelUrl, upgradeModelUrl, onExit, onFallback]);

  useEffect(() => {
    // Parallelize: prefetch initial ultra-light model buffer over HTTP
    if (typeof fetch === 'function' && modelUrl) {
      void fetch(modelUrl, { mode: 'cors' }).catch(() => {});
    }

    void startSession();

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      if (sessionRef.current) {
        sessionRef.current.end().catch(() => {});
        sessionRef.current = null;
      }
    };
  }, [startSession, modelUrl]);

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 overflow-hidden bg-black/10 select-none ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      data-testid="webxr-ar-experience"
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={canvasContainerRef} className="absolute inset-0 pointer-events-none" />

      {/* DOM Overlay UI Header */}
      <ARHeader
        onExit={handleExit}
        modeBadgeLabel={ROUTE_LABELS['webxr-immersive-ar']}
        isWorldTracked={true}
      />

      {/* DOM Overlay Tracking HUD */}
      <div className="absolute inset-x-0 top-16 bottom-6 flex flex-col justify-between px-4 pointer-events-none">
        <ARTrackingStatus
          state={trackingState}
          dishTitle={dishTitle}
          userScale={userScale}
          onReposition={handleReposition}
          onResetScale={handleResetScale}
          errorMessage={errorMessage}
          className="h-full"
        />
      </div>

      {/* User Gesture Activation Gate for browsers requiring synchronous user tap */}
      {needsUserGesture && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 px-6 backdrop-blur-md pointer-events-auto">
          <div className="max-w-sm w-full p-6 rounded-2xl bg-[#140F0C] border border-[#F0C36B]/40 shadow-2xl flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-[#F0C36B]/15 border border-[#F0C36B]/50 flex items-center justify-center text-[#F0C36B] mb-4">
              <Sparkles className="w-7 h-7 text-[#F0C36B]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#F8F2E8] mb-2">
              Start Tabletop AR
            </h3>
            <p className="text-xs text-[#D4C7B6] mb-6 font-light leading-relaxed">
              Experience {dishTitle || 'dish'} in authentic 1:1 real-world size on your dining table.
            </p>
            <button
              type="button"
              data-testid="webxr-start-gesture-btn"
              onClick={startSession}
              className="w-full min-h-[48px] py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide text-[#17100C] shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
              style={{
                background: 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
              }}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Tap to Enter AR</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
