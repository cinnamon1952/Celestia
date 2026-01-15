"use client";

/**
 * Constellations - Renders constellation lines and labels
 *
 * Uses Three.js Line to draw connections between stars
 * and Billboard Text for constellation names.
 */

import { useMemo, Suspense } from "react";
import { Line, Text, Billboard, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { ConstellationDisplay } from "@/lib/astronomy";

interface ConstellationsProps {
  constellations: ConstellationDisplay[];
  showLabels?: boolean;
  showArt?: boolean;
}

// Component that loads and renders constellation art texture
function ConstellationArtTexture({ abbr }: { abbr: string }) {
  // Try to load local PNG
  const texture = useTexture(`/constellations/${abbr}.png`);

  return (
    <mesh>
      <planeGeometry args={[35, 35]} />
      <meshBasicMaterial
        map={texture}
        transparent={true}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Fallback radial gradient glow texture
function createGlowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Create radial gradient - soft blue glow
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, "rgba(100, 180, 255, 0.4)");
  gradient.addColorStop(0.3, "rgba(60, 140, 220, 0.25)");
  gradient.addColorStop(0.6, "rgba(40, 100, 180, 0.1)");
  gradient.addColorStop(1, "rgba(20, 60, 140, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Component for fallback glow effect
function ConstellationGlow() {
  const glowTexture = useMemo(() => createGlowTexture(), []);

  return (
    <mesh>
      <planeGeometry args={[40, 40]} />
      <meshBasicMaterial
        map={glowTexture}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function Constellations({
  constellations,
  showLabels = true,
  showArt = false,
}: ConstellationsProps) {
  // Filter to only visible constellations
  const visibleConstellations = useMemo(() => {
    return constellations.filter((c) => c.isVisible && c.lines.length > 0);
  }, [constellations]);

  return (
    <group name="constellations">
      {visibleConstellations.map((constellation) => (
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

          {/* Constellation Art Overlay */}
          {showArt && (
            <group
              position={[
                constellation.labelPosition.x * 1.05,
                constellation.labelPosition.y * 1.05,
                constellation.labelPosition.z * 1.05,
              ]}
            >
              <Billboard follow={true}>
                {[
                  "UMa",
                  "Ori",
                  "Leo",
                  "Sco",
                  "Ari",
                  "Tau",
                  "Gem",
                  "Cnc",
                  "Vir",
                  "Lib",
                  "Sgr",
                  "Cap",
                  "Aqr",
                  "Psc",
                  "Cas",
                  "Cyg",
                  "Cru",
                  "And",
                  "Peg",
                  "Lyr",
                ].includes(constellation.abbr) ? (
                  <Suspense fallback={<ConstellationGlow />}>
                    <ConstellationArtTexture abbr={constellation.abbr} />
                  </Suspense>
                ) : (
                  <ConstellationGlow />
                )}
              </Billboard>
            </group>
          )}

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
