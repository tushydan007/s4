import { useEffect, useRef, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiMicrophone,
  HiMapPin,
  HiShieldCheck,
  HiSignal,
  HiFunnel,
  HiPlus,
} from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAppDispatch, useAppSelector } from "@/store";
import {
  openUploadModal,
  openReportDetail,
  toggleStations,
} from "@/store/slices/uiSlice";
import { useGetReportsQuery } from "@/store/api/reportApi";
import { useGetStationsQuery } from "@/store/api/stationApi";
import { useGetProfileQuery } from "@/store/api/authApi";
import { useWebSocket } from "@/hooks/useWebSocket";
import VoiceUploadModal from "@/components/reports/VoiceUploadModal";
import ReportDetailModal from "@/components/reports/ReportDetailModal";
import ReportSidebar from "@/components/reports/ReportSidebar";
import MapSearchBox, { type SearchResult } from "@/components/map/MapSearchBox";
import type { Report, SecurityStation } from "@/types";
import { STATION_TYPES, SEVERITY_LEVELS } from "@/types";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

// ── Base map options ────────────────────────────────────────────────────────
function rasterStyle(
  id: string,
  tileUrl: string,
  attribution: string,
  maxzoom: number,
) {
  return {
    version: 8 as const,
    sources: {
      [id]: {
        type: "raster" as const,
        tiles: [tileUrl],
        tileSize: 256 as const,
        attribution,
        maxzoom,
      },
    },
    layers: [{ id: `${id}-layer`, type: "raster" as const, source: id }],
  };
}

const BASE_MAPS: Array<{ id: string; label: string; style: string | object }> =
  [
    {
      id: "streets",
      label: "Streets",
      style: rasterStyle(
        "osm",
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
        19,
      ),
    },
    {
      id: "terrain",
      label: "Terrain",
      style: rasterStyle(
        "terrain",
        "https://tile.opentopomap.org/{z}/{x}/{y}.png",
        "© <a href='https://opentopomap.org'>OpenTopoMap</a> contributors",
        17,
      ),
    },
    {
      id: "satellite",
      label: "Satellite",
      style: "mapbox://styles/mapbox/satellite-streets-v12",
    },
  ];
// ────────────────────────────────────────────────────────────────────────────

// ── Nigeria geographic restriction ──────────────────────────────────────────
// Approximate bounding box for Nigeria (mainland + territorial waters)
const NIGERIA_BOUNDS = {
  minLat: 4.27,
  maxLat: 13.9,
  minLng: 2.69,
  maxLng: 14.68,
} as const;
const MAX_REPORT_DISTANCE_KM = 5;

function isWithinNigeria(lat: number, lng: number): boolean {
  return (
    lat >= NIGERIA_BOUNDS.minLat &&
    lat <= NIGERIA_BOUNDS.maxLat &&
    lng >= NIGERIA_BOUNDS.minLng &&
    lng <= NIGERIA_BOUNDS.maxLng
  );
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function getDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function getCurrentDeviceLocation(): Promise<{
  allowed: boolean;
  reason?: string;
  lat?: number;
  lng?: number;
}> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        allowed: false,
        reason: "Location services are not supported by your browser.",
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (isWithinNigeria(lat, lng)) {
          resolve({ allowed: true, lat, lng });
        } else {
          resolve({
            allowed: false,
            reason:
              "You must be physically located in Nigeria to post reports on this platform.",
          });
        }
      },
      (err) => {
        const reason =
          err.code === err.TIMEOUT
            ? "Location check timed out. Please ensure location services are enabled."
            : "Location access is required to post reports. Please enable location services in your browser.";
        resolve({ allowed: false, reason });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}
