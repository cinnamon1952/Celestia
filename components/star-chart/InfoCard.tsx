"use client";

/**
 * InfoCard - Clean information display for selected celestial objects
 */

import { useState, useEffect } from "react";
import { X, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProcessedStar } from "@/lib/astronomy";

interface StarInfoCardProps {
  star: ProcessedStar;
  onClose: () => void;
}

// Spectral class info
const SPECTRAL_INFO: Record<
  string,
  { temp: string; type: string; color: string }
> = {
  O: { temp: "30,000K+", type: "Blue", color: "text-blue-400" },
  B: { temp: "10,000-30,000K", type: "Blue-white", color: "text-blue-200" },
  A: { temp: "7,500-10,000K", type: "White", color: "text-white" },
  F: { temp: "6,000-7,500K", type: "Yellow-white", color: "text-yellow-100" },
  G: { temp: "5,200-6,000K", type: "Yellow", color: "text-yellow-400" },
  K: { temp: "3,700-5,200K", type: "Orange", color: "text-orange-400" },
  M: { temp: "2,400-3,700K", type: "Red", color: "text-red-400" },
};

function getSpectralInfo(spectral: string) {
  const firstLetter = spectral?.charAt(0).toUpperCase() || "G";
  return SPECTRAL_INFO[firstLetter] || SPECTRAL_INFO["G"];
}

function getCardinalDirection(azimuth: number): string {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(azimuth / 22.5) % 16;
  return directions[index];
}

export function StarInfoCard({ star, onClose }: StarInfoCardProps) {
  const spectralInfo = getSpectralInfo(star.spectral);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-2rem)] max-w-sm">
      <div
        className={cn(
          "rounded-2xl overflow-hidden",
          "bg-black/60 backdrop-blur-2xl border border-white/10",
          "shadow-2xl shadow-black/50",
          "animate-in slide-in-from-bottom-5 duration-300"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              {star.name}
            </h3>
            <p className={cn("text-xs font-medium mt-0.5", spectralInfo.color)}>
              {spectralInfo.type} star • Class {star.spectral}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors -mr-2 -mt-2"
          >
            <X className="w-4 h-4 text-white/50 hover:text-white" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-px bg-white/10">
          <div className="bg-black/40 px-5 py-3 backdrop-blur-md">
            <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">
              Magnitude
            </p>
            <p className="text-base font-mono text-white/90">
              {star.mag.toFixed(2)}
            </p>
          </div>
          <div className="bg-black/40 px-5 py-3 backdrop-blur-md">
            <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">
              Temperature
            </p>
            <p className="text-base font-mono text-white/90">
              {spectralInfo.temp}
            </p>
          </div>
          <div className="bg-black/40 px-5 py-3 backdrop-blur-md">
            <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">
              Altitude
            </p>
            <p className="text-base font-mono text-white/90">
              {star.altAz.altitude.toFixed(1)}°
              <span className="text-[10px] text-white/40 ml-1">
                {star.altAz.altitude > 0 ? "above" : "below"}
              </span>
            </p>
          </div>
          <div className="bg-black/40 px-5 py-3 backdrop-blur-md">
            <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">
              Azimuth
            </p>
            <p className="text-base font-mono text-white/90">
              {star.altAz.azimuth.toFixed(1)}°
              <span className="text-xs text-blue-300 ml-1 font-sans font-bold">
                {getCardinalDirection(star.altAz.azimuth)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MeteorShowerInfo {
  name: string;
  isActive: boolean;
  zhr: number;
}

export function TonightsSky({
  visibleStars,
  visiblePlanets,
  visibleDeepSky,
  activeMeteorShowers = [],
  asteroidCount = 0,
}: {
  visibleStars: number;
  visiblePlanets: string[];
  visibleDeepSky: number;
  activeMeteorShowers?: MeteorShowerInfo[];
  asteroidCount?: number;
}) {
  const [isOpen, setIsOpen] = useState(true);

  // Auto-collapse on mobile initially
  useEffect(() => {
    if (window.innerWidth < 1024) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(false);
    }
  }, []);

  return (
    <div className="fixed top-32 lg:top-24 right-4 z-30 flex flex-col items-end">
      {/* Tab/Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg mb-2",
          "bg-black/40 backdrop-blur-xl border border-white/10",
          "text-xs font-medium text-white/80 hover:text-white hover:bg-white/10",
          "shadow-lg transition-all duration-300"
        )}
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-300" />
        <span>Tonight&apos;s Sky</span>
        {isOpen ? (
          <ChevronUp className="w-3 h-3 opacity-50" />
        ) : (
          <ChevronDown className="w-3 h-3 opacity-50" />
        )}
      </button>

      {/* Content */}
      <div
        className={cn(
          "w-64 rounded-xl overflow-hidden transition-all duration-300 ease-in-out origin-top-right",
          "bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50",
          isOpen
            ? "opacity-100 max-h-96 scale-100"
            : "opacity-0 max-h-0 scale-95 pointer-events-none"
        )}
      >
        <div className="px-4 py-3 space-y-3">
          {/* Main stats */}
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-white/5">
            <div>
              <p className="text-[9px] text-white/40 uppercase font-semibold">
                Start Count
              </p>
              <p className="text-lg font-light text-white">
                {visibleStars.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-white/40 uppercase font-semibold">
                Deep Sky
              </p>
              <p className="text-lg font-light text-white">{visibleDeepSky}</p>
            </div>
          </div>

          {/* Planet List */}
          {visiblePlanets.length > 0 && (
            <div>
              <p className="text-[9px] text-white/40 uppercase font-semibold mb-1.5">
                Visible Planets
              </p>
              <div className="flex flex-wrap gap-1.5">
                {visiblePlanets.map((planet) => (
                  <span
                    key={planet}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-200 border border-blue-500/20"
                  >
                    {planet}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meteors */}
          {activeMeteorShowers.length > 0 && (
            <div className="pt-2 border-t border-white/5">
              <p className="text-[9px] text-white/40 uppercase font-semibold mb-2">
                Meteor Showers
              </p>
              <div className="space-y-1.5">
                {activeMeteorShowers.map((shower) => (
                  <div
                    key={shower.name}
                    className="flex items-center justify-between text-xs p-1.5 rounded bg-white/5"
                  >
                    <span className="text-white/90">{shower.name}</span>
                    <span className="text-yellow-200/80 font-mono text-[10px]">
                      {shower.zhr}/hr
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {asteroidCount > 0 && (
            <div className="pt-1 flex justify-between items-center text-xs">
              <span className="text-white/40">Tracked Asteroids</span>
              <span className="text-white/60 font-mono">{asteroidCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
