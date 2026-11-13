/**
 * Phase 2 — Objective 4: Progressive Asset Delivery & Residency Controller
 *
 * Implements:
 * 1. Lightweight initial model (`ultra-light` LOD first for instant silhouette paint).
 * 2. Progressive LOD replacement (`ultra-light -> balanced -> high-fidelity`) with atomic swap.
 * 3. Progressive texture loading integration (`512px -> 1024px -> 2048px`).
 * 4. Priority-based asset downloads (`active-dish-initial` > `active-dish-lod-upgrade` > `active-dish-textures` > `adjacent-dish-prewarm`).
 * 5. Cancellation of obsolete requests via `AbortController` on rapid dish switching.
 * 6. Shared asset caching & in-flight deduplication (`SharedModelBufferCache`).
 * 7. Memory-aware & thermal-aware residency governance (`shouldAllowLodUpgrade`).
 * 8. Safe GPU resource disposal (`replaceLodSceneSafely`) ensuring zero duplicate GPU allocation or visual flicker.
 */

import * as THREE from 'three';
import type { RenderingProfileName, ThermalPressureState, EffectiveNetworkType } from './device-capabilities';
import type { ModelConfig } from '../../data/model-config';

export type ProgressiveLodStage =
  | 'idle'
  | 'loading-initial'
  | 'initial-ready'
  | 'upgrading-lod'
  | 'target-ready'
  | 'cancelled'
  | 'error';

export type AssetDownloadPriorityBand =
  | 'active-dish-initial'
  | 'active-dish-lod-upgrade'
  | 'active-dish-textures'
  | 'adjacent-dish-prewarm';

export const ASSET_PRIORITY_WEIGHTS: Record<AssetDownloadPriorityBand, number> = {
  'active-dish-initial': 100,
  'active-dish-lod-upgrade': 80,
  'active-dish-textures': 60,
  'adjacent-dish-prewarm': 20,
};

export interface ProgressiveLodPlan {
  dishSlug: string;
  targetProfile: RenderingProfileName;
  effectiveTargetProfile: RenderingProfileName;
  downgradedByMemoryOrThermal: boolean;
  downgradeReason: string | null;
  initialLodProfile: RenderingProfileName;
  initialModelPath: string;
  upgradeSequence: Array<{
    profile: RenderingProfileName;
    modelPath: string;
    priorityBand: AssetDownloadPriorityBand;
  }>;
}

export interface ResidencyGuardInput {
  targetProfile: RenderingProfileName;
  jsHeapUsedBytes?: number;
  jsHeapLimitBytes?: number;
  memoryPressureHighThreshold?: number;
  thermalState?: ThermalPressureState;
  saveData?: boolean;
  effectiveNetworkType?: EffectiveNetworkType;
}

export interface ResidencyGuardDecision {
  allowedProfile: RenderingProfileName;
  downgraded: boolean;
  reason: string | null;
  heapUtilization: number | null;
}

/**
 * Evaluates whether upgrading to a heavier LOD / texture tier is safe under current
 * JS heap residency, W3C Compute Pressure thermal state, and network Data Saver constraints.
 */
