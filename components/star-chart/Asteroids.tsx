import { useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import {
  calculateAsteroidPositions,
  CalculatedAsteroid,
} from "@/lib/astronomy/asteroids";

interface AsteroidsProps {
  time: Date;
  showLabels?: boolean;
  onAsteroidSelect?: (asteroid: {
    name: string;
    magnitude?: number;
    diameter?: string;
    hazardous?: boolean;
  }) => void;
}

const AU_SCALE = 20; // Needs to match the rest of the app.
// I'll assume 20 for now based on what I recall (Earth ~ 20 units out?).
// If Earth is at 10, then 10. `calculateAsteroidPositions` returns AU.
// I will verify scale in next step if needed, or make it a prop.

export function Asteroids({
  time,
  showLabels = true,
  onAsteroidSelect,
}: AsteroidsProps) {
  const asteroids = useMemo(() => calculateAsteroidPositions(time), [time]);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <group name="asteroids">
      {asteroids.map((asteroid) => (
        <group
          key={asteroid.name}
          position={[
            asteroid.position.x * AU_SCALE,
            asteroid.position.y * AU_SCALE,
            asteroid.position.z * AU_SCALE,
          ]}
        >
          {/* Asteroid Mesh */}
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              onAsteroidSelect?.({
                name: asteroid.name,
                diameter: "Unknown",
                hazardous: false,
              });
            }}
            onPointerOver={() => {
              setHovered(asteroid.name);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              setHovered(null);
              document.body.style.cursor = "default";
            }}
          >
            <dodecahedronGeometry args={[0.08, 0]} /> {/* Low poly rock look */}
            <meshStandardMaterial
              color={asteroid.color}
              roughness={0.9}
              flatShading
            />
          </mesh>

          {/* Label */}
          {(showLabels || hovered === asteroid.name) && (
            <Billboard follow={true}>
              <Text
                position={[0, 0.5, 0]}
                fontSize={0.8}
                color="#aaaaaa"
                anchorX="center"
                anchorY="bottom"
                outlineWidth={0.05}
                outlineColor="#000000"
              >
                {asteroid.name}
              </Text>
            </Billboard>
          )}
        </group>
      ))}
    </group>
  );
}
