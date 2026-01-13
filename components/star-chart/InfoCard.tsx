'use client';

/**
 * InfoCard - Clean information display for selected celestial objects
 */

import { X } from 'lucide-react';
import type { ProcessedStar } from '@/lib/astronomy';

interface StarInfoCardProps {
  star: ProcessedStar;
  onClose: () => void;
}

// Spectral class info
const SPECTRAL_INFO: Record<string, { temp: string; type: string }> = {
  'O': { temp: '30,000K+', type: 'Blue' },
  'B': { temp: '10,000-30,000K', type: 'Blue-white' },
  'A': { temp: '7,500-10,000K', type: 'White' },
  'F': { temp: '6,000-7,500K', type: 'Yellow-white' },
  'G': { temp: '5,200-6,000K', type: 'Yellow' },
  'K': { temp: '3,700-5,200K', type: 'Orange' },
  'M': { temp: '2,400-3,700K', type: 'Red' },
};

function getSpectralInfo(spectral: string) {
  const firstLetter = spectral?.charAt(0).toUpperCase() || 'G';
  return SPECTRAL_INFO[firstLetter] || SPECTRAL_INFO['G'];
}

function getCardinalDirection(azimuth: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(azimuth / 22.5) % 16;
  return directions[index];
}

export function StarInfoCard({ star, onClose }: StarInfoCardProps) {
  const spectralInfo = getSpectralInfo(star.spectral);
  
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="w-72 rounded bg-neutral-900/95 border border-neutral-800">
        {/* Header */}
        <div className="flex items-start justify-between px-3 py-2 border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-medium text-neutral-100">{star.name}</h3>
            <p className="text-[10px] text-neutral-500">{spectralInfo.type} star • Class {star.spectral}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-neutral-500" />
          </button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-px bg-neutral-800">
          <div className="bg-neutral-900 px-3 py-2">
            <p className="text-[10px] text-neutral-500">Magnitude</p>
            <p className="text-sm text-neutral-200">{star.mag.toFixed(2)}</p>
          </div>
          <div className="bg-neutral-900 px-3 py-2">
            <p className="text-[10px] text-neutral-500">Temperature</p>
            <p className="text-sm text-neutral-200">{spectralInfo.temp}</p>
          </div>
          <div className="bg-neutral-900 px-3 py-2">
            <p className="text-[10px] text-neutral-500">Altitude</p>
            <p className="text-sm text-neutral-200">{star.altAz.altitude.toFixed(1)}°</p>
          </div>
          <div className="bg-neutral-900 px-3 py-2">
            <p className="text-[10px] text-neutral-500">Azimuth</p>
            <p className="text-sm text-neutral-200">{star.altAz.azimuth.toFixed(1)}° {getCardinalDirection(star.altAz.azimuth)}</p>
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
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="w-52 rounded bg-neutral-900/95 border border-neutral-800">
        <div className="px-3 py-2 border-b border-neutral-800">
          <h3 className="text-xs font-medium text-neutral-300">Tonight&apos;s Sky</h3>
        </div>
        <div className="px-3 py-2 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Visible stars</span>
            <span className="text-neutral-300">{visibleStars.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Deep sky objects</span>
            <span className="text-neutral-300">{visibleDeepSky}</span>
          </div>
          {asteroidCount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500">Tracked asteroids</span>
              <span className="text-neutral-300">{asteroidCount}</span>
            </div>
          )}
          {visiblePlanets.length > 0 && (
            <div className="pt-1.5 border-t border-neutral-800">
              <p className="text-[10px] text-neutral-500 mb-1">Visible planets</p>
              <p className="text-xs text-neutral-300">{visiblePlanets.join(', ')}</p>
            </div>
          )}
          {activeMeteorShowers.length > 0 && (
            <div className="pt-1.5 border-t border-neutral-800">
              <p className="text-[10px] text-neutral-500 mb-1">Active meteor showers</p>
              {activeMeteorShowers.map(shower => (
                <div key={shower.name} className="flex justify-between text-xs">
                  <span className="text-neutral-300">{shower.name}</span>
                  <span className="text-neutral-500">{shower.zhr}/hr</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