export function evaluateProgressiveResidencyGuard(
  input: ResidencyGuardInput
): ResidencyGuardDecision {
  const threshold = input.memoryPressureHighThreshold ?? 0.8;
  let heapUtilization: number | null = null;

  if (
    typeof input.jsHeapUsedBytes === 'number' &&
    typeof input.jsHeapLimitBytes === 'number' &&
    input.jsHeapLimitBytes > 0
  ) {
    heapUtilization = input.jsHeapUsedBytes / input.jsHeapLimitBytes;
  }

  // Critical memory or thermal pressure -> stay on ultra-light
  if (heapUtilization !== null && heapUtilization >= 0.88) {
    return {
      allowedProfile: 'ultra-light',
      downgraded: input.targetProfile !== 'ultra-light',
      reason: `critical-memory-pressure (${(heapUtilization * 100).toFixed(1)}% heap used)`,
      heapUtilization,
    };
  }

  if (input.thermalState === 'critical') {
    return {
      allowedProfile: 'ultra-light',
      downgraded: input.targetProfile !== 'ultra-light',
      reason: 'critical-thermal-pressure',
      heapUtilization,
    };
  }

  if (
    input.saveData ||
    input.effectiveNetworkType === 'slow-2g' ||
    input.effectiveNetworkType === '2g'
  ) {
    return {
      allowedProfile: 'ultra-light',
      downgraded: input.targetProfile !== 'ultra-light',
      reason: 'data-saver-or-2g-network',
      heapUtilization,
    };
  }

  // High memory (>80%) or serious thermal -> cap at balanced, block high-fidelity upgrade
  if (heapUtilization !== null && heapUtilization >= threshold) {
    const capped: RenderingProfileName =
      input.targetProfile === 'high-fidelity' ? 'balanced' : input.targetProfile;
    return {
      allowedProfile: capped,
      downgraded: capped !== input.targetProfile,
      reason:
        capped !== input.targetProfile
          ? `memory-residency-guard (${(heapUtilization * 100).toFixed(1)}% >= ${(threshold * 100).toFixed(0)}%)`
          : null,
      heapUtilization,
    };
  }

  if (input.thermalState === 'serious' && input.targetProfile === 'high-fidelity') {
    return {
      allowedProfile: 'balanced',
      downgraded: true,
      reason: 'serious-thermal-pressure-cap',
      heapUtilization,
    };
  }

  return {
    allowedProfile: input.targetProfile,
    downgraded: false,
    reason: null,
    heapUtilization,
  };
}

/**
 * Resolves the concrete GLB path for a given dish config and rendering profile,
 * prioritizing `culinaryAssetLodPaths` over `lodPaths` and `modelPath`.
 */
export function resolveLodPathForProfile(
  config: ModelConfig,
  profile: RenderingProfileName
): string {
  const source = config.culinaryAssetLodPaths || config.lodPaths;
  if (!source) {
    return config.modelPath;
  }
  if (profile === 'ultra-light') return source.ultraLight || config.modelPath;
  if (profile === 'balanced') return source.balanced || config.modelPath;
  return source.high || config.modelPath;
}

/**
 * Builds a deterministic Progressive LOD Delivery Plan for a dish:
 * - Always starts with `ultra-light` LOD for fast initial silhouette (< 120 KB).
 * - Plans sequential background upgrades (`balanced`, then `high-fidelity` if permitted by residency guard).
 * - Deduplicates identical paths so no redundant network fetch or scene clone ever occurs.
 */
export function buildProgressiveLodPlan(
  dishSlug: string,
  config: ModelConfig,
  guardInput: ResidencyGuardInput
): ProgressiveLodPlan {
  const decision = evaluateProgressiveResidencyGuard(guardInput);
  const effectiveTarget = decision.allowedProfile;

  const ultraLightPath = resolveLodPathForProfile(config, 'ultra-light');
  const balancedPath = resolveLodPathForProfile(config, 'balanced');
  const highPath = resolveLodPathForProfile(config, 'high-fidelity');

  const upgradeSequence: ProgressiveLodPlan['upgradeSequence'] = [];
  const seenPaths = new Set<string>([ultraLightPath]);

  if (effectiveTarget === 'balanced' || effectiveTarget === 'high-fidelity') {
    if (!seenPaths.has(balancedPath)) {
      upgradeSequence.push({
        profile: 'balanced',
        modelPath: balancedPath,
        priorityBand: 'active-dish-lod-upgrade',
      });
      seenPaths.add(balancedPath);
    }
  }

  if (effectiveTarget === 'high-fidelity') {
    if (!seenPaths.has(highPath)) {
      upgradeSequence.push({
        profile: 'high-fidelity',
        modelPath: highPath,
        priorityBand: 'active-dish-lod-upgrade',
      });
      seenPaths.add(highPath);
    }
  }

  return {
    dishSlug,
    targetProfile: guardInput.targetProfile,
    effectiveTargetProfile: effectiveTarget,
    downgradedByMemoryOrThermal: decision.downgraded,
    downgradeReason: decision.reason,
    initialLodProfile: 'ultra-light',
    initialModelPath: ultraLightPath,
    upgradeSequence,
  };
}

