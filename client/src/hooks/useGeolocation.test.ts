import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// The hook reads `navigator.geolocation` at module-level, so we must
// reset modules and re-import for each test to pick up our mock.
let mockGetCurrentPosition: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockGetCurrentPosition = vi.fn();
  Object.defineProperty(navigator, "geolocation", {
    value: { getCurrentPosition: mockGetCurrentPosition },
    writable: true,
    configurable: true,
  });
});

async function importHook() {
  const mod = await import("@/hooks/useGeolocation");
  return mod.useGeolocation;
}

describe("useGeolocation", () => {
  it("starts in loading state when geolocation is supported", async () => {
    mockGetCurrentPosition.mockImplementation(() => {});
    const useGeolocation = await importHook();
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.loading).toBe(true);
    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();
  });

  it("sets coordinates on successful geolocation", async () => {
    mockGetCurrentPosition.mockImplementation((success: PositionCallback) => {
      success({
        coords: {
          latitude: 6.5,
          longitude: 3.4,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    });

    const useGeolocation = await importHook();
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.latitude).toBe(6.5);
    expect(result.current.longitude).toBe(3.4);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error on geolocation failure", async () => {
    mockGetCurrentPosition.mockImplementation(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error({
          code: 1,
          message: "User denied",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError);
      },
    );

    const useGeolocation = await importHook();
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.error).toBe("User denied");
    expect(result.current.loading).toBe(false);
  });

  it("provides a refresh function", async () => {
    mockGetCurrentPosition.mockImplementation(() => {});
    const useGeolocation = await importHook();
    const { result } = renderHook(() => useGeolocation());
    expect(typeof result.current.refresh).toBe("function");
  });

  it("refresh re-calls getCurrentPosition", async () => {
    mockGetCurrentPosition.mockImplementation(() => {});
    const useGeolocation = await importHook();
    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.refresh();
    });

    // Called initially in useEffect + once for refresh
    expect(mockGetCurrentPosition.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("refresh success callback updates coordinates", async () => {
    // First call (useEffect) does nothing; refresh call returns position
    let callCount = 0;
    mockGetCurrentPosition.mockImplementation((success: PositionCallback) => {
      callCount++;
      if (callCount >= 2) {
        success({
          coords: {
            latitude: 9.0,
            longitude: 7.5,
            accuracy: 5,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as GeolocationPosition);
      }
    });

    const useGeolocation = await importHook();
    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.refresh();
    });

    expect(result.current.latitude).toBe(9.0);
    expect(result.current.longitude).toBe(7.5);
    expect(result.current.loading).toBe(false);
  });

  it("refresh error callback sets error state", async () => {
    let callCount = 0;
    mockGetCurrentPosition.mockImplementation(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        callCount++;
        if (callCount >= 2) {
          error({
            code: 3,
            message: "Timeout",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError);
        }
      },
    );

    const useGeolocation = await importHook();
    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.refresh();
    });

    expect(result.current.error).toBe("Timeout");
    expect(result.current.latitude).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("returns error when geolocation is not supported", async () => {
    // Must delete the property so `'geolocation' in navigator` returns false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (navigator as any).geolocation;

    const useGeolocation = await importHook();
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.error).toBe(
      "Geolocation is not supported by your browser",
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.latitude).toBeNull();
  });

  it("refresh does nothing when geolocation not supported", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (navigator as any).geolocation;

    const useGeolocation = await importHook();
    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.refresh();
    });

    // Should not throw, just remain in error state
    expect(result.current.error).toBe(
      "Geolocation is not supported by your browser",
    );
  });
});
