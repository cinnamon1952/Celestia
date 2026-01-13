'use client';

/**
 * AtmosphericSky - Simple dark sky with subtle gradient
 */

import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const SPHERE_RADIUS = 180;

// Simple sky gradient shader
const skyVertexShader = `
  varying vec3 vWorldPosition;
  
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = `
  varying vec3 vWorldPosition;
  
  void main() {
    float height = normalize(vWorldPosition).y;
    
    // Very subtle gradient - darker near horizon, slightly lighter at zenith
    vec3 zenithColor = vec3(0.01, 0.01, 0.02);
    vec3 horizonColor = vec3(0.015, 0.02, 0.03);
    
    float t = smoothstep(-0.1, 0.6, height);
    vec3 skyColor = mix(horizonColor, zenithColor, t);
    
    // Below horizon - very dark
    if (height < 0.0) {
      skyColor = vec3(0.005, 0.005, 0.008);
    }
    
    gl_FragColor = vec4(skyColor, 1.0);
  }
`;

export function AtmosphericSky() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: skyVertexShader,
      fragmentShader: skyFragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh ref={meshRef} material={material}>
      <sphereGeometry args={[SPHERE_RADIUS, 32, 32]} />
    </mesh>
  );
}
