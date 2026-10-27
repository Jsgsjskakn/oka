'use client';

import React, { useState, useRef, Suspense, useCallback, useMemo } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Sparkles,
  Compass,
  RotateCcw,
  Maximize2,
  Users,
  Check,
  AlertCircle,
  Eye,
  Layers,
} from 'lucide-react';
import {
  RESTAURANT_3D_TABLES,
  resolveTableFromMeshName,
  type Floor3DTable,
} from '@/lib/constants/restaurant3DMapping';

// Preload the luxury model
useGLTF.preload('/models/the_golden_oak_interior.glb');

interface Restaurant3DFloorplanProps {
  selectedTableNumber: number | null;
  onSelectTable: (table: Floor3DTable) => void;
  guests: number;
  availableTableNumbers?: number[];
  selectedZone?: string;
  onSelectZone?: (zone: string) => void;
  onSwitchTo2D?: () => void;
}

// Subcomponent: 3D Scene Model & Raycasting Table Highlighting
function RestaurantModel({
  selectedTableNumber,
  hoveredTable,
  setHoveredTable,
  onSelectTable,
  availableTableNumbers,
  guests,
}: {
  selectedTableNumber: number | null;
  hoveredTable: Floor3DTable | null;
  setHoveredTable: (table: Floor3DTable | null) => void;
  onSelectTable: (table: Floor3DTable) => void;
  availableTableNumbers?: number[];
  guests: number;
}) {
  const { scene } = useGLTF('/models/the_golden_oak_interior.glb');

  // Handle pointer over / click
  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      let current: THREE.Object3D | null = e.object;
      let matchedTable: Floor3DTable | undefined;

      while (current && !matchedTable) {
        if (current.name) {
          matchedTable = resolveTableFromMeshName(current.name);
        }
        current = current.parent;
      }

      if (matchedTable) {
        setHoveredTable(matchedTable);
        document.body.style.cursor = 'pointer';
      }
    },
    [setHoveredTable]
  );

  const handlePointerOut = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHoveredTable(null);
      document.body.style.cursor = 'auto';
    },
    [setHoveredTable]
  );

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      let current: THREE.Object3D | null = e.object;
      let matchedTable: Floor3DTable | undefined;

      while (current && !matchedTable) {
        if (current.name) {
          matchedTable = resolveTableFromMeshName(current.name);
        }
        current = current.parent;
      }

      if (matchedTable) {
        onSelectTable(matchedTable);
      }
    },
    [onSelectTable]
  );

  return (
    <primitive
      object={scene}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  );
}

