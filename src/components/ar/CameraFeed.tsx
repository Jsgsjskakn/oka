'use client';

import { useRef, useEffect } from 'react';

interface CameraFeedProps {
  onReady: () => void;
  onError: (message: string) => void;
}

export function CameraFeed({ onReady, onError }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!isMounted) {
          // If component unmounted while awaiting permissions/media, stop hardware tracks immediately
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          if (isMounted) {
            onReady();
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const error = err as Error;
        if (error.name === 'NotAllowedError') {
          onError('permission_denied');
        } else if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
          onError('no_camera');
        } else {
          onError('camera_error');
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [onReady, onError]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="absolute inset-0 w-full h-full object-cover z-0"
      style={{ transform: 'scaleX(1)' }}
    />
  );
}
