/**
 * Astronomical calculations using astronomy-engine
 *
 * This module provides accurate positions for celestial bodies
 * using the astronomy-engine library (based on VSOP87/ELP theories)
 */

import * as Astronomy from "astronomy-engine";
import type {
  GeoLocation,
  HorizontalCoords,
  CelestialBody,
  ProcessedStar,
  StarData,
  DeepSkyObject,
  ConstellationDisplay,
  CartesianCoords,
} from "./types";
import {
  calculateLocalSiderealTime,
  equatorialToCartesian,
  horizontalToCartesian,
} from "./coordinates";

// Sphere radius for all celestial objects
const CELESTIAL_SPHERE_RADIUS = 100;
// Visual offset scale for moons (schematic view)
const MOON_VISUAL_SCALE = 50.0; // Multiplier to make moons visible outside planet markers

/**
 * Create an astronomy-engine Observer from our GeoLocation
 */
function createObserver(location: GeoLocation): Astronomy.Observer {
  // Height above sea level in meters (we assume sea level for simplicity)
  return new Astronomy.Observer(location.latitude, location.longitude, 0);
}

/**
 * Convert astronomy-engine horizontal coordinates to our format
 */
function astronomyHorizontalToOurs(
  hor: Astronomy.HorizontalCoordinates
): HorizontalCoords {
  return {
    altitude: hor.altitude,
    azimuth: hor.azimuth,
  };
}

/**
 * Get the position of a celestial body (planet, Sun, Moon)
 * using astronomy-engine for accuracy
 */
export function getCelestialBodyPosition(
  bodyName: string,
  location: GeoLocation,
  dateTime: Date
): CelestialBody {
  const observer = createObserver(location);
  const time = Astronomy.MakeTime(dateTime);

  // Map our body names to astronomy-engine Body enum
  const bodyMap: Record<string, Astronomy.Body> = {
    Sun: Astronomy.Body.Sun,
    Moon: Astronomy.Body.Moon,
    Mercury: Astronomy.Body.Mercury,
    Venus: Astronomy.Body.Venus,
    Mars: Astronomy.Body.Mars,
    Jupiter: Astronomy.Body.Jupiter,
    Saturn: Astronomy.Body.Saturn,
    Uranus: Astronomy.Body.Uranus,
    Neptune: Astronomy.Body.Neptune,
    Pluto: Astronomy.Body.Pluto,
  };

  const body = bodyMap[bodyName];
  if (body === undefined) {
    throw new Error(`Unknown celestial body: ${bodyName}`);
  }

  // Get equatorial coordinates
  const equatorial = Astronomy.Equator(body, time, observer, true, true);

  // Get horizontal coordinates (Alt/Az)
  const horizontal = Astronomy.Horizon(
    time,
    observer,
    equatorial.ra,
    equatorial.dec,
    "normal"
  );
  const altAz = astronomyHorizontalToOurs(horizontal);

  // Convert to Cartesian for rendering
  const position = horizontalToCartesian(altAz, CELESTIAL_SPHERE_RADIUS);

  // Get visual magnitude (apparent brightness)
  let magnitude: number | undefined;
  try {
    const illum = Astronomy.Illumination(body, time);
    magnitude = illum.mag;
  } catch {
    // Some bodies may not have illumination data at certain times
    magnitude = undefined;
  }

  // Get Moon phase if this is the Moon
  let phase: number | undefined;
  if (bodyName === "Moon") {
    const moonPhase = Astronomy.MoonPhase(time);
    phase = moonPhase; // 0-360 degrees: 0=new, 90=first quarter, 180=full, 270=last quarter
  }

  return {
    name: bodyName,
    altAz,
    position,
    isVisible: true, // Always show planets/moons even if below horizon
    magnitude,
    phase,
  };
}

/**
 * Get positions of Jupiter's major moons
 */
