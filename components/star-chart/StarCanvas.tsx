'use client';

/**
 * StarCanvas - Main Three.js canvas wrapper
 * 
 * Premium star chart renderer with:
 * - Atmospheric sky dome with Milky Way
 * - Enhanced star rendering with glow
 * - Smooth camera animations
 * - All celestial elements
 */

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars as DreiStars } from '@react-three/drei';
import { Suspense, useRef, useEffect } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { ProcessedStar, CelestialBody, ConstellationDisplay, DeepSkyObject } from '@/lib/astronomy';
import { StarField } from './StarField';
import { Constellations } from './Constellations';
import { Planets } from './Planets';
import { HorizonPlane } from './HorizonPlane';
import { DeepSkyObjects } from './DeepSkyObjects';
import { StarLabels } from './StarLabels';
import { AtmosphericSky } from './AtmosphericSky';
import { CompassTracker } from './CompassRose';

interface StarCanvasProps {
  stars: ProcessedStar[];
  constellations: ConstellationDisplay[];
  planets: CelestialBody[];
  deepSkyObjects: DeepSkyObject[];
  showStars: boolean;
  showConstellations: boolean;
  showPlanets: boolean;
  showHorizon: boolean;
  showDeepSky: boolean;
  showLabels: boolean;
  initialViewDirection?: { azimuth: number; altitude: number };
  onStarSelect?: (star: ProcessedStar | null) => void;
  selectedStar?: ProcessedStar | null;
  onCameraRotationChange?: (rotation: number) => void;
  lookAtTarget?: { x: number; y: number; z: number; key?: number; zoom?: number } | null | undefined;
}

interface SceneProps extends StarCanvasProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

// Camera navigator - moves camera to look at target and optionally zooms
function CameraNavigator({ 
  target, 
  controlsRef
}: { 
  target: { x: number; y: number; z: number; key?: number; zoom?: number } | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const lastKey = useRef<number | undefined>(undefined);
  
  useFrame(({ camera }) => {
    // Check if we have a new target
    if (target && target.key !== lastKey.current && controlsRef.current) {
      lastKey.current = target.key;
      
      // Calculate target direction (normalized, at distance 10)
      const dir = new THREE.Vector3(target.x, target.y, target.z).normalize().multiplyScalar(10);
      
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
  showHorizon,
  showDeepSky,
  showLabels,
  initialViewDirection,
  controlsRef,
  onStarSelect,
  selectedStar,
  onCameraRotationChange,
  lookAtTarget,
}: SceneProps) {
  const hasInitialized = useRef(false);
  
  // Set initial camera direction ONLY ONCE on first render
  useEffect(() => {
    if (!hasInitialized.current && controlsRef.current && initialViewDirection) {
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
        enableZoom={true}
        enableRotate={true}
        rotateSpeed={0.4}
        zoomSpeed={1.5}
        minDistance={0.1}
        maxDistance={100}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI - 0.1}
        enableDamping={true}
        dampingFactor={0.05}
      />

      {/* Atmospheric sky with gradient and Milky Way */}
      <AtmosphericSky />

      {/* Distant background stars */}
      <DreiStars
        radius={150}
        depth={30}
        count={4000}
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
        />
      )}

      {/* Planets, Sun, and Moon */}
      {showPlanets && <Planets bodies={planets} />}
      
      {/* Deep sky objects */}
      {showDeepSky && (
        <DeepSkyObjects 
          objects={deepSkyObjects}
          showLabels={showLabels}
        />
      )}

      {/* Horizon plane */}
      {showHorizon && <HorizonPlane />}
      
      {/* Compass tracker */}
      {onCameraRotationChange && (
        <CompassTracker onRotationChange={onCameraRotationChange} />
      )}
      
      {/* Camera navigator */}
      <CameraNavigator target={lookAtTarget ?? null} controlsRef={controlsRef} />
    </>
  );
}

export function StarCanvas(props: StarCanvasProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <Canvas
      style={{ background: '#000005' }}
      gl={{ 
        antialias: true, 
        alpha: false,
        powerPreference: 'high-performance',
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
