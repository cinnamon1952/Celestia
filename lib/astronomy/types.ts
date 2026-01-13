/**
 * Type definitions for astronomical calculations
 */

// Geographic location on Earth
export interface GeoLocation {
  latitude: number;   // degrees, -90 to +90
  longitude: number;  // degrees, -180 to +180
}

// Equatorial coordinates (celestial sphere)
export interface EquatorialCoords {
  ra: number;   // Right Ascension in hours (0-24)
  dec: number;  // Declination in degrees (-90 to +90)
}

// Horizontal coordinates (observer's local sky)
export interface HorizontalCoords {
  altitude: number;  // degrees above horizon (-90 to +90)
  azimuth: number;   // degrees from North, clockwise (0-360)
}

// 3D Cartesian position for Three.js rendering
export interface CartesianCoords {
  x: number;
  y: number;
  z: number;
}

// Star data from catalog
export interface StarData {
  id: number;
  name: string;
  ra: number;      // Right Ascension in hours
  dec: number;     // Declination in degrees
  mag: number;     // Apparent magnitude
  spectral: string; // Spectral classification
}

// Processed star ready for rendering
export interface ProcessedStar extends StarData {
  altAz: HorizontalCoords;
  position: CartesianCoords;
  isVisible: boolean;  // Above horizon
  color: string;       // Hex color from spectral class
  size: number;        // Computed from magnitude
  opacity: number;     // Computed from magnitude
}

// Observer configuration
export interface Observer {
  location: GeoLocation;
  dateTime: Date;
}

// Celestial body for planets/sun/moon
export interface CelestialBody {
  name: string;
  altAz: HorizontalCoords;
  position: CartesianCoords;
  isVisible: boolean;
  magnitude?: number;
  phase?: number;  // For Moon
}

// Deep sky object (nebula, galaxy, cluster)
export interface DeepSkyObject {
  id: string;
  name: string;
  type: 'galaxy' | 'nebula' | 'cluster' | 'planetary' | 'supernova';
  altAz: HorizontalCoords;
  position: CartesianCoords;
  isVisible: boolean;
  magnitude: number;
  size: number; // arcminutes
  constellation: string;
  description: string;
}

// Constellation with label position
export interface ConstellationDisplay {
  name: string;
  abbr: string;
  lines: Array<{
    start: CartesianCoords;
    end: CartesianCoords;
  }>;
  labelPosition: CartesianCoords;
  isVisible: boolean;
}
