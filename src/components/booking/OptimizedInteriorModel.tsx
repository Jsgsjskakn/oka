'use client';

import React, { useMemo, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import {
  RESTAURANT_3D_TABLES,
  type Floor3DTable,
} from '@/lib/constants/restaurant3DMapping';
import {
  INTERIOR_MODEL_URL,
  ORIGINAL_INTERIOR_MODEL_URL,
  applyInteriorMaterials,
  applyOptimizationPass,
  buildMergedScene,
  buildInstancedScene,
  getTableProxyGeometry,
} from '@/lib/three/interiorOptimization';

// Preload the interior model for seamless client transitions with local Draco decoder
useGLTF.preload(INTERIOR_MODEL_URL, '/draco/');

// Re-export core optimization utilities for tests and external consumers
export {
  INTERIOR_MODEL_URL,
  ORIGINAL_INTERIOR_MODEL_URL,
  applyInteriorMaterials,
  applyOptimizationPass,
  buildMergedScene,
  buildInstancedScene,
  getTableProxyGeometry,
};

export interface TableInteractionProxiesProps {
  selectedTableNumber?: number | null;
  hoveredTable?: Floor3DTable | null;
  setHoveredTable?: (table: Floor3DTable | null) => void;
  onSelectTable?: (table: Floor3DTable) => void;
  availableTableNumbers?: number[];
  guests?: number;
}

/**
 * Dedicated Low-Poly Table Interaction Proxies:
 * Renders 28 simple invisible cylinder colliders over the 28 tables.
 * Raycasting is performed ONLY against these 28 proxies rather than 4,561
 * intricate decorative meshes, completely eliminating pointermove frame drops.
 */
export function TableInteractionProxies({
  selectedTableNumber,
  hoveredTable,
  setHoveredTable,
  onSelectTable,
  availableTableNumbers,
  guests = 2,
}: TableInteractionProxiesProps) {
  // Ensure cursor is cleanly reset on unmount even if pointer was hovering a table
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'auto';
      }
    };
  }, []);

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>, table: Floor3DTable) => {
      e.stopPropagation();
      setHoveredTable?.(table);
      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'pointer';
      }
    },
    [setHoveredTable]
  );

  const handlePointerOut = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHoveredTable?.(null);
      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'auto';
      }
    },
    [setHoveredTable]
  );

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>, table: Floor3DTable) => {
      e.stopPropagation();
      onSelectTable?.(table);
    },
    [onSelectTable]
  );

  return (
    <group name="TableInteractionProxies">
      {RESTAURANT_3D_TABLES.map((t) => {
        const { radius, height, position } = getTableProxyGeometry(t);

        return (
          <mesh
            key={`table-proxy-${t.id}`}
            position={position}
            onPointerOver={(e) => handlePointerOver(e, t)}
            onPointerOut={handlePointerOut}
            onClick={(e) => handleClick(e, t)}
            name={`Proxy_${t.blenderNodeName}`}
          >
            <cylinderGeometry args={[radius, radius, height, 16]} />
            <meshBasicMaterial
              transparent
              opacity={0}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export interface OptimizedInteriorModelProps {
  selectedTableNumber?: number | null;
  hoveredTable?: Floor3DTable | null;
  setHoveredTable?: (table: Floor3DTable | null) => void;
  onSelectTable?: (table: Floor3DTable) => void;
  availableTableNumbers?: number[];
  guests?: number;
  modelUrl?: string;
  batchMode?: 'merge' | 'instance' | 'freeze';
  enableProxies?: boolean;
  simplifyTransmission?: boolean;
  shadowsEnabled?: boolean;
}

/**
 * OptimizedInteriorModel:
 * High-performance restaurant interior model renderer.
 * Loads GLB, preserves LookDev visual styling, disables raycast on background meshes,
 * freezes matrices, and batches geometries to reduce draw calls from 4,589 to 64.
 */
export function OptimizedInteriorModel({
  selectedTableNumber = null,
  hoveredTable = null,
  setHoveredTable,
  onSelectTable,
  availableTableNumbers,
  guests = 2,
  modelUrl = INTERIOR_MODEL_URL,
  batchMode = 'merge',
  enableProxies = true,
  simplifyTransmission = false,
  shadowsEnabled = true,
}: OptimizedInteriorModelProps) {
  const { scene } = useGLTF(modelUrl, '/draco/');

  const optimizedObject = useMemo(() => {
    // 1. Apply master architectural PBR tuning
    applyInteriorMaterials(scene, simplifyTransmission, shadowsEnabled);

    // 2. Batch according to selected mode
    if (batchMode === 'merge') {
      return buildMergedScene(scene);
    } else if (batchMode === 'instance') {
      return buildInstancedScene(scene);
    } else {
      // Freeze mode: keep original hierarchy, freeze matrices, disable raycasting
      applyOptimizationPass(scene);
      return scene;
    }
  }, [scene, batchMode, simplifyTransmission, shadowsEnabled]);

  return (
    <group name="OptimizedInteriorModel_Root">
      {/* dispose={null} protects the shared GLTF buffer geometries from premature garbage disposal */}
      <primitive
        object={optimizedObject}
        dispose={null}
        raycast={() => null}
      />

      {enableProxies && (
        <TableInteractionProxies
          selectedTableNumber={selectedTableNumber}
          hoveredTable={hoveredTable}
          setHoveredTable={setHoveredTable}
          onSelectTable={onSelectTable}
          availableTableNumbers={availableTableNumbers}
          guests={guests}
        />
      )}
    </group>
  );
}

// Backward-compatible alias
export const RestaurantModel = OptimizedInteriorModel;
