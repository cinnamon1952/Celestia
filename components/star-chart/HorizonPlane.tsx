'use client';

/**
 * HorizonPlane - Visual indicator for the horizon
 * 
 * Renders a subtle grid/ring at altitude = 0
 * to help orient the viewer in the sky dome
 */

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

const HORIZON_RADIUS = 100;
const HORIZON_SEGMENTS = 64;

export function HorizonPlane() {
  // Create circle points for the horizon line
  const horizonPoints = useMemo(() => {
    const points: [number, number, number][] = [];
    
    for (let i = 0; i <= HORIZON_SEGMENTS; i++) {
      const angle = (i / HORIZON_SEGMENTS) * Math.PI * 2;
      points.push([
        Math.sin(angle) * HORIZON_RADIUS,
        0, // Horizon is at y = 0
        Math.cos(angle) * HORIZON_RADIUS,
      ]);
    }
    
    return points;
  }, []);

  // Cardinal direction markers
  const cardinalPoints = useMemo(() => {
    const markers: { label: string; position: [number, number, number]; azimuth: number }[] = [
      { label: 'N', position: [0, 0.5, -HORIZON_RADIUS], azimuth: 0 },
      { label: 'E', position: [HORIZON_RADIUS, 0.5, 0], azimuth: 90 },
      { label: 'S', position: [0, 0.5, HORIZON_RADIUS], azimuth: 180 },
      { label: 'W', position: [-HORIZON_RADIUS, 0.5, 0], azimuth: 270 },
    ];
    return markers;
  }, []);

  // Create radial lines from center to horizon
  const radialLines = useMemo(() => {
    const lines: [number, number, number][][] = [];
    
    // Lines every 30 degrees
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      lines.push([
        [0, 0, 0],
        [
          Math.sin(angle) * HORIZON_RADIUS,
          0,
          Math.cos(angle) * HORIZON_RADIUS,
        ],
      ]);
    }
    
    return lines;
  }, []);

  return (
    <group name="horizon">
      {/* Main horizon circle */}
      <Line
        points={horizonPoints}
        color="#2a4a6a"
        lineWidth={2}
        opacity={0.6}
        transparent
      />

      {/* Radial direction lines */}
      {radialLines.map((points, i) => (
        <Line
          key={`radial-${i}`}
          points={points}
          color="#1a3a5a"
          lineWidth={1}
          opacity={0.2}
          transparent
        />
      ))}

      {/* Cardinal direction labels */}
      {cardinalPoints.map(({ label, position }) => (
        <mesh key={label} position={position}>
          <planeGeometry args={[4, 4]} />
          <meshBasicMaterial transparent opacity={0}>
            {/* We'll use Text from drei in a real implementation */}
          </meshBasicMaterial>
        </mesh>
      ))}

      {/* Cardinal direction text markers */}
      {cardinalPoints.map(({ label, position }) => (
        <group key={`${label}-marker`} position={position}>
          <mesh>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial 
              color={label === 'N' ? '#ff4444' : '#4488ff'} 
              transparent 
              opacity={0.8}
            />
          </mesh>
        </group>
      ))}

      {/* Ground plane indicator (below horizon) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <ringGeometry args={[0, HORIZON_RADIUS, 64]} />
        <meshBasicMaterial 
          color="#0a1520" 
          transparent 
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
