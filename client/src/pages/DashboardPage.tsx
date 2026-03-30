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
import type { Report, SecurityStation } from "@/types";
import { STATION_TYPES, SEVERITY_LEVELS } from "@/types";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

export default function DashboardPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const stationMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const dispatch = useAppDispatch();
  const { showUploadModal, showReportDetail, showStations } = useAppSelector(
    (state) => state.ui,
  );
  const { data: user } = useGetProfileQuery();
  const { data: reportsData } = useGetReportsQuery();
  const { data: stations } = useGetStationsQuery();
  const { isConnected } = useWebSocket();

  const [mapLoaded, setMapLoaded] = useState(false);

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

    mapInstance.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    mapInstance.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "bottom-right",
    );

    mapInstance.on("load", () => {
      setMapLoaded(true);
    });

    // Right-click to add report
    mapInstance.on("contextmenu", (e) => {
      if (!user?.is_fully_verified) {
        toast.error(
          "Please complete NIN and email verification to post reports.",
        );
        return;
      }
      dispatch(openUploadModal({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
    });

    map.current = mapInstance;

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, [dispatch, user?.is_fully_verified]);

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

  const handleAddReport = () => {
    if (!user?.is_fully_verified) {
      toast.error(
        "Please complete NIN and email verification to post reports.",
      );
      return;
    }
    // Use map center as default location
    if (map.current) {
      const center = map.current.getCenter();
      dispatch(openUploadModal({ lat: center.lat, lng: center.lng }));
    }
  };

  return (
    <div className="h-full relative overflow-hidden">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

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

      {/* Add Report FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.3 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleAddReport}
        className="absolute bottom-24 right-4 sm:bottom-8 sm:right-8 z-10 w-14 h-14 bg-danger-600 hover:bg-danger-700 text-white rounded-full shadow-lg shadow-danger-600/40 flex items-center justify-center"
        title="Report an incident"
      >
        <HiPlus className="w-7 h-7" />
      </motion.button>

      {/* Hint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 bg-navy-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs whitespace-nowrap"
      >
        <span className="hidden sm:inline">
          Right-click on the map to report an incident
        </span>
        <span className="sm:hidden">
          Tap the + button to report an incident
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
