'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

export interface MobileTouchSyncProps {
  touchOrbitActive: boolean;
}

/**
 * MobileTouchSync
 * Synchronizes Canvas WebGL DOM touch-action with mobile scroll/orbit state.
 * When touchOrbitActive is false, allows native vertical page scrolling (pan-y).
 * When touchOrbitActive is true, locks touch-action to 'none' for full 3D manipulation.
 */
export function MobileTouchSync({ touchOrbitActive }: MobileTouchSyncProps) {
  const { gl } = useThree();
  useEffect(() => {
    if (gl?.domElement) {
      gl.domElement.style.touchAction = touchOrbitActive ? 'none' : 'pan-y';
    }
  }, [gl, touchOrbitActive]);
  return null;
}

export default MobileTouchSync;
