"use client";

/**
 * AtmosphericSky - Simple dark sky with subtle gradient
 */

import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";

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
  uniform float uLightPollution;
  varying vec3 vWorldPosition;
  
  void main() {
    float height = normalize(vWorldPosition).y;
    
    // Very subtle gradient - darker near horizon, slightly lighter at zenith
    // Adjusted by light pollution (0.0 = Dark Sky, 1.0 = City)
    
    vec3 zenithColorDark = vec3(0.01, 0.01, 0.02);
    vec3 zenithColorCity = vec3(0.05, 0.05, 0.1);
    
    vec3 horizonColorDark = vec3(0.015, 0.02, 0.03);
    vec3 horizonColorCity = vec3(0.1, 0.1, 0.15);
    
    vec3 zenithColor = mix(zenithColorDark, zenithColorCity, uLightPollution);
    vec3 horizonColor = mix(horizonColorDark, horizonColorCity, uLightPollution);
    
    float t = smoothstep(-0.1, 0.6, height);
    vec3 skyColor = mix(horizonColor, zenithColor, t);
    
    // Below horizon - very dark
    if (height < 0.0) {
      skyColor = vec3(0.005, 0.005, 0.008);
    }
    
    gl_FragColor = vec4(skyColor, 1.0);
  }
`;

interface AtmosphericSkyProps {
  lightPollution: number;
}

export function AtmosphericSky({ lightPollution = 0.2 }: AtmosphericSkyProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uLightPollution: { value: lightPollution },
      },
      vertexShader: skyVertexShader,
      fragmentShader: skyFragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, []); // Only create once

  // Update uniform directly on the material instance
  useEffect(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms) {
        mat.uniforms.uLightPollution.value = lightPollution;
      }
    }
  }, [lightPollution]);

  return (
    <mesh ref={meshRef} material={material}>
      <sphereGeometry args={[SPHERE_RADIUS, 32, 32]} />
    </mesh>
  );
}
