"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { ProcessedStar, CelestialBody } from "@/lib/astronomy";

interface TourGuideProps {
  stars: ProcessedStar[];
  planets: CelestialBody[];
  isActive: boolean;
  onClose: () => void;
  onLookAt: (target: {
    x: number;
    y: number;
    z: number;
    key: number;
    zoom?: number;
  }) => void;
}

interface TourStop {
  name: string;
  description: string;
  position: { x: number; y: number; z: number };
  type: "star" | "planet" | "constellation";
}

export function TourGuide({
  stars,
  planets,
  isActive,
  onClose,
  onLookAt,
}: TourGuideProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Build tour stops from visible objects
  const tourStops: TourStop[] = useMemo(() => {
    const stops: TourStop[] = [];

    // Add visible planets first (most interesting)
    planets
      .filter((p) => p.altAz.altitude > 0)
      .sort((a, b) => (b.magnitude || 0) - (a.magnitude || 0)) // Brighter first
      .slice(0, 3)
      .forEach((planet) => {
        stops.push({
          name: planet.name,
          description: getDescription(planet.name),
          position: planet.position,
          type: "planet",
        });
      });

    // Add brightest visible stars
    stars
      .filter((s) => s.altAz.altitude > 10) // Above horizon
      .sort((a, b) => a.mag - b.mag) // Brighter first (lower mag = brighter)
      .slice(0, 5)
      .forEach((star) => {
        if (star.name && star.name !== "") {
          stops.push({
            name: star.name,
            description: `${star.name} is a magnitude ${star.mag.toFixed(
              1
            )} star.`,
            position: star.position,
            type: "star",
          });
        }
      });

    return stops;
  }, [stars, planets]);

  // Navigate to current stop
  useEffect(() => {
    if (isActive && tourStops.length > 0 && tourStops[currentIndex]) {
      const stop = tourStops[currentIndex];
      onLookAt({
        x: stop.position.x,
        y: stop.position.y,
        z: stop.position.z,
        key: Date.now(),
        zoom: 5,
      });
    }
  }, [isActive, currentIndex, tourStops, onLookAt]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % tourStops.length);
  }, [tourStops.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + tourStops.length) % tourStops.length);
  }, [tourStops.length]);

  if (!isActive || tourStops.length === 0) return null;

  const currentStop = tourStops[currentIndex];

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-md">
      <div className="bg-black/70 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-cyan-400 font-medium tracking-wider uppercase">
            What&apos;s Up Tonight
          </span>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <h3 className="text-xl font-semibold text-white mb-1">
          {currentStop.name}
        </h3>
        <p className="text-sm text-white/70 mb-4">{currentStop.description}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg text-white/80 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-xs text-white/50">
            {currentIndex + 1} / {tourStops.length}
          </span>
          <button
            onClick={handleNext}
            className="px-3 py-1.5 text-sm bg-cyan-500/30 hover:bg-cyan-500/50 rounded-lg text-cyan-100 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

function getDescription(name: string): string {
  const descriptions: Record<string, string> = {
    Sun: "Our star, the center of our solar system.",
    Moon: "Earth's only natural satellite, illuminating our night sky.",
    Mercury: "The smallest and innermost planet in the Solar System.",
    Venus: "Often the brightest object in the sky after the Sun and Moon.",
    Mars: "The Red Planet, named after the Roman god of war.",
    Jupiter: "The largest planet, with its iconic Great Red Spot.",
    Saturn: "Famous for its stunning ring system.",
    Uranus: "An ice giant with an unusual tilted rotation.",
    Neptune: "The windiest planet in our solar system.",
  };
  return descriptions[name] || `${name} is visible tonight from your location.`;
}