export function getJupiterMoons(
  location: GeoLocation,
  dateTime: Date
): CelestialBody[] {
  const time = Astronomy.MakeTime(dateTime);

  try {
    const jupiterMoons = Astronomy.JupiterMoons(time);
    const jupiterPos = getCelestialBodyPosition("Jupiter", location, dateTime);

    // Jupiter's 4 major moons: Io, Europa, Ganymede, Callisto
    const moonNames = ["Io", "Europa", "Ganymede", "Callisto"];
    const moonMagnitudes = [5.0, 5.3, 4.6, 5.7]; // Approximate visual magnitudes
    const moons: CelestialBody[] = [];

    // NOTE: 'JupiterMoonsInfo' does not have a 'moon' property; instead, it has 'io', 'europa', 'ganymede', 'callisto'
    const moonData = [
      jupiterMoons.io,
      jupiterMoons.europa,
      jupiterMoons.ganymede,
      jupiterMoons.callisto,
    ];
    for (let i = 0; i < 4; i++) {
      const moon = moonData[i];

      // Calculate angular separation from Jupiter (in arcseconds)
      // Convert to approximate sky position offset
      // The moon data provides relative positions - we'll approximate
      const separationArcsec = Math.sqrt(
        Math.pow(moon.x * 206265, 2) + Math.pow(moon.y * 206265, 2)
      );

      // Convert arcseconds to approximate angular offset on celestial sphere
      // 1 arcminute ≈ 0.0167 degrees, so we scale appropriately
      const separationDeg = separationArcsec / 3600;
      // Scale appropriately for visualization
      const offsetScale = separationDeg * MOON_VISUAL_SCALE;

      // Calculate offset direction (simplified)
      const angle = Math.atan2(moon.y, moon.x);
      const offsetX = Math.cos(angle) * offsetScale;
      const offsetZ = Math.sin(angle) * offsetScale;

      const position = {
        x: jupiterPos.position.x + offsetX,
        y: jupiterPos.position.y,
        z: jupiterPos.position.z + offsetZ,
      };

      // Slight Z-bias to bring moons in front of planet (radius 99.8 vs 100)
      const mag = Math.sqrt(
        position.x * position.x +
          position.y * position.y +
          position.z * position.z
      );
      if (mag > 0) {
        position.x = (position.x / mag) * 99.8;
        position.y = (position.y / mag) * 99.8;
        position.z = (position.z / mag) * 99.8;
      }

      moons.push({
        name: moonNames[i],
        altAz: jupiterPos.altAz, // Approximate - very close to Jupiter
        position,
        isVisible: true,
        magnitude: moonMagnitudes[i],
      });
    }

    return moons;
  } catch {
    return [];
  }
}

/**
 * Get positions of Mars' moons
 */
export function getMarsMoons(
  location: GeoLocation,
  dateTime: Date
): CelestialBody[] {
  try {
    const marsPos = getCelestialBodyPosition("Mars", location, dateTime);

    // Mars has 2 small moons: Phobos and Deimos
    const moons: CelestialBody[] = [];
    const moonData = [
      { name: "Phobos", separationArcsec: 12, magnitude: 11.3, angle: 0 },
      {
        name: "Deimos",
        separationArcsec: 30,
        magnitude: 12.4,
        angle: Math.PI / 2,
      },
    ];

    for (const moon of moonData) {
      const separationDeg = moon.separationArcsec / 3600;
      const offsetScale = separationDeg * MOON_VISUAL_SCALE * 5.0; // Boost Mars moons extra
      const offsetX = Math.cos(moon.angle) * offsetScale;
      const offsetZ = Math.sin(moon.angle) * offsetScale;

      const position = {
        x: marsPos.position.x + offsetX,
        y: marsPos.position.y,
        z: marsPos.position.z + offsetZ,
      };

      // Slight Z-bias to bring moons in front (radius 99.8 vs 100)
      const mag = Math.sqrt(
        position.x * position.x +
          position.y * position.y +
          position.z * position.z
      );
      if (mag > 0) {
        position.x = (position.x / mag) * 99.8;
        position.y = (position.y / mag) * 99.8;
        position.z = (position.z / mag) * 99.8;
      }

      moons.push({
        name: moon.name,
        altAz: marsPos.altAz,
        position,
        isVisible: true,
        magnitude: moon.magnitude,
      });
    }

    return moons;
  } catch {
    return [];
  }
}

/**
 * Get positions of Saturn's major moons
 */
