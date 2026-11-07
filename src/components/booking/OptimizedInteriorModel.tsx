'use client';

import React, { useMemo, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent, useThree } from '@react-three/fiber';
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
 * Renders 28 simple invisible cylinder colliders over the 28 tables sharing
 * a single unit CylinderGeometry + MeshBasicMaterial (disposed cleanly on unmount).
 * Raycasting is performed ONLY against these 28 proxies rather than 4,561
 * intricate decorative meshes, completely eliminating pointermove frame drops.
 */
export function TableInteractionProxies({
  setHoveredTable,
  onSelectTable,
}: TableInteractionProxiesProps) {
  const proxyResources = useMemo(() => {
    const proxyCylinderBuffer = new THREE.CylinderGeometry(1, 1, 1, 16);
    const proxyColliderMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    return { proxyCylinderBuffer, proxyColliderMat };
  }, []);

  // Ensure cursor is cleanly reset and shared proxy GPU buffers are disposed on unmount
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'auto';
      }
      proxyResources.proxyCylinderBuffer.dispose();
      proxyResources.proxyColliderMat.dispose();
    };
  }, [proxyResources]);

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
            scale={[radius, height, radius]}
            geometry={proxyResources.proxyCylinderBuffer}
            material={proxyResources.proxyColliderMat}
            onPointerOver={(e) => handlePointerOver(e, t)}
            onPointerOut={handlePointerOut}
            onClick={(e) => handleClick(e, t)}
            name={`Proxy_${t.blenderNodeName}`}
          />
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
 * Loads GLB on mount only (never preloaded eagerly on 2D views), preserves LookDev visual styling,
 * disables raycast on background meshes, freezes matrices, batches geometries to reduce draw calls
 * from 4,561 to 64, and disposes derived merged/instanced GPU buffers on unmount without poisoning
 * the shared useGLTF cache.
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
  const gl = useThree((state) => state.gl);

  const { optimizedObject, cachedBuffers, cachedMaterials } = useMemo(() => {
    const origBuffers = new Set<THREE.BufferGeometry>();
    const origMaterials = new Set<THREE.Material>();

    scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        if (mesh.geometry) origBuffers.add(mesh.geometry);
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          if (m) origMaterials.add(m);
        }
      }
    });

    // 1. Apply master architectural PBR tuning
    applyInteriorMaterials(scene, simplifyTransmission, shadowsEnabled);

    // 2. Batch according to selected mode
    let built: THREE.Group;
    if (batchMode === 'merge') {
      built = buildMergedScene(scene);
    } else if (batchMode === 'instance') {
      built = buildInstancedScene(scene);
    } else {
      // Freeze mode: keep original hierarchy, freeze matrices, disable raycasting
      applyOptimizationPass(scene);
      built = scene;
    }

    return {
      optimizedObject: built,
      cachedBuffers: origBuffers,
      cachedMaterials: origMaterials,
    };
  }, [scene, batchMode, simplifyTransmission, shadowsEnabled]);

  // Dispose derived merged/instanced GPU buffers & non-cached materials on unmount without touching cached glTF buffers
  useEffect(() => {
    return () => {
      if (optimizedObject === scene) return;
      optimizedObject.traverse((node) => {
        if ((node as THREE.InstancedMesh).isInstancedMesh) {
          (node as THREE.InstancedMesh).dispose();
        }
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          const meshBuffer = mesh.geometry;
          if (meshBuffer && !cachedBuffers.has(meshBuffer)) {
            meshBuffer.dispose();
          }
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of mats) {
            if (mat && !cachedMaterials.has(mat)) {
              mat.dispose();
            }
          }
        }
      });
    };
  }, [optimizedObject, scene, cachedBuffers, cachedMaterials]);

  // Record WebGL gl.info & batching metrics into window.__GOLDEN_OAK_3D_TELEMETRY__.Restaurant3DFloorplan
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as Window & { __GOLDEN_OAK_3D_TELEMETRY__?: Record<string, unknown> };
    win.__GOLDEN_OAK_3D_TELEMETRY__ = win.__GOLDEN_OAK_3D_TELEMETRY__ || {};
    const prev = (win.__GOLDEN_OAK_3D_TELEMETRY__.Restaurant3DFloorplan as Record<string, unknown>) || {};
    win.__GOLDEN_OAK_3D_TELEMETRY__.Restaurant3DFloorplan = {
      ...prev,
      component: 'Restaurant3DFloorplan',
      modelUrl,
      batchMode,
      batchedMeshCount: optimizedObject.children.length,
      calls: gl?.info?.render?.calls ?? prev.calls ?? 0,
      triangles: gl?.info?.render?.triangles ?? prev.triangles ?? 0,
      lines: gl?.info?.render?.lines ?? prev.lines ?? 0,
      points: gl?.info?.render?.points ?? prev.points ?? 0,
      geometries: gl?.info?.memory?.geometries ?? prev.geometries ?? 0,
      textures: gl?.info?.memory?.textures ?? prev.textures ?? 0,
      programs: gl?.info?.programs?.length ?? prev.programs ?? 0,
      updatedAt: Date.now(),
    };
  }, [gl, modelUrl, batchMode, optimizedObject]);

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
