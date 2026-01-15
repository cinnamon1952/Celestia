"use client";

/**
 * Planets - Renders Sun, Moon, and planets with prominent labels
 *
 * Uses astronomy-engine calculated positions
 * Labels always face the camera using Billboard from drei
 */

import { Billboard, Text, useTexture } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { CelestialBody } from "@/lib/astronomy";

interface PlanetsProps {
  bodies: CelestialBody[];
  onBodySelect?: (body: CelestialBody) => void;
}

// Texture URLs (using high-quality public domain assets where possible)
const TEXTURE_URLS: Record<string, string> = {
  // Planets - Using reliable external sources
  Sun: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/1024px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg",
  Moon: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg",
  Earth:
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg",
  Mars: "https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg",
  Jupiter: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg",
  Venus: "https://upload.wikimedia.org/wikipedia/commons/8/85/Venus_globe.jpg",
  Saturn:
    "https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg",
  Uranus: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg",
  Neptune:
    "https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg",
  Pluto: "/textures/pluto.jpg",

  // Mars Moons
  Phobos: "/textures/phobos.jpg",
  Deimos: "/textures/deimos.jpg",

  // Jupiter Moons
  Io: "/textures/io.jpg",
  Europa: "/textures/europa.jpg",
  Ganymede: "/textures/ganymede.jpg",
  Callisto: "/textures/callisto.jpg",

  // Saturn Moons
  Mimas: "/textures/mimas.jpg",
  Enceladus: "/textures/enceladus.jpg",
  Tethys: "/textures/tethys.jpg",
  Dione: "/textures/dione.jpg",
  Rhea: "/textures/rhea.jpg",
  Titan: "/textures/titan.jpg",
  Iapetus: "/textures/lapetus.jpg", // Note: file is named lapetus.jpg

  // Uranus Moons
  Miranda: "/textures/miranda.jpg",
  Ariel: "/textures/ariel.jpeg", // Note: .jpeg extension
  Umbriel: "/textures/umbriel.jpg",
  Titania: "/textures/titania.jpg",
  Oberon: "/textures/oberon.jpg",

  // Neptune Moons
  Triton: "/textures/triton.jpg",
  Nereid: "/textures/nereid.jpg",

  // Pluto Moons
  Charon: "/textures/charon.jpg",
  // Nix, Hydra, Kerberos, Styx - no textures yet (very small moons)
};

// Moon orbital configuration - defines parent planet and orbital position
// Each moon orbits at a specific radius and angle around its parent
const MOON_ORBITS: Record<
  string,
  { parent: string; radius: number; angle: number }
> = {
  // Mars moons
  Phobos: { parent: "Mars", radius: 4, angle: 0 },
  Deimos: { parent: "Mars", radius: 6, angle: 180 },

  // Jupiter moons (Galilean) - spread evenly around Jupiter
  Io: { parent: "Jupiter", radius: 5, angle: 0 },
  Europa: { parent: "Jupiter", radius: 7, angle: 90 },
  Ganymede: { parent: "Jupiter", radius: 9, angle: 180 },
  Callisto: { parent: "Jupiter", radius: 11, angle: 270 },

  // Saturn moons - spread around Saturn
  Mimas: { parent: "Saturn", radius: 4, angle: 0 },
  Enceladus: { parent: "Saturn", radius: 5, angle: 45 },
  Tethys: { parent: "Saturn", radius: 6, angle: 90 },
  Dione: { parent: "Saturn", radius: 7, angle: 135 },
  Rhea: { parent: "Saturn", radius: 8, angle: 180 },
  Titan: { parent: "Saturn", radius: 10, angle: 225 },
  Iapetus: { parent: "Saturn", radius: 12, angle: 315 },

  // Uranus moons - spread around Uranus
  Miranda: { parent: "Uranus", radius: 4, angle: 0 },
  Ariel: { parent: "Uranus", radius: 5, angle: 72 },
  Umbriel: { parent: "Uranus", radius: 6, angle: 144 },
  Titania: { parent: "Uranus", radius: 7, angle: 216 },
  Oberon: { parent: "Uranus", radius: 8, angle: 288 },

  // Neptune moons
  Triton: { parent: "Neptune", radius: 5, angle: 0 },
  Nereid: { parent: "Neptune", radius: 8, angle: 180 },

  // Pluto moons - spread around Pluto
  Charon: { parent: "Pluto", radius: 4, angle: 0 },
  Nix: { parent: "Pluto", radius: 6, angle: 72 },
  Hydra: { parent: "Pluto", radius: 7, angle: 144 },
  Kerberos: { parent: "Pluto", radius: 8, angle: 216 },
  Styx: { parent: "Pluto", radius: 9, angle: 288 },
};

