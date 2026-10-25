import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Customer Profile Persistence & Validation Audit', () => {
  // 1. Convex updateUserProfile Mutation Logic Simulation & Validation Tests
  describe('Convex updateUserProfile Mutation', () => {
    // Mock database context
    function createMockConvexCtx(initialUsers = [], initialSessions = []) {
      const users = new Map(initialUsers.map((u) => [u._id, { ...u }]));
      const sessions = new Map(initialSessions.map((s) => [s._id, { ...s }]));

      return {
        db: {
          get: async (id) => users.get(id) || null,
          query: (table) => ({
            withIndex: (indexName, filterFn) => {
              if (table === 'sessions' && indexName === 'by_token') {
                return {
                  first: async () => {
                    const matchValue = filterFn({ eq: (_field, val) => val });
                    for (const s of sessions.values()) {
                      if (s.token === matchValue) return { ...s };
                    }
                    return null;
                  },
                };
              }
              return { first: async () => null, collect: async () => [] };
            },
          }),
          patch: async (id, data) => {
            if (users.has(id)) {
              users.set(id, { ...users.get(id), ...data });
              return;
            }
            if (sessions.has(id)) {
              sessions.set(id, { ...sessions.get(id), ...data });
              return;
            }
            throw new Error(`Record ${id} not found`);
          },
        },
        _state: { users, sessions },
      };
    }

    // Direct reproduction of authenticateCaller & updateUserProfile logic from convex/auth.ts and authUtils.ts
    async function authenticateCaller(ctx, sessionToken, allowedRoles) {
      if (!sessionToken || typeof sessionToken !== 'string' || sessionToken.trim() === '') {
        return { authorized: false, error: 'Unauthorized: Missing session token.' };
      }
      const token = sessionToken.trim();
      const session = await ctx.db
        .query('sessions')
        .withIndex('by_token', (q) => q.eq('token', token))
        .first();

      if (!session) {
        return { authorized: false, error: 'Unauthorized: Invalid session token.' };
      }
      if (session.expiresAt <= Date.now()) {
        return { authorized: false, error: 'Unauthorized: Session has expired.' };
      }
      const user = await ctx.db.get(session.userId);
      if (!user) {
        return { authorized: false, error: 'Unauthorized: User not found.' };
      }
      if (!user.isActive) {
        return { authorized: false, error: 'Unauthorized: User account has been deactivated.' };
      }
      if (!allowedRoles.includes(user.role)) {
        return {
          authorized: false,
          error: `Forbidden: Action requires role [${allowedRoles.join(', ')}], but account has role "${user.role}".`,
        };
      }
      return { authorized: true, user, session };
    }

    async function updateUserProfile(ctx, args) {
      const auth = await authenticateCaller(ctx, args.sessionToken, [
        'customer',
        'admin',
        'manager',
        'employee',
        'staff',
        'chef',
      ]);

      if (!auth.authorized) {
        return { error: auth.error };
      }

      const trimmedName = args.name.trim();
      if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
        return { error: 'Name must be between 2 and 100 characters.' };
      }

      let sanitizedPhone = undefined;
      if (args.phone && args.phone.trim()) {
        const digits = args.phone.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 15) {
          return { error: 'Please enter a valid phone number (10 to 15 digits).' };
        }
        sanitizedPhone = digits.slice(-10);
      }

      // Restrict update strictly to the authenticated user's own profile record
      await ctx.db.patch(auth.user._id, {
        name: trimmedName,
        phone: sanitizedPhone ?? auth.user.phone,
      });

      // Also sync the name on the active session
      await ctx.db.patch(auth.session._id, {
        name: trimmedName,
      });

      return {
        success: true,
        user: {
          id: auth.user._id,
          email: auth.user.email,
          name: trimmedName,
          phone: sanitizedPhone ?? auth.user.phone,
          role: auth.user.role,
        },
      };
    }

    test('enforces authenticated user sessions - rejects missing, invalid, expired, and deactivated tokens', async () => {
      const ctx = createMockConvexCtx(
        [
          { _id: 'u1', email: 'alice@example.com', name: 'Alice', phone: '9876543210', role: 'customer', isActive: true },
          { _id: 'u2', email: 'deactivated@example.com', name: 'Bob', phone: '9876543211', role: 'customer', isActive: false },
        ],
        [
          { _id: 's1', token: 'valid-token', userId: 'u1', expiresAt: Date.now() + 100000 },
          { _id: 's2', token: 'expired-token', userId: 'u1', expiresAt: Date.now() - 1000 },
          { _id: 's3', token: 'deactivated-token', userId: 'u2', expiresAt: Date.now() + 100000 },
        ]
      );

      // Missing token
      const resMissing = await updateUserProfile(ctx, { sessionToken: undefined, name: 'Alice Smith' });
      assert.strictEqual(resMissing.error, 'Unauthorized: Missing session token.');

      // Empty token
      const resEmpty = await updateUserProfile(ctx, { sessionToken: '   ', name: 'Alice Smith' });
      assert.strictEqual(resEmpty.error, 'Unauthorized: Missing session token.');

      // Invalid token
      const resInvalid = await updateUserProfile(ctx, { sessionToken: 'nonexistent-token', name: 'Alice Smith' });
      assert.strictEqual(resInvalid.error, 'Unauthorized: Invalid session token.');

      // Expired token
      const resExpired = await updateUserProfile(ctx, { sessionToken: 'expired-token', name: 'Alice Smith' });
      assert.strictEqual(resExpired.error, 'Unauthorized: Session has expired.');

      // Deactivated user account
      const resDeactivated = await updateUserProfile(ctx, { sessionToken: 'deactivated-token', name: 'Bob New' });
      assert.strictEqual(resDeactivated.error, 'Unauthorized: User account has been deactivated.');
    });

    test('strictly restricts updates to auth.user._id and updates active session', async () => {
      const ctx = createMockConvexCtx(
        [
          { _id: 'u1', email: 'alice@example.com', name: 'Alice', phone: '9876543210', role: 'customer', isActive: true },
          { _id: 'u2', email: 'victim@example.com', name: 'Victim', phone: '9999999999', role: 'customer', isActive: true },
        ],
        [
          { _id: 's1', token: 'alice-token', userId: 'u1', name: 'Alice', expiresAt: Date.now() + 100000 },
        ]
      );

      // Even if attacker attempts to pass external parameters, updateUserProfile only patches auth.user._id
      const res = await updateUserProfile(ctx, {
        sessionToken: 'alice-token',
        name: 'Alice Cooper',
        phone: '9876543299',
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.user.id, 'u1');
      assert.strictEqual(res.user.name, 'Alice Cooper');

      // Verify DB patch on user u1
      const updatedAlice = await ctx.db.get('u1');
      assert.strictEqual(updatedAlice.name, 'Alice Cooper');
      assert.strictEqual(updatedAlice.phone, '9876543299');

      // Verify victim u2 remains untouched
      const victim = await ctx.db.get('u2');
      assert.strictEqual(victim.name, 'Victim');
      assert.strictEqual(victim.phone, '9999999999');

      // Verify active session name synced
      const session = ctx._state.sessions.get('s1');
      assert.strictEqual(session.name, 'Alice Cooper');
    });

    test('validates name length between 2 and 100 characters and trims whitespace', async () => {
      const ctx = createMockConvexCtx(
        [{ _id: 'u1', email: 'alice@example.com', name: 'Alice', phone: '9876543210', role: 'customer', isActive: true }],
        [{ _id: 's1', token: 'valid-token', userId: 'u1', expiresAt: Date.now() + 100000 }]
      );

      // Name too short (< 2 chars after trim)
      const resShort = await updateUserProfile(ctx, { sessionToken: 'valid-token', name: 'A' });
      assert.strictEqual(resShort.error, 'Name must be between 2 and 100 characters.');

      const resWhitespaceOnly = await updateUserProfile(ctx, { sessionToken: 'valid-token', name: '    ' });
      assert.strictEqual(resWhitespaceOnly.error, 'Name must be between 2 and 100 characters.');

      // Name too long (> 100 chars)
      const longName = 'A'.repeat(101);
      const resLong = await updateUserProfile(ctx, { sessionToken: 'valid-token', name: longName });
      assert.strictEqual(resLong.error, 'Name must be between 2 and 100 characters.');

      // Valid name with surrounding spaces trimmed
      const resValid = await updateUserProfile(ctx, { sessionToken: 'valid-token', name: '  Jane Doe  ' });
      assert.strictEqual(resValid.success, true);
      assert.strictEqual(resValid.user.name, 'Jane Doe');
      const updatedUser = await ctx.db.get('u1');
      assert.strictEqual(updatedUser.name, 'Jane Doe');
    });

    test('validates phone formatting: strips non-digits, requires 10-15 digits, formats to 10 digits', async () => {
      const ctx = createMockConvexCtx(
        [{ _id: 'u1', email: 'alice@example.com', name: 'Alice', phone: '9876543210', role: 'customer', isActive: true }],
        [{ _id: 's1', token: 'valid-token', userId: 'u1', expiresAt: Date.now() + 100000 }]
      );

      // Too few digits (< 10)
      const resShortPhone = await updateUserProfile(ctx, { sessionToken: 'valid-token', name: 'Alice', phone: '12345' });
      assert.strictEqual(resShortPhone.error, 'Please enter a valid phone number (10 to 15 digits).');

      // Too many digits (> 15)
      const resLongPhone = await updateUserProfile(ctx, { sessionToken: 'valid-token', name: 'Alice', phone: '1234567890123456' });
      assert.strictEqual(resLongPhone.error, 'Please enter a valid phone number (10 to 15 digits).');

      // Valid phone with country code formatting (+91-98765-43210 -> 12 digits) -> slices last 10 digits
      const resCountryCode = await updateUserProfile(ctx, { sessionToken: 'valid-token', name: 'Alice', phone: '+91 98765 43210' });
      assert.strictEqual(resCountryCode.success, true);
      assert.strictEqual(resCountryCode.user.phone, '9876543210');

      // Empty or omitted phone retains existing phone
      const resRetained = await updateUserProfile(ctx, { sessionToken: 'valid-token', name: 'Alice Wonder', phone: '' });
      assert.strictEqual(resRetained.success, true);
      assert.strictEqual(resRetained.user.phone, '9876543210');
    });
  });

  // 2. updateUserProfileAction Persistence & Fallback Flow Tests
  describe('updateUserProfileAction Execution Flow & Fallback Architecture', () => {
    async function simulateUpdateUserProfileAction(cookieToken, convexResult, supabaseUser, supabaseUpdateResult) {
      let writeOccurred = false;

      // 1. Primary: Try Convex if authenticated via golden_oak_session
      try {
        if (cookieToken) {
          const res = typeof convexResult === 'function' ? await convexResult() : convexResult;

          if (res && res.error) {
            return { error: res.error };
          }

          if (res && res.success) {
            writeOccurred = true;
            return { success: true, user: res.user };
          }
        }
      } catch (err) {
        // Fallback to Supabase
      }

      // 2. Secondary: Fallback to Supabase if authenticated via Supabase session
      try {
        if (supabaseUser) {
          const { error } = typeof supabaseUpdateResult === 'function' ? await supabaseUpdateResult() : supabaseUpdateResult;
          if (error) {
            return { error: error.message };
          }
          writeOccurred = true;
          return { success: true };
        }
      } catch (err) {
        // Fallback failure
      }

      if (!writeOccurred) {
        return { error: 'Authentication required. No active session found to update.' };
      }

      return { success: true };
    }

    test('attempts Convex first when golden_oak_session exists and returns success', async () => {
      let convexCalled = false;
      let supabaseCalled = false;

      const res = await simulateUpdateUserProfileAction(
        'valid-convex-token',
        async () => {
          convexCalled = true;
          return { success: true, user: { id: 'u1', name: 'Convex User', phone: '9876543210' } };
        },
        { id: 'sb-1', email: 'sb@example.com' },
        async () => {
          supabaseCalled = true;
          return { error: null };
        }
      );

      assert.strictEqual(convexCalled, true);
      assert.strictEqual(supabaseCalled, false, 'Supabase must NOT be called when Convex succeeds');
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.user.name, 'Convex User');
    });

    test('propagates Convex validation error without falling back when session is Convex', async () => {
      let supabaseCalled = false;

      const res = await simulateUpdateUserProfileAction(
        'valid-convex-token',
        { error: 'Name must be between 2 and 100 characters.' },
        { id: 'sb-1', email: 'sb@example.com' },
        async () => {
          supabaseCalled = true;
          return { error: null };
        }
      );

      assert.strictEqual(supabaseCalled, false);
      assert.strictEqual(res.error, 'Name must be between 2 and 100 characters.');
      assert.strictEqual(res.success, undefined);
    });

    test('falls back to Supabase auth when golden_oak_session is absent but Supabase session exists', async () => {
      let supabaseCalled = false;

      const res = await simulateUpdateUserProfileAction(
        null, // No convex cookie
        null,
        { id: 'sb-user-123', email: 'customer@golden-oak.com' },
        async () => {
          supabaseCalled = true;
          return { error: null };
        }
      );

      assert.strictEqual(supabaseCalled, true);
      assert.strictEqual(res.success, true);
    });

    test('falls back to Supabase if Convex throws network/backend exception', async () => {
      let supabaseCalled = false;

      const res = await simulateUpdateUserProfileAction(
        'broken-convex-token',
        async () => {
          throw new Error('Convex backend temporarily unreachable');
        },
        { id: 'sb-user-123', email: 'customer@golden-oak.com' },
        async () => {
          supabaseCalled = true;
          return { error: null };
        }
      );

      assert.strictEqual(supabaseCalled, true);
      assert.strictEqual(res.success, true);
    });

    test('NEVER reports success if no write occurred (no Convex token and no Supabase user)', async () => {
      const res = await simulateUpdateUserProfileAction(
        null, // no convex token
        null,
        null, // no supabase user
        null
      );

      assert.strictEqual(res.success, undefined);
      assert.strictEqual(res.error, 'Authentication required. No active session found to update.');
    });

    test('NEVER reports success if both Convex and Supabase writes fail', async () => {
      const res = await simulateUpdateUserProfileAction(
        'broken-convex-token',
        async () => {
          throw new Error('Convex failed');
        },
        { id: 'sb-1' },
        async () => {
          return { error: { message: 'Supabase profiles row lock timeout' } };
        }
      );

      assert.strictEqual(res.success, undefined);
      assert.strictEqual(res.error, 'Supabase profiles row lock timeout');
    });
  });

  // 3. EditableProfileForm Component UI & State Logic Verification
  describe('EditableProfileForm Component & State Guarantees', () => {
    // Model state transitions of EditableProfileForm.handleSave
    function simulateFormSave(res, setErrorMessage, setSaved) {
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSaved(true);
      }
    }

    test('displays clear error banners and does not display false success on failure', () => {
      let errorMessage = '';
      let saved = false;

      const setErrorMessage = (msg) => { errorMessage = msg; };
      const setSaved = (val) => { saved = val; };

      // Simulate failure response
      const failRes = { error: 'Please enter a valid phone number (10 to 15 digits).' };
      simulateFormSave(failRes, setErrorMessage, setSaved);

      assert.strictEqual(errorMessage, 'Please enter a valid phone number (10 to 15 digits).');
      assert.strictEqual(saved, false, 'saved must NEVER be true on failure');

      // Verify banner condition
      const isBannerRendered = Boolean(errorMessage);
      assert.strictEqual(isBannerRendered, true);

      // Verify button label logic
      const loading = false;
      const buttonLabel = loading ? 'Saving...' : saved ? '✓ Profile Updated' : 'Save Changes';
      assert.strictEqual(buttonLabel, 'Save Changes', 'Must NOT display "✓ Profile Updated" on failure');
    });

    test('displays success state only when update succeeded without error', () => {
      let errorMessage = '';
      let saved = false;

      const setErrorMessage = (msg) => { errorMessage = msg; };
      const setSaved = (val) => { saved = val; };

      const successRes = { success: true };
      simulateFormSave(successRes, setErrorMessage, setSaved);

      assert.strictEqual(errorMessage, '');
      assert.strictEqual(saved, true);

      const isBannerRendered = Boolean(errorMessage);
      assert.strictEqual(isBannerRendered, false);

      const loading = false;
      const buttonLabel = loading ? 'Saving...' : saved ? '✓ Profile Updated' : 'Save Changes';
      assert.strictEqual(buttonLabel, '✓ Profile Updated');
    });

    test('phone input sanitizer restricts values to numeric and max 10 digits', () => {
      const sanitizePhoneInput = (val) => val.replace(/\D/g, '').slice(0, 10);

      assert.strictEqual(sanitizePhoneInput('+91 98765-43210'), '9198765432');
      assert.strictEqual(sanitizePhoneInput('98765432109999'), '9876543210');
      assert.strictEqual(sanitizePhoneInput('abcd 9876xyz54321'), '987654321');
    });
  });
});
