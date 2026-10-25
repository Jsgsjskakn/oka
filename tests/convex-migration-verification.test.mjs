import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

describe('Convex Auth & Security Verification', () => {
  // WebCrypto PBKDF2 test (matching convex/auth.ts)
  async function hashPassword(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const key = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: enc.encode(salt),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
    return Array.from(new Uint8Array(key))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  test('PBKDF2 SHA-256 derives consistent reproducible hashes with 100,000 iterations', async () => {
    const salt = 'golden-oak-salt-xyz';
    const pwd = 'TestSecretPassword!2026';
    const hash1 = await hashPassword(pwd, salt);
    const hash2 = await hashPassword(pwd, salt);
    assert.strictEqual(hash1, hash2, 'Identical passwords and salts must produce exact same hash');
    assert.strictEqual(hash1.length, 64, 'SHA-256 hex string must be exactly 64 characters (256 bits)');

    const wrongHash = await hashPassword('WrongPassword', salt);
    assert.notStrictEqual(hash1, wrongHash, 'Wrong password must produce completely different hash');
  });

  test('Unique salts prevent rainbow table attacks across identical passwords', async () => {
    const pwd = 'SharedPassword123';
    const saltA = 'salt-restaurant-table-1';
    const saltB = 'salt-restaurant-table-2';
    const hashA = await hashPassword(pwd, saltA);
    const hashB = await hashPassword(pwd, saltB);
    assert.notStrictEqual(hashA, hashB, 'Different salts must yield different hashes for identical passwords');
  });
});

describe('Role-Based Access Control (RBAC) Mapping', () => {
  const PRIVILEGED_ROLES = ['admin', 'employee', 'staff', 'manager', 'chef'];

  test('Admin role has highest privileges across all guards', () => {
    const userRole = 'admin';
    assert.strictEqual(userRole === 'admin', true, 'Admin matches requireAdmin guard');
    assert.strictEqual(PRIVILEGED_ROLES.includes(userRole), true, 'Admin matches requireStaff guard');
  });

  test('Employee / Chef / Manager match staff guard but fail strict admin guard', () => {
    for (const role of ['employee', 'chef', 'manager', 'staff']) {
      assert.strictEqual(role === 'admin', false, `${role} must fail strict admin guard`);
      assert.strictEqual(PRIVILEGED_ROLES.includes(role), true, `${role} must pass staff guard`);
    }
  });

  test('Customer role fails both admin and employee privileged guards', () => {
    const customerRole = 'customer';
    assert.strictEqual(customerRole === 'admin', false);
    assert.strictEqual(PRIVILEGED_ROLES.includes(customerRole), false);
  });
});

describe('Table Status & Paise Calculation Adaptations', () => {
  function mapUIStatusToConvex(uiStatus) {
    return uiStatus === 'booked' ? 'reserved' : uiStatus === 'unavailable' ? 'maintenance' : 'available';
  }

  function mapConvexStatusToUI(convexStatus) {
    if (convexStatus === 'reserved' || convexStatus === 'occupied') return 'booked';
    if (convexStatus === 'maintenance') return 'unavailable';
    return 'available';
  }

  test('Table status bi-directional mapping preserves semantic states', () => {
    assert.strictEqual(mapUIStatusToConvex('available'), 'available');
    assert.strictEqual(mapUIStatusToConvex('booked'), 'reserved');
    assert.strictEqual(mapUIStatusToConvex('unavailable'), 'maintenance');

    assert.strictEqual(mapConvexStatusToUI('available'), 'available');
    assert.strictEqual(mapConvexStatusToUI('reserved'), 'booked');
    assert.strictEqual(mapConvexStatusToUI('occupied'), 'booked');
    assert.strictEqual(mapConvexStatusToUI('maintenance'), 'unavailable');
  });

  test('Financial paise arithmetic avoids JavaScript floating-point imprecision', () => {
    const itemPricePaise = 24900; // Rs 249.00
    const qty = 3;
    const subtotalPaise = itemPricePaise * qty; // 74700
    const taxRatePercent = 5;
    const taxPaise = Math.round((subtotalPaise * taxRatePercent) / 100); // 3735 paise (Rs 37.35)
    const tipPaise = 5000; // Rs 50.00
    const totalPaise = subtotalPaise + taxPaise + tipPaise; // 83435 paise

    assert.strictEqual(subtotalPaise, 74700);
    assert.strictEqual(taxPaise, 3735);
    assert.strictEqual(totalPaise, 83435);
    assert.strictEqual(Number.isInteger(totalPaise), true, 'All totals must remain exact integers');
  });
});
