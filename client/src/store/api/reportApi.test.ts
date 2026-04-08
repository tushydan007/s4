import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import authReducer from "@/store/slices/authSlice";

vi.mock("@/store/api/baseQuery", () => ({
  baseQueryWithReauth: fetchBaseQuery({ baseUrl: "http://test" }),
}));

import { reportApi } from "@/store/api/reportApi";

const mockFetch = vi.fn();

function createStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [reportApi.reducerPath]: reportApi.reducer,
    },
    middleware: (gd) => gd().concat(reportApi.middleware),
  });
}

describe("reportApi", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    store = createStore();
    mockFetch.mockClear();
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ results: [], count: 0 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    store.dispatch(reportApi.util.resetApiState());
  });

  it("has the correct reducerPath", () => {
    expect(reportApi.reducerPath).toBe("reportApi");
  });

  function getUrl() {
    return (mockFetch.mock.calls[0][0] as Request).url;
  }

  it("getReports sends GET with no filters", async () => {
    store.dispatch(reportApi.endpoints.getReports.initiate());
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/reports/?");
  });

  it("getReports sends GET with filters", async () => {
    store.dispatch(
      reportApi.endpoints.getReports.initiate({
        category: "robbery",
        min_lat: 4,
        max_lat: 14,
        page: 2,
      }),
    );
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const url = getUrl();
    expect(url).toContain("category=robbery");
    expect(url).toContain("page=2");
  });

  it("getReports passes null/undefined filters correctly", async () => {
    store.dispatch(
      reportApi.endpoints.getReports.initiate({
        category: undefined,
        min_lat: undefined,
      }),
    );
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).not.toContain("category");
  });

  it("getReport sends GET for a specific report", async () => {
    store.dispatch(reportApi.endpoints.getReport.initiate("report-1"));
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/reports/report-1/");
  });

  it("createReport sends POST with FormData", async () => {
    const fd = new FormData();
    fd.append("title", "Test");
    store.dispatch(reportApi.endpoints.createReport.initiate(fd));
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/reports/create/");
    expect((mockFetch.mock.calls[0][0] as Request).method).toBe("POST");
  });

  it("deleteReport sends DELETE", async () => {
    store.dispatch(reportApi.endpoints.deleteReport.initiate("report-1"));
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/reports/report-1/");
    expect((mockFetch.mock.calls[0][0] as Request).method).toBe("DELETE");
  });

  it("getUserReports sends GET to /reports/my-reports/", async () => {
    store.dispatch(reportApi.endpoints.getUserReports.initiate());
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/reports/my-reports/");
  });
});
