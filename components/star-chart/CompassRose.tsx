'use client';

/**
 * CompassRose - Simple compass display
 */

import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CompassRoseUIProps {
  rotation: number;
}

export function CompassRoseUI({ rotation }: CompassRoseUIProps) {
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  
  return (
    <div className="fixed bottom-6 right-4 z-50">
      <div className="relative w-14 h-14">
        {/* Ring */}
        <div className="absolute inset-0 rounded-full border border-neutral-700 bg-neutral-900/90" />
        
        {/* Compass face */}
        <div 
          className="absolute inset-1 transition-transform duration-75"
          style={{ transform: `rotate(${-normalizedRotation}deg)` }}
        >
          {/* N marker */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5">
            <span className="text-[10px] font-medium text-red-500">N</span>
          </div>
          {/* S marker */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-0.5">
            <span className="text-[10px] text-neutral-600">S</span>
          </div>
          {/* E marker */}
          <div className="absolute top-1/2 right-0 translate-x-0.5 -translate-y-1/2">
            <span className="text-[10px] text-neutral-600">E</span>
          </div>
          {/* W marker */}
          <div className="absolute top-1/2 left-0 -translate-x-0.5 -translate-y-1/2">
            <span className="text-[10px] text-neutral-600">W</span>
          </div>
        </div>
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-neutral-500" />
        </div>
      </div>
      
      {/* Heading */}
      <p className="text-center mt-1 text-[10px] text-neutral-600 font-mono">
        {normalizedRotation.toFixed(0)}°
      </p>
    </div>
  );
}

// 3D Compass tracker
export function CompassTracker({ onRotationChange }: { onRotationChange: (rotation: number) => void }) {
  const { camera } = useThree();
  
  useFrame(() => {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const azimuth = Math.atan2(direction.x, -direction.z) * (180 / Math.PI);
    onRotationChange(azimuth);
  });
  
  return null;
}
