"use client";

/**
 * InfoCard - Universal information display for all celestial objects
 * Supports Stars, Planets, Moons, Constellations, and Deep Sky Objects
 */

import { useState, useEffect, useCallback } from "react";
import { X, Sparkles, ChevronDown, ChevronUp, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ProcessedStar,
  CelestialBody,
  DeepSkyObject,
} from "@/lib/astronomy";

// Type for any selectable celestial object
export type SelectedObject =
  | { type: "star"; data: ProcessedStar }
  | { type: "planet" | "moon"; data: CelestialBody }
  | { type: "deepsky"; data: DeepSkyObject }
  | { type: "constellation"; data: { name: string; abbr: string } }
  | {
      type: "asteroid";
      data: {
        name: string;
        magnitude?: number;
        diameter?: string;
        hazardous?: boolean;
      };
    }
  | {
      type: "satellite";
      data: { name: string; altitude?: number; azimuth?: number };
    };

interface CelestialInfoCardProps {
  object: SelectedObject;
  onClose: () => void;
  onShare?: () => Promise<{ success: boolean; url: string }>;
}

// Spectral class info for stars
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

// Planet info (mass, diameter, type)
const PLANET_INFO: Record<
  string,
  { type: string; diameter: string; color: string }
> = {
  Sun: { type: "Star", diameter: "1.39M km", color: "text-yellow-400" },
  Moon: {
    type: "Natural Satellite",
    diameter: "3,474 km",
    color: "text-gray-300",
  },
  Mercury: {
    type: "Terrestrial Planet",
    diameter: "4,879 km",
    color: "text-gray-400",
  },
  Venus: {
    type: "Terrestrial Planet",
    diameter: "12,104 km",
    color: "text-yellow-200",
  },
  Mars: {
    type: "Terrestrial Planet",
    diameter: "6,779 km",
    color: "text-orange-400",
  },
  Jupiter: {
    type: "Gas Giant",
    diameter: "139,820 km",
    color: "text-orange-300",
  },
  Saturn: {
    type: "Gas Giant",
    diameter: "116,460 km",
    color: "text-yellow-300",
  },
  Uranus: { type: "Ice Giant", diameter: "50,724 km", color: "text-cyan-400" },
  Neptune: { type: "Ice Giant", diameter: "49,244 km", color: "text-blue-400" },
  Pluto: {
    type: "Dwarf Planet",
    diameter: "2,377 km",
    color: "text-amber-200",
  },
};

