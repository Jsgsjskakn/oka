/**
 * THE GOLDEN OAK — PHASE 5 SHARED PERFORMANCE TELEMETRY (Lead Orchestrator owned)
 *
 * One telemetry vocabulary for AR, 3D viewer, VR and the 3D booking scene so that
 * network, decode, GPU upload and tracking time are measured SEPARATELY and the QA agent
 * can read them from `window.__GOLDEN_OAK_PERF__` in real browsers (Chromium automation,
 * Chrome remote debugging on Android, Safari Web Inspector on iOS).
 *
 * Dependency-free; safe in SSR and in `node --test`.
 */

export type PerfMarkName =
  // AR startup pipeline (Phase 5 §2 Agent 1 C)
  | 'ar:requested'
  | 'ar:support-checked'
  | 'ar:session-started'
  | 'ar:first-xr-frame'
  | 'ar:first-surface-hit'
  | 'ar:model-ready'
  | 'ar:model-visible'
  | 'ar:first-placement'
  | 'ar:tracking-lost'
  | 'ar:tracking-restored'
  | 'ar:session-ended'
  | 'ar:session-failed'
  // Model pipeline (shared by AR / viewer / VR)
  | 'model:fetch-start'
  | 'model:fetch-end'
  | 'model:decode-end'
  | 'model:gpu-upload-end'
  | 'model:first-visible'
  | 'model:full-quality'
  | 'model:cache-hit'
  // VR
  | 'vr:requested'
  | 'vr:session-started'
  | 'vr:first-frame'
  | 'vr:session-ended'
  // 3D booking scene
  | 'booking3d:mount'
  | 'booking3d:layout-visible'
  | 'booking3d:interactive'
  | 'booking3d:decor-loaded';

export interface PerfMark {
  name: PerfMarkName;
  t: number;
  detail?: Record<string, string | number | boolean | null>;
}

export interface PerfStore {
  marks: PerfMark[];
  counters: Record<string, number>;
}

const MAX_MARKS = 500;

function now(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function getStore(): PerfStore {
  const g = globalThis as unknown as { __GOLDEN_OAK_PERF__?: PerfStore };
  if (!g.__GOLDEN_OAK_PERF__) {
    g.__GOLDEN_OAK_PERF__ = { marks: [], counters: {} };
  }
  return g.__GOLDEN_OAK_PERF__;
}

export function perfMark(name: PerfMarkName, detail?: PerfMark['detail']): number {
  const t = now();
  const store = getStore();
  store.marks.push({ name, t, detail });
  if (store.marks.length > MAX_MARKS) store.marks.splice(0, store.marks.length - MAX_MARKS);
  try {
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark(`golden-oak:${name}`);
    }
  } catch {
    // performance.mark can throw in some sandboxed contexts; telemetry must never break UX.
  }
  return t;
}

export function perfCount(counter: string, delta = 1): number {
  const store = getStore();
  store.counters[counter] = (store.counters[counter] ?? 0) + delta;
  return store.counters[counter];
}

/** Duration between the LAST occurrence of `from` and the LAST occurrence of `to` (ms), or null. */
export function perfDuration(from: PerfMarkName, to: PerfMarkName): number | null {
  const marks = getStore().marks;
  let a: number | null = null;
  let b: number | null = null;
  for (let i = marks.length - 1; i >= 0 && (a === null || b === null); i -= 1) {
    if (b === null && marks[i].name === to) b = marks[i].t;
    if (a === null && marks[i].name === from) a = marks[i].t;
  }
  return a !== null && b !== null && b >= a ? b - a : null;
}

export function perfSnapshot(): PerfStore {
  const store = getStore();
  return { marks: store.marks.slice(), counters: { ...store.counters } };
}

export function perfReset(): void {
  const store = getStore();
  store.marks.length = 0;
  for (const k of Object.keys(store.counters)) delete store.counters[k];
}
