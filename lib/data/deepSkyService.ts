/**
 * Deep Sky Objects Service
 * Fetches galaxies, nebulae, clusters from SIMBAD
 */

export interface ExtendedDeepSkyObject {
  id: string;
  name: string;
  type: 'galaxy' | 'nebula' | 'cluster' | 'planetary' | 'supernova' | 'quasar' | 'other';
  ra: number; // degrees
  dec: number; // degrees
  magnitude?: number;
  constellation?: string;
  description?: string;
}

const SIMBAD_BASE = 'https://simbad.u-strasbg.fr/simbad/sim-tap/sync';

// Object type mapping from SIMBAD codes
const OTYPE_MAP: Record<string, ExtendedDeepSkyObject['type']> = {
  'G': 'galaxy',
  'GiG': 'galaxy',
  'GiP': 'galaxy',
  'AGN': 'galaxy',
  'Sy1': 'galaxy',
  'Sy2': 'galaxy',
  'QSO': 'quasar',
  'PN': 'planetary',
  'HII': 'nebula',
  'RNe': 'nebula',
  'SNR': 'supernova',
  'Cl*': 'cluster',
  'GlC': 'cluster',
  'OpC': 'cluster',
  'As*': 'cluster',
};

/**
 * Fetch bright galaxies from SIMBAD
 */
export async function fetchGalaxies(
  limit: number = 100,
  onProgress?: (message: string) => void
): Promise<ExtendedDeepSkyObject[]> {
  const CACHE_KEY = 'celestia_galaxies_v1';
  
  // Check cache
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) { // 7 day cache
          onProgress?.('Loaded galaxies from cache');
          return data;
        }
      }
    } catch {
      // Continue
    }
  }
  
  onProgress?.('Fetching galaxies from SIMBAD...');
  
  // Query for bright galaxies (NGC objects)
  const query = `SELECT TOP ${limit} main_id, ra, dec, otype FROM basic WHERE main_id LIKE 'NGC%' AND otype = 'G' ORDER BY ra`;
  
  try {
    const url = `${SIMBAD_BASE}?REQUEST=doQuery&LANG=ADQL&FORMAT=json&QUERY=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    
    const galaxies: ExtendedDeepSkyObject[] = result.data.map((row: [string, number, number, string]) => ({
      id: row[0].replace(/\s+/g, ''),
      name: row[0],
      type: 'galaxy' as const,
      ra: row[1] / 15, // Convert degrees to hours for RA
      dec: row[2],
    }));
    
    // Cache
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: galaxies, timestamp: Date.now() }));
      } catch {
        // Storage full
      }
    }
    
    onProgress?.(`Loaded ${galaxies.length} galaxies`);
    return galaxies;
    
  } catch (error) {
    console.warn('Failed to fetch galaxies:', error);
    onProgress?.('Failed to load galaxies');
    return [];
  }
}

/**
 * Fetch nebulae from SIMBAD
 */
export async function fetchNebulae(
  limit: number = 50,
  onProgress?: (message: string) => void
): Promise<ExtendedDeepSkyObject[]> {
  const CACHE_KEY = 'celestia_nebulae_v1';
  
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) {
          onProgress?.('Loaded nebulae from cache');
          return data;
        }
      }
    } catch {
      // Continue
    }
  }
  
  onProgress?.('Fetching nebulae from SIMBAD...');
  
  const query = `SELECT TOP ${limit} main_id, ra, dec, otype FROM basic WHERE main_id LIKE 'NGC%' AND (otype = 'PN' OR otype = 'HII' OR otype = 'RNe') ORDER BY ra`;
  
  try {
    const url = `${SIMBAD_BASE}?REQUEST=doQuery&LANG=ADQL&FORMAT=json&QUERY=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    
    const nebulae: ExtendedDeepSkyObject[] = result.data.map((row: [string, number, number, string]) => ({
      id: row[0].replace(/\s+/g, ''),
      name: row[0],
      type: (OTYPE_MAP[row[3]] || 'nebula') as ExtendedDeepSkyObject['type'],
      ra: row[1] / 15,
      dec: row[2],
    }));
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: nebulae, timestamp: Date.now() }));
      } catch {
        // Storage full
      }
    }
    
    onProgress?.(`Loaded ${nebulae.length} nebulae`);
    return nebulae;
    
  } catch (error) {
    console.warn('Failed to fetch nebulae:', error);
    return [];
  }
}

/**
 * Fetch star clusters from SIMBAD
 */
export async function fetchClusters(
  limit: number = 50,
  onProgress?: (message: string) => void
): Promise<ExtendedDeepSkyObject[]> {
  const CACHE_KEY = 'celestia_clusters_v1';
  
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) {
          onProgress?.('Loaded clusters from cache');
          return data;
        }
      }
    } catch {
      // Continue
    }
  }
  
  onProgress?.('Fetching star clusters from SIMBAD...');
  
  const query = `SELECT TOP ${limit} main_id, ra, dec, otype FROM basic WHERE main_id LIKE 'NGC%' AND (otype = 'Cl*' OR otype = 'GlC' OR otype = 'OpC') ORDER BY ra`;
  
  try {
    const url = `${SIMBAD_BASE}?REQUEST=doQuery&LANG=ADQL&FORMAT=json&QUERY=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    
    const clusters: ExtendedDeepSkyObject[] = result.data.map((row: [string, number, number, string]) => ({
      id: row[0].replace(/\s+/g, ''),
      name: row[0],
      type: 'cluster' as const,
      ra: row[1] / 15,
      dec: row[2],
    }));
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: clusters, timestamp: Date.now() }));
      } catch {
        // Storage full
      }
    }
    
    onProgress?.(`Loaded ${clusters.length} clusters`);
    return clusters;
    
  } catch (error) {
    console.warn('Failed to fetch clusters:', error);
    return [];
  }
}

/**
 * Fetch all deep sky objects
 */
export async function fetchAllDeepSky(
  onProgress?: (message: string) => void
): Promise<ExtendedDeepSkyObject[]> {
  const [galaxies, nebulae, clusters] = await Promise.all([
    fetchGalaxies(100, onProgress),
    fetchNebulae(50, onProgress),
    fetchClusters(50, onProgress),
  ]);
  
  return [...galaxies, ...nebulae, ...clusters];
}
