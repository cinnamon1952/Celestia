'use client';

/**
 * Constellations - Renders constellation lines and labels
 * 
 * Uses Three.js Line to draw connections between stars
 * and Billboard Text for constellation names.
 */

import { useMemo } from 'react';
import { Line, Text, Billboard } from '@react-three/drei';
import type { ConstellationDisplay } from '@/lib/astronomy';

interface ConstellationsProps {
  constellations: ConstellationDisplay[];
  showLabels?: boolean;
}

export function Constellations({ constellations, showLabels = true }: ConstellationsProps) {
  // Filter to only visible constellations
  const visibleConstellations = useMemo(() => {
    return constellations.filter(c => c.isVisible && c.lines.length > 0);
  }, [constellations]);

  return (
    <group name="constellations">
      {visibleConstellations.map(constellation => (
        <group key={constellation.name}>
          {/* Constellation lines */}
          {constellation.lines.map((line, idx) => (
            <Line
              key={`${constellation.name}-line-${idx}`}
              points={[
                [line.start.x, line.start.y, line.start.z],
                [line.end.x, line.end.y, line.end.z],
              ]}
              color="#4a9eff"
              lineWidth={1.2}
              opacity={0.5}
              transparent
            />
          ))}
          
          {/* Constellation label */}
          {showLabels && (
            <Billboard
              position={[
                constellation.labelPosition.x,
                constellation.labelPosition.y,
                constellation.labelPosition.z,
              ]}
              follow={true}
            >
              <Text
                fontSize={2.5}
                color="#6ab0ff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.15}
                outlineColor="#000000"
                fillOpacity={0.8}
              >
                {constellation.name}
              </Text>
            </Billboard>
          )}
        </group>
      ))}
    </group>
  );
}
