import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import Layout from "@/components/layout/Layout";
import { createTestStore } from "@/test/utils";

// Mock useAuth to avoid complex setup
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}));

describe("Layout", () => {
  it("renders Header and Outlet", () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<div>Page Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByText("S4 Security")).toBeInTheDocument();
    expect(screen.getByText("Page Content")).toBeInTheDocument();
  });

  it("renders navigation links for unauthenticated users", () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<div>Home</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Get Started")).toBeInTheDocument();
  });
});
