'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { HorizontalBlurShader, VerticalBlurShader } from 'three-stdlib';

export interface SafeContactShadowsProps {
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
  [key: string]: any;
}

/**
 * SafeContactShadows
 *
 * Drop-in, memory-leak-free replacement for Drei's ContactShadows.
 * 
 * Drei's ContactShadows allocates 2 WebGLRenderTargets, 3 Shader/Depth materials,
 * and 1 PlaneGeometry in useMemo, but NEVER calls .dispose() on unmount.
 * When components unmount (e.g. route transitions, canvas unmounts, or key changes),
 * those GPU framebuffers and WebGL textures leak permanently.
 *
 * SafeContactShadows guarantees:
 * 1. 100% clean disposal of renderTarget, renderTargetBlur, planeGeometry, and materials on unmount.
 * 2. Reset of frame capture counter on `refreshTrigger` change without allocating new GPU textures.
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
      ...props
    },
    fref
  ) => {
    const ref = useRef<THREE.Group>(null);
    const scene = useThree((state) => state.scene);
    const gl = useThree((state) => state.gl);
    const shadowCamera = useRef<THREE.OrthographicCamera>(null);

    const actualWidth = width * (Array.isArray(scale) ? scale[0] : scale || 1);
    const actualHeight = height * (Array.isArray(scale) ? scale[1] : scale || 1);

    const [
      renderTarget,
      planeGeometry,
      depthMaterial,
      blurPlane,
      horizontalBlurMaterial,
      verticalBlurMaterial,
      renderTargetBlur,
    ] = useMemo(() => {
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

      return [rt, planeGeom, dm, bp, hbm, vbm, rtb];
    }, [resolution, actualWidth, actualHeight, color]);

    // Cleanup GPU resources on unmount
    useEffect(() => {
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
    }, [
      renderTarget,
      renderTargetBlur,
      planeGeometry,
      depthMaterial,
      horizontalBlurMaterial,
      verticalBlurMaterial,
    ]);

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

    const countRef = useRef(0);

    // Reset render count on refreshTrigger change to bake a new frame without allocating new GPU textures
    useEffect(() => {
      countRef.current = 0;
    }, [refreshTrigger]);

    useFrame(() => {
      if (shadowCamera.current && (frames === Infinity || countRef.current < frames)) {
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
      }
    });

    React.useImperativeHandle(fref, () => ref.current!, []);

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
          geometry={planeGeometry}
          scale={[1, -1, 1]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <meshBasicMaterial
            transparent
            map={renderTarget.texture}
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
