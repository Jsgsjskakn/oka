import type { MetadataRoute } from 'next';

function resolveBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      // Fallback to canonical domain if NEXT_PUBLIC_APP_URL is malformed
    }
  }
  return 'https://thegoldenoak.in';
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolveBaseUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/employee/',
        '/api/',
        '/debug-employee',
        '/checkout',
        '/order/',
        '/booking/success',
        '/profile/',
        '/auth/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
