import { describe, it, expect } from "vitest";
import uiReducer, {
  openUploadModal,
  closeUploadModal,
  openReportDetail,
  closeReportDetail,
  toggleSidebar,
  toggleStations,
} from "@/store/slices/uiSlice";
import { createMockReport } from "@/test/utils";

describe("uiSlice", () => {
  const initialState = {
    showUploadModal: false,
    showReportDetail: false,
    selectedReport: null,
    selectedLocation: null,
    sidebarOpen: false,
    showStations: true,
  };

  it("has correct initial state", () => {
    const state = uiReducer(undefined, { type: "unknown" });
    expect(state).toEqual(initialState);
  });

  it("openUploadModal sets location and shows modal", () => {
    const loc = { lat: 6.5, lng: 3.4, deviceLat: 6.5, deviceLng: 3.4 };
    const state = uiReducer(initialState, openUploadModal(loc));
    expect(state.showUploadModal).toBe(true);
    expect(state.selectedLocation).toEqual(loc);
  });

  it("closeUploadModal hides modal and clears location", () => {
    const openState = {
      ...initialState,
      showUploadModal: true,
      selectedLocation: { lat: 6.5, lng: 3.4, deviceLat: 6.5, deviceLng: 3.4 },
    };
    const state = uiReducer(openState, closeUploadModal());
    expect(state.showUploadModal).toBe(false);
    expect(state.selectedLocation).toBeNull();
  });

  it("openReportDetail sets report and shows detail", () => {
    const report = createMockReport();
    const state = uiReducer(initialState, openReportDetail(report));
    expect(state.showReportDetail).toBe(true);
    expect(state.selectedReport).toEqual(report);
  });

  it("closeReportDetail hides detail and clears report", () => {
    const openState = {
      ...initialState,
      showReportDetail: true,
      selectedReport: createMockReport(),
    };
    const state = uiReducer(openState, closeReportDetail());
    expect(state.showReportDetail).toBe(false);
    expect(state.selectedReport).toBeNull();
  });

  it("toggleSidebar toggles sidebar state", () => {
    const state1 = uiReducer(initialState, toggleSidebar());
    expect(state1.sidebarOpen).toBe(true);
    const state2 = uiReducer(state1, toggleSidebar());
    expect(state2.sidebarOpen).toBe(false);
  });

  it("toggleStations toggles stations state", () => {
    const state1 = uiReducer(initialState, toggleStations());
    expect(state1.showStations).toBe(false);
    const state2 = uiReducer(state1, toggleStations());
    expect(state2.showStations).toBe(true);
  });
});
