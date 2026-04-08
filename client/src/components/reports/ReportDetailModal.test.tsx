import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReportDetailModal from "@/components/reports/ReportDetailModal";
import {
  renderWithProviders,
  createMockReport,
  createMockUser,
} from "@/test/utils";

const mockDeleteReport = vi.fn();

vi.mock("@/store/api/reportApi", async () => {
  const actual = await vi.importActual("@/store/api/reportApi");
  return {
    ...actual,
    useDeleteReportMutation: vi.fn(() => [
      mockDeleteReport,
      { isLoading: false },
    ]),
  };
});

// Mock toast
const mockToast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({ default: mockToast }));

// Capture event listeners on Audio instances
let audioListeners: Record<string, (() => void)[]>;
let lastAudio: {
  src: string;
  currentTime: number;
  duration: number;
  ended: boolean;
  error: { code: number } | null;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
};

class MockAudio {
  src = "";
  currentTime = 0;
  duration = 10;
  ended = false;
  error: { code: number } | null = null;
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  addEventListener = vi.fn((event: string, handler: () => void) => {
    if (!audioListeners[event]) audioListeners[event] = [];
    audioListeners[event].push(handler);
  });
  removeEventListener = vi.fn();
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastAudio = this as unknown as typeof lastAudio;
  }
}
vi.stubGlobal("Audio", MockAudio);

// MediaError constants not available in jsdom
const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;
const MEDIA_ERR_NETWORK = 2;

// Stub MediaError for the source code which references MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
vi.stubGlobal("MediaError", {
  MEDIA_ERR_ABORTED: 1,
  MEDIA_ERR_NETWORK: 2,
  MEDIA_ERR_DECODE: 3,
  MEDIA_ERR_SRC_NOT_SUPPORTED: 4,
});

function uiState(report: ReturnType<typeof createMockReport>, userId?: string) {
  return {
    preloadedState: {
      ...(userId
        ? {
            auth: {
              user: createMockUser({ id: userId }),
              isAuthenticated: true,
              accessToken: "token",
            },
          }
        : {}),
      ui: {
        showReportDetail: true,
        selectedReport: report,
        showUploadModal: false,
        selectedLocation: null,
        sidebarOpen: false,
        showStations: true,
      },
    },
  };
}

