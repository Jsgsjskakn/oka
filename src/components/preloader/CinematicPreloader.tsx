'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CinematicParticleTree } from './CinematicParticleTree';

export const PRELOADER_SESSION_KEY = 'tgo_cinematic_preloader_seen';

// In-memory flag: suppresses preloader only during client-side SPA route transitions,
// but resets automatically on page reload / refresh so user always sees the animation.
let spaSessionPreloaderSeen = false;

interface CinematicPreloaderProps {
  forceShow?: boolean;
  onFinished?: () => void;
}

export function CinematicPreloader({ forceShow, onFinished }: CinematicPreloaderProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const isParamSkipped =
        searchParams?.get('skip') === '1' ||
        searchParams?.get('skip') === 'true' ||
        searchParams?.get('no_preloader') === '1' ||
        searchParams?.get('preloader') === '0';

      if (isParamSkipped) {
        return;
      }

      const isParamForced =
        searchParams?.get('cinematic') === 'true' ||
        searchParams?.get('cinematic') === '1' ||
        searchParams?.get('preloader') === 'true' ||
        searchParams?.get('preloader') === '1' ||
        searchParams?.get('replay') === 'true';

      // Detect browser page reload / refresh (F5 / Ctrl+R / browser refresh button)
      const navEntries =
        typeof window !== 'undefined' && window.performance?.getEntriesByType
          ? window.performance.getEntriesByType('navigation')
          : [];
      const navType = navEntries.length > 0 ? (navEntries[0] as PerformanceNavigationTiming).type : '';
      const isPageReload =
        navType === 'reload' ||
        (typeof window !== 'undefined' && (window.performance as { navigation?: { type?: number } })?.navigation?.type === 1);

      // On reload, clear session block so animation reliably plays on refresh
      if (isPageReload && typeof window !== 'undefined') {
        try {
          window.sessionStorage?.removeItem(PRELOADER_SESSION_KEY);
        } catch {
          // Ignore storage quota
        }
      }

      const alreadySeen =
        !isPageReload &&
        spaSessionPreloaderSeen &&
        typeof window !== 'undefined' &&
        window.sessionStorage?.getItem(PRELOADER_SESSION_KEY) === 'true';

      if (forceShow || isParamForced || isPageReload || !alreadySeen) {
        setShouldRender(true);
      }
    } catch {
      // Fallback for restricted storage environments: render intro
      setShouldRender(true);
    }
  }, [forceShow]);

  // Clean up session key on window beforeunload so subsequent refreshes always trigger
  useEffect(() => {
    const handleUnload = () => {
      try {
        window.sessionStorage?.removeItem(PRELOADER_SESSION_KEY);
      } catch {
        // Ignore storage exceptions
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const handleComplete = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    spaSessionPreloaderSeen = true;

    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage?.setItem(PRELOADER_SESSION_KEY, 'true');
      }
    } catch {
      // Ignore sessionStorage exceptions (e.g. Safari private browsing quota)
    }

    // Smooth luxury exit fade-out (850ms duration)
    exitTimeoutRef.current = setTimeout(() => {
      setShouldRender(false);
      if (onFinished) onFinished();
    }, 850);
  }, [isExiting, onFinished]);

  // Safety Entrapment Protection: If loading stalls for any reason, unblock user after 12s
  useEffect(() => {
    if (!shouldRender) return;

    safetyTimeoutRef.current = setTimeout(() => {
      handleComplete();
    }, 12000);

    return () => {
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, [shouldRender, handleComplete]);

  if (!shouldRender) {
    return null;
  }

  return (
    <aside
      id="golden-oak-preloader"
      aria-label="The Golden Oak Welcome Experience"
      aria-live="polite"
      className={`fixed inset-0 z-[99999] w-screen h-screen overflow-hidden select-none touch-none transition-all duration-800 ease-out ${
        isExiting
          ? 'opacity-0 scale-[1.01] pointer-events-none'
          : 'opacity-100 scale-100 pointer-events-auto'
      }`}
      style={{
        backgroundColor: '#000000',
        transformOrigin: 'center center',
      }}
    >
      <CinematicParticleTree onComplete={handleComplete} isReady={true} />
    </aside>
  );
}