export function getSaturnMoons(
  location: GeoLocation,
  dateTime: Date
): CelestialBody[] {
  try {
    const saturnPos = getCelestialBodyPosition("Saturn", location, dateTime);

    // Saturn's major moons (astronomy-engine doesn't provide these, so we approximate)
    const moons: CelestialBody[] = [];
    const moonData = [
      { name: "Mimas", separationArcsec: 3, magnitude: 12.9, angle: 0 },
      {
        name: "Enceladus",
        separationArcsec: 4,
        magnitude: 11.7,
        angle: Math.PI / 6,
      },
      {
        name: "Tethys",
        separationArcsec: 5,
        magnitude: 10.2,
        angle: Math.PI / 3,
      },
      {
        name: "Dione",
        separationArcsec: 6,
        magnitude: 10.4,
        angle: Math.PI / 2,
      },
      {
        name: "Rhea",
        separationArcsec: 8,
        magnitude: 9.7,
        angle: (2 * Math.PI) / 3,
      },
      {
        name: "Titan",
        separationArcsec: 22,
        magnitude: 8.3,
        angle: (5 * Math.PI) / 6,
      },
      {
        name: "Iapetus",
        separationArcsec: 60,
        magnitude: 10.2,
        angle: Math.PI,
      },
    ];

    for (const moon of moonData) {
      const separationDeg = moon.separationArcsec / 3600;
      const offsetScale = separationDeg * MOON_VISUAL_SCALE;
      const offsetX = Math.cos(moon.angle) * offsetScale;
      const offsetZ = Math.sin(moon.angle) * offsetScale;

      const position = {
        x: saturnPos.position.x + offsetX,
        y: saturnPos.position.y,
        z: saturnPos.position.z + offsetZ,
      };

      // Z-bias
      const mag = Math.sqrt(
        position.x * position.x +
          position.y * position.y +
          position.z * position.z
      );
      if (mag > 0) {
        position.x = (position.x / mag) * 99.8;
        position.y = (position.y / mag) * 99.8;
        position.z = (position.z / mag) * 99.8;
      }

      moons.push({
        name: moon.name,
        altAz: saturnPos.altAz,
        position,
        isVisible: true,
        magnitude: moon.magnitude,
      });
    }

    return moons;
  } catch {
    return [];
  }
}

/**
 * Get positions of Uranus' major moons
 */
export function getUranusMoons(
  location: GeoLocation,
  dateTime: Date
): CelestialBody[] {
  try {
    const uranusPos = getCelestialBodyPosition("Uranus", location, dateTime);

    // Uranus' 5 major moons
    const moons: CelestialBody[] = [];
    const moonData = [
      { name: "Miranda", separationArcsec: 3, magnitude: 15.8, angle: 0 },
      {
        name: "Ariel",
        separationArcsec: 4,
        magnitude: 14.2,
        angle: Math.PI / 5,
      },
      {
        name: "Umbriel",
        separationArcsec: 5,
        magnitude: 14.8,
        angle: (2 * Math.PI) / 5,
      },
      {
        name: "Titania",
        separationArcsec: 8,
        magnitude: 13.7,
        angle: (3 * Math.PI) / 5,
      },
      {
        name: "Oberon",
        separationArcsec: 10,
        magnitude: 13.9,
        angle: (4 * Math.PI) / 5,
      },
    ];

    for (const moon of moonData) {
      const separationDeg = moon.separationArcsec / 3600;
      const offsetScale = separationDeg * MOON_VISUAL_SCALE;
      const offsetX = Math.cos(moon.angle) * offsetScale;
      const offsetZ = Math.sin(moon.angle) * offsetScale;

      const position = {
        x: uranusPos.position.x + offsetX,
        y: uranusPos.position.y,
        z: uranusPos.position.z + offsetZ,
      };

      // Z-bias
      const mag = Math.sqrt(
        position.x * position.x +
          position.y * position.y +
          position.z * position.z
      );
      if (mag > 0) {
        position.x = (position.x / mag) * 99.8;
        position.y = (position.y / mag) * 99.8;
        position.z = (position.z / mag) * 99.8;
      }

      moons.push({
        name: moon.name,
        altAz: uranusPos.altAz,
        position,
        isVisible: true,
        magnitude: moon.magnitude,
      });
    }

    return moons;
  } catch {
    return [];
  }
}

/**
 * Get positions of Neptune's major moons
 */