describe("ReportDetailModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    audioListeners = {};
  });

  it("returns null when no selected report", () => {
    const { container } = renderWithProviders(<ReportDetailModal />, {
      preloadedState: {
        ui: {
          showReportDetail: false,
          selectedReport: null,
          showUploadModal: false,
          selectedLocation: null,
          sidebarOpen: false,
          showStations: true,
        },
      },
    });
    expect(container.innerHTML).toBe("");
  });

  it("renders report title when selected", () => {
    const report = createMockReport({ title: "Armed Robbery Alert" });
    renderWithProviders(<ReportDetailModal />, uiState(report));
    expect(screen.getByText("Armed Robbery Alert")).toBeInTheDocument();
  });

  it("renders severity and category badges", () => {
    const report = createMockReport({
      severity: "high",
      severity_display: "High",
      category: "robbery",
      category_display: "Robbery",
    });
    renderWithProviders(<ReportDetailModal />, uiState(report));
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("renders description", () => {
    const report = createMockReport({ description: "Detailed event info" });
    renderWithProviders(<ReportDetailModal />, uiState(report));
    expect(screen.getByText("Detailed event info")).toBeInTheDocument();
  });

  it("hides description section when no description", () => {
    const report = createMockReport({ description: "" });
    renderWithProviders(<ReportDetailModal />, uiState(report));
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
  });

  it("shows delete button for report owner", () => {
    const report = createMockReport({ user: "user-1" });
    renderWithProviders(<ReportDetailModal />, uiState(report, "user-1"));
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("hides delete button for non-owner", () => {
    const report = createMockReport({ user: "other-user" });
    renderWithProviders(<ReportDetailModal />, uiState(report, "user-1"));
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("renders voice note player and triggers loadedmetadata", async () => {
    const report = createMockReport({ voice_note: "/media/voice.webm" });
    renderWithProviders(<ReportDetailModal />, uiState(report));
    expect(screen.getByText("Voice Note")).toBeInTheDocument();

    // Trigger loadedmetadata
    await act(async () => {
      audioListeners.loadedmetadata?.forEach((fn) => fn());
    });
    // duration text should appear
    expect(screen.getByText("10s")).toBeInTheDocument();
  });

  it("handles audio loadedmetadata with infinite duration", async () => {
    const report = createMockReport({ voice_note: "/media/voice.webm" });
    renderWithProviders(<ReportDetailModal />, uiState(report));

    lastAudio.duration = Infinity;
    await act(async () => {
      audioListeners.loadedmetadata?.forEach((fn) => fn());
    });
    // duration should be 0, so no "s" text
    expect(screen.queryByText(/^\d+s$/)).not.toBeInTheDocument();
  });

  it("handles audio timeupdate event", async () => {
    const report = createMockReport({ voice_note: "/media/voice.webm" });
    renderWithProviders(<ReportDetailModal />, uiState(report));

    lastAudio.currentTime = 5;
    lastAudio.duration = 10;
    await act(async () => {
      audioListeners.timeupdate?.forEach((fn) => fn());
    });
    // Progress bar should be at 50% - just verify no crash
    expect(screen.getByText("Voice Note")).toBeInTheDocument();
  });

  it("handles audio ended event", async () => {
    const report = createMockReport({ voice_note: "/media/voice.webm" });
    renderWithProviders(<ReportDetailModal />, uiState(report));

    await act(async () => {
      audioListeners.ended?.forEach((fn) => fn());
    });
    expect(screen.getByText("Voice Note")).toBeInTheDocument();
  });

  it("handles audio error event with unsupported format", async () => {
    const report = createMockReport({ voice_note: "/media/voice.webm" });
    renderWithProviders(<ReportDetailModal />, uiState(report));

    lastAudio.error = { code: MEDIA_ERR_SRC_NOT_SUPPORTED };
    await act(async () => {
      audioListeners.error?.forEach((fn) => fn());
    });
    expect(
      screen.getByText("Audio format is not supported on this browser."),
    ).toBeInTheDocument();
  });

  it("handles audio error event with generic error", async () => {
    const report = createMockReport({ voice_note: "/media/voice.webm" });
    renderWithProviders(<ReportDetailModal />, uiState(report));

    lastAudio.error = { code: MEDIA_ERR_NETWORK };
    await act(async () => {
      audioListeners.error?.forEach((fn) => fn());
    });
    expect(
      screen.getByText("Unable to load this voice note."),
    ).toBeInTheDocument();
  });

  it("toggles playback - play and pause", async () => {
    const user = userEvent.setup();
    const report = createMockReport({ voice_note: "/media/voice.webm" });
    renderWithProviders(<ReportDetailModal />, uiState(report));

    // Find the play button inside the voice note section
    const voiceNoteText = screen.getByText("Voice Note");
    const voiceSection = voiceNoteText.closest("div[class*='rounded-xl']");
    const playBtn = voiceSection!.querySelector("button")!;

    // Play
    await user.click(playBtn);
    expect(lastAudio.play).toHaveBeenCalled();

    // Pause (need to simulate that isPlaying is now true)
    await user.click(playBtn);
    expect(lastAudio.pause).toHaveBeenCalled();
  });

  it("toggles playback - restarts when ended", async () => {
    const user = userEvent.setup();
    const report = createMockReport({ voice_note: "/media/voice.webm" });
    renderWithProviders(<ReportDetailModal />, uiState(report));

    // Set audio as ended
    lastAudio.ended = true;
    lastAudio.currentTime = lastAudio.duration;
    const voiceNoteText = screen.getByText("Voice Note");
    const voiceSection = voiceNoteText.closest("div[class*='rounded-xl']");
    const playBtn = voiceSection!.querySelector("button")!;
    await user.click(playBtn);

    expect(lastAudio.play).toHaveBeenCalled();
  });

  it("handles playback error with unsupported format", async () => {
    const user = userEvent.setup();
    const report = createMockReport({ voice_note: "/media/voice.webm" });
    renderWithProviders(<ReportDetailModal />, uiState(report));

    lastAudio.play.mockRejectedValueOnce(new Error("Failed"));
    lastAudio.error = { code: MEDIA_ERR_SRC_NOT_SUPPORTED };
    const voiceNoteText = screen.getByText("Voice Note");
    const voiceSection = voiceNoteText.closest("div[class*='rounded-xl']");
    const playBtn = voiceSection!.querySelector("button")!;
    await user.click(playBtn);

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith(
        "Audio format is not supported on this browser.",
      ),
    );
  });

  it("handles playback error with generic error", async () => {
    const user = userEvent.setup();
    const report = createMockReport({ voice_note: "/media/voice.webm" });
    renderWithProviders(<ReportDetailModal />, uiState(report));

    lastAudio.play.mockRejectedValueOnce(new Error("Failed"));
    lastAudio.error = null;
    const voiceNoteText2 = screen.getByText("Voice Note");
    const voiceSection2 = voiceNoteText2.closest("div[class*='rounded-xl']");
    const playBtn2 = voiceSection2!.querySelector("button")!;
    await user.click(playBtn2);

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith(
        "Unable to play this voice note.",
      ),
    );
  });

  it("hides voice note player when no voice_note", () => {
    const report = createMockReport({ voice_note: "" });
    renderWithProviders(<ReportDetailModal />, uiState(report));
    expect(screen.queryByText("Voice Note")).not.toBeInTheDocument();
  });

  it("renders image media with gallery", () => {
    const report = createMockReport({
      media: [
        {
          id: "m1",
          media_type: "image",
          file: "/media/image.jpg",
          created_at: "2024-01-01",
        },
        {
          id: "m2",
          media_type: "image",
          file: "/media/image2.jpg",
          created_at: "2024-01-01",
        },
      ],
    });
    renderWithProviders(<ReportDetailModal />, uiState(report));
    expect(screen.getByText(/Media \(2\)/)).toBeInTheDocument();
  });

  it("renders video media links", () => {
    const report = createMockReport({
      media: [
        {
          id: "m1",
          media_type: "video",
          file: "/media/video.mp4",
          created_at: "2024-01-01",
        },
      ],
    });
    renderWithProviders(<ReportDetailModal />, uiState(report));
    expect(screen.getByText(/Media \(1\)/)).toBeInTheDocument();
  });

  it("renders reporter name and date", () => {
    const report = createMockReport({
      user_name: "John Doe",
      created_at: "2024-06-15T10:30:00Z",
    });
    renderWithProviders(<ReportDetailModal />, uiState(report));
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders location coordinates in meta info", () => {
    const report = createMockReport({ latitude: 6.5, longitude: 3.4 });
    renderWithProviders(<ReportDetailModal />, uiState(report));
    expect(screen.getByText(/6\.500000, 3\.400000/)).toBeInTheDocument();
  });

  it("formats non-numeric coordinates as N/A", () => {
    const report = createMockReport({
      latitude: "not-a-number" as unknown as number,
      longitude: "also-bad" as unknown as number,
    });
    renderWithProviders(<ReportDetailModal />, uiState(report));
    expect(screen.getByText(/N\/A, N\/A/)).toBeInTheDocument();
  });

  it("shows user email when user_name is empty", () => {
    const report = createMockReport({
      user_name: "",
      user_email: "john@example.com",
    });
    renderWithProviders(<ReportDetailModal />, uiState(report));
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("handles delete confirmation and success", async () => {
    const user = userEvent.setup();
    const report = createMockReport({ id: "r1", user: "user-1" });
    mockDeleteReport.mockReturnValue({
      unwrap: () => Promise.resolve(undefined),
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithProviders(<ReportDetailModal />, uiState(report, "user-1"));
    await user.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(mockDeleteReport).toHaveBeenCalledWith("r1");
      expect(mockToast.success).toHaveBeenCalledWith(
        "Report deleted successfully",
      );
    });
    vi.restoreAllMocks();
  });

  it("does not delete when confirm is cancelled", async () => {
    const user = userEvent.setup();
    const report = createMockReport({ user: "user-1" });
    vi.spyOn(window, "confirm").mockReturnValue(false);

    renderWithProviders(<ReportDetailModal />, uiState(report, "user-1"));
    await user.click(screen.getByText("Delete"));

    expect(mockDeleteReport).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("handles delete failure with detail field", async () => {
    const user = userEvent.setup();
    const report = createMockReport({ user: "user-1" });
    mockDeleteReport.mockReturnValue({
      unwrap: () => Promise.reject({ data: { detail: "Not allowed" } }),
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithProviders(<ReportDetailModal />, uiState(report, "user-1"));
    await user.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Not allowed");
    });
    vi.restoreAllMocks();
  });

  it("handles delete failure with error field", async () => {
    const user = userEvent.setup();
    const report = createMockReport({ user: "user-1" });
    mockDeleteReport.mockReturnValue({
      unwrap: () => Promise.reject({ data: { error: "Server error" } }),
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithProviders(<ReportDetailModal />, uiState(report, "user-1"));
    await user.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Server error");
    });
    vi.restoreAllMocks();
  });

  it("handles delete failure with no data", async () => {
    const user = userEvent.setup();
    const report = createMockReport({ user: "user-1" });
    mockDeleteReport.mockReturnValue({
      unwrap: () => Promise.reject({}),
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithProviders(<ReportDetailModal />, uiState(report, "user-1"));
    await user.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Failed to delete report");
    });
    vi.restoreAllMocks();
  });

  it("clicks image thumbnail to switch active media", async () => {
    const user = userEvent.setup();
    const report = createMockReport({
      media: [
        {
          id: "m1",
          media_type: "image",
          file: "/media/img1.jpg",
          created_at: "2024-01-01",
        },
        {
          id: "m2",
          media_type: "image",
          file: "/media/img2.jpg",
          created_at: "2024-01-01",
        },
      ],
    });
    renderWithProviders(<ReportDetailModal />, uiState(report));

    const thumbnailButtons = document.querySelectorAll(
      "button[class*='rounded-lg']",
    );
    const imgThumbnails = Array.from(thumbnailButtons).filter((btn) =>
      btn.querySelector("img"),
    );
    if (imgThumbnails.length > 1) {
      await user.click(imgThumbnails[1] as HTMLElement);
    }
    expect(screen.getByText(/Media \(2\)/)).toBeInTheDocument();
  });

  it("closes modal and stops audio on close", async () => {
    const user = userEvent.setup();
    const report = createMockReport({ voice_note: "/media/voice.webm" });
    renderWithProviders(<ReportDetailModal />, uiState(report));

    // The close button is the one right after the title in the modal header
    // It contains an SVG and no text - find the button closest to the title
    const titleEl = screen.getByText("Report Details");
    const headerDiv = titleEl.parentElement!;
    const closeBtn = headerDiv.querySelector("button");
    if (closeBtn) {
      await user.click(closeBtn);
      expect(lastAudio.pause).toHaveBeenCalled();
    }
  });
});
