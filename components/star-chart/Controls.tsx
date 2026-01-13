'use client';

/**
 * Controls - Clean, minimal UI for star chart configuration
 */

import { useState, useEffect } from 'react';
import { 
  ChevronDown, ChevronUp,
  RotateCcw, Menu, X, Locate
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { GeoLocation } from '@/lib/astronomy';

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
}

// Section component
function Section({ 
  title, 
  children, 
  defaultOpen = true 
}: { 
  title: string; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-neutral-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2.5 text-left hover:bg-neutral-800/50 transition-colors"
      >
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
        )}
      </button>
      {isOpen && (
        <div className="pb-3">
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
  onChange 
}: { 
  label: string; 
  checked: boolean; 
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-neutral-300">{label}</span>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-neutral-500 scale-90"
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
}: ControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [latInput, setLatInput] = useState(location.latitude.toFixed(2));
  const [lngInput, setLngInput] = useState(location.longitude.toFixed(2));

  useEffect(() => {
    setLatInput(location.latitude.toFixed(2));
    setLngInput(location.longitude.toFixed(2));
  }, [location]);

  const formatDateTimeLocal = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleLocationSubmit = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
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
    <div className="fixed top-4 left-4 z-50">
      {/* Collapsed button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-2 rounded bg-neutral-900/95 border border-neutral-800 hover:bg-neutral-800/95 transition-colors"
        >
          <Menu className="w-4 h-4 text-neutral-400" />
          <span className="text-sm text-neutral-300">Menu</span>
        </button>
      )}

      {/* Main panel */}
      {isExpanded && (
        <div className="w-72 rounded bg-neutral-900/95 border border-neutral-800">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-800">
            <div>
              <h2 className="text-sm font-medium text-neutral-200">Celestia</h2>
              <p className="text-[10px] text-neutral-500">{starCount.toLocaleString()} stars</p>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          </div>

          {/* Content */}
          <div className="px-3 max-h-[70vh] overflow-y-auto">
            
            {/* Location */}
            <Section title="Location" defaultOpen={false}>
              <button
                onClick={onRequestGeolocation}
                disabled={isLoadingLocation}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 mb-2
                           rounded bg-neutral-800 text-neutral-300 text-sm
                           hover:bg-neutral-700 transition-colors
                           disabled:opacity-50"
              >
                <Locate className={`w-3.5 h-3.5 ${isLoadingLocation ? 'animate-pulse' : ''}`} />
                {isLoadingLocation ? 'Detecting...' : 'Use My Location'}
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-500">Latitude</label>
                  <Input
                    type="number"
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    onBlur={handleLocationSubmit}
                    onKeyDown={(e) => e.key === 'Enter' && handleLocationSubmit()}
                    className="h-7 text-xs bg-neutral-800 border-neutral-700 text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500">Longitude</label>
                  <Input
                    type="number"
                    value={lngInput}
                    onChange={(e) => setLngInput(e.target.value)}
                    onBlur={handleLocationSubmit}
                    onKeyDown={(e) => e.key === 'Enter' && handleLocationSubmit()}
                    className="h-7 text-xs bg-neutral-800 border-neutral-700 text-neutral-200"
                  />
                </div>
              </div>
            </Section>

            {/* Time */}
            <Section title="Time">
              <Input
                type="datetime-local"
                value={formatDateTimeLocal(dateTime)}
                onChange={handleDateTimeChange}
                className="h-8 text-xs bg-neutral-800 border-neutral-700 text-neutral-200 mb-2"
              />
              
              <div className="mb-2">
                <label className="text-[10px] text-neutral-500 block mb-1">Speed</label>
                <div className="flex gap-1">
                  {[
                    { speed: 0, label: '⏸' },
                    { speed: 1, label: '1×' },
                    { speed: 10, label: '10×' },
                    { speed: 100, label: '100×' },
                    { speed: 1000, label: '1k×' },
                  ].map(({ speed, label }) => (
                    <button
                      key={speed}
                      onClick={() => onTimeSpeedChange(speed)}
                      className={`flex-1 py-1 text-xs rounded transition-colors ${
                        timeSpeed === speed 
                          ? 'bg-neutral-600 text-white' 
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleResetTime}
                className="w-full flex items-center justify-center gap-1.5 py-1 text-xs
                           text-neutral-400 hover:text-neutral-300 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to now
              </button>
            </Section>

            {/* Display */}
            <Section title="Display">
              <Toggle label="Stars" checked={showStars} onChange={onShowStarsChange} />
              <Toggle label="Constellations" checked={showConstellations} onChange={onShowConstellationsChange} />
              <Toggle label="Planets" checked={showPlanets} onChange={onShowPlanetsChange} />
              <Toggle label="Deep Sky" checked={showDeepSky} onChange={onShowDeepSkyChange} />
              <Toggle label="Labels" checked={showLabels} onChange={onShowLabelsChange} />
              <Toggle label="Horizon" checked={showHorizon} onChange={onShowHorizonChange} />
            </Section>
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-neutral-800">
            <p className="text-[10px] text-neutral-600 text-center font-mono" suppressHydrationWarning>
              {dateTime.toLocaleDateString()} {dateTime.toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