// Moon info - parent planet for moons
const MOON_PARENTS: Record<string, string> = {
  Phobos: "Mars",
  Deimos: "Mars",
  Io: "Jupiter",
  Europa: "Jupiter",
  Ganymede: "Jupiter",
  Callisto: "Jupiter",
  Mimas: "Saturn",
  Enceladus: "Saturn",
  Tethys: "Saturn",
  Dione: "Saturn",
  Rhea: "Saturn",
  Titan: "Saturn",
  Iapetus: "Saturn",
  Miranda: "Uranus",
  Ariel: "Uranus",
  Umbriel: "Uranus",
  Titania: "Uranus",
  Oberon: "Uranus",
  Triton: "Neptune",
  Nereid: "Neptune",
  Charon: "Pluto",
  Nix: "Pluto",
  Hydra: "Pluto",
  Kerberos: "Pluto",
  Styx: "Pluto",
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

export function CelestialInfoCard({
  object,
  onClose,
  onShare,
}: CelestialInfoCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (onShare) {
      const result = await onShare();
      if (result.success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      // Fallback to copying current URL
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore */
      }
    }
  }, [onShare]);

  // Render based on object type
  const renderContent = () => {
    switch (object.type) {
      case "star":
        return <StarContent star={object.data} />;
      case "planet":
        return <PlanetContent body={object.data} />;
      case "moon":
        return <MoonContent body={object.data} />;
      case "deepsky":
        return <DeepSkyContent dso={object.data} />;
      case "constellation":
        return <ConstellationContent constellation={object.data} />;
      case "asteroid":
        return <AsteroidContent asteroid={object.data} />;
      case "satellite":
        return <SatelliteContent satellite={object.data} />;
    }
  };

  const getTitle = () => {
    switch (object.type) {
      case "star":
        return object.data.name;
      case "planet":
        return object.data.name;
      case "moon":
        return object.data.name;
      case "deepsky":
        return object.data.name;
      case "constellation":
        return object.data.name;
      case "asteroid":
        return object.data.name;
      case "satellite":
        return object.data.name;
    }
  };

  const getSubtitle = () => {
    switch (object.type) {
      case "star": {
        const info = getSpectralInfo(object.data.spectral);
        return {
          text: `${info.type} star • Class ${object.data.spectral}`,
          color: info.color,
        };
      }
      case "planet": {
        const info = PLANET_INFO[object.data.name] || {
          type: "Planet",
          color: "text-white",
        };
        return { text: info.type, color: info.color };
      }
      case "moon": {
        const parent = MOON_PARENTS[object.data.name] || "Unknown";
        return { text: `Moon of ${parent}`, color: "text-purple-300" };
      }
      case "deepsky": {
        const typeLabels = {
          galaxy: "Galaxy",
          nebula: "Nebula",
          cluster: "Star Cluster",
          planetary: "Planetary Nebula",
          supernova: "Supernova Remnant",
        };
        return {
          text: typeLabels[object.data.type] || object.data.type,
          color: "text-pink-300",
        };
      }
      case "constellation":
        return {
          text: `Constellation (${object.data.abbr})`,
          color: "text-cyan-300",
        };
      case "asteroid":
        return {
          text: "Near-Earth Object",
          color: "text-red-300",
        };
      case "satellite":
        return {
          text: "Artificial Satellite",
          color: "text-blue-300",
        };
    }
  };

  const subtitle = getSubtitle();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm">
      <div
        className={cn(
          "rounded-2xl overflow-hidden",
          "bg-black/70 backdrop-blur-2xl border border-white/15",
          "shadow-2xl shadow-black/50",
          "animate-in slide-in-from-bottom-5 duration-300"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              {getTitle()}
            </h3>
            <p className={cn("text-xs font-medium mt-0.5", subtitle.color)}>
              {subtitle.text}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors -mr-2 -mt-2"
          >
            <X className="w-4 h-4 text-white/50 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        {renderContent()}

        {/* Share Button - integrated into card */}
        <div className="px-4 pb-4 pt-2">
          <button
            onClick={handleShare}
            className={cn(
              "w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
              copied
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/10 text-white/80 border border-white/10 hover:bg-white/20"
            )}
          >
            <Link2 className="w-4 h-4" />
            {copied ? "Link Copied!" : "Share View"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Star content component
function StarContent({ star }: { star: ProcessedStar }) {
  const spectralInfo = getSpectralInfo(star.spectral);

  return (
    <div className="grid grid-cols-2 gap-px bg-white/10">
      <StatBox label="Magnitude" value={star.mag.toFixed(2)} />
      <StatBox label="Temperature" value={spectralInfo.temp} />
      <StatBox
        label="Altitude"
        value={`${star.altAz.altitude.toFixed(1)}°`}
        suffix={star.altAz.altitude > 0 ? "above" : "below"}
      />
      <StatBox
        label="Azimuth"
        value={`${star.altAz.azimuth.toFixed(1)}°`}
        suffix={getCardinalDirection(star.altAz.azimuth)}
        suffixColor="text-blue-300"
      />
    </div>
  );
}

// Planet content component
function PlanetContent({ body }: { body: CelestialBody }) {
  const info = PLANET_INFO[body.name] || {
    diameter: "Unknown",
    type: "Planet",
    color: "text-white",
  };

  return (
    <div className="grid grid-cols-2 gap-px bg-white/10">
      <StatBox label="Diameter" value={info.diameter} />
      <StatBox label="Magnitude" value={body.magnitude?.toFixed(1) || "—"} />
      <StatBox
        label="Altitude"
        value={`${body.altAz.altitude.toFixed(1)}°`}
        suffix={body.altAz.altitude > 0 ? "above" : "below"}
      />
      <StatBox
        label="Azimuth"
        value={`${body.altAz.azimuth.toFixed(1)}°`}
        suffix={getCardinalDirection(body.altAz.azimuth)}
        suffixColor="text-blue-300"
      />
    </div>
  );
}

// Moon content component
function MoonContent({ body }: { body: CelestialBody }) {
  const parent = MOON_PARENTS[body.name] || "Unknown";

  return (
    <div className="grid grid-cols-2 gap-px bg-white/10">
      <StatBox label="Parent Planet" value={parent} />
      <StatBox label="Magnitude" value={body.magnitude?.toFixed(1) || "—"} />
      <StatBox
        label="Altitude"
        value={`${body.altAz.altitude.toFixed(1)}°`}
        suffix={body.altAz.altitude > 0 ? "above" : "below"}
      />
      <StatBox
        label="Azimuth"
        value={`${body.altAz.azimuth.toFixed(1)}°`}
        suffix={getCardinalDirection(body.altAz.azimuth)}
        suffixColor="text-blue-300"
      />
    </div>
  );
}

// Deep sky object content
function DeepSkyContent({ dso }: { dso: DeepSkyObject }) {
  return (
    <div className="grid grid-cols-2 gap-px bg-white/10">
      <StatBox label="Magnitude" value={dso.magnitude.toFixed(1)} />
      <StatBox label="Size" value={`${dso.size.toFixed(0)}'`} />
      <StatBox label="In" value={dso.constellation} />
      <StatBox
        label="Azimuth"
        value={`${dso.altAz.azimuth.toFixed(1)}°`}
        suffix={getCardinalDirection(dso.altAz.azimuth)}
        suffixColor="text-blue-300"
      />
    </div>
  );
}

// Constellation content
function ConstellationContent({
  constellation,
}: {
  constellation: { name: string; abbr: string };
}) {
  return (
    <div className="px-5 py-4">
      <p className="text-sm text-white/70 leading-relaxed">
        Tap on stars within this constellation to learn more about individual
        stars.
      </p>
    </div>
  );
}

function AsteroidContent({
  asteroid,
}: {
  asteroid: {
    name: string;
    magnitude?: number;
    diameter?: string;
    hazardous?: boolean;
  };
}) {
  return (
    <div className="grid grid-cols-2 gap-px bg-white/10">
      <StatBox
        label="Magnitude"
        value={asteroid.magnitude?.toFixed(1) || "—"}
      />
      <StatBox label="Diameter" value={asteroid.diameter || "—"} />
      <StatBox
        label="Hazardous"
        value={asteroid.hazardous ? "YES" : "NO"}
        suffix={asteroid.hazardous ? "Warning" : ""}
        suffixColor={asteroid.hazardous ? "text-red-400" : "text-green-400"}
      />
      <StatBox label="Type" value="NEO" />
    </div>
  );
}

function SatelliteContent({
  satellite,
}: {
  satellite: { name: string; altitude?: number; azimuth?: number };
}) {
  return (
    <div className="grid grid-cols-2 gap-px bg-white/10">
      <StatBox label="Type" value="LEO" suffix="Low Earth Orbit" />
      <StatBox label="Status" value="Active" suffixColor="text-green-400" />
      {satellite.altitude !== undefined && (
        <StatBox
          label="Altitude"
          value={`${satellite.altitude.toFixed(0)}°`}
          suffix="above horizon"
        />
      )}
      {satellite.azimuth !== undefined && (
        <StatBox
          label="Azimuth"
          value={`${satellite.azimuth.toFixed(0)}°`}
          suffix={getCardinalDirection(satellite.azimuth)}
          suffixColor="text-blue-300"
        />
      )}
    </div>
  );
}

// Reusable stat box
function StatBox({
  label,
  value,
  suffix,
  suffixColor = "text-white/40",
}: {
  label: string;
  value: string;
  suffix?: string;
  suffixColor?: string;
}) {
  return (
    <div className="bg-black/40 px-5 py-3 backdrop-blur-md">
      <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">
        {label}
      </p>
      <p className="text-base font-mono text-white/90">
        {value}
        {suffix && (
          <span className={cn("text-[10px] ml-1 font-sans", suffixColor)}>
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

// ============================================
// Legacy StarInfoCard - wrapper for backwards compatibility
// ============================================
interface StarInfoCardProps {
  star: ProcessedStar;
  onClose: () => void;
  onShare?: () => Promise<{ success: boolean; url: string }>;
}

export function StarInfoCard({ star, onClose, onShare }: StarInfoCardProps) {
  return (
    <CelestialInfoCard
      object={{ type: "star", data: star }}
      onClose={onClose}
      onShare={onShare}
    />
  );
}

// ============================================
// TonightsSky component (unchanged)
// ============================================
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
    <div className="hidden sm:flex fixed top-40 sm:top-32 lg:top-24 right-4 z-30">
      <div
        className={cn(
          "rounded-xl overflow-hidden transition-all duration-300",
          "bg-black/50 backdrop-blur-xl border border-white/10",
          "w-56"
        )}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-medium text-white/80">
              Tonight&apos;s Sky
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-white/40" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-white/40" />
          )}
        </button>

        {isOpen && (
          <div className="px-4 pb-3 space-y-2.5 text-[11px]">
            <div className="text-white/60">
              <span className="text-white/90 font-mono">
                {visibleStars.toLocaleString()}
              </span>{" "}
              visible stars
            </div>

            {visiblePlanets.length > 0 && (
              <div className="text-white/60">
                <span className="text-white/90">Planets:</span>{" "}
                {visiblePlanets.join(", ")}
              </div>
            )}

            {visibleDeepSky > 0 && (
              <div className="text-white/60">
                <span className="text-purple-300 font-mono">
                  {visibleDeepSky}
                </span>{" "}
                deep sky objects
              </div>
            )}

            {asteroidCount > 0 && (
              <div className="text-white/60">
                <span className="text-amber-300 font-mono">
                  {asteroidCount}
                </span>{" "}
                near-Earth asteroids
              </div>
            )}

            {activeMeteorShowers.length > 0 && (
              <div className="pt-1 border-t border-white/10">
                <p className="text-white/40 text-[10px] uppercase tracking-wide mb-1">
                  Active Showers
                </p>
                {activeMeteorShowers.map((shower) => (
                  <div key={shower.name} className="flex justify-between">
                    <span className="text-white/80">{shower.name}</span>
                    <span className="text-green-400 font-mono">
                      {shower.zhr}/hr
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
