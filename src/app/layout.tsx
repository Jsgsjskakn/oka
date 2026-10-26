import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { MobileShell } from '@/components/layout/MobileShell';
import ConvexClientProvider from './ConvexClientProvider';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { CulinarySpotlightModal } from '@/components/search/CulinarySpotlightModal';

const playfair = Playfair_Display({
  variable: '--font-heading',
  subsets: ['latin'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Golden Oak | Premium Dining Experience',
  description:
    'Experience luxury dining with The Golden Oak. Explore our premium menu, view dishes in 3D & AR, and book your table for an unforgettable culinary journey.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'The Golden Oak | Premium Dining Experience',
    description:
      'Experience luxury dining with The Golden Oak. Explore our premium menu, view dishes in 3D & AR, and book your table for an unforgettable culinary journey.',
    siteName: 'The Golden Oak',
    images: [
      {
        url: '/images/dishes/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'The Golden Oak - Premium Dining',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Golden Oak | Premium Dining Experience',
    description:
      'Experience luxury dining with The Golden Oak. Explore our premium menu, view dishes in 3D & AR, and book your table.',
    images: ['/images/dishes/placeholder.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0d0d0d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const restaurantJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'The Golden Oak',
  image: '/images/dishes/placeholder.jpg',
  description: 'Luxury restaurant serving fine gourmet dishes with interactive 3D/AR previews.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Indore',
    addressRegion: 'MP',
    addressCountry: 'IN',
  },
  servesCuisine: ['North Indian', 'Continental', 'Italian', 'Asian Fusion'],
  priceRange: '₹₹₹',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} dark`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-obsidian text-text-primary font-sans antialiased">
        <ConvexClientProvider>
          <MobileShell>{children}</MobileShell>
          <CulinarySpotlightModal />
        </ConvexClientProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
