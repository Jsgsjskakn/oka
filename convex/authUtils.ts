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
