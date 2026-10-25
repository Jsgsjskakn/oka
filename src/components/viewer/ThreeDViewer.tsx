'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
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
  allModelDishes: Array<{ id: string; name: string; image: string }>;
  onSwitchDish: (dishId: string) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToCart: () => void;
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

  const handleViewDetails = useCallback(() => {
    router.push(`/menu/${dish.category}/${dish.slug}`);
  }, [router, dish]);

  return (
    <div className="fixed inset-0 bg-obsidian z-50 flex flex-col">
      <ViewerHeader dishName={dish.name} />

      <div className="flex-1 relative">
        {!isLoaded && !error && <ViewerLoadingState progress={progress} />}
        {error && <ViewerErrorState message={error} onRetry={handleRetry} />}
        {isLoaded && <InstructionOverlay />}

        <ViewerScene
          key={`${config.dishSlug}-${retryKey}`}
          config={config}
          autoRotate={autoRotate}
          onControlsRef={(ref) => { controlsRef.current = ref; }}
          onProgress={handleProgress}
          onLoaded={handleLoaded}
          onError={handleError}
          onDoubleTap={handleDoubleTap}
        />

        {isLoaded && (
          <ViewerControls
            onReset={handleReset}
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
            onToggleInfo={() => setShowInfo(!showInfo)}
            showInfo={showInfo}
          />
        )}
      </div>

      {/* Dish Switcher */}
      {isLoaded && allModelDishes.length > 1 && (
        <DishSwitcher
          dishes={allModelDishes}
          currentDishId={dish.id}
          onSwitchDish={onSwitchDish}
        />
      )}

      {/* Dish Info Bar */}
      {isLoaded && (
        <DishInfoBar
          dish={dish}
          onAddToCart={onAddToCart}
          onViewDetails={handleViewDetails}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      {/* Ingredient Panel */}
      <IngredientPanel
        ingredients={dish.ingredients || []}
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
      />
    </div>
  );
}
