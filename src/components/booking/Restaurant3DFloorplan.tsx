'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useThree, ThreeEvent, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { RGBELoader } from 'three-stdlib';
import {
  Lock,
  Unlock,
  Sparkles,
  Compass,
  RotateCcw,
  Users,
  Check,
  Eye,
  Layers,
  UtensilsCrossed,
  Wine,
  Crown,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Tag,
  Crosshair,
  Box,
  X,
} from 'lucide-react';
import {
  RESTAURANT_3D_TABLES,
  resolveTableFromMeshName,
  type Floor3DTable,
} from '@/lib/constants/restaurant3DMapping';
import { TableColliders } from './TableColliders';
import { OptimizedInteriorModel } from './OptimizedInteriorModel';
import { useQualityTier, type QualityTier } from '@/hooks/useQualityTier';
import { WebGLContextGuard } from '@/components/3d/WebGLContextGuard';
import {
  DemandFrameloopController,
  DemandFrameloopBadge,
  type CameraTarget,
  type FrameloopTelemetry,
} from '@/components/3d/DemandFrameloopController';

import { INTERIOR_MODEL_URL } from '@/lib/three/interiorOptimization';

// Preload the optimized interior model using local Draco decoder
useGLTF.preload(INTERIOR_MODEL_URL, '/draco/');

interface Restaurant3DFloorplanProps {
  selectedTableNumber: number | null;
  onSelectTable: (table: Floor3DTable) => void;
  guests: number;
  availableTableNumbers?: number[];
  selectedZone?: string;
  onSelectZone?: (zone: string) => void;
  onSwitchTo2D?: () => void;
  qualityTierOverride?: QualityTier | null;
  isFullscreen?: boolean;
  onToggleFullscreen?: (fullscreen: boolean) => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onSwitchTo2D?: () => void;
  selectedTableNumber?: number | null;
  guests?: number;
  selectedZone?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
}

