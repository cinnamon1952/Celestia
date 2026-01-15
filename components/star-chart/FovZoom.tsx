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
        // Check deltaMode: 0 = pixel, 1 = line, 2 = page
        // If deltaY is very small (like trackpad), treat as small zoom
        let delta = e.deltaY;

        // Normalize scroll speed
        if (e.deltaMode === 1) delta *= 40;
        if (e.deltaMode === 2) delta *= 800;

        const direction = delta > 0 ? 1 : -1;

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

    // Touch handling for pinch-to-zoom
    let initialPinchDistance: number | null = null;
    let initialFov: number | null = null;

    const getDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialPinchDistance = getDistance(e.touches);
        if (camera instanceof THREE.PerspectiveCamera) {
          initialFov = camera.fov;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (
        e.touches.length === 2 &&
        initialPinchDistance !== null &&
        initialFov !== null
      ) {
        e.preventDefault(); // Prevent page scroll
        const currentDistance = getDistance(e.touches);
        const scale = initialPinchDistance / currentDistance;

        if (camera instanceof THREE.PerspectiveCamera) {
          let newFov = initialFov * scale;
          // Clamp FOV
          newFov = Math.max(minFov, Math.min(maxFov, newFov));
          camera.fov = newFov;
          camera.updateProjectionMatrix();
        }
      }
    };

    const handleTouchEnd = () => {
      initialPinchDistance = null;
      initialFov = null;
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [camera, gl, minFov, maxFov, speed]);

  return null;
}
