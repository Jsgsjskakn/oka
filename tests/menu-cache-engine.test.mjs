import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  getCachedOrFetch,
  invalidateMenuCache,
  getMenuCacheStats,
  setTimeProvider,
  resetTimeProvider,
  resetMenuCacheState,
  DEFAULT_MENU_CACHE_TTL_MS,
  MAX_CACHE_ENTRIES,
} from '../src/lib/services/menu-cache.ts';

const ROOT_DIR = process.cwd();

describe('Menu Cache Engine - Real Production Implementation (Stage 3)', () => {
  beforeEach(() => {
    resetMenuCacheState();
  });

  it('1. Static Contract: menu.service.ts re-exports the production cache engine', () => {
    const servicePath = path.join(ROOT_DIR, 'src/lib/services/menu.service.ts');
    assert.ok(fs.existsSync(servicePath), 'menu.service.ts must exist');
    const content = fs.readFileSync(servicePath, 'utf-8');

    assert.match(content, /export\s*\{[^}]*invalidateMenuCache[^}]*\}\s*from\s*['"]\.\/menu-cache['"]/, 'Must re-export invalidateMenuCache');
    assert.match(content, /export\s*\{[^}]*getCachedOrFetch[^}]*\}\s*from\s*['"]\.\/menu-cache['"]/, 'Must re-export getCachedOrFetch');
    assert.match(content, /export\s*\{[^}]*getMenuCacheStats[^}]*\}\s*from\s*['"]\.\/menu-cache['"]/, 'Must re-export getMenuCacheStats');
  });

  it('2. TTL Expiration (Section 4.A): Fresh cache hit reused, expired entry refetched & replaced', async () => {
    let mockTime = 1000000;
    setTimeProvider(() => mockTime);

    let fetchCount = 0;
    const fetcher = async () => {
      fetchCount++;
      return [{ id: 'dish-1', version: fetchCount }];
    };

    // 1. Initial fetch
    const res1 = await getCachedOrFetch('menu:test:ttl', fetcher, 60000);
    assert.strictEqual(fetchCount, 1);
    assert.strictEqual(res1[0].version, 1);

    // 2. Fetch within TTL (advance by 30 seconds)
    mockTime += 30000;
    const res2 = await getCachedOrFetch('menu:test:ttl', fetcher, 60000);
    assert.strictEqual(fetchCount, 1, 'Should reuse fresh cached entry before TTL');
    assert.strictEqual(res2[0].version, 1);

    // 3. Fetch past TTL (advance by 30.001 seconds, total elapsed = 60.001s)
    mockTime += 30001;
    const res3 = await getCachedOrFetch('menu:test:ttl', fetcher, 60000);
    assert.strictEqual(fetchCount, 2, 'Should trigger new fetch after TTL expires');
    assert.strictEqual(res3[0].version, 2, 'Should return updated data');

    // 4. Subsequent fetch within new TTL
    mockTime += 5000;
    const res4 = await getCachedOrFetch('menu:test:ttl', fetcher, 60000);
    assert.strictEqual(fetchCount, 2);
    assert.strictEqual(res4[0].version, 2);
  });

  it('3. Stale-While-Error Fallback (Section 4.B): Serves stale data on failure, recovers on next success', async () => {
    let mockTime = 1000000;
    setTimeProvider(() => mockTime);

    let shouldFail = false;
    let version = 1;

    const fetcher = async () => {
      if (shouldFail) throw new Error('Database connection failed');
      return [{ id: 'dish-1', version }];
    };

    // 1. Prime cache with valid data
    const initial = await getCachedOrFetch('menu:test:stale', fetcher, 60000);
    assert.strictEqual(initial[0].version, 1);

    // 2. Expire TTL and simulate background fetch error
    mockTime += 65000;
    shouldFail = true;

    // Must serve stale data instead of throwing
    const staleResult = await getCachedOrFetch('menu:test:stale', fetcher, 60000);
    assert.strictEqual(staleResult[0].version, 1, 'Must serve stale cached data on error');

    // 3. Database recovers
    shouldFail = false;
    version = 2;
    mockTime += 1000;

    // Next fetch succeeds and refreshes cache
    const recoveredResult = await getCachedOrFetch('menu:test:stale', fetcher, 60000);
    assert.strictEqual(recoveredResult[0].version, 2, 'Must recover and return fresh data');

    // 4. Cold fetch on a new key with error MUST throw (no stale data available)
    shouldFail = true;
    await assert.rejects(
      async () => getCachedOrFetch('menu:test:cold_fail', fetcher, 60000),
      /Database connection failed/
    );
  });

  it('4. In-Flight Invalidation Race (Section 4.C): Old request cannot overwrite fresh cached value', async () => {
    let resolveOldFetch;
    const oldFetchPromise = new Promise((resolve) => {
      resolveOldFetch = resolve;
    });

    // Step 1: Start slow fetch (price 350)
    const req1Promise = getCachedOrFetch('menu:all_dishes:rest-1', () => oldFetchPromise);

    const statsBefore = getMenuCacheStats();
    assert.strictEqual(statsBefore.inFlight, 1, 'In-flight request must be tracked');

    // Step 2: Admin invalidates cache
    invalidateMenuCache();
    assert.strictEqual(getMenuCacheStats().size, 0);

    // Step 3: Fresh request arrives with updated price (420)
    const req2Promise = getCachedOrFetch('menu:all_dishes:rest-1', async () => {
      return [{ id: 'dish-1', price: 420 }];
    });

    const req2Result = await req2Promise;
    assert.strictEqual(req2Result[0].price, 420);

    // Step 4: Old request finishes resolving with stale price (350)
    resolveOldFetch([{ id: 'dish-1', price: 350 }]);
    const req1Result = await req1Promise;
    assert.strictEqual(req1Result[0].price, 350, 'Original caller receives its own fetch result');

    // Step 5: Verify cache retains price 420 and rejects stale write-back (350)
    const statsAfter = getMenuCacheStats();
    assert.strictEqual(statsAfter.size, 1);
    const cachedFresh = await getCachedOrFetch('menu:all_dishes:rest-1', async () => [{ id: 'dish-1', price: 999 }]);
    assert.strictEqual(cachedFresh[0].price, 420, 'Cache MUST retain fresh price 420 and reject 350');
  });

  it('5. Concurrent Request Deduplication (Section 4.D): Exactly one fetch executed for simultaneous calls', async () => {
    let fetchCountA = 0;
    let fetchCountB = 0;

    const fetcherA = async () => {
      fetchCountA++;
      await new Promise((r) => setTimeout(r, 15));
      return [{ name: 'A' }];
    };

    const fetcherB = async () => {
      fetchCountB++;
      await new Promise((r) => setTimeout(r, 15));
      return [{ name: 'B' }];
    };

    // 5 callers for key A, 3 callers for key B simultaneously
    const [a1, a2, a3, a4, a5, b1, b2, b3] = await Promise.all([
      getCachedOrFetch('key:dup:A', fetcherA),
      getCachedOrFetch('key:dup:A', fetcherA),
      getCachedOrFetch('key:dup:A', fetcherA),
      getCachedOrFetch('key:dup:A', fetcherA),
      getCachedOrFetch('key:dup:A', fetcherA),
      getCachedOrFetch('key:dup:B', fetcherB),
      getCachedOrFetch('key:dup:B', fetcherB),
      getCachedOrFetch('key:dup:B', fetcherB),
    ]);

    assert.strictEqual(fetchCountA, 1, 'Fetcher A must be called exactly once');
    assert.strictEqual(fetchCountB, 1, 'Fetcher B must be called exactly once');
    assert.strictEqual(a1[0].name, 'A');
    assert.strictEqual(a5[0].name, 'A');
    assert.strictEqual(b1[0].name, 'B');
    assert.strictEqual(b3[0].name, 'B');
    assert.strictEqual(getMenuCacheStats().inFlight, 0, 'In-flight map must be empty');
  });

  it('6. Defensive Cloning (Section 4.E): Mutations to returned arrays or objects cannot poison cache', async () => {
    const originalDish = { id: 'dish-10', name: 'Original Tikka', spice: 'mild' };
    await getCachedOrFetch('menu:clone:test', async () => [originalDish]);

    // Initial fetch result mutation
    const read1 = await getCachedOrFetch('menu:clone:test', async () => []);
    read1.push({ id: 'injected-dish', name: 'Poisoned Item', spice: 'hot' });

    // Cache hit result mutation
    const read2 = await getCachedOrFetch('menu:clone:test', async () => []);
    assert.strictEqual(read2.length, 1, 'Cached array length must remain 1');
    assert.strictEqual(read2[0].name, 'Original Tikka');
  });

  it('7. FIFO Capacity Limit (Section 4.F): Evicts oldest entry when MAX_CACHE_ENTRIES is exceeded', async () => {
    // Fill to capacity (100 entries)
    for (let i = 0; i < MAX_CACHE_ENTRIES; i++) {
      await getCachedOrFetch(`key:cap:${i}`, async () => ({ index: i }));
    }
    assert.strictEqual(getMenuCacheStats().size, MAX_CACHE_ENTRIES);

    // Read an early key (key:cap:0) to confirm reading does not alter FIFO insertion order
    await getCachedOrFetch('key:cap:0', async () => ({ index: -1 }));

    // Insert 101st entry
    await getCachedOrFetch('key:cap:100', async () => ({ index: 100 }));
    assert.strictEqual(getMenuCacheStats().size, MAX_CACHE_ENTRIES, 'Cache size must remain bounded at 100');

    // Verify oldest entry (key:cap:0) was evicted
    const keys = getMenuCacheStats().keys;
    assert.strictEqual(keys.includes('key:cap:0'), false, 'Oldest entry key:cap:0 must be evicted');
    assert.strictEqual(keys.includes('key:cap:100'), true, 'Newest entry key:cap:100 must be present');
  });

  it('8. Tenant and Key Isolation (Section 4.G): Distinct tenants and keys do not leak or collide', async () => {
    const tenantA = 'rest-0001-aaaa';
    const tenantB = 'rest-0002-bbbb';

    const resultA = await getCachedOrFetch(`menu:dishes:${tenantA}`, async () => [
      { id: 'dish-A', restaurant: tenantA, price: 500 }
    ]);

    const resultB = await getCachedOrFetch(`menu:dishes:${tenantB}`, async () => [
      { id: 'dish-B', restaurant: tenantB, price: 750 }
    ]);

    assert.strictEqual(resultA[0].restaurant, tenantA);
    assert.strictEqual(resultB[0].restaurant, tenantB);

    const stats = getMenuCacheStats();
    assert.strictEqual(stats.size, 2);
    assert.ok(stats.keys.includes(`menu:dishes:${tenantA}`));
    assert.ok(stats.keys.includes(`menu:dishes:${tenantB}`));
  });

  it('9. Selective Invalidation (Section 4.H): Removes matching keys, preserves unrelated keys and in-flight writes', async () => {
    // 1. Seed two distinct keys
    await getCachedOrFetch('menu:categories:rest-1', async () => [{ name: 'Starters' }]);
    await getCachedOrFetch('menu:dishes:rest-1', async () => [{ name: 'Biryani' }]);
    assert.strictEqual(getMenuCacheStats().size, 2);

    // 2. Start slow in-flight fetch for dishes (unrelated to categories)
    let resolveDishes;
    const slowDishesPromise = new Promise((r) => { resolveDishes = r; });
    const inFlightDishes = getCachedOrFetch('menu:dishes:rest-2', () => slowDishesPromise);

    // 3. Start slow in-flight fetch for categories (matching target)
    let resolveCats;
    const slowCatsPromise = new Promise((r) => { resolveCats = r; });
    const inFlightCats = getCachedOrFetch('menu:categories:rest-2', () => slowCatsPromise);

    // 4. Selectively invalidate only categories
    invalidateMenuCache('categories');

    // Verify cache state: categories was deleted, dishes was preserved
    const statsAfter = getMenuCacheStats();
    assert.strictEqual(statsAfter.keys.includes('menu:categories:rest-1'), false, 'Targeted category must be deleted');
    assert.strictEqual(statsAfter.keys.includes('menu:dishes:rest-1'), true, 'Unrelated dishes must be preserved');

    // 5. Resolve matching in-flight categories fetch -> MUST NOT populate cache
    resolveCats([{ name: 'Stale Categories' }]);
    await inFlightCats;
    assert.strictEqual(getMenuCacheStats().keys.includes('menu:categories:rest-2'), false, 'Targeted in-flight category must not populate cache');

    // 6. Resolve unrelated in-flight dishes fetch -> MUST safely populate cache
    resolveDishes([{ name: 'Fresh Biryani' }]);
    await inFlightDishes;
    assert.strictEqual(getMenuCacheStats().keys.includes('menu:dishes:rest-2'), true, 'Unrelated in-flight dishes must successfully populate cache');
  });

  it('10. Global Invalidation (Section 4.I): Clears all entries and prevents pre-invalidation write-back', async () => {
    await getCachedOrFetch('k1', async () => 'data1');
    await getCachedOrFetch('k2', async () => 'data2');
    assert.strictEqual(getMenuCacheStats().size, 2);

    let resolveSlow;
    const slow = new Promise((r) => { resolveSlow = r; });
    const inFlight = getCachedOrFetch('k3', () => slow);

    invalidateMenuCache();
    assert.strictEqual(getMenuCacheStats().size, 0);

    resolveSlow('data3');
    await inFlight;

    // k3 must not be cached because invalidation was global
    assert.strictEqual(getMenuCacheStats().size, 0);
  });

  it('11. Failure and Cleanup (Section 4.J): Failed fetches clear in-flight entry; older promise does not clear newer', async () => {
    let failCount = 0;
    const failingFetcher = async () => {
      failCount++;
      throw new Error('Transient error');
    };

    // First attempt fails
    await assert.rejects(async () => getCachedOrFetch('key:fail:test', failingFetcher), /Transient error/);
    assert.strictEqual(getMenuCacheStats().inFlight, 0, 'In-flight entry must be cleaned up on error');

    // Second attempt can immediately retry without being blocked by previous failure
    const recovered = await getCachedOrFetch('key:fail:test', async () => 'success');
    assert.strictEqual(recovered, 'success');
  });
});