export function getNeptuneMoons(
  location: GeoLocation,
  dateTime: Date
): CelestialBody[] {
  try {
    const neptunePos = getCelestialBodyPosition("Neptune", location, dateTime);

    // Neptune's major moons
    const moons: CelestialBody[] = [];
    const moonData = [
      { name: "Triton", separationArcsec: 15, magnitude: 13.5, angle: 0 },
      {
        name: "Nereid",
        separationArcsec: 220,
        magnitude: 18.7,
        angle: Math.PI / 2,
      },
    ];

    for (const moon of moonData) {
      const separationDeg = moon.separationArcsec / 3600;
      const offsetScale = separationDeg * MOON_VISUAL_SCALE;
      const offsetX = Math.cos(moon.angle) * offsetScale;
      const offsetZ = Math.sin(moon.angle) * offsetScale;

      const position = {
        x: neptunePos.position.x + offsetX,
        y: neptunePos.position.y,
        z: neptunePos.position.z + offsetZ,
      };

      // Z-bias
      const mag = Math.sqrt(
        position.x * position.x +
          position.y * position.y +
          position.z * position.z
      );
      if (mag > 0) {
        position.x = (position.x / mag) * 99.8;
        position.y = (position.y / mag) * 99.8;
        position.z = (position.z / mag) * 99.8;
      }

      moons.push({
        name: moon.name,
        altAz: neptunePos.altAz,
        position,
        isVisible: true,
        magnitude: moon.magnitude,
      });
    }

    return moons;
  } catch {
    return [];
  }
}

/**
 * Get positions of Pluto's moons
 */
export function getPlutoMoons(
  location: GeoLocation,
  dateTime: Date
): CelestialBody[] {
  try {
    const plutoPos = getCelestialBodyPosition("Pluto", location, dateTime);

    // Pluto's moons
    const moons: CelestialBody[] = [];
    const moonData = [
      { name: "Charon", separationArcsec: 0.8, magnitude: 16.8, angle: 0 },
      { name: "Nix", separationArcsec: 2, magnitude: 23.4, angle: Math.PI / 4 },
      {
        name: "Hydra",
        separationArcsec: 2.5,
        magnitude: 23.3,
        angle: Math.PI / 2,
      },
      {
        name: "Kerberos",
        separationArcsec: 1.5,
        magnitude: 26.1,
        angle: (3 * Math.PI) / 4,
      },
      { name: "Styx", separationArcsec: 1.2, magnitude: 27.0, angle: Math.PI },
    ];

    for (const moon of moonData) {
      const separationDeg = moon.separationArcsec / 3600;
      const offsetScale = separationDeg * MOON_VISUAL_SCALE * 3.0; // Boost
      const offsetX = Math.cos(moon.angle) * offsetScale;
      const offsetZ = Math.sin(moon.angle) * offsetScale;

      const position = {
        x: plutoPos.position.x + offsetX,
        y: plutoPos.position.y,
        z: plutoPos.position.z + offsetZ,
      };

      // Z-bias
      const mag = Math.sqrt(
        position.x * position.x +
          position.y * position.y +
          position.z * position.z
      );
      if (mag > 0) {
        position.x = (position.x / mag) * 99.8;
        position.y = (position.y / mag) * 99.8;
        position.z = (position.z / mag) * 99.8;
      }

      moons.push({
        name: moon.name,
        altAz: plutoPos.altAz,
        position,
        isVisible: true,
        magnitude: moon.magnitude,
      });
    }

    return moons;
  } catch {
    return [];
  }
}

/**
 * Get positions for all major celestial bodies including dwarf planets and moons
 */
export function getAllCelestialBodies(
  location: GeoLocation,
  dateTime: Date
): CelestialBody[] {
  // All planets including Pluto (dwarf planet)
  const bodies = [
    "Sun",
    "Moon",
    "Mercury",
    "Venus",
    "Mars",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptune",
    "Pluto", // Dwarf planet but astronomy-engine supports it
  ];

  const planets = bodies.map((name) =>
    getCelestialBodyPosition(name, location, dateTime)
  );

  // Add all moons
  const marsMoons = getMarsMoons(location, dateTime);
  const jupiterMoons = getJupiterMoons(location, dateTime);
  const saturnMoons = getSaturnMoons(location, dateTime);
  const uranusMoons = getUranusMoons(location, dateTime);
  const neptuneMoons = getNeptuneMoons(location, dateTime);
  const plutoMoons = getPlutoMoons(location, dateTime);

  return [
    ...planets,
    ...marsMoons,
    ...jupiterMoons,
    ...saturnMoons,
    ...uranusMoons,
    ...neptuneMoons,
    ...plutoMoons,
  ];
}