// Subcomponent: 3D Floating Table Markers & Status Badges
function TableFloatingMarkers({
  selectedTableNumber,
  hoveredTable,
  onSelectTable,
  availableTableNumbers,
  guests,
}: {
  selectedTableNumber: number | null;
  hoveredTable: Floor3DTable | null;
  onSelectTable: (table: Floor3DTable) => void;
  availableTableNumbers?: number[];
  guests: number;
}) {
  return (
    <group>
      {RESTAURANT_3D_TABLES.map((t) => {
        // Coordinate conversion from Blender to Three.js:
        // Blender [X, Y, Z] -> Three.js [X, Z, -Y]
        const pos: [number, number, number] = [
          t.position3D[0],
          0.9, // Float comfortably above the tabletop
          -t.position3D[2],
        ];

        const isSelected = selectedTableNumber === t.tableNumber;
        const isHovered = hoveredTable?.tableNumber === t.tableNumber;
        const isAvailable = availableTableNumbers
          ? availableTableNumbers.includes(t.tableNumber)
          : true;
        const fitsParty = t.capacity >= guests;

        // Render marker
        return (
          <group key={t.id} position={pos}>
            {/* Visual 3D Ring under marker */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
              <ringGeometry args={[0.35, 0.45, 32]} />
              <meshBasicMaterial
                color={
                  isSelected
                    ? '#F0C36B'
                    : isAvailable && fitsParty
                      ? isHovered
                        ? '#F0C36B'
                        : '#36D6A0'
                      : '#6B7280'
                }
                transparent
                opacity={isSelected ? 0.95 : isHovered ? 0.8 : 0.4}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Glowing disc if selected */}
            {isSelected && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.14, 0]}>
                <circleGeometry args={[0.35, 32]} />
                <meshBasicMaterial
                  color="#F0C36B"
                  transparent
                  opacity={0.35}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* Floating HTML Table Pill */}
            <Html
              center
              distanceFactor={22}
              style={{
                transition: 'all 0.2s ease',
                pointerEvents: 'auto',
                cursor: 'pointer',
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTable(t);
                }}
                className={`group flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono font-semibold tracking-wider whitespace-nowrap shadow-xl transition-all duration-200 select-none ${
                  isSelected
                    ? 'bg-[#F0C36B] text-black ring-2 ring-[#F0C36B] ring-offset-2 ring-offset-black scale-110 shadow-[0_0_20px_rgba(240,195,107,0.8)]'
                    : isAvailable && fitsParty
                      ? isHovered
                        ? 'bg-[#1a1815] text-[#F0C36B] border border-[#F0C36B] scale-105 shadow-[0_0_12px_rgba(240,195,107,0.4)]'
                        : 'bg-[#121110]/90 text-[#F8F2E8] border border-white/20 hover:border-[#F0C36B] backdrop-blur-md'
                      : 'bg-black/80 text-white/40 border border-white/10 opacity-70 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSelected
                      ? 'bg-black animate-pulse'
                      : isAvailable && fitsParty
                        ? 'bg-[#36D6A0] shadow-[0_0_6px_#36D6A0]'
                        : 'bg-white/20'
                  }`}
                />
                <span>T#{t.tableNumber.toString().padStart(2, '0')}</span>
                <span className="opacity-60 text-[9px] flex items-center gap-0.5">
                  <Users className="w-2.5 h-2.5 inline" />
                  {t.capacity}
                </span>
                {isSelected && <Check className="w-2.5 h-2.5 ml-0.5" />}
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// Subcomponent: Camera Controller with Reset and Top-Down view
function CameraController({
  controlsRef,
}: {
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();

  return null;
}

// Fallback Loading Component
function CanvasLoadingScreen() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-6 bg-[#0E0D0C]/90 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl text-center min-w-[240px]">
        <div className="w-10 h-10 border-2 border-[#F0C36B] border-t-transparent rounded-full animate-spin mb-3 shadow-[0_0_15px_rgba(240,195,107,0.3)]" />
        <span className="text-xs font-mono font-semibold tracking-widest uppercase text-[#F0C36B]">
          Loading 3D Architecture
        </span>
        <span className="text-[11px] text-[#A69F94] mt-1 font-serif">
          The Golden Oak Dining Interior
        </span>
      </div>
    </Html>
  );
}

export function Restaurant3DFloorplan({
  selectedTableNumber,
  onSelectTable,
  guests,
  availableTableNumbers,
  selectedZone,
  onSelectZone,
  onSwitchTo2D,
}: Restaurant3DFloorplanProps) {
  const [hoveredTable, setHoveredTable] = useState<Floor3DTable | null>(null);
  const [viewMode, setViewMode] = useState<'perspective' | 'topdown'>('perspective');
  const controlsRef = useRef<any>(null);

  // Selected table metadata
  const selectedTableObj = useMemo(() => {
    return selectedTableNumber
      ? RESTAURANT_3D_TABLES.find((t) => t.tableNumber === selectedTableNumber) || null
      : null;
  }, [selectedTableNumber]);

  // Reset View handler
  const handleResetView = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 1.2, 0);
      controlsRef.current.object.position.set(24, 22, 28);
      controlsRef.current.update();
      setViewMode('perspective');
    }
  }, []);

  // Top-Down View handler
  const handleTopDownView = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.object.position.set(0, 38, 0.01);
      controlsRef.current.update();
      setViewMode('topdown');
    }
  }, []);

  const handleSelectTable = (table: Floor3DTable) => {
    onSelectTable(table);
    if (onSelectZone) {
      onSelectZone(table.zone);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* 3D Header & Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#F0C36B] animate-spin-slow" />
          <span className="text-xs font-semibold tracking-wider uppercase text-[#F8F2E8] font-mono">
            3D SPATIAL INTERIOR VIEW · THE GOLDEN OAK
          </span>
          <span className="text-[10px] bg-[#F0C36B]/15 text-[#F0C36B] px-2 py-0.5 rounded-full font-mono border border-[#F0C36B]/30">
            28 Dining Tables
          </span>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-2">
          {onSwitchTo2D && (
            <button
              type="button"
              onClick={onSwitchTo2D}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium text-[#F8F2E8]/80 bg-white/[0.04] border border-white/10 hover:border-[#F0C36B]/40 hover:text-[#F0C36B] transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2D Blueprint</span>
            </button>
          )}

          <button
            type="button"
            onClick={viewMode === 'topdown' ? handleResetView : handleTopDownView}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium text-[#F8F2E8]/80 bg-white/[0.04] border border-white/10 hover:border-[#F0C36B]/40 hover:text-[#F0C36B] transition-all"
            title="Toggle Top-Down Architectural Perspective"
          >
            <Eye className="w-3.5 h-3.5 text-[#F0C36B]" />
            <span>{viewMode === 'topdown' ? 'Isometric 3D' : 'Top-Down'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetView}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium text-[#F8F2E8]/80 bg-white/[0.04] border border-white/10 hover:border-[#F0C36B]/40 hover:text-[#F0C36B] transition-all"
            title="Reset Camera Orientation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div className="relative w-full h-[520px] md:h-[600px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#141210] to-[#0a0908] border border-white/[0.1] shadow-2xl">
        <Canvas
          camera={{
            position: [24, 22, 28],
            fov: 38,
            near: 0.1,
            far: 150,
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
        >
          {/* Real-time Cinematic Lighting tailored to Blender visual palette */}
          <ambientLight color="#FAF3E0" intensity={1.4} />
          <directionalLight
            position={[18, 30, 22]}
            intensity={2.2}
            color="#FFF4E6"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <directionalLight
            position={[-18, 20, -15]}
            intensity={0.9}
            color="#D8C8B0"
          />
          <pointLight position={[0, 8, 0]} intensity={1.5} distance={30} color="#F0C36B" />

          <Suspense fallback={<CanvasLoadingScreen />}>
            <RestaurantModel
              selectedTableNumber={selectedTableNumber}
              hoveredTable={hoveredTable}
              setHoveredTable={setHoveredTable}
              onSelectTable={handleSelectTable}
              availableTableNumbers={availableTableNumbers}
              guests={guests}
            />

            <TableFloatingMarkers
              selectedTableNumber={selectedTableNumber}
              hoveredTable={hoveredTable}
              onSelectTable={handleSelectTable}
              availableTableNumbers={availableTableNumbers}
              guests={guests}
            />

            <OrbitControls
              ref={controlsRef}
              makeDefault
              enableDamping
              dampingFactor={0.06}
              minDistance={6}
              maxDistance={70}
              maxPolarAngle={Math.PI / 2.05} // Never dip underneath floor
              minPolarAngle={0.05}
              target={[0, 1.2, 0]}
            />
          </Suspense>
        </Canvas>

        {/* Floating Controls Helper (Bottom-Left) */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#F8F2E8]/70 pointer-events-none">
          <Sparkles className="w-3 h-3 text-[#F0C36B]" />
          <span>Drag to Orbit · Scroll to Zoom · Click Tables to Reserve</span>
        </div>

        {/* Live Status Legend (Bottom-Right) */}
        <div className="absolute bottom-4 right-4 z-10 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono">
          <span className="inline-flex items-center gap-1.5 text-[#36D6A0]">
            <span className="w-2 h-2 rounded-full bg-[#36D6A0] shadow-[0_0_6px_#36D6A0]" />
            Available
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#F0C36B]">
            <span className="w-2 h-2 rounded-full bg-[#F0C36B] shadow-[0_0_6px_#F0C36B]" />
            Selected
          </span>
          <span className="inline-flex items-center gap-1.5 text-white/40">
            <span className="w-2 h-2 rounded-full bg-white/20" />
            Reserved
          </span>
        </div>

        {/* Active Hover / Selected Table Card (Top-Left Floating) */}
        {(hoveredTable || selectedTableObj) && (
          <div className="absolute top-4 left-4 z-10 max-w-xs p-3.5 rounded-xl bg-black/80 backdrop-blur-xl border border-[#F0C36B]/30 shadow-2xl transition-all duration-200">
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-xs font-mono font-bold text-[#F0C36B]">
                {(hoveredTable || selectedTableObj)?.name}
              </span>
              <span className="text-[10px] font-mono text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                {(hoveredTable || selectedTableObj)?.capacity} Guests
              </span>
            </div>
            <p className="text-[11px] text-[#A69F94] font-serif leading-relaxed line-clamp-2">
              {(hoveredTable || selectedTableObj)?.ambience}
            </p>
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/50">
              <span>Zone: {(hoveredTable || selectedTableObj)?.zone}</span>
              {selectedTableObj?.tableNumber === (hoveredTable || selectedTableObj)?.tableNumber && (
                <span className="text-[#F0C36B] font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
