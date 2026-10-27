'use client';

import React, { useState, useRef, Suspense, useCallback, useMemo } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import {
  Sparkles,
  Compass,
  RotateCcw,
  Users,
  Check,
  Eye,
  Layers,
  UtensilsCrossed,
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

// Subcomponent: 3D Floating Table Markers & Status Indicators
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
          0.76, // Float subtly above the tabletop
          -t.position3D[2],
        ];

        const isSelected = selectedTableNumber === t.tableNumber;
        const isHovered = hoveredTable?.tableNumber === t.tableNumber;
        const isAvailable = availableTableNumbers
          ? availableTableNumbers.includes(t.tableNumber)
          : true;
        const fitsParty = t.capacity >= guests;

        return (
          <group key={t.id} position={pos}>
            {/* Elegant 3D Table Ring Indicator */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
              <ringGeometry args={[0.26, isSelected ? 0.44 : 0.36, 32]} />
              <meshBasicMaterial
                color={
                  isSelected
                    ? '#F0C36B'
                    : isHovered
                      ? '#FFE082'
                      : isAvailable && fitsParty
                        ? '#F0C36B'
                        : '#555555'
                }
                transparent
                opacity={isSelected ? 0.95 : isHovered ? 0.85 : 0.25}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Glowing disc if selected or hovered */}
            {(isSelected || isHovered) && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
                <circleGeometry args={[isSelected ? 0.42 : 0.32, 32]} />
                <meshBasicMaterial
                  color="#F0C36B"
                  transparent
                  opacity={isSelected ? 0.35 : 0.18}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* Floating HTML Pill: Always shown for Selected Table, or on Hover, keeping restaurant view uncluttered */}
            {(isSelected || isHovered) && (
              <Html
                center
                distanceFactor={16}
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
                  className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wider whitespace-nowrap shadow-2xl transition-all duration-200 select-none ${
                    isSelected
                      ? 'bg-[#F0C36B] text-black ring-2 ring-[#F0C36B] ring-offset-2 ring-offset-black scale-110 shadow-[0_0_25px_rgba(240,195,107,0.9)]'
                      : 'bg-[#181410]/95 text-[#F8F2E8] border border-[#F0C36B]/60 backdrop-blur-xl scale-105 shadow-[0_0_15px_rgba(240,195,107,0.4)]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected
                        ? 'bg-black animate-pulse'
                        : isAvailable && fitsParty
                          ? 'bg-[#36D6A0] shadow-[0_0_6px_#36D6A0]'
                          : 'bg-white/30'
                    }`}
                  />
                  <span>T#{t.tableNumber.toString().padStart(2, '0')}</span>
                  <span className="opacity-70 text-[9.5px] flex items-center gap-0.5">
                    <Users className="w-2.5 h-2.5 inline" />
                    {t.capacity}
                  </span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5 text-black" />}
                </button>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

// Fallback Loading Screen
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
  const [viewMode, setViewMode] = useState<'perspective' | 'eyelevel' | 'topdown'>('eyelevel');
  const controlsRef = useRef<any>(null);

  // Selected table metadata
  const selectedTableObj = useMemo(() => {
    return selectedTableNumber
      ? RESTAURANT_3D_TABLES.find((t) => t.tableNumber === selectedTableNumber) || null
      : null;
  }, [selectedTableNumber]);

  // Eye-Level Dining View: Direct match for the user's high-detail foreground table perspective
  const handleEyeLevelView = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0.0, 1.1, -1.0);
      controlsRef.current.object.position.set(0.0, 1.35, 4.8);
      controlsRef.current.update();
      setViewMode('eyelevel');
    }
  }, []);

  // Isometric Hero Overview: matches Blender Camera_3D_Axonometric_Hero
  const handleIsometricView = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 1.0, 0);
      controlsRef.current.object.position.set(28, 24, 30);
      controlsRef.current.update();
      setViewMode('perspective');
    }
  }, []);

  // Top-Down View handler: matches Blender Camera_4K_TopDown_FloorPlan
  const handleTopDownView = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.object.position.set(0, 36, 0.01);
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
            3D ARCHITECTURAL RESTAURANT · THE GOLDEN OAK
          </span>
          <span className="text-[10px] bg-[#F0C36B]/15 text-[#F0C36B] px-2 py-0.5 rounded-full font-mono border border-[#F0C36B]/30">
            28 Dining Tables
          </span>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
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
            onClick={handleEyeLevelView}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              viewMode === 'eyelevel'
                ? 'bg-[#F0C36B] text-black font-semibold shadow-[0_0_12px_rgba(240,195,107,0.4)]'
                : 'text-[#F8F2E8]/80 bg-white/[0.04] border border-white/10 hover:border-[#F0C36B]/40 hover:text-[#F0C36B]'
            }`}
            title="Dine-in Eye-Level View (Cutlery, Glassware & Rotunda Perspective)"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Dining View</span>
          </button>

          <button
            type="button"
            onClick={handleIsometricView}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
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
            onClick={handleTopDownView}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
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
            onClick={handleEyeLevelView}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono font-medium text-[#F8F2E8]/70 bg-white/[0.03] border border-white/10 hover:border-[#F0C36B]/40 hover:text-[#F0C36B] transition-all"
            title="Reset Camera Orientation"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div className="relative w-full h-[520px] md:h-[600px] rounded-2xl overflow-hidden bg-[#080605] border border-[#F0C36B]/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        <Canvas
          camera={{
            position: [0.0, 1.35, 4.8], // Eye-level foreground dining table setup
            fov: 46,
            near: 0.05,
            far: 150,
          }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
        >
          {/* Deep Architectural Background matching Blender void */}
          <color attach="background" args={['#080605']} />

          {/* Environmental HDRI for Realistic LookDev Brass, Glass & Marble Reflections */}
          <Environment preset="city" environmentIntensity={0.85} />

          {/* Authentic Warm Cinematic Architectural Lighting */}
          <ambientLight color="#FFE8C8" intensity={0.5} />
          
          {/* Key Warm Sunlight */}
          <directionalLight
            position={[18, 28, 20]}
            intensity={1.2}
            color="#FFF4E0"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          
          {/* Fill Light */}
          <directionalLight
            position={[-18, 16, -14]}
            intensity={0.4}
            color="#D8C8B4"
          />
          
          {/* Central Rotunda Chandelier & Water Feature Glow */}
          <pointLight position={[0, 4.5, 0]} intensity={2.8} distance={22} color="#FFA834" />
          
          {/* Sommelier Showcase Wine Wall Warm Accent */}
          <pointLight position={[10, 4.0, -11]} intensity={1.8} distance={15} color="#FFD180" />
          
          {/* Cocktail Bar Warm Accent */}
          <pointLight position={[-12, 4.0, 0]} intensity={1.5} distance={16} color="#FFB84D" />

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
              minDistance={1.0}
              maxDistance={65}
              maxPolarAngle={Math.PI / 2.02} // Keep camera strictly above floor
              minPolarAngle={0.05}
              target={[0, 1.1, -1.0]}
            />
          </Suspense>
        </Canvas>

        {/* Floating Controls Helper (Bottom-Left) */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#F8F2E8]/70 pointer-events-none">
          <Sparkles className="w-3 h-3 text-[#F0C36B]" />
          <span>Click any table or ring to reserve · Drag to orbit · Scroll to zoom</span>
        </div>

        {/* Live Status Legend (Bottom-Right) */}
        <div className="absolute bottom-4 right-4 z-10 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono">
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

        {/* Active Hover / Selected Table Card (Top-Left Floating) */}
        {(hoveredTable || selectedTableObj) && (
          <div className="absolute top-4 left-4 z-10 max-w-xs p-3.5 rounded-xl bg-black/85 backdrop-blur-xl border border-[#F0C36B]/40 shadow-2xl transition-all duration-200">
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-xs font-mono font-bold text-[#F0C36B]">
                {(hoveredTable || selectedTableObj)?.name}
              </span>
              <span className="text-[10px] font-mono text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
                {(hoveredTable || selectedTableObj)?.capacity} Guests
              </span>
            </div>
            <p className="text-[11px] text-[#D4C8B8] font-serif leading-relaxed line-clamp-2">
              {(hoveredTable || selectedTableObj)?.ambience}
            </p>
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/60">
              <span>Zone: {(hoveredTable || selectedTableObj)?.zone}</span>
              {selectedTableObj?.tableNumber === (hoveredTable || selectedTableObj)?.tableNumber && (
                <span className="text-[#F0C36B] font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Selected
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