/**
 * Spectral class to color mapping
 * Based on blackbody radiation temperatures of stars
 */
const SPECTRAL_COLORS: Record<string, string> = {
  O: "#9bb0ff", // Blue - very hot (25,000-40,000K)
  B: "#aabfff", // Blue-white (10,000-25,000K)
  A: "#cad7ff", // White (7,500-10,000K)
  F: "#f8f7ff", // Yellow-white (6,000-7,500K)
  G: "#fff4ea", // Yellow (5,000-6,000K) - like our Sun
  K: "#ffd2a1", // Orange (3,500-5,000K)
  M: "#ffcc6f", // Red-orange (2,500-3,500K)
  L: "#ff8c42", // Red-brown (1,300-2,500K)
  T: "#ff6b35", // Brown (700-1,300K)
  C: "#ff6b35", // Carbon stars (red)
  S: "#ff8c42", // Cool giants with ZrO bands
};

/**
 * Get star color from spectral classification
 * Spectral class is the first letter of the classification string
 */
export function getStarColor(spectralClass: string): string {
  if (!spectralClass || spectralClass.length === 0) {
    return "#ffffff"; // Default to white
  }

  const firstLetter = spectralClass.charAt(0).toUpperCase();
  return SPECTRAL_COLORS[firstLetter] || "#ffffff";
}

/**
 * Calculate star size based on apparent magnitude
 * Brighter stars (lower magnitude) should appear larger
 *
 * Magnitude scale is logarithmic:
 * - Each magnitude step is ~2.512x brightness difference
 * - Sirius: -1.46 (brightest)
 * - Limit of naked eye: ~6.0
 */
export function getStarSize(magnitude: number): number {
  // Map magnitude range to size range
  // Brightest stars (mag -1.5) -> size 0.8
  // Dimmest stars (mag 5.0) -> size 0.15
  const minMag = -1.5;
  const maxMag = 5.0;
  const minSize = 0.15;
  const maxSize = 0.8;

  // Clamp magnitude to our range
  const clampedMag = Math.max(minMag, Math.min(maxMag, magnitude));

  // Linear interpolation (inverted because lower magnitude = brighter)
  const t = (clampedMag - minMag) / (maxMag - minMag);
  return maxSize - t * (maxSize - minSize);
}

/**
 * Calculate star opacity based on apparent magnitude
 * Fainter stars should be less opaque
 */
export function getStarOpacity(magnitude: number): number {
  // Map magnitude to opacity
  // Brightest (mag -1.5) -> opacity 1.0
  // Dimmest (mag 5.0) -> opacity 0.4
  const minMag = -1.5;
  const maxMag = 5.0;
  const minOpacity = 0.4;
  const maxOpacity = 1.0;

  const clampedMag = Math.max(minMag, Math.min(maxMag, magnitude));
  const t = (clampedMag - minMag) / (maxMag - minMag);
  return maxOpacity - t * (maxOpacity - minOpacity);
}

/**
 * Process a star catalog entry into a renderable star
 * Calculates position, visibility, color, size, and opacity
 */
export function processStarForRendering(
  star: StarData,
  location: GeoLocation,
  dateTime: Date
): ProcessedStar {
  const lst = calculateLocalSiderealTime(dateTime, location.longitude);

  const { position, altAz } = equatorialToCartesian(
    { ra: star.ra, dec: star.dec },
    location,
    lst,
    CELESTIAL_SPHERE_RADIUS
  );

  return {
    ...star,
    altAz,
    position,
    isVisible: altAz.altitude > 0,
    color: getStarColor(star.spectral),
    size: getStarSize(star.mag),
    opacity: getStarOpacity(star.mag),
  };
}

/**
 * Process an entire star catalog for rendering
 */
export function processStarCatalog(
  stars: StarData[],
  location: GeoLocation,
  dateTime: Date
): ProcessedStar[] {
  return stars.map((star) => processStarForRendering(star, location, dateTime));
}

/**
 * Get the time speed multiplier label
 */
export function getTimeSpeedLabel(multiplier: number): string {
  if (multiplier === 1) return "1×";
  if (multiplier === 10) return "10×";
  if (multiplier === 100) return "100×";
  if (multiplier === 1000) return "1000×";
  if (multiplier === -1) return "-1×";
  if (multiplier === -10) return "-10×";
  return `${multiplier}×`;
}

