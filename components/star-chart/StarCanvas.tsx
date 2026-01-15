"use client";

/**
 * StarCanvas - Main Three.js canvas wrapper
 *
 * Premium star chart renderer with:
 * - Atmospheric sky dome with Milky Way
 * - Enhanced star rendering with glow
 * - Smooth camera animations
 * - All celestial elements
 */

import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Stars as DreiStars,
} from "@react-three/drei";
import { Suspense, useRef, useEffect } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type {
  ProcessedStar,
  CelestialBody,
  ConstellationDisplay,
  DeepSkyObject,
} from "@/lib/astronomy";
import { StarField } from "./StarField";
import { Constellations } from "./Constellations";
import { Planets } from "./Planets";
import { Asteroids } from "./Asteroids"; // Ensure Asteroids import
import { Satellites } from "./Satellites"; // Add Satellites import
import { Horizons, type HorizonType } from "./Horizons";
import { GridLines } from "./GridLines";
import { DeepSkyObjects } from "./DeepSkyObjects";
import { StarLabels } from "./StarLabels";
import { AtmosphericSky } from "./AtmosphericSky";
import { CompassTracker } from "./CompassRose";
import { FovZoom } from "./FovZoom";

interface StarCanvasProps {
  latitude: number;
  longitude: number;
  time: Date;
  lightPollution: number;
  horizon: HorizonType;

  // UI Toggles
  showStars: boolean;
  showConstellations: boolean;
  showConstellationArt: boolean;
  showGrid: boolean;
  showPlanets: boolean;
  showAsteroids: boolean;
  showSatellites: boolean;
  showHorizon: boolean;
  showDeepSky: boolean;
  showLabels: boolean;

  // Interaction/Camera
  initialViewDirection?: { azimuth: number; altitude: number };
  onStarSelect?: (star: ProcessedStar | null) => void;
  onBodySelect?: (body: CelestialBody) => void;
  onConstellationSelect?: (constellation: {
    name: string;
    abbr: string;
  }) => void;
  onAsteroidSelect?: (asteroid: {
    name: string;
    magnitude?: number;
    diameter?: string;
    hazardous?: boolean;
  }) => void;
  onSatelliteSelect?: (satellite: {
    name: string;
    altitude?: number;
    azimuth?: number;
  }) => void;
  selectedStar?: ProcessedStar | null;
  onCameraRotationChange?: (rotation: number) => void;
  lookAtTarget?: {
    x: number;
    y: number;
    z: number;
    key?: number;
    zoom?: number;
  } | null;

  // Data Props
  stars: ProcessedStar[];
  constellations: ConstellationDisplay[];
  planets: CelestialBody[];
  deepSkyObjects: DeepSkyObject[];
}

interface SceneProps extends StarCanvasProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

