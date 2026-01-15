"use client";

/**
 * Controls - Clean, minimal UI for star chart configuration
 */

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  X,
  Locate,
  Settings2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { GeoLocation } from "@/lib/astronomy";

interface ControlsProps {
  location: GeoLocation;
  onLocationChange: (location: GeoLocation) => void;
  dateTime: Date;
  onDateTimeChange: (dateTime: Date) => void;
  timeSpeed: number;
  onTimeSpeedChange: (speed: number) => void;
  showStars: boolean;
  onShowStarsChange: (show: boolean) => void;
  showConstellations: boolean;
  onShowConstellationsChange: (show: boolean) => void;
  showPlanets: boolean;
  onShowPlanetsChange: (show: boolean) => void;
  showHorizon: boolean;
  onShowHorizonChange: (show: boolean) => void;
  showDeepSky: boolean;
  onShowDeepSkyChange: (show: boolean) => void;
  showLabels: boolean;
  onShowLabelsChange: (show: boolean) => void;
  isLoadingLocation: boolean;
  onRequestGeolocation: () => void;
  starCount: number;
  showConstellationArt: boolean;
  onShowConstellationArtChange: (show: boolean) => void;
  lightPollution: number;
  onLightPollutionChange: (value: number) => void;
  horizon: string;
  onHorizonChange: (value: string) => void;
  // New Phase 2
  showAsteroids: boolean;
  onShowAsteroidsChange: (show: boolean) => void;
  showSatellites: boolean;
  onShowSatellitesChange: (show: boolean) => void;
}

