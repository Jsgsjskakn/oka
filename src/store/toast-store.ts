'use client';

import { create } from 'zustand';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const MAX_TOASTS = 5;
export const DEFAULT_TOAST_DURATION_MS = 3500;
const MAX_TOAST_TEXT_LENGTH = 400;
const MAX_TOAST_DURATION_MS = 60_000;
const VALID_TOAST_TYPES = new Set<ToastType>(['success', 'info', 'warning', 'error']);

// Track active auto-dismiss timers outside Zustand state to prevent timer leaks
// when toasts are manually dismissed, deduped, evicted, or cleared.
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();
let toastCounter = 0;

function createToastId(): string {
  toastCounter += 1;
  if (typeof globalThis !== 'undefined' && typeof globalThis.crypto?.randomUUID === 'function') {
    return `toast-${toastCounter}-${globalThis.crypto.randomUUID()}`;
  }
  return `toast-${toastCounter}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeToastText(value: unknown): string {
  if (value === null || value === undefined) return '';
  const raw = typeof value === 'string' ? value : String(value);
  const cleaned = raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > MAX_TOAST_TEXT_LENGTH
    ? `${cleaned.slice(0, MAX_TOAST_TEXT_LENGTH - 1)}…`
    : cleaned;
}

function normalizeToastType(type: unknown): ToastType {
  if (typeof type === 'string' && VALID_TOAST_TYPES.has(type as ToastType)) {
    return type as ToastType;
  }
  return type ? 'info' : 'success';
}

function normalizeToastDuration(duration: unknown): number {
  if (duration === Number.POSITIVE_INFINITY) {
    return Number.POSITIVE_INFINITY;
  }
  if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) {
    return Math.max(1, Math.min(duration, MAX_TOAST_DURATION_MS));
  }
  return DEFAULT_TOAST_DURATION_MS;
}

function clearToastTimer(id: string): void {
  const existing = toastTimers.get(id);
  if (existing !== undefined) {
    clearTimeout(existing);
    toastTimers.delete(id);
  }
}

function scheduleToastTimer(
  id: string,
  durationMs: number,
  onExpire: (toastId: string) => void
): void {
  clearToastTimer(id);
  if (!Number.isFinite(durationMs)) return;
  const timer = setTimeout(() => {
    toastTimers.delete(id);
    onExpire(id);
  }, durationMs);
  toastTimers.set(id, timer);
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const safeTitle = sanitizeToastText(toast?.title);
    const safeDescription = sanitizeToastText(toast?.description);
    if (!safeTitle && !safeDescription) {
      return '';
    }

    const title = safeTitle || 'Notification';
    const description = safeDescription || undefined;
    const type = normalizeToastType(toast?.type);
    const duration = normalizeToastDuration(toast?.duration);

    const existing = get().toasts.find(
      (t) =>
        t.title === title &&
        (t.description ?? '') === (description ?? '') &&
        normalizeToastType(t.type) === type
    );

    if (existing) {
      set((state) => ({
        toasts: [
          ...state.toasts.filter((t) => t.id !== existing.id),
          { ...existing, title, description, type, duration },
        ],
      }));
      scheduleToastTimer(existing.id, duration, get().removeToast);
      return existing.id;
    }

    const id = createToastId();
    const evictedIds: string[] = [];

    set((state) => {
      const next = [...state.toasts, { id, title, description, type, duration }];
      if (next.length > MAX_TOASTS) {
        const excess = next.length - MAX_TOASTS;
        for (const evicted of next.slice(0, excess)) {
          evictedIds.push(evicted.id);
        }
        return { toasts: next.slice(excess) };
      }
      return { toasts: next };
    });

    for (const evictedId of evictedIds) {
      clearToastTimer(evictedId);
    }

    scheduleToastTimer(id, duration, get().removeToast);
    return id;
  },

  removeToast: (id) => {
    clearToastTimer(id);
    set((state) => {
      const filtered = state.toasts.filter((t) => t.id !== id);
      if (filtered.length === state.toasts.length) {
        return state;
      }
      return { toasts: filtered };
    });
  },

  clearToasts: () => {
    for (const id of Array.from(toastTimers.keys())) {
      clearToastTimer(id);
    }
    set((state) => (state.toasts.length === 0 ? state : { toasts: [] }));
  },
}));

export const toast = {
  success: (title: string, description?: string, duration?: number) =>
    useToastStore.getState().addToast({ title, description, type: 'success', duration }),
  info: (title: string, description?: string, duration?: number) =>
    useToastStore.getState().addToast({ title, description, type: 'info', duration }),
  warning: (title: string, description?: string, duration?: number) =>
    useToastStore.getState().addToast({ title, description, type: 'warning', duration }),
  error: (title: string, description?: string, duration?: number) =>
    useToastStore.getState().addToast({ title, description, type: 'error', duration }),
};
