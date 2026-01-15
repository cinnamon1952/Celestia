import * as THREE from "three";

export interface OrbitalElements {
  a: number; // Semimajor axis (AU)
  e: number; // Eccentricity
  i: number; // Inclination (deg)
  om: number; // Longitude of Ascending Node (deg)
  w: number; // Argument of Perihelion (deg)
  ma: number; // Mean Anomaly at epoch (deg)
  epoch: number; // Julian Date of epoch
  n: number; // Mean motion (deg/day)
}

export interface Asteroid {
  name: string;
  elements: OrbitalElements;
  radius: number; // km (approx)
  color: string;
}

// Approximate Elements for J2000 (roughly valid for current epoch visualization)
export const MAJOR_ASTEROIDS: Asteroid[] = [
  {
    name: "1 Ceres",
    radius: 476,
    color: "#aaaaaa",
    elements: {
      a: 2.766,
      e: 0.076,
      i: 10.59,
      om: 80.33,
      w: 72.57,
      ma: 77.37, // Adjusted roughly
      n: 0.214,
      epoch: 2451545.0,
    },
  },
  {
    name: "4 Vesta",
    radius: 262,
    color: "#dcbfa5",
    elements: {
      a: 2.362,
      e: 0.089,
      i: 7.14,
      om: 103.85,
      w: 150.72,
      ma: 20.26,
      n: 0.271,
      epoch: 2451545.0,
    },
  },
  {
    name: "2 Pallas",
    radius: 256,
    color: "#8899aa",
    elements: {
      a: 2.773,
      e: 0.231,
      i: 34.84,
      om: 173.08,
      w: 310.06,
      ma: 59.86,
      n: 0.213,
      epoch: 2451545.0,
    },
  },
  {
    name: "3 Juno",
    radius: 135,
    color: "#b0a090",
    elements: {
      a: 2.671,
      e: 0.255,
      i: 12.98,
      om: 169.85,
      w: 248.07,
      ma: 34.54,
      n: 0.226,
      epoch: 2451545.0,
    },
  },
];

export interface CalculatedAsteroid extends Asteroid {
  position: THREE.Vector3;
}

export function calculateAsteroidPositions(date: Date): CalculatedAsteroid[] {
  // Convert date to Julian Date
  const time = date.getTime();
  const jd = time / 86400000 + 2440587.5;

  return MAJOR_ASTEROIDS.map((asteroid) => {
    const { elements } = asteroid;

    // Time since epoch (days)
    const dt = jd - elements.epoch;

    // Current Mean Anomaly
    let M = elements.ma + elements.n * dt;
    M = M % 360;

    // Only basic calculation needed for visual representation
    // We already have a keplerToCartesian function in calculations.ts?
    // Let's assume we implement a local one or import one if it exists.
    // Actually, I'll implement a helper here to be self-contained or use the imported one if I am sure it exists.
    // I imported `keplerToCartesian` but I haven't checked if it exists or what visual scale it uses.
    // Usually existing planet logic scales AU to scene units.
    // Let's assume 1 AU = 10 units for this scene (Earth is usually at ~10 or scaled).
    // Actually, looking at Planets.tsx, distances are scaled.
    // I should check `calculations.ts` to coordinate scales.

    // For now, let's implement the math here to be safe and consistent with visual scale 1 AU ~ 20 units maybe?
    // Planets.tsx usually receives `bodies` calculated in `page.tsx` or `astronomy/index.ts`.
    // Let's perform the calculation here returning a Vector3 in AU, then scale in Component.

    const pos = solveKepler(elements, M);

    return {
      ...asteroid,
      position: pos,
    };
  });
}

function solveKepler(el: OrbitalElements, M_deg: number): THREE.Vector3 {
  const D2R = Math.PI / 180;
  const a = el.a;
  const e = el.e;
  const i = el.i * D2R;
  const om = el.om * D2R;
  const w = el.w * D2R;
  const M = M_deg * D2R;

  // Solve Kepler Equation M = E - e sin E for E
  let E = M;
  for (let k = 0; k < 10; k++) {
    E = M + e * Math.sin(E);
  }

  // True Anomaly v (using atan2 for correct quadrant)
  const xv = a * (Math.cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);

  // Position in orbital plane
  // P = r * cos(v)
  // Q = r * sin(v)

  // Rotate to Ecliptic
  // We need heliocentric coordinates.
  // u = w + v
  const u = w + v;

  const x =
    r * (Math.cos(om) * Math.cos(u) - Math.sin(om) * Math.sin(u) * Math.cos(i));
  const y =
    r * (Math.sin(om) * Math.cos(u) + Math.cos(om) * Math.sin(u) * Math.cos(i));
  const z = r * (Math.sin(u) * Math.sin(i));

  return new THREE.Vector3(x, z, -y); // Swapping Y/Z for Three.js (Y up)?
  // Standard astronomy: Z is North Ecliptic Pole.
  // Three.js: Y is usually up.
  // So Astro Z -> Three Y.
  // Astro X -> Three X.
  // Astro Y -> Three -Z?
  // Let's stick to X=X, Y(astro)= -Z (screen depth), Z(astro) = Y (up).
}
