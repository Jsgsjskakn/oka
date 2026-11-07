'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Box,
  Camera,
  Check,
  Copy,
  Crosshair,
  QrCode,
  Smartphone,
  Sparkles,
  SunMedium,
  UtensilsCrossed,
  X,
  ArrowLeft,
} from 'lucide-react';
import { getModelConfig, type ModelConfig } from '@/data/model-config';
import { dishes as catalogDishes } from '@/data/mock-menu';
import type { Dish } from '@/types/menu';
import { getHotspots } from '@/data/ar-config';
import { useCartStore } from '@/store/cart-store';
import { useFavoritesStore } from '@/store/favorites-store';
import {
  DEFAULT_AR_LIGHT_ESTIMATE,
  detectARCapabilityMatrix,
  estimateLightingFromRgba,
  evaluateMotionStability,
  extractUsdzPath,
  hasMeaningfulLightChange,
  type ARCapabilityMatrix,
  type MotionStabilityState,
  type RealWorldLightEstimate,
} from '@/lib/three/ar-capabilities';
import { CameraFeed } from './CameraFeed';
import { ARLoadingState } from './ARLoadingState';
import { ARPermissionDenied } from './ARPermissionDenied';
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

type ARState =
  | 'loading'
  | 'permission_denied'
  | 'capability_gate'
  | 'camera_ready'
  | 'placing'
  | 'placed'
  | 'error'
  | 'tracking_lost';

export interface ARViewerProps {
  dish: Dish;
  config: ModelConfig;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToCart: () => void;
}

function loadDataUrlImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}

