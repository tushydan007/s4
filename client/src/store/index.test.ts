import { describe, it, expect } from "vitest";
import { createTestStore } from "@/test/utils";

describe("store", () => {
  it("creates store with auth reducer", () => {
    const store = createTestStore();
    const state = store.getState();
    expect(state).toHaveProperty("auth");
    expect(state.auth).toHaveProperty("isAuthenticated");
    expect(state.auth).toHaveProperty("user");
  });

  it("creates store with ui reducer", () => {
    const store = createTestStore();
    const state = store.getState();
    expect(state).toHaveProperty("ui");
    expect(state.ui).toHaveProperty("showUploadModal");
    expect(state.ui).toHaveProperty("sidebarOpen");
  });

  it("creates store with API reducers", () => {
    const store = createTestStore();
    const state = store.getState();
    expect(state).toHaveProperty("authApi");
    expect(state).toHaveProperty("reportApi");
    expect(state).toHaveProperty("stationApi");
  });

  it("can be created with preloaded auth state", () => {
    const store = createTestStore({
      auth: {
        isAuthenticated: true,
        accessToken: "test-token",
      },
    });
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.accessToken).toBe("test-token");
  });
});
