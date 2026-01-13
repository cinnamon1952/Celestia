/**
 * Celestial Objects Service
 * Fetches asteroids, comets, dwarf planets from NASA/JPL APIs
 */

// NASA API with DEMO_KEY (rate limited but works)
const NASA_API_KEY = 'DEMO_KEY';
const NASA_NEO_URL = `https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=${NASA_API_KEY}`;
const JPL_SBDB_URL = 'https://ssd-api.jpl.nasa.gov/sbdb.api';

export interface Asteroid {
  id: string;
  name: string;
  designation: string;
  absoluteMagnitude: number;
  estimatedDiameterKm: { min: number; max: number };
  isPotentiallyHazardous: boolean;
  orbitalData?: {
    semiMajorAxis: number;
    eccentricity: number;
    inclination: number;
    perihelion: number;
    aphelion: number;
    orbitalPeriod: number;
  };
}

export interface Comet {
  id: string;
  name: string;
  designation: string;
  perihelionDate?: string;
  perihelionDistance?: number;
  eccentricity?: number;
  inclination?: number;
}

export interface DwarfPlanet {
  id: string;
  name: string;
  diameter: number;
  orbitalPeriod: number;
  distanceFromSun: number;
  moons: number;
}

export interface MeteorShower {
  id: string;
  name: string;
  peak: { month: number; day: number };
  active: { start: { month: number; day: number }; end: { month: number; day: number } };
  zhr: number; // Zenithal Hourly Rate
  radiantRA: number;
  radiantDec: number;
  parentBody: string;
  speed: number; // km/s
}

// Well-known dwarf planets (static - these don't change)
export const DWARF_PLANETS: DwarfPlanet[] = [
  { id: 'pluto', name: 'Pluto', diameter: 2377, orbitalPeriod: 248, distanceFromSun: 39.5, moons: 5 },
  { id: 'eris', name: 'Eris', diameter: 2326, orbitalPeriod: 559, distanceFromSun: 67.8, moons: 1 },
  { id: 'haumea', name: 'Haumea', diameter: 1632, orbitalPeriod: 285, distanceFromSun: 43.2, moons: 2 },
  { id: 'makemake', name: 'Makemake', diameter: 1430, orbitalPeriod: 306, distanceFromSun: 45.8, moons: 1 },
  { id: 'ceres', name: 'Ceres', diameter: 946, orbitalPeriod: 4.6, distanceFromSun: 2.77, moons: 0 },
];

// Major meteor showers (annual events)
export const METEOR_SHOWERS: MeteorShower[] = [
  { id: 'quadrantids', name: 'Quadrantids', peak: { month: 1, day: 4 }, active: { start: { month: 1, day: 1 }, end: { month: 1, day: 6 } }, zhr: 120, radiantRA: 15.33, radiantDec: 49.7, parentBody: '2003 EH1', speed: 41 },
  { id: 'lyrids', name: 'Lyrids', peak: { month: 4, day: 22 }, active: { start: { month: 4, day: 16 }, end: { month: 4, day: 25 } }, zhr: 18, radiantRA: 18.07, radiantDec: 33.3, parentBody: 'C/1861 G1 Thatcher', speed: 49 },
  { id: 'eta-aquariids', name: 'Eta Aquariids', peak: { month: 5, day: 6 }, active: { start: { month: 4, day: 19 }, end: { month: 5, day: 28 } }, zhr: 50, radiantRA: 22.33, radiantDec: -1, parentBody: '1P/Halley', speed: 66 },
  { id: 'delta-aquariids', name: 'Delta Aquariids', peak: { month: 7, day: 30 }, active: { start: { month: 7, day: 12 }, end: { month: 8, day: 23 } }, zhr: 25, radiantRA: 22.67, radiantDec: -16.3, parentBody: '96P/Machholz', speed: 41 },
  { id: 'perseids', name: 'Perseids', peak: { month: 8, day: 12 }, active: { start: { month: 7, day: 17 }, end: { month: 8, day: 24 } }, zhr: 100, radiantRA: 3.07, radiantDec: 57.6, parentBody: '109P/Swift-Tuttle', speed: 59 },
  { id: 'draconids', name: 'Draconids', peak: { month: 10, day: 8 }, active: { start: { month: 10, day: 6 }, end: { month: 10, day: 10 } }, zhr: 10, radiantRA: 17.47, radiantDec: 54, parentBody: '21P/Giacobini-Zinner', speed: 20 },
  { id: 'orionids', name: 'Orionids', peak: { month: 10, day: 21 }, active: { start: { month: 10, day: 2 }, end: { month: 11, day: 7 } }, zhr: 20, radiantRA: 6.33, radiantDec: 15.6, parentBody: '1P/Halley', speed: 66 },
  { id: 'taurids', name: 'Taurids', peak: { month: 11, day: 5 }, active: { start: { month: 10, day: 1 }, end: { month: 11, day: 25 } }, zhr: 5, radiantRA: 3.73, radiantDec: 14, parentBody: '2P/Encke', speed: 27 },
  { id: 'leonids', name: 'Leonids', peak: { month: 11, day: 17 }, active: { start: { month: 11, day: 6 }, end: { month: 11, day: 30 } }, zhr: 15, radiantRA: 10.13, radiantDec: 21.6, parentBody: '55P/Tempel-Tuttle', speed: 71 },
  { id: 'geminids', name: 'Geminids', peak: { month: 12, day: 14 }, active: { start: { month: 12, day: 4 }, end: { month: 12, day: 17 } }, zhr: 150, radiantRA: 7.47, radiantDec: 32.2, parentBody: '3200 Phaethon', speed: 35 },
  { id: 'ursids', name: 'Ursids', peak: { month: 12, day: 22 }, active: { start: { month: 12, day: 17 }, end: { month: 12, day: 26 } }, zhr: 10, radiantRA: 14.47, radiantDec: 75.3, parentBody: '8P/Tuttle', speed: 33 },
];