export function ARViewer({
  dish,
  config,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
}: ARViewerProps) {
  const router = useRouter();

  // Active dish & model config (supports seamless zero-reload dish switching inside AR)
  const [selectedDish, setSelectedDish] = useState<Dish>(dish);
  const [selectedConfig, setSelectedConfig] = useState<ModelConfig>(config);
  const [isDishSelectorOpen, setIsDishSelectorOpen] = useState(false);

  // Sync if parent route props change
  useEffect(() => {
    setSelectedDish(dish);
    setSelectedConfig(config);
  }, [dish, config]);

  const addCartItem = useCartStore((s) => s.addItem);
  const storeIsFavorite = useFavoritesStore((s) => s.isFavorite(selectedDish.slug));
  const storeToggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const effectiveIsFavorite =
    selectedDish.slug === dish.slug ? isFavorite : storeIsFavorite;

  const [state, setState] = useState<ARState>('loading');
  const [webcamPreviewEnabled, setWebcamPreviewEnabled] = useState(false);
  const [capabilities, setCapabilities] = useState<ARCapabilityMatrix | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [modelProgress, setModelProgress] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [modelScale, setModelScale] = useState(1);
  const [modelRotation, setModelRotation] = useState(0);
  const [modelOffsetXZ, setModelOffsetXZ] = useState<[number, number]>([0, 0]);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const [showHotspots, setShowHotspots] = useState(true);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [captureFlash, setCaptureFlash] = useState(false);
  const [projectedHotspots, setProjectedHotspots] = useState<
    Array<{
      id: string;
      name: string;
      description: string;
      screenX: number;
      screenY: number;
    }>
  >([]);

  // Real-world lighting state & offscreen 16x16 sampler refs
  const [lightEstimate, setLightEstimate] = useState<RealWorldLightEstimate>(
    DEFAULT_AR_LIGHT_ESTIMATE
  );
  const lightEstimateRef = useRef<RealWorldLightEstimate>(DEFAULT_AR_LIGHT_ESTIMATE);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const lightSamplerCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Imperative WebGL snapshot provider registered by ARScene (`preserveDrawingBuffer: false`)
  const snapshotProviderRef = useRef<(() => string | null) | null>(null);

  // Passive surface stability state
  const [motionStability, setMotionStability] = useState<MotionStabilityState>({
    level: 'stable',
    stabilityScore: 1,
    guidanceText: 'Table surface locked',
    recommendRecenter: false,
  });
  const stabilityScoreRef = useRef(1);

  const hotspots = useMemo(() => getHotspots(selectedDish.slug), [selectedDish.slug]);

  // Merged dish catalog for in-AR DishSelector (ensuring live route dish is first/accurate)
  const selectableDishes = useMemo(() => {
    const map = new Map<string, Dish>();
    map.set(dish.slug, dish);
    catalogDishes.forEach((d) => {
      if (!map.has(d.slug)) {
        map.set(d.slug, d);
      }
    });
    return Array.from(map.values());
  }, [dish]);

  // Touch & pointer gesture tracking
  const touchRef = useRef<{
    lastTouchDist: number;
    lastX: number;
    lastY: number;
    isScaling: boolean;
    moved: boolean;
  }>({ lastTouchDist: 0, lastX: 0, lastY: 0, isScaling: false, moved: false });

  const registerSnapshotProvider = useCallback(
    (provider: (() => string | null) | null) => {
      snapshotProviderRef.current = provider;
    },
    []
  );

  const handleVideoElement = useCallback((video: HTMLVideoElement | null) => {
    videoElementRef.current = video;
  }, []);

  // Probe full Cross-Platform AR Capability Matrix (WebXR, Android Scene Viewer, iOS Quick Look, Camera)
  useEffect(() => {
    let isMounted = true;
    const usdzPath = extractUsdzPath(selectedConfig);
    const glbPath =
      (selectedConfig.culinaryAssetLodPaths as any)?.balanced ||
      selectedConfig.modelPath;

    detectARCapabilityMatrix({
      glbPath,
      usdzPath,
      dishTitle: selectedDish.name,
    })
      .then((matrix) => {
        if (!isMounted) return;
        setCapabilities(matrix);

        if ((matrix.platform.isDesktop || !matrix.canRunInBrowserCameraAR) && !webcamPreviewEnabled) {
          setState('capability_gate');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setState('capability_gate');
      });

    return () => {
      isMounted = false;
    };
  }, [selectedConfig, selectedDish.name, webcamPreviewEnabled]);

  // Real-World Lighting Estimator: sample 16x16 offscreen canvas every 1500ms while visible
  useEffect(() => {
    if (state !== 'placing' && state !== 'placed') return;

    const sampleRoomLighting = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      const video = videoElementRef.current;
      if (!video || video.readyState < 2 || video.videoWidth <= 0 || video.videoHeight <= 0) {
        return;
      }

      if (!lightSamplerCanvasRef.current && typeof document !== 'undefined') {
        const offscreen = document.createElement('canvas');
        offscreen.width = 16;
        offscreen.height = 16;
        lightSamplerCanvasRef.current = offscreen;
      }

      const canvas = lightSamplerCanvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (!canvas || !ctx) return;

      try {
        ctx.drawImage(video, 0, 0, 16, 16);
        const { data } = ctx.getImageData(0, 0, 16, 16);
        const nextEstimate = estimateLightingFromRgba(data, lightEstimateRef.current);
        if (hasMeaningfulLightChange(lightEstimateRef.current, nextEstimate)) {
          lightEstimateRef.current = nextEstimate;
          setLightEstimate(nextEstimate);
        } else {
          lightEstimateRef.current = nextEstimate;
        }
      } catch {
        // Ignore transient cross-origin or decoder frame readiness errors
      }
    };

    // Initial sample shortly after camera stabilizes, then every 1500ms
    const initialTimer = setTimeout(sampleRoomLighting, 350);
    const intervalId = setInterval(sampleRoomLighting, 1500);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
    };
  }, [state]);

  // Passive DeviceMotion surface stability indicator (zero intrusive permission prompts)
  useEffect(() => {
    if (state !== 'placing' && state !== 'placed') return;
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return;

    // Skip on browsers requiring explicit modal permission (iOS 13+) so we never nag with popups
    const DeviceMotionWithPerm = window.DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof DeviceMotionWithPerm?.requestPermission === 'function') {
      return;
    }

    let lastEvalTs = 0;
    let lastGravityMag = 9.81;

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const now = Date.now();
      if (now - lastEvalTs < 350) return;
      lastEvalTs = now;

      const acc = event.accelerationIncludingGravity;
      const rot = event.rotationRate;
      const ax = acc?.x ?? 0;
      const ay = acc?.y ?? 0;
      const az = acc?.z ?? 0;
      const mag = Math.sqrt(ax * ax + ay * ay + az * az);
      const accelDelta = Math.abs(mag - lastGravityMag);
      lastGravityMag = mag * 0.7 + lastGravityMag * 0.3;

      const rx = rot?.alpha ?? 0;
      const ry = rot?.beta ?? 0;
      const rz = rot?.gamma ?? 0;
      const rotationRateDeg = Math.sqrt(rx * rx + ry * ry + rz * rz);

      const evaluated = evaluateMotionStability(
        { accelDelta, rotationRateDeg },
        stabilityScoreRef.current
      );
      stabilityScoreRef.current = evaluated.stabilityScore;
      setMotionStability((prev) =>
        prev.level !== evaluated.level || prev.recommendRecenter !== evaluated.recommendRecenter
          ? evaluated
          : prev
      );
    };

    window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, [state]);

  const handleCameraReady = useCallback(() => {
    setState((prev) => (prev === 'placed' ? 'placed' : 'placing'));
  }, []);

  const handleCameraError = useCallback((error: string) => {
    if (error === 'permission_denied') setState('permission_denied');
    else if (error === 'no_camera') setState('capability_gate');
    else setState('error');
  }, []);

  const handleModelLoaded = useCallback(() => setModelLoaded(true), []);

  const handleTapToPlace = useCallback(() => {
    if (state === 'placing' && modelLoaded) {
      setPlaced(true);
      setState('placed');
      setRecenterTrigger((n) => n + 1);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    }
  }, [state, modelLoaded]);

  const handleRecenterOnTable = useCallback(() => {
    setModelOffsetXZ([0, 0]);
    setModelRotation(0);
    setRecenterTrigger((n) => n + 1);
    stabilityScoreRef.current = 1;
    setMotionStability({
      level: 'stable',
      stabilityScore: 1,
      guidanceText: 'Table surface locked',
      recommendRecenter: false,
    });
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
  }, []);

  const handleReset = useCallback(() => {
    setPlaced(false);
    setModelScale(1);
    setModelRotation(0);
    setModelOffsetXZ([0, 0]);
    setState('placing');
  }, []);

  const handleReplace = useCallback(() => handleReset(), [handleReset]);

  const handleSwitchDishInAR = useCallback(
    (nextDish: Dish) => {
      setIsDishSelectorOpen(false);
      if (nextDish.slug === selectedDish.slug) return;

      const nextConfig = getModelConfig(nextDish.slug);
      setSelectedDish(nextDish);
      setSelectedConfig(nextConfig);
      setModelOffsetXZ([0, 0]);
      setRecenterTrigger((n) => n + 1);

      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `/ar/${nextDish.slug}`);
      }
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12);
      }
    },
    [selectedDish.slug]
  );

  const handleEffectiveToggleFavorite = useCallback(() => {
    if (selectedDish.slug === dish.slug) {
      onToggleFavorite();
    } else {
      storeToggleFavorite(selectedDish.slug);
    }
  }, [selectedDish.slug, dish.slug, onToggleFavorite, storeToggleFavorite]);

  const handleEffectiveAddToCart = useCallback(() => {
    if (selectedDish.slug === dish.slug) {
      onAddToCart();
    } else {
      addCartItem(selectedDish, 1, {});
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    }
  }, [selectedDish, dish.slug, onAddToCart, addCartItem]);

  const handleExit = useCallback(() => router.back(), [router]);
  const handleContinue3D = useCallback(
    () => router.push(`/3d/${selectedDish.slug}`),
    [router, selectedDish.slug]
  );
  const handleViewDetails = useCallback(
    () => router.push(`/3d/${selectedDish.slug}`),
    [router, selectedDish.slug]
  );

  const handleStartWebcamPreview = useCallback(() => {
    setWebcamPreviewEnabled(true);
    setState('loading');
  }, []);

  const handleCopyMobileLink = useCallback(() => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const shareHref = `${window.location.origin}/ar/${selectedDish.slug}`;
      navigator.clipboard.writeText(shareHref).catch(() => {});
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  }, [selectedDish.slug]);

  // Zero-Overhead AR Photo Compositor (Camera <video> + Synchronous WebGL Render + Golden Oak Watermark)
  const handleCapture = useCallback(async () => {
    try {
      const webglDataUrl = snapshotProviderRef.current?.() ?? null;
      if (!webglDataUrl) return;

      const viewW = Math.max(320, window.innerWidth || 720);
      const viewH = Math.max(320, window.innerHeight || 1280);
      const scaleFactor = Math.min(2, 1440 / Math.max(viewW, viewH));
      const outW = Math.round(viewW * scaleFactor);
      const outH = Math.round(viewH * scaleFactor);

      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = outW;
      compositeCanvas.height = outH;
      const ctx = compositeCanvas.getContext('2d');
      if (!ctx) return;

      // 1. Base Layer: Live Camera <video> with accurate object-cover center crop
      const video = videoElementRef.current;
      if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        const videoAspect = video.videoWidth / video.videoHeight;
        const outAspect = outW / outH;
        let sx = 0;
        let sy = 0;
        let sw = video.videoWidth;
        let sh = video.videoHeight;

        if (videoAspect > outAspect) {
          sw = video.videoHeight * outAspect;
          sx = (video.videoWidth - sw) / 2;
        } else {
          sh = video.videoWidth / outAspect;
          sy = (video.videoHeight - sh) / 2;
        }

        ctx.save();
        if (webcamPreviewEnabled) {
          ctx.translate(outW, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outW, outH);
        ctx.restore();
      } else {
        ctx.fillStyle = '#0D0A08';
        ctx.fillRect(0, 0, outW, outH);
      }

      // 2. 3D Dish Layer: Synchronously captured WebGL frame (`preserveDrawingBuffer: false`)
      const webglImg = await loadDataUrlImage(webglDataUrl);
      ctx.drawImage(webglImg, 0, 0, outW, outH);

      // 3. Watermark Layer: Subtle luxury Golden Oak attribution badge
      const barHeight = Math.round(Math.max(44, outH * 0.055));
      const grad = ctx.createLinearGradient(0, outH - barHeight * 1.6, 0, outH);
      grad.addColorStop(0, 'rgba(10, 7, 5, 0)');
      grad.addColorStop(1, 'rgba(10, 7, 5, 0.82)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, outH - barHeight * 1.6, outW, barHeight * 1.6);

      const padX = Math.round(outW * 0.045);
      const textY = outH - Math.round(barHeight * 0.42);
      ctx.font = `600 ${Math.max(13, Math.round(outW * 0.024))}px Georgia, serif`;
      ctx.fillStyle = '#F0C36B';
      ctx.fillText('THE GOLDEN OAK', padX, textY);

      ctx.font = `400 ${Math.max(11, Math.round(outW * 0.02))}px sans-serif`;
      ctx.fillStyle = 'rgba(250, 245, 236, 0.88)';
      const dishTag = `${selectedDish.name} • AR Table Preview`;
      const metrics = ctx.measureText(dishTag);
      ctx.fillText(dishTag, Math.max(padX + 150, outW - padX - metrics.width), textY);

      const finalDataUrl = compositeCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `golden-oak-${selectedDish.slug}-ar.png`;
      link.href = finalDataUrl;
      link.click();

      setCaptureFlash(true);
      setTimeout(() => setCaptureFlash(false), 260);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(20);
      }
    } catch {
      // Silent fail if media security restricts canvas export
    }
  }, [selectedDish.name, selectedDish.slug, webcamPreviewEnabled]);

  // Touch gestures (1-finger rotate + subtle depth pan, 2-finger pinch scale)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current.moved = false;
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchRef.current.lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      touchRef.current.isScaling = true;
    } else if (e.touches.length === 1) {
      touchRef.current.lastX = e.touches[0].clientX;
      touchRef.current.lastY = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!placed) return;
      if (e.touches.length === 2 && touchRef.current.isScaling) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (touchRef.current.lastTouchDist > 4) {
          const ratio = dist / touchRef.current.lastTouchDist;
          setModelScale((s) => Math.max(0.5, Math.min(2.5, s * ratio)));
        }
        touchRef.current.lastTouchDist = dist;
        touchRef.current.moved = true;
      } else if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - touchRef.current.lastX;
        const deltaY = e.touches[0].clientY - touchRef.current.lastY;
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          touchRef.current.moved = true;
        }
        setModelRotation((r) => r + deltaX * 0.006);
        setModelOffsetXZ(([ox, oz]) => [
          ox,
          Math.max(-0.65, Math.min(0.65, oz + deltaY * 0.002)),
        ]);
        touchRef.current.lastX = e.touches[0].clientX;
        touchRef.current.lastY = e.touches[0].clientY;
      }
    },
    [placed]
  );

  const handleTouchEnd = useCallback(() => {
    touchRef.current.isScaling = false;
  }, []);

  const handleSingleTouch = useCallback(() => {
    if (state === 'placing' && modelLoaded && !touchRef.current.moved) {
      handleTapToPlace();
    }
  }, [state, modelLoaded, handleTapToPlace]);

  if (state === 'permission_denied') {
    return <ARPermissionDenied onGoBack={handleExit} onContinue3D={handleContinue3D} />;
  }

  // Clean Cross-Platform AR Capability Screen for Desktop / Devices Without Rear Camera
  if (state === 'capability_gate') {
    const canTryWebcam = Boolean(
      capabilities?.hasCameraApi && capabilities?.hasVideoInputDevice
    );

    return (
      <div
        data-testid="ar-capability-screen"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0705] px-4 sm:px-6 select-none overflow-y-auto py-8"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 28%, rgba(240, 195, 107, 0.16) 0%, rgba(10, 7, 5, 0.96) 62%)',
          }}
        />

        <div className="relative z-10 w-full max-w-md p-6 sm:p-7 rounded-3xl bg-[rgba(18,14,11,0.88)] backdrop-blur-2xl border border-[#F0C36B]/45 shadow-[0_24px_60px_rgba(0,0,0,0.88)] flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#1C1612] to-[#2B1F16] border border-[#F0C36B]/60 shadow-[0_0_24px_rgba(240,195,107,0.25)] text-[#F0C36B]">
              <Smartphone className="w-8 h-8 text-[#F0C36B]" />
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#E0532B] border-2 border-[#0A0705] flex items-center justify-center text-white">
              <Camera className="w-3 h-3" />
            </div>
          </div>

          <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#F0C36B] mb-1.5">
            Spatial Capability Check
          </span>

          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#F8F2E8] mb-2 leading-tight">
            {capabilities?.platform.isDesktop
              ? `Inspect ${selectedDish.name} in 3D Studio`
              : 'Rear Environment Camera Unavailable'}
          </h2>

          <p className="text-xs sm:text-sm text-[#D4C7B6] max-w-sm mb-5 font-light leading-relaxed">
            True 1:1 table placement uses an Android (ARCore / WebXR) or iPhone/iPad rear camera.
            Continue immediately in our interactive 3D Studio Viewer, preview via webcam, or hand off to your phone.
          </p>

          {/* Primary 1-Click Actions */}
          <div className="w-full space-y-2.5 mb-5">
            <Link
              href={`/3d/${selectedDish.slug}`}
              data-testid="ar-fallback-3d-studio-link"
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide text-[#17100C] shadow-[0_8px_25px_rgba(240,195,107,0.4)] hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F0C36B 0%, #DDA33E 50%, #A8792A 100%)',
              }}
            >
              <Box className="w-4 h-4 text-[#17100C]" />
              <span>Open Interactive 3D Studio Viewer</span>
            </Link>

            {canTryWebcam && (
              <button
                type="button"
                data-testid="ar-optional-webcam-preview-btn"
                onClick={handleStartWebcamPreview}
                className="w-full py-3 px-4 rounded-xl bg-[#F0C36B]/12 hover:bg-[#F0C36B]/20 text-[#F6D386] font-semibold text-xs border border-[#F0C36B]/35 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Optional Webcam Table Preview</span>
              </button>
            )}
          </div>

          {/* Mobile Handoff Link Box */}
          <div className="w-full p-3.5 rounded-2xl bg-black/45 border border-white/10 mb-4 flex flex-col items-center gap-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#F0C36B]">
              <QrCode className="w-3.5 h-3.5" />
              <span>Switch to Mobile AR (Android / iOS)</span>
            </div>
            <button
              type="button"
              onClick={handleCopyMobileLink}
              className="w-full py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-[#F0C36B]/15 border border-[#F0C36B]/35 text-xs font-mono text-[#FAF5EC] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#36D6A0]" />
                  <span className="text-[#36D6A0] font-semibold">AR Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#F0C36B]" />
                  <span>Copy AR Link for Phone</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleExit}
            className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#FAF5EC] font-medium text-xs border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#A99A88]" />
            <span>Return to Menu</span>
          </button>
        </div>
      </div>
    );
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
            type="button"
            onClick={handleContinue3D}
            className="w-full py-3.5 rounded-full bg-primary text-black font-semibold text-sm active:scale-95 transition-transform"
          >
            View in 3D Mode Instead
          </button>
          <button
            type="button"
            onClick={handleExit}
            className="flex justify-center items-center w-full py-3.5 rounded-full bg-white/10 text-text-primary font-medium text-sm border border-white/5 active:scale-95 transition-transform"
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  const sceneViewerIntentUrl = capabilities?.sceneViewer.ready
    ? capabilities.sceneViewer.intentUrl
    : null;
  const quickLookUsdzUrl = capabilities?.quickLook.quickLookReady
    ? capabilities.quickLook.usdzUrl
    : null;
  const hasPositionDrift =
    Math.abs(modelOffsetXZ[0]) > 0.05 || Math.abs(modelOffsetXZ[1]) > 0.05;

  return (
    <div
      className="fixed inset-0 bg-obsidian z-50 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Live hardware-composited Camera Feed (suspends automatically on background tab) */}
      <CameraFeed
        onReady={handleCameraReady}
        onError={handleCameraError}
        onVideoElement={handleVideoElement}
        preferEnvironmentCamera={!webcamPreviewEnabled}
        allowCameraFallback={true}
      />

      {/* Brief white shutter flash on AR photo capture */}
      {captureFlash && (
        <div className="pointer-events-none absolute inset-0 z-40 bg-white/50 animate-out fade-out duration-200" />
      )}

      {/* Loading overlay */}
      {(state === 'loading' || (state === 'placing' && !modelLoaded)) && (
        <ARLoadingState
          dishName={selectedDish.name}
          dishImage={selectedDish.image}
          progress={modelProgress}
        />
      )}

      {/* AR 3D scene overlay (frameloop="demand" at 0 WebGL FPS once settled!) */}
      {(state === 'placing' || state === 'placed') && (
        <div className="absolute inset-0 z-10" id="ar-canvas" onClick={handleSingleTouch}>
          <ARScene
            config={selectedConfig}
            category={selectedDish.category}
            placed={placed}
            modelScale={modelScale}
            modelRotation={modelRotation}
            modelOffsetXZ={modelOffsetXZ}
            recenterTrigger={recenterTrigger}
            lightEstimate={lightEstimate}
            hotspots={hotspots}
            showHotspots={showHotspots && placed}
            onProgress={setModelProgress}
            onModelLoaded={handleModelLoaded}
            onHotspotsProjected={setProjectedHotspots}
            onRegisterSnapshotProvider={registerSnapshotProvider}
          />
        </div>
      )}

      {/* Top Surface Stability & Real-World Ambient Light Pill */}
      {(state === 'placing' || state === 'placed') && modelLoaded && (
        <div className="pointer-events-none absolute top-16 left-0 right-0 z-25 flex flex-col items-center gap-2 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian/65 backdrop-blur-md border border-white/10 text-[10px] text-text-primary/80 shadow-md">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                motionStability.level === 'stable'
                  ? 'bg-emerald-400'
                  : motionStability.level === 'moving'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400 animate-ping'
              }`}
            />
            <span>{motionStability.guidanceText}</span>
            <span className="text-white/25">•</span>
            <SunMedium className="w-3 h-3 text-[#F0C36B]" />
            <span className="capitalize text-[#F0C36B]/90">
              {lightEstimate.lightingLabel.replace('-', ' ')}
            </span>
          </div>

          {/* 1-Tap Re-center Recovery Pill when excessive motion or table drift occurs */}
          {placed && (motionStability.recommendRecenter || hasPositionDrift) && (
            <button
              type="button"
              data-testid="ar-recenter-recovery-pill"
              onClick={handleRecenterOnTable}
              className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F0C36B] text-[#120E0B] font-semibold text-[11px] shadow-lg active:scale-95 transition-transform"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Re-center on Table</span>
            </button>
          )}
        </div>
      )}

      {/* 2D Hotspot labels overlay */}
      {placed && showHotspots && projectedHotspots.length > 0 && (
        <ARHotspotLayer hotspots={projectedHotspots} isVisible={showHotspots} />
      )}

      {/* Placement hint + Native SLAM AR upgrade pill (Android ARCore / iOS Quick Look) */}
      {state === 'placing' && modelLoaded && (
        <div className="absolute bottom-36 left-0 right-0 z-20 flex flex-col items-center gap-2.5 px-4 text-center pointer-events-none">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-obsidian/70 backdrop-blur-md border border-primary/25 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-text-primary/90 font-medium">
              Tap anywhere on table to place dish
            </span>
          </div>

          {sceneViewerIntentUrl && (
            <a
              href={sceneViewerIntentUrl}
              className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181310]/85 backdrop-blur-md border border-[#E2A84B]/45 text-[#F6D386] text-[11px] font-medium shadow-md active:scale-95 transition-transform"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Native ARCore Plane Tracking</span>
            </a>
          )}

          {quickLookUsdzUrl && (
            <a
              rel="ar"
              href={quickLookUsdzUrl}
              className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181310]/85 backdrop-blur-md border border-[#E2A84B]/45 text-[#F6D386] text-[11px] font-medium shadow-md active:scale-95 transition-transform"
            >
              <img
                src={selectedDish.image || '/images/dishes/placeholder.jpg'}
                alt=""
                className="w-px h-px opacity-0 absolute pointer-events-none"
              />
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Apple AR Quick Look</span>
            </a>
          )}
        </div>
      )}

      {/* Tracking lost */}
      {state === 'tracking_lost' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-obsidian/40">
          <div className="px-6 py-4 rounded-2xl bg-obsidian/80 backdrop-blur-lg border border-border-subtle text-center space-y-3">
            <div>
              <p className="text-sm text-text-primary font-medium mb-1">Tracking Lost</p>
              <p className="text-[10px] text-text-primary/50">
                Move your phone slowly to recover table alignment
              </p>
            </div>
            <button
              type="button"
              onClick={handleRecenterOnTable}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F0C36B] text-black text-xs font-semibold"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Re-center on Table</span>
            </button>
          </div>
        </div>
      )}

      {/* Instructions overlay (auto-dismiss) */}
      {state === 'placing' && modelLoaded && <ARInstructionsOverlay />}

      {/* AR Header */}
      {(state === 'placing' || state === 'placed') && <ARHeader onExit={handleExit} />}

      {/* Compact In-AR Dish Selector Strip (zero camera restart on dish switch!) */}
      {isDishSelectorOpen && (state === 'placing' || state === 'placed') && (
        <div
          data-testid="ar-dish-selector-drawer"
          className="absolute bottom-24 left-3 right-16 z-30 p-2.5 rounded-2xl bg-[rgba(14,10,8,0.92)] backdrop-blur-xl border border-[#F0C36B]/35 shadow-2xl"
        >
          <div className="flex items-center justify-between px-1.5 pb-2 mb-1.5 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#F0C36B]">
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Switch Dish on Table</span>
            </div>
            <button
              type="button"
              onClick={() => setIsDishSelectorOpen(false)}
              className="p-1 rounded-full text-white/60 hover:text-white"
              aria-label="Close dish switcher"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {selectableDishes.map((item) => {
              const active = item.slug === selectedDish.slug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => handleSwitchDishInAR(item)}
                  className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border shrink-0 text-left transition-all ${
                    active
                      ? 'bg-[#F0C36B]/20 border-[#F0C36B] text-[#FAF5EC]'
                      : 'bg-black/40 border-white/10 text-white/80 hover:border-[#F0C36B]/40'
                  }`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover shrink-0 bg-black/60"
                    loading="lazy"
                  />
                  <div className="max-w-[115px]">
                    <p className="text-[11px] font-semibold truncate">{item.name}</p>
                    <p className="text-[10px] text-[#F0C36B] font-mono">₹{item.price}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* AR Controls */}
      {(state === 'placed' || state === 'placing') && modelLoaded && (
        <ARControls
          isVisible={true}
          onReset={handleReset}
          onReplace={placed ? handleReplace : undefined}
          onRecenter={placed ? handleRecenterOnTable : undefined}
          onToggleDishSelector={() => setIsDishSelectorOpen((o) => !o)}
          isDishSelectorOpen={isDishSelectorOpen}
          isPlaced={placed}
          showHotspots={showHotspots}
          onToggleHotspots={() => setShowHotspots((h) => !h)}
          onCapture={handleCapture}
          onShare={() => setShowShareSheet(true)}
          onView3D={handleContinue3D}
          sceneViewerIntentUrl={sceneViewerIntentUrl}
          quickLookUsdzUrl={quickLookUsdzUrl}
          dishPosterUrl={selectedDish.image}
        />
      )}

      {/* Dish info bar */}
      {(state === 'placing' || state === 'placed') && (
        <ARDishInfo
          dish={selectedDish}
          isFavorite={effectiveIsFavorite}
          onToggleFavorite={handleEffectiveToggleFavorite}
          onAddToCart={handleEffectiveAddToCart}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Share sheet */}
      <ARShareSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        dishName={selectedDish.name}
        dishId={selectedDish.slug}
      />
    </div>
  );
}
