import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Validates and sanitizes the redirect target URL (SEC-05).
 * Prevents open redirect bypasses such as:
 * - /\\evil.com or /\evil.com (normalized to //evil.com in WHATWG URL parser)
 * - //evil.com (protocol-relative URLs)
 * - URL-encoded bypasses (%5c, %2f%2f)
 * - Protocol schemes (javascript:, data:, https:, http:)
 * - Control characters or carriage returns
 */
function getSafeRedirectUrl(rawNext: string | null, fallback = '/employee/login'): string {
  if (!rawNext || typeof rawNext !== 'string') {
    return fallback;
  }

  const trimmed = rawNext.trim();

  // Must strictly start with a single '/' and not with '//' or '/\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  // Must not contain backslashes anywhere (prevents /\evil.com, /\\evil.com, and Windows path confusion)
  if (trimmed.includes('\\')) {
    return fallback;
  }

  // Must not contain colons (blocks protocol schemes e.g. javascript:, data:, https:)
  if (trimmed.includes(':')) {
    return fallback;
  }

  // Reject URL-encoded backslashes or double slashes
  if (/%5c/i.test(trimmed) || /%2f%2f/i.test(trimmed)) {
    return fallback;
  }

  // Reject control characters or newlines
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return fallback;
  }

  // Validate strictly with WHATWG URL parser using a dummy local origin
  try {
    const dummyOrigin = 'http://localhost';
    const parsed = new URL(trimmed, dummyOrigin);

    // Host must remain localhost and origin must remain http://localhost
    if (parsed.origin !== dummyOrigin || parsed.host !== 'localhost') {
      return fallback;
    }

    // Pathname must strictly start with '/' and not contain backslashes or protocol-relative slashes
    if (!parsed.pathname.startsWith('/') || parsed.pathname.startsWith('//') || parsed.pathname.includes('\\')) {
      return fallback;
    }

    return trimmed;
  } catch {
    return fallback;
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // Sanitize `next` to prevent open-redirect vulnerabilities (SEC-05)
  const rawNext = requestUrl.searchParams.get('next');
  const next = getSafeRedirectUrl(rawNext, '/employee/login');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // If there's an error, just send them back to login
  return NextResponse.redirect(new URL('/employee/login?error=Invalid+or+expired+link', requestUrl.origin));
}