/**
 * Process a Messier object for rendering
 */
export function processDeepSkyObject(
  obj: {
    id: string;
    name: string;
    type:
      | "galaxy"
      | "nebula"
      | "cluster"
      | "planetary"
      | "supernova"
      | "quasar"
      | "other";
    ra: number;
    dec: number;
    magnitude?: number;
    size?: number;
    constellation?: string;
    description?: string;
  },
  location: GeoLocation,
  dateTime: Date
): DeepSkyObject {
  // Validate coordinates
  if (isNaN(obj.ra) || isNaN(obj.dec) || obj.ra === null || obj.dec === null) {
    // Return a valid but invisible object
    return {
      id: obj.id,
      name: obj.name,
      type: obj.type === "quasar" || obj.type === "other" ? "galaxy" : obj.type,
      altAz: { altitude: -90, azimuth: 0 },
      position: { x: 0, y: -CELESTIAL_SPHERE_RADIUS, z: 0 },
      isVisible: false,
      magnitude: obj.magnitude || 10,
      size: obj.size || 5,
      constellation: obj.constellation || "",
      description: obj.description || "",
    };
  }

  const lst = calculateLocalSiderealTime(dateTime, location.longitude);

  const { position, altAz } = equatorialToCartesian(
    { ra: obj.ra, dec: obj.dec },
    location,
    lst,
    CELESTIAL_SPHERE_RADIUS
  );

  // Validate computed position
  if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
    return {
      id: obj.id,
      name: obj.name,
      type: obj.type === "quasar" || obj.type === "other" ? "galaxy" : obj.type,
      altAz: { altitude: -90, azimuth: 0 },
      position: { x: 0, y: -CELESTIAL_SPHERE_RADIUS, z: 0 },
      isVisible: false,
      magnitude: obj.magnitude || 10,
      size: obj.size || 5,
      constellation: obj.constellation || "",
      description: obj.description || "",
    };
  }

  return {
    id: obj.id,
    name: obj.name,
    type: obj.type === "quasar" || obj.type === "other" ? "galaxy" : obj.type,
    altAz,
    position,
    isVisible: altAz.altitude > 0,
    magnitude: obj.magnitude || 10,
    size: obj.size || 5,
    constellation: obj.constellation || "",
    description: obj.description || "",
  };
}

/**
 * Process constellation for rendering
 * Returns line segments and label position
 */
export function processConstellation(
  constellation: {
    name: string;
    abbr: string;
    lines: [string, string][];
    centerRA: number;
    centerDec: number;
  },
  stars: ProcessedStar[],
  location: GeoLocation,
  dateTime: Date
): ConstellationDisplay {
  const lst = calculateLocalSiderealTime(dateTime, location.longitude);

  // Create star name lookup (case-insensitive)
  const starMap = new Map<string, ProcessedStar>();
  stars.forEach((star) => {
    starMap.set(star.name.toLowerCase(), star);
  });

  // Process line segments
  const lines: Array<{ start: CartesianCoords; end: CartesianCoords }> = [];
  let visibleLineCount = 0;

  for (const [star1Name, star2Name] of constellation.lines) {
    const star1 = starMap.get(star1Name.toLowerCase());
    const star2 = starMap.get(star2Name.toLowerCase());

    if (star1 && star2) {
      lines.push({
        start: star1.position,
        end: star2.position,
      });
      if (star1.isVisible && star2.isVisible) {
        visibleLineCount++;
      }
    }
  }

  // Calculate label position from constellation center
  const { position: labelPosition, altAz: centerAltAz } = equatorialToCartesian(
    { ra: constellation.centerRA, dec: constellation.centerDec },
    location,
    lst,
    CELESTIAL_SPHERE_RADIUS
  );

  return {
    name: constellation.name,
    abbr: constellation.abbr,
    lines,
    labelPosition,
    isVisible: centerAltAz.altitude > 0 && visibleLineCount > 0,
  };
}

/**
 * Find the best initial camera direction based on visible sky
 * Returns the azimuth and altitude to look at
 */
