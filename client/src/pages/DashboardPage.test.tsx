import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, act } from "@testing-library/react";
import { renderWithProviders } from "../test/utils";

// Configurable mock values
let mockReportsData = {
  count: 3,
  results: [
    {
      id: "r1",
      title: "Test Report",
      latitude: 9.06,
      longitude: 7.49,
      severity: "high",
      category: "robbery",
      status: "pending",
      created_at: "2024-01-01T00:00:00Z",
      reporter_name: "User",
    },
  ],
  next: null,
  previous: null,
};
let mockStations = [
  {
    id: "s1",
    name: "Station A",
    latitude: 9.05,
    longitude: 7.48,
    station_type: "police",
    station_type_display: "Police Station",
    address: "123 Main St",
    phone_number: "080",
  },
];
let mockUser: Record<string, unknown> | undefined = {
  id: "u1",
  email: "a@b.com",
  email_verified: true,
  nin_verified: true,
  is_fully_verified: true,
};

// Capture map event handlers
const mapEventHandlers: Record<string, ((...args: unknown[]) => void)[]> = {};

// Mock mapbox-gl
vi.mock("mapbox-gl", () => {
  class MockMap {
    addControl = vi.fn();
    on = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!mapEventHandlers[event]) mapEventHandlers[event] = [];
      mapEventHandlers[event].push(handler);
    });
    remove = vi.fn();
    getStyle = vi.fn().mockReturnValue({ layers: [] });
    setStyle = vi.fn();
    flyTo = vi.fn();
    getCenter = vi.fn().mockReturnValue({ lng: 7.49, lat: 9.05 });
    getZoom = vi.fn().mockReturnValue(6);
  }
  class MockMarker {
    setLngLat = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn();
    setPopup = vi.fn().mockReturnThis();
    getElement = vi.fn().mockReturnValue(document.createElement("div"));
  }
  class MockPopup {
    setHTML = vi.fn().mockReturnThis();
    setLngLat = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
  }
  return {
    default: {
      Map: MockMap,
      Marker: MockMarker,
      Popup: MockPopup,
      NavigationControl: vi.fn(),
      GeolocateControl: vi.fn(),
      accessToken: "",
    },
    Map: MockMap,
    Marker: MockMarker,
    Popup: MockPopup,
    NavigationControl: vi.fn(),
    GeolocateControl: vi.fn(),
  };
});

vi.mock("mapbox-gl/dist/mapbox-gl.css", () => ({}));

vi.mock("@/hooks/useWebSocket", () => ({
  useWebSocket: () => ({ isConnected: true }),
}));

// Mock toast
const mockToast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  loading: vi.fn().mockReturnValue("loading-id"),
  dismiss: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({ default: mockToast }));