// Notable comets to track
export const NOTABLE_COMETS = [
  '1P/Halley',
  '2P/Encke',
  '67P/Churyumov-Gerasimenko',
  '46P/Wirtanen',
  'C/2020 F3 (NEOWISE)',
];

/**
 * Fetch near-earth asteroids from NASA API
 */
export async function fetchNearEarthAsteroids(
  onProgress?: (message: string) => void
): Promise<Asteroid[]> {
  const CACHE_KEY = 'celestia_asteroids_v1';
  
  // Check cache
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache for 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          onProgress?.('Loaded asteroids from cache');
          return data;
        }
      }
    } catch {
      // Continue to fetch
    }
  }
  
  onProgress?.('Fetching asteroid data from NASA...');
  
  try {
    const response = await fetch(NASA_NEO_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    const asteroids: Asteroid[] = data.near_earth_objects.map((neo: Record<string, unknown>) => ({
      id: neo.id as string,
      name: (neo.name_limited as string) || (neo.name as string),
      designation: neo.designation as string,
      absoluteMagnitude: neo.absolute_magnitude_h as number,
      estimatedDiameterKm: {
        min: (neo.estimated_diameter as Record<string, Record<string, number>>)?.kilometers?.estimated_diameter_min || 0,
        max: (neo.estimated_diameter as Record<string, Record<string, number>>)?.kilometers?.estimated_diameter_max || 0,
      },
      isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid as boolean,
    }));
    
    // Cache results
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: asteroids, timestamp: Date.now() }));
      } catch {
        // Storage full
      }
    }
    
    onProgress?.(`Loaded ${asteroids.length} asteroids`);
    return asteroids;
    
  } catch (error) {
    console.warn('Failed to fetch asteroids:', error);
    onProgress?.('Failed to load asteroids');
    return [];
  }
}

/**
 * Fetch detailed info for a specific asteroid/comet from JPL
 */
export async function fetchObjectDetails(name: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(`${JPL_SBDB_URL}?sstr=${encodeURIComponent(name)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Notable asteroids to track (well-known ones)
 */
export const NOTABLE_ASTEROIDS = [
  '1 Ceres',
  '2 Pallas',
  '4 Vesta',
  '433 Eros',
  '951 Gaspra',
  '243 Ida',
];

/**
 * Fetch current positions for notable asteroids using JPL Horizons
 * Note: This is a simplified approach - for production, use Horizons API properly
 */
export async function fetchAsteroidPositions(
  asteroidNames: string[],
  onProgress?: (message: string) => void
): Promise<Array<{ name: string; ra: number; dec: number; magnitude: number }>> {
  // For now, return empty - full implementation would use Horizons API
  // This requires proper API setup and rate limiting
  // As a workaround, we can show asteroids in search but not render positions
  onProgress?.('Asteroid positions require JPL Horizons API setup');
  return [];
}

/**
 * Check if a meteor shower is active on a given date
 */
export function getActiveMeteorShowers(date: Date): MeteorShower[] {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  return METEOR_SHOWERS.filter(shower => {
    const { start, end } = shower.active;
    
    // Handle year wrap (e.g., Dec 17 to Jan 6)
    if (start.month > end.month) {
      return (month > start.month || (month === start.month && day >= start.day)) ||
             (month < end.month || (month === end.month && day <= end.day));
    }
    
    const afterStart = month > start.month || (month === start.month && day >= start.day);
    const beforeEnd = month < end.month || (month === end.month && day <= end.day);
    
    return afterStart && beforeEnd;
  });
}

/**
 * Get meteor shower peak info
 */
export function getMeteorShowerPeakInfo(shower: MeteorShower, year: number): { date: Date; daysUntil: number } {
  const peakDate = new Date(year, shower.peak.month - 1, shower.peak.day);
  const now = new Date();
  
  // If peak has passed this year, use next year
  if (peakDate < now) {
    peakDate.setFullYear(year + 1);
  }
  
  const daysUntil = Math.ceil((peakDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return { date: peakDate, daysUntil };
}
