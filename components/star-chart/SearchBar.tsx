"use client";

/**
 * SearchBar - Search for celestial objects including constellations and meteor showers
 */

import { useState, useMemo, useRef } from "react";
import { Search, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ProcessedStar,
  CelestialBody,
  DeepSkyObject,
  ConstellationDisplay,
  MeteorShowerDisplay,
} from "@/lib/astronomy";

interface SearchResult {
  type: "star" | "planet" | "deepsky" | "constellation" | "meteor" | "asteroid";
  name: string;
  data:
    | ProcessedStar
    | CelestialBody
    | DeepSkyObject
    | ConstellationDisplay
    | MeteorShowerDisplay
    | { name: string; designation: string };
  subtitle: string;
  position: { x: number; y: number; z: number } | null;
  isVisible: boolean;
}

interface SearchBarProps {
  stars: ProcessedStar[];
  planets: CelestialBody[];
  deepSkyObjects: DeepSkyObject[];
  constellations: ConstellationDisplay[];
  meteorShowers?: MeteorShowerDisplay[];
  asteroids?: Array<{ name: string; designation: string }>;
  onSelect: (
    position: { x: number; y: number; z: number },
    zoom?: number
  ) => void;
}

export function SearchBar({
  stars,
  planets,
  deepSkyObjects,
  constellations,
  meteorShowers = [],
  asteroids = [],
  onSelect,
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    // List of moon names
    const moonNames = new Set([
      "Moon",
      "Io",
      "Europa",
      "Ganymede",
      "Callisto",
      "Titan",
      "Phobos",
      "Deimos",
      "Mimas",
      "Enceladus",
      "Tethys",
      "Dione",
      "Rhea",
      "Iapetus",
      "Miranda",
      "Ariel",
      "Umbriel",
      "Titania",
      "Oberon",
      "Triton",
      "Nereid",
      "Charon",
      "Nix",
      "Hydra",
      "Kerberos",
      "Styx",
    ]);

    // Search planets first (including Sun and moons)
    planets
      .filter((p) => p.name.toLowerCase().includes(q))
      .forEach((planet) => {
        const isMoon = moonNames.has(planet.name);
        const isSun = planet.name === "Sun";

        let subtitle: string;
        if (isSun) {
          subtitle = "Star";
        } else if (isMoon) {
          subtitle = "Moon";
        } else {
          subtitle = "Planet";
        }

        results.push({
          type: isMoon ? "planet" : "planet", // Keep as planet type for now, but label correctly
          name: planet.name,
          data: planet,
          subtitle,
          position: planet.position,
          isVisible: planet.isVisible,
        });
      });

    // Search constellations
    constellations
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.abbr.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((constellation) => {
        results.push({
          type: "constellation",
          name: constellation.name,
          data: constellation,
          subtitle: `Constellation (${constellation.abbr})`,
          position: constellation.labelPosition,
          isVisible: constellation.isVisible,
        });
      });

    // Search stars
    stars
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 8)
      .forEach((star) => {
        results.push({
          type: "star",
          name: star.name,
          data: star,
          subtitle: `Star • mag ${star.mag.toFixed(1)}`,
          position: star.position,
          isVisible: star.isVisible,
        });
      });

    // Search deep sky objects
    deepSkyObjects
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((obj) => {
        results.push({
          type: "deepsky",
          name: `${obj.id} ${obj.name}`,
          data: obj,
          subtitle: obj.type,
          position: obj.position,
          isVisible: obj.isVisible,
        });
      });

    // Search meteor showers
    meteorShowers
      .filter((m) => m.name.toLowerCase().includes(q))
      .forEach((shower) => {
        results.push({
          type: "meteor",
          name: shower.name,
          data: shower,
          subtitle: shower.isActive
            ? `Active • ${shower.zhr}/hr`
            : "Meteor Shower",
          position: shower.position,
          isVisible: shower.isVisible,
        });
      });

    // Search asteroids (positions not available - would require orbital calculations)
    asteroids
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.designation.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((asteroid) => {
        results.push({
          type: "asteroid",
          name: asteroid.name || asteroid.designation,
          data: asteroid,
          subtitle: "Asteroid • Position requires orbital calculation",
          position: null, // Positions not calculated
          isVisible: false,
        });
      });

    return results.slice(0, 12);
  }, [
    query,
    stars,
    planets,
    deepSkyObjects,
    constellations,
    meteorShowers,
    asteroids,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && searchResults[selectedIndex]) {
      selectResult(searchResults[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
    }
  };

  const selectResult = (result: SearchResult) => {
    // Skip navigation if position is not available (e.g., asteroids)
    if (!result.position) {
      alert(
        `${result.name}: Position calculation requires complex orbital mechanics. This feature is coming soon!`
      );
      setIsOpen(false);
      setQuery("");
      return;
    }

    // Navigate camera to the object's position with appropriate zoom
    // Planets and stars get zoomed in, constellations stay zoomed out
    let zoom: number | undefined;
    if (result.type === "planet") {
      zoom = 0.5; // Close zoom for planets
    } else if (result.type === "star") {
      zoom = 2; // Medium zoom for stars
    } else if (result.type === "deepsky") {
      zoom = 3; // Bit further for deep sky objects
    }
    // Constellations don't get zoom (undefined = don't change)

    onSelect(result.position, zoom);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="fixed top-20 sm:top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-md pointer-events-none">
      {/* Trigger */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className={cn(
            "flex items-center gap-2 mx-auto px-4 py-2.5 rounded-full",
            "bg-black/40 backdrop-blur-xl border border-white/10",
            "hover:bg-white/10 hover:border-white/20 transition-all duration-300",
            "shadow-lg shadow-black/20 group pointer-events-auto"
          )}
        >
          <Search className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
          <span className="text-sm font-light text-white/60 group-hover:text-white transition-colors">
            Search the cosmos...
          </span>
          <div className="ml-2 px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white/40 hidden sm:block">
            /
          </div>
        </button>
      )}

      {/* Search modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 pointer-events-auto"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={cn(
              "fixed top-20 sm:top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[32rem] z-50",
              "bg-black/80 backdrop-blur-2xl border border-white/10 rounded-xl",
              "shadow-2xl shadow-black/50 overflow-hidden",
              "animate-in zoom-in-95 fade-in-0 duration-200 pointer-events-auto"
            )}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
              <Search className="w-5 h-5 text-blue-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Star, planet, constellation..."
                className="flex-1 bg-transparent text-base text-white placeholder:text-white/30 outline-none"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsOpen(false);
                  setQuery("");
                }}
                className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {query && searchResults.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-white/40">
                    No celestial objects found
                  </p>
                </div>
              )}

              {searchResults.map((result, index) => (
                <button
                  key={`${result.type}-${result.name}`}
                  onClick={() => selectResult(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 text-left transition-all",
                    index === selectedIndex
                      ? "bg-blue-500/10 border-l-2 border-blue-500"
                      : "hover:bg-white/5 border-l-2 border-transparent"
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          index === selectedIndex
                            ? "text-blue-100"
                            : "text-white/90"
                        )}
                      >
                        {result.name}
                      </p>
                      {!result.isVisible && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                          Below Horizon
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wide mt-0.5">
                      {result.subtitle}
                    </p>
                  </div>
                  {index === selectedIndex && (
                    <ChevronRight className="w-4 h-4 text-blue-400 opacity-50" />
                  )}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/10 bg-white/5 hidden sm:block">
              <span className="text-[10px] text-white/30 font-mono">
                ↑↓ to navigate • ENTER to travel • ESC to close
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
