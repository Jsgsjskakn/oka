import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export type Role = "admin" | "manager" | "employee" | "staff" | "chef" | "customer";

export const STAFF_ROLES: Role[] = ["admin", "manager", "employee", "staff", "chef"];
export const ADMIN_ROLES: Role[] = ["admin"];

export interface AuthSuccess {
  authorized: true;
  user: Doc<"users">;
  session: Doc<"sessions">;
}

export interface AuthFailure {
  authorized: false;
  error: string;
}

export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Server-side session verification inside Convex backend.
 * Protects sensitive Convex mutations and queries against direct unauthenticated
 * or unauthorized callers (e.g. bypassing Next.js server actions).
 */
export async function authenticateCaller(
  ctx: { db: MutationCtx["db"] | QueryCtx["db"] },
  sessionToken: string | undefined,
  allowedRoles: Role[]
): Promise<AuthResult> {
  if (!sessionToken || typeof sessionToken !== "string" || sessionToken.trim() === "") {
    return { authorized: false, error: "Unauthorized: Missing session token." };
  }

  const token = sessionToken.trim();
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session) {
    return { authorized: false, error: "Unauthorized: Invalid session token." };
  }

  if (session.expiresAt <= Date.now()) {
    return { authorized: false, error: "Unauthorized: Session has expired." };
  }

  const user = await ctx.db.get(session.userId);
  if (!user) {
    return { authorized: false, error: "Unauthorized: User not found." };
  }

  if (!user.isActive) {
    return { authorized: false, error: "Unauthorized: User account has been deactivated." };
  }

  const userRole = user.role as Role;
  if (!allowedRoles.includes(userRole)) {
    return {
      authorized: false,
      error: `Forbidden: Action requires role [${allowedRoles.join(", ")}], but account has role "${userRole}".`,
    };
  }

  return { authorized: true, user, session };
}

/**
 * Extracts normalized digits (last 10 digits when >= 10 digits) from a phone string.
 * Returns "" if fewer than 7 digits exist so non-phone identifiers never false-match.
 */
export function normalizePhone(phone: string | undefined | null): string {
  if (!phone || typeof phone !== "string") return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return "";
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Compares two phone strings cleanly regardless of spaces, dashes, or +91 prefixes.
 */
export function phonesMatch(
  a: string | undefined | null,
  b: string | undefined | null
): boolean {
  const normA = normalizePhone(a);
  const normB = normalizePhone(b);
  return normA !== "" && normA === normB;
}

/**
 * Generates candidate phone formats for O(log n) exact-match index lookups.
 */
export function buildPhoneCandidates(rawPhone: string | undefined | null): string[] {
  if (!rawPhone || typeof rawPhone !== "string") return [];
  const trimmed = rawPhone.trim();
  const norm = normalizePhone(trimmed);
  if (!norm) return [];

  const candidates = new Set<string>([trimmed, norm]);
  const allDigits = trimmed.replace(/\D/g, "");
  if (allDigits.length >= 7) {
    candidates.add(allDigits);
  }
  if (norm.length === 10) {
    candidates.add(`+91${norm}`);
    candidates.add(`+91 ${norm}`);
    candidates.add(`+91 ${norm.slice(0, 5)} ${norm.slice(5)}`);
    candidates.add(`91${norm}`);
    candidates.add(`0${norm}`);
  }
  return Array.from(candidates);
}
