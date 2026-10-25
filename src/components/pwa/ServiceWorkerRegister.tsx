'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister Component
 * Safely registers the PWA service worker (/sw.js) only in production HTTPS environments.
 * In development / localhost, it automatically unregisters all active service workers and
 * purges stale chunk caches to prevent Turbopack / HMR module resolution breakage.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    // 1. Ensure we are executing in a browser environment with ServiceWorker API support
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const hostname = window.location.hostname;
    const isLocalhost = Boolean(
      hostname === 'localhost' ||
        hostname === '[::1]' ||
        hostname === '127.0.0.1' ||
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.test(hostname)
    );

    const isDevelopment = process.env.NODE_ENV !== 'production' || isLocalhost;

    // 2. In development or on localhost: UNREGISTER any existing service worker and CLEAR caches!
    if (isDevelopment) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((unregistered) => {
            if (unregistered) {
              console.log(
                '[PWA] Unregistered development service worker:',
                registration.scope
              );
            }
          });
        }
      });

      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
      return;
    }

    // 3. In production: Only register if secure HTTPS context
    if (window.location.protocol !== 'https:') {
      return;
    }

    // 4. Register the service worker after page load to avoid competing for critical startup bandwidth
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New service worker version installed and awaiting activation.');
              }
            };
          };
        })
        .catch((error) => {
          console.warn('[PWA] Service Worker registration failed:', error);
        });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}

export default ServiceWorkerRegister;