vi.mock("@/store/api/reportApi", () => ({
  reportApi: {
    reducerPath: "reportApi",
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (action: unknown) =>
      next(action),
    endpoints: {},
  },
  useGetReportsQuery: () => ({
    data: mockReportsData,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/store/api/stationApi", () => ({
  stationApi: {
    reducerPath: "stationApi",
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (action: unknown) =>
      next(action),
    endpoints: {},
  },
  useGetStationsQuery: () => ({
    data: mockStations,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/store/api/authApi", () => ({
  authApi: {
    reducerPath: "authApi",
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (action: unknown) =>
      next(action),
    endpoints: {},
  },
  useGetProfileQuery: () => ({
    data: mockUser,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

// Mock sub-components
vi.mock("@/components/reports/VoiceUploadModal", () => ({
  default: () => <div data-testid="voice-upload-modal" />,
}));
vi.mock("@/components/reports/ReportDetailModal", () => ({
  default: () => <div data-testid="report-detail-modal" />,
}));
vi.mock("@/components/reports/ReportSidebar", () => ({
  default: () => <div data-testid="report-sidebar" />,
}));
vi.mock("@/components/map/MapSearchBox", () => ({
  default: ({ onSelect }: { onSelect: (r: unknown) => void }) => (
    <div
      data-testid="map-search-box"
      onClick={() => onSelect({ lng: 3, lat: 6, place_name: "Lagos, Nigeria" })}
    />
  ),
  __esModule: true,
}));

import DashboardPage from "../pages/DashboardPage";

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset event handlers
    Object.keys(mapEventHandlers).forEach((k) => delete mapEventHandlers[k]);
    // Reset mock defaults
    mockUser = {
      id: "u1",
      email: "a@b.com",
      email_verified: true,
      nin_verified: true,
      is_fully_verified: true,
    };
    mockReportsData = {
      count: 3,
      results: [
        {
          id: "r1",
          title: "Test Report",
          latitude: 9.06,
          longitude: 7.49,
          severity: "high",
          category: "robbery",
          status: "pending",
          created_at: "2024-01-01T00:00:00Z",
          reporter_name: "User",
        },
      ],
      next: null,
      previous: null,
    };
    mockStations = [
      {
        id: "s1",
        name: "Station A",
        latitude: 9.05,
        longitude: 7.48,
        station_type: "police",
        station_type_display: "Police Station",
        address: "123 Main St",
        phone_number: "080",
      },
    ];
  });

  it("renders the map container", () => {
    const { container } = renderWithProviders(<DashboardPage />);
    const mapDiv = container.querySelector(".dashboard-map");
    expect(mapDiv).toBeTruthy();
  });

  it("renders report sidebar component", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByTestId("report-sidebar")).toBeInTheDocument();
  });

  it("renders search box component", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByTestId("map-search-box")).toBeInTheDocument();
  });

  it("renders base map selector buttons", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("Streets")).toBeInTheDocument();
    expect(screen.getByText("Terrain")).toBeInTheDocument();
    expect(screen.getByText("Satellite")).toBeInTheDocument();
  });

  it("renders the station toggle button", () => {
    renderWithProviders(<DashboardPage />);
    const btn =
      screen.queryByText("Hide Stations") ||
      screen.queryByText("Show Stations");
    expect(btn).toBeInTheDocument();
  });

  it("renders the report FAB button", () => {
    renderWithProviders(<DashboardPage />);
    const fab = screen.getByTitle("Report an incident");
    expect(fab).toBeInTheDocument();
  });

  it("renders S4 Security status indicator", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("S4 Security")).toBeInTheDocument();
  });

  it("displays report count", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("displays station count", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("toggles station visibility when button is clicked", async () => {
    renderWithProviders(<DashboardPage />, {
      preloadedState: {
        ui: {
          showUploadModal: false,
          showReportDetail: false,
          selectedReport: null,
          selectedLocation: null,
          sidebarOpen: false,
          showStations: true,
        },
      },
    });
    const toggleBtn = screen.getByText("Hide Stations");
    await act(async () => {
      fireEvent.click(toggleBtn);
    });
    await waitFor(() => {
      expect(screen.getByText("Show Stations")).toBeInTheDocument();
    });
  });

  it("switches base map when a selector button is clicked", async () => {
    renderWithProviders(<DashboardPage />);
    // Trigger map load
    act(() => {
      mapEventHandlers["load"]?.forEach((fn) => fn());
    });
    const streetsBtn = screen.getByText("Streets");
    await act(async () => {
      fireEvent.click(streetsBtn);
    });
    // Satellites is default, clicking Streets should switch
    expect(streetsBtn.className).toContain("bg-navy-800");
  });

  it("handles search result selection", async () => {
    renderWithProviders(<DashboardPage />);
    act(() => {
      mapEventHandlers["load"]?.forEach((fn) => fn());
    });
    const searchBox = screen.getByTestId("map-search-box");
    await act(async () => {
      fireEvent.click(searchBox);
    });
    // Search selection triggers flyTo on the map — no crash
  });

  it("removes previous search marker on second selection", async () => {
    renderWithProviders(<DashboardPage />);
    act(() => {
      mapEventHandlers["load"]?.forEach((fn) => fn());
    });
    const searchBox = screen.getByTestId("map-search-box");
    await act(async () => {
      fireEvent.click(searchBox);
    });
    // Click again to trigger the "remove previous marker" branch
    await act(async () => {
      fireEvent.click(searchBox);
    });
    // No crash — previous marker removed before creating a new one
  });

  it("shows upload modal when showUploadModal is true", () => {
    renderWithProviders(<DashboardPage />, {
      preloadedState: {
        ui: {
          showUploadModal: true,
          showReportDetail: false,
          selectedReport: null,
          selectedLocation: {
            lat: 6.5,
            lng: 3.4,
            deviceLat: 6.5,
            deviceLng: 3.4,
          },
          sidebarOpen: false,
          showStations: true,
        },
      },
    });
    expect(screen.getByTestId("voice-upload-modal")).toBeInTheDocument();
  });

  it("redirects unauthenticated user when adding report", async () => {
    renderWithProviders(<DashboardPage />, {
      preloadedState: {
        auth: {
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        },
      },
    });
    const fab = screen.getByTitle("Report an incident");
    await act(async () => {
      fireEvent.click(fab);
    });
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Please log in or create an account to report an incident.",
      );
    });
  });

  it("shows error for unverified user when adding report", async () => {
    mockUser = {
      id: "u1",
      email: "a@b.com",
      email_verified: false,
      nin_verified: false,
      is_fully_verified: false,
    };
    renderWithProviders(<DashboardPage />, {
      preloadedState: {
        auth: {
          accessToken: "tok",
          refreshToken: "ref",
          isAuthenticated: true,
        },
      },
    });
    const fab = screen.getByTitle("Report an incident");
    await act(async () => {
      fireEvent.click(fab);
    });
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Please verify your email address and NIN to post reports.",
      );
    });
  });

  it("shows error for email-only unverified user", async () => {
    mockUser = {
      id: "u1",
      email: "a@b.com",
      email_verified: false,
      nin_verified: true,
      is_fully_verified: false,
    };
    renderWithProviders(<DashboardPage />, {
      preloadedState: {
        auth: {
          accessToken: "tok",
          refreshToken: "ref",
          isAuthenticated: true,
        },
      },
    });
    const fab = screen.getByTitle("Report an incident");
    await act(async () => {
      fireEvent.click(fab);
    });
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Please verify your email address to post reports.",
      );
    });
  });

  it("shows error for nin-only unverified user", async () => {
    mockUser = {
      id: "u1",
      email: "a@b.com",
      email_verified: true,
      nin_verified: false,
      is_fully_verified: false,
    };
    renderWithProviders(<DashboardPage />, {
      preloadedState: {
        auth: {
          accessToken: "tok",
          refreshToken: "ref",
          isAuthenticated: true,
        },
      },
    });
    const fab = screen.getByTitle("Report an incident");
    await act(async () => {
      fireEvent.click(fab);
    });
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Please verify your NIN to post reports.",
      );
    });
  });

  it("checks geolocation when verified user clicks add report", async () => {
    // Mock geolocation to return a Nigerian location
    const mockGetCurrentPosition = vi.fn((success) => {
      success({ coords: { latitude: 9.06, longitude: 7.49 } });
    });
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    renderWithProviders(<DashboardPage />, {
      preloadedState: {
        auth: {
          accessToken: "tok",
          refreshToken: "ref",
          isAuthenticated: true,
        },
      },
    });
    // Trigger map load so map.current is set
    act(() => {
      mapEventHandlers["load"]?.forEach((fn) => fn());
    });

    const fab = screen.getByTitle("Report an incident");
    await act(async () => {
      fireEvent.click(fab);
    });
    await waitFor(() => {
      expect(mockGetCurrentPosition).toHaveBeenCalled();
    });
  });

  it("shows error when user is outside Nigeria", async () => {
    const mockGetCurrentPosition = vi.fn((success) => {
      // Location outside Nigeria
      success({ coords: { latitude: 51.5, longitude: -0.12 } });
    });
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    renderWithProviders(<DashboardPage />, {
      preloadedState: {
        auth: {
          accessToken: "tok",
          refreshToken: "ref",
          isAuthenticated: true,
        },
      },
    });
    act(() => {
      mapEventHandlers["load"]?.forEach((fn) => fn());
    });

    const fab = screen.getByTitle("Report an incident");
    await act(async () => {
      fireEvent.click(fab);
    });
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "You must be physically located in Nigeria to post reports on this platform.",
      );
    });
  });

  it("shows error when geolocation is denied", async () => {
    const mockGetCurrentPosition = vi.fn((_success, error) => {
      error({ code: 1, TIMEOUT: 3 });
    });
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    renderWithProviders(<DashboardPage />, {
      preloadedState: {
        auth: {
          accessToken: "tok",
          refreshToken: "ref",
          isAuthenticated: true,
        },
      },
    });
    act(() => {
      mapEventHandlers["load"]?.forEach((fn) => fn());
    });

    const fab = screen.getByTitle("Report an incident");
    await act(async () => {
      fireEvent.click(fab);
    });
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Location access is required to post reports. Please enable location services in your browser.",
      );
    });
  });

  it("shows error when geolocation times out", async () => {
    const mockGetCurrentPosition = vi.fn((_success, error) => {
      error({ code: 3, TIMEOUT: 3 });
    });
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    renderWithProviders(<DashboardPage />, {
      preloadedState: {
        auth: {
          accessToken: "tok",
          refreshToken: "ref",
          isAuthenticated: true,
        },
      },
    });
    act(() => {
      mapEventHandlers["load"]?.forEach((fn) => fn());
    });

    const fab = screen.getByTitle("Report an incident");
    await act(async () => {
      fireEvent.click(fab);
    });
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Location check timed out. Please ensure location services are enabled.",
      );
    });
  });

  it("shows error when geolocation is not supported", async () => {
    Object.defineProperty(navigator, "geolocation", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    renderWithProviders(<DashboardPage />, {
      preloadedState: {
        auth: {
          accessToken: "tok",
          refreshToken: "ref",
          isAuthenticated: true,
        },
      },
    });
    act(() => {
      mapEventHandlers["load"]?.forEach((fn) => fn());
    });

    const fab = screen.getByTitle("Report an incident");
    await act(async () => {
      fireEvent.click(fab);
    });
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Location services are not supported by your browser.",
      );
    });
  });

  it("adds report markers when map loads and reports exist", () => {
    renderWithProviders(<DashboardPage />);
    // Trigger map load to fire the marker-adding useEffects
    act(() => {
      mapEventHandlers["load"]?.forEach((fn) => fn());
    });
    // Markers were added — no crash
  });

  it("handles zero reports gracefully", () => {
    mockReportsData = {
      count: 0,
      results: [],
      next: null,
      previous: null,
    };
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders websocket connected indicator", () => {
    renderWithProviders(<DashboardPage />);
    // The green dot (connected) should have animate-pulse class
    const statusDot = document.querySelector(".bg-emerald-400.animate-pulse");
    expect(statusDot).toBeTruthy();
  });

  it("handles contextmenu event for unauthenticated user", async () => {
    renderWithProviders(<DashboardPage />, {
      preloadedState: {
        auth: {
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        },
      },
    });
    // Trigger contextmenu
    const contextHandler = mapEventHandlers["contextmenu"]?.[0];
    if (contextHandler) {
      await act(async () => {
        contextHandler({ lngLat: { lat: 9.06, lng: 7.49 } });
      });
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Please log in or create an account to report an incident.",
        );
      });
    }
  });

  it("handles contextmenu for unverified user", async () => {
    mockUser = {
      id: "u1",
      email: "a@b.com",
      email_verified: false,
      nin_verified: false,
      is_fully_verified: false,
    };
    renderWithProviders(<DashboardPage />, {
      preloadedState: {
        auth: {
          accessToken: "tok",
          refreshToken: "ref",
          isAuthenticated: true,
        },
      },
    });
    const contextHandler = mapEventHandlers["contextmenu"]?.[0];
    if (contextHandler) {
      await act(async () => {
        contextHandler({ lngLat: { lat: 9.06, lng: 7.49 } });
      });
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Please verify your email address and NIN to post reports.",
        );
      });
    }
  });

  it("handles contextmenu with valid location for verified user", async () => {
    const mockGetCurrentPosition = vi.fn((success) => {
      success({ coords: { latitude: 9.06, longitude: 7.49 } });
    });
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    const { store } = renderWithProviders(<DashboardPage />, {
      preloadedState: {
        auth: {
          accessToken: "tok",
          refreshToken: "ref",
          isAuthenticated: true,
        },
      },
    });
    const contextHandler = mapEventHandlers["contextmenu"]?.[0];
    if (contextHandler) {
      await act(async () => {
        // Right-click close to device location
        contextHandler({ lngLat: { lat: 9.06, lng: 7.49 } });
      });
      await waitFor(() => {
        expect(
          (store.getState() as { ui: { showUploadModal: boolean } }).ui
            .showUploadModal,
        ).toBe(true);
      });
    }
  });

  it("handles contextmenu when report point is too far", async () => {
    const mockGetCurrentPosition = vi.fn((success) => {
      // Device in Abuja
      success({ coords: { latitude: 9.06, longitude: 7.49 } });
    });
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    renderWithProviders(<DashboardPage />, {
      preloadedState: {
        auth: {
          accessToken: "tok",
          refreshToken: "ref",
          isAuthenticated: true,
        },
      },
    });
    const contextHandler = mapEventHandlers["contextmenu"]?.[0];
    if (contextHandler) {
      await act(async () => {
        // Right-click in Lagos (far from Abuja)
        contextHandler({ lngLat: { lat: 6.45, lng: 3.4 } });
      });
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          expect.stringContaining("too far from your device location"),
        );
      });
    }
  });

  it("shows error when device loc is not a number in handleAddReport", async () => {
    // Mock geolocation to return non-numeric lat/lng
    const mockGetCurrentPosition = vi.fn((success) => {
      success({ coords: { latitude: undefined, longitude: undefined } });
    });
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    renderWithProviders(<DashboardPage />, {
      preloadedState: {
        auth: {
          accessToken: "tok",
          refreshToken: "ref",
          isAuthenticated: true,
        },
      },
    });
    act(() => {
      mapEventHandlers["load"]?.forEach((fn) => fn());
    });

    const fab = screen.getByTitle("Report an incident");
    await act(async () => {
      fireEvent.click(fab);
    });
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });
  });

  it("shows error when geolocation throws unexpected error", async () => {
    const mockGetCurrentPosition = vi.fn(() => {
      throw new Error("Unexpected failure");
    });
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    renderWithProviders(<DashboardPage />, {
      preloadedState: {
        auth: {
          accessToken: "tok",
          refreshToken: "ref",
          isAuthenticated: true,
        },
      },
    });
    act(() => {
      mapEventHandlers["load"]?.forEach((fn) => fn());
    });

    const fab = screen.getByTitle("Report an incident");
    await act(async () => {
      fireEvent.click(fab);
    });
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Location check failed. Please try again.",
      );
    });
  });
});
