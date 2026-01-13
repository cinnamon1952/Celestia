'use client';

/**
 * StarField - Renders stars using instanced meshes for performance
 * 
 * Uses Three.js InstancedMesh to efficiently render hundreds of stars
 * with individual positions, colors, and sizes.
 * 
 * Only renders stars above the horizon (altitude > 0)
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ProcessedStar } from '@/lib/astronomy';

interface StarFieldProps {
  stars: ProcessedStar[];
}

// Reusable objects to avoid garbage collection during animation
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

export function StarField({ stars }: StarFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Filter to only visible stars (above horizon)
  const visibleStars = useMemo(() => {
    return stars.filter(star => star.isVisible);
  }, [stars]);

  // Create geometry and material for star instances
  const geometry = useMemo(() => {
    // Use icosahedron for a more spherical appearance
    return new THREE.IcosahedronGeometry(1, 2);
  }, []);

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      // Enable vertex colors for per-instance coloring
      vertexColors: false,
    });
  }, []);

  // Update instance matrices and colors when stars change
  useEffect(() => {
    if (!meshRef.current || visibleStars.length === 0) return;

    const mesh = meshRef.current;

    visibleStars.forEach((star, i) => {
      // Set position
      tempObject.position.set(
        star.position.x,
        star.position.y,
        star.position.z
      );
      
      // Scale based on magnitude (brighter = larger)
      const scale = star.size;
      tempObject.scale.set(scale, scale, scale);
      
      // Update the matrix
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
      
      // Set color from spectral class
      tempColor.set(star.color);
      mesh.setColorAt(i, tempColor);
    });

    // Mark instance attributes as needing update
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [visibleStars]);

  // Subtle twinkling effect
  useFrame(({ clock }) => {
    if (!meshRef.current || visibleStars.length === 0) return;
    
    const time = clock.getElapsedTime();
    const mesh = meshRef.current;

    // Only update a subset of stars each frame for performance
    // This creates a subtle, non-uniform twinkling
    const updateCount = Math.min(20, visibleStars.length);
    const startIndex = Math.floor(time * 10) % visibleStars.length;

    for (let i = 0; i < updateCount; i++) {
      const starIndex = (startIndex + i) % visibleStars.length;
      const star = visibleStars[starIndex];
      
      // Create a pseudo-random but deterministic variation per star
      const twinkle = 0.85 + 0.15 * Math.sin(time * (2 + star.id * 0.1) + star.id);
      
      // Get current matrix and modify scale
      mesh.getMatrixAt(starIndex, tempObject.matrix);
      tempObject.matrix.decompose(
        tempObject.position,
        tempObject.quaternion,
        tempObject.scale
      );
      
      const baseScale = star.size;
      tempObject.scale.setScalar(baseScale * twinkle);
      tempObject.updateMatrix();
      mesh.setMatrixAt(starIndex, tempObject.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  if (visibleStars.length === 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, visibleStars.length]}
      frustumCulled={false}
    >
      <icosahedronGeometry args={[1, 2]} />
      <meshBasicMaterial
        transparent
        depthWrite={false}
        vertexColors
        opacity={0.95}
      />
    </instancedMesh>
  );
}
