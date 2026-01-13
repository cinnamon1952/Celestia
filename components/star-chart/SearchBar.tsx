'use client';

/**
 * SearchBar - Search for celestial objects including constellations and meteor showers
 */

import { useState, useMemo, useRef } from 'react';
import { Search, X } from 'lucide-react';
import type { ProcessedStar, CelestialBody, DeepSkyObject, ConstellationDisplay, MeteorShowerDisplay } from '@/lib/astronomy';

interface SearchResult {
  type: 'star' | 'planet' | 'deepsky' | 'constellation' | 'meteor' | 'asteroid';
  name: string;
  data: ProcessedStar | CelestialBody | DeepSkyObject | ConstellationDisplay | MeteorShowerDisplay | { name: string; designation: string };
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
  onSelect: (position: { x: number; y: number; z: number }, zoom?: number) => void;
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
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    
    const q = query.toLowerCase();
    const results: SearchResult[] = [];
    
    // List of moon names
    const moonNames = new Set([
      'Moon', 'Io', 'Europa', 'Ganymede', 'Callisto', 'Titan',
      'Phobos', 'Deimos', 'Mimas', 'Enceladus', 'Tethys', 'Dione', 'Rhea', 'Iapetus',
      'Miranda', 'Ariel', 'Umbriel', 'Titania', 'Oberon',
      'Triton', 'Nereid', 'Charon', 'Nix', 'Hydra', 'Kerberos', 'Styx'
    ]);
    
    // Search planets first (including Sun and moons)
    planets
      .filter(p => p.name.toLowerCase().includes(q))
      .forEach(planet => {
        const isMoon = moonNames.has(planet.name);
        const isSun = planet.name === 'Sun';
        
        let subtitle: string;
        if (isSun) {
          subtitle = 'Star';
        } else if (isMoon) {
          subtitle = 'Moon';
        } else {
          subtitle = 'Planet';
        }
        
        results.push({
          type: isMoon ? 'planet' : 'planet', // Keep as planet type for now, but label correctly
          name: planet.name,
          data: planet,
          subtitle,
          position: planet.position,
          isVisible: planet.isVisible,
        });
      });
    
    // Search constellations
    constellations
      .filter(c => c.name.toLowerCase().includes(q) || c.abbr.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach(constellation => {
        results.push({
          type: 'constellation',
          name: constellation.name,
          data: constellation,
          subtitle: `Constellation (${constellation.abbr})`,
          position: constellation.labelPosition,
          isVisible: constellation.isVisible,
        });
      });
    
    // Search stars
    stars
      .filter(s => s.name.toLowerCase().includes(q))
      .slice(0, 8)
      .forEach(star => {
        results.push({
          type: 'star',
          name: star.name,
          data: star,
          subtitle: `Star • mag ${star.mag.toFixed(1)}`,
          position: star.position,
          isVisible: star.isVisible,
        });
      });
    
    // Search deep sky objects
    deepSkyObjects
      .filter(d => d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach(obj => {
        results.push({
          type: 'deepsky',
          name: `${obj.id} ${obj.name}`,
          data: obj,
          subtitle: obj.type,
          position: obj.position,
          isVisible: obj.isVisible,
        });
      });
    
    // Search meteor showers
    meteorShowers
      .filter(m => m.name.toLowerCase().includes(q))
      .forEach(shower => {
        results.push({
          type: 'meteor',
          name: shower.name,
          data: shower,
          subtitle: shower.isActive ? `Active • ${shower.zhr}/hr` : 'Meteor Shower',
          position: shower.position,
          isVisible: shower.isVisible,
        });
      });
    
    // Search asteroids (positions not available - would require orbital calculations)
    asteroids
      .filter(a => a.name.toLowerCase().includes(q) || a.designation.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach(asteroid => {
        results.push({
          type: 'asteroid',
          name: asteroid.name || asteroid.designation,
          data: asteroid,
          subtitle: 'Asteroid • Position requires orbital calculation',
          position: null, // Positions not calculated
          isVisible: false,
        });
      });
    
    return results.slice(0, 12);
  }, [query, stars, planets, deepSkyObjects, constellations, meteorShowers, asteroids]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
      selectResult(searchResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  const selectResult = (result: SearchResult) => {
    // Skip navigation if position is not available (e.g., asteroids)
    if (!result.position) {
      alert(`${result.name}: Position calculation requires complex orbital mechanics. This feature is coming soon!`);
      setIsOpen(false);
      setQuery('');
      return;
    }
    
    // Navigate camera to the object's position with appropriate zoom
    // Planets and stars get zoomed in, constellations stay zoomed out
    let zoom: number | undefined;
    if (result.type === 'planet') {
      zoom = 0.5; // Close zoom for planets
    } else if (result.type === 'star') {
      zoom = 2; // Medium zoom for stars
    } else if (result.type === 'deepsky') {
      zoom = 3; // Bit further for deep sky objects
    }
    // Constellations don't get zoom (undefined = don't change)
    
    onSelect(result.position, zoom);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      {/* Trigger */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-neutral-900/90 border border-neutral-800 hover:bg-neutral-800/90 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-sm text-neutral-500">Search</span>
          <kbd className="ml-1 px-1 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-600">/</kbd>
        </button>
      )}

      {/* Search modal */}
      {isOpen && (
        <div className="w-80 rounded bg-neutral-900/98 border border-neutral-800">
          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-800">
            <Search className="w-4 h-4 text-neutral-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search stars, planets, constellations..."
              className="flex-1 bg-transparent text-sm text-neutral-200 placeholder:text-neutral-600 outline-none"
              autoFocus
            />
            <button 
              onClick={() => {
                setIsOpen(false);
                setQuery('');
              }}
              className="p-0.5 rounded hover:bg-neutral-800"
            >
              <X className="w-3.5 h-3.5 text-neutral-500" />
            </button>
          </div>
          
          {/* Results */}
          <div className="max-h-64 overflow-y-auto">
            {query && searchResults.length === 0 && (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-neutral-600">No results</p>
              </div>
            )}
            
            {searchResults.map((result, index) => (
              <button
                key={`${result.type}-${result.name}`}
                onClick={() => selectResult(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                  index === selectedIndex ? 'bg-neutral-800' : 'hover:bg-neutral-800/50'
                }`}
              >
                <div>
                  <p className="text-sm text-neutral-200">{result.name}</p>
                  <p className="text-[10px] text-neutral-500">{result.subtitle}</p>
                </div>
                {!result.isVisible && (
                  <span className="text-[10px] text-neutral-600">below horizon</span>
                )}
              </button>
            ))}
          </div>
          
          {/* Footer */}
          {searchResults.length > 0 && (
            <div className="px-3 py-1.5 border-t border-neutral-800">
              <span className="text-[10px] text-neutral-600">↑↓ navigate • enter select • esc close</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
