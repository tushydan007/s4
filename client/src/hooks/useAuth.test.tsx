import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { createTestStore, createMockUser } from "@/test/utils";

// Mock the logout mutation
const mockLogoutApi = vi
  .fn()
  .mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) });
vi.mock("@/store/api/authApi", async () => {
  const actual = await vi.importActual("@/store/api/authApi");
  return {
    ...actual,
    useLogoutMutation: () => [mockLogoutApi, { isLoading: false }],
  };
});

import { useAuth } from "@/hooks/useAuth";

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createWrapper(preloadedState = {}) {
    const store = createTestStore(preloadedState);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>
        <MemoryRouter>{children}</MemoryRouter>
      </Provider>
    );
    return { store, wrapper };
  }

  it("returns isAuthenticated false when no token", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("returns isAuthenticated true with token", () => {
    const { wrapper } = createWrapper({
      auth: { isAuthenticated: true, accessToken: "token" },
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("login dispatches setCredentials", () => {
    const { wrapper, store } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    const user = createMockUser();
    act(() => {
      result.current.login({ user, access: "a-token", refresh: "r-token" });
    });

    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.accessToken).toBe("a-token");
  });

  it("handleRequires2FA sets temp token", () => {
    const { wrapper, store } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.handleRequires2FA("temp-123");
    });

    expect(store.getState().auth.tempToken).toBe("temp-123");
    expect(store.getState().auth.requires2FA).toBe(true);
  });

  it("logout clears auth state", async () => {
    const { wrapper, store } = createWrapper({
      auth: {
        isAuthenticated: true,
        accessToken: "token",
        refreshToken: "refresh",
        user: createMockUser(),
      },
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.user).toBeNull();
  });

  it("returns user from state", () => {
    const user = createMockUser();
    const { wrapper } = createWrapper({
      auth: {
        isAuthenticated: true,
        accessToken: "token",
        user,
      },
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toEqual(user);
  });

  it("returns requires2FA and tempToken from state", () => {
    const { wrapper } = createWrapper({
      auth: {
        requires2FA: true,
        tempToken: "temp-xyz",
      },
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.requires2FA).toBe(true);
    expect(result.current.tempToken).toBe("temp-xyz");
  });
});
