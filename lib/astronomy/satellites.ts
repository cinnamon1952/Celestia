import * as satellite from "satellite.js";
import * as THREE from "three";

export interface SatelliteData {
  name: string;
  tle1: string;
  tle2: string;
  color: string;
}

// Station TLEs (These degrade over time, but good for demo)
// Updated: 2024 (approx)
export const SATELLITES: SatelliteData[] = [
  {
    name: "ISS (ZARYA)",
    tle1: "1 25544U 98067A   24018.54832569  .00014309  00000+0  25396-3 0  9997",
    tle2: "2 25544  51.6415 161.8333 0005462  46.9427  87.4578 15.49839550435165",
    color: "#ff3333",
  },
  {
    name: "HST",
    tle1: "1 20580U 90037B   24018.17246492  .00000868  00000+0  42197-4 0  9991",
    tle2: "2 20580  28.4699 263.1895 0002528 296.2625 158.8262 15.09341498739988",
    color: "#33ff33",
  },
];

export interface PropagatedSatellite {
  name: string;
  position: THREE.Vector3; // ECI or customized for scene
  trajectory: THREE.Vector3[]; // Future path
  color: string;
}

export function propagateSatellites(date: Date): PropagatedSatellite[] {
  const gmst = satellite.gstime(date);

  return SATELLITES.map((sat) => {
    const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);

    // Propagate calculate current position
    const positionAndVelocity = satellite.propagate(satrec, date);
    if (!positionAndVelocity) return null;

    const positionEci =
      positionAndVelocity.position as satellite.EciVec3<number>;

    // Convert to Three.js coords (scaling down)
    // Satellite JS returns km. Earth radius ~6371km.
    // In our scene, Earth radius might be scaled.
    // If Planet.tsx Earth size is roughly 1 (unit scale), then 6371km = 1 unit?
    // Or if Planets use 20 units for distance...
    // Actually, `Planets.tsx` draws Earth with `size`.
    // Let's assume Earth radius = 1 scene unit for the Satellite visualizer relative to the Earth Body.
    // BUT! The `StarCanvas` is a star chart, viewed from Earth surface (latitude/longitude)?
    // OR is it a Solar System view?
    // "StarChart" implies viewing from Earth.
    // If viewing FROM Earth, satellites should be projected onto the sky sphere (Azimuth/Elevation).
    // The `Planets.tsx` renders planets at their RA/Dec direction on a celestial sphere of radius X?
    // Yes, `StarCanvas` usually puts things on a sphere.
    // So we need to convert ECI -> ECF -> Topocentric (Az/El) -> Cartesian on Sky Sphere.

    // HOWEVER, the current code for Planets seems to use `body.position.x` etc which implies calculated cartesian coords on the sky sphere?
    // `calculations.ts` usually handles RA/Dec to Cartesian.

    // Let's assume for `Satellites` we want to plot them on the sky (viewed from Observer).

    if (!positionEci) return null;

    // We need observer location... `propagateSatellites` needs observer lat/lon/height if we want sky projection.
    // This function signature only takes `date`.
    // I should probably move the observer logic to the component or pass observer here.

    // For now, let's return ECI and let component handle projection?
    // Or return Az/El if we pass lat/lon.

    return {
      name: sat.name,
      position: new THREE.Vector3(positionEci.x, positionEci.y, positionEci.z), // Raw ECI km
      trajectory: [], // Simplified for now
      color: sat.color,
    };
  }).filter(Boolean) as PropagatedSatellite[];
}

// Helper to get Sky Coordinates (Az/El) from ECI
export function getSatelliteSkyPosition(
  positionEci: satellite.EciVec3<number>,
  date: Date,
  lat: number,
  lon: number,
  alt: number = 0
): THREE.Vector3 {
  const gmst = satellite.gstime(date);
  const positionGd = {
    latitude: satellite.degreesToRadians(lat),
    longitude: satellite.degreesToRadians(lon),
    height: alt,
  };

  const positionEcf = satellite.eciToEcf(positionEci, gmst);
  const lookAngles = satellite.ecfToLookAngles(positionGd, positionEcf);

  // azimuth, elevation, rangeSat
  // Convert Az/El to Cartesian on the sky sphere (Radius R)
  const R = 90; // Star sphere radius in StarCanvas (Stars are at 150)

  // Az is measured from North (0) clockwise? or South? satellite.js: 0 is North, East is 90.
  // El is up from horizon.

  const az = lookAngles.azimuth;
  const el = lookAngles.elevation;

  // Convert to Three.js vector (y up)
  // x = R * cos(el) * sin(az)
  // y = R * sin(el)
  // z = -R * cos(el) * cos(az)  (North is -z)

  const x = R * Math.cos(el) * Math.sin(az);
  const y = R * Math.sin(el);
  const z = -R * Math.cos(el) * Math.cos(az);

  return new THREE.Vector3(x, y, z);
}
