'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame, type ThreeElements } from '@react-three/fiber';
import { HorizontalBlurShader, VerticalBlurShader } from 'three-stdlib';

export interface SafeContactShadowsProps
  extends Omit<ThreeElements['group'], 'scale' | 'color' | 'position' | 'rotation'> {
  scale?: number | [number, number];
  frames?: number;
  opacity?: number;
  width?: number;
  height?: number;
  blur?: number;
  near?: number;
  far?: number;
  resolution?: number;
  smooth?: boolean;
  color?: string;
  depthWrite?: boolean;
  renderOrder?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  refreshTrigger?: number | string;
  /** When false, disables shadow rendering and skips all WebGLRenderTarget allocations (default: true). */
  enabled?: boolean;
  /**
   * Ultra-lightweight static radial contact shadow disc for low-end / mobile tile GPUs.
   * Allocates 0 WebGLRenderTargets, performs 0 framebuffer switches, and renders in 1 draw call (default: false).
   */
  fastStaticFallback?: boolean;
  /** Softness radius multiplier for fastStaticFallback disc relative to scale (default: 0.42). */
  staticRadiusScale?: number;
}

const STATIC_SHADOW_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const STATIC_SHADOW_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec2 centered = (vUv - 0.5) * 2.0;
    float dist = length(centered);
    // Gaussian-like soft contact shadow falloff with smooth zero-edge termination
    float core = exp(-dist * dist * 4.2);
    float edgeMask = 1.0 - smoothstep(0.55, 1.0, dist);
    float alpha = core * edgeMask * uOpacity;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

/**
 * SafeContactShadows
 *
 * Drop-in, memory-leak-free replacement for Drei's ContactShadows with an optional
 * zero-RenderTarget static radial fallback (`fastStaticFallback`) for low-end mobile GPUs.
 *
 * Guarantees:
 * 1. 100% clean disposal of renderTarget, renderTargetBlur, planeGeometry, and materials on unmount.
 * 2. Zero WebGLRenderTarget allocations when `enabled === false`, `opacity <= 0`, or `fastStaticFallback === true`.
 * 3. Reset of frame capture counter on `refreshTrigger` change without allocating new GPU textures.
 */
