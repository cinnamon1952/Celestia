import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

interface FovZoomProps {
  minFov?: number;
  maxFov?: number;
  speed?: number;
}

export function FovZoom({
  minFov = 0.5,
  maxFov = 100,
  speed = 0.05,
}: FovZoomProps) {
  const { camera, gl } = useThree();

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (camera instanceof THREE.PerspectiveCamera) {
        // Logarithmic zoom for smoother feel at different scales
        const zoomFactor = 1 + speed;
        const direction = e.deltaY > 0 ? 1 : -1;

        let newFov = camera.fov;

        if (direction > 0) {
          // Zoom out
          newFov = Math.min(newFov * zoomFactor, maxFov);
        } else {
          // Zoom in
          newFov = Math.max(newFov / zoomFactor, minFov);
        }

        camera.fov = newFov;
        camera.updateProjectionMatrix();
      }
    };

    const canvas = gl.domElement;
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [camera, gl, minFov, maxFov, speed]);

  return null;
}
