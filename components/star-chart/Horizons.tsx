"use client";

import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";

export type HorizonType = "none" | "ocean" | "desert" | "city";

interface HorizonsProps {
  type: HorizonType;
  lightPollution: number;
}

// Simple procedural city texture generator (fallback)
function createCityTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 1024, 2560);

    // Transparent sky
    ctx.clearRect(0, 0, 1024, 256);

    // Draw buildings
    ctx.fillStyle = "#050505";
    for (let i = 0; i < 200; i++) {
      const w = 10 + Math.random() * 30;
      const h = 20 + Math.random() * 80;
      const x = Math.random() * 1024;
      ctx.fillRect(x, 256 - h, w, h);
    }
  }
  return new THREE.CanvasTexture(canvas);
}

// Simple procedural mountain texture generator
function createMountainTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 1024, 256);

    ctx.fillStyle = "#080402";
    ctx.beginPath();
    ctx.moveTo(0, 256);
    let h = 50;
    for (let x = 0; x <= 1024; x += 10) {
      h += (Math.random() - 0.5) * 20;
      h = Math.max(20, Math.min(150, h));
      ctx.lineTo(x, 256 - h);
    }
    ctx.lineTo(1024, 256);
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

function OceanHorizon({ lightPollution }: { lightPollution: number }) {
  // Dark blue water, reflective
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <circleGeometry args={[200, 64]} />
      <meshStandardMaterial
        color="#001133"
        roughness={0.1}
        metalness={0.8}
        emissive="#000510"
        emissiveIntensity={0.2 + lightPollution * 0.5}
      />
    </mesh>
  );
}

function TexturedHorizon({
  type,
  lightPollution,
}: {
  type: "city" | "desert";
  lightPollution: number;
}) {
  const texture = useMemo(() => {
    if (type === "city") return createCityTexture();
    return createMountainTexture();
  }, [type]);

  // Cylinder surrounding the viewer
  return (
    <mesh position={[0, -5, 0]}>
      <cylinderGeometry args={[50, 50, 20, 64, 1, true]} />
      <meshBasicMaterial
        map={texture}
        transparent
        side={THREE.BackSide}
        opacity={0.9}
        color={type === "desert" ? "#332211" : "#111111"}
        depthWrite={false}
      />
    </mesh>
  );
}

export function Horizons({ type, lightPollution }: HorizonsProps) {
  if (type === "none") return null;

  return (
    <group>
      {type === "ocean" && <OceanHorizon lightPollution={lightPollution} />}
      {(type === "city" || type === "desert") && (
        <TexturedHorizon type={type} lightPollution={lightPollution} />
      )}

      {/* Ground plane to cover bottom holes */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.1, 0]}>
        <circleGeometry args={[50, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );
}
