'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Headset, Sparkles, AlertCircle } from 'lucide-react';
import { isImmersiveVRSupported, WebXRVRViewer } from '@/lib/xr/webxr-vr-viewer';

export interface VRDishButtonProps {
  dishSlug: string;
  dishName: string;
  modelUrl: string;
  className?: string;
  variant?: 'pill' | 'compact' | 'icon-only';
  onVRStart?: () => void;
  onVREnd?: () => void;
}

export function VRDishButton({
  dishSlug,
  dishName,
  modelUrl,
  className = '',
  variant = 'pill',
  onVRStart,
  onVREnd,
}: VRDishButtonProps) {
  const [vrSupported, setVrSupported] = useState<boolean>(false);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [isVRActive, setIsVRActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeViewerRef = useRef<WebXRVRViewer | null>(null);

  // Check WebXR immersive-vr support on mount
  useEffect(() => {
    let mounted = true;
    isImmersiveVRSupported().then((supported) => {
      if (mounted) {
        setVrSupported(supported);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLaunchVR = useCallback(async () => {
    if (isLaunching || isVRActive) return;
    setIsLaunching(true);
    setErrorMessage(null);

    try {
      const viewer = new WebXRVRViewer({
        dishSlug,
        modelUrl,
        onSessionStart: () => {
          setIsVRActive(true);
          setIsLaunching(false);
          onVRStart?.();
        },
        onSessionEnd: () => {
          setIsVRActive(false);
          setIsLaunching(false);
          activeViewerRef.current = null;
          onVREnd?.();
        },
        onError: (err) => {
          setIsLaunching(false);
          setIsVRActive(false);
          setErrorMessage(err.message || 'Failed to initialize WebXR VR session.');
          activeViewerRef.current = null;
          onVREnd?.();
        },
      });

      activeViewerRef.current = viewer;
      await viewer.start();
    } catch (err) {
      setIsLaunching(false);
      setIsVRActive(false);
      setErrorMessage(
        err instanceof Error ? err.message : 'WebXR VR session launch failed.'
      );
      onVREnd?.();
    }
  }, [dishSlug, modelUrl, isLaunching, isVRActive, onVRStart, onVREnd]);

  // Clean up any active session on unmount
  useEffect(() => {
    return () => {
      if (activeViewerRef.current) {
        activeViewerRef.current.dispose();
        activeViewerRef.current = null;
      }
    };
  }, []);

  // When VR is completely unsupported in the client browser, render an informative luxury pill
  if (!vrSupported) {
    if (variant === 'icon-only') return null;

    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-white/40 text-[11px] cursor-not-allowed select-none ${className}`}
        title="WebXR immersive-vr requires a compatible VR headset (Meta Quest / Apple Vision Pro) in a WebXR-enabled browser."
      >
        <Headset size={13} className="text-white/30" />
        <span className="font-medium">VR Mode</span>
        <span className="text-[9px] uppercase tracking-wider text-white/30 px-1 py-0.2 bg-white/5 rounded">
          Headset Req
        </span>
      </div>
    );
  }

  if (variant === 'icon-only') {
    return (
      <button
        type="button"
        onClick={handleLaunchVR}
        disabled={isLaunching || isVRActive}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all bg-[rgba(26,20,16,0.85)] border border-[#F0C36B]/40 hover:border-[#F0C36B] hover:bg-[#F0C36B]/15 text-[#FFE1A0] active:scale-95 disabled:opacity-50 ${className}`}
        aria-label={`View ${dishName} in WebXR VR at 1:1 scale`}
        title="View in WebXR VR (1:1 Metric Scale)"
      >
        <Headset size={16} className={isLaunching ? 'animate-pulse text-[#F0C36B]' : ''} />
      </button>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleLaunchVR}
        disabled={isLaunching || isVRActive}
        className={`group relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 bg-[rgba(24,18,13,0.85)] hover:bg-[rgba(34,26,19,0.95)] border border-[#F0C36B]/40 hover:border-[#F0C36B] text-[#FFE1A0] hover:text-[#FFF4DC] shadow-[0_2px_12px_rgba(240,195,107,0.15)] active:scale-95 disabled:opacity-50 cursor-pointer ${className}`}
        aria-label={`View ${dishName} in WebXR VR at 1:1 scale`}
      >
        <div className="relative flex items-center justify-center">
          <Headset
            size={14}
            className={`transition-transform duration-300 group-hover:scale-110 text-[#F0C36B] ${
              isLaunching ? 'animate-bounce' : ''
            }`}
          />
          {isVRActive && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>
        <span className="tracking-wide">
          {isLaunching ? 'Launching VR…' : isVRActive ? 'VR Active' : 'View in VR (1:1)'}
        </span>
        <Sparkles size={11} className="text-[#F0C36B]/70 group-hover:text-[#F0C36B]" />
      </button>

      {errorMessage && (
        <div className="absolute top-full left-0 mt-1.5 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/90 border border-red-500/40 text-red-200 text-[10px] whitespace-nowrap shadow-xl">
          <AlertCircle size={12} className="text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
