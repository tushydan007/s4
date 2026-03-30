import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Report } from "@/types";

interface UIState {
  showUploadModal: boolean;
  showReportDetail: boolean;
  selectedReport: Report | null;
  selectedLocation: { lat: number; lng: number } | null;
  sidebarOpen: boolean;
  showStations: boolean;
}

const initialState: UIState = {
  showUploadModal: false,
  showReportDetail: false,
  selectedReport: null,
  selectedLocation: null,
  sidebarOpen: false,
  showStations: true,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openUploadModal(
      state,
      action: PayloadAction<{ lat: number; lng: number }>,
    ) {
      state.showUploadModal = true;
      state.selectedLocation = action.payload;
    },
    closeUploadModal(state) {
      state.showUploadModal = false;
      state.selectedLocation = null;
    },
    openReportDetail(state, action: PayloadAction<Report>) {
      state.showReportDetail = true;
      state.selectedReport = action.payload;
    },
    closeReportDetail(state) {
      state.showReportDetail = false;
      state.selectedReport = null;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleStations(state) {
      state.showStations = !state.showStations;
    },
  },
});

export const {
  openUploadModal,
  closeUploadModal,
  openReportDetail,
  closeReportDetail,
  toggleSidebar,
  toggleStations,
} = uiSlice.actions;

export default uiSlice.reducer;