// Color and size configurations for celestial bodies
const BODY_CONFIG: Record<
  string,
  {
    color: string;
    size: number;
    emissive?: boolean;
    labelColor: string;
    texture?: string;
    labelPriority?: number; // Higher = further from center
    labelOffsetX?: number; // Horizontal offset to prevent overlap
    labelOffsetY?: number; // Vertical offset to prevent overlap
  }
> = {
  Sun: {
    color: "#ffdd44",
    size: 2.5, // Reduced from 4 to prevent overwhelming conjunctions
    emissive: true,
    labelColor: "#ffdd44",
    labelPriority: 3,
  },
  Moon: {
    color: "#e8e8e8",
    size: 2.5,
    labelColor: "#ffffff",
    texture: TEXTURE_URLS.Moon,
    labelPriority: 2,
  },
  Mercury: {
    color: "#b5b5b5",
    size: 1.0,
    labelColor: "#cccccc",
    labelPriority: 1,
  },
  Venus: {
    color: "#ffeedd",
    size: 1.4,
    labelColor: "#ffeedd",
    labelPriority: 1,
  },
  Mars: {
    color: "#ff6b4a",
    size: 1.2,
    labelColor: "#ff8866",
    labelPriority: 1,
  },
  Jupiter: {
    color: "#d4a574",
    size: 1.8,
    labelColor: "#e8c090",
    labelPriority: 1,
  },
  Saturn: {
    color: "#f4d59e",
    size: 1.6,
    labelColor: "#f4d59e",
    labelPriority: 1,
  },
  Uranus: {
    color: "#7de3f4",
    size: 1.3,
    labelColor: "#7de3f4",
    labelPriority: 1,
  },
  Neptune: {
    color: "#4a6bff",
    size: 1.3,
    labelColor: "#6688ff",
    labelPriority: 1,
  },
  Pluto: {
    color: "#c4a484",
    size: 0.8,
    labelColor: "#d4b494",
    labelPriority: 1,
  },

  // Moons - labels centered directly above each moon body
  Phobos: {
    color: "#ff6b4a",
    size: 0.8,
    labelColor: "#ff8866",
  },
  Deimos: {
    color: "#ff6b4a",
    size: 0.8,
    labelColor: "#ff8866",
  },
  Io: {
    color: "#d4a574",
    size: 0.8,
    labelColor: "#e8c090",
  },
  Europa: {
    color: "#d4a574",
    size: 0.8,
    labelColor: "#e8c090",
  },
  Ganymede: {
    color: "#d4a574",
    size: 1.0,
    labelColor: "#e8c090",
  },
  Callisto: {
    color: "#d4a574",
    size: 1.0,
    labelColor: "#e8c090",
  },
  Mimas: {
    color: "#f4d59e",
    size: 0.2,
    labelColor: "#f4d59e",
    labelPriority: 0.5,
  },
  Enceladus: {
    color: "#f4d59e",
    size: 0.25,
    labelColor: "#f4d59e",
    labelPriority: 1.5,
  },
  Tethys: {
    color: "#f4d59e",
    size: 0.3,
    labelColor: "#f4d59e",
    labelPriority: 0.5,
  },
  Dione: {
    color: "#f4d59e",
    size: 0.3,
    labelColor: "#f4d59e",
    labelPriority: 1.5,
  },
  Rhea: {
    color: "#f4d59e",
    size: 0.35,
    labelColor: "#f4d59e",
    labelPriority: 0.5,
  },
  Titan: {
    color: "#f4d59e",
    size: 0.6,
    labelColor: "#f4d59e",
    labelPriority: 1.8,
  }, // Titan higher
  Iapetus: {
    color: "#f4d59e",
    size: 0.3,
    labelColor: "#f4d59e",
    labelPriority: 0.2,
  },
  Miranda: {
    color: "#7de3f4",
    size: 0.2,
    labelColor: "#7de3f4",
    labelPriority: 0.5,
  },
  Ariel: {
    color: "#7de3f4",
    size: 0.25,
    labelColor: "#7de3f4",
    labelPriority: 1.5,
  },
  Umbriel: {
    color: "#7de3f4",
    size: 0.25,
    labelColor: "#7de3f4",
    labelPriority: 0.5,
  },
  Titania: {
    color: "#7de3f4",
    size: 0.35,
    labelColor: "#7de3f4",
    labelPriority: 1.5,
  },
  Oberon: {
    color: "#7de3f4",
    size: 0.35,
    labelColor: "#7de3f4",
    labelPriority: 0.5,
  },
  Triton: {
    color: "#4a6bff",
    size: 0.4,
    labelColor: "#6688ff",
    labelPriority: 1.5,
  },
  Nereid: {
    color: "#4a6bff",
    size: 0.2,
    labelColor: "#6688ff",
    labelPriority: 0.5,
  },
  Charon: {
    color: "#c4a484",
    size: 0.5,
    labelColor: "#d4b494",
  },
  Nix: {
    color: "#c4a484",
    size: 0.2,
    labelColor: "#d4b494",
  },
  Hydra: {
    color: "#c4a484",
    size: 0.2,
    labelColor: "#d4b494",
  },
  Kerberos: {
    color: "#c4a484",
    size: 0.15,
    labelColor: "#d4b494",
  },
  Styx: {
    color: "#c4a484",
    size: 0.15,
    labelColor: "#d4b494",
  },
};

