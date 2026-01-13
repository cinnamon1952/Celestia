'use client';

/**
 * Planets - Renders Sun, Moon, and planets with prominent labels
 * 
 * Uses astronomy-engine calculated positions
 * Labels always face the camera using Billboard from drei
 */

import { Billboard, Text } from '@react-three/drei';
import type { CelestialBody } from '@/lib/astronomy';

interface PlanetsProps {
  bodies: CelestialBody[];
}

// Color and size configurations for celestial bodies
const BODY_CONFIG: Record<string, { color: string; size: number; emissive?: boolean; labelColor: string }> = {
  Sun: { color: '#ffdd44', size: 4, emissive: true, labelColor: '#ffdd44' },
  Moon: { color: '#e8e8e8', size: 2.5, labelColor: '#ffffff' },
  Mercury: { color: '#b5b5b5', size: 1.0, labelColor: '#cccccc' },
  Venus: { color: '#ffeedd', size: 1.4, labelColor: '#ffeedd' },
  Mars: { color: '#ff6b4a', size: 1.2, labelColor: '#ff8866' },
  Jupiter: { color: '#d4a574', size: 1.8, labelColor: '#e8c090' },
  Saturn: { color: '#f4d59e', size: 1.6, labelColor: '#f4d59e' },
  Uranus: { color: '#7de3f4', size: 1.3, labelColor: '#7de3f4' },
  Neptune: { color: '#4a6bff', size: 1.3, labelColor: '#6688ff' },
  Pluto: { color: '#c4a484', size: 0.8, labelColor: '#d4b494' }, // Dwarf planet - smaller and brownish
  // Mars' moons
  Phobos: { color: '#ff6b4a', size: 0.2, labelColor: '#ff8866' },
  Deimos: { color: '#ff6b4a', size: 0.2, labelColor: '#ff8866' },
  // Jupiter's moons
  Io: { color: '#d4a574', size: 0.4, labelColor: '#e8c090' },
  Europa: { color: '#d4a574', size: 0.4, labelColor: '#e8c090' },
  Ganymede: { color: '#d4a574', size: 0.5, labelColor: '#e8c090' },
  Callisto: { color: '#d4a574', size: 0.5, labelColor: '#e8c090' },
  // Saturn's moons
  Mimas: { color: '#f4d59e', size: 0.2, labelColor: '#f4d59e' },
  Enceladus: { color: '#f4d59e', size: 0.25, labelColor: '#f4d59e' },
  Tethys: { color: '#f4d59e', size: 0.3, labelColor: '#f4d59e' },
  Dione: { color: '#f4d59e', size: 0.3, labelColor: '#f4d59e' },
  Rhea: { color: '#f4d59e', size: 0.35, labelColor: '#f4d59e' },
  Titan: { color: '#f4d59e', size: 0.6, labelColor: '#f4d59e' },
  Iapetus: { color: '#f4d59e', size: 0.3, labelColor: '#f4d59e' },
  // Uranus' moons
  Miranda: { color: '#7de3f4', size: 0.2, labelColor: '#7de3f4' },
  Ariel: { color: '#7de3f4', size: 0.25, labelColor: '#7de3f4' },
  Umbriel: { color: '#7de3f4', size: 0.25, labelColor: '#7de3f4' },
  Titania: { color: '#7de3f4', size: 0.35, labelColor: '#7de3f4' },
  Oberon: { color: '#7de3f4', size: 0.35, labelColor: '#7de3f4' },
  // Neptune's moons
  Triton: { color: '#4a6bff', size: 0.4, labelColor: '#6688ff' },
  Nereid: { color: '#4a6bff', size: 0.2, labelColor: '#6688ff' },
  // Pluto's moons
  Charon: { color: '#c4a484', size: 0.3, labelColor: '#d4b494' },
  Nix: { color: '#c4a484', size: 0.15, labelColor: '#d4b494' },
  Hydra: { color: '#c4a484', size: 0.15, labelColor: '#d4b494' },
  Kerberos: { color: '#c4a484', size: 0.1, labelColor: '#d4b494' },
  Styx: { color: '#c4a484', size: 0.1, labelColor: '#d4b494' },
};

