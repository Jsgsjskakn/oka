'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister Component
 * Safely registers the PWA service worker (/sw.js) in supported browser environments
 * on HTTPS or localhost, with graceful error handling and zero UI overhead.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    // 1. Ensure we are executing in a browser environment with ServiceWorker API support
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // 2. Validate secure context: Service Workers require HTTPS or localhost/loopback
    const hostname = window.location.hostname;
    const isLocalhost = Boolean(
      hostname === 'localhost' ||
        hostname === '[::1]' ||
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.test(hostname)
    );

    const isSecureContext = window.location.protocol === 'https:' || isLocalhost;

    if (!isSecureContext) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[PWA] Service Worker registration skipped: insecure context. Service Workers require HTTPS or localhost.'
        );
      }
      return;
    }

    // 3. Register the service worker after page load to avoid competing for critical startup bandwidth
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          if (process.env.NODE_ENV !== 'production') {
            console.log(
              '[PWA] Service Worker successfully registered with scope:',
              registration.scope
            );
          }

          // Optional: Listen for updates to prompt or handle worker replacement
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  if (process.env.NODE_ENV !== 'production') {
                    console.log(
                      '[PWA] New service worker version installed and awaiting activation.'
                    );
                  }
                } else if (process.env.NODE_ENV !== 'production') {
                  console.log('[PWA] Service worker installed; assets cached for offline use.');
                }
              }
            };
          };
        })
        .catch((error) => {
          // Gracefully log warning without throwing or interrupting user experience
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
