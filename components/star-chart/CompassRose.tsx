"use client";

/**
 * CompassRose - Simple compass display
 */

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface CompassRoseUIProps {
  rotation: number;
}

export function CompassRoseUI({ rotation }: CompassRoseUIProps) {
  const normalizedRotation = ((rotation % 360) + 360) % 360;

  return (
    <div className="fixed bottom-6 right-4 z-40">
      <div className="relative w-10 h-10 sm:w-14 sm:h-14">
        {/* Ring */}
        <div className="absolute inset-0 rounded-full border border-white/10 bg-black/60 backdrop-blur-xl shadow-lg shadow-black/30" />

        {/* Compass face */}
        <div
          className="absolute inset-1 transition-transform duration-75"
          style={{ transform: `rotate(${-normalizedRotation}deg)` }}
        >
          {/* N marker */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5">
            <span className="text-[10px] font-bold text-red-500/90">N</span>
          </div>
          {/* S marker */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-0.5">
            <span className="text-[10px] font-medium text-white/40">S</span>
          </div>
          {/* E marker */}
          <div className="absolute top-1/2 right-0 translate-x-0.5 -translate-y-1/2">
            <span className="text-[10px] font-medium text-white/40">E</span>
          </div>
          {/* W marker */}
          <div className="absolute top-1/2 left-0 -translate-x-0.5 -translate-y-1/2">
            <span className="text-[10px] font-medium text-white/40">W</span>
          </div>
        </div>

        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
        </div>
      </div>

      {/* Heading */}
      <p className="text-center mt-1.5 text-[9px] text-white/40 font-mono tracking-widest">
        {normalizedRotation.toFixed(0)}°
      </p>
    </div>
  );
}

// 3D Compass tracker
export function CompassTracker({
  onRotationChange,
}: {
  onRotationChange: (rotation: number) => void;
}) {
  const { camera } = useThree();

  useFrame(() => {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const azimuth = Math.atan2(direction.x, -direction.z) * (180 / Math.PI);
    onRotationChange(azimuth);
  });

  return null;
}
