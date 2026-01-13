'use client';

/**
 * DeepSkyObjects - Renders nebulae, galaxies, and star clusters
 * 
 * Different visual representations for different object types:
 * - Galaxies: elliptical glow
 * - Nebulae: diffuse colored cloud
 * - Clusters: concentrated star points
 */

import { useMemo } from 'react';
import { Billboard, Text } from '@react-three/drei';
import type { DeepSkyObject } from '@/lib/astronomy';

interface DeepSkyObjectsProps {
  objects: DeepSkyObject[];
  showLabels?: boolean;
}

// Color mapping for different object types
const TYPE_COLORS: Record<string, string> = {
  galaxy: '#e8d0ff',      // Pale purple
  nebula: '#ff6b8a',      // Pink-red
  planetary: '#00ffaa',   // Cyan-green
  supernova: '#ffaa00',   // Orange
  cluster: '#ffffcc',     // Pale yellow
};

// Get size multiplier based on object type and magnitude
function getObjectSize(obj: DeepSkyObject): number {
  // Base size from angular size (in arcminutes)
  const baseSize = Math.min(3, Math.max(0.8, obj.size / 30));
  
  // Adjust for magnitude (brighter = larger)
  const magFactor = Math.pow(2.512, (8 - obj.magnitude) / 3);
  
  return baseSize * Math.min(2, Math.max(0.5, magFactor));
}

function DeepSkyMarker({ obj, showLabel }: { obj: DeepSkyObject; showLabel: boolean }) {
  const color = TYPE_COLORS[obj.type] || '#ffffff';
  const size = getObjectSize(obj);
  
  if (!obj.isVisible) return null;

  return (
    <group position={[obj.position.x, obj.position.y, obj.position.z]}>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[size * 1.5, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>
      
      {/* Core */}
      <mesh>
        <sphereGeometry args={[size * 0.5, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>
      
      {/* For galaxies, add a slight elliptical shape */}
      {obj.type === 'galaxy' && (
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[size, size * 0.2, 8, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.2}
            depthWrite={false}
          />
        </mesh>
      )}
      
      {/* Label */}
      {showLabel && (
        <Billboard follow={true}>
          <Text
            position={[0, size + 1.5, 0]}
            fontSize={1.2}
            color="#ffffff"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.1}
            outlineColor="#000000"
            fillOpacity={0.9}
          >
            {obj.id}
          </Text>
          <Text
            position={[0, size + 0.3, 0]}
            fontSize={0.8}
            color="#aaaaaa"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.08}
            outlineColor="#000000"
            fillOpacity={0.7}
          >
            {obj.name !== obj.id ? obj.name : ''}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

export function DeepSkyObjects({ objects, showLabels = true }: DeepSkyObjectsProps) {
  // Filter to visible objects only
  const visibleObjects = useMemo(() => {
    return objects.filter(obj => obj.isVisible);
  }, [objects]);

  return (
    <group name="deep-sky-objects">
      {visibleObjects.map(obj => (
        <DeepSkyMarker key={obj.id} obj={obj} showLabel={showLabels} />
      ))}
    </group>
  );
}
