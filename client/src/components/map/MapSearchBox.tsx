import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiMagnifyingGlass, HiXMark, HiMapPin } from "react-icons/hi2";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

interface GeocodingFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [lng, lat]
  place_type: string[];
}

export interface SearchResult {
  lng: number;
  lat: number;
  place_name: string;
}

interface MapSearchBoxProps {
  onSelect: (result: SearchResult) => void;
}

export default function MapSearchBox({ onSelect }: MapSearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingFeature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const url = new URL(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json`,
      );
      url.searchParams.set("access_token", MAPBOX_TOKEN);
      url.searchParams.set("country", "NG");
      url.searchParams.set("limit", "6");
      url.searchParams.set("language", "en");

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Geocoding request failed");

      const data = (await res.json()) as { features: GeocodingFeature[] };
      setResults(data.features ?? []);
      setActiveIndex(-1);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void search(val), 300);
  };

  const handleSelect = (feature: GeocodingFeature) => {
    setQuery(feature.place_name);
    setResults([]);
    setIsOpen(false);
    onSelect({
      lng: feature.center[0],
      lat: feature.center[1],
      place_name: feature.place_name,
    });
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cleanup debounce timer
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-xl shadow-lg px-3 py-2.5 w-48 sm:w-72 transition-all">
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-navy-400 border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          <HiMagnifyingGlass className="w-4 h-4 text-navy-400 shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search places in Nigeria…"
          className="flex-1 text-sm text-navy-800 placeholder:text-navy-400 bg-transparent outline-none min-w-0"
          autoComplete="off"
          spellCheck={false}
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.1 }}
              type="button"
              onClick={handleClear}
              className="text-navy-300 hover:text-navy-600 transition-colors shrink-0"
              aria-label="Clear search"
            >
              <HiXMark className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Results dropdown */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-navy-100"
            role="listbox"
          >
            {results.map((feature, idx) => (
              <li
                key={feature.id}
                role="option"
                aria-selected={idx === activeIndex}
              >
                <button
                  type="button"
                  // Prevent input blur before click fires
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(feature)}
                  className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors border-b border-navy-50 last:border-b-0 ${
                    idx === activeIndex
                      ? "bg-emerald-50 text-navy-900"
                      : "hover:bg-navy-50 text-navy-700"
                  }`}
                >
                  <HiMapPin
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      idx === activeIndex ? "text-emerald-500" : "text-navy-300"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-navy-800 truncate">
                      {feature.text}
                    </p>
                    <p className="text-[11px] text-navy-400 truncate leading-relaxed">
                      {feature.place_name}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
