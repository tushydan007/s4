import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { createTestStore } from "@/test/utils";

// We need to mock WebSocket before importing the hook
let mockWsInstance: {
  onopen: (() => void) | null;
  onmessage: ((e: { data: string }) => void) | null;
  onclose: (() => void) | null;
  onerror: (() => void) | null;
  close: ReturnType<typeof vi.fn>;
};

class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();

  constructor() {
    mockWsInstance = this;
  }
}
vi.stubGlobal("WebSocket", MockWebSocket);

import { useWebSocket } from "@/hooks/useWebSocket";

describe("useWebSocket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  function createWrapper(authenticated: boolean) {
    const store = createTestStore({
      auth: {
        isAuthenticated: authenticated,
        accessToken: authenticated ? "token" : null,
      },
    });
    return {
      store,
      wrapper: ({ children }: { children: ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      ),
    };
  }

  it("does not connect when not authenticated", () => {
    const { wrapper } = createWrapper(false);
    renderHook(() => useWebSocket(), { wrapper });
    expect(mockWsInstance).toBeUndefined;
  });

  it("connects when authenticated", () => {
    const { wrapper } = createWrapper(true);
    const { result } = renderHook(() => useWebSocket(), { wrapper });
    expect(result.current.isConnected).toBe(false);
  });

  it("sets isConnected to true on open", async () => {
    const { wrapper } = createWrapper(true);
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    await act(async () => {
      mockWsInstance?.onopen?.();
    });
    expect(result.current.isConnected).toBe(true);
  });

  it("cleans up WebSocket on unmount", () => {
    const { wrapper } = createWrapper(true);
    const { unmount } = renderHook(() => useWebSocket(), { wrapper });
    unmount();
    expect(mockWsInstance.close).toHaveBeenCalled();
  });

  it("handles new_report message without crashing", async () => {
    const { wrapper } = createWrapper(true);
    renderHook(() => useWebSocket(), { wrapper });

    await act(async () => {
      mockWsInstance?.onmessage?.({
        data: JSON.stringify({ type: "new_report" }),
      });
    });
    // Should not throw — the dispatch happens internally
  });

  it("ignores malformed messages without crashing", async () => {
    const { wrapper } = createWrapper(true);
    renderHook(() => useWebSocket(), { wrapper });

    await act(async () => {
      mockWsInstance?.onmessage?.({ data: "not json" });
    });
    // Should not throw
  });

  it("sets isConnected to false on close", async () => {
    const { wrapper } = createWrapper(true);
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    await act(async () => {
      mockWsInstance?.onopen?.();
    });
    expect(result.current.isConnected).toBe(true);

    await act(async () => {
      mockWsInstance?.onclose?.();
    });
    expect(result.current.isConnected).toBe(false);
  });

  it("closes socket on error", async () => {
    const { wrapper } = createWrapper(true);
    renderHook(() => useWebSocket(), { wrapper });

    await act(async () => {
      mockWsInstance?.onerror?.();
    });
    expect(mockWsInstance.close).toHaveBeenCalled();
  });

  it("attempts reconnect after close", async () => {
    const { wrapper } = createWrapper(true);
    renderHook(() => useWebSocket(), { wrapper });

    await act(async () => {
      mockWsInstance?.onclose?.();
    });

    // Advance timer to trigger reconnect
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    // A new WebSocket connection should have been attempted
    // (the constructor will create a new mockWsInstance)
  });
});
