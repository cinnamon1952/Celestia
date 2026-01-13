'use client';

/**
 * StarLabels - Shows labels for bright stars and handles star selection
 * 
 * - Always shows labels for very bright stars (mag < 1.5)
 * - Shows labels on hover using raycasting
 * - Supports click to select and show detailed info
 */

import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { ProcessedStar } from '@/lib/astronomy';

interface StarLabelsProps {
  stars: ProcessedStar[];
  onStarSelect?: (star: ProcessedStar | null) => void;
  selectedStar?: ProcessedStar | null;
}

// Threshold for always showing labels
const ALWAYS_SHOW_MAG = 1.5;

export function StarLabels({ stars, onStarSelect, selectedStar }: StarLabelsProps) {
  const [hoveredStar, setHoveredStar] = useState<ProcessedStar | null>(null);
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());

  // Filter to visible stars and get bright ones
  const { brightStars, allVisibleStars } = useMemo(() => {
    const visible = stars.filter(s => s.isVisible);
    const bright = visible.filter(s => s.mag < ALWAYS_SHOW_MAG);
    return { brightStars: bright, allVisibleStars: visible };
  }, [stars]);

  // Create sphere positions for raycasting
  const starPositions = useMemo(() => {
    return allVisibleStars.map(star => ({
      star,
      position: new THREE.Vector3(star.position.x, star.position.y, star.position.z),
    }));
  }, [allVisibleStars]);

  // Handle pointer move for hover detection
  const handlePointerMove = useCallback((event: PointerEvent) => {
    const rect = gl.domElement.getBoundingClientRect();
    pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }, [gl.domElement]);

  // Handle click for star selection
  const handleClick = useCallback(() => {
    if (hoveredStar && onStarSelect) {
      onStarSelect(hoveredStar === selectedStar ? null : hoveredStar);
    }
  }, [hoveredStar, selectedStar, onStarSelect]);

  // Attach event listeners
  useFrame(() => {
    // Update raycaster
    raycaster.current.setFromCamera(pointer.current, camera);
    
    // Find closest star to ray
    let closestStar: ProcessedStar | null = null;
    let closestDistance = Infinity;
    const maxDistance = 3; // Maximum distance from ray to consider
    
    for (const { star, position } of starPositions) {
      const distance = raycaster.current.ray.distanceToPoint(position);
      
      // Weight by magnitude (brighter stars are easier to select)
      const effectiveDistance = distance * (1 + star.mag * 0.1);
      
      if (effectiveDistance < closestDistance && distance < maxDistance) {
        closestDistance = effectiveDistance;
        closestStar = star;
      }
    }
    
    setHoveredStar(closestStar);
  });

  // Register event listeners
  useFrame(() => {
    gl.domElement.addEventListener('pointermove', handlePointerMove);
    gl.domElement.addEventListener('click', handleClick);
    
    return () => {
      gl.domElement.removeEventListener('pointermove', handlePointerMove);
      gl.domElement.removeEventListener('click', handleClick);
    };
  });

  return (
    <group name="star-labels">
      {/* Always-visible labels for bright stars */}
      {brightStars.map(star => (
        <Billboard
          key={`label-${star.id}`}
          position={[star.position.x, star.position.y, star.position.z]}
          follow={true}
        >
          <Text
            position={[0, star.size + 0.8, 0]}
            fontSize={1}
            color="#ffffff"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.08}
            outlineColor="#000000"
            fillOpacity={0.9}
          >
            {star.name}
          </Text>
        </Billboard>
      ))}
      
      {/* Hover label for dimmer stars */}
      {hoveredStar && hoveredStar.mag >= ALWAYS_SHOW_MAG && (
        <Billboard
          position={[hoveredStar.position.x, hoveredStar.position.y, hoveredStar.position.z]}
          follow={true}
        >
          <Text
            position={[0, hoveredStar.size + 1.2, 0]}
            fontSize={1.2}
            color="#ffff88"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.1}
            outlineColor="#000000"
          >
            {hoveredStar.name}
          </Text>
          <Text
            position={[0, hoveredStar.size + 0.2, 0]}
            fontSize={0.7}
            color="#aaaaaa"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.06}
            outlineColor="#000000"
          >
            {`mag ${hoveredStar.mag.toFixed(1)}`}
          </Text>
        </Billboard>
      )}
      
      {/* Selected star highlight */}
      {selectedStar && (
        <group position={[selectedStar.position.x, selectedStar.position.y, selectedStar.position.z]}>
          <mesh>
            <ringGeometry args={[selectedStar.size + 0.5, selectedStar.size + 0.8, 32]} />
            <meshBasicMaterial color="#ffff00" transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
}
