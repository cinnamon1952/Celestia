/**
 * Coordinate transformation functions for astronomical calculations
 * 
 * Key coordinate systems:
 * - Equatorial: RA/Dec - fixed to celestial sphere, rotates with Earth
 * - Horizontal: Alt/Az - fixed to observer's local horizon
 * - Cartesian: x/y/z - for 3D rendering in Three.js
 */

import type { 
  EquatorialCoords, 
  HorizontalCoords, 
  CartesianCoords,
  GeoLocation 
} from './types';

// Mathematical constants
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const HOURS_TO_DEG = 15; // 24 hours = 360 degrees

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return degrees * DEG_TO_RAD;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return radians * RAD_TO_DEG;
}

/**
 * Convert Right Ascension from hours to degrees
 */
export function raHoursToDeg(hours: number): number {
  return hours * HOURS_TO_DEG;
}

/**
 * Normalize angle to 0-360 range
 */
export function normalizeAngle(angle: number): number {
  let result = angle % 360;
  if (result < 0) result += 360;
  return result;
}

/**
 * Calculate Julian Date from a JavaScript Date object
 * Julian Date is the continuous count of days since the beginning of the Julian Period
 * 
 * Formula: JD = 367Y - INT(7(Y + INT((M+9)/12))/4) + INT(275M/9) + D + 1721013.5 + UT/24
 */
export function dateToJulianDate(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();
  
  // Fraction of day
  const dayFraction = (hour + minute / 60 + second / 3600) / 24;
  
  // Adjust year and month for the formula
  let y = year;
  let m = month;
  if (month <= 2) {
    y = year - 1;
    m = month + 12;
  }
  
  // Gregorian calendar correction
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  
  // Julian Day Number
  const jd = Math.floor(365.25 * (y + 4716)) + 
             Math.floor(30.6001 * (m + 1)) + 
             day + dayFraction + b - 1524.5;
  
  return jd;
}

/**
 * Calculate Greenwich Mean Sidereal Time (GMST) from Julian Date
 * GMST is the hour angle of the vernal equinox at Greenwich
 * 
 * Returns: GMST in hours (0-24)
 */
export function julianDateToGMST(jd: number): number {
  // Julian centuries since J2000.0
  const T = (jd - 2451545.0) / 36525.0;
  
  // GMST at 0h UT in seconds
  let gmst = 24110.54841 + 
             8640184.812866 * T + 
             0.093104 * T * T - 
             0.0000062 * T * T * T;
  
  // Add rotation for the current time of day
  // The fractional part of JD represents the time since noon UT
  const jdFrac = jd - Math.floor(jd) - 0.5;
  gmst += jdFrac * 86400 * 1.00273790935;
  
  // Convert to hours and normalize to 0-24
  gmst = (gmst / 3600) % 24;
  if (gmst < 0) gmst += 24;
  
  return gmst;
}

/**
 * Calculate Local Sidereal Time (LST) from GMST and longitude
 * LST = GMST + longitude(in hours)
 * 
 * Returns: LST in hours (0-24)
 */
export function calculateLST(gmst: number, longitude: number): number {
  // Convert longitude to hours (360 degrees = 24 hours)
  const longitudeHours = longitude / 15;
  let lst = gmst + longitudeHours;
  
  // Normalize to 0-24 range
  lst = lst % 24;
  if (lst < 0) lst += 24;
  
  return lst;
}

/**
 * Calculate Hour Angle from Local Sidereal Time and Right Ascension
 * HA = LST - RA
 * 
 * Both inputs in hours
 * Returns: Hour Angle in degrees
 */
export function calculateHourAngle(lst: number, ra: number): number {
  let ha = (lst - ra) * 15; // Convert to degrees
  
  // Normalize to -180 to +180 range
  while (ha > 180) ha -= 360;
  while (ha < -180) ha += 360;
  
  return ha;
}

/**
 * Convert Equatorial coordinates (RA/Dec) to Horizontal coordinates (Alt/Az)
 * 
 * This is the core transformation that makes the star map work correctly
 * for any observer location and time.
 * 
 * Formulas:
 * sin(alt) = sin(dec) * sin(lat) + cos(dec) * cos(lat) * cos(HA)
 * cos(az) * cos(alt) = sin(dec) * cos(lat) - cos(dec) * sin(lat) * cos(HA)
 * sin(az) * cos(alt) = -cos(dec) * sin(HA)
 */
export function equatorialToHorizontal(
  coords: EquatorialCoords,
  location: GeoLocation,
  lst: number
): HorizontalCoords {
  // Convert inputs to radians
  const decRad = degToRad(coords.dec);
  const latRad = degToRad(location.latitude);
  
  // Calculate hour angle in radians
  const haRad = degToRad(calculateHourAngle(lst, coords.ra));
  
  // Pre-calculate trigonometric values
  const sinDec = Math.sin(decRad);
  const cosDec = Math.cos(decRad);
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const cosHA = Math.cos(haRad);
  const sinHA = Math.sin(haRad);
  
  // Calculate altitude
  const sinAlt = sinDec * sinLat + cosDec * cosLat * cosHA;
  const altitude = radToDeg(Math.asin(sinAlt));
  
  // Calculate azimuth
  // Using atan2 to get the correct quadrant
  const y = -cosDec * sinHA;
  const x = sinDec * cosLat - cosDec * sinLat * cosHA;
  let azimuth = radToDeg(Math.atan2(y, x));
  
  // Normalize azimuth to 0-360 (measured from North, clockwise)
  azimuth = normalizeAngle(azimuth);
  
  return { altitude, azimuth };
}

/**
 * Convert Horizontal coordinates (Alt/Az) to Cartesian coordinates for Three.js
 * 
 * We use a sphere where:
 * - Y is up (zenith)
 * - Z is towards the observer (South when azimuth = 180)
 * - X is to the right (East when azimuth = 90)
 * 
 * Note: Azimuth is measured from North (0°), clockwise
 * 
 * @param altAz - Horizontal coordinates
 * @param radius - Radius of the celestial sphere (default 100)
 */
export function horizontalToCartesian(
  altAz: HorizontalCoords,
  radius: number = 100
): CartesianCoords {
  const altRad = degToRad(altAz.altitude);
  const azRad = degToRad(altAz.azimuth);
  
  // Calculate the horizontal distance from zenith
  const horizontalDist = Math.cos(altRad);
  
  // Y is the height (altitude)
  const y = Math.sin(altRad) * radius;
  
  // X and Z form the horizontal plane
  // Azimuth 0° = North = -Z
  // Azimuth 90° = East = +X
  // Azimuth 180° = South = +Z
  // Azimuth 270° = West = -X
  const x = horizontalDist * Math.sin(azRad) * radius;
  const z = -horizontalDist * Math.cos(azRad) * radius;
  
  return { x, y, z };
}

/**
 * Convert Equatorial coordinates directly to Cartesian, through Horizontal
 * This is the main function used by the star renderer
 */
export function equatorialToCartesian(
  coords: EquatorialCoords,
  location: GeoLocation,
  lst: number,
  radius: number = 100
): { position: CartesianCoords; altAz: HorizontalCoords } {
  const altAz = equatorialToHorizontal(coords, location, lst);
  const position = horizontalToCartesian(altAz, radius);
  
  return { position, altAz };
}

/**
 * Calculate the Local Sidereal Time for a given date and location
 * Convenience function that combines all the steps
 */
export function calculateLocalSiderealTime(
  date: Date,
  longitude: number
): number {
  const jd = dateToJulianDate(date);
  const gmst = julianDateToGMST(jd);
  return calculateLST(gmst, longitude);
}
