import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import authReducer from "@/store/slices/authSlice";

// Mock baseQuery to use a simple fetchBaseQuery with a known baseUrl
vi.mock("@/store/api/baseQuery", () => ({
  baseQueryWithReauth: fetchBaseQuery({ baseUrl: "http://test" }),
}));

import { authApi } from "@/store/api/authApi";

const mockFetch = vi.fn().mockResolvedValue(
  new Response(JSON.stringify({}), {
    status: 200,
    headers: { "content-type": "application/json" },
  }),
);

function createStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (gd) => gd().concat(authApi.middleware),
  });
}

describe("authApi", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    store = createStore();
    mockFetch.mockClear();
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    store.dispatch(authApi.util.resetApiState());
  });

  it("has the correct reducerPath", () => {
    expect(authApi.reducerPath).toBe("authApi");
  });

  function getUrl() {
    return (mockFetch.mock.calls[0][0] as Request).url;
  }

  it("register sends POST to /users/register/", async () => {
    store.dispatch(
      authApi.endpoints.register.initiate({
        email: "t@t.com",
        username: "u",
        first_name: "F",
        last_name: "L",
        phone_number: "+234",
        nin: "12345678901",
        password: "P1!aaaa",
        password_confirm: "P1!aaaa",
      }),
    );
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/users/register/");
    expect((mockFetch.mock.calls[0][0] as Request).method).toBe("POST");
  });

  it("login sends POST to /users/login/", async () => {
    store.dispatch(
      authApi.endpoints.login.initiate({ email: "t@t.com", password: "p" }),
    );
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/users/login/");
    expect((mockFetch.mock.calls[0][0] as Request).method).toBe("POST");
  });

  it("verifyEmail sends GET", async () => {
    store.dispatch(authApi.endpoints.verifyEmail.initiate("tok"));
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/users/verify-email/tok/");
  });

  it("resendVerification sends POST", async () => {
    store.dispatch(
      authApi.endpoints.resendVerification.initiate({ email: "t@t.com" }),
    );
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/users/resend-verification/");
  });

  it("setupTwoFactor sends GET", async () => {
    store.dispatch(authApi.endpoints.setupTwoFactor.initiate());
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/users/2fa/setup/");
  });

  it("confirmTwoFactorSetup sends POST", async () => {
    store.dispatch(
      authApi.endpoints.confirmTwoFactorSetup.initiate({ otp_code: "123456" }),
    );
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/users/2fa/setup/");
    expect((mockFetch.mock.calls[0][0] as Request).method).toBe("POST");
  });

  it("verifyTwoFactor sends POST", async () => {
    store.dispatch(
      authApi.endpoints.verifyTwoFactor.initiate({
        otp_code: "1",
        temp_token: "t",
      }),
    );
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/users/2fa/verify/");
  });

  it("verifyLoginOTP sends POST", async () => {
    store.dispatch(
      authApi.endpoints.verifyLoginOTP.initiate({
        otp_code: "1",
        temp_token: "t",
      }),
    );
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/users/login/verify-otp/");
  });

  it("disableTwoFactor sends POST", async () => {
    store.dispatch(
      authApi.endpoints.disableTwoFactor.initiate({ otp_code: "1" }),
    );
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/users/2fa/disable/");
  });

  it("verifyNIN sends POST", async () => {
    store.dispatch(
      authApi.endpoints.verifyNIN.initiate({
        nin: "12345678901",
        first_name: "F",
        last_name: "L",
      }),
    );
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/users/nin/verify/");
  });

  it("preVerifyNIN sends POST", async () => {
    store.dispatch(
      authApi.endpoints.preVerifyNIN.initiate({
        nin: "12345678901",
        first_name: "F",
        last_name: "L",
      }),
    );
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/users/nin/pre-verify/");
  });

  it("getProfile sends GET", async () => {
    store.dispatch(authApi.endpoints.getProfile.initiate());
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/users/profile/");
  });

  it("updateProfile sends PATCH", async () => {
    store.dispatch(
      authApi.endpoints.updateProfile.initiate({ first_name: "X" }),
    );
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/users/profile/");
    expect((mockFetch.mock.calls[0][0] as Request).method).toBe("PATCH");
  });

  it("logout sends POST", async () => {
    store.dispatch(authApi.endpoints.logout.initiate({ refresh: "ref" }));
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(getUrl()).toContain("/users/logout/");
    expect((mockFetch.mock.calls[0][0] as Request).method).toBe("POST");
  });
});
