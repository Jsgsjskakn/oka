/**
 * High-performance, isolated, in-memory cache engine for menu data.
 * - 60s TTL with concurrent in-flight request deduplication
 * - Defensive cloning prevents mutation leaks
 * - Stale-while-error fallback
 * - Bounded memory structure (max 100 keys)
 * - Monotonic generation counters with scoped selective invalidation
 * - Single source of truth for menu caching in The Golden Oak
 */

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

export const DEFAULT_MENU_CACHE_TTL_MS = 60 * 1000; // 60 seconds
export const MAX_CACHE_ENTRIES = 100;

// Internal cache state
const MENU_CACHE = new Map<string, CacheEntry<any>>();
const IN_FLIGHT_REQUESTS = new Map<string, Promise<any>>();
const KEY_GENERATIONS = new Map<string, number>();
let GLOBAL_GENERATION = 0;

// Time provider for deterministic testing (defaults to Date.now)
let timeProvider: () => number = () => Date.now();

export function setTimeProvider(fn: () => number): void {
  timeProvider = fn;
}

export function resetTimeProvider(): void {
  timeProvider = () => Date.now();
}

export function resetMenuCacheState(): void {
  GLOBAL_GENERATION = 0;
  KEY_GENERATIONS.clear();
  MENU_CACHE.clear();
  IN_FLIGHT_REQUESTS.clear();
  resetTimeProvider();
}

export function invalidateMenuCache(keyPattern?: string): void {
  if (!keyPattern) {
    GLOBAL_GENERATION++;
    KEY_GENERATIONS.clear();
    MENU_CACHE.clear();
    IN_FLIGHT_REQUESTS.clear();
    return;
  }

  // Selective invalidation: target only matching keys without incrementing GLOBAL_GENERATION
  for (const key of Array.from(MENU_CACHE.keys())) {
    if (key.includes(keyPattern)) {
      MENU_CACHE.delete(key);
      const currentGen = KEY_GENERATIONS.get(key) || 0;
      KEY_GENERATIONS.set(key, currentGen + 1);
    }
  }

  for (const key of Array.from(IN_FLIGHT_REQUESTS.keys())) {
    if (key.includes(keyPattern)) {
      IN_FLIGHT_REQUESTS.delete(key);
      const currentGen = KEY_GENERATIONS.get(key) || 0;
      KEY_GENERATIONS.set(key, currentGen + 1);
    }
  }

  // Enforce memory bounds on KEY_GENERATIONS map
  if (KEY_GENERATIONS.size > MAX_CACHE_ENTRIES * 2) {
    const oldestKey = KEY_GENERATIONS.keys().next().value;
    if (oldestKey) KEY_GENERATIONS.delete(oldestKey);
  }
}

export function getMenuCacheStats(): {
  size: number;
  inFlight: number;
  generation: number;
  keys: string[];
} {
  return {
    size: MENU_CACHE.size,
    inFlight: IN_FLIGHT_REQUESTS.size,
    generation: GLOBAL_GENERATION,
    keys: Array.from(MENU_CACHE.keys()),
  };
}

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = DEFAULT_MENU_CACHE_TTL_MS
): Promise<T> {
  const now = timeProvider();
  const cached = MENU_CACHE.get(key);

  // Return fresh cache hit immediately (defensively cloned to prevent external mutation)
  if (cached && now - cached.cachedAt < cached.ttlMs) {
    if (Array.isArray(cached.data)) return [...cached.data] as unknown as T;
    if (typeof cached.data === 'object' && cached.data !== null) return { ...cached.data };
    return cached.data;
  }

  // Deduplicate concurrent in-flight requests for the same key
  if (IN_FLIGHT_REQUESTS.has(key)) {
    const inFlightResult = await IN_FLIGHT_REQUESTS.get(key);
    if (Array.isArray(inFlightResult)) return [...inFlightResult] as unknown as T;
    if (typeof inFlightResult === 'object' && inFlightResult !== null) return { ...inFlightResult };
    return inFlightResult;
  }

  const reqGlobalGen = GLOBAL_GENERATION;
  const reqKeyGen = KEY_GENERATIONS.get(key) || 0;

  let fetchPromise: Promise<T> = null as any;
  fetchPromise = (async () => {
    try {
      const freshData = await fetcher();
      if (freshData !== undefined && freshData !== null) {
        // Enforce maximum cache bounds
        if (MENU_CACHE.size >= MAX_CACHE_ENTRIES) {
          const oldestKey = MENU_CACHE.keys().next().value;
          if (oldestKey) {
            MENU_CACHE.delete(oldestKey);
            KEY_GENERATIONS.delete(oldestKey);
          }
        }
        // Guard against stale write-back:
        // Cache is only updated if neither global invalidation nor key-specific invalidation occurred during fetch
        const currentKeyGen = KEY_GENERATIONS.get(key) || 0;
        if (reqGlobalGen === GLOBAL_GENERATION && reqKeyGen === currentKeyGen) {
          MENU_CACHE.set(key, {
            data: freshData,
            cachedAt: timeProvider(),
            ttlMs,
          });
        }
      }
      return freshData;
    } catch (err) {
      // If fresh fetch fails but stale data exists, serve stale data gracefully
      if (cached && cached.data) {
        console.warn(`[menu.service] Background revalidation failed for ${key}, serving stale cache:`, err);
        return cached.data;
      }
      throw err;
    } finally {
      // Identity check prevents an older request from removing a newer in-flight request
      if (IN_FLIGHT_REQUESTS.get(key) === fetchPromise) {
        IN_FLIGHT_REQUESTS.delete(key);
      }
    }
  })();

  IN_FLIGHT_REQUESTS.set(key, fetchPromise);
  const result = await fetchPromise;
  if (Array.isArray(result)) return [...result] as unknown as T;
  if (typeof result === 'object' && result !== null) return { ...result };
  return result;
}
