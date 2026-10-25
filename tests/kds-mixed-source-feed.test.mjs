import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// UUID validator matching OrdersDashboard.tsx implementation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (id) => Boolean(id && UUID_REGEX.test(id));

// KDS deduplication logic extracted from OrdersDashboard.tsx for unit testing
function mergeConvexWithSupabase(prevOrders, convexLiveOrders) {
  const mapped = (convexLiveOrders || []).map((o) => ({
    id: o._id,
    restaurant_id: 'a1b2c3d4-0000-0000-0000-000000000001',
    customer_name: o.customerName,
    status: o.status,
    idempotency_key: o.idempotencyKey || null,
    created_at: new Date(o.createdAt).toISOString(),
    source: 'convex',
  }));

  const convexKeys = new Set();
  for (const m of mapped) {
    if (m.id) convexKeys.add(m.id);
    if (m.idempotency_key) convexKeys.add(m.idempotency_key);
  }
  for (const o of convexLiveOrders || []) {
    if (o.legacyId) convexKeys.add(o.legacyId);
  }

  const seenSupabaseKeys = new Set();
  const validSupabaseOrders = prevOrders.filter((p) => {
    // Only retain Supabase fallback orders identified by valid UUID pattern
    if (!isUuid(p.id)) return false;

    // Do not retain completed or cancelled tickets
    if (p.status === 'completed' || p.status === 'cancelled') return false;

    // Deduplicate against Convex orders by ID or idempotency key
    if (convexKeys.has(p.id)) return false;
    if (p.idempotency_key && convexKeys.has(p.idempotency_key)) return false;

    // Prevent duplicates within fallback orders
    const key = p.idempotency_key || p.id;
    if (seenSupabaseKeys.has(key)) return false;
    seenSupabaseKeys.add(key);

    return true;
  });

  return [...mapped, ...validSupabaseOrders].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

// Supabase poll/realtime listener merge logic extracted from OrdersDashboard.tsx
function mergeSupabasePoll(currentOrders, supabaseData) {
  const convexOrders = currentOrders.filter((o) => !isUuid(o.id));
  const convexKeys = new Set();
  for (const c of convexOrders) {
    if (c.id) convexKeys.add(c.id);
    if (c.idempotency_key) convexKeys.add(c.idempotency_key);
  }

  const activeSupabaseOrders = [];
  const seenSupabaseKeys = new Set();

  for (const sbo of supabaseData || []) {
    if (convexKeys.has(sbo.id)) continue;
    if (sbo.idempotency_key && convexKeys.has(sbo.idempotency_key)) continue;

    const key = sbo.idempotency_key || sbo.id;
    if (seenSupabaseKeys.has(key)) continue;
    seenSupabaseKeys.add(key);

    activeSupabaseOrders.push(sbo);
  }

  return [...convexOrders, ...activeSupabaseOrders].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

describe('Kitchen Display System (KDS) Mixed-Source Feed & Deduplication', () => {
  it('correctly distinguishes Supabase UUIDs from Convex alphanumeric document IDs', () => {
    const supabaseUuid1 = 'a1b2c3d4-0000-0000-0000-000000000001';
    const supabaseUuid2 = 'e4b9319e-e376-43b6-bfb0-b96e42b26b38';
    const convexId1 = 'jd70a2z5w4y337g6h77r146d9172yq4h';
    const convexId2 = 'k570742f89a910bc';

    assert.equal(isUuid(supabaseUuid1), true);
    assert.equal(isUuid(supabaseUuid2), true);
    assert.equal(isUuid(convexId1), false);
    assert.equal(isUuid(convexId2), false);
    assert.equal(isUuid(null), false);
    assert.equal(isUuid(undefined), false);
    assert.equal(isUuid(''), false);
  });

  it('retains valid Supabase fallback orders when Convex has active orders', () => {
    const prevOrders = [
      {
        id: '11111111-2222-3333-4444-555555555555',
        restaurant_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        customer_name: 'Supabase Guest A',
        status: 'pending',
        idempotency_key: 'idem-supa-1',
        created_at: '2026-10-25T10:00:00.000Z',
      },
    ];

    const convexLiveOrders = [
      {
        _id: 'convex_order_1',
        customerName: 'Convex Guest B',
        status: 'preparing',
        idempotencyKey: 'idem-conv-1',
        createdAt: 1729850460000, // 2026-10-25T10:01:00.000Z approx
      },
    ];

    const result = mergeConvexWithSupabase(prevOrders, convexLiveOrders);

    assert.equal(result.length, 2);
    assert.ok(result.some((o) => o.id === '11111111-2222-3333-4444-555555555555'));
    assert.ok(result.some((o) => o.id === 'convex_order_1'));
  });

  it('CRITICAL: Empty Convex updates (convexLiveOrders: []) clear completed Convex tickets without purging valid Supabase tickets', () => {
    // State before update: 2 Convex orders (now completed) and 1 Supabase fallback order
    const prevOrders = [
      {
        id: 'convex_order_old_1',
        restaurant_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        customer_name: 'Convex Customer (Now Completed)',
        status: 'preparing',
        idempotency_key: 'idem-conv-old',
        created_at: '2026-10-25T10:00:00.000Z',
      },
      {
        id: '99999999-8888-7777-6666-555555555555',
        restaurant_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        customer_name: 'Supabase Customer (Still Active)',
        status: 'confirmed',
        idempotency_key: 'idem-supa-active',
        created_at: '2026-10-25T10:05:00.000Z',
      },
    ];

    // Convex query updates to empty array (all Convex orders have finished or reached completed)
    const convexLiveOrders = [];

    const result = mergeConvexWithSupabase(prevOrders, convexLiveOrders);

    // Old Convex order MUST be cleared (not retained)
    assert.equal(result.some((o) => o.id === 'convex_order_old_1'), false);

    // Valid Supabase fallback order MUST be preserved
    assert.equal(result.length, 1);
    assert.equal(result[0].id, '99999999-8888-7777-6666-555555555555');
    assert.equal(result[0].customer_name, 'Supabase Customer (Still Active)');
  });

  it('deduplicates duplicate orders sharing the same idempotency key across Convex and Supabase', () => {
    const sharedIdempotencyKey = 'shared-idempotency-key-12345';

    const prevOrders = [
      {
        id: '44444444-5555-6666-7777-888888888888',
        restaurant_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        customer_name: 'Dual Ingested Order',
        status: 'confirmed',
        idempotency_key: sharedIdempotencyKey,
        created_at: '2026-10-25T10:00:00.000Z',
      },
    ];

    const convexLiveOrders = [
      {
        _id: 'convex_order_dual',
        customerName: 'Dual Ingested Order',
        status: 'confirmed',
        idempotencyKey: sharedIdempotencyKey,
        createdAt: 1729850400000,
      },
    ];

    const result = mergeConvexWithSupabase(prevOrders, convexLiveOrders);

    // Exactly 1 ticket should exist, prioritizing the Convex realtime source
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'convex_order_dual');
    assert.equal(result[0].idempotency_key, sharedIdempotencyKey);
  });

  it('deduplicates when Convex order has legacyId matching Supabase UUID', () => {
    const supabaseId = '77777777-8888-9999-aaaa-bbbbbbbbbbbb';

    const prevOrders = [
      {
        id: supabaseId,
        restaurant_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        customer_name: 'Migrated Order',
        status: 'preparing',
        created_at: '2026-10-25T10:00:00.000Z',
      },
    ];

    const convexLiveOrders = [
      {
        _id: 'convex_order_migrated',
        customerName: 'Migrated Order',
        status: 'preparing',
        legacyId: supabaseId,
        createdAt: 1729850400000,
      },
    ];

    const result = mergeConvexWithSupabase(prevOrders, convexLiveOrders);

    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'convex_order_migrated');
  });

  it('does not retain completed or cancelled Supabase tickets from prev', () => {
    const prevOrders = [
      {
        id: '22222222-3333-4444-5555-666666666666',
        restaurant_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        customer_name: 'Completed Guest',
        status: 'completed',
        created_at: '2026-10-25T09:00:00.000Z',
      },
      {
        id: '33333333-4444-5555-6666-777777777777',
        restaurant_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        customer_name: 'Cancelled Guest',
        status: 'cancelled',
        created_at: '2026-10-25T09:30:00.000Z',
      },
      {
        id: '44444444-5555-6666-7777-888888888888',
        restaurant_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        customer_name: 'Active Guest',
        status: 'ready',
        created_at: '2026-10-25T10:00:00.000Z',
      },
    ];

    const result = mergeConvexWithSupabase(prevOrders, []);

    assert.equal(result.length, 1);
    assert.equal(result[0].id, '44444444-5555-6666-7777-888888888888');
    assert.equal(result[0].customer_name, 'Active Guest');
  });

  it('sorts all orders chronologically ascending by created_at', () => {
    const prevOrders = [
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        restaurant_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        customer_name: 'Supabase Late Order',
        status: 'pending',
        created_at: '2026-10-25T11:00:00.000Z',
      },
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        restaurant_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        customer_name: 'Supabase Early Order',
        status: 'pending',
        created_at: '2026-10-25T09:00:00.000Z',
      },
    ];

    const convexLiveOrders = [
      {
        _id: 'convex_mid_order',
        customerName: 'Convex Mid Order',
        status: 'preparing',
        createdAt: new Date('2026-10-25T10:00:00.000Z').getTime(),
      },
    ];

    const result = mergeConvexWithSupabase(prevOrders, convexLiveOrders);

    assert.equal(result.length, 3);
    assert.equal(result[0].customer_name, 'Supabase Early Order');
    assert.equal(result[1].customer_name, 'Convex Mid Order');
    assert.equal(result[2].customer_name, 'Supabase Late Order');
  });

  it('Supabase poll merge preserves active Convex orders while updating Supabase orders', () => {
    const currentOrders = [
      {
        id: 'convex_live_1',
        customer_name: 'Convex Active 1',
        status: 'preparing',
        created_at: '2026-10-25T10:00:00.000Z',
      },
      {
        id: '12345678-1234-1234-1234-123456789abc',
        customer_name: 'Supabase Old Active',
        status: 'pending',
        created_at: '2026-10-25T10:02:00.000Z',
      },
    ];

    // Supabase poll returns 2 active orders (one updated, one brand new)
    const supabaseData = [
      {
        id: '12345678-1234-1234-1234-123456789abc',
        customer_name: 'Supabase Old Active',
        status: 'confirmed', // advanced status
        created_at: '2026-10-25T10:02:00.000Z',
      },
      {
        id: '87654321-4321-4321-4321-cba987654321',
        customer_name: 'Supabase Brand New',
        status: 'pending',
        created_at: '2026-10-25T10:05:00.000Z',
      },
    ];

    const result = mergeSupabasePoll(currentOrders, supabaseData);

    assert.equal(result.length, 3);
    assert.ok(result.some((o) => o.id === 'convex_live_1'));
    const updatedSupa = result.find((o) => o.id === '12345678-1234-1234-1234-123456789abc');
    assert.equal(updatedSupa.status, 'confirmed');
    assert.ok(result.some((o) => o.id === '87654321-4321-4321-4321-cba987654321'));
  });
});
