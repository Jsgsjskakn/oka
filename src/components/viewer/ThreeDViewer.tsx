'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import type { ModelConfig } from '@/data/model-config';
import type { Dish } from '@/types/menu';
import { ViewerHeader } from './ViewerHeader';
import { ViewerControls } from './ViewerControls';
import { ViewerLoadingState } from './ViewerLoadingState';
import { ViewerErrorState } from './ViewerErrorState';
import { InstructionOverlay } from './InstructionOverlay';
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
    name: string;
    image: string;
    price?: number;
    category?: string;
    isVeg?: boolean;
  }>;
  onSwitchDish: (dishId: string) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToCart: (quantity?: number) => void;
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
  const router = useRouter();
  const [autoRotate, setAutoRotate] = useState(false);
  const [showHotspots, setShowHotspots] = useState(false);
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

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden select-none"
      style={{ backgroundColor: '#0D0A08' }}
    >
      {/* Layer 2: Center Spotlight (Radial Chandelier Glow) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(226, 168, 75, 0.16) 0%, rgba(224, 83, 43, 0.05) 35%, rgba(13, 10, 8, 0.98) 70%)',
        }}
      />

      {/* Layer 3: Floor Reflection Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(13, 10, 8, 0.98) 0%, rgba(13, 10, 8, 0.45) 22%, transparent 55%)',
        }}
      />

      {/* Floating Spatial HUD Bar */}
      <ViewerHeader
        dishName={dish.name}
        dishSlug={dish.slug}
        dishCategory={dish.category}
      />

      {/* Main 3D Canvas Stage */}
      <div className="flex-1 relative">
        {!isLoaded && !error && <ViewerLoadingState progress={progress} />}
        {error && <ViewerErrorState message={error} onRetry={handleRetry} />}
        {isLoaded && <InstructionOverlay />}

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

        {/* Vertical Glass Camera Dock */}
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

      {/* Floating Glass Dish Carousel */}
      {isLoaded && allModelDishes.length > 1 && (
        <DishSwitcher
          dishes={allModelDishes}
          currentDishId={dish.id}
          onSwitchDish={onSwitchDish}
        />
      )}

      {/* Floating Architectural Order Console */}
      {isLoaded && (
        <DishInfoBar
          dish={dish}
          onAddToCart={onAddToCart}
          onViewDetails={handleViewDetails}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      {/* Ingredient Panel Drawer */}
      <IngredientPanel
        ingredients={dish.ingredients || []}
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
      />
    </div>
  );
}