interface CelestialBodyMarkerProps {
  body: CelestialBody;
}

function CelestialBodyMarker({ body }: CelestialBodyMarkerProps) {
  const config = BODY_CONFIG[body.name] || { color: '#ffffff', size: 1, labelColor: '#ffffff' };
  
  // Always render planets/moons (even if below horizon)
  // The isVisible flag is still used for info display

  return (
    <group position={[body.position.x, body.position.y, body.position.z]}>
      {/* The celestial body sphere */}
      <mesh>
        <sphereGeometry args={[config.size, 16, 16]} />
        {config.emissive ? (
          <meshBasicMaterial 
            color={config.color} 
            transparent 
            opacity={0.9}
          />
        ) : (
          <meshStandardMaterial 
            color={config.color} 
            emissive={config.color}
            emissiveIntensity={0.4}
            roughness={0.8}
          />
        )}
      </mesh>
      
      {/* Sun glow effect */}
      {body.name === 'Sun' && (
        <>
          <mesh>
            <sphereGeometry args={[config.size * 1.8, 16, 16]} />
            <meshBasicMaterial 
              color="#ffaa00" 
              transparent 
              opacity={0.12}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[config.size * 2.5, 16, 16]} />
            <meshBasicMaterial 
              color="#ff8800" 
              transparent 
              opacity={0.06}
            />
          </mesh>
        </>
      )}
      
      {/* Moon phase indicator */}
      {body.name === 'Moon' && body.phase !== undefined && (
        <mesh rotation={[0, (body.phase * Math.PI) / 180, 0]}>
          <sphereGeometry args={[config.size * 0.52, 16, 16]} />
          <meshBasicMaterial 
            color="#1a1a1a" 
            transparent 
            opacity={0.9}
          />
        </mesh>
      )}
      
      {/* Label that always faces camera */}
      <Billboard follow={true}>
        {/* Main label */}
        <Text
          position={[0, config.size + 2, 0]}
          fontSize={1.8}
          color={config.labelColor}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.15}
          outlineColor="#000000"
          fontWeight="bold"
        >
          {body.name}
        </Text>
        
        {/* Moon phase sub-label */}
        {body.name === 'Moon' && body.phase !== undefined && (
          <Text
            position={[0, config.size + 0.5, 0]}
            fontSize={1}
            color="#aaaaaa"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.08}
            outlineColor="#000000"
          >
            {getMoonPhaseName(body.phase)}
          </Text>
        )}
        
        {/* Magnitude for planets */}
        {body.name !== 'Sun' && body.name !== 'Moon' && body.magnitude !== undefined && (
          <Text
            position={[0, config.size + 0.5, 0]}
            fontSize={0.8}
            color="#888888"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.06}
            outlineColor="#000000"
          >
            {`mag ${body.magnitude.toFixed(1)}`}
          </Text>
        )}
      </Billboard>
    </group>
  );
}

/**
 * Convert Moon phase angle to human-readable name
 * Phase: 0° = New Moon, 90° = First Quarter, 180° = Full Moon, 270° = Last Quarter
 */
function getMoonPhaseName(phase: number): string {
  if (phase < 22.5 || phase >= 337.5) return 'New Moon';
  if (phase < 67.5) return 'Waxing Crescent';
  if (phase < 112.5) return 'First Quarter';
  if (phase < 157.5) return 'Waxing Gibbous';
  if (phase < 202.5) return 'Full Moon';
  if (phase < 247.5) return 'Waning Gibbous';
  if (phase < 292.5) return 'Last Quarter';
  return 'Waning Crescent';
}

export function Planets({ bodies }: PlanetsProps) {
  return (
    <group name="planets">
      {bodies.map(body => (
        <CelestialBodyMarker key={body.name} body={body} />
      ))}
    </group>
  );
}