// ────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const stationMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const dispatch = useAppDispatch();
  const { showUploadModal, showReportDetail, showStations } = useAppSelector(
    (state) => state.ui,
  );
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: user } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: reportsData } = useGetReportsQuery();
  const { data: stations } = useGetStationsQuery();
  const { isConnected } = useWebSocket();

  // Refs so map event-handler closures always read the latest values (created once)
  const userRef = useRef(user);
  userRef.current = user;
  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const [mapLoaded, setMapLoaded] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [activeBaseMap, setActiveBaseMap] = useState("satellite");

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [7.4951, 9.0579], // Default: Abuja, Nigeria
      zoom: 6,
      attributionControl: false,
    });

    mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapInstance.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "top-right",
    );

    mapInstance.on("load", () => {
      setMapLoaded(true);
    });

    // Right-click to add report
    mapInstance.on("contextmenu", async (e) => {
      const currentUser = userRef.current;
      const isAuth = isAuthenticatedRef.current;

      if (!isAuth) {
        toast.error(
          "Please log in or create an account to report an incident.",
        );
        navigateRef.current("/login");
        return;
      }

      if (!currentUser?.is_fully_verified) {
        const msg =
          !currentUser?.email_verified && !currentUser?.nin_verified
            ? "Please verify your email address and NIN to post reports."
            : !currentUser?.email_verified
              ? "Please verify your email address to post reports."
              : "Please verify your NIN to post reports.";
        toast.error(msg);
        return;
      }

      const loadingToastId = toast.loading("Checking your location...");
      try {
        const loc = await getCurrentDeviceLocation();
        toast.dismiss(loadingToastId);
        if (!loc.allowed) {
          toast.error(loc.reason ?? "Location check failed.");
          return;
        }

        if (typeof loc.lat !== "number" || typeof loc.lng !== "number") {
          toast.error("Unable to verify your current device location.");
          return;
        }

        const deviceLat = loc.lat;
        const deviceLng = loc.lng;

        const distanceKm = getDistanceKm(
          deviceLat,
          deviceLng,
          e.lngLat.lat,
          e.lngLat.lng,
        );

        if (distanceKm > MAX_REPORT_DISTANCE_KM) {
          toast.error(
            `Selected point is too far from your device location (${distanceKm.toFixed(1)} km). Move closer and try again.`,
          );
          return;
        }

        dispatch(
          openUploadModal({
            lat: e.lngLat.lat,
            lng: e.lngLat.lng,
            deviceLat,
            deviceLng,
          }),
        );
      } catch {
        toast.dismiss(loadingToastId);
        toast.error("Location check failed. Please try again.");
      }
    });

    map.current = mapInstance;

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, [dispatch]);

  // Add report markers
  const addReportMarkers = useCallback(
    (reports: Report[]) => {
      if (!map.current) return;

      // Clear existing
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      reports.forEach((report) => {
        const severity = SEVERITY_LEVELS.find(
          (s) => s.value === report.severity,
        );
        const markerColor = severity?.color ?? "#ef4444";

        const el = document.createElement("div");
        el.className = "report-marker";
        el.innerHTML = `
          <div style="
            width: 36px; height: 36px;
            background: ${markerColor};
            border: 3px solid white;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </div>
        `;

        el.addEventListener("click", () => {
          dispatch(openReportDetail(report));
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([report.longitude, report.latitude])
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    },
    [dispatch],
  );

  // Add station markers
  const addStationMarkers = useCallback((stationsList: SecurityStation[]) => {
    if (!map.current) return;

    stationMarkersRef.current.forEach((m) => m.remove());
    stationMarkersRef.current = [];

    stationsList.forEach((station) => {
      const stationType = STATION_TYPES.find(
        (s) => s.value === station.station_type,
      );
      const color = stationType?.color ?? "#3b82f6";

      const el = document.createElement("div");
      el.innerHTML = `
        <div style="
          width: 30px; height: 30px;
          background: ${color};
          border: 2px solid white;
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(`
        <div style="padding: 12px; min-width: 180px;">
          <h3 style="font-weight: 700; font-size: 14px; color: #102a43; margin-bottom: 4px;">
            ${station.name}
          </h3>
          <p style="font-size: 12px; color: #627d98; margin-bottom: 4px;">
            ${station.station_type_display}
          </p>
          ${station.address ? `<p style="font-size: 11px; color: #829ab1;">${station.address}</p>` : ""}
          ${station.phone_number ? `<p style="font-size: 11px; color: #486581; margin-top: 4px;">📞 ${station.phone_number}</p>` : ""}
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([station.longitude, station.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      stationMarkersRef.current.push(marker);
    });
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!mapLoaded) return;
    if (reportsData?.results) {
      addReportMarkers(reportsData.results);
    }
  }, [reportsData, mapLoaded, addReportMarkers]);

  useEffect(() => {
    if (!mapLoaded) return;
    if (showStations && stations) {
      addStationMarkers(stations);
    } else {
      stationMarkersRef.current.forEach((m) => m.remove());
      stationMarkersRef.current = [];
    }
  }, [stations, showStations, mapLoaded, addStationMarkers]);

  const handleBaseMapChange = (id: string) => {
    if (!map.current || id === activeBaseMap) return;
    const bm = BASE_MAPS.find((m) => m.id === id);
    if (!bm) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.current.setStyle(bm.style as any);
    setActiveBaseMap(id);
  };

  const handleSearchSelect = (result: SearchResult) => {
    if (!map.current) return;

    // Remove previous search pin
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }

    // Create a custom pin element
    const el = document.createElement("div");
    el.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));
      ">
        <div style="
          background: #10b981;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          white-space: nowrap;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
        ">${result.place_name.split(",")[0]}</div>
        <div style="
          width: 0; height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid #10b981;
        "></div>
        <div style="
          width: 10px; height: 10px;
          background: #10b981;
          border: 2px solid white;
          border-radius: 50%;
        "></div>
      </div>
    `;

    const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([result.lng, result.lat])
      .addTo(map.current);

    searchMarkerRef.current = marker;

    map.current.flyTo({
      center: [result.lng, result.lat],
      zoom: 13,
      duration: 1800,
      essential: true,
    });
  };

  const handleAddReport = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in or create an account to report an incident.");
      navigate("/login");
      return;
    }

    if (!user?.is_fully_verified) {
      const msg =
        !user?.email_verified && !user?.nin_verified
          ? "Please verify your email address and NIN to post reports."
          : !user?.email_verified
            ? "Please verify your email address to post reports."
            : "Please verify your NIN to post reports.";
      toast.error(msg);
      return;
    }

    setIsCheckingLocation(true);
    try {
      const loc = await getCurrentDeviceLocation();
      if (!loc.allowed) {
        toast.error(loc.reason ?? "Location check failed.");
        return;
      }

      if (typeof loc.lat !== "number" || typeof loc.lng !== "number") {
        toast.error("Unable to verify your current device location.");
        return;
      }

      const deviceLat = loc.lat;
      const deviceLng = loc.lng;

      if (map.current) {
        dispatch(
          openUploadModal({
            lat: deviceLat,
            lng: deviceLng,
            deviceLat,
            deviceLng,
          }),
        );
      }
    } catch {
      toast.error("Location check failed. Please try again.");
    } finally {
      setIsCheckingLocation(false);
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] relative overflow-hidden">
      {/* Map Container */}
      <div ref={mapContainer} className="dashboard-map w-full h-full" />

      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* Status Indicator */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-navy-900/90 backdrop-blur-md text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-lg flex items-center gap-2 sm:gap-3"
        >
          <HiShieldCheck className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">S4 Security</span>
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isConnected ? "bg-emerald-400 animate-pulse" : "bg-danger-500"
            }`}
            title={isConnected ? "Real-time connected" : "Connecting..."}
          />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-lg flex items-center gap-3"
        >
          <div className="flex items-center gap-1.5">
            <HiMicrophone className="w-4 h-4 text-danger-500" />
            <span className="text-sm font-semibold text-navy-800">
              {reportsData?.count ?? 0}
            </span>
            <span className="hidden sm:inline text-xs text-navy-500">
              reports
            </span>
          </div>
          <div className="w-px h-4 bg-navy-200" />
          <div className="flex items-center gap-1.5">
            <HiMapPin className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-navy-800">
              {stations?.length ?? 0}
            </span>
            <span className="hidden sm:inline text-xs text-navy-500">
              stations
            </span>
          </div>
        </motion.div>

        {/* Toggle Stations */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => dispatch(toggleStations())}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-lg text-xs sm:text-sm font-medium transition-colors ${
            showStations
              ? "bg-emerald-500 text-white"
              : "bg-white/90 backdrop-blur-md text-navy-700 hover:bg-white"
          }`}
        >
          <HiSignal className="w-4 h-4" />
          {showStations ? "Hide Stations" : "Show Stations"}
        </motion.button>
      </div>

      {/* Right-side controls — search + base map toggle */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2"
      >
        <MapSearchBox onSelect={handleSearchSelect} />

        {/* Base map toggle */}
        <div className="flex bg-white/90 backdrop-blur-md rounded-xl shadow-lg overflow-hidden">
          {BASE_MAPS.map((bm, idx) => (
            <button
              key={bm.id}
              onClick={() => handleBaseMapChange(bm.id)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                idx < BASE_MAPS.length - 1 ? "border-r border-navy-100" : ""
              } ${
                activeBaseMap === bm.id
                  ? "bg-navy-800 text-white"
                  : "text-navy-600 hover:bg-navy-50"
              }`}
            >
              {bm.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Add Report FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.3 }}
        whileHover={{ scale: isCheckingLocation ? 1 : 1.1 }}
        whileTap={{ scale: isCheckingLocation ? 1 : 0.9 }}
        onClick={handleAddReport}
        disabled={isCheckingLocation}
        className="absolute bottom-24 right-4 sm:bottom-8 sm:right-8 z-10 w-12 h-12 cursor-pointer animate-pulse bg-red-600 hover:bg-danger-700 disabled:opacity-75 text-white rounded-full shadow-lg shadow-danger-600/40 flex items-center justify-center"
        title={
          isCheckingLocation
            ? "Checking your location..."
            : "Report an incident"
        }
      >
        {isCheckingLocation ? (
          <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <HiPlus className="w-7 h-7" />
        )}
      </motion.button>

      {/* Hint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 bg-navy-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs whitespace-nowrap"
      >
        <span className="hidden sm:inline">
          {isAuthenticated
            ? "Right-click on the map to report an incident"
            : "Browse incidents \u00b7 Log in to post a report"}
        </span>
        <span className="sm:hidden">
          {isAuthenticated ? "Tap + to report" : "Log in to report"}
        </span>
      </motion.div>

      {/* Legend */}
      <AnimatePresence>
        {showStations && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-32 sm:bottom-24 left-4 z-10 bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-3"
          >
            <h4 className="text-xs font-bold text-navy-700 mb-2 flex items-center gap-1">
              <HiFunnel className="w-3 h-3" /> Legend
            </h4>
            <div className="space-y-1.5">
              {STATION_TYPES.map((st) => (
                <div key={st.value} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ background: st.color }}
                  />
                  <span className="text-xs text-navy-600">{st.label}</span>
                </div>
              ))}
              <div className="border-t border-navy-100 pt-1.5 mt-1.5">
                {SEVERITY_LEVELS.map((sv) => (
                  <div key={sv.value} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: sv.color }}
                    />
                    <span className="text-xs text-navy-600">
                      {sv.label} Report
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Sidebar */}
      <ReportSidebar />

      {/* Modals */}
      {showUploadModal && <VoiceUploadModal />}
      {showReportDetail && <ReportDetailModal />}
    </div>
  );
}
