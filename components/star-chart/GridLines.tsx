"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";

interface GridLinesProps {
  opacity?: number;
  color?: string;
  radius?: number;
}

export function GridLines({
  opacity = 0.2,
  color = "#4466aa",
  radius = 100,
}: GridLinesProps) {
  // Azimuthal Grid (Horizontal coordinates)
  const azimuthalLines = useMemo(() => {
    const lines: [number, number, number][][] = [];

    // Circles at different altitudes (0, 30, 60, 90 is point)
    [0, 30, 60].forEach((alt) => {
      const altRad = (alt * Math.PI) / 180;
      const r = radius * Math.cos(altRad);
      const y = radius * Math.sin(altRad);

      const points: [number, number, number][] = [];
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        points.push([r * Math.sin(angle), y, r * Math.cos(angle)]);
      }
      lines.push(points);
    });

    // Vertical lines (Meridians) every 30 degrees
    for (let i = 0; i < 12; i++) {
      const az = (i / 12) * Math.PI * 2;
      const points: [number, number, number][] = [];
      // From horizon to zenith
      for (let j = 0; j <= 20; j++) {
        const alt = (j / 20) * (Math.PI / 2); // 0 to 90
        const r = radius * Math.cos(alt);
        const y = radius * Math.sin(alt);
        points.push([r * Math.sin(az), y, r * Math.cos(az)]);
      }
      lines.push(points);
    }

    return lines;
  }, [radius]);

  return (
    <group name="grid-lines">
      {azimuthalLines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color={color}
          lineWidth={1}
          opacity={opacity}
          transparent
        />
      ))}
      {/* Zenith marker */}
      <mesh position={[0, radius, 0]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 2} />
      </mesh>
    </group>
  );
}
