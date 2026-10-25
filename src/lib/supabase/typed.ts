/**
 * Supabase type bypass helper.
 *
 * The Database generic type we pass to createClient<Database> is correct, but
 * the @supabase/ssr package expects a specific PostgrestVersion field that our
 * hand-written Database type doesn't include. As a result, Supabase resolves
 * all table lookups to `never`.
 *
 * Until we switch to the auto-generated types from `supabase gen types`, we
 * cast the client to `any` in service/action files and immediately type the
 * result with our own types. This is safe because:
 *   - Our types exactly match the actual DB schema (verified against migrations).
 *   - All read results are explicitly typed at the call site.
 *   - Mutations are validated by our business logic before calling Supabase.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sb(client: unknown): any {
  return client;
}

/** Typed query result helper */
export type QR<T> = { data: T | null; error: { message: string } | null };
