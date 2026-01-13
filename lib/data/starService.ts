/**
 * Star catalog service - fetches HYG database for comprehensive star data
 */

import type { StarData } from '../astronomy/types';
import starsJson from './stars.json';

const HYG_URL = 'https://cdn.jsdelivr.net/gh/astronexus/HYG-Database@master/hygdata_v41.csv';
const CACHE_KEY = 'celestia_star_catalog_v2';
const MAX_MAGNITUDE = 6.0; // Naked eye visibility limit

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse HYG CSV data into star objects
 */
function parseHYGData(csvText: string): StarData[] {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];
  
  // Parse header to find column indices
  const header = parseCSVLine(lines[0]);
  const indices = {
    id: header.indexOf('id'),
    proper: header.indexOf('proper'),
    ra: header.indexOf('ra'),
    dec: header.indexOf('dec'),
    mag: header.indexOf('mag'),
    spect: header.indexOf('spect'),
    bf: header.indexOf('bf'),
  };
  
  const stars: StarData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields = parseCSVLine(line);
    
    const mag = parseFloat(fields[indices.mag]);
    const ra = parseFloat(fields[indices.ra]);
    const dec = parseFloat(fields[indices.dec]);
    
    // Skip invalid or too dim stars
    if (isNaN(mag) || isNaN(ra) || isNaN(dec)) continue;
    if (mag > MAX_MAGNITUDE) continue;
    
    const proper = fields[indices.proper] || '';
    const bf = fields[indices.bf] || '';
    const spect = fields[indices.spect] || 'G';
    
    // Use proper name, or Bayer-Flamsteed, or generate one
    let name = proper;
    if (!name && bf) {
      name = bf;
    }
    if (!name) {
      name = `HIP ${fields[indices.id]}`;
    }
    
    stars.push({
      id: parseInt(fields[indices.id]) || i,
      name,
      ra,
      dec,
      mag,
      spectral: spect.substring(0, 2) || 'G',
    });
  }
  
  // Sort by magnitude (brightest first)
  stars.sort((a, b) => a.mag - b.mag);
  
  return stars;
}

/**
 * Fetch star catalog from HYG database with caching
 */
export async function fetchStarCatalog(
  onProgress?: (percent: number, message: string) => void
): Promise<StarData[]> {
  
  // Check localStorage cache first
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        onProgress?.(100, 'Loading cached star data...');
        const data = JSON.parse(cached) as StarData[];
        if (data.length > 1000) {
          onProgress?.(100, `Loaded ${data.length} stars from cache`);
          return data;
        }
      }
    } catch {
      // Cache miss or invalid, continue to fetch
    }
  }
  
  onProgress?.(10, 'Fetching star catalog...');
  
  try {
    const response = await fetch(HYG_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    onProgress?.(50, 'Parsing star data...');
    
    const csvText = await response.text();
    const stars = parseHYGData(csvText);
    
    onProgress?.(80, `Processed ${stars.length} stars`);
    
    // Cache the results
    if (typeof window !== 'undefined' && stars.length > 1000) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(stars));
      } catch {
        // Storage full, ignore
      }
    }
    
    onProgress?.(100, `Loaded ${stars.length} stars`);
    return stars;
    
  } catch (error) {
    console.warn('Failed to fetch HYG database, using fallback:', error);
    onProgress?.(100, 'Using local star catalog');
    
    // Fallback to static JSON
    return starsJson.stars as StarData[];
  }
}
