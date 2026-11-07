'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import type { ModelConfig } from '@/data/model-config';
import type { QualityTier } from '@/hooks/useQualityTier';
import type { Dish, AddOn } from '@/types/menu';
import { ViewerHeader } from './ViewerHeader';
import { ViewerControls, type ViewerQualityMode } from './ViewerControls';
import { ViewerLoadingState } from './ViewerLoadingState';
import { ViewerErrorState } from './ViewerErrorState';
import { ViewerEditorialHero } from './ViewerEditorialHero';
import { FloatingIngredientAnnotations } from './FloatingIngredientAnnotations';
import { DishInfoBar } from './DishInfoBar';
import { DishSwitcher } from './DishSwitcher';
import { IngredientPanel } from './IngredientPanel';

// Lazy load the entire R3F scene so no 3D code loads on non-3D routes
const ViewerScene = dynamic(
  () => import('./ViewerScene').then((mod) => ({ default: mod.ViewerScene })),
  { ssr: false }
);

interface ThreeDViewerProps {
  dish: Dish;
  config: ModelConfig;
  allModelDishes: Array<{
    id: string;
    slug?: string;
    name: string;
    image: string;
    price?: number;
    category?: string;
    isVeg?: boolean;
    description?: string;
    ingredients?: string[];
  }>;
  onSwitchDish: (dishId: string) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToCart: (quantity?: number, selectedAddOns?: AddOn[]) => void;
}

