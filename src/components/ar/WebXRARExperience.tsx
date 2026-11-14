'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ARHeader } from './ARHeader';
import { ARTrackingStatus } from './ARTrackingStatus';
import { requestWebXRImmersiveArSession } from '@/lib/xr/webxr-session';
import { WebXRAREngine } from '@/lib/xr/webxr-ar-engine';
import type { XRTrackingState, PlacementRecord } from '@/lib/xr/spatial-contract';
import { ROUTE_LABELS } from '@/lib/xr/spatial-contract';
import { resolveXRSessionQualityProfile } from '@/lib/xr/ar-quality-profile';

export interface WebXRARExperienceProps {
  dishSlug: string;
  modelUrl: string;
  dishTitle?: string;
  onExit: () => void;
  onFallback?: (reason: string) => void;
  className?: string;
}

export function WebXRARExperience({
  dishSlug,
  modelUrl,
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

  useEffect(() => {
    let isCancelled = false;

    async function initWebXR() {
      if (!overlayRef.current) return;

      try {
        setTrackingState('requesting-session');

        // Request session with domOverlay pointing to our overlay root
        const session = await requestWebXRImmersiveArSession({
          domOverlayRoot: overlayRef.current,
        });

        if (isCancelled) {
          await session.end().catch(() => {});
          return;
        }

        sessionRef.current = session;

        // Session ended listener
        session.addEventListener('end', () => {
          if (!isCancelled) {
            setTrackingState('session-ended');
            onExit();
          }
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
          container: canvasContainerRef.current,
          qualityProfile,
          onTrackingStateChange: (state, details) => {
            if (isCancelled) return;
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
            if (isCancelled) return;
            setIsPlaced(true);
            setUserScale(record.userScale);
          },
          onError: (err) => {
            if (isCancelled) return;
            setErrorMessage(err.message);
            setTrackingState('error');
          },
        });

        engineRef.current = engine;
        await engine.init();
      } catch (err) {
        if (isCancelled) return;
        const msg = (err as Error).message || 'Failed to initialize WebXR';
        setErrorMessage(msg);
        setTrackingState('error');
        onFallback?.(msg);
      }
    }

    void initWebXR();

    return () => {
      isCancelled = true;
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      if (sessionRef.current) {
        sessionRef.current.end().catch(() => {});
        sessionRef.current = null;
      }
    };
  }, [dishSlug, modelUrl, onExit, onFallback]);

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
    </div>
  );
}
