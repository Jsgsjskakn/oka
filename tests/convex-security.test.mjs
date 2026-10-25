import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { authenticateCaller, ADMIN_ROLES, STAFF_ROLES } from '../convex/authUtils.ts';

// ============================================================================
// IN-MEMORY MOCK CONVEX DATABASE & CONTEXT FACTORY
// ============================================================================

function createMockDatabase(seedData = {}) {
  const tables = {
    users: seedData.users ? structuredClone(seedData.users) : [],
    sessions: seedData.sessions ? structuredClone(seedData.sessions) : [],
    dishes: seedData.dishes ? structuredClone(seedData.dishes) : [],
    employees: seedData.employees ? structuredClone(seedData.employees) : [],
    tables: seedData.tables ? structuredClone(seedData.tables) : [],
    restaurant_settings: seedData.restaurant_settings ? structuredClone(seedData.restaurant_settings) : [],
    orders: seedData.orders ? structuredClone(seedData.orders) : [],
    categories: seedData.categories ? structuredClone(seedData.categories) : [],
  };

  let idCounter = 5000;
  const genId = (table) => `${table}_${++idCounter}`;

  const db = {
    _tables: tables,
    normalizeId: (table, id) => {
      if (!id || typeof id !== 'string') return null;
      const found = tables[table]?.find((row) => row._id === id);
      return found ? found._id : id;
    },
    get: async (id) => {
      for (const table of Object.values(tables)) {
        const found = table.find((row) => row._id === id);
        if (found) return structuredClone(found);
      }
      return null;
    },
    insert: async (table, doc) => {
      if (!tables[table]) tables[table] = [];
      const newDoc = { _id: genId(table), ...structuredClone(doc) };
      tables[table].push(newDoc);
      return newDoc._id;
    },
    patch: async (id, fields) => {
      for (const table of Object.values(tables)) {
        const idx = table.findIndex((row) => row._id === id);
        if (idx !== -1) {
          table[idx] = { ...table[idx], ...structuredClone(fields) };
          return;
        }
      }
      throw new Error(`Document with ID ${id} not found to patch`);
    },
    delete: async (id) => {
      for (const table of Object.values(tables)) {
        const idx = table.findIndex((row) => row._id === id);
        if (idx !== -1) {
          table.splice(idx, 1);
          return;
        }
      }
    },
    query: (table) => {
      let rows = tables[table] ? [...tables[table]] : [];

      const builder = {
        withIndex: (indexName, indexFn) => {
          const filterConditions = [];
          const q = {
            eq: (field, val) => {
              filterConditions.push((row) => row[field] === val);
              return q;
            },
          };
          if (indexFn) indexFn(q);
          rows = rows.filter((row) => filterConditions.every((cond) => cond(row)));
          return builder;
        },
        filter: (filterFn) => {
          rows = rows.filter((row) => {
            const wrappedQ = {
              eq: (a, b) => a === b,
              field: (field) => row[field],
            };
            return filterFn(wrappedQ);
          });
          return builder;
        },
        order: (dir) => {
          return builder;
        },
        first: async () => (rows.length > 0 ? structuredClone(rows[0]) : null),
        collect: async () => rows.map((r) => structuredClone(r)),
        take: async (n) => rows.slice(0, n).map((r) => structuredClone(r)),
      };

      return builder;
    },
  };

  return { db };
}

// ============================================================================
// CONVEX SENSITIVE MUTATION IMPLEMENTATIONS (MATCHING CONVEX SOURCE DIRECTLY)
// ============================================================================

async function resolveDish(ctx, identifier) {
  const normId = ctx.db.normalizeId('dishes', identifier);
  if (normId) {
    const doc = await ctx.db.get(normId);
    if (doc) return doc;
  }
  const bySlug = await ctx.db
    .query('dishes')
    .withIndex('by_slug', (q) => q.eq('slug', identifier))
    .first();
  if (bySlug) return bySlug;

  return await ctx.db
    .query('dishes')
    .filter((q) => q.eq(q.field('legacyId'), identifier))
    .first();
}

// 1. updateDishPrice (convex/menu.ts)
async function updateDishPrice(ctx, args) {
  const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
  if (!auth.authorized) return { error: auth.error };

  const dish = await resolveDish(ctx, args.id);
  if (!dish) return { error: 'Dish not found' };
  await ctx.db.patch(dish._id, { pricePaise: args.pricePaise });
  return { success: true };
}

// 2. toggleDishAvailability (convex/menu.ts)
async function toggleDishAvailability(ctx, args) {
  const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
  if (!auth.authorized) return { error: auth.error };

  const dish = await resolveDish(ctx, args.id);
  if (!dish) return { error: 'Dish not found' };
  await ctx.db.patch(dish._id, { isAvailable: args.isAvailable });
  return { success: true };
}

// 3. addEmployee (convex/employees.ts)
async function addEmployee(ctx, args) {
  const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
  if (!auth.authorized) return { error: auth.error };

  const employeeId = await ctx.db.insert('employees', {
    name: args.name.trim(),
    role: args.role,
    email: args.email?.trim() || undefined,
    phone: args.phone?.trim() || undefined,
    isActive: args.isActive,
    hiredAt: args.hiredAt || new Date().toISOString(),
  });

  return { success: true, employeeId };
}

// 4. removeEmployee (convex/employees.ts)
async function removeEmployee(ctx, args) {
  const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
  if (!auth.authorized) return { error: auth.error };

  const id = ctx.db.normalizeId('employees', args.employeeId);
  if (!id) return { error: 'Invalid employee ID' };

  await ctx.db.delete(id);
  return { success: true };
}

// 5. createTable (convex/tables.ts)
async function createTable(ctx, args) {
  const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
  if (!auth.authorized) return { error: auth.error };

  const existing = await ctx.db
    .query('tables')
    .withIndex('by_table_number', (q) => q.eq('tableNumber', args.tableNumber))
    .first();

  if (existing) {
    return { error: `Table number ${args.tableNumber} already exists.` };
  }

  const tableId = await ctx.db.insert('tables', {
    tableNumber: args.tableNumber,
    capacity: args.capacity,
    status: args.status,
    notes: args.notes,
    createdAt: Date.now(),
  });

  return { success: true, tableId };
}

