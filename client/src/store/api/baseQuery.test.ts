import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the re-auth logic by mocking fetchBaseQuery so we can
// control what each successive call returns.

const baseFn = vi.fn();
let capturedPrepareHeaders: Function | undefined;

vi.mock("@reduxjs/toolkit/query/react", () => ({
  fetchBaseQuery: (opts: { prepareHeaders?: Function }) => {
    capturedPrepareHeaders = opts?.prepareHeaders;
    return baseFn;
  },
}));

vi.mock("@/store/slices/authSlice", () => ({
  logout: () => ({ type: "auth/logout" }),
  updateTokens: (payload: unknown) => ({
    type: "auth/updateTokens",
    payload,
  }),
}));

// Must import AFTER mocks
const { baseQueryWithReauth } = await import("@/store/api/baseQuery");

function makeApi(accessToken: string | null, refreshToken: string | null) {
  return {
    getState: () => ({
      auth: { accessToken, refreshToken },
    }),
    dispatch: vi.fn(),
  };
}

describe("baseQueryWithReauth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns result directly when no error", async () => {
    baseFn.mockResolvedValueOnce({ data: { id: 1 } });

    const api = makeApi("access-tok", "refresh-tok");
    const result = await baseQueryWithReauth("/test", api as never, {});

    expect(result).toEqual({ data: { id: 1 } });
    expect(baseFn).toHaveBeenCalledTimes(1);
  });

  it("refreshes token on 401 and retries", async () => {
    baseFn.mockResolvedValueOnce({ error: { status: 401 } });
    baseFn.mockResolvedValueOnce({
      data: { access: "new-access", refresh: "new-refresh" },
    });
    baseFn.mockResolvedValueOnce({ data: { id: 2 } });

    const api = makeApi("old-access", "old-refresh");
    const result = await baseQueryWithReauth("/test", api as never, {});

    expect(result).toEqual({ data: { id: 2 } });
    expect(baseFn).toHaveBeenCalledTimes(3);
    expect(api.dispatch).toHaveBeenCalledWith({
      type: "auth/updateTokens",
      payload: { access: "new-access", refresh: "new-refresh" },
    });
  });

  it("dispatches logout when refresh fails", async () => {
    baseFn.mockResolvedValueOnce({ error: { status: 401 } });
    baseFn.mockResolvedValueOnce({ error: { status: 401 } });

    const api = makeApi("access", "refresh");
    await baseQueryWithReauth("/test", api as never, {});

    expect(api.dispatch).toHaveBeenCalledWith({ type: "auth/logout" });
  });

  it("dispatches logout when no refresh token available", async () => {
    baseFn.mockResolvedValueOnce({ error: { status: 401 } });

    const api = makeApi("access", null);
    await baseQueryWithReauth("/test", api as never, {});

    expect(api.dispatch).toHaveBeenCalledWith({ type: "auth/logout" });
    expect(baseFn).toHaveBeenCalledTimes(1);
  });

  it("does not attempt refresh for non-401 errors", async () => {
    baseFn.mockResolvedValueOnce({ error: { status: 500 } });

    const api = makeApi("access", "refresh");
    const result = await baseQueryWithReauth("/test", api as never, {});

    expect(result).toEqual({ error: { status: 500 } });
    expect(baseFn).toHaveBeenCalledTimes(1);
    expect(api.dispatch).not.toHaveBeenCalled();
  });
});

describe("prepareHeaders", () => {
  it("sets Authorization header when token is available", () => {
    expect(capturedPrepareHeaders).toBeDefined();
    const headers = new Headers();
    const getState = () => ({ auth: { accessToken: "my-token" } });
    const result = capturedPrepareHeaders!(headers, { getState });
    expect(result.get("Authorization")).toBe("Bearer my-token");
  });

  it("does not set Authorization header when no token", () => {
    expect(capturedPrepareHeaders).toBeDefined();
    const headers = new Headers();
    const getState = () => ({ auth: { accessToken: null } });
    const result = capturedPrepareHeaders!(headers, { getState });
    expect(result.get("Authorization")).toBeNull();
  });
});
