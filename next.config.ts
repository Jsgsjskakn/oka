import type { NextConfig } from "next";

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.supabase.co https://jimdmvzpmawbgzodzxhv.supabase.co https://*.convex.cloud https://*.convex.site https://*.google.com https://*.googleapis.com https://*.gstatic.com https://*.openstreetmap.org",
  "font-src 'self' data:",
  "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.convex.site https://*.supabase.co wss://*.supabase.co blob: data:",
  "media-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "frame-src 'self' https://www.google.com https://maps.google.com https://*.google.com https://*.openstreetmap.org",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

// Narrow, secure Server Actions allowed origins:
// Next.js automatically permits same-origin requests (Origin === Host) by default.
// Cross-origin Server Action invocations are restricted to local development ports
// and the explicit production host if defined via environment variables.
// Wildcards (such as *.vercel.app) are intentionally avoided to prevent cross-origin CSRF.
const serverActionOrigins: string[] = [
  'localhost:3000',
  'localhost:3001',
  'localhost:1111',
];

if (process.env.NEXT_PUBLIC_APP_URL) {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_APP_URL);
    if (url.host && !serverActionOrigins.includes(url.host)) {
      serverActionOrigins.push(url.host);
    }
  } catch {
    // Ignore invalid URL
  }
}

if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (host && !serverActionOrigins.includes(host)) {
    serverActionOrigins.push(host);
  }
}

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jimdmvzpmawbgzodzxhv.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.convex.cloud',
      },
      {
        protocol: 'https',
        hostname: '*.convex.site',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: serverActionOrigins,
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