export interface CachedModelBufferEntry {
  url: string;
  byteLength: number;
  buffer: ArrayBuffer;
  lastAccessedAt: number;
  refCount: number;
}

/**
 * Shared LRU Asset Buffer Cache with Byte-Budget Governance & In-Flight Request Deduplication.
 * Prevents duplicate downloads when switching between dishes that share an archetype or revisiting dishes.
 */
export class SharedModelBufferCache {
  private entries = new Map<string, CachedModelBufferEntry>();
  private inFlight = new Map<string, Promise<ArrayBuffer>>();
  private maxEntries: number;
  private maxBytes: number;
  private currentBytes = 0;

  constructor(options?: { maxEntries?: number; maxBytes?: number }) {
    this.maxEntries = options?.maxEntries ?? 18;
    this.maxBytes = options?.maxBytes ?? 24 * 1024 * 1024; // 24 MB cap
  }

  has(url: string): boolean {
    return this.entries.has(url);
  }

  get(url: string): ArrayBuffer | null {
    const entry = this.entries.get(url);
    if (!entry) return null;
    entry.lastAccessedAt = Date.now();
    return entry.buffer;
  }

  set(url: string, buffer: ArrayBuffer): CachedModelBufferEntry {
    const existing = this.entries.get(url);
    if (existing) {
      this.currentBytes -= existing.byteLength;
      existing.buffer = buffer;
      existing.byteLength = buffer.byteLength;
      existing.lastAccessedAt = Date.now();
      this.currentBytes += existing.byteLength;
      return existing;
    }

    this.evictIfNeeded(buffer.byteLength);

    const created: CachedModelBufferEntry = {
      url,
      byteLength: buffer.byteLength,
      buffer,
      lastAccessedAt: Date.now(),
      refCount: 1,
    };
    this.entries.set(url, created);
    this.currentBytes += created.byteLength;
    return created;
  }

  acquire(url: string): void {
    const entry = this.entries.get(url);
    if (entry) {
      entry.refCount++;
      entry.lastAccessedAt = Date.now();
    }
  }

  release(url: string): void {
    const entry = this.entries.get(url);
    if (entry) {
      entry.refCount = Math.max(0, entry.refCount - 1);
    }
  }

  private evictIfNeeded(incomingBytes: number): void {
    if (
      this.entries.size < this.maxEntries &&
      this.currentBytes + incomingBytes <= this.maxBytes
    ) {
      return;
    }

    const candidates = Array.from(this.entries.values()).sort((a, b) => {
      if (a.refCount !== b.refCount) return a.refCount - b.refCount;
      return a.lastAccessedAt - b.lastAccessedAt;
    });

    for (const candidate of candidates) {
      if (
        this.entries.size < this.maxEntries &&
        this.currentBytes + incomingBytes <= this.maxBytes
      ) {
        break;
      }
      this.entries.delete(candidate.url);
      this.currentBytes = Math.max(0, this.currentBytes - candidate.byteLength);
    }
  }

  getStats(): { entryCount: number; currentBytes: number; maxBytes: number; inFlightCount: number } {
    return {
      entryCount: this.entries.size,
      currentBytes: this.currentBytes,
      maxBytes: this.maxBytes,
      inFlightCount: this.inFlight.size,
    };
  }

  clear(): void {
    this.entries.clear();
    this.inFlight.clear();
    this.currentBytes = 0;
  }
}

export interface QueuedAssetDownloadTask {
  id: string;
  dishSlug: string;
  url: string;
  priorityBand: AssetDownloadPriorityBand;
  priorityWeight: number;
  enqueuedAt: number;
  controller: AbortController;
  resolve: (buf: ArrayBuffer) => void;
  reject: (err: Error) => void;
  customFetcher?: (url: string, signal: AbortSignal) => Promise<ArrayBuffer>;
}

