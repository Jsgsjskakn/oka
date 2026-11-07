'use client';

import { useRef, useEffect } from 'react';

export interface CameraFeedProps {
  onReady: () => void;
  onError: (message: string) => void;
  /** Exposes the underlying HTMLVideoElement for 16x16 light estimation & AR photo compositing */
  onVideoElement?: (video: HTMLVideoElement | null) => void;
  /** Defaults to true (rear camera); when false or fallback allowed, accepts front/USB webcams */
  preferEnvironmentCamera?: boolean;
  /** Allows falling back to any available video camera if rear environment camera is absent */
  allowCameraFallback?: boolean;
  /** Notifies parent when camera hardware is suspended/resumed across tab visibility changes */
  onStreamSuspendedChange?: (suspended: boolean) => void;
}

export function CameraFeed({
  onReady,
  onError,
  onVideoElement,
  preferEnvironmentCamera = true,
  allowCameraFallback = false,
  onStreamSuspendedChange,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;
    let isStarting = false;

    const stopCurrentStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.enabled = false;
          track.stop();
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.srcObject = null;
        } catch {
          // Safe cleanup on detached media element
        }
      }
    };

    async function acquireStream(): Promise<MediaStream> {
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        const unavailableErr = new Error('MediaDevices unavailable');
        unavailableErr.name = 'NotFoundError';
        throw unavailableErr;
      }

      const primaryConstraints: MediaStreamConstraints = {
        video: preferEnvironmentCamera
          ? {
              facingMode: allowCameraFallback ? { ideal: 'environment' } : 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
        audio: false,
      };

      try {
        return await navigator.mediaDevices.getUserMedia(primaryConstraints);
      } catch (primaryErr: unknown) {
        const errName = (primaryErr as Error)?.name;
        if (
          allowCameraFallback &&
          (errName === 'OverconstrainedError' || errName === 'NotFoundError')
        ) {
          return await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        }
        throw primaryErr;
      }
    }

    async function startCamera(isResume = false) {
      if (!isMounted || isStarting) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      if (streamRef.current) return;

      isStarting = true;
      try {
        const stream = await acquireStream();

        // Guard: if component unmounted or tab became hidden while awaiting camera hardware, release immediately
        if (
          !isMounted ||
          (typeof document !== 'undefined' && document.visibilityState === 'hidden')
        ) {
          stream.getTracks().forEach((track) => {
            track.enabled = false;
            track.stop();
          });
          isStarting = false;
          return;
        }

        streamRef.current = stream;
        const videoEl = videoRef.current;
        if (videoEl) {
          videoEl.setAttribute('playsinline', 'true');
          videoEl.setAttribute('webkit-playsinline', 'true');
          videoEl.muted = true;
          videoEl.srcObject = stream;
          await videoEl.play();
          if (isMounted) {
            onVideoElement?.(videoEl);
            onStreamSuspendedChange?.(false);
            if (!isResume) {
              onReady();
            }
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const error = err as Error;
        if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
          onError('permission_denied');
        } else if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
          onError('no_camera');
        } else {
          onError('camera_error');
        }
      } finally {
        isStarting = false;
      }
    }

    const handleVisibilityChange = () => {
      if (!isMounted) return;
      if (document.visibilityState === 'hidden') {
        // Power down rear camera ISP tracks immediately when phone is locked or tab backgrounded
        stopCurrentStream();
        onStreamSuspendedChange?.(true);
      } else if (document.visibilityState === 'visible') {
        // Cleanly re-acquire camera stream on foreground return
        void startCamera(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    void startCamera(false);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopCurrentStream();
      onVideoElement?.(null);
    };
  }, [
    onReady,
    onError,
    onVideoElement,
    preferEnvironmentCamera,
    allowCameraFallback,
    onStreamSuspendedChange,
  ]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      data-testid="ar-camera-video"
      className="absolute inset-0 w-full h-full object-cover z-0"
      style={{ transform: preferEnvironmentCamera ? 'scaleX(1)' : 'scaleX(-1)' }}
    />
  );
}
