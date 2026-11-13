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

  const activeDishKey = dish.slug || dish.id;
  const [progress, setProgress] = useState(15);
  const [isLoaded, setIsLoaded] = useState(false);
  const [settledDishKey, setSettledDishKey] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<{ key: string; message: string } | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [supportsFullscreen, setSupportsFullscreen] = useState(true);

  const error = errorState?.key === activeDishKey ? errorState.message : null;
  const isSwitchingDish = Boolean(isLoaded && settledDishKey && settledDishKey !== activeDishKey && !error);

  // Detect browser Fullscreen API availability (iOS Safari iPhone disables requestFullscreen)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const doc = document as Document & { webkitFullscreenEnabled?: boolean };
    const rootEl = viewerRootRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void })
      | null;
    const enabled = Boolean(
      doc.fullscreenEnabled ||
        doc.webkitFullscreenEnabled ||
        rootEl?.requestFullscreen ||
        rootEl?.webkitRequestFullscreen
    );
    setSupportsFullscreen(enabled);
  }, []);

  useEffect(() => {
    if (!isSwitchingDish) return;
    const switchWatchdog = setTimeout(() => setSettledDishKey(activeDishKey), 1800);
    return () => clearTimeout(switchWatchdog);
  }, [isSwitchingDish, activeDishKey]);

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
      const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
      const currentFs = document.fullscreenElement;
      if (currentFs && rootEl && currentFs === rootEl) {
        document.exitFullscreen?.().catch(() => {});
      } else if ((document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement === rootEl) {
        doc.webkitExitFullscreen?.();
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
      setSettledDishKey((prev) => prev ?? activeDishKey);
      setIsLoaded(true);
    }, 2500);
    return () => clearTimeout(watchdog);
  }, [retryKey, activeDishKey]);

  const handleProgress = useCallback(
    (p: number) => {
      setProgress((prev) => Math.max(prev, p));
      if (p >= 100) {
        setProgress(100);
        setSettledDishKey(activeDishKey);
        if (loadedTimerRef.current) clearTimeout(loadedTimerRef.current);
        loadedTimerRef.current = setTimeout(() => setIsLoaded(true), 120);
      }
    },
    [activeDishKey]
  );

  const handleLoaded = useCallback(() => {
    setProgress(100);
    setSettledDishKey(activeDishKey);
    if (loadedTimerRef.current) clearTimeout(loadedTimerRef.current);
    loadedTimerRef.current = setTimeout(() => setIsLoaded(true), 80);
  }, [activeDishKey]);

  const handleError = useCallback(
    (msg: string) => {
      setSettledDishKey(activeDishKey);
      setErrorState({ key: activeDishKey, message: msg });
    },
    [activeDishKey]
  );

  const handleControlsRef = useCallback((ref: OrbitControlsType | null) => {
    controlsRef.current = ref;
  }, []);

  const handleReset = useCallback(() => {
    setCameraPreset('side');
    setResetSignal((s) => s + 1);
  }, []);

  const handleRetry = useCallback(() => {
    setErrorState(null);
    setIsLoaded(false);
    setSettledDishKey(null);
    setProgress(15);
    setRetryKey((k) => k + 1);
  }, []);

  const handleDoubleTap = useCallback(() => {
    handleReset();
  }, [handleReset]);

  const handleToggleCameraAngle = useCallback(() => {
    setCameraPreset((prev) => (prev === 'side' ? 'top' : 'side'));
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomSignal({ id: Date.now(), factor: 0.85 });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomSignal({ id: Date.now(), factor: 1.18 });
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    const rootEl = viewerRootRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void })
      | null;
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    if (!rootEl) return;

    if (!document.fullscreenElement && !doc.webkitFullscreenElement) {
      if (rootEl.requestFullscreen) {
        rootEl.requestFullscreen().catch(() => {});
      } else if (rootEl.webkitRequestFullscreen) {
        Promise.resolve(rootEl.webkitRequestFullscreen()).catch(() => {});
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (doc.webkitExitFullscreen) {
      Promise.resolve(doc.webkitExitFullscreen()).catch(() => {});
    }
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

      {/* Layer 3: Warm Amber Glow around the central turntable pedestal */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[700px] h-[220px] sm:h-[350px] pointer-events-none opacity-45"
        style={{
          background: 'radial-gradient(ellipse, rgba(240, 195, 107, 0.35) 0%, transparent 70%)',
          filter: activeQualityTier === 'low' ? undefined : 'blur(45px)',
        }}
      />

      {/* Top Luxury Navigation Header (Responsive: Desktop shows "3D Food Lounge", Mobile has top controls) */}
      <ViewerHeader
        dishName={dish.name}
        dishSlug={dish.slug}
        dishCategory={dish.category}
      >
        {isLoaded && (
          <ViewerControls
            variant="mobile"
            hideSettingsModal
            isSettingsOpen={isSettingsOpen}
            onOpenSettingsChange={setIsSettingsOpen}
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
            onToggleFullscreen={supportsFullscreen ? handleToggleFullscreen : undefined}
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
        {isLoaded && isSwitchingDish && !error && (
          <div className="pointer-events-none fixed top-16 sm:top-20 left-1/2 sm:left-[calc((100vw-370px)/2)] -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(16,12,9,0.85)] backdrop-blur-xl border border-[#F0C36B]/40 text-[#FFE1A0] text-[11px] font-medium shadow-lg animate-in fade-in duration-150">
            <span className="w-2 h-2 rounded-full bg-[#F0C36B] animate-ping" />
            <span>Plating {dish.name}…</span>
          </div>
        )}
        {error && <ViewerErrorState message={error} onRetry={handleRetry} />}

        {/* Persistent 3D Scene Viewport */}
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
          onControlsRef={handleControlsRef}
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

        {/* Vertical Floating 3D Controls Dock on Left (Original Desktop Position for Laptops) */}
        {isLoaded && (
          <ViewerControls
            variant="desktop"
            hideSettingsModal
            isSettingsOpen={isSettingsOpen}
            onOpenSettingsChange={setIsSettingsOpen}
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
            onToggleFullscreen={supportsFullscreen ? handleToggleFullscreen : undefined}
            arHref={arHref}
            qualityMode={qualityMode}
            activeQualityTier={activeQualityTier}
            onChangeQualityMode={setQualityMode}
          />
        )}
      </div>

      {/* Horizontal Dish Selection & Category Filter Dock (Desktop and Laptop) */}
      {isLoaded && allModelDishes.length > 0 && (
        <DishSwitcher
          dishes={allModelDishes}
          currentDishId={dish.id}
          currentCategory={dish.category}
          onSwitchDish={onSwitchDish}
        />
      )}

      {/* Product Information & Order Console (Desktop: Original Right-hand 2-Zone Glass Box; Mobile: Compact Bottom Console) */}
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

      {/* Hoisted Studio Calibration Modal rendered cleanly above z-40 UI stacking contexts */}
      {isLoaded && (
        <ViewerControls
          variant="modal"
          isSettingsOpen={isSettingsOpen}
          onOpenSettingsChange={setIsSettingsOpen}
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
          onToggleFullscreen={supportsFullscreen ? handleToggleFullscreen : undefined}
          arHref={arHref}
          qualityMode={qualityMode}
          activeQualityTier={activeQualityTier}
          onChangeQualityMode={setQualityMode}
        />
      )}
    </div>
  );
}
