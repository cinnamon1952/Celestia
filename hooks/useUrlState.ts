"use client";

import { useEffect, useCallback } from "react";
import { useSearchParams, usePathname } from "next/navigation";

interface ViewState {
  lat?: number;
  lon?: number;
  time?: number; // Unix timestamp
  showStars?: boolean;
  showPlanets?: boolean;
  showConstellations?: boolean;
  showArt?: boolean;
  horizon?: string;
  lightPollution?: number;
}

export function useUrlState(
  currentState: ViewState,
  setters: {
    setLocation: (loc: { latitude: number; longitude: number }) => void;
    setDateTime: (date: Date) => void;
    setShowStars?: (show: boolean) => void;
    setShowPlanets?: (show: boolean) => void;
    setShowConstellations?: (show: boolean) => void;
    setShowConstellationArt?: (show: boolean) => void;
    setHorizon?: (horizon: string) => void;
    setLightPollution?: (lp: number) => void;
  }
) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Read from URL on mount (client-side only)
  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    const time = searchParams.get("t");
    const horizon = searchParams.get("h");
    const lp = searchParams.get("lp");

    if (lat && lon) {
      setters.setLocation({
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
      });
    }

    if (time) {
      setters.setDateTime(new Date(parseInt(time)));
    }

    if (horizon && setters.setHorizon) {
      setters.setHorizon(horizon);
    }

    if (lp && setters.setLightPollution) {
      setters.setLightPollution(parseFloat(lp));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Generate shareable URL
  const generateShareUrl = useCallback(() => {
    const params = new URLSearchParams();

    if (currentState.lat !== undefined)
      params.set("lat", currentState.lat.toFixed(4));
    if (currentState.lon !== undefined)
      params.set("lon", currentState.lon.toFixed(4));
    if (currentState.time !== undefined)
      params.set("t", currentState.time.toString());
    if (currentState.horizon) params.set("h", currentState.horizon);
    if (currentState.lightPollution !== undefined)
      params.set("lp", currentState.lightPollution.toFixed(2));

    const url = `${window.location.origin}${pathname}?${params.toString()}`;
    return url;
  }, [currentState, pathname]);

  // Copy to clipboard
  const shareView = useCallback(async () => {
    const url = generateShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      return { success: true, url };
    } catch {
      return { success: false, url };
    }
  }, [generateShareUrl]);

  return { shareView, generateShareUrl };
}