// Sub-component for textured bodies
interface TexturedSphereProps {
  textureUrl: string;
  size: number;
  color: string;
  emissive?: boolean;
}

function TexturedSphere({
  textureUrl,
  size,
  color,
  emissive,
}: TexturedSphereProps) {
  const texture = useTexture(textureUrl);
  return (
    <mesh>
      <sphereGeometry args={[size, 32, 32]} />
      {emissive ? (
        <meshBasicMaterial
          map={texture}
          color={color}
          transparent={true}
          opacity={0.9}
        />
      ) : (
        <meshStandardMaterial
          map={texture}
          color={color}
          roughness={0.7}
          metalness={0.1}
        />
      )}
    </mesh>
  );
}

// Specialized component for Earth to handle bump/specular maps
function EarthSphere({ size, color }: { size: number; color: string }) {
  const [map, bumpMap] = useTexture([
    TEXTURE_URLS.Earth,
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg",
  ]);

  return (
    <mesh>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial
        map={map}
        color={color}
        bumpMap={bumpMap}
        bumpScale={0.05}
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  );
}

// Sub-component for solid color bodies
function SolidSphere({
  size,
  color,
  emissive,
}: {
  size: number;
  color: string;
  emissive?: boolean;
}) {
  return (
    <mesh>
      <sphereGeometry args={[size, 32, 32]} />
      {emissive ? (
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      ) : (
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.8}
        />
      )}
    </mesh>
  );
}

interface CelestialBodyMarkerProps {
  body: CelestialBody;
  allBodies: CelestialBody[];
  onBodySelect?: (body: CelestialBody) => void;
}

const MAJOR_BODIES = [
  "Sun",
  "Mercury",
  "Venus",
  "Earth",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "Moon",
];