// Section component
function Section({
  title,
  children,
  defaultOpen = true,
  className,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("border-b border-white/10 last:border-0", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 text-left hover:bg-white/5 transition-colors group"
      >
        <span className="text-[10px] font-semibold text-white/60 group-hover:text-white/90 uppercase tracking-widest transition-colors">
          {title}
        </span>
        {isOpen ? (
          <ChevronUp className="w-3 h-3 text-white/40" />
        ) : (
          <ChevronDown className="w-3 h-3 text-white/40" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 animate-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

// Toggle row
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 group">
      <span className="text-xs text-neutral-300 group-hover:text-white transition-colors">
        {label}
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-blue-500/80 scale-75"
      />
    </div>
  );
}

export function Controls({
  location,
  onLocationChange,
  dateTime,
  onDateTimeChange,
  timeSpeed,
  onTimeSpeedChange,
  showStars,
  onShowStarsChange,
  showConstellations,
  onShowConstellationsChange,
  showPlanets,
  onShowPlanetsChange,
  showHorizon,
  onShowHorizonChange,
  showDeepSky,
  onShowDeepSkyChange,
  showLabels,
  onShowLabelsChange,
  isLoadingLocation,
  onRequestGeolocation,
  starCount,
  showConstellationArt,
  onShowConstellationArtChange,
  lightPollution,
  onLightPollutionChange,
  horizon,
  onHorizonChange,
  showAsteroids,
  onShowAsteroidsChange,
  showSatellites,
  onShowSatellitesChange,
}: ControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [latInput, setLatInput] = useState(location.latitude.toFixed(2));
  const [lngInput, setLngInput] = useState(location.longitude.toFixed(2));

  // Auto-expand on desktop initially if needed, but let's default to closed for a cleaner initial view or stick to user preference.
  // For now, let's keep it closed by default on mobile, maybe open on desktop?
  // Let's stick to closed by default for a "wow" initial view, or use a useEffect to set it based on screen size.
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsExpanded(true);
    }
  }, []);

  useEffect(() => {
    setLatInput(location.latitude.toFixed(2));
    setLngInput(location.longitude.toFixed(2));
  }, [location]);

  const formatDateTimeLocal = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleLocationSubmit = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      onLocationChange({ latitude: lat, longitude: lng });
    }
  };

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      onDateTimeChange(newDate);
    }
  };

  const handleResetTime = () => {
    onDateTimeChange(new Date());
    onTimeSpeedChange(1);
  };

  return (
    <>
      <div
        className={cn(
          "fixed top-4 left-4 transition-all duration-300",
          isExpanded ? "z-50" : "z-40"
        )}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full",
            "bg-black/40 backdrop-blur-xl border border-white/10",
            "text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300",
            "shadow-lg shadow-black/20",
            isExpanded
              ? "opacity-0 pointer-events-none"
              : "opacity-100 pointer-events-auto"
          )}
        >
          <Settings2 className="w-5 h-5" />
        </button>

        {/* Main Panel */}
        <div
          className={cn(
            "absolute top-0 left-0 flex flex-col",
            "w-[calc(100vw-2rem)] sm:w-80 max-h-[calc(100vh-2rem)]",
            "bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl",
            "shadow-2xl shadow-black/50 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isExpanded
              ? "opacity-100 translate-x-0 pointer-events-auto scale-100"
              : "opacity-0 -translate-x-4 pointer-events-none scale-95"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-white tracking-wide">
                CELESTIA
              </h2>
              <p className="text-[10px] text-blue-200/60 font-mono tracking-tight">
                {starCount.toLocaleString()} STARS RENDERED
              </p>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-1 overflow-y-auto custom-scrollbar overscroll-contain">
            {/* Location */}
            <Section title="Location" defaultOpen={false}>
              <button
                onClick={onRequestGeolocation}
                disabled={isLoadingLocation}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-3 py-2 mb-3",
                  "rounded-lg bg-blue-500/10 border border-blue-500/20",
                  "text-blue-200 text-xs font-medium",
                  "hover:bg-blue-500/20 hover:border-blue-500/40 transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Locate
                  className={`w-3.5 h-3.5 ${
                    isLoadingLocation ? "animate-pulse" : ""
                  }`}
                />
                {isLoadingLocation
                  ? "Detecting Location..."
                  : "Use My Location"}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-white/40 uppercase tracking-wider font-semibold ml-1">
                    Latitude
                  </label>
                  <Input
                    type="number"
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    onBlur={handleLocationSubmit}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleLocationSubmit()
                    }
                    className="h-8 text-xs bg-white/5 border-white/10 text-white focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-white/40 uppercase tracking-wider font-semibold ml-1">
                    Longitude
                  </label>
                  <Input
                    type="number"
                    value={lngInput}
                    onChange={(e) => setLngInput(e.target.value)}
                    onBlur={handleLocationSubmit}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleLocationSubmit()
                    }
                    className="h-8 text-xs bg-white/5 border-white/10 text-white focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </Section>

            {/* Time */}
            <Section title="Time Travel">
              <Input
                type="datetime-local"
                value={formatDateTimeLocal(dateTime)}
                onChange={handleDateTimeChange}
                className="h-9 text-xs bg-white/5 border-white/10 text-white mb-4 focus:border-blue-500/50 focus:ring-blue-500/20 font-mono"
              />

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">
                    Simulation Speed
                  </label>
                  <span className="text-[10px] text-blue-300 font-mono">
                    {timeSpeed}x
                  </span>
                </div>
                <div className="flex gap-1 p-1 rounded-lg bg-black/40 border border-white/5">
                  {[
                    { speed: 0, label: "⏸" },
                    { speed: 1, label: "1×" },
                    { speed: 100, label: "100×" },
                    { speed: 1000, label: "1k×" },
                    { speed: 10000, label: "10k×" },
                  ].map(({ speed, label }) => (
                    <button
                      key={speed}
                      onClick={() => onTimeSpeedChange(speed)}
                      className={cn(
                        "flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all duration-200",
                        timeSpeed === speed
                          ? "bg-blue-600/80 text-white shadow-sm"
                          : "text-white/40 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleResetTime}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg
                           text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
              >
                <RotateCcw className="w-3 h-3" />
                Return to Now
              </button>
            </Section>

            {/* Display */}
            <Section title="Visibility" defaultOpen={true}>
              <div className="space-y-0.5">
                <Toggle
                  label="Star Field"
                  checked={showStars}
                  onChange={onShowStarsChange}
                />
                <Toggle
                  label="Constellation Lines"
                  checked={showConstellations}
                  onChange={onShowConstellationsChange}
                />
                <Toggle
                  label="Constellation Art"
                  checked={showConstellationArt}
                  onChange={onShowConstellationArtChange}
                />
                <Toggle
                  label="Planets"
                  checked={showPlanets}
                  onChange={onShowPlanetsChange}
                />
                <Toggle
                  label="Asteroids"
                  checked={showAsteroids}
                  onChange={onShowAsteroidsChange}
                />
                <Toggle
                  label="Satellites (ISS/HST)"
                  checked={showSatellites}
                  onChange={onShowSatellitesChange}
                />
                <Toggle
                  label="Deep Sky Objects"
                  checked={showDeepSky}
                  onChange={onShowDeepSkyChange}
                />
                <Toggle
                  label="Object Labels"
                  checked={showLabels}
                  onChange={onShowLabelsChange}
                />
                <Toggle
                  label="Horizon Plane"
                  checked={showHorizon}
                  onChange={onShowHorizonChange}
                />

                {/* Light Pollution Slider */}
                <div className="pt-2 mt-2 border-t border-white/10">
                  <div className="flex justify-between text-xs text-white/60 mb-2">
                    <span>Light Pollution</span>
                    <span className="text-[10px] text-blue-300 font-mono">
                      {(lightPollution * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={lightPollution}
                    onChange={(e) =>
                      onLightPollutionChange(parseFloat(e.target.value))
                    }
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between mt-1 text-[9px] text-white/30 font-mono">
                    <span>Dark Sky</span>
                    <span>City</span>
                  </div>
                </div>

                {/* Horizon Selection */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h3 className="text-white/90 font-medium text-sm uppercase tracking-wider">
                    Horizon
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "none", label: "None" },
                      { id: "ocean", label: "Ocean" },
                      { id: "desert", label: "Desert" },
                      { id: "city", label: "City" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => onHorizonChange(opt.id)}
                        className={`
                      px-3 py-2 text-xs rounded-lg transition-all duration-200 border
                      ${
                        horizon === opt.id
                          ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20"
                      }
                    `}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-white/10 bg-white/5 backdrop-blur-3xl">
            <p
              className="text-[10px] text-white/40 text-center font-mono tracking-wide mb-2"
              suppressHydrationWarning
            >
              {dateTime.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
              <span className="mx-2 opacity-30">|</span>
              {dateTime.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
            <button
              onClick={() => {
                localStorage.removeItem("celestia-onboarding-complete");
                window.location.reload();
              }}
              className="w-full text-[10px] text-white/30 hover:text-white/60 transition-colors py-1"
            >
              Reset Onboarding Tutorial
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
}