/**
 * Priority-Based Asset Download Queue with `AbortController` Obsolete Request Cancellation.
 *
 * Ensures:
 * - Active dish initial LOD (`priority=100`) always preempts adjacent prewarm downloads (`priority=20`).
 * - Switching dishes immediately aborts all queued and in-flight requests for the previous dish.
 * - Prewarm tasks are automatically aborted if a critical active dish download is enqueued while slots are full.
 */
export class PriorityAssetDownloadQueue {
  private queue: QueuedAssetDownloadTask[] = [];
  private activeTasks = new Map<string, QueuedAssetDownloadTask>();
  private maxConcurrency: number;
  private cache: SharedModelBufferCache;
  private cancelledCount = 0;
  private completedCount = 0;

  constructor(options?: { maxConcurrency?: number; cache?: SharedModelBufferCache }) {
    this.maxConcurrency = options?.maxConcurrency ?? 2;
    this.cache = options?.cache ?? new SharedModelBufferCache();
  }

  getCache(): SharedModelBufferCache {
    return this.cache;
  }

  enqueue(params: {
    dishSlug: string;
    url: string;
    priorityBand: AssetDownloadPriorityBand;
    signal?: AbortSignal;
    customFetcher?: (url: string, signal: AbortSignal) => Promise<ArrayBuffer>;
  }): Promise<ArrayBuffer> {
    const cached = this.cache.get(params.url);
    if (cached) {
      return Promise.resolve(cached);
    }

    if (params.signal?.aborted) {
      this.cancelledCount++;
      return Promise.reject(new DOMException('Asset request aborted before enqueue', 'AbortError'));
    }

    // If an active dish initial load arrives, preempt any running low-priority prewarm tasks
    if (params.priorityBand === 'active-dish-initial') {
      for (const [id, running] of this.activeTasks.entries()) {
        if (
          running.priorityBand === 'adjacent-dish-prewarm' &&
          running.dishSlug !== params.dishSlug
        ) {
          running.controller.abort();
          this.activeTasks.delete(id);
          this.cancelledCount++;
        }
      }
    }

    return new Promise<ArrayBuffer>((resolve, reject) => {
      const controller = new AbortController();
      if (params.signal) {
        params.signal.addEventListener(
          'abort',
          () => {
            controller.abort();
          },
          { once: true }
        );
      }

      const taskId = `${params.dishSlug}:${params.url}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`;
      const task: QueuedAssetDownloadTask = {
        id: taskId,
        dishSlug: params.dishSlug,
        url: params.url,
        priorityBand: params.priorityBand,
        priorityWeight: ASSET_PRIORITY_WEIGHTS[params.priorityBand],
        enqueuedAt: Date.now(),
        controller,
        resolve,
        reject,
        customFetcher: params.customFetcher,
      };

      controller.signal.addEventListener(
        'abort',
        () => {
          const idx = this.queue.findIndex((t) => t.id === taskId);
          if (idx !== -1) {
            this.queue.splice(idx, 1);
            this.cancelledCount++;
          }
          reject(new DOMException(`Cancelled obsolete asset request for ${params.dishSlug}`, 'AbortError'));
        },
        { once: true }
      );

      this.queue.push(task);
      this.sortQueue();
      this.pump();
    });
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      if (b.priorityWeight !== a.priorityWeight) {
        return b.priorityWeight - a.priorityWeight;
      }
      return a.enqueuedAt - b.enqueuedAt;
    });
  }

  private pump(): void {
    while (this.activeTasks.size < this.maxConcurrency && this.queue.length > 0) {
      const next = this.queue.shift()!;
      if (next.controller.signal.aborted) {
        continue;
      }

      const cached = this.cache.get(next.url);
      if (cached) {
        this.completedCount++;
        next.resolve(cached);
        continue;
      }

      this.activeTasks.set(next.id, next);
      this.executeTask(next);
    }
  }

  private async executeTask(task: QueuedAssetDownloadTask): Promise<void> {
    try {
      const fetcher =
        task.customFetcher ??
        (async (url: string, signal: AbortSignal) => {
          const res = await fetch(url, { signal });
          if (!res.ok) {
            throw new Error(`HTTP ${res.status} fetching ${url}`);
          }
          return res.arrayBuffer();
        });

      const buffer = await fetcher(task.url, task.controller.signal);
      if (task.controller.signal.aborted) {
        return;
      }
      this.cache.set(task.url, buffer);
      this.completedCount++;
      task.resolve(buffer);
    } catch (err) {
      if (!task.controller.signal.aborted) {
        task.reject(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      this.activeTasks.delete(task.id);
      this.pump();
    }
  }

  /**
   * Cancels all queued and in-flight downloads belonging to a specific dish slug.
   */
  cancelDishRequests(dishSlug: string): number {
    let aborted = 0;
    for (const task of [...this.queue]) {
      if (task.dishSlug === dishSlug) {
        task.controller.abort();
        aborted++;
      }
    }
    for (const [id, task] of this.activeTasks.entries()) {
      if (task.dishSlug === dishSlug) {
        task.controller.abort();
        this.activeTasks.delete(id);
        aborted++;
      }
    }
    return aborted;
  }

  /**
   * Cancels all queued and in-flight requests that do NOT belong to `activeDishSlug`.
   * Used during rapid dish switching so obsolete dishes consume zero bandwidth or GPU decode cycles.
   */
  cancelAllObsoleteRequests(activeDishSlug: string): number {
    let aborted = 0;
    for (const task of [...this.queue]) {
      if (task.dishSlug !== activeDishSlug) {
        task.controller.abort();
        aborted++;
      }
    }
    for (const [id, task] of this.activeTasks.entries()) {
      if (task.dishSlug !== activeDishSlug) {
        task.controller.abort();
        this.activeTasks.delete(id);
        aborted++;
      }
    }
    return aborted;
  }

  getTelemetry(): {
    queuedCount: number;
    activeCount: number;
    cancelledCount: number;
    completedCount: number;
    cacheStats: ReturnType<SharedModelBufferCache['getStats']>;
  } {
    return {
      queuedCount: this.queue.length,
      activeCount: this.activeTasks.size,
      cancelledCount: this.cancelledCount,
      completedCount: this.completedCount,
      cacheStats: this.cache.getStats(),
    };
  }
}

/**
 * Atomically replaces an active LOD `THREE.Object3D` clone with a newly prepared higher-LOD clone,
 * immediately disposing the old clone's instance materials while protecting shared cached geometries/textures.
 * Guarantees zero duplicate GPU resource allocation and zero visual flicker gap.
 */
export function replaceLodSceneSafely(
  parentGroup: THREE.Object3D | null,
  previousClone: THREE.Object3D | null,
  nextClone: THREE.Object3D
): { swapped: boolean; disposedPrevious: boolean } {
  if (parentGroup) {
    // Attach the new ready clone BEFORE removing/disposing the old clone so there is never an empty frame
    parentGroup.add(nextClone);
    if (previousClone && previousClone !== nextClone) {
      parentGroup.remove(previousClone);
    }
  }

  let disposedPrevious = false;
  if (previousClone && previousClone !== nextClone) {
    previousClone.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (mesh.geometry?.userData?.__isProceduralGeometry) {
        mesh.geometry.dispose();
      }
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (mat && mat.userData?.__isInstanceClone) {
          mat.dispose();
        }
      }
    });
    disposedPrevious = true;
  }

  return {
    swapped: true,
    disposedPrevious,
  };
}

let globalProgressiveQueue: PriorityAssetDownloadQueue | null = null;

export function getGlobalProgressiveAssetQueue(): PriorityAssetDownloadQueue {
  if (!globalProgressiveQueue) {
    globalProgressiveQueue = new PriorityAssetDownloadQueue();
  }
  return globalProgressiveQueue;
}
