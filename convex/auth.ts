import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { authenticateCaller, ADMIN_ROLES } from "./authUtils";

// WebCrypto PBKDF2 Password Hashing
async function hashPassword(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const saltBytes = new Uint8Array(
    saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateRandomHex(byteCount = 16): string {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 1. Customer Email/Password Sign Up
export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!email || !args.password || args.password.length < 6) {
      return { error: "Valid email and password (minimum 6 characters) are required." };
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) {
      return { error: "An account with this email already exists." };
    }

    const salt = generateRandomHex(16);
    const passwordHash = await hashPassword(args.password, salt);

    // Default role is always 'customer' for public signup
    const userId = await ctx.db.insert("users", {
      email,
      name: args.name.trim(),
      phone: args.phone?.trim() || undefined,
      passwordHash,
      salt,
      role: "customer",
      isActive: true,
      createdAt: Date.now(),
    });

    // Create session (30 days validity)
    const token = generateRandomHex(32);
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

    await ctx.db.insert("sessions", {
      token,
      userId,
      role: "customer",
      name: args.name.trim(),
      email,
      expiresAt,
      createdAt: Date.now(),
    });

    return {
      success: true,
      token,
      user: {
        id: userId,
        email,
        name: args.name.trim(),
        role: "customer",
      },
    };
  },
});

// 2. Email or Phone Sign In (Customers, Employees, and Admin)
export const signIn = mutation({
  args: {
    identifier: v.string(), // email or phone
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const ident = args.identifier.trim().toLowerCase();
    
    // Find user by email first, then phone
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", ident))
      .first();

    if (!user) {
      const allUsers = await ctx.db.query("users").collect();
      user = allUsers.find(
        (u) => u.phone && u.phone.replace(/[^0-9]/g, "") === ident.replace(/[^0-9]/g, "")
      ) || null;
    }

    if (!user) {
      return { error: "Invalid email or password." };
    }

    if (!user.isActive) {
      return { error: "Your account has been deactivated. Please contact support." };
    }

    const calculatedHash = await hashPassword(args.password, user.salt);
    if (calculatedHash !== user.passwordHash) {
      return { error: "Invalid email or password." };
    }

    // Create session
    const token = generateRandomHex(32);
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

    await ctx.db.insert("sessions", {
      token,
      userId: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      expiresAt,
      createdAt: Date.now(),
    });

    return {
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  },
});

// 3. Sign Out
export const signOut = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
    return { success: true };
  },
});

// 4. Validate Session Query (used by middleware / server components)
export const validateSession = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token!))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user || !user.isActive) {
      return null;
    }

    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };
  },
});

// 5. Password Reset Request
export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      // Return success anyway to avoid user enumeration
      return { success: true };
    }

    const resetToken = generateRandomHex(24);
    const resetTokenExpiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    await ctx.db.patch(user._id, {
      resetToken,
      resetTokenExpiresAt,
    });

    // Never return resetToken to client (SEC-01: prevents unauthenticated reset token interception)
    return { success: true };
  },
});

// 6. Complete Password Reset
export const resetPassword = mutation({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.newPassword.length < 6) {
      return { error: "Password must be at least 6 characters." };
    }

    const allUsers = await ctx.db.query("users").collect();
    const user = allUsers.find(
      (u) => u.resetToken === args.token && (u.resetTokenExpiresAt || 0) > Date.now()
    );

    if (!user) {
      return { error: "Invalid or expired reset token." };
    }

    const newSalt = generateRandomHex(16);
    const newHash = await hashPassword(args.newPassword, newSalt);

    await ctx.db.patch(user._id, {
      passwordHash: newHash,
      salt: newSalt,
      resetToken: undefined,
      resetTokenExpiresAt: undefined,
    });

    // SEC-02: Revoke all existing sessions for this user upon password reset
    const activeSessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const session of activeSessions) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// 7. Secure Admin / Employee Account Provisioning (Internal Mutation)
export const provisionPrivilegedAccount = internalMutation({
  args: {
    adminSessionToken: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.union(
      v.literal("staff"),
      v.literal("employee"),
      v.literal("manager"),
      v.literal("chef"),
      v.literal("admin")
    ),
  },
  handler: async (ctx, args) => {
    // SEC-04: Authorization gate - require valid admin session if admins already exist
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
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
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
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
      const userId = await ctx.db.insert("users", {
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
  },
});

// 8. Authenticated Customer / User Profile Update
export const updateUserProfile = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    name: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateCaller(ctx, args.sessionToken, [
      "customer",
      "admin",
      "manager",
      "employee",
      "staff",
      "chef",
    ]);

    if (!auth.authorized) {
      return { error: auth.error };
    }

    const trimmedName = args.name.trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
      return { error: "Name must be between 2 and 100 characters." };
    }

    let sanitizedPhone: string | undefined = undefined;
    if (args.phone && args.phone.trim()) {
      const digits = args.phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) {
        return { error: "Please enter a valid phone number (10 to 15 digits)." };
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
  },
});