function CelestialBodyMarker({
  body,
  allBodies,
  onBodySelect,
}: CelestialBodyMarkerProps) {
  const config = BODY_CONFIG[body.name] || {
    color: "#ffffff",
    size: 1,
    labelColor: "#ffffff",
  };

  const textureUrl = TEXTURE_URLS[body.name] || config.texture;
  const groupRef = useRef<THREE.Group>(null);
  const labelRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Calculate position - for moons, position them in orbit around their parent
  let renderPosition = {
    x: body.position.x,
    y: body.position.y,
    z: body.position.z,
  };

  const moonOrbit = MOON_ORBITS[body.name];
  if (moonOrbit) {
    // Find parent planet position
    const parent = allBodies.find((b) => b.name === moonOrbit.parent);
    if (parent) {
      // Calculate orbital offset using angle and radius
      const angleRad = (moonOrbit.angle * Math.PI) / 180;
      const offsetX = Math.cos(angleRad) * moonOrbit.radius;
      const offsetZ = Math.sin(angleRad) * moonOrbit.radius;

      renderPosition = {
        x: parent.position.x + offsetX,
        y: parent.position.y,
        z: parent.position.z + offsetZ,
      };
    }
  }

  // LOD Logic: Show minor moon labels ONLY when zoomed in (narrow FOV)
  useFrame(() => {
    if (!groupRef.current || !labelRef.current) return;

    const isMajor = MAJOR_BODIES.includes(body.name);
    // Bodies that should always be visible (Sun, Planets, Moon)
    // Minor moons are everything else

    if (camera instanceof THREE.PerspectiveCamera) {
      // Major bodies: always visible, scale with FOV to remain visible but not overwhelming

      // Update label scaling
      const scaleFactor = Math.max(camera.fov / 60, 0.3);
      labelRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);

      if (isMajor) {
        groupRef.current.visible = true;
        labelRef.current.visible = true;
        return;
      }

      // Minor moons: only visible when zoomed in
      if (camera.fov > 40) {
        groupRef.current.visible = false;
      } else {
        groupRef.current.visible = true;
        // Adjust label visibility specifically if needed, but group hides all
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[renderPosition.x, renderPosition.y, renderPosition.z]}
      onClick={(e) => {
        e.stopPropagation();
        onBodySelect?.(body);
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      {/* Render appropriate sphere type */}
      {body.name === "Earth" ? (
        <EarthSphere size={config.size} color={config.color} />
      ) : textureUrl ? (
        <TexturedSphere
          size={config.size}
          textureUrl={textureUrl}
          color={config.color}
          emissive={config.emissive}
        />
      ) : (
        <SolidSphere
          size={config.size}
          color={config.color}
          emissive={config.emissive}
        />
      )}

      {/* Sun glow effect */}
      {body.name === "Sun" && (
        <>
          <mesh>
            <sphereGeometry args={[config.size * 1.8, 32, 32]} />
            <meshBasicMaterial color="#ffaa00" transparent opacity={0.12} />
          </mesh>
          <mesh>
            <sphereGeometry args={[config.size * 2.5, 32, 32]} />
            <meshBasicMaterial color="#ff8800" transparent opacity={0.06} />
          </mesh>
        </>
      )}

      {/* Moon phase indicator (only if no texture, though with texture we might still want shadow? 
          For now simple: if texture, texture handles phase via lighting if light source is Sun.
          Our light source creates phase automatically on a sphere! 
          So we don't need manual phase mesh if textured.
      */}
      {body.name === "Moon" && body.phase !== undefined && !textureUrl && (
        <mesh rotation={[0, (body.phase * Math.PI) / 180, 0]}>
          <sphereGeometry args={[config.size * 0.52, 32, 32]} />
          <meshBasicMaterial color="#1a1a1a" transparent opacity={0.9} />
        </mesh>
      )}

      {/* Labels for all celestial bodies - centered directly above */}
      <Billboard follow={true}>
        <group ref={labelRef} position={[0, config.size + 1.5, 0]}>
          <Text
            fontSize={MAJOR_BODIES.includes(body.name) ? 1.8 : 1.0}
            color={config.labelColor}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.12}
            outlineColor="#000000"
            fontWeight="bold"
          >
            {body.name}
          </Text>

          {/* Moon phase label */}
          {body.name === "Moon" && body.phase !== undefined && (
            <Text
              position={[0, -1.2, 0]}
              fontSize={1}
              color="#aaaaaa"
              anchorX="center"
              anchorY="top"
              outlineWidth={0.08}
              outlineColor="#000000"
            >
              {getMoonPhaseName(body.phase)}
            </Text>
          )}
        </group>
      </Billboard>
    </group>
  );
}

/**
 * Convert Moon phase angle to human-readable name
 */
function getMoonPhaseName(phase: number): string {
  if (phase < 22.5 || phase >= 337.5) return "New Moon";
  if (phase < 67.5) return "Waxing Crescent";
  if (phase < 112.5) return "First Quarter";
  if (phase < 157.5) return "Waxing Gibbous";
  if (phase < 202.5) return "Full Moon";
  if (phase < 247.5) return "Waning Gibbous";
  if (phase < 292.5) return "Last Quarter";
  return "Waning Crescent";
}

export function Planets({ bodies, onBodySelect }: PlanetsProps) {
  return (
    <group name="planets">
      {bodies.map((body) => (
        <CelestialBodyMarker
          key={body.name}
          body={body}
          allBodies={bodies}
          onBodySelect={onBodySelect}
        />
      ))}
    </group>
  );
}
