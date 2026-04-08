import { describe, it, expect, beforeEach, vi } from "vitest";
import authReducer, {
  setCredentials,
  setTempToken,
  setUser,
  updateTokens,
  logout,
} from "@/store/slices/authSlice";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

const mockUser = {
  id: "1",
  email: "test@test.com",
  username: "testuser",
  first_name: "Test",
  last_name: "User",
  phone_number: "+234123",
  nin_verified: false,
  email_verified: true,
  two_factor_enabled: false,
  is_fully_verified: false,
  profile_picture: null,
  date_joined: "2024-01-01T00:00:00Z",
};

describe("authSlice", () => {
  const initialState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    tempToken: null,
    isAuthenticated: false,
    requires2FA: false,
  };

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("has correct initial state", () => {
    const state = authReducer(undefined, { type: "unknown" });
    expect(state.user).toBeNull();
    expect(state.tempToken).toBeNull();
    expect(state.requires2FA).toBe(false);
  });

  it("setCredentials stores user and tokens", () => {
    const state = authReducer(
      initialState,
      setCredentials({
        user: mockUser,
        access: "access-token",
        refresh: "refresh-token",
      }),
    );
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe("access-token");
    expect(state.refreshToken).toBe("refresh-token");
    expect(state.isAuthenticated).toBe(true);
    expect(state.requires2FA).toBe(false);
    expect(state.tempToken).toBeNull();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "access_token",
      "access-token",
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "refresh_token",
      "refresh-token",
    );
  });

  it("setTempToken stores temp token and sets requires2FA", () => {
    const state = authReducer(initialState, setTempToken("temp-123"));
    expect(state.tempToken).toBe("temp-123");
    expect(state.requires2FA).toBe(true);
  });

  it("setUser updates user", () => {
    const state = authReducer(initialState, setUser(mockUser));
    expect(state.user).toEqual(mockUser);
  });

  it("updateTokens updates access token", () => {
    const state = authReducer(
      { ...initialState, accessToken: "old" },
      updateTokens({ access: "new-access" }),
    );
    expect(state.accessToken).toBe("new-access");
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "access_token",
      "new-access",
    );
  });

  it("updateTokens updates both tokens when refresh provided", () => {
    const state = authReducer(
      initialState,
      updateTokens({ access: "new-a", refresh: "new-r" }),
    );
    expect(state.accessToken).toBe("new-a");
    expect(state.refreshToken).toBe("new-r");
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "refresh_token",
      "new-r",
    );
  });

  it("logout clears all state", () => {
    const authState = {
      user: mockUser,
      accessToken: "access",
      refreshToken: "refresh",
      tempToken: "temp",
      isAuthenticated: true,
      requires2FA: true,
    };
    const state = authReducer(authState, logout());
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.tempToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.requires2FA).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("access_token");
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("refresh_token");
  });
});
