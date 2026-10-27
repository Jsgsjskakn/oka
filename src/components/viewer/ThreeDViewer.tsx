'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import type { ModelConfig } from '@/data/model-config';
import type { Dish, AddOn } from '@/types/menu';
import { ViewerHeader } from './ViewerHeader';
import { ViewerControls } from './ViewerControls';
import { ViewerLoadingState } from './ViewerLoadingState';
import { ViewerErrorState } from './ViewerErrorState';
import { ViewerEditorialHero } from './ViewerEditorialHero';
import { FloatingIngredientAnnotations } from './FloatingIngredientAnnotations';
import { DishInfoBar } from './DishInfoBar';
import { DishSwitcher } from './DishSwitcher';
import { IngredientPanel } from './IngredientPanel';

// Lazy load the entire R3F scene so no 3D code loads on other pages
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
  const [autoRotate, setAutoRotate] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<'side' | 'top'>('side');
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const controlsRef = useRef<OrbitControlsType | null>(null);

  const handleProgress = useCallback((p: number) => {
    setProgress(p);
    if (p >= 100) {
      setTimeout(() => setIsLoaded(true), 300);
    }
  }, []);

  const handleLoaded = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback((msg: string) => {
    setError(msg);
  }, []);

  const handleReset = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      setCameraPreset('side');
    }
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoaded(false);
    setProgress(0);
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

  // Filter dishes strictly to current category per user request ("bas us type ka catagories ka he dishes rahega")
  const currentCategorySlug = (dish.category || '').toLowerCase();
  const categoryDishes = allModelDishes.filter((d) => {
    const itemCat = (d.category || '').toLowerCase();
    return itemCat === currentCategorySlug;
  });
  const dishesToShow = categoryDishes.length > 0 ? categoryDishes : allModelDishes;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden select-none bg-[#0B0907]"
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
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] pointer-events-none opacity-45"
        style={{
          background: 'radial-gradient(ellipse, rgba(240, 195, 107, 0.35) 0%, transparent 70%)',
          filter: 'blur(45px)',
        }}
      />

      {/* Top Luxury Navigation Header */}
      <ViewerHeader
        dishName={dish.name}
        dishSlug={dish.slug}
        dishCategory={dish.category}
      />

      {/* Left Editorial Hero Panel (Desktop & Tablet) */}
      <ViewerEditorialHero dish={dish} onExplore3D={handleReset} />

      {/* Main 3D Canvas Stage */}
      <div className="flex-1 relative">
        {!isLoaded && !error && <ViewerLoadingState progress={progress} />}
        {error && <ViewerErrorState message={error} onRetry={handleRetry} />}

        {/* 3D Scene Viewport */}
        <ViewerScene
          key={`${config.dishSlug}-${retryKey}`}
          config={config}
          category={dish.category}
          autoRotate={autoRotate}
          showHotspots={showHotspots}
          cameraPreset={cameraPreset}
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

        {/* Vertical Floating 3D Controls Dock */}
        {isLoaded && (
          <ViewerControls
            onReset={handleReset}
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
            showHotspots={showHotspots}
            onToggleHotspots={() => setShowHotspots(!showHotspots)}
            cameraPreset={cameraPreset}
            onToggleCameraAngle={handleToggleCameraAngle}
          />
        )}
      </div>

      {/* Horizontal Dish Selection Carousel - Filtered to Current Category */}
      {isLoaded && dishesToShow.length > 1 && (
        <DishSwitcher
          dishes={dishesToShow}
          currentDishId={dish.id}
          currentCategory={dish.category}
          onSwitchDish={onSwitchDish}
        />
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
