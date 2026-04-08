import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import authReducer from "@/store/slices/authSlice";

vi.mock("@/store/api/baseQuery", () => ({
  baseQueryWithReauth: fetchBaseQuery({ baseUrl: "http://test" }),
}));

import { stationApi } from "@/store/api/stationApi";

const mockFetch = vi.fn();

function createStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [stationApi.reducerPath]: stationApi.reducer,
    },
    middleware: (gd) => gd().concat(stationApi.middleware),
  });
}

describe("stationApi", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    store = createStore();
    mockFetch.mockClear();
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    store.dispatch(stationApi.util.resetApiState());
  });

  it("has the correct reducerPath", () => {
    expect(stationApi.reducerPath).toBe("stationApi");
  });

  function getUrl() {
    return (mockFetch.mock.calls[0][0] as Request).url;
  }

  it("getStations sends GET with no params", async () => {
    store.dispatch(stationApi.endpoints.getStations.initiate());
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/stations/?");
  });

  it("getStations sends GET with type filter", async () => {
    store.dispatch(
      stationApi.endpoints.getStations.initiate({ type: "police" }),
    );
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("type=police");
  });

  it("getNearestStations sends GET with location params", async () => {
    store.dispatch(
      stationApi.endpoints.getNearestStations.initiate({
        lat: 6.5,
        lng: 3.4,
        radius: 50,
        limit: 10,
      }),
    );
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const url = getUrl();
    expect(url).toContain("/stations/nearest/");
    expect(url).toContain("lat=6.5");
    expect(url).toContain("lng=3.4");
  });

  it("getNearestStations uses default radius and limit", async () => {
    store.dispatch(
      stationApi.endpoints.getNearestStations.initiate({ lat: 7, lng: 4 }),
    );
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const url = getUrl();
    expect(url).toContain("radius=50");
    expect(url).toContain("limit=10");
  });
});
