import { useState, useEffect, useCallback } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

const geolocationSupported =
  typeof navigator !== "undefined" && "geolocation" in navigator;

function getInitialState(): GeolocationState {
  if (!geolocationSupported) {
    return {
      latitude: null,
      longitude: null,
      error: "Geolocation is not supported by your browser",
      loading: false,
    };
  }
  return {
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  };
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>(getInitialState);

  const getCurrentPosition = useCallback(() => {
    if (!geolocationSupported) return;

    setState((prev) => ({ ...prev, loading: true }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (error) => {
        setState({
          latitude: null,
          longitude: null,
          error: error.message,
          loading: false,
        });
      },
      GEO_OPTIONS,
    );
  }, []);

  useEffect(() => {
    if (!geolocationSupported) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (error) => {
        setState({
          latitude: null,
          longitude: null,
          error: error.message,
          loading: false,
        });
      },
      GEO_OPTIONS,
    );
  }, []);

  return { ...state, refresh: getCurrentPosition };
}
