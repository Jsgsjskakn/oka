import type { NextConfig } from "next";
import os from "os";

function getLocalIpAddresses(): string[] {
  const ips: string[] = ['10.70.129.202', '127.0.0.1', 'localhost'];
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const netList = interfaces[name];
      if (netList) {
        for (const net of netList) {
          if (net.family === 'IPv4' || (net.family as unknown as number) === 4) {
            ips.push(net.address);
          }
        }
      }
    }
  } catch {
    // Ignore error reading network interfaces
  }
  return Array.from(new Set(ips));
}

const localIps = getLocalIpAddresses();

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.supabase.co https://jimdmvzpmawbgzodzxhv.supabase.co https://*.convex.cloud https://*.convex.site https://*.google.com https://*.googleapis.com https://*.gstatic.com https://*.openstreetmap.org",
  "font-src 'self' data:",
  "connect-src 'self' ws: wss: https://*.convex.cloud wss://*.convex.cloud https://*.convex.site https://*.supabase.co wss://*.supabase.co https://*.gstatic.com blob: data:",
  "media-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "frame-src 'self' https://www.google.com https://maps.google.com https://*.google.com https://*.openstreetmap.org",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const devPort = process.env.PORT?.trim();
const devOriginEntries = Array.from(
  new Set([
    ...localIps,
    ...localIps.map((ip) => `${ip}:3000`),
    ...(devPort && devPort !== '3000' ? localIps.map((ip) => `${ip}:${devPort}`) : []),
  ])
);

// Narrow, secure Server Actions allowed origins:
// Next.js automatically permits same-origin requests (Origin === Host) by default.
// Cross-origin Server Action invocations are restricted to local development ports
// and the explicit production host if defined via environment variables.
// Wildcards (such as *.vercel.app) are intentionally avoided to prevent cross-origin CSRF.
const serverActionOrigins: string[] = Array.from(
  new Set([
    'localhost:3000',
    'localhost:3001',
    'localhost:1111',
    ...devOriginEntries,
  ])
);

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
  poweredByHeader: false,
  allowedDevOrigins: devOriginEntries,
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
        hostname: '*.supabase.co',
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
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/models/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
      {
        source: '/models/:path*.glb',
        headers: [
          {
            key: 'Content-Type',
            value: 'model/gltf-binary',
          },
        ],
      },
      {
        source: '/models/:path*.usdz',
        headers: [
          {
            key: 'Content-Type',
            value: 'model/vnd.usdz+zip',
          },
        ],
      },
      {
        source: '/draco/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
      {
        source: '/:path*.wasm',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/wasm',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
      {
        source: '/textures/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
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
