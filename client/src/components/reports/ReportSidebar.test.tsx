import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import ReportSidebar from "@/components/reports/ReportSidebar";
import { renderWithProviders, createMockReport } from "@/test/utils";

vi.mock("@/store/api/reportApi", async () => {
  const actual = await vi.importActual("@/store/api/reportApi");
  return {
    ...actual,
    useGetReportsQuery: vi.fn(),
  };
});

import { useGetReportsQuery } from "@/store/api/reportApi";
const mockUseGetReportsQuery = useGetReportsQuery as unknown as ReturnType<
  typeof vi.fn
>;

describe("ReportSidebar", () => {
  it("renders toggle button", () => {
    mockUseGetReportsQuery.mockReturnValue({
      data: { count: 0, results: [], next: null, previous: null },
      isLoading: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<ReportSidebar />);
    // Toggle button exists in the DOM
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("shows reports when sidebar is open", () => {
    const report = createMockReport({ title: "Robbery on Allen Ave" });
    mockUseGetReportsQuery.mockReturnValue({
      data: { count: 1, results: [report], next: null, previous: null },
      isLoading: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<ReportSidebar />, {
      preloadedState: {
        ui: {
          sidebarOpen: true,
          showUploadModal: false,
          showReportDetail: false,
          selectedReport: null,
          selectedLocation: null,
          showStations: true,
        },
      },
    });

    expect(screen.getByText("Recent Reports")).toBeInTheDocument();
    expect(screen.getByText("Robbery on Allen Ave")).toBeInTheDocument();
  });

  it("shows empty state when no reports", () => {
    mockUseGetReportsQuery.mockReturnValue({
      data: { count: 0, results: [], next: null, previous: null },
      isLoading: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<ReportSidebar />, {
      preloadedState: {
        ui: {
          sidebarOpen: true,
          showUploadModal: false,
          showReportDetail: false,
          selectedReport: null,
          selectedLocation: null,
          showStations: true,
        },
      },
    });

    expect(screen.getByText("No reports yet")).toBeInTheDocument();
  });

  it("shows loading spinner when loading", () => {
    mockUseGetReportsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    });

    renderWithProviders(<ReportSidebar />, {
      preloadedState: {
        ui: {
          sidebarOpen: true,
          showUploadModal: false,
          showReportDetail: false,
          selectedReport: null,
          selectedLocation: null,
          showStations: true,
        },
      },
    });

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeTruthy();
  });

  it("shows total report count in footer", () => {
    mockUseGetReportsQuery.mockReturnValue({
      data: {
        count: 42,
        results: [createMockReport()],
        next: null,
        previous: null,
      },
      isLoading: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<ReportSidebar />, {
      preloadedState: {
        ui: {
          sidebarOpen: true,
          showUploadModal: false,
          showReportDetail: false,
          selectedReport: null,
          selectedLocation: null,
          showStations: true,
        },
      },
    });

    expect(screen.getByText("42 total reports")).toBeInTheDocument();
  });

  it("toggles sidebar when close button clicked", () => {
    mockUseGetReportsQuery.mockReturnValue({
      data: { count: 0, results: [], next: null, previous: null },
      isLoading: false,
      refetch: vi.fn(),
    });

    const { store } = renderWithProviders(<ReportSidebar />, {
      preloadedState: {
        ui: {
          sidebarOpen: true,
          showUploadModal: false,
          showReportDetail: false,
          selectedReport: null,
          selectedLocation: null,
          showStations: true,
        },
      },
    });

    // Click the close button inside the sidebar header
    const closeButtons = screen.getAllByRole("button");
    // The close button inside the sidebar header
    const closeBtn = closeButtons.find((btn) => btn.querySelector(".w-5.h-5"));
    if (closeBtn) fireEvent.click(closeBtn);

    expect(store.getState().ui.sidebarOpen).toBe(false);
  });

  it("opens report detail on report click", () => {
    const report = createMockReport({ title: "Test Click Report" });
    mockUseGetReportsQuery.mockReturnValue({
      data: { count: 1, results: [report], next: null, previous: null },
      isLoading: false,
      refetch: vi.fn(),
    });

    const { store } = renderWithProviders(<ReportSidebar />, {
      preloadedState: {
        ui: {
          sidebarOpen: true,
          showUploadModal: false,
          showReportDetail: false,
          selectedReport: null,
          selectedLocation: null,
          showStations: true,
        },
      },
    });

    fireEvent.click(screen.getByText("Test Click Report"));
    expect(store.getState().ui.showReportDetail).toBe(true);
    expect(store.getState().ui.selectedReport?.title).toBe("Test Click Report");
  });

  it("formats 'Just now' for reports less than 1 minute old", () => {
    const report = createMockReport({
      title: "New Report",
      created_at: new Date().toISOString(),
    });
    mockUseGetReportsQuery.mockReturnValue({
      data: { count: 1, results: [report], next: null, previous: null },
      isLoading: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<ReportSidebar />, {
      preloadedState: {
        ui: {
          sidebarOpen: true,
          showUploadModal: false,
          showReportDetail: false,
          selectedReport: null,
          selectedLocation: null,
          showStations: true,
        },
      },
    });

    expect(screen.getByText("Just now")).toBeInTheDocument();
  });

  it("formats 'Xm ago' for reports less than 1 hour old", () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const report = createMockReport({
      title: "Recent Report",
      created_at: thirtyMinsAgo,
    });
    mockUseGetReportsQuery.mockReturnValue({
      data: { count: 1, results: [report], next: null, previous: null },
      isLoading: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<ReportSidebar />, {
      preloadedState: {
        ui: {
          sidebarOpen: true,
          showUploadModal: false,
          showReportDetail: false,
          selectedReport: null,
          selectedLocation: null,
          showStations: true,
        },
      },
    });

    expect(screen.getByText("30m ago")).toBeInTheDocument();
  });

  it("formats 'Xh ago' for reports less than 24 hours old", () => {
    const fiveHoursAgo = new Date(
      Date.now() - 5 * 60 * 60 * 1000,
    ).toISOString();
    const report = createMockReport({
      title: "Hours Report",
      created_at: fiveHoursAgo,
    });
    mockUseGetReportsQuery.mockReturnValue({
      data: { count: 1, results: [report], next: null, previous: null },
      isLoading: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<ReportSidebar />, {
      preloadedState: {
        ui: {
          sidebarOpen: true,
          showUploadModal: false,
          showReportDetail: false,
          selectedReport: null,
          selectedLocation: null,
          showStations: true,
        },
      },
    });

    expect(screen.getByText("5h ago")).toBeInTheDocument();
  });

  it("formats 'Xd ago' for reports less than 7 days old", () => {
    const threeDaysAgo = new Date(
      Date.now() - 3 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const report = createMockReport({
      title: "Days Report",
      created_at: threeDaysAgo,
    });
    mockUseGetReportsQuery.mockReturnValue({
      data: { count: 1, results: [report], next: null, previous: null },
      isLoading: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<ReportSidebar />, {
      preloadedState: {
        ui: {
          sidebarOpen: true,
          showUploadModal: false,
          showReportDetail: false,
          selectedReport: null,
          selectedLocation: null,
          showStations: true,
        },
      },
    });

    expect(screen.getByText("3d ago")).toBeInTheDocument();
  });

  it("formats date for reports older than 7 days", () => {
    const twoWeeksAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const report = createMockReport({
      title: "Old Report",
      created_at: twoWeeksAgo,
    });
    mockUseGetReportsQuery.mockReturnValue({
      data: { count: 1, results: [report], next: null, previous: null },
      isLoading: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<ReportSidebar />, {
      preloadedState: {
        ui: {
          sidebarOpen: true,
          showUploadModal: false,
          showReportDetail: false,
          selectedReport: null,
          selectedLocation: null,
          showStations: true,
        },
      },
    });

    // Should show a short date like "Jun 15"
    const date = new Date(twoWeeksAgo);
    const expected = date.toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
    });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("shows severity display and category display on report items", () => {
    const report = createMockReport({
      severity: "high",
      severity_display: "High",
      category: "robbery",
      category_display: "Robbery",
    });
    mockUseGetReportsQuery.mockReturnValue({
      data: { count: 1, results: [report], next: null, previous: null },
      isLoading: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<ReportSidebar />, {
      preloadedState: {
        ui: {
          sidebarOpen: true,
          showUploadModal: false,
          showReportDetail: false,
          selectedReport: null,
          selectedLocation: null,
          showStations: true,
        },
      },
    });

    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText(/Robbery/)).toBeInTheDocument();
  });
});