// 6. updateTableStatus (convex/tables.ts)
async function updateTableStatus(ctx, args) {
  const auth = await authenticateCaller(ctx, args.sessionToken, STAFF_ROLES);
  if (!auth.authorized) return { error: auth.error };

  const id = ctx.db.normalizeId('tables', args.tableId);
  if (!id) return { error: 'Invalid table ID' };

  const table = await ctx.db.get(id);
  if (!table) return { error: 'Table not found' };

  await ctx.db.patch(id, { status: args.status });
  return { success: true };
}

// 7. updateSetting (convex/settings.ts)
async function updateSetting(ctx, args) {
  const auth = await authenticateCaller(ctx, args.sessionToken, ADMIN_ROLES);
  if (!auth.authorized) return { error: auth.error };

  const existing = await ctx.db
    .query('restaurant_settings')
    .withIndex('by_key', (q) => q.eq('key', args.key))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, { value: args.value });
  } else {
    await ctx.db.insert('restaurant_settings', {
      key: args.key,
      value: args.value,
    });
  }
  return { success: true };
}

// 8. updateOrderStatus (convex/orders.ts)
const ALLOWED_FORWARD_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

async function updateOrderStatus(ctx, args) {
  const auth = await authenticateCaller(ctx, args.sessionToken, STAFF_ROLES);
  if (!auth.authorized) return { error: auth.error };

  const id = ctx.db.normalizeId('orders', args.orderId);
  if (!id) return { error: 'Invalid order ID' };
  const order = await ctx.db.get(id);
  if (!order) return { error: 'Order not found' };

  if (order.status === args.status) {
    return { success: true };
  }

  const allowed = ALLOWED_FORWARD_TRANSITIONS[order.status] || [];
  if (!allowed.includes(args.status)) {
    return {
      error: `Illegal state transition from "${order.status}" to "${args.status}"`,
    };
  }

  await ctx.db.patch(id, { status: args.status });
  return { success: true };
}