export function ThreeDViewer({
  dish,
  config,
  allModelDishes,
  onSwitchDish,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
}: ThreeDViewerProps) {
  const viewerRootRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsType | null>(null);
  const loadedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [autoRotate, setAutoRotate] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<'side' | 'top'>('side');
  const [qualityMode, setQualityMode] = useState<ViewerQualityMode>('auto');
  const [activeQualityTier, setActiveQualityTier] = useState<QualityTier>('medium');
  const [zoomSignal, setZoomSignal] = useState<{ id: number; factor: number } | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [progress, setProgress] = useState(15);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  // Clean up any pending reveal timeout on unmount
  useEffect(() => {
    return () => {
      if (loadedTimerRef.current) {
        clearTimeout(loadedTimerRef.current);
      }
    };
  }, []);

  // Fullscreen lifecycle listener with strict cleanup on unmount
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const rootEl = viewerRootRef.current;

    const handleFullscreenChange = () => {
      const fsElement =
        document.fullscreenElement ||
        (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement;
      setIsFullscreen(Boolean(fsElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      const currentFs = document.fullscreenElement;
      if (currentFs && rootEl && currentFs === rootEl) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Active dynamic progress simulation: smoothly ticks from 15% -> 92% while chunk & model load
  useEffect(() => {
    if (isLoaded) return;
    let current = 15;

    const interval = setInterval(() => {
      current = Math.min(92, current + (current < 50 ? 14 : current < 75 ? 8 : 3));
      setProgress((prev) => Math.max(prev, current));
    }, 70);

    return () => clearInterval(interval);
  }, [isLoaded, retryKey]);

  // Safety watchdog: Automatically unveils the 3D scene after 2.5s maximum
  useEffect(() => {
    const watchdog = setTimeout(() => {
      setProgress(100);
      setIsLoaded(true);
    }, 2500);
    return () => clearTimeout(watchdog);
  }, [retryKey]);

  const handleProgress = useCallback((p: number) => {
    setProgress((prev) => Math.max(prev, p));
    if (p >= 100) {
      setProgress(100);
      if (loadedTimerRef.current) clearTimeout(loadedTimerRef.current);
      loadedTimerRef.current = setTimeout(() => setIsLoaded(true), 120);
    }
  }, []);

  const handleLoaded = useCallback(() => {
    setProgress(100);
    if (loadedTimerRef.current) clearTimeout(loadedTimerRef.current);
    loadedTimerRef.current = setTimeout(() => setIsLoaded(true), 80);
  }, []);

  const handleError = useCallback((msg: string) => {
    setError(msg);
  }, []);

  const handleReset = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    setCameraPreset('side');
    setResetSignal((s) => s + 1);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomSignal((prev) => ({ id: (prev?.id ?? 0) + 1, factor: 0.8 }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomSignal((prev) => ({ id: (prev?.id ?? 0) + 1, factor: 1.25 }));
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    const fsElement =
      document.fullscreenElement ||
      (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement;

    if (!fsElement) {
      const el = viewerRootRef.current as
        | (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> })
        | null;
      if (el?.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (el?.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoaded(false);
    setProgress(15);
    setRetryKey((k) => k + 1);
  }, []);

  const handleDoubleTap = useCallback(() => {
    handleReset();
  }, [handleReset]);

  const handleToggleCameraAngle = useCallback(() => {
    setCameraPreset((prev) => (prev === 'side' ? 'top' : 'side'));
  }, []);

  const handleViewDetails = useCallback(() => {
    setShowInfo(true);
  }, []);

  const arHref = `/ar/${dish.slug || dish.id}`;

  return (
    <div
      ref={viewerRootRef}
      className="fixed inset-0 h-[100dvh] z-50 flex flex-col overflow-hidden select-none bg-[#0B0907]"
      style={{ backgroundColor: '#0B0907' }}
    >
      {/* Layer 1: Ultra-Realistic Luxury Restaurant 3D Studio Backdrop */}
      <div
        className="absolute inset-0 pointer-events-none bg-cover bg-center transition-opacity duration-700"
        style={{
          backgroundImage: "url('/images/3d-lounge-bg.jpg')",
          backgroundPosition: 'center 45%',
          backgroundSize: 'cover',
          opacity: 0.98,
        }}
      />

      {/* Layer 2: Subtle Ambient Contrast Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(20, 15, 11, 0.1) 40%, rgba(16, 12, 9, 0.45) 80%, rgba(10, 8, 6, 0.75) 100%)',
        }}
      />

      {/* Layer 3: Warm Amber Glow around the central turntable pedestal (lightweight radial gradient on low tier) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[700px] h-[220px] sm:h-[350px] pointer-events-none opacity-45"
        style={{
          background: 'radial-gradient(ellipse, rgba(240, 195, 107, 0.35) 0%, transparent 70%)',
          filter: activeQualityTier === 'low' ? undefined : 'blur(45px)',
        }}
      />

      {/* Top Luxury Navigation Header with integrated 3D Camera Controls */}
      <ViewerHeader
        dishName={dish.name}
        dishSlug={dish.slug}
        dishCategory={dish.category}
      >
        {isLoaded && (
          <ViewerControls
            onReset={handleReset}
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((prev) => !prev)}
            showHotspots={showHotspots}
            onToggleHotspots={() => setShowHotspots((prev) => !prev)}
            cameraPreset={cameraPreset}
            onToggleCameraAngle={handleToggleCameraAngle}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            arHref={arHref}
            qualityMode={qualityMode}
            activeQualityTier={activeQualityTier}
            onChangeQualityMode={setQualityMode}
          />
        )}
      </ViewerHeader>

      {/* Left Editorial Hero Panel (Desktop & Tablet) */}
      <ViewerEditorialHero dish={dish} onExplore3D={handleReset} />

      {/* Main 3D Canvas Stage */}
      <div className="flex-1 relative min-h-0">
        {!isLoaded && !error && <ViewerLoadingState progress={progress} />}
        {error && <ViewerErrorState message={error} onRetry={handleRetry} />}

        {/* Persistent 3D Scene Viewport: swaps FoodModel cleanly without WebGL context churn */}
        <ViewerScene
          key={`viewer-canvas-${retryKey}`}
          config={config}
          category={dish.category}
          autoRotate={autoRotate}
          showHotspots={showHotspots}
          cameraPreset={cameraPreset}
          qualityMode={qualityMode}
          zoomSignal={zoomSignal}
          resetSignal={resetSignal}
          onActiveQualityChange={setActiveQualityTier}
          onControlsRef={(ref) => {
            controlsRef.current = ref;
          }}
          onProgress={handleProgress}
          onLoaded={handleLoaded}
          onError={handleError}
          onDoubleTap={handleDoubleTap}
        />

        {/* Floating Ingredient Callout Annotations */}
        {isLoaded && (
          <FloatingIngredientAnnotations
            dish={dish}
            visible={showHotspots}
          />
        )}
      </div>

      {/* Horizontal Dish Selection & Category Filter Dock (Desktop only, hidden on mobile per user request) */}
      {isLoaded && allModelDishes.length > 0 && (
        <div className="hidden sm:block">
          <DishSwitcher
            dishes={allModelDishes}
            currentDishId={dish.id}
            currentCategory={dish.category}
            onSwitchDish={onSwitchDish}
          />
        </div>
      )}

      {/* Wide Product Information & Order Console */}
      {isLoaded && (
        <DishInfoBar
          dish={dish}
          onAddToCart={onAddToCart}
          onViewDetails={handleViewDetails}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      {/* Ingredient Details Drawer */}
      <IngredientPanel
        ingredients={dish.ingredients || []}
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
      />
    </div>
  );
}
