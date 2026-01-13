'use client';

/**
 * Celestia - Interactive Star Chart
 * Now with asteroids, meteor showers, and extended deep sky from APIs
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  StarCanvas, 
  Controls, 
  CompassRoseUI, 
  StarInfoCard, 
  TonightsSky,
  SearchBar 
} from '@/components/star-chart';
import {
  type GeoLocation,
  type ProcessedStar,
  type CelestialBody,
  type StarData,
  type ConstellationDisplay,
  type DeepSkyObject,
  processStarCatalog,
  getAllCelestialBodies,
  processConstellation,
  processDeepSkyObject,
  findBestViewDirection,
  processMeteorShower,
} from '@/lib/astronomy';
import { fetchStarCatalog } from '@/lib/data/starService';
import { CONSTELLATIONS } from '@/lib/data/constellations';
import { MESSIER_CATALOG } from '@/lib/data/messier';
import { 
  fetchNearEarthAsteroids, 
  getActiveMeteorShowers,
  METEOR_SHOWERS,
  type Asteroid,
} from '@/lib/data/celestialService';
import { fetchAllDeepSky, type ExtendedDeepSkyObject } from '@/lib/data/deepSkyService';

const DEFAULT_LOCATION: GeoLocation = {
  latitude: 37.7749,
  longitude: -122.4194,
};

export default function Home() {
  const [location, setLocation] = useState<GeoLocation>(DEFAULT_LOCATION);
  const [dateTime, setDateTime] = useState<Date>(new Date());
  const [timeSpeed, setTimeSpeed] = useState<number>(1);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  // Star data
  const [starCatalog, setStarCatalog] = useState<StarData[]>([]);
  const [isLoadingStars, setIsLoadingStars] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  
  // Extended data from APIs
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [extendedDeepSky, setExtendedDeepSky] = useState<ExtendedDeepSkyObject[]>([]);
  
  // Visibility toggles
  const [showStars, setShowStars] = useState(true);
  const [showConstellations, setShowConstellations] = useState(true);
  const [showPlanets, setShowPlanets] = useState(true);
  const [showHorizon, setShowHorizon] = useState(true);
  const [showDeepSky, setShowDeepSky] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  
  // Selection and camera
  const [selectedStar, setSelectedStar] = useState<ProcessedStar | null>(null);
  const [cameraRotation, setCameraRotation] = useState(0);
  const [lookAtTarget, setLookAtTarget] = useState<{ x: number; y: number; z: number; key: number; zoom?: number } | null>(null);
  const targetKeyRef = useRef(0);
  
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    lastUpdateRef.current = Date.now();
  }, []);

  // Load stars from HYG database
  useEffect(() => {
    let mounted = true;
    
    async function loadStars() {
      try {
        const stars = await fetchStarCatalog((_, message) => {
          if (mounted) setLoadingProgress(message);
        });
        if (mounted) {
          setStarCatalog(stars);
          setIsLoadingStars(false);
        }
      } catch (error) {
        console.error('Failed to load stars:', error);
        if (mounted) setIsLoadingStars(false);
      }
    }
    
    loadStars();
    return () => { mounted = false; };
  }, []);

  // Load asteroids from NASA API
  useEffect(() => {
    fetchNearEarthAsteroids((msg) => console.log(msg))
      .then(setAsteroids)
      .catch(console.error);
  }, []);

  // Load extended deep sky from SIMBAD
  useEffect(() => {
    fetchAllDeepSky((msg) => console.log(msg))
      .then(setExtendedDeepSky)
      .catch(console.error);
  }, []);

  // Process stars, filtering out invalid positions
  const processedStars = useMemo<ProcessedStar[]>(() => {
    if (starCatalog.length === 0) return [];
    const stars = processStarCatalog(starCatalog, location, dateTime);
    return stars.filter(s => 
      !isNaN(s.position.x) && 
      !isNaN(s.position.y) && 
      !isNaN(s.position.z) &&
      isFinite(s.position.x) &&
      isFinite(s.position.y) &&
      isFinite(s.position.z)
    );
  }, [starCatalog, location, dateTime]);

  // Process celestial bodies (planets, sun, moon)
  const celestialBodies = useMemo<CelestialBody[]>(() => {
    return getAllCelestialBodies(location, dateTime);
  }, [location, dateTime]);

  // Process constellations
  const processedConstellations = useMemo<ConstellationDisplay[]>(() => {
    if (processedStars.length === 0) return [];
    return CONSTELLATIONS.map(c => processConstellation(c, processedStars, location, dateTime));
  }, [processedStars, location, dateTime]);

  // Process Messier deep sky objects
  const processedDeepSky = useMemo<DeepSkyObject[]>(() => {
    return MESSIER_CATALOG.map(obj => processDeepSkyObject(obj, location, dateTime));
  }, [location, dateTime]);

  // Process extended deep sky from API
  const processedExtendedDeepSky = useMemo<DeepSkyObject[]>(() => {
    return extendedDeepSky.map(obj => processDeepSkyObject({
      id: obj.id,
      name: obj.name,
      type: obj.type,
      ra: obj.ra,
      dec: obj.dec,
      magnitude: obj.magnitude || 10,
      size: 5,
      constellation: '',
      description: '',
    }, location, dateTime));
  }, [extendedDeepSky, location, dateTime]);

  // Combine all deep sky objects, filtering out any with invalid positions
  const allDeepSky = useMemo(() => {
    const combined = [...processedDeepSky, ...processedExtendedDeepSky];
    return combined.filter(obj => 
      !isNaN(obj.position.x) && 
      !isNaN(obj.position.y) && 
      !isNaN(obj.position.z) &&
      isFinite(obj.position.x) &&
      isFinite(obj.position.y) &&
      isFinite(obj.position.z)
    );
  }, [processedDeepSky, processedExtendedDeepSky]);

  // Active meteor showers (for Tonight's Sky panel)
  const activeMeteorShowers = useMemo(() => {
    const active = getActiveMeteorShowers(dateTime);
    return active.map(shower => 
      processMeteorShower(shower, true, location, dateTime)
    );
  }, [dateTime, location]);

  // All meteor showers processed for search
  const allMeteorShowers = useMemo(() => {
    const active = getActiveMeteorShowers(dateTime);
    return METEOR_SHOWERS.map(shower => 
      processMeteorShower(shower, active.some(a => a.id === shower.id), location, dateTime)
    );
  }, [dateTime, location]);


  // Initial view direction
  const initialViewDirection = useMemo(() => {
    if (processedStars.length === 0) return undefined;
    return findBestViewDirection(processedStars, celestialBodies);
  }, [processedStars, celestialBodies]);

  // Time animation
  useEffect(() => {
    if (timeSpeed === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = () => {
      const now = Date.now();
      const deltaMs = now - lastUpdateRef.current;
      lastUpdateRef.current = now;
      
      setDateTime(prevTime => new Date(prevTime.getTime() + deltaMs * timeSpeed));
      animationRef.current = requestAnimationFrame(animate);
    };
    
    lastUpdateRef.current = Date.now();
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [timeSpeed]);

  // Geolocation
  const handleRequestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please enter it manually.');
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const handleDateTimeChange = useCallback((newDateTime: Date) => setDateTime(newDateTime), []);
  const handleTimeSpeedChange = useCallback((speed: number) => {
    setTimeSpeed(speed);
    lastUpdateRef.current = Date.now();
  }, []);

  // Navigate camera to a position with optional zoom
  const navigateTo = useCallback((position: { x: number; y: number; z: number }, zoom?: number) => {
    targetKeyRef.current += 1;
    setLookAtTarget({ ...position, key: targetKeyRef.current, zoom });
  }, []);

  // Stats
  const visibleStarCount = processedStars.filter(s => s.isVisible).length;
  const visiblePlanets = celestialBodies.filter(b => b.isVisible && b.name !== 'Sun').map(b => b.name);
  const visibleDeepSkyCount = allDeepSky.filter(d => d.isVisible).length;

  return (
    <main className="w-screen h-screen overflow-hidden relative bg-black">
      {/* Loading */}
      {isLoadingStars && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-light text-neutral-300 tracking-widest mb-6">
              CELESTIA
            </h1>
            <div className="w-48 h-px bg-neutral-800 mb-2">
              <div className="h-full w-1/2 bg-neutral-600 animate-pulse" />
            </div>
            <p className="text-xs text-neutral-600">{loadingProgress}</p>
          </div>
        </div>
      )}
      
      {/* 3D Canvas */}
      <div className="w-full h-full">
        <StarCanvas
          stars={processedStars}
          constellations={processedConstellations}
          planets={celestialBodies}
          deepSkyObjects={allDeepSky}
          showStars={showStars}
          showConstellations={showConstellations}
          showPlanets={showPlanets}
          showHorizon={showHorizon}
          showDeepSky={showDeepSky}
          showLabels={showLabels}
          initialViewDirection={initialViewDirection}
          onStarSelect={setSelectedStar}
          selectedStar={selectedStar}
          onCameraRotationChange={setCameraRotation}
          lookAtTarget={lookAtTarget}
        />
      </div>

      {/* UI Controls */}
      <Controls
        location={location}
        onLocationChange={setLocation}
        dateTime={dateTime}
        onDateTimeChange={handleDateTimeChange}
        timeSpeed={timeSpeed}
        onTimeSpeedChange={handleTimeSpeedChange}
        showStars={showStars}
        onShowStarsChange={setShowStars}
        showConstellations={showConstellations}
        onShowConstellationsChange={setShowConstellations}
        showPlanets={showPlanets}
        onShowPlanetsChange={setShowPlanets}
        showHorizon={showHorizon}
        onShowHorizonChange={setShowHorizon}
        showDeepSky={showDeepSky}
        onShowDeepSkyChange={setShowDeepSky}
        showLabels={showLabels}
        onShowLabelsChange={setShowLabels}
        isLoadingLocation={isLoadingLocation}
        onRequestGeolocation={handleRequestGeolocation}
        starCount={starCatalog.length}
      />

      {/* Search */}
      <SearchBar
        stars={processedStars}
        planets={celestialBodies}
        deepSkyObjects={allDeepSky}
        constellations={processedConstellations}
        meteorShowers={allMeteorShowers}
        asteroids={asteroids.map(a => ({ name: a.name, designation: a.designation }))}
        onSelect={navigateTo}
      />

      {/* Tonight's Sky Info */}
      <TonightsSky
        visibleStars={visibleStarCount}
        visiblePlanets={visiblePlanets}
        visibleDeepSky={visibleDeepSkyCount}
        activeMeteorShowers={activeMeteorShowers}
        asteroidCount={asteroids.length}
      />

      {/* Compass */}
      <CompassRoseUI rotation={cameraRotation} />

      {/* Star Info Card */}
      {selectedStar && (
        <StarInfoCard 
          star={selectedStar} 
          onClose={() => setSelectedStar(null)} 
        />
      )}

      {/* Hints */}
      <div className="fixed bottom-4 left-4 z-40">
        <p className="text-[10px] text-neutral-700">
          Scroll to zoom • Drag to rotate • Click stars for info
        </p>
      </div>
    </main>
  );
}
