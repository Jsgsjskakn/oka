'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import type { ModelConfig } from '@/data/model-config';
import type { Dish } from '@/types/menu';
import { getHotspots } from '@/data/ar-config';
import { CameraFeed } from './CameraFeed';
import { ARLoadingState } from './ARLoadingState';
import { ARPermissionDenied } from './ARPermissionDenied';
import { ARUnsupported } from './ARUnsupported';
import { ARInstructionsOverlay } from './ARInstructionsOverlay';
import { ARHeader } from './ARHeader';
import { ARControls } from './ARControls';
import { ARDishInfo } from './ARDishInfo';
import { ARHotspotLayer } from './ARHotspotLayer';
import { ARShareSheet } from './ARShareSheet';

// Lazy load the R3F AR scene
const ARScene = dynamic(
  () => import('./ARScene').then((mod) => ({ default: mod.ARScene })),
  { ssr: false }
);

type ARState = 'loading' | 'permission_denied' | 'unsupported' | 'camera_ready' | 'placing' | 'placed' | 'error' | 'tracking_lost';

interface ARViewerProps {
  dish: Dish;
  config: ModelConfig;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToCart: () => void;
}

export function ARViewer({ dish, config, isFavorite, onToggleFavorite, onAddToCart }: ARViewerProps) {
  const router = useRouter();
  const [state, setState] = useState<ARState>('loading');
  const [modelProgress, setModelProgress] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [modelScale, setModelScale] = useState(1);
  const [modelRotation, setModelRotation] = useState(0);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [projectedHotspots, setProjectedHotspots] = useState<Array<{
    id: string; name: string; description: string; screenX: number; screenY: number;
  }>>([]);

  const hotspots = getHotspots(dish.slug);

  // Touch gesture tracking
  const touchRef = useRef<{
    lastTouchDist: number;
    lastX: number;
    isScaling: boolean;
  }>({ lastTouchDist: 0, lastX: 0, isScaling: false });

  // Check basic compatibility
  useEffect(() => {
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    if (!hasMedia) setState('unsupported');
  }, []);

  const handleCameraReady = useCallback(() => setState('placing'), []);

  const handleCameraError = useCallback((error: string) => {
    if (error === 'permission_denied') setState('permission_denied');
    else if (error === 'no_camera') setState('unsupported');
    else setState('error');
  }, []);

  const handleModelLoaded = useCallback(() => setModelLoaded(true), []);

  const handleTapToPlace = useCallback(() => {
    if (state === 'placing' && modelLoaded) {
      setPlaced(true);
      setState('placed');
      if ('vibrate' in navigator) navigator.vibrate(15);
    }
  }, [state, modelLoaded]);

  const handleReset = useCallback(() => {
    setPlaced(false);
    setModelScale(1);
    setModelRotation(0);
    setState('placing');
  }, []);

  const handleReplace = useCallback(() => handleReset(), [handleReset]);

  const handleExit = useCallback(() => router.back(), [router]);
  const handleContinue3D = useCallback(() => router.push(`/3d/${dish.id}`), [router, dish.id]);
  const handleViewDetails = useCallback(() => router.push(`/menu/${dish.category}/${dish.slug}`), [router, dish]);

  // Capture screenshot
  const handleCapture = useCallback(async () => {
    try {
      const canvas = document.querySelector('#ar-canvas canvas') as HTMLCanvasElement;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `golden-oak-${dish.slug}-ar.png`;
      link.href = dataUrl;
      link.click();
      if ('vibrate' in navigator) navigator.vibrate(20);
    } catch {
      // Silent fail for capture
    }
  }, [dish.slug]);

  // Touch gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchRef.current.lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      touchRef.current.isScaling = true;
    } else if (e.touches.length === 1) {
      touchRef.current.lastX = e.touches[0].clientX;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!placed) return;
    if (e.touches.length === 2 && touchRef.current.isScaling) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / touchRef.current.lastTouchDist;
      setModelScale((s) => Math.max(0.5, Math.min(2.5, s * scale)));
      touchRef.current.lastTouchDist = dist;
    } else if (e.touches.length === 1 && placed) {
      const deltaX = e.touches[0].clientX - touchRef.current.lastX;
      setModelRotation((r) => r + deltaX * 0.005);
      touchRef.current.lastX = e.touches[0].clientX;
    }
  }, [placed]);

  const handleTouchEnd = useCallback(() => {
    touchRef.current.isScaling = false;
  }, []);

  const handleSingleTouch = useCallback(() => {
    if (state === 'placing' && modelLoaded) handleTapToPlace();
  }, [state, modelLoaded, handleTapToPlace]);

  if (state === 'permission_denied') {
    return <ARPermissionDenied onGoBack={handleExit} onContinue3D={handleContinue3D} />;
  }
  if (state === 'unsupported') {
    return <ARUnsupported dishId={dish.id} onGoBack={handleExit} />;
  }
  if (state === 'error') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-obsidian px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">Camera Unavailable</h2>
        <p className="text-sm text-text-secondary max-w-xs mb-8">
          The camera device could not be initialized or is being used by another application.
        </p>
        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={handleContinue3D}
            className="w-full py-3.5 rounded-full bg-primary text-black font-semibold text-sm active:scale-95 transition-transform"
          >
            View in 3D Mode Instead
          </button>
          <button
            onClick={handleExit}
            className="flex justify-center items-center w-full py-3.5 rounded-full bg-white/10 text-text-primary font-medium text-sm border border-white/5 active:scale-95 transition-transform"
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-obsidian z-50 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Camera feed */}
      <CameraFeed onReady={handleCameraReady} onError={handleCameraError} />

      {/* Loading overlay */}
      {(state === 'loading' || (state === 'placing' && !modelLoaded)) && (
        <ARLoadingState dishName={dish.name} dishImage={dish.image} progress={modelProgress} />
      )}

      {/* AR 3D scene overlay */}
      {(state === 'placing' || state === 'placed') && (
        <div className="absolute inset-0 z-10" id="ar-canvas" onClick={handleSingleTouch}>
          <ARScene
            config={config}
            placed={placed}
            modelScale={modelScale}
            modelRotation={modelRotation}
            hotspots={hotspots}
            showHotspots={showHotspots && placed}
            onProgress={setModelProgress}
            onModelLoaded={handleModelLoaded}
            onHotspotsProjected={setProjectedHotspots}
          />
        </div>
      )}

      {/* 2D Hotspot labels overlay */}
      {placed && showHotspots && projectedHotspots.length > 0 && (
        <ARHotspotLayer hotspots={projectedHotspots} isVisible={showHotspots} />
      )}

      {/* Placement hint */}
      {state === 'placing' && modelLoaded && (
        <div className="absolute bottom-40 left-0 right-0 z-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-obsidian/60 backdrop-blur-md border border-primary/20">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-text-primary/80">Tap to place dish</span>
          </div>
        </div>
      )}

      {/* Tracking lost */}
      {state === 'tracking_lost' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-obsidian/40">
          <div className="px-6 py-4 rounded-2xl bg-obsidian/80 backdrop-blur-lg border border-border-subtle text-center">
            <p className="text-sm text-text-primary font-medium mb-1">Tracking Lost</p>
            <p className="text-[10px] text-text-primary/40">Move your phone slowly to recover</p>
          </div>
        </div>
      )}

      {/* Instructions overlay (auto-dismiss) */}
      {state === 'placing' && modelLoaded && (
        <ARInstructionsOverlay />
      )}

      {/* AR Header */}
      {(state === 'placing' || state === 'placed') && (
        <ARHeader onExit={handleExit} />
      )}

      {/* AR Controls */}
      {state === 'placed' && (
        <ARControls
          isVisible={true}
          onReset={handleReset}
          onReplace={handleReplace}
          isPlaced={placed}
          showHotspots={showHotspots}
          onToggleHotspots={() => setShowHotspots(!showHotspots)}
          onCapture={handleCapture}
          onShare={() => setShowShareSheet(true)}
          onView3D={handleContinue3D}
        />
      )}

      {/* Dish info bar */}
      {(state === 'placing' || state === 'placed') && (
        <ARDishInfo
          dish={dish}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onAddToCart={onAddToCart}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Share sheet */}
      <ARShareSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        dishName={dish.name}
        dishId={dish.id}
      />
    </div>
  );
}