export const SafeContactShadows = React.forwardRef<THREE.Group, SafeContactShadowsProps>(
  (
    {
      scale = 10,
      frames = Infinity,
      opacity = 1,
      width = 1,
      height = 1,
      blur = 1,
      near = 0,
      far = 10,
      resolution = 512,
      smooth = true,
      color = '#000000',
      depthWrite = false,
      renderOrder,
      position,
      rotation,
      refreshTrigger,
      enabled = true,
      fastStaticFallback = false,
      staticRadiusScale = 0.42,
      ...props
    },
    fref
  ) => {
    const ref = useRef<THREE.Group>(null);
    const scene = useThree((state) => state.scene);
    const gl = useThree((state) => state.gl);
    const shadowCamera = useRef<THREE.OrthographicCamera>(null);

    const isVisible = enabled && opacity > 0;
    const useDynamicTargets = isVisible && !fastStaticFallback;
    const useStaticDisc = isVisible && fastStaticFallback;

    const actualWidth = width * (Array.isArray(scale) ? scale[0] : scale || 1);
    const actualHeight = height * (Array.isArray(scale) ? scale[1] : scale || 1);

    // Dynamic orthographic depth + separable Gaussian blur resources (allocated ONLY when needed)
    const dynamicResources = useMemo(() => {
      if (!useDynamicTargets) return null;

      const rt = new THREE.WebGLRenderTarget(resolution, resolution);
      const rtb = new THREE.WebGLRenderTarget(resolution, resolution);
      rtb.texture.generateMipmaps = rt.texture.generateMipmaps = false;

      const planeGeom = new THREE.PlaneGeometry(actualWidth, actualHeight).rotateX(Math.PI / 2);
      const bp = new THREE.Mesh(planeGeom);
      const dm = new THREE.MeshDepthMaterial();
      dm.depthTest = dm.depthWrite = false;
      dm.onBeforeCompile = (shader) => {
        shader.uniforms = {
          ...shader.uniforms,
          ucolor: { value: new THREE.Color(color) },
        };
        shader.fragmentShader = shader.fragmentShader.replace(
          'void main() {',
          'uniform vec3 ucolor;\nvoid main() {\n'
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          'vec4( vec3( 1.0 - fragCoordZ ), opacity );',
          'vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );'
        );
      };

      const hbm = new THREE.ShaderMaterial(HorizontalBlurShader);
      const vbm = new THREE.ShaderMaterial(VerticalBlurShader);
      vbm.depthTest = hbm.depthTest = false;

      return {
        renderTarget: rt,
        planeGeometry: planeGeom,
        depthMaterial: dm,
        blurPlane: bp,
        horizontalBlurMaterial: hbm,
        verticalBlurMaterial: vbm,
        renderTargetBlur: rtb,
      };
    }, [useDynamicTargets, resolution, actualWidth, actualHeight, color]);

    // Cleanup dynamic GPU resources on unmount or when switching to static fallback
    useEffect(() => {
      if (!dynamicResources) return;
      const {
        renderTarget,
        renderTargetBlur,
        planeGeometry,
        depthMaterial,
        horizontalBlurMaterial,
        verticalBlurMaterial,
      } = dynamicResources;

      return () => {
        try {
          renderTarget.dispose();
          renderTargetBlur.dispose();
          planeGeometry.dispose();
          depthMaterial.dispose();
          horizontalBlurMaterial.dispose();
          verticalBlurMaterial.dispose();
        } catch {
          // Safe no-op
        }
      };
    }, [dynamicResources]);

    // Lightweight 1-draw-call static radial contact shadow disc (0 WebGLRenderTargets!)
    const staticResources = useMemo(() => {
      if (!useStaticDisc) return null;

      const discW = Math.max(0.5, actualWidth * staticRadiusScale);
      const discH = Math.max(0.5, actualHeight * staticRadiusScale);
      const staticGeom = new THREE.PlaneGeometry(discW, discH).rotateX(-Math.PI / 2);
      const staticMat = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color('#000000') },
          uOpacity: { value: 0.45 },
        },
        vertexShader: STATIC_SHADOW_VERTEX_SHADER,
        fragmentShader: STATIC_SHADOW_FRAGMENT_SHADER,
        transparent: true,
        depthWrite,
        toneMapped: false,
      });

      return { staticGeom, staticMat };
    }, [useStaticDisc, actualWidth, actualHeight, staticRadiusScale, depthWrite]);

    useEffect(() => {
      if (!staticResources) return;
      staticResources.staticMat.uniforms.uColor.value.set(color);
      staticResources.staticMat.uniforms.uOpacity.value = opacity;
    }, [staticResources, color, opacity]);

    useEffect(() => {
      if (!staticResources) return;
      const { staticGeom, staticMat } = staticResources;
      return () => {
        try {
          staticGeom.dispose();
          staticMat.dispose();
        } catch {
          // Safe no-op
        }
      };
    }, [staticResources]);

    const countRef = useRef(0);

    // Reset render count on refreshTrigger change to bake a new frame without allocating new GPU textures
    useEffect(() => {
      countRef.current = 0;
    }, [refreshTrigger]);

    useFrame(() => {
      if (
        !useDynamicTargets ||
        !dynamicResources ||
        !shadowCamera.current ||
        (frames !== Infinity && countRef.current >= frames)
      ) {
        return;
      }

      const {
        renderTarget,
        renderTargetBlur,
        depthMaterial,
        blurPlane,
        horizontalBlurMaterial,
        verticalBlurMaterial,
      } = dynamicResources;

      const blurShadows = (blurAmount: number) => {
        if (!shadowCamera.current) return;
        blurPlane.visible = true;
        blurPlane.material = horizontalBlurMaterial;
        horizontalBlurMaterial.uniforms.tDiffuse.value = renderTarget.texture;
        horizontalBlurMaterial.uniforms.h.value = (blurAmount * 1) / 256;
        gl.setRenderTarget(renderTargetBlur);
        gl.render(blurPlane, shadowCamera.current);
        blurPlane.material = verticalBlurMaterial;
        verticalBlurMaterial.uniforms.tDiffuse.value = renderTargetBlur.texture;
        verticalBlurMaterial.uniforms.v.value = (blurAmount * 1) / 256;
        gl.setRenderTarget(renderTarget);
        gl.render(blurPlane, shadowCamera.current);
        blurPlane.visible = false;
      };

      countRef.current++;
      const initialBackground = scene.background;
      const initialOverrideMaterial = scene.overrideMaterial;
      if (ref.current) ref.current.visible = false;
      scene.background = null;
      scene.overrideMaterial = depthMaterial;
      gl.setRenderTarget(renderTarget);
      gl.render(scene, shadowCamera.current);
      blurShadows(blur);
      if (smooth) blurShadows(blur * 0.4);
      gl.setRenderTarget(null);
      if (ref.current) ref.current.visible = true;
      scene.overrideMaterial = initialOverrideMaterial;
      scene.background = initialBackground;
    });

    React.useImperativeHandle(fref, () => ref.current!, []);

    if (!isVisible) {
      return <group position={position} rotation={rotation} {...props} ref={ref} />;
    }

    if (useStaticDisc && staticResources) {
      return (
        <group position={position} rotation={rotation} {...props} ref={ref}>
          <mesh
            renderOrder={renderOrder}
            geometry={staticResources.staticGeom}
            material={staticResources.staticMat}
          />
        </group>
      );
    }

    if (!dynamicResources) {
      return <group position={position} rotation={rotation} {...props} ref={ref} />;
    }

    return (
      <group
        rotation-x={Math.PI / 2}
        position={position}
        rotation={rotation}
        {...props}
        ref={ref}
      >
        <mesh
          renderOrder={renderOrder}
          geometry={dynamicResources.planeGeometry}
          scale={[1, -1, 1]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <meshBasicMaterial
            transparent
            map={dynamicResources.renderTarget.texture}
            opacity={opacity}
            depthWrite={depthWrite}
          />
        </mesh>
        <orthographicCamera
          ref={shadowCamera}
          args={[-actualWidth / 2, actualWidth / 2, actualHeight / 2, -actualHeight / 2, near, far]}
        />
      </group>
    );
  }
);

SafeContactShadows.displayName = 'SafeContactShadows';