export function findBestViewDirection(
  stars: ProcessedStar[],
  celestialBodies: CelestialBody[]
): { azimuth: number; altitude: number } {
  // Find visible stars
  const visibleStars = stars.filter((s) => s.isVisible && s.mag < 3);

  if (visibleStars.length === 0) {
    // Default: look south at 45° altitude
    return { azimuth: 180, altitude: 45 };
  }

  // Find the brightest region of the sky
  // Weight by magnitude (brighter = more weight)
  let sumAz = 0;
  let sumAlt = 0;
  let totalWeight = 0;

  for (const star of visibleStars) {
    const weight = Math.pow(2.512, 3 - star.mag); // Brighter stars weighted more
    sumAz += star.altAz.azimuth * weight;
    sumAlt += star.altAz.altitude * weight;
    totalWeight += weight;
  }

  // Also consider planets if visible
  for (const body of celestialBodies) {
    if (body.isVisible && body.name !== "Sun") {
      const weight = 5; // Planets get high weight
      sumAz += body.altAz.azimuth * weight;
      sumAlt += body.altAz.altitude * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) {
    return { azimuth: 180, altitude: 45 };
  }

  return {
    azimuth: sumAz / totalWeight,
    altitude: Math.max(20, Math.min(70, sumAlt / totalWeight)), // Clamp altitude
  };
}

/**
 * Process asteroid position from orbital elements
 * Simplified calculation - for accurate positions, use JPL Horizons
 *
 * Note: This is a placeholder function for future asteroid position calculations.
 * Full implementation would require solving Kepler's equation and orbital mechanics.
 */
export interface ProcessedAsteroid {
  name: string;
  altAz: HorizontalCoords;
  position: CartesianCoords;
  isVisible: boolean;
  magnitude: number;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
export function processAsteroid(
  _asteroid: {
    name: string;
    orbitalData: {
      elements?: Array<{ name: string; value: number }>;
      semiMajorAxis?: number;
      eccentricity?: number;
      inclination?: number;
      longitudeOfAscendingNode?: number;
      argumentOfPerihelion?: number;
      meanAnomaly?: number;
      meanMotion?: number;
      epoch?: number;
    };
    absoluteMagnitude?: number;
  },
  _location: GeoLocation,
  _dateTime: Date
): ProcessedAsteroid | null {
  // Placeholder for future asteroid position calculation
  // Full implementation requires:
  // 1. Solving Kepler's equation for true anomaly
  // 2. Converting to heliocentric coordinates
  // 3. Transforming to geocentric coordinates
  // 4. Converting to equatorial then horizontal coordinates
  return null;
}
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Process a meteor shower radiant point for display
 */
export interface MeteorShowerDisplay {
  id: string;
  name: string;
  radiantRA: number;
  radiantDec: number;
  altAz: HorizontalCoords;
  position: CartesianCoords;
  isVisible: boolean;
  isActive: boolean;
  zhr: number;
  speed: number;
  parentBody: string;
}

export function processMeteorShower(
  shower: {
    id: string;
    name: string;
    radiantRA: number;
    radiantDec: number;
    zhr: number;
    speed: number;
    parentBody: string;
  },
  isActive: boolean,
  location: GeoLocation,
  dateTime: Date
): MeteorShowerDisplay {
  const lst = calculateLocalSiderealTime(dateTime, location.longitude);

  // Convert RA (hours) to hour angle
  const hourAngle = lst - shower.radiantRA;

  // Convert to horizontal coordinates
  const latRad = (location.latitude * Math.PI) / 180;
  const decRad = (shower.radiantDec * Math.PI) / 180;
  const haRad = (hourAngle * 15 * Math.PI) / 180;

  const sinAlt =
    Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  const altitude = Math.asin(sinAlt) * (180 / Math.PI);

  const cosAz =
    (Math.sin(decRad) - Math.sin(latRad) * sinAlt) /
    (Math.cos(latRad) * Math.cos(Math.asin(sinAlt)));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * (180 / Math.PI);

  if (Math.sin(haRad) > 0) {
    azimuth = 360 - azimuth;
  }

  const altAz = { altitude, azimuth };
  const position = horizontalToCartesian(altAz, CELESTIAL_SPHERE_RADIUS);

  return {
    id: shower.id,
    name: shower.name,
    radiantRA: shower.radiantRA,
    radiantDec: shower.radiantDec,
    altAz,
    position,
    isVisible: altitude > 0,
    isActive,
    zhr: shower.zhr,
    speed: shower.speed,
    parentBody: shower.parentBody,
  };
}
// ... (existing exports)

export interface AstronomicalEvent {
  id: string;
  name: string;
  date: Date;
  type: "moon" | "meteor" | "conjunction" | "eclipse" | "planet";
  description: string;
}

/**
 * Calculate upcoming astronomical events
 * - Moon Phases
 * - Planetary Oppositions (simplified)
 * - Meteor Showers (from static data but dynamically checked)
 */
export function getUpcomingAstronomyEvents(
  location: GeoLocation,
  baseDate: Date,
  daysAhead: number = 30
): AstronomicalEvent[] {
  const events: AstronomicalEvent[] = [];
  const time = Astronomy.MakeTime(baseDate);
  // const observer = createObserver(location); // Unused for phase search

  // 1. Moon Phases
  // Astronomy.SearchMoonPhase(0, time, daysAhead); // Removed unused call

  const phases = [
    { angle: 0, name: "New Moon", desc: "Moon is between Earth and Sun" },
    { angle: 90, name: "First Quarter", desc: "Moon is half illuminated" },
    {
      angle: 180,
      name: "Full Moon",
      desc: "Entire face of Moon is illuminated",
    },
    {
      angle: 270,
      name: "Last Quarter",
      desc: "Moon is half illuminated (waning)",
    },
  ];

  phases.forEach((phase) => {
    const searchTime = time;
    // Search for next occurrence within window
    // Logic: Iterate days and check phase? Or use SearchMoonPhase iteratively.
    // Astronomy.SearchMoonPhase finds the *next* occurrence.
    const nextPhase = Astronomy.SearchMoonPhase(
      phase.angle,
      searchTime,
      daysAhead
    );
    if (nextPhase) {
      events.push({
        id: `moon-${phase.name}-${nextPhase.date.getTime()}`,
        name: phase.name,
        date: nextPhase.date,
        type: "moon",
        description: phase.desc,
      });
    }
  });

  // 2. Meteor Showers (Static for now, but filtered by date)
  const meteorShowers = [
    { name: "Quadrantids", month: 0, day: 3 },
    { name: "Lyrids", month: 3, day: 22 },
    { name: "Perseids", month: 7, day: 12 },
    { name: "Orionids", month: 9, day: 21 },
    { name: "Leonids", month: 10, day: 17 },
    { name: "Geminids", month: 11, day: 14 },
  ];

  meteorShowers.forEach((shower) => {
    const year = baseDate.getFullYear();
    // Check this year and next year
    [year, year + 1].forEach((y) => {
      const showerDate = new Date(y, shower.month, shower.day);
      if (
        showerDate >= baseDate &&
        showerDate.getTime() <= baseDate.getTime() + daysAhead * 86400000
      ) {
        events.push({
          id: `meteor-${shower.name}-${y}`,
          name: `${shower.name} Peak`,
          date: showerDate,
          type: "meteor",
          description: `Peak activity for ${shower.name} meteor shower`,
        });
      }
    });
  });

  // 3. Planetary positions (Simplified "Conjunctions" or just visible planets)
  // For a real chart, we'd check separation. For now, let's list when planets are high in the sky at midnight (Opposition-ish)
  // Better: Just check if a planet is visible tonight? No, that's "Tonight's Sky".
  // Let's stick to Moon and Meteors for the "Events" tab as they are time-critical.
  // Maybe add Equinoxes/Solstices if supported. Astronomy Engine supports Seasons.

  const season = Astronomy.Seasons(baseDate.getFullYear());
  const seasonEvents = [
    {
      name: "March Equinox",
      date: season.mar_equinox.date,
      desc: "Start of Spring (NH) / Autumn (SH)",
    },
    {
      name: "June Solstice",
      date: season.jun_solstice.date,
      desc: "Longest day (NH) / Shortest day (SH)",
    },
    {
      name: "Sept Equinox",
      date: season.sep_equinox.date,
      desc: "Start of Autumn (NH) / Spring (SH)",
    },
    {
      name: "Dec Solstice",
      date: season.dec_solstice.date,
      desc: "Shortest day (NH) / Longest day (SH)",
    },
  ];

  seasonEvents.forEach((se) => {
    if (
      se.date >= baseDate &&
      se.date.getTime() <= baseDate.getTime() + daysAhead * 86400000
    ) {
      events.push({
        id: `season-${se.name}-${se.date.getTime()}`,
        name: se.name,
        date: se.date,
        type: "conjunction", // using generic icon
        description: se.desc,
      });
    }
  });

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}