// Password Hashing helpers (identical algorithm to convex/auth.ts)
async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const saltBytes = new Uint8Array(
    saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateRandomHex(byteCount = 16) {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// 9. provisionPrivilegedAccount (convex/auth.ts - internalMutation)
async function provisionPrivilegedAccount(ctx, args) {
  const existingAdmin = await ctx.db
    .query('users')
    .withIndex('by_role', (q) => q.eq('role', 'admin'))
    .first();

  if (existingAdmin) {
    const token = args.sessionToken || args.adminSessionToken;
    const auth = await authenticateCaller(ctx, token, ADMIN_ROLES);
    if (!auth.authorized) {
      return { error: auth.error };
    }
  }

  const email = args.email.trim().toLowerCase();
  const existing = await ctx.db
    .query('users')
    .withIndex('by_email', (q) => q.eq('email', email))
    .first();

  const salt = generateRandomHex(16);
  const passwordHash = await hashPassword(args.password, salt);

  if (existing) {
    await ctx.db.patch(existing._id, {
      name: args.name.trim(),
      phone: args.phone?.trim() || existing.phone,
      passwordHash,
      salt,
      role: args.role,
      isActive: true,
    });
    return { success: true, userId: existing._id, updated: true };
  } else {
    const userId = await ctx.db.insert('users', {
      email,
      name: args.name.trim(),
      phone: args.phone?.trim() || undefined,
      passwordHash,
      salt,
      role: args.role,
      isActive: true,
      createdAt: Date.now(),
    });
    return { success: true, userId, created: true };
  }
}

// ============================================================================
// TEST FIXTURES
// ============================================================================

function createStandardSecurityFixture() {
  const now = Date.now();

  const users = [
    {
      _id: 'user_admin_01',
      name: 'Super Admin',
      email: 'admin@thegoldenoak.in',
      role: 'admin',
      isActive: true,
      createdAt: now - 100000,
    },
    {
      _id: 'user_staff_01',
      name: 'Chef Gordon',
      email: 'chef@thegoldenoak.in',
      role: 'chef',
      isActive: true,
      createdAt: now - 100000,
    },
    {
      _id: 'user_employee_01',
      name: 'Server Alice',
      email: 'alice@thegoldenoak.in',
      role: 'employee',
      isActive: true,
      createdAt: now - 100000,
    },
    {
      _id: 'user_customer_01',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      role: 'customer',
      isActive: true,
      createdAt: now - 100000,
    },
    {
      _id: 'user_deactivated_01',
      name: 'Banned BadActor',
      email: 'banned@example.com',
      role: 'admin',
      isActive: false, // Deactivated!
      createdAt: now - 100000,
    },
  ];

  const sessions = [
    {
      _id: 'session_admin_valid',
      token: 'admin-live-token-secret-123',
      userId: 'user_admin_01',
      role: 'admin',
      expiresAt: now + 3600 * 1000, // Valid 1 hr
      createdAt: now,
    },
    {
      _id: 'session_chef_valid',
      token: 'chef-live-token-secret-456',
      userId: 'user_staff_01',
      role: 'chef',
      expiresAt: now + 3600 * 1000,
      createdAt: now,
    },
    {
      _id: 'session_employee_valid',
      token: 'employee-live-token-secret-789',
      userId: 'user_employee_01',
      role: 'employee',
      expiresAt: now + 3600 * 1000,
      createdAt: now,
    },
    {
      _id: 'session_customer_valid',
      token: 'customer-live-token-secret-999',
      userId: 'user_customer_01',
      role: 'customer',
      expiresAt: now + 3600 * 1000,
      createdAt: now,
    },
    {
      _id: 'session_admin_expired',
      token: 'admin-expired-token-secret-000',
      userId: 'user_admin_01',
      role: 'admin',
      expiresAt: now - 5000, // Expired 5 seconds ago!
      createdAt: now - 100000,
    },
    {
      _id: 'session_deactivated',
      token: 'deactivated-user-token-secret-111',
      userId: 'user_deactivated_01',
      role: 'admin',
      expiresAt: now + 3600 * 1000,
      createdAt: now,
    },
  ];

  const dishes = [
    {
      _id: 'dish_butter_chicken',
      slug: 'butter-chicken',
      name: 'Butter Chicken',
      categorySlug: 'main-course',
      pricePaise: 42000,
      isAvailable: true,
      isVeg: false,
    },
    {
      _id: 'dish_dal_makhani',
      slug: 'dal-makhani',
      name: 'Dal Makhani',
      categorySlug: 'main-course',
      pricePaise: 32000,
      isAvailable: true,
      isVeg: true,
    },
  ];

  const employees = [
    {
      _id: 'emp_01',
      name: 'Rohan Waiter',
      role: 'waiter',
      email: 'rohan@thegoldenoak.in',
      isActive: true,
      hiredAt: new Date(now - 1000000).toISOString(),
    },
  ];

  const tables = [
    {
      _id: 'table_t1',
      tableNumber: 1,
      capacity: 4,
      status: 'available',
      notes: 'Near window',
      createdAt: now - 50000,
    },
  ];

  const restaurant_settings = [
    {
      _id: 'setting_tax',
      key: 'tax_rate_percent',
      value: 5,
    },
    {
      _id: 'setting_name',
      key: 'restaurant_name',
      value: 'The Golden Oak',
    },
  ];

  const orders = [
    {
      _id: 'order_101',
      customerName: 'Rahul Sharma',
      customerPhone: '9876543210',
      status: 'pending',
      totalPaise: 42000,
      createdAt: now - 1000,
    },
  ];

  return createMockDatabase({
    users,
    sessions,
    dishes,
    employees,
    tables,
    restaurant_settings,
    orders,
  });
}

// ============================================================================
// TEST SUITE 1: Core authenticateCaller Security Engine
// ============================================================================

describe('Suite 1: Core authenticateCaller Security Engine', () => {
  let ctx;

  beforeEach(() => {
    ctx = createStandardSecurityFixture();
  });

  test('rejects undefined session token with Unauthorized', async () => {
    const res = await authenticateCaller(ctx, undefined, ADMIN_ROLES);
    assert.strictEqual(res.authorized, false);
    assert.strictEqual(res.error, 'Unauthorized: Missing session token.');
  });

  test('rejects empty and whitespace-only session token with Unauthorized', async () => {
    const emptyRes = await authenticateCaller(ctx, '', ADMIN_ROLES);
    assert.strictEqual(emptyRes.authorized, false);
    assert.strictEqual(emptyRes.error, 'Unauthorized: Missing session token.');

    const wsRes = await authenticateCaller(ctx, '   ', ADMIN_ROLES);
    assert.strictEqual(wsRes.authorized, false);
    assert.strictEqual(wsRes.error, 'Unauthorized: Missing session token.');
  });

  test('rejects invalid / non-existent session token with Unauthorized', async () => {
    const res = await authenticateCaller(ctx, 'completely-bogus-token-xyz', ADMIN_ROLES);
    assert.strictEqual(res.authorized, false);
    assert.strictEqual(res.error, 'Unauthorized: Invalid session token.');
  });

  test('rejects expired session token with Unauthorized', async () => {
    const res = await authenticateCaller(ctx, 'admin-expired-token-secret-000', ADMIN_ROLES);
    assert.strictEqual(res.authorized, false);
    assert.strictEqual(res.error, 'Unauthorized: Session has expired.');
  });

  test('rejects deactivated user account session with Unauthorized', async () => {
    const res = await authenticateCaller(ctx, 'deactivated-user-token-secret-111', ADMIN_ROLES);
    assert.strictEqual(res.authorized, false);
    assert.strictEqual(res.error, 'Unauthorized: User account has been deactivated.');
  });

  test('rejects session if underlying user record was deleted with Unauthorized', async () => {
    // Insert orphan session pointing to missing user
    await ctx.db.insert('sessions', {
      token: 'orphan-token-secret-222',
      userId: 'non_existent_user_id',
      role: 'admin',
      expiresAt: Date.now() + 100000,
    });

    const res = await authenticateCaller(ctx, 'orphan-token-secret-222', ADMIN_ROLES);
    assert.strictEqual(res.authorized, false);
    assert.strictEqual(res.error, 'Unauthorized: User not found.');
  });

  test('rejects customer role with Forbidden when attempting admin action', async () => {
    const res = await authenticateCaller(ctx, 'customer-live-token-secret-999', ADMIN_ROLES);
    assert.strictEqual(res.authorized, false);
    assert.match(res.error, /^Forbidden: Action requires role \[admin\], but account has role "customer"\.$/);
  });

  test('rejects customer role with Forbidden when attempting staff action', async () => {
    const res = await authenticateCaller(ctx, 'customer-live-token-secret-999', STAFF_ROLES);
    assert.strictEqual(res.authorized, false);
    assert.match(res.error, /^Forbidden: Action requires role \[admin, manager, employee, staff, chef\], but account has role "customer"\.$/);
  });

  test('authorizes valid active admin session for admin roles', async () => {
    const res = await authenticateCaller(ctx, 'admin-live-token-secret-123', ADMIN_ROLES);
    assert.strictEqual(res.authorized, true);
    assert.strictEqual(res.user.role, 'admin');
    assert.strictEqual(res.user.email, 'admin@thegoldenoak.in');
  });

  test('authorizes valid active employee/chef session for staff roles', async () => {
    const chefRes = await authenticateCaller(ctx, 'chef-live-token-secret-456', STAFF_ROLES);
    assert.strictEqual(chefRes.authorized, true);
    assert.strictEqual(chefRes.user.role, 'chef');

    const empRes = await authenticateCaller(ctx, 'employee-live-token-secret-789', STAFF_ROLES);
    assert.strictEqual(empRes.authorized, true);
    assert.strictEqual(empRes.user.role, 'employee');
  });
});

// ============================================================================
// TEST SUITE 2: Negative Testing - Unauthenticated Rejection Across All 9 Sensitive Mutations
// ============================================================================

describe('Suite 2: Negative Testing - Unauthenticated Rejections', () => {
  let ctx;

  beforeEach(() => {
    ctx = createStandardSecurityFixture();
  });

  const SENSITIVE_MUTATIONS = [
    {
      name: 'updateDishPrice',
      fn: updateDishPrice,
      validPayload: { id: 'dish_butter_chicken', pricePaise: 49900 },
    },
    {
      name: 'toggleDishAvailability',
      fn: toggleDishAvailability,
      validPayload: { id: 'dish_butter_chicken', isAvailable: false },
    },
    {
      name: 'addEmployee',
      fn: addEmployee,
      validPayload: { name: 'New Waiter', role: 'waiter', isActive: true },
    },
    {
      name: 'removeEmployee',
      fn: removeEmployee,
      validPayload: { employeeId: 'emp_01' },
    },
    {
      name: 'createTable',
      fn: createTable,
      validPayload: { tableNumber: 99, capacity: 6, status: 'available' },
    },
    {
      name: 'updateTableStatus',
      fn: updateTableStatus,
      validPayload: { tableId: 'table_t1', status: 'occupied' },
    },
    {
      name: 'updateSetting',
      fn: updateSetting,
      validPayload: { key: 'tax_rate_percent', value: 18 },
    },
    {
      name: 'updateOrderStatus',
      fn: updateOrderStatus,
      validPayload: { orderId: 'order_101', status: 'confirmed' },
    },
    {
      name: 'provisionPrivilegedAccount',
      fn: provisionPrivilegedAccount,
      validPayload: { email: 'newadmin@thegoldenoak.in', password: 'password123', name: 'New Admin', role: 'admin' },
    },
  ];

  for (const { name, fn, validPayload } of SENSITIVE_MUTATIONS) {
    test(`${name}: strictly rejects omitted sessionToken with Unauthorized error`, async () => {
      const res = await fn(ctx, { ...validPayload, sessionToken: undefined });
      assert.strictEqual(res.success, undefined, `${name} must not report success`);
      assert.ok(res.error, `${name} must return an error`);
      assert.match(res.error, /^Unauthorized:/, `${name} error must start with "Unauthorized:"`);
      assert.strictEqual(res.error, 'Unauthorized: Missing session token.');
    });

    test(`${name}: strictly rejects invalid / fabricated sessionToken with Unauthorized error`, async () => {
      const res = await fn(ctx, { ...validPayload, sessionToken: 'forged-attacker-token-999' });
      assert.strictEqual(res.success, undefined, `${name} must not report success`);
      assert.ok(res.error, `${name} must return an error`);
      assert.match(res.error, /^Unauthorized:/, `${name} error must start with "Unauthorized:"`);
      assert.strictEqual(res.error, 'Unauthorized: Invalid session token.');
    });

    test(`${name}: strictly rejects expired sessionToken with Unauthorized error`, async () => {
      const res = await fn(ctx, { ...validPayload, sessionToken: 'admin-expired-token-secret-000' });
      assert.strictEqual(res.success, undefined, `${name} must not report success`);
      assert.ok(res.error, `${name} must return an error`);
      assert.match(res.error, /^Unauthorized:/, `${name} error must start with "Unauthorized:"`);
      assert.strictEqual(res.error, 'Unauthorized: Session has expired.');
    });

    test(`${name}: strictly rejects sessionToken of deactivated user with Unauthorized error`, async () => {
      const res = await fn(ctx, { ...validPayload, sessionToken: 'deactivated-user-token-secret-111' });
      assert.strictEqual(res.success, undefined, `${name} must not report success`);
      assert.ok(res.error, `${name} must return an error`);
      assert.match(res.error, /^Unauthorized:/, `${name} error must start with "Unauthorized:"`);
      assert.strictEqual(res.error, 'Unauthorized: User account has been deactivated.');
    });
  }

  test('negative unauthenticated attempts leave database state completely untouched', async () => {
    // Attempt price change unauthenticated
    await updateDishPrice(ctx, { id: 'dish_butter_chicken', pricePaise: 99999, sessionToken: undefined });
    const dish = await ctx.db.get('dish_butter_chicken');
    assert.strictEqual(dish.pricePaise, 42000, 'Dish price must remain original 42000');

    // Attempt table deletion/removal unauthenticated
    await removeEmployee(ctx, { employeeId: 'emp_01', sessionToken: 'invalid-token' });
    const emp = await ctx.db.get('emp_01');
    assert.ok(emp, 'Employee record must not be deleted');

    // Attempt settings modification unauthenticated
    await updateSetting(ctx, { key: 'tax_rate_percent', value: 99, sessionToken: 'admin-expired-token-secret-000' });
    const taxSetting = await ctx.db.query('restaurant_settings').withIndex('by_key', (q) => q.eq('key', 'tax_rate_percent')).first();
    assert.strictEqual(taxSetting.value, 5, 'Tax setting must remain untouched at 5%');
  });
});

// ============================================================================
// TEST SUITE 3: Negative Testing - Customer Impersonation & Forbidden RBAC Checks
// ============================================================================

describe('Suite 3: Negative Testing - Customer Sessions Attempting Privileged Operations (Forbidden)', () => {
  let ctx;
  const customerToken = 'customer-live-token-secret-999';
  const chefToken = 'chef-live-token-secret-456';
  const employeeToken = 'employee-live-token-secret-789';

  beforeEach(() => {
    ctx = createStandardSecurityFixture();
  });

  test('updateDishPrice: customer session rejected with Forbidden error', async () => {
    const res = await updateDishPrice(ctx, {
      id: 'dish_butter_chicken',
      pricePaise: 100, // Attacker attempting to make dish 1 rupee
      sessionToken: customerToken,
    });
    assert.strictEqual(res.success, undefined);
    assert.match(res.error, /^Forbidden: Action requires role \[admin\], but account has role "customer"\.$/);

    const dish = await ctx.db.get('dish_butter_chicken');
    assert.strictEqual(dish.pricePaise, 42000);
  });

  test('toggleDishAvailability: customer session rejected with Forbidden error', async () => {
    const res = await toggleDishAvailability(ctx, {
      id: 'dish_butter_chicken',
      isAvailable: false,
      sessionToken: customerToken,
    });
    assert.strictEqual(res.success, undefined);
    assert.match(res.error, /^Forbidden: Action requires role \[admin\], but account has role "customer"\.$/);

    const dish = await ctx.db.get('dish_butter_chicken');
    assert.strictEqual(dish.isAvailable, true);
  });

  test('addEmployee: customer session rejected with Forbidden error', async () => {
    const res = await addEmployee(ctx, {
      name: 'Rogue Infiltrator',
      role: 'admin',
      isActive: true,
      sessionToken: customerToken,
    });
    assert.strictEqual(res.success, undefined);
    assert.match(res.error, /^Forbidden: Action requires role \[admin\], but account has role "customer"\.$/);

    const emps = await ctx.db.query('employees').collect();
    assert.strictEqual(emps.length, 1, 'No new employee should be created');
  });

  test('removeEmployee: customer session rejected with Forbidden error', async () => {
    const res = await removeEmployee(ctx, {
      employeeId: 'emp_01',
      sessionToken: customerToken,
    });
    assert.strictEqual(res.success, undefined);
    assert.match(res.error, /^Forbidden: Action requires role \[admin\], but account has role "customer"\.$/);

    const emp = await ctx.db.get('emp_01');
    assert.ok(emp, 'Employee should not be deleted');
  });

  test('createTable: customer session rejected with Forbidden error', async () => {
    const res = await createTable(ctx, {
      tableNumber: 10,
      capacity: 4,
      status: 'available',
      sessionToken: customerToken,
    });
    assert.strictEqual(res.success, undefined);
    assert.match(res.error, /^Forbidden: Action requires role \[admin\], but account has role "customer"\.$/);

    const tables = await ctx.db.query('tables').collect();
    assert.strictEqual(tables.length, 1);
  });

  test('updateTableStatus: customer session rejected with Forbidden error', async () => {
    const res = await updateTableStatus(ctx, {
      tableId: 'table_t1',
      status: 'occupied',
      sessionToken: customerToken,
    });
    assert.strictEqual(res.success, undefined);
    assert.match(res.error, /^Forbidden: Action requires role \[admin, manager, employee, staff, chef\], but account has role "customer"\.$/);

    const table = await ctx.db.get('table_t1');
    assert.strictEqual(table.status, 'available');
  });

  test('updateSetting: customer session rejected with Forbidden error', async () => {
    const res = await updateSetting(ctx, {
      key: 'tax_rate_percent',
      value: 0,
      sessionToken: customerToken,
    });
    assert.strictEqual(res.success, undefined);
    assert.match(res.error, /^Forbidden: Action requires role \[admin\], but account has role "customer"\.$/);

    const setting = await ctx.db.query('restaurant_settings').withIndex('by_key', (q) => q.eq('key', 'tax_rate_percent')).first();
    assert.strictEqual(setting.value, 5);
  });

  test('updateOrderStatus: customer session rejected with Forbidden error', async () => {
    const res = await updateOrderStatus(ctx, {
      orderId: 'order_101',
      status: 'completed',
      sessionToken: customerToken,
    });
    assert.strictEqual(res.success, undefined);
    assert.match(res.error, /^Forbidden: Action requires role \[admin, manager, employee, staff, chef\], but account has role "customer"\.$/);

    const order = await ctx.db.get('order_101');
    assert.strictEqual(order.status, 'pending');
  });

  test('provisionPrivilegedAccount: customer session rejected with Forbidden error', async () => {
    const res = await provisionPrivilegedAccount(ctx, {
      email: 'hacker@shady.com',
      password: 'hackerpassword',
      name: 'Hacker',
      role: 'admin',
      sessionToken: customerToken,
    });
    assert.strictEqual(res.success, undefined);
    assert.match(res.error, /^Forbidden: Action requires role \[admin\], but account has role "customer"\.$/);

    const hackerUser = await ctx.db.query('users').withIndex('by_email', (q) => q.eq('email', 'hacker@shady.com')).first();
    assert.strictEqual(hackerUser, null);
  });

  test('staff/employee role attempting admin-only mutations is strictly rejected with Forbidden error', async () => {
    // Chef attempting to change dish price
    const res1 = await updateDishPrice(ctx, {
      id: 'dish_butter_chicken',
      pricePaise: 50000,
      sessionToken: chefToken,
    });
    assert.strictEqual(res1.success, undefined);
    assert.match(res1.error, /^Forbidden: Action requires role \[admin\], but account has role "chef"\.$/);

    // Employee attempting to add employee
    const res2 = await addEmployee(ctx, {
      name: 'Server Bob',
      role: 'waiter',
      isActive: true,
      sessionToken: employeeToken,
    });
    assert.strictEqual(res2.success, undefined);
    assert.match(res2.error, /^Forbidden: Action requires role \[admin\], but account has role "employee"\.$/);

    // Chef attempting to change system tax settings
    const res3 = await updateSetting(ctx, {
      key: 'tax_rate_percent',
      value: 12,
      sessionToken: chefToken,
    });
    assert.strictEqual(res3.success, undefined);
    assert.match(res3.error, /^Forbidden: Action requires role \[admin\], but account has role "chef"\.$/);
  });
});

// ============================================================================
// TEST SUITE 4: Positive Testing - Authorized Admin and Staff Execution
// ============================================================================

describe('Suite 4: Positive Testing - Authorized Admin and Staff Execution', () => {
  let ctx;
  const adminToken = 'admin-live-token-secret-123';
  const chefToken = 'chef-live-token-secret-456';
  const employeeToken = 'employee-live-token-secret-789';

  beforeEach(() => {
    ctx = createStandardSecurityFixture();
  });

  test('updateDishPrice: authorized admin succeeds and modifies database', async () => {
    const res = await updateDishPrice(ctx, {
      id: 'dish_butter_chicken',
      pricePaise: 46000,
      sessionToken: adminToken,
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.error, undefined);

    const dish = await ctx.db.get('dish_butter_chicken');
    assert.strictEqual(dish.pricePaise, 46000, 'Price must be updated in DB');
  });

  test('toggleDishAvailability: authorized admin succeeds and toggles availability', async () => {
    const res = await toggleDishAvailability(ctx, {
      id: 'dish_butter_chicken',
      isAvailable: false,
      sessionToken: adminToken,
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.error, undefined);

    const dish = await ctx.db.get('dish_butter_chicken');
    assert.strictEqual(dish.isAvailable, false);
  });

  test('addEmployee: authorized admin succeeds and stores new employee', async () => {
    const res = await addEmployee(ctx, {
      name: 'Deepak Verma',
      role: 'manager',
      email: 'deepak@thegoldenoak.in',
      phone: '9811223344',
      isActive: true,
      sessionToken: adminToken,
    });
    assert.strictEqual(res.success, true);
    assert.ok(res.employeeId);

    const emp = await ctx.db.get(res.employeeId);
    assert.strictEqual(emp.name, 'Deepak Verma');
    assert.strictEqual(emp.role, 'manager');
    assert.strictEqual(emp.isActive, true);
  });

  test('removeEmployee: authorized admin succeeds and removes employee', async () => {
    const res = await removeEmployee(ctx, {
      employeeId: 'emp_01',
      sessionToken: adminToken,
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.error, undefined);

    const emp = await ctx.db.get('emp_01');
    assert.strictEqual(emp, null, 'Employee must be deleted from DB');
  });

  test('createTable: authorized admin succeeds and creates new table', async () => {
    const res = await createTable(ctx, {
      tableNumber: 15,
      capacity: 8,
      status: 'available',
      notes: 'VIP Garden Table',
      sessionToken: adminToken,
    });
    assert.strictEqual(res.success, true);
    assert.ok(res.tableId);

    const table = await ctx.db.get(res.tableId);
    assert.strictEqual(table.tableNumber, 15);
    assert.strictEqual(table.capacity, 8);
    assert.strictEqual(table.status, 'available');
  });

  test('updateTableStatus: authorized admin and staff sessions succeed', async () => {
    // 1. Employee sets table to reserved
    const res1 = await updateTableStatus(ctx, {
      tableId: 'table_t1',
      status: 'reserved',
      sessionToken: employeeToken,
    });
    assert.strictEqual(res1.success, true);
    let table = await ctx.db.get('table_t1');
    assert.strictEqual(table.status, 'reserved');

    // 2. Admin sets table to maintenance
    const res2 = await updateTableStatus(ctx, {
      tableId: 'table_t1',
      status: 'maintenance',
      sessionToken: adminToken,
    });
    assert.strictEqual(res2.success, true);
    table = await ctx.db.get('table_t1');
    assert.strictEqual(table.status, 'maintenance');
  });

  test('updateSetting: authorized admin succeeds and updates setting', async () => {
    const res = await updateSetting(ctx, {
      key: 'tax_rate_percent',
      value: 12,
      sessionToken: adminToken,
    });
    assert.strictEqual(res.success, true);

    const setting = await ctx.db.query('restaurant_settings').withIndex('by_key', (q) => q.eq('key', 'tax_rate_percent')).first();
    assert.strictEqual(setting.value, 12);
  });

  test('updateOrderStatus: authorized staff & admin succeed through valid state machine', async () => {
    // Order starts at 'pending'
    // 1. Chef confirms order
    const res1 = await updateOrderStatus(ctx, {
      orderId: 'order_101',
      status: 'confirmed',
      sessionToken: chefToken,
    });
    assert.strictEqual(res1.success, true);
    let order = await ctx.db.get('order_101');
    assert.strictEqual(order.status, 'confirmed');

    // 2. Chef updates order to preparing
    const res2 = await updateOrderStatus(ctx, {
      orderId: 'order_101',
      status: 'preparing',
      sessionToken: chefToken,
    });
    assert.strictEqual(res2.success, true);
    order = await ctx.db.get('order_101');
    assert.strictEqual(order.status, 'preparing');

    // 3. Admin updates order to ready
    const res3 = await updateOrderStatus(ctx, {
      orderId: 'order_101',
      status: 'ready',
      sessionToken: adminToken,
    });
    assert.strictEqual(res3.success, true);
    order = await ctx.db.get('order_101');
    assert.strictEqual(order.status, 'ready');
  });

  test('provisionPrivilegedAccount: authorized admin creates new manager account', async () => {
    const res = await provisionPrivilegedAccount(ctx, {
      email: 'newmanager@thegoldenoak.in',
      password: 'SafePassword!2026',
      name: 'Karan Mehra',
      role: 'manager',
      sessionToken: adminToken,
    });
    assert.strictEqual(res.success, true);
    assert.ok(res.userId);

    const user = await ctx.db.get(res.userId);
    assert.strictEqual(user.email, 'newmanager@thegoldenoak.in');
    assert.strictEqual(user.name, 'Karan Mehra');
    assert.strictEqual(user.role, 'manager');
    assert.strictEqual(user.isActive, true);
  });

  test('provisionPrivilegedAccount: works with adminSessionToken arg alias', async () => {
    const res = await provisionPrivilegedAccount(ctx, {
      email: 'secondadmin@thegoldenoak.in',
      password: 'SafePassword!2026',
      name: 'Co-Owner',
      role: 'admin',
      adminSessionToken: adminToken,
    });
    assert.strictEqual(res.success, true);
    assert.ok(res.userId);
  });
});

// ============================================================================
// TEST SUITE 5: Zero-Trust Boundary & Session Resiliency Verification
// ============================================================================

describe('Suite 5: Zero-Trust Boundary & Session Resiliency Verification', () => {
  let ctx;

  beforeEach(() => {
    ctx = createStandardSecurityFixture();
  });

  test('handles session tokens with leading and trailing whitespace gracefully', async () => {
    const whitespaceAdminToken = '   admin-live-token-secret-123   ';
    const res = await updateDishPrice(ctx, {
      id: 'dish_butter_chicken',
      pricePaise: 44000,
      sessionToken: whitespaceAdminToken,
    });
    assert.strictEqual(res.success, true, 'Trimmed token should match valid admin session');

    const dish = await ctx.db.get('dish_butter_chicken');
    assert.strictEqual(dish.pricePaise, 44000);
  });

  test('repeated unauthenticated probes do not degrade or mutate storage', async () => {
    for (let i = 0; i < 20; i++) {
      const res = await updateDishPrice(ctx, {
        id: 'dish_butter_chicken',
        pricePaise: i * 1000,
        sessionToken: `attacker-probe-${i}`,
      });
      assert.strictEqual(res.error, 'Unauthorized: Invalid session token.');
    }
    const dish = await ctx.db.get('dish_butter_chicken');
    assert.strictEqual(dish.pricePaise, 42000, 'Price must remain unchanged after 20 hostile attempts');
  });

  test('rejects non-existent dish or table gracefully after successful auth', async () => {
    const resDish = await updateDishPrice(ctx, {
      id: 'non-existent-dish-id',
      pricePaise: 30000,
      sessionToken: 'admin-live-token-secret-123',
    });
    assert.strictEqual(resDish.success, undefined);
    assert.strictEqual(resDish.error, 'Dish not found');

    const resTable = await updateTableStatus(ctx, {
      tableId: 'non-existent-table-id',
      status: 'occupied',
      sessionToken: 'admin-live-token-secret-123',
    });
    assert.strictEqual(resTable.success, undefined);
    assert.strictEqual(resTable.error, 'Table not found');
  });
});

// ============================================================================
// TEST SUITE 6: Seed Security & Privileged Provisioning Lockdown
// ============================================================================

describe('Suite 6: Seed Security & Privileged Provisioning Lockdown', () => {
  // --------------------------------------------------------------------------
  // Static Source Assertions
  // --------------------------------------------------------------------------

  test('[Static Source] convex/seed.ts does not export public seedPrivilegedAccounts mutation', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const seedPath = path.resolve('convex/seed.ts');
    const content = fs.readFileSync(seedPath, 'utf8');

    assert.strictEqual(
      content.includes('seedPrivilegedAccounts'),
      false,
      'seedPrivilegedAccounts must be completely removed from convex/seed.ts'
    );
  });

  test('[Static Source] convex/seed.ts defines seedDatabase as internalMutation (not public mutation)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const seedPath = path.resolve('convex/seed.ts');
    const content = fs.readFileSync(seedPath, 'utf8');

    assert.ok(
      content.includes('export const seedDatabase = internalMutation'),
      'seedDatabase must be defined using internalMutation'
    );
    assert.strictEqual(
      content.includes('export const seedDatabase = mutation'),
      false,
      'seedDatabase must not be exported as a public mutation'
    );
  });

  test('[Static Source] convex/seed.ts contains zero hardcoded passwords, salts, or personal emails', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const seedPath = path.resolve('convex/seed.ts');
    const content = fs.readFileSync(seedPath, 'utf8');

    const forbiddenPatterns = [
      /password\s*[:=]/i,
      /hashSeedPassword/i,
      /@(?:gmail|yahoo|hotmail|outlook|proton).com/i,
      new RegExp(Buffer.from('OTQ5NDUwOTczMQ==', 'base64').toString()),
      /Admin@GoldenOak/i,
      /Staff@GoldenOak/i,
      /saltAdmin/i,
      /saltStaff/i,
    ];

    for (const pattern of forbiddenPatterns) {
      assert.strictEqual(
        pattern.test(content),
        false,
        `convex/seed.ts must not contain pattern matching ${pattern}`
      );
    }
  });

  test('[Static Source] convex/auth.ts defines provisionPrivilegedAccount as internalMutation and NOT public mutation', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const authPath = path.resolve('convex/auth.ts');
    const content = fs.readFileSync(authPath, 'utf8');

    assert.ok(
      /export\s+const\s+provisionPrivilegedAccount\s*=\s*internalMutation\(/.test(content),
      'provisionPrivilegedAccount must be defined using internalMutation in convex/auth.ts'
    );
    assert.strictEqual(
      /export\s+const\s+provisionPrivilegedAccount\s*=\s*mutation\(/.test(content),
      false,
      'provisionPrivilegedAccount must not be exported as a public mutation in convex/auth.ts'
    );
    assert.ok(
      content.includes('internalMutation'),
      'convex/auth.ts must import and use internalMutation'
    );
  });

  test('[Static Source] provisionPrivilegedAccount is strictly absent from public API surface and client callers', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    // 1. Verify convex/auth.ts only exports public functions through mutation / query
    const authPath = path.resolve('convex/auth.ts');
    const authContent = fs.readFileSync(authPath, 'utf8');
    const publicExports = [...authContent.matchAll(/export\s+const\s+(\w+)\s*=\s*(?:mutation|query)\(/g)].map(
      (m) => m[1]
    );
    assert.strictEqual(
      publicExports.includes('provisionPrivilegedAccount'),
      false,
      'provisionPrivilegedAccount must not be present in public exports of convex/auth.ts'
    );

    // 2. Scan all files in convex/ to ensure provisionPrivilegedAccount is nowhere defined as a public mutation
    const convexFiles = fs
      .readdirSync(path.resolve('convex'))
      .filter((name) => name.endsWith('.ts') && !name.endsWith('.bak'))
      .map((name) => path.resolve('convex', name));

    for (const file of convexFiles) {
      const fileContent = fs.readFileSync(file, 'utf8');
      assert.strictEqual(
        /export\s+const\s+provisionPrivilegedAccount\s*=\s*(?:mutation|query|action)\(/.test(fileContent),
        false,
        `${file} must not expose provisionPrivilegedAccount as a public API`
      );
    }

    // 3. Scan all client-facing files in src/ to ensure no client calls api.auth.provisionPrivilegedAccount
    const findFiles = (dir) => {
      let results = [];
      const list = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of list) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...findFiles(fullPath));
        } else if (/\.(tsx?|jsx?|mjs)$/.test(entry.name) && !entry.name.endsWith('.bak')) {
          results.push(fullPath);
        }
      }
      return results;
    };

    const srcFiles = findFiles(path.resolve('src'));
    for (const filePath of srcFiles) {
      const srcContent = fs.readFileSync(filePath, 'utf8');
      assert.strictEqual(
        srcContent.includes('api.auth.provisionPrivilegedAccount'),
        false,
        `${filePath} must not reference api.auth.provisionPrivilegedAccount`
      );
      assert.strictEqual(
        srcContent.includes('provisionPrivilegedAccount'),
        false,
        `${filePath} must not reference provisionPrivilegedAccount`
      );
    }
  });

  // --------------------------------------------------------------------------
  // Mock Behavioral Tests
  // --------------------------------------------------------------------------

  test('[Mock Behavioral] internal provisioning: cryptographically hashes passwords with random salts and omits raw secrets', async () => {
    const ctx = createMockDatabase();

    // Internal system execution provisions the initial admin account
    const res1 = await provisionPrivilegedAccount(ctx, {
      email: 'owner@thegoldenoak.in',
      name: 'Restaurant Owner',
      password: 'SecureAdminPassword#2026',
      role: 'admin',
    });
    assert.strictEqual(res1.success, true);
    assert.ok(res1.userId);

    const user1 = await ctx.db.get(res1.userId);
    assert.strictEqual(user1.email, 'owner@thegoldenoak.in');
    assert.strictEqual(user1.role, 'admin');
    assert.strictEqual(user1.isActive, true);

    // Cryptographic security assertions
    assert.strictEqual(user1.password, undefined, 'Plaintext password must NEVER be stored');
    assert.match(user1.salt, /^[0-9a-f]{32}$/, 'Salt must be a 16-byte (32 hex char) random string');
    assert.match(user1.passwordHash, /^[0-9a-f]{64}$/, 'Password hash must be a 256-bit (64 hex char) PBKDF2 hash');
    assert.notStrictEqual(user1.passwordHash, 'SecureAdminPassword#2026', 'Password must be securely hashed');

    // Establish admin session token to provision a second user with the IDENTICAL password
    const adminToken = 'admin-session-sec6-001';
    ctx.db._tables.sessions.push({
      _id: 'session_sec6_001',
      token: adminToken,
      userId: user1._id,
      role: 'admin',
      expiresAt: Date.now() + 3600 * 1000,
      createdAt: Date.now(),
    });

    const res2 = await provisionPrivilegedAccount(ctx, {
      sessionToken: adminToken,
      email: 'manager@thegoldenoak.in',
      name: 'Restaurant Manager',
      password: 'SecureAdminPassword#2026', // same password
      role: 'manager',
    });
    assert.strictEqual(res2.success, true);
    assert.ok(res2.userId);

    const user2 = await ctx.db.get(res2.userId);
    assert.strictEqual(user2.password, undefined, 'Plaintext password must NEVER be stored');
    assert.notStrictEqual(user2.salt, user1.salt, 'Unique random salt must be generated per account');
    assert.notStrictEqual(user2.passwordHash, user1.passwordHash, 'Unique salt prevents identical hashes for identical passwords');
  });

  test('[Mock Behavioral] internal provisioning: enforces strict admin session token requirement once an admin exists', async () => {
    const ctx = createMockDatabase();

    // 1. Initial internal provisioning bootstraps first admin in DB
    const initRes = await provisionPrivilegedAccount(ctx, {
      email: 'owner@thegoldenoak.in',
      name: 'Owner',
      password: 'SecurePassphrase#2026',
      role: 'admin',
    });
    assert.strictEqual(initRes.success, true);
    const adminId = initRes.userId;

    // Verify admin exists in db
    const createdAdmin = await ctx.db.get(adminId);
    assert.strictEqual(createdAdmin.role, 'admin');

    // 2. Once an admin exists, subsequent internal calls lacking an admin token are strictly REJECTED
    const unauthRes = await provisionPrivilegedAccount(ctx, {
      email: 'unauth@thegoldenoak.in',
      name: 'Unauth Candidate',
      password: 'SomePassword#2026',
      role: 'admin',
    });
    assert.strictEqual(unauthRes.error, 'Unauthorized: Missing session token.');

    // 3. Subsequent internal call with customer role session is strictly FORBIDDEN
    const customerToken = 'customer-session-token-sec6';
    ctx.db._tables.sessions.push({
      _id: 'session_cust_sec6',
      token: customerToken,
      userId: 'user_cust_sec6',
      role: 'customer',
      expiresAt: Date.now() + 3600 * 1000,
      createdAt: Date.now(),
    });
    ctx.db._tables.users.push({
      _id: 'user_cust_sec6',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'customer',
      isActive: true,
      createdAt: Date.now(),
    });

    const custRes = await provisionPrivilegedAccount(ctx, {
      sessionToken: customerToken,
      email: 'escalate@evil.com',
      name: 'Escalated',
      password: 'EscalatedPass#2026',
      role: 'admin',
    });
    assert.strictEqual(
      custRes.error,
      'Forbidden: Action requires role [admin], but account has role "customer".'
    );

    // 4. Subsequent internal call with employee/waiter role session is also FORBIDDEN
    const waiterToken = 'waiter-session-token-sec6';
    ctx.db._tables.sessions.push({
      _id: 'session_waiter_sec6',
      token: waiterToken,
      userId: 'user_waiter_sec6',
      role: 'waiter',
      expiresAt: Date.now() + 3600 * 1000,
      createdAt: Date.now(),
    });
    ctx.db._tables.users.push({
      _id: 'user_waiter_sec6',
      email: 'waiter@thegoldenoak.in',
      name: 'Waiter',
      role: 'waiter',
      isActive: true,
      createdAt: Date.now(),
    });

    const waiterRes = await provisionPrivilegedAccount(ctx, {
      sessionToken: waiterToken,
      email: 'chef@thegoldenoak.in',
      name: 'New Chef',
      password: 'ChefPassword#2026',
      role: 'chef',
    });
    assert.strictEqual(
      waiterRes.error,
      'Forbidden: Action requires role [admin], but account has role "waiter".'
    );

    // 5. Authorized admin session succeeds in provisioning new staff accounts
    const adminToken = 'admin-session-token-sec6';
    ctx.db._tables.sessions.push({
      _id: 'session_admin_sec6',
      token: adminToken,
      userId: adminId,
      role: 'admin',
      expiresAt: Date.now() + 3600 * 1000,
      createdAt: Date.now(),
    });

    const authAdminRes = await provisionPrivilegedAccount(ctx, {
      sessionToken: adminToken,
      email: 'chef@thegoldenoak.in',
      name: 'Head Chef',
      password: 'ChefPassword#2026',
      role: 'chef',
    });
    assert.strictEqual(authAdminRes.success, true);
    assert.strictEqual(authAdminRes.created, true);
    assert.ok(authAdminRes.userId);

    const createdChef = await ctx.db.get(authAdminRes.userId);
    assert.strictEqual(createdChef.email, 'chef@thegoldenoak.in');
    assert.strictEqual(createdChef.role, 'chef');
  });
});