export class ThreeDErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, isRetrying: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ThreeDErrorBoundary] 3D Canvas Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ isRetrying: true }, () => {
      setTimeout(() => {
        this.setState({ hasError: false, error: null, isRetrying: false });
      }, 150);
    });
  };

  render() {
    if (this.state.hasError) {
      const { selectedTableNumber, guests, selectedZone, onSwitchTo2D } = this.props;

      return (
        <div className="w-full h-[520px] md:h-[600px] flex flex-col items-center justify-center p-8 text-center bg-[#0C0908] border border-[#F0C36B]/30 rounded-2xl shadow-2xl backdrop-blur-xl">
          <div className="w-14 h-14 rounded-full bg-[#F0C36B]/10 border border-[#F0C36B]/30 flex items-center justify-center mb-3">
            <UtensilsCrossed className="w-7 h-7 text-[#F0C36B]" />
          </div>
          <h4 className="text-lg font-serif font-medium text-[#F8F2E8] mb-1.5">
            3D Architectural Viewport Offline
          </h4>

          {/* Clean Reservation State Preservation Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 my-2.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Booking Progress Preserved: {selectedTableNumber ? `Table #${String(selectedTableNumber).padStart(2, '0')}` : 'Party Configured'}
              {guests ? ` · ${guests} Guests` : ''}
              {selectedZone ? ` · ${selectedZone}` : ''}
            </span>
          </div>

          <p className="text-xs text-[#C8B89E] max-w-md mb-6 leading-relaxed">
            Hardware acceleration or WebGL encountered an issue. Your table selection, party size, time slot, and cart are safely held in memory. You can switch to the 2D Blueprint immediately with zero lost progress, or retry the 3D viewport.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {onSwitchTo2D && (
              <button
                type="button"
                onClick={onSwitchTo2D}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F0C36B] text-black font-semibold text-xs tracking-wider uppercase shadow-lg shadow-[#D4AF37]/20 hover:scale-105 active:scale-95 transition-all"
              >
                Continue Booking via 2D Floorplan
              </button>
            )}
            <button
              type="button"
              onClick={this.handleRetry}
              disabled={this.state.isRetrying}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-[#F8F2E8] hover:border-[#F0C36B]/50 hover:text-[#F0C36B] font-mono text-xs transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
              <span>{this.state.isRetrying ? 'Re-initializing...' : 'Retry 3D View'}</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Master Architectural PBR Tuning
 * Matches Blender LookDev visual ground truth. Extracted for seamless re-invocation
 * on initial load and after WebGL context recovery.
 */
export function applyArchitecturalPBR(
  scene: THREE.Object3D,
  simplifyTransmission: boolean = false,
  shadowsEnabled: boolean = true
) {
  scene.traverse((child: any) => {
    if (child.isMesh && child.material) {
      const mat = child.material;
      child.castShadow = shadowsEnabled;
      child.receiveShadow = shadowsEnabled;

      const name = (mat.name || '').toLowerCase();
      const objName = (child.name || '').toLowerCase();

      // 1. Crystal Clear Glassware & Chandelier Crystals (Eliminates solid black transmission collapse)
      if (
        name.includes('glass') ||
        name.includes('crystalline') ||
        name.includes('crystal') ||
        objName.includes('glass') ||
        objName.includes('crystal') ||
        objName.includes('chalice')
      ) {
        child.castShadow = false;
        child.receiveShadow = false;
        mat.color = new THREE.Color('#FFFFFF');
        mat.emissive = new THREE.Color('#FFAA33'); // Warm 2700K golden crystal illumination prevents dark chandelier silhouettes
        mat.emissiveIntensity = 0.75;
        mat.transparent = true;
        mat.opacity = simplifyTransmission ? 0.45 : 0.35;
        mat.roughness = simplifyTransmission ? 0.1 : 0.05;
        mat.metalness = 0.05;
        mat.transmission = 0; // CRITICAL: transmission > 0 in merged / multipass WebGL renders as opaque black! 0 ensures crystal-clear transparency
        mat.ior = 1.5;
        mat.depthWrite = false;
        mat.needsUpdate = true;
      }

      // 1b. Crystalline Water Surface (Fountain tiers & Rotunda Pool - serene crystal aquatic reflection)
      if (name.includes('water') || objName.includes('water')) {
        child.castShadow = false;
        child.receiveShadow = false;
        mat.color = new THREE.Color('#38D9C0'); // Luminous Mediterranean turquoise water
        mat.emissive = new THREE.Color('#149480'); // Radiant emerald aquatic glow
        mat.emissiveIntensity = 0.95;
        mat.transparent = true;
        mat.opacity = 0.88;
        mat.roughness = 0.02;
        mat.metalness = 0.15;
        mat.transmission = 0;
        mat.depthWrite = false;
        mat.side = THREE.DoubleSide;
        mat.needsUpdate = true;
      }

      // 2. Ruby Red Wine & Spirits (Deep glowing jewel red - vibrant jewel Cabernet)
      if (name.includes('wine') || name.includes('ruby') || name.includes('liquid') || objName.includes('liquid')) {
        child.castShadow = false;
        child.receiveShadow = false;
        mat.color = new THREE.Color('#780616');
        mat.emissive = new THREE.Color('#6E0814');
        mat.emissiveIntensity = 0.65;
        mat.transparent = true;
        mat.opacity = simplifyTransmission ? 0.85 : 0.88;
        mat.roughness = 0.08;
        mat.transmission = 0; // CRITICAL: prevents solid black transmission collapse
        mat.depthWrite = true;
        mat.needsUpdate = true;
      }

      // 3. Polished Champagne Brass & Gold (Chandelier, Rotunda Fountain, Cutlery)
      if (
        !name.includes('rug') &&
        !name.includes('water') &&
        !name.includes('crystalline') &&
        !objName.includes('water') &&
        (name.includes('brass') ||
          name.includes('gold') ||
          name.includes('bronze') ||
          objName.includes('chandelier') ||
          objName.includes('fountain') ||
          objName.includes('halo_ring') ||
          objName.includes('pedestal'))
      ) {
        mat.color = new THREE.Color('#E8BF65');
        mat.metalness = 0.88;
        mat.roughness = 0.22;
        mat.needsUpdate = true;
      }

      // 4. Italian Cognac Leather Dining Chairs (Warm Caramel Saddle Brown)
      if (name.includes('leather') || objName.includes('ch_')) {
        mat.color = new THREE.Color('#8C4A26');
        mat.roughness = 0.38;
        mat.metalness = 0.05;
        mat.needsUpdate = true;
      }

      // 5. Imperial Brown Hardwood Floor (Warm Golden Oak Floorplan)
      if (name.includes('imperial_brown') || name.includes('wood_tiles') || objName.includes('floor')) {
        // When texture map is present, avoid dark color crush; preserve warm vibrant wood tones
        mat.color = mat.map ? new THREE.Color('#FFE8D0') : new THREE.Color('#7A4321');
        mat.roughness = 0.24;
        mat.metalness = 0.04;
        mat.needsUpdate = true;
      }

      // 5b. Exterior Timber Deck & Architectural Plinths
      if (name.includes('timber_deck') || objName.includes('exterior_ground') || (objName.includes('plinth') && !name.includes('brass') && !name.includes('calacatta') && !name.includes('onyx') && !name.includes('pool'))) {
        mat.color = new THREE.Color('#6E3816');
        mat.roughness = 0.32;
        mat.needsUpdate = true;
      }

      // 5c. Plush Decorative Rugs (Warm Bronze-Taupe, Emerald & Midnight Silk instead of cold slate)
      if (name.includes('rug') || name.includes('carpet')) {
        if (name.includes('emerald')) {
          mat.color = new THREE.Color('#1B4D3E');
        } else if (name.includes('midnight')) {
          mat.color = new THREE.Color('#162238');
        } else {
          mat.color = new THREE.Color('#3D332A');
        }
        mat.roughness = 0.75;
        mat.metalness = 0.0;
        mat.needsUpdate = true;
      }

      // 6. Smoked Walnut Partitions & Timber Slats
      if (name.includes('walnut') || name.includes('timber') || name.includes('slats')) {
        mat.color = new THREE.Color('#25160E');
        mat.roughness = 0.32;
        mat.needsUpdate = true;
      }

      // 7. Calacatta Gold Marble Tables & Plates
      if (name.includes('calacatta') || name.includes('marble') || objName.includes('plate') || objName.includes('top')) {
        mat.color = new THREE.Color('#F7F5F0');
        mat.roughness = 0.15;
        mat.needsUpdate = true;
      }

      // 7b. Luxury Placemats (Warm Espresso/Bronze Leather instead of pitch-black abyss)
      if (name.includes('placemat') || objName.includes('_pm')) {
        mat.color = new THREE.Color('#382C24');
        mat.roughness = 0.55;
        mat.metalness = 0.05;
        mat.needsUpdate = true;
      }

      // 7c. Rotunda Basin, Pool Floor & Nero Marquina (Polished radiant emerald/aqua marble pool floor instead of pitch-black abyss)
      if (
        name.includes('nero') ||
        name.includes('marquina') ||
        objName.includes('basin') ||
        objName.includes('pool_floor') ||
        objName.includes('rotunda_pool') ||
        objName.includes('rotunda_basin')
      ) {
        mat.color = new THREE.Color('#2A7D70');
        mat.emissive = new THREE.Color('#165248');
        mat.emissiveIntensity = 0.85;
        mat.roughness = 0.12;
        mat.metalness = 0.15;
        child.receiveShadow = false; // Prevents deep cavity shadow from rendering pitch black
        child.castShadow = false;
        mat.needsUpdate = true;
      }

      // 8. Warm Ambient Lamps, Cove LED & Honey Onyx
      if (name.includes('warm_2700k') || name.includes('cove_led') || name.includes('onyx') || name.includes('lampshade')) {
        mat.emissive = new THREE.Color('#FF9E2C');
        mat.emissiveIntensity = 2.5;
        mat.needsUpdate = true;
      }
    }
  });
}

// Subcomponent: 3D Scene Model (Optimized Batched Draw Calls, Frozen Matrices, Zero Raycasting Overhead)
function RestaurantModel({
  simplifyTransmission = false,
  shadowsEnabled = true,
}: {
  simplifyTransmission?: boolean;
  shadowsEnabled?: boolean;
  selectedTableNumber?: number | null;
  hoveredTable?: Floor3DTable | null;
  setHoveredTable?: (table: Floor3DTable | null) => void;
  onSelectTable?: (table: Floor3DTable) => void;
  availableTableNumbers?: number[];
  guests?: number;
}) {
  return (
    <>
      <OptimizedInteriorModel
        simplifyTransmission={simplifyTransmission}
        shadowsEnabled={shadowsEnabled}
        enableProxies={false}
        batchMode="merge"
      />
      {/* R3F Cache Preservation Guard */}
      {false && <primitive object={null as any} dispose={null} />}
    </>
  );
}

// Backward-compatible alias: TableFloatingMarkers is now powered by TableColliders
const TableFloatingMarkers = TableColliders;

// Fallback Loading Screen
// Subcomponent: Sync Canvas DOM touch-action with mobile scroll/orbit state
function MobileTouchSync({ touchOrbitActive }: { touchOrbitActive: boolean }) {
  const { gl } = useThree();
  useEffect(() => {
    if (gl?.domElement) {
      gl.domElement.style.touchAction = touchOrbitActive ? 'none' : 'pan-y';
    }
  }, [gl, touchOrbitActive]);
  return null;
}

// Subcomponent: Controlled settle frame when canvas enters 450px margin
function ViewportVisibilitySync({ isVisible }: { isVisible: boolean }) {
  const { invalidate } = useThree();
  const prevVisible = useRef(isVisible);
  useEffect(() => {
    if (isVisible && !prevVisible.current) {
      invalidate();
    }
    prevVisible.current = isVisible;
  }, [isVisible, invalidate]);
  return null;
}

function CanvasLoadingScreen() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-6 bg-[#0E0D0C]/95 border border-[#F0C36B]/30 rounded-2xl backdrop-blur-xl shadow-2xl text-center min-w-[260px]">
        <div className="w-10 h-10 border-2 border-[#F0C36B] border-t-transparent rounded-full animate-spin mb-3 shadow-[0_0_15px_rgba(240,195,107,0.3)]" />
        <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#F0C36B]">
          Loading 3D Architecture
        </span>
        <span className="text-[11px] text-[#A69F94] mt-1 font-serif">
          The Golden Oak · Handcrafted Interior
        </span>
      </div>
    </Html>
  );
}

export type FloorplanCameraPreset =
  | 'eyelevel'
  | 'perspective'
  | 'overview'
  | 'topdown'
  | 'rotunda'
  | 'bar'
  | 'vip';

export const CAMERA_PRESETS: Record<FloorplanCameraPreset, CameraTarget> = {
  eyelevel: {
    target: [0.0, 1.15, 0.0],
    position: [1.8, 1.25, 6.2],
    fov: 46,
    dampingLambda: 6.0,
  },
  perspective: {
    target: [0.0, 1.0, 0.0],
    position: [28.0, 24.0, 30.0],
    fov: 42,
    dampingLambda: 5.0,
  },
  overview: {
    target: [0.0, 1.0, 0.0],
    position: [28.0, 24.0, 30.0],
    fov: 42,
    dampingLambda: 5.0,
  },
  topdown: {
    target: [0.0, 0.0, 0.0],
    position: [0.0, 36.0, 1.85],
    fov: 40,
    dampingLambda: 5.5,
  },
  rotunda: {
    target: [0.0, 1.2, -0.6],
    position: [0.0, 3.5, 8.2],
    fov: 46,
    dampingLambda: 5.5,
  },
  bar: {
    target: [-11.0, 1.2, 0.0],
    position: [-5.0, 3.6, 6.2],
    fov: 48,
    dampingLambda: 5.5,
  },
  vip: {
    target: [0.0, 1.5, 13.5],
    position: [0.0, 5.8, 22.0],
    fov: 44,
    dampingLambda: 5.0,
  },
};

export function Restaurant3DFloorplan({
  selectedTableNumber,
  onSelectTable,
  guests,
  availableTableNumbers,
  selectedZone,
  onSelectZone,
  onSwitchTo2D,
  qualityTierOverride,
  isFullscreen,
  onToggleFullscreen,
}: Restaurant3DFloorplanProps) {
  const quality = useQualityTier({ overrideTier: qualityTierOverride });
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const isFullscreenMode = isFullscreen !== undefined ? isFullscreen : internalFullscreen;

  const handleToggleFullscreen = useCallback(
    (val: boolean) => {
      if (onToggleFullscreen) onToggleFullscreen(val);
      else setInternalFullscreen(val);

      if (typeof document !== 'undefined') {
        if (val) {
          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        } else {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        }
      }
    },
    [onToggleFullscreen]
  );

  // Sync state if user exits via browser native Escape / F11
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreenMode) {
        if (onToggleFullscreen) onToggleFullscreen(false);
        else setInternalFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreenMode, onToggleFullscreen]);
  const [showAllTableNumbers, setShowAllTableNumbers] = useState(true);

  const [hoveredTable, setHoveredTable] = useState<Floor3DTable | null>(null);
  const [viewMode, setViewMode] = useState<FloorplanCameraPreset>('eyelevel');
  const [targetCamera, setTargetCamera] = useState<CameraTarget | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [contextRestoring, setContextRestoring] = useState(false);
  const [telemetry, setTelemetry] = useState<FrameloopTelemetry>({
    fps: 0,
    isIdle: true,
    isTransitioning: false,
    isInteracting: false,
    estimatedWattage: 0.1,
    totalFramesRendered: 0,
  });
  const controlsRef = useRef<any>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isViewportVisible, setIsViewportVisible] = useState(true);
  const [isDesktopActive, setIsDesktopActive] = useState(false);
  const [touchOrbitActive, setTouchOrbitActive] = useState(false);
  const [showTouchHint, setShowTouchHint] = useState(false);
  const touchHintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Visibility-aware IntersectionObserver: Pauses 3D frameloop when scrolled out of view
  useEffect(() => {
    if (!canvasContainerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsViewportVisible(entry.isIntersecting);
      },
      { threshold: 0.05, rootMargin: '450px 0px 450px 0px' }
    );
    observer.observe(canvasContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Accessible click-to-focus: Esc and outside-click release 3D wheel capture on desktop / exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreenMode) {
          handleToggleFullscreen(false);
        } else {
          setIsDesktopActive(false);
        }
      }
    };
    const handlePointerDownOutside = (e: PointerEvent) => {
      if (canvasContainerRef.current && !canvasContainerRef.current.contains(e.target as Node)) {
        setIsDesktopActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDownOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDownOutside);
    };
  }, [isFullscreenMode, handleToggleFullscreen]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchOrbitActive && e.touches.length === 1) {
      setShowTouchHint(true);
      if (touchHintTimeoutRef.current) {
        clearTimeout(touchHintTimeoutRef.current);
      }
      touchHintTimeoutRef.current = setTimeout(() => {
        setShowTouchHint(false);
      }, 2500);
    }
  }, [touchOrbitActive]);

  useEffect(() => {
    return () => {
      if (touchHintTimeoutRef.current) {
        clearTimeout(touchHintTimeoutRef.current);
      }
      try {
        useLoader.clear(RGBELoader, '/textures/forest_env.hdr');
      } catch {
        // Safe no-op
      }
    };
  }, []);

  // Selected table metadata
  const selectedTableObj = useMemo(() => {
    return selectedTableNumber
      ? RESTAURANT_3D_TABLES.find((t) => t.tableNumber === selectedTableNumber) || null
      : null;
  }, [selectedTableNumber]);

  // Smooth Camera Transition Handler: glides with MathUtils.damp on demand, then sleeps at 0 FPS
  const handleSwitchPreset = useCallback((preset: FloorplanCameraPreset) => {
    const normalizedPreset = preset === 'overview' ? 'perspective' : preset;
    setViewMode(normalizedPreset);
    const target = CAMERA_PRESETS[preset] || CAMERA_PRESETS[normalizedPreset];
    if (target) {
      if (quality.prefersReducedMotion) {
        setTargetCamera({
          ...target,
          dampingLambda: 999,
        });
      } else {
        setTargetCamera({
          ...target,
        });
      }
    }
  }, [quality.prefersReducedMotion]);

  const handleTargetReached = useCallback(() => {
    setTargetCamera(null);
  }, []);

  // Table Tracking & Selection Pipeline: auto-frames camera smoothly on chosen table
  const focusOnTable = useCallback(
    (table: Floor3DTable) => {
      const x = table.position3D[0];
      const z = -table.position3D[2];
      const target: CameraTarget = {
        target: [x, 0.8, z],
        position: [x + 2.8, 3.8, z + 3.4],
        fov: 46,
        dampingLambda: quality.prefersReducedMotion ? 999 : 6.0,
      };
      setTargetCamera(target);
    },
    [quality.prefersReducedMotion]
  );

  const handleSelectTable = useCallback(
    (table: Floor3DTable) => {
      onSelectTable(table);
      if (onSelectZone) {
        onSelectZone(table.zone);
      }
      focusOnTable(table);
    },
    [onSelectTable, onSelectZone, focusOnTable]
  );

  const content = (
    <div
      className={
        isFullscreenMode
          ? 'w-screen h-screen fixed inset-0 z-[99999] bg-[#0E0A08] h-[100dvh] flex flex-col p-3 sm:p-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] overflow-hidden animate-in fade-in duration-300 select-none'
          : 'w-full flex flex-col gap-3 select-none'
      }
    >
      {/* 3D Header & Legend Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.08]">
        {isFullscreenMode ? (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleToggleFullscreen(false)}
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#F0C36B] to-[#D4A346] text-[#120E0B] font-serif font-bold text-xs sm:text-sm shadow-[0_0_24px_rgba(240,195,107,0.6)] hover:brightness-110 active:scale-95 transition-all cursor-pointer ring-2 ring-[#F0C36B]/40 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                title="Back to Table Selection"
                aria-label="Back to Table Selection"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Back to Table</span>
              </button>

              <span className="text-[10px] bg-[#F0C36B]/15 text-[#F0C36B] px-2 py-0.5 rounded-full font-mono border border-[#F0C36B]/30 hidden xs:inline">
                28 Dining Tables
              </span>

              {selectedTableObj && (
                <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#F0C36B] bg-black/60 px-3 py-1 rounded-full border border-[#F0C36B]/30">
                  <span className="w-2 h-2 rounded-full bg-[#36D6A0] animate-pulse" />
                  Table #{String(selectedTableObj.tableNumber).padStart(2, '0')} · {selectedTableObj.name}
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  const nextTier =
                    quality.tierOverride === null
                      ? 'high'
                      : quality.tierOverride === 'high'
                        ? 'medium'
                        : quality.tierOverride === 'medium'
                          ? 'low'
                          : 'auto';
                  quality.setTierOverride(nextTier);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border border-white/10 bg-white/[0.04] text-[#C8B89E] hover:text-[#F0C36B] hover:border-[#F0C36B]/30 transition-all cursor-pointer"
                title={`Active Tier: ${quality.qualityTier.toUpperCase()} · DPR: ${Array.isArray(quality.dpr) ? quality.dpr.join('-') : quality.dpr}x · Shadows: ${quality.shadowsEnabled ? 'On' : 'Off'} · Transmission: ${quality.transmissionEnabled ? 'PBR Refraction' : 'Alpha Fast-Path'} · Click to cycle quality tier`}
              >
                <Sparkles className="w-2.5 h-2.5 text-[#F0C36B]" />
                <span className="uppercase">{quality.qualityTier} Quality</span>
                {quality.tierOverride && <span className="text-[9px] text-[#F0C36B] font-semibold">(Manual)</span>}
              </button>
            </div>

            {/* View Switcher, Numbers Toggle, Actions & Fullscreen Exit */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Numbers Toggle */}
              <button
                type="button"
                onClick={() => setShowAllTableNumbers(!showAllTableNumbers)}
                aria-pressed={showAllTableNumbers}
                className={`inline-flex items-center justify-center gap-1.5 min-h-[48px] min-w-[48px] px-3.5 py-2.5 sm:min-h-[38px] sm:min-w-0 sm:px-3 sm:py-1.5 rounded-xl text-xs font-mono font-medium focus-visible:ring-2 focus-visible:ring-[#F0C36B] focus-visible:outline-none transition-all touch-manipulation cursor-pointer ${
                  showAllTableNumbers
                    ? 'bg-[#F0C36B] text-black font-semibold shadow-[0_0_12px_rgba(240,195,107,0.4)]'
                    : 'text-[#F8F2E8]/80 bg-white/[0.04] border border-white/10 hover:border-[#F0C36B]/40 hover:text-[#F0C36B]'
                }`}
                title="Toggle All Table Numbers in 3D Viewport"
                aria-label="Toggle All Table Numbers in 3D Viewport"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{showAllTableNumbers ? 'Numbers ON' : 'Numbers'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchPreset('eyelevel')}
                aria-pressed={viewMode === 'eyelevel'}
                className={`inline-flex items-center justify-center gap-1.5 min-h-[48px] min-w-[48px] px-3.5 py-2.5 sm:min-h-[38px] sm:min-w-0 sm:px-3 sm:py-1.5 rounded-xl text-xs font-mono font-medium focus-visible:ring-2 focus-visible:ring-[#F0C36B] focus-visible:outline-none transition-all touch-manipulation cursor-pointer ${
                  viewMode === 'eyelevel'
                    ? 'bg-[#F0C36B] text-black font-semibold shadow-[0_0_12px_rgba(240,195,107,0.4)]'
                    : 'text-[#F8F2E8]/80 bg-white/[0.04] border border-white/10 hover:border-[#F0C36B]/40 hover:text-[#F0C36B]'
                }`}
                title="Dine-in Eye-Level View (Cutlery, Glassware & Table Perspective)"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Dining</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchPreset('perspective')}
                aria-pressed={viewMode === 'perspective'}
                className={`inline-flex items-center justify-center gap-1.5 min-h-[48px] min-w-[48px] px-3.5 py-2.5 sm:min-h-[38px] sm:min-w-0 sm:px-3 sm:py-1.5 rounded-xl text-xs font-mono font-medium focus-visible:ring-2 focus-visible:ring-[#F0C36B] focus-visible:outline-none transition-all touch-manipulation cursor-pointer ${
                  viewMode === 'perspective'
                    ? 'bg-[#F0C36B] text-black font-semibold shadow-[0_0_12px_rgba(240,195,107,0.4)]'
                    : 'text-[#F8F2E8]/80 bg-white/[0.04] border border-white/10 hover:border-[#F0C36B]/40 hover:text-[#F0C36B]'
                }`}
                title="Isometric Overview"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchPreset('rotunda')}
                aria-pressed={viewMode === 'rotunda'}
                className={`inline-flex items-center justify-center gap-1.5 min-h-[48px] min-w-[48px] px-3.5 py-2.5 sm:min-h-[38px] sm:min-w-0 sm:px-3 sm:py-1.5 rounded-xl text-xs font-mono font-medium focus-visible:ring-2 focus-visible:ring-[#F0C36B] focus-visible:outline-none transition-all touch-manipulation cursor-pointer ${
                  viewMode === 'rotunda'
                    ? 'bg-[#F0C36B] text-black font-semibold shadow-[0_0_12px_rgba(240,195,107,0.4)]'
                    : 'text-[#F8F2E8]/80 bg-white/[0.04] border border-white/10 hover:border-[#F0C36B]/40 hover:text-[#F0C36B]'
                }`}
                title="Grand Rotunda & Chandelier Centerpiece"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Rotunda</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchPreset('bar')}
                aria-pressed={viewMode === 'bar'}
                className={`inline-flex items-center justify-center gap-1.5 min-h-[48px] min-w-[48px] px-3.5 py-2.5 sm:min-h-[38px] sm:min-w-0 sm:px-3 sm:py-1.5 rounded-xl text-xs font-mono font-medium focus-visible:ring-2 focus-visible:ring-[#F0C36B] focus-visible:outline-none transition-all touch-manipulation cursor-pointer ${
                  viewMode === 'bar'
                    ? 'bg-[#F0C36B] text-black font-semibold shadow-[0_0_12px_rgba(240,195,107,0.4)]'
                    : 'text-[#F8F2E8]/80 bg-white/[0.04] border border-white/10 hover:border-[#F0C36B]/40 hover:text-[#F0C36B]'
                }`}
                title="Cocktail Bar & Promenade Lounge"
              >
                <Wine className="w-3.5 h-3.5" />
                <span>Bar</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchPreset('vip')}
                aria-pressed={viewMode === 'vip'}
                className={`inline-flex items-center justify-center gap-1.5 min-h-[48px] min-w-[48px] px-3.5 py-2.5 sm:min-h-[38px] sm:min-w-0 sm:px-3 sm:py-1.5 rounded-xl text-xs font-mono font-medium focus-visible:ring-2 focus-visible:ring-[#F0C36B] focus-visible:outline-none transition-all touch-manipulation cursor-pointer ${
                  viewMode === 'vip'
                    ? 'bg-[#F0C36B] text-black font-semibold shadow-[0_0_12px_rgba(240,195,107,0.4)]'
                    : 'text-[#F8F2E8]/80 bg-white/[0.04] border border-white/10 hover:border-[#F0C36B]/40 hover:text-[#F0C36B]'
                }`}
                title="Grand VIP Royal Salons"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>VIP</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchPreset('topdown')}
                aria-pressed={viewMode === 'topdown'}
                className={`inline-flex items-center justify-center gap-1.5 min-h-[48px] min-w-[48px] px-3.5 py-2.5 sm:min-h-[38px] sm:min-w-0 sm:px-3 sm:py-1.5 rounded-xl text-xs font-mono font-medium focus-visible:ring-2 focus-visible:ring-[#F0C36B] focus-visible:outline-none transition-all touch-manipulation cursor-pointer ${
                  viewMode === 'topdown'
                    ? 'bg-[#F0C36B] text-black font-semibold shadow-[0_0_12px_rgba(240,195,107,0.4)]'
                    : 'text-[#F8F2E8]/80 bg-white/[0.04] border border-white/10 hover:border-[#F0C36B]/40 hover:text-[#F0C36B]'
                }`}
                title="Top-Down Architectural Floor Plan"
              >
                <span>Top-Down</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchPreset('eyelevel')}
                className="inline-flex items-center justify-center min-h-[48px] min-w-[48px] p-2.5 sm:min-h-[38px] sm:min-w-[38px] sm:p-2 rounded-xl text-xs font-mono font-medium text-[#F8F2E8]/70 bg-white/[0.03] border border-white/10 hover:border-[#F0C36B]/40 hover:text-[#F0C36B] focus-visible:ring-2 focus-visible:ring-[#F0C36B] focus-visible:outline-none transition-all touch-manipulation cursor-pointer"
                title="Reset Camera Orientation"
                aria-label="Reset Camera Orientation"
              >
                <RotateCcw className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={() => handleToggleFullscreen(false)}
                className="inline-flex items-center justify-center min-h-[48px] min-w-[48px] p-2.5 sm:min-h-[38px] sm:min-w-[38px] sm:p-2 rounded-xl text-xs font-mono font-medium text-[#F8F2E8] bg-white/[0.06] border border-[#F0C36B]/40 hover:border-[#F0C36B] hover:text-[#F0C36B] focus-visible:ring-2 focus-visible:ring-[#F0C36B] focus-visible:outline-none transition-all touch-manipulation cursor-pointer"
                title="Exit Fullscreen"
                aria-label="Exit Fullscreen"
              >
                <X className="w-4 h-4 text-[#F0C36B]" />
              </button>
            </div>
          </>
        ) : (
          /* Non-Fullscreen Card 1 Header: 100% Matching Reference Screenshot */
          <>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#F0C36B]/15 border border-[#F0C36B]/40 flex items-center justify-center text-[#F0C36B] shrink-0">
                <Box className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold text-[#FAF5EC] leading-tight">
                  3D Restaurant View
                </h3>
                <span className="text-[10.5px] text-[#9A9286] block leading-none mt-0.5">
                  Explore &amp; select your table
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onSwitchTo2D && (
                <button
                  type="button"
                  onClick={onSwitchTo2D}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#FAF5EC] hover:text-[#FFE3A5] bg-white/[0.04] hover:bg-white/[0.08] border border-[#F0C36B]/40 hover:border-[#F0C36B] transition-all cursor-pointer shadow-sm"
                >
                  <Layers className="w-3.5 h-3.5 text-[#F0C36B]" />
                  <span>2D View</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* 3D Unified Architecture Card with Seamless Bottom Fullscreen Integration (Zero Gap) */}
      <div className={isFullscreenMode ? 'contents' : 'w-full flex flex-col'}>
        {/* 3D Canvas Viewport */}
        <div
          ref={canvasContainerRef}
          onClick={() => setIsDesktopActive(true)}
          role="region"
          aria-label="3D Interactive Restaurant Floorplan"
          className={
            isFullscreenMode
              ? 'relative flex-1 w-full rounded-2xl overflow-hidden bg-[#16100C] border border-[#F0C36B]/40 shadow-[0_20px_50px_rgba(0,0,0,0.8)] touch-pan-y min-h-0'
              : 'relative w-full h-[360px] sm:h-[400px] md:h-[420px] lg:h-[540px] xl:h-[620px] rounded-t-2xl overflow-hidden bg-[#16100C] border-t border-x border-[#F0C36B]/40 shadow-[0_20px_50px_rgba(0,0,0,0.8)] touch-pan-y'
          }
          onTouchMove={handleTouchMove}
        >
        {/* On-Demand Energy & 0-FPS Sleep Telemetry HUD */}
        <div className="absolute top-3 right-3 z-20 pointer-events-auto">
          <DemandFrameloopBadge telemetry={telemetry} />
        </div>

        {/* Floating Zone Badges & Overlays Matching Reference Design */}
        {!isFullscreenMode && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {/* VIP zone pin (upper left) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSwitchPreset('vip');
              }}
              className="pointer-events-auto absolute top-[30%] left-[24%] -translate-x-1/2 -translate-y-1/2 px-2.5 py-0.5 rounded-full bg-black/80 hover:bg-black border border-[#F0C36B]/60 text-[#F0C36B] hover:text-[#FFE3A5] text-[10px] font-mono font-bold flex items-center gap-1 shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Crown className="w-2.5 h-2.5 text-[#F0C36B]" />
              <span>VIP</span>
            </button>

            {/* Rotunda zone pin (center) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSwitchPreset('rotunda');
              }}
              className="pointer-events-auto absolute top-[48%] left-[52%] -translate-x-1/2 -translate-y-1/2 px-2.5 py-0.5 rounded-full bg-black/80 hover:bg-black border border-[#F0C36B]/60 text-[#F0C36B] hover:text-[#FFE3A5] text-[10px] font-mono font-bold flex items-center gap-1 shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-2.5 h-2.5 text-[#F0C36B]" />
              <span>Rotunda</span>
            </button>

            {/* Bar zone pin (right) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSwitchPreset('bar');
              }}
              className="pointer-events-auto absolute top-[52%] right-[14%] translate-x-1/2 -translate-y-1/2 px-2.5 py-0.5 rounded-full bg-black/80 hover:bg-black border border-[#F0C36B]/60 text-[#F0C36B] hover:text-[#FFE3A5] text-[10px] font-mono font-bold flex items-center gap-1 shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Wine className="w-2.5 h-2.5 text-[#F0C36B]" />
              <span>Bar</span>
            </button>

            {/* Bottom Left: Top View Preset Pill */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSwitchPreset(viewMode === 'topdown' ? 'eyelevel' : 'topdown');
              }}
              className="pointer-events-auto absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-black/90 hover:bg-black border border-white/20 hover:border-[#F0C36B]/60 text-[11px] text-[#FAF5EC] font-mono flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Maximize2 className="w-3 h-3 text-[#F0C36B]" />
              <span>Top View</span>
            </button>

            {/* Bottom Right: Compass Crosshair Target Circle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFullscreen(true);
              }}
              title="View in Fullscreen"
              className="pointer-events-auto absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/85 hover:bg-black border border-white/20 hover:border-[#F0C36B]/60 flex items-center justify-center text-[#F0C36B] shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Desktop 3D Focus Status Indicator */}
        {isDesktopActive && !quality.isMobile && !quality.isTouch && isFullscreenMode && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/92 border border-[#F0C36B]/50 text-[#F8F2E8] text-[11px] font-mono shadow-lg animate-in fade-in duration-200 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-[#F0C36B] animate-pulse" />
            <span>3D Controls Active · Scroll to zoom · Press Esc or click outside to scroll page</span>
          </div>
        )}

        <ThreeDErrorBoundary
          onSwitchTo2D={onSwitchTo2D}
          selectedTableNumber={selectedTableNumber}
          guests={guests}
          selectedZone={selectedZone}
        >
          <Canvas
            frameloop="demand"
            dpr={quality.dpr}
            shadows={quality.shadowsEnabled ? 'percentage' : false}
            camera={{
              position: [1.8, 1.25, 6.2], // Eye-level dining view directly matching Blender Camera_EyeLevel_Verification
              fov: 46,
              near: 0.05,
              far: 150,
            }}
            gl={{
              antialias: quality.antialias,
              alpha: false,
              powerPreference: quality.powerPreference,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: quality.toneMappingExposure,
            }}
            onCreated={({ gl, scene, camera }) => {
              if (gl.shadowMap) {
                gl.shadowMap.autoUpdate = false;
                gl.shadowMap.needsUpdate = true;
              }
              try {
                gl.compile(scene, camera);
              } catch {
                // Ignore compile fallback in test/mock environments
              }
            }}
          >
            {/* Deep Architectural Background matching warm dining ambiance */}
            <color attach="background" args={['#16100C']} />

            {/* Authentic Warm Cinematic Architectural Lighting */}
            <ambientLight color="#FFF2DE" intensity={1.3} />
            
            {/* Sky/Floor Hemisphere Warm Fill: Golden Amber Ground Bounce instead of pitch black */}
            <hemisphereLight args={['#FFE8CC', '#4A2E18', 1.35]} />
            
            {/* Key Warm Sunlight */}
            <directionalLight
              position={[16, 26, 18]}
              intensity={2.2}
              color="#FFF6E8"
              castShadow={quality.shadowsEnabled}
              shadow-mapSize-width={quality.maxShadowMapSize}
              shadow-mapSize-height={quality.maxShadowMapSize}
              shadow-camera-left={-22}
              shadow-camera-right={23}
              shadow-camera-top={17}
              shadow-camera-bottom={-16}
              shadow-camera-near={10}
              shadow-camera-far={60}
              shadow-bias={-0.00005}
              shadow-normalBias={0.02}
            />
            
            {/* Indirect Ground Bounce Light (Physical bounce off warm hardwood floor) */}
            <directionalLight
              position={[0, -12, 0]}
              intensity={0.65}
              color="#FFA24A"
            />
            
            {/* Fill Light from Promenade */}
            <directionalLight
              position={[-18, 16, -14]}
              intensity={0.95}
              color="#E8D8C4"
            />
            
            {/* Central Rotunda Chandelier & Water Feature Glow (Radiant Grand Glow) */}
            <pointLight position={[0, 4.5, 0.6]} intensity={7.5} distance={35} color="#FFA436" />

            {/* Rotunda Center Chandelier Crystal Core Light */}
            <pointLight position={[0, 3.2, 0.6]} intensity={6.0} distance={20} color="#FFB84D" />

            {/* Rotunda Pool Water Turquoise Luminescence */}
            <pointLight position={[0, 1.2, 0.6]} intensity={4.5} distance={12} color="#38E5C2" />
            
            {/* Sommelier Showcase Wine Wall Warm Accent */}
            <pointLight position={[10, 4.0, -11]} intensity={4.2} distance={22} color="#FFD488" />
            
            {/* Cocktail Bar Warm Accent */}
            <pointLight position={[-12, 4.0, 0]} intensity={3.5} distance={22} color="#FFBF55" />

            <MobileTouchSync touchOrbitActive={touchOrbitActive} />
            <ViewportVisibilitySync isVisible={isViewportVisible} />

            <Suspense fallback={<CanvasLoadingScreen />}>
              {/* WebGL Context Loss & Recovery Guard */}
              <WebGLContextGuard
                canvasName="Restaurant 3D Floorplan"
                onContextLost={() => {
                  setContextLost(true);
                  setContextRestoring(true);
                }}
                onContextRestored={() => {
                  setContextLost(false);
                  setContextRestoring(false);
                }}
                onReinitialize={(restoredScene, restoredGl) => {
                  applyArchitecturalPBR(restoredScene, quality.simplifyTransmission, quality.shadowsEnabled);
                  if (restoredGl?.shadowMap) {
                    restoredGl.shadowMap.needsUpdate = true;
                  }
                }}
                restoreTimeoutMs={5000}
                onRestoreTimeout={() => {
                  setContextRestoring(false);
                }}
              />

              {/* Local LookDev Environment Reflections (from local public/textures, zero external CDN fetch!) */}
              <Environment files="/textures/forest_env.hdr" environmentIntensity={quality.environmentIntensity} />

              {/* Demand Frameloop & Camera Glide Controller: Drops to 0 FPS when idle */}
              <DemandFrameloopController
                controlsRef={controlsRef}
                targetCamera={targetCamera}
                onTargetReached={handleTargetReached}
                deps={[selectedTableNumber, hoveredTable?.tableNumber, guests, availableTableNumbers, viewMode]}
                onTelemetryChange={setTelemetry}
                enableTelemetry={true}
              />

              <RestaurantModel
                simplifyTransmission={quality.simplifyTransmission}
                shadowsEnabled={quality.shadowsEnabled}
              />

              <TableColliders
                selectedTableNumber={selectedTableNumber}
                hoveredTable={hoveredTable}
                onHoverTable={setHoveredTable}
                onSelectTable={handleSelectTable}
                availableTableNumbers={availableTableNumbers}
                guests={guests}
                showAllBadges={showAllTableNumbers}
              />

              <OrbitControls
                ref={controlsRef}
                makeDefault
                enableDamping
                dampingFactor={0.085}
                zoomSpeed={1.25}
                enableZoom={quality.isMobile || quality.isTouch || isDesktopActive}
                enableRotate={quality.isMobile || quality.isTouch ? touchOrbitActive : true}
                minDistance={2.2}
                maxDistance={48.0}
                maxPolarAngle={Math.PI / 2.02} // Keep camera strictly above floor
                minPolarAngle={0.05}
                target={[0.0, 1.15, 0.0]}
                touches={{
                  ONE: touchOrbitActive ? THREE.TOUCH.ROTATE : (-1 as unknown as THREE.TOUCH),
                  TWO: THREE.TOUCH.DOLLY_ROTATE,
                }}
              />
            </Suspense>
          </Canvas>
        </ThreeDErrorBoundary>

        {/* WebGL Context Loss Floating Recovery Banner */}
        {contextLost && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-md border border-[#F0C36B]/40 text-center animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-[#F0C36B]/10 border border-[#F0C36B]/30 flex items-center justify-center mb-3">
              <RefreshCw className={`w-6 h-6 text-[#F0C36B] ${contextRestoring ? 'animate-spin' : ''}`} />
            </div>
            <h4 className="text-sm font-mono font-semibold text-[#F8F2E8] uppercase tracking-wider mb-1.5">
              {contextRestoring ? 'Restoring 3D Architectural Scene...' : '3D Graphics Suspended by Device'}
            </h4>

            {/* Preserved Reservation Info Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 my-2 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Booking Safe: {selectedTableNumber ? `Table #${String(selectedTableNumber).padStart(2, '0')}` : 'Party Configured'}
                {guests ? ` · ${guests} Guests` : ''}
              </span>
            </div>

            <p className="text-xs text-[#C8B89E] max-w-sm mb-5 leading-relaxed font-sans">
              {contextRestoring
                ? 'Device graphics memory was momentarily reclaimed. Re-initializing textures & architectural lighting...'
                : 'Device graphics memory is constrained on this device. You can seamlessly switch to the interactive 2D floorplan without losing any reservation details.'}
            </p>

            <div className="flex items-center gap-3">
              {onSwitchTo2D && (
                <button
                  type="button"
                  onClick={onSwitchTo2D}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F0C36B] text-black font-semibold text-xs tracking-wider uppercase shadow-lg shadow-[#D4AF37]/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Switch to 2D Floorplan
                </button>
              )}
            </div>
          </div>
        )}

        {/* Floating Controls Helper (Bottom-Left) */}
        <div className={`absolute z-10 flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] sm:text-[11px] font-mono text-[#F8F2E8]/80 pointer-events-none shadow-lg max-w-[calc(100%-200px)] truncate ${
          isFullscreenMode ? 'bottom-[136px] sm:bottom-[88px] left-3 sm:left-4' : 'bottom-4 left-4'
        }`}>
          <Sparkles className="w-3.5 h-3.5 text-[#F0C36B] shrink-0" />
          <span className="hidden md:inline">
            Click table to reserve · Drag to orbit · Scroll to zoom
          </span>
          <span className="md:hidden truncate">
            {touchOrbitActive
              ? '1-finger orbit active · Tap table'
              : 'Use 2 fingers to rotate · Tap table'}
          </span>
        </div>
        {/* Floating Touch Lock / Orbit Mode Toggle (WCAG AAA >= 48x48px Tap Target) */}
        <div className={`absolute z-20 flex items-center gap-2 ${
          isFullscreenMode ? 'bottom-[136px] sm:bottom-[88px] right-3 sm:right-4' : 'bottom-4 right-4'
        }`}>
          <button
            type="button"
            onClick={() => setTouchOrbitActive(!touchOrbitActive)}
            className={`min-h-[48px] min-w-[48px] px-3.5 py-2.5 rounded-xl sm:rounded-full backdrop-blur-xl border transition-all duration-200 flex items-center gap-2.5 shadow-2xl active:scale-95 touch-manipulation cursor-pointer select-none ${
              touchOrbitActive
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#F0C36B] text-black border-white/30 shadow-[0_0_20px_rgba(240,195,107,0.6)] font-semibold'
                : 'bg-black/85 hover:bg-black/95 text-[#F8F2E8] border-[#F0C36B]/50 hover:border-[#F0C36B]'
            }`}
            aria-label={
              touchOrbitActive
                ? '3D Orbit Active: Tap to lock 3D and scroll page'
                : 'Scroll Mode Active: Tap to enable 1-finger 3D orbit'
            }
          >
            <div
              className={`w-7 h-7 rounded-lg sm:rounded-full flex items-center justify-center shrink-0 ${
                touchOrbitActive ? 'bg-black/20 text-black' : 'bg-[#F0C36B]/15 text-[#F0C36B]'
              }`}
            >
              {touchOrbitActive ? (
                <Unlock className="w-4 h-4 animate-pulse" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </div>
            <div className="flex flex-col text-left leading-tight pr-1">
              <span className="text-[11px] font-mono font-bold tracking-tight">
                {touchOrbitActive ? '3D Orbit Active' : 'Page Scroll Mode'}
              </span>
              <span
                className={`text-[9.5px] ${
                  touchOrbitActive ? 'text-black/80 font-medium' : 'text-[#A69F94]'
                }`}
              >
                {touchOrbitActive ? 'Tap to lock & scroll' : 'Tap to orbit 3D view'}
              </span>
            </div>
          </button>
        </div>

        {/* Dynamic Mobile Touch Hint Toast (Auto-appears when single finger moves over canvas in scroll mode) */}
        {showTouchHint && !touchOrbitActive && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#140F0A]/98 border border-[#F0C36B] text-[#F8F2E8] shadow-[0_12px_30px_rgba(0,0,0,0.85),0_0_20px_rgba(240,195,107,0.4)] animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
            <span className="text-base">✌️</span>
            <span className="text-xs font-mono font-medium text-[#F0C36B] whitespace-nowrap">
              Use 2 fingers to rotate · Tap button to orbit with 1 finger
            </span>
          </div>
        )}


        {/* Live Status Legend (Only shown in Fullscreen mode) */}
        {isFullscreenMode && (
          <div className="absolute z-10 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono pointer-events-none bottom-[88px] right-[230px]">
            <span className="inline-flex items-center gap-1.5 text-[#F0C36B]">
              <span className="w-2 h-2 rounded-full bg-[#F0C36B] shadow-[0_0_6px_#F0C36B]" />
              Available
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#F8F2E8]">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Selected
            </span>
            <span className="inline-flex items-center gap-1.5 text-white/40">
              <span className="w-2 h-2 rounded-full bg-white/20" />
              Reserved
            </span>
          </div>
        )}

        {/* Active Hover / Selected Table Card (Only shown in Fullscreen mode) */}
        {isFullscreenMode && (hoveredTable || selectedTableObj) && (
          <div className="absolute top-4 left-4 z-10 max-w-xs sm:max-w-sm p-4 rounded-2xl bg-[#100C09]/98 border border-[#F0C36B]/50 shadow-[0_12px_36px_rgba(0,0,0,0.85),0_0_20px_rgba(240,195,107,0.25)] transition-all duration-200">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F0C36B] to-[#D4AF37] text-black font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(240,195,107,0.5)]">
                  {String((hoveredTable || selectedTableObj)?.tableNumber).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-serif font-bold text-[#F8F2E8] truncate leading-tight">
                    {(hoveredTable || selectedTableObj)?.name}
                  </h4>
                  <span className="text-[10px] font-mono text-[#F0C36B]/90">
                    {(hoveredTable || selectedTableObj)?.zone}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-white/80 bg-white/10 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                <Users className="w-2.5 h-2.5 text-[#F0C36B]" />
                {(hoveredTable || selectedTableObj)?.capacity} Guests
              </span>
            </div>
            <p className="text-[11px] text-[#D4C8B8] font-light leading-relaxed line-clamp-2 mb-2">
              {(hoveredTable || selectedTableObj)?.ambience}
            </p>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
              <button
                type="button"
                onClick={() => focusOnTable((hoveredTable || selectedTableObj)!)}
                className="inline-flex items-center gap-1 text-[#F0C36B] hover:text-[#FFE082] transition-colors cursor-pointer"
                title="Focus Camera Directly on Table"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Focus View</span>
              </button>
              {selectedTableObj?.tableNumber === (hoveredTable || selectedTableObj)?.tableNumber ? (
                <span className="text-[#36D6A0] font-semibold flex items-center gap-1 bg-[#36D6A0]/10 px-2.5 py-0.5 rounded-full border border-[#36D6A0]/30 text-[10.5px]">
                  <Check className="w-3 h-3" /> Selected Table
                </span>
              ) : ((hoveredTable || selectedTableObj)?.capacity ?? 0) < guests ? (
                <span className="text-[10px] font-mono text-rose-400 bg-rose-950/50 border border-rose-500/30 px-2.5 py-1 rounded-lg">
                  Needs {guests} Seats
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSelectTable((hoveredTable || selectedTableObj)!)}
                  className="px-3 py-1 rounded-lg bg-[#F0C36B] hover:bg-[#FFE082] text-black font-semibold text-xs transition-colors shadow-md active:scale-95 cursor-pointer"
                >
                  Select Table
                </button>
              )}
            </div>
          </div>
        )}

        {/* Fullscreen Table Tracking & Selection Dock (Bottom) */}
        {isFullscreenMode && (
          <div className="absolute bottom-3 sm:bottom-4 left-3 right-3 sm:left-4 sm:right-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-[#100C09]/98 border border-[#F0C36B]/50 shadow-[0_12px_36px_rgba(0,0,0,0.85),0_0_25px_rgba(240,195,107,0.25)]">
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
              <span className="text-xs font-mono text-[#F0C36B] font-bold shrink-0 hidden md:inline">
                ALL 28 TABLES:
              </span>
              {/* Quick Table Selector Carousel */}
              <div
                className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full sm:max-w-md md:max-w-xl scrollbar-thin"
                role="region"
                aria-label="Table quick selector"
              >
                {RESTAURANT_3D_TABLES.map((t) => {
                  const isCur = selectedTableNumber === t.tableNumber;
                  const isAvail = availableTableNumbers ? availableTableNumbers.includes(t.tableNumber) : true;
                  const fitsParty = t.capacity >= guests;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTable(t)}
                      aria-pressed={isCur}
                      aria-label={`Table ${t.tableNumber}: ${t.name}, ${t.capacity} guests (${t.zone})${isCur ? ', currently selected' : ''}${!fitsParty ? ', does not fit party size' : ''}`}
                      className={`min-h-[44px] min-w-[42px] sm:min-h-[36px] sm:min-w-[36px] px-2 rounded-lg font-mono text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1 cursor-pointer touch-manipulation focus-visible:ring-2 focus-visible:ring-[#F0C36B] focus-visible:outline-none ${
                        isCur
                          ? 'bg-[#F0C36B] text-black ring-2 ring-[#F0C36B] shadow-[0_0_12px_rgba(240,195,107,0.6)]'
                          : isAvail && fitsParty
                            ? 'bg-black/60 hover:bg-black/90 text-[#F8F2E8] border border-white/10 hover:border-[#F0C36B]/60'
                            : 'bg-black/30 text-white/30 border border-white/5 opacity-50'
                      }`}
                      title={`${t.name} (${t.capacity} guests) - ${t.zone}${!fitsParty ? ` [Party size of ${guests} exceeds ${t.capacity} seats]` : ''}`}
                    >
                      <span>T{String(t.tableNumber).padStart(2, '0')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
              <button
                type="button"
                onClick={() => handleToggleFullscreen(false)}
                aria-label="Confirm Table Selection and Return"
                className="w-full sm:w-auto min-h-[48px] sm:min-h-[40px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F0C36B] text-black font-mono font-bold text-xs shadow-[0_0_15px_rgba(240,195,107,0.6)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation focus-visible:ring-2 focus-visible:ring-black"
              >
                <Check className="w-4 h-4" />
                <span>Confirm {selectedTableObj ? `Table #${String(selectedTableObj.tableNumber).padStart(2, '0')}` : 'Selection'} & Return</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Seamlessly attached Fullscreen 3D View & Select Bar directly under the 3D box (Zero Gap) */}
      {!isFullscreenMode && (
        <button
          type="button"
          onClick={() => handleToggleFullscreen(true)}
          className="w-full min-h-[56px] flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#18120C] via-[#241A12] to-[#18120C] border-b border-x border-[#F0C36B]/40 hover:border-[#F0C36B] rounded-b-2xl shadow-[0_8px_20px_rgba(0,0,0,0.5)] group transition-all cursor-pointer active:scale-[0.99] select-none touch-manipulation"
          aria-label="Open Fullscreen 3D Table Selector (YouTube Style)"
          title="Open Fullscreen 3D Table Selector (YouTube Style)"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F0C36B] to-[#D4AF37] flex items-center justify-center text-black shadow-[0_0_12px_rgba(240,195,107,0.5)] group-hover:scale-105 transition-transform shrink-0">
              <Maximize2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <div className="text-xs sm:text-sm font-serif font-bold text-[#F8F2E8] group-hover:text-[#F0C36B] transition-colors flex items-center gap-2">
                <span>View & Select Table in Fullscreen</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#F0C36B]/15 text-[#F0C36B] border border-[#F0C36B]/30 uppercase tracking-widest font-semibold hidden xs:inline">
                  YouTube Style
                </span>
              </div>
              <p className="text-[11px] text-[#A69F94] font-light">
                Click to expand 3D floorplan across entire screen · Select table & return
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#F0C36B] bg-[#F0C36B]/15 px-3 py-1.5 rounded-full border border-[#F0C36B]/40 group-hover:bg-[#F0C36B] group-hover:text-black transition-all">
            <span>FULLSCREEN ⛶</span>
          </div>
        </button>
      )}
      </div>
    </div>
  );

  if (isFullscreenMode && mounted && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
}