// Camera navigator - moves camera to look at target and optionally zooms
function CameraNavigator({
  target,
  controlsRef,
}: {
  target: {
    x: number;
    y: number;
    z: number;
    key?: number;
    zoom?: number;
  } | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const lastKey = useRef<number | undefined>(undefined);

  useFrame(({ camera }) => {
    // Check if we have a new target
    if (target && target.key !== lastKey.current && controlsRef.current) {
      lastKey.current = target.key;

      // Calculate target direction (normalized, at distance 10)
      const dir = new THREE.Vector3(target.x, target.y, target.z)
        .normalize()
        .multiplyScalar(10);

      // Set the orbit controls target directly
      controlsRef.current.target.copy(dir);

      // If zoom is specified, move camera closer/further from origin
      if (target.zoom !== undefined) {
        // Position camera at specified distance from origin
        // Camera looks outward from origin toward target
        const cameraPos = dir.clone().normalize().multiplyScalar(-target.zoom);
        camera.position.copy(cameraPos);
      }

      controlsRef.current.update();
    }
  });

  return null;
}

function Scene({
  stars,
  constellations,
  planets,
  deepSkyObjects,
  showStars,
  showConstellations,
  showPlanets,
  showAsteroids,
  showSatellites,
  showHorizon,
  showDeepSky,
  showLabels,
  showGrid,
  initialViewDirection,
  controlsRef,
  onStarSelect,
  onBodySelect,
  onConstellationSelect,
  onAsteroidSelect,
  onSatelliteSelect,
  selectedStar,
  onCameraRotationChange,
  lookAtTarget,
  showConstellationArt = false,
  lightPollution = 0.2,
  time,
  latitude,
  longitude,
  horizon,
}: SceneProps) {
  const hasInitialized = useRef(false);

  // Set initial camera direction ONLY ONCE on first render
  useEffect(() => {
    if (
      !hasInitialized.current &&
      controlsRef.current &&
      initialViewDirection
    ) {
      hasInitialized.current = true;
      const { azimuth, altitude } = initialViewDirection;
      const altRad = (altitude * Math.PI) / 180;
      const azRad = (azimuth * Math.PI) / 180;
      const dist = 10;

      const x = dist * Math.cos(altRad) * Math.sin(azRad);
      const y = dist * Math.sin(altRad);
      const z = -dist * Math.cos(altRad) * Math.cos(azRad);

      controlsRef.current.target.set(x, y, z);
      controlsRef.current.update();
    }
  }, [initialViewDirection, controlsRef]);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 0.1]}
        fov={60}
        near={0.1}
        far={500}
      />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={false} // Disable dolly zoom
        enableRotate={true}
        rotateSpeed={0.5}
        enableDamping={true}
        dampingFactor={0.05}
      />
      <FovZoom minFov={0.1} maxFov={90} speed={0.1} />
      <ambientLight intensity={1.5} />
      {/* Atmospheric sky with gradient and Milky Way */}
      <AtmosphericSky lightPollution={lightPollution} />
      {/* Distant background stars - scaled by light pollution */}
      <DreiStars
        radius={150}
        depth={30}
        count={Math.floor(4000 * (1 - lightPollution * 0.8))}
        factor={1.5}
        saturation={0.2}
        fade
        speed={0}
      />
      {/* Main star field */}
      {showStars && <StarField stars={stars} />}
      {/* Star labels */}
      {showLabels && showStars && (
        <StarLabels
          stars={stars}
          onStarSelect={onStarSelect}
          selectedStar={selectedStar}
        />
      )}
      {/* Constellation lines and labels */}
      {showConstellations && (
        <Constellations
          constellations={constellations}
          showLabels={showLabels}
          showArt={showConstellationArt}
          onConstellationSelect={onConstellationSelect}
        />
      )}
      {/* Planets, Sun, and Moon */}
      {showPlanets && <Planets bodies={planets} onBodySelect={onBodySelect} />}
      {/* Asteroids */}
      {showAsteroids && (
        <Asteroids
          time={time}
          showLabels={showLabels}
          onAsteroidSelect={onAsteroidSelect}
        />
      )}
      {/* Satellites */}
      {showSatellites && (
        <Satellites
          time={time}
          latitude={latitude}
          longitude={longitude}
          showLabels={showLabels}
          onSatelliteSelect={onSatelliteSelect}
        />
      )}
      {/* Deep sky objects */}
      {showDeepSky && (
        <DeepSkyObjects objects={deepSkyObjects} showLabels={showLabels} />
      )}
      {/* Horizon plane */}
      {showHorizon && (
        <Horizons type={horizon} lightPollution={lightPollution} />
      )}
      {/* Grid Lines */}
      {showGrid && <GridLines />}
      {/* Compass tracker */}
      {onCameraRotationChange && (
        <CompassTracker onRotationChange={onCameraRotationChange} />
      )}
      {/* Camera navigator */}
      <CameraNavigator
        target={lookAtTarget ?? null}
        controlsRef={controlsRef}
      />
    </>
  );
}

export function StarCanvas(props: StarCanvasProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <Canvas
      style={{ background: "#000005" }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <Scene {...props} controlsRef={controlsRef} />
      </Suspense>
    </Canvas>
  );
}
