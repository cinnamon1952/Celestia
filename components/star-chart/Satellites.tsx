import { useMemo, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as satellite from "satellite.js";
import {
  SATELLITES,
  getSatelliteSkyPosition,
} from "@/lib/astronomy/satellites";
import * as THREE from "three";

interface SatellitesProps {
  time: Date;
  latitude: number;
  longitude: number;
  showLabels?: boolean;
  onSatelliteSelect?: (satellite: {
    name: string;
    altitude?: number;
    azimuth?: number;
  }) => void;
}

export function Satellites({
  time,
  latitude,
  longitude,
  showLabels = true,
  onSatelliteSelect,
}: SatellitesProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  // We compute positions every frame for smooth movement if time is flowing
  // But calculating SGP4 every frame for many satellites is expensive.
  // For 2 satellites it's fine.

  const satData = useMemo(() => {
    return SATELLITES.map((sat) => ({
      ...sat,
      satrec: satellite.twoline2satrec(sat.tle1, sat.tle2),
    }));
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;

    // Update children positions
    // This is a bit manual, but efficient.
    // Alternatively, we can use state, but that triggers React renders.
    // Let's use Refs for the meshes.

    satData.forEach((sat, i) => {
      const child = groupRef.current?.children[i];
      if (child) {
        const positionAndVelocity = satellite.propagate(sat.satrec, time);

        if (!positionAndVelocity) {
          child.visible = false;
          return;
        }

        // satellite.js returns boolean false on failure for position
        const positionEci = positionAndVelocity.position;

        if (positionEci && typeof positionEci !== "boolean") {
          const pos = getSatelliteSkyPosition(
            positionEci as satellite.EciVec3<number>,
            time,
            latitude,
            longitude
          );
          child.position.copy(pos);
          child.visible = pos.y > 0;
        } else {
          child.visible = false;
        }
      }
    });
  });

  return (
    <group ref={groupRef} name="satellites">
      {satData.map((sat) => (
        <group key={sat.name}>
          {/* Satellite Mesh */}
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              onSatelliteSelect?.({ name: sat.name, altitude: 0, azimuth: 0 }); // Todo: calculate alt/az
            }}
            onPointerOver={() => {
              setHovered(sat.name);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              setHovered(null);
              document.body.style.cursor = "default";
            }}
          >
            <boxGeometry args={[1, 1, 1]} /> {/* Small box icon */}
            <meshBasicMaterial color={sat.color} />
          </mesh>

          {/* Label */}
          {(showLabels || hovered === sat.name) && (
            <Billboard follow={true}>
              <Text
                position={[0, 1.5, 0]}
                fontSize={1}
                color={sat.color}
                anchorX="center"
                anchorY="bottom"
                outlineWidth={0.05}
                outlineColor="#000000"
              >
                {sat.name}
              </Text>
            </Billboard>
          )}
        </group>
      ))}
    </group>
  );
}
