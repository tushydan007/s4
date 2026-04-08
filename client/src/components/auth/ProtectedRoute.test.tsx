import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { createTestStore } from "@/test/utils";

const mockUseGetProfileQuery = vi.fn();

vi.mock("@/store/api/authApi", () => ({
  authApi: {
    reducerPath: "authApi",
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (action: unknown) =>
      next(action),
    endpoints: {},
  },
  useGetProfileQuery: (...args: unknown[]) => mockUseGetProfileQuery(...args),
}));

import ProtectedRoute from "@/components/auth/ProtectedRoute";

function renderProtected(
  storeState: { isAuthenticated: boolean; accessToken: string | null },
  requireNIN = false,
) {
  const store = createTestStore({
    auth: {
      isAuthenticated: storeState.isAuthenticated,
      accessToken: storeState.accessToken,
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute requireNIN={requireNIN}>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/profile" element={<div>Profile Page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetProfileQuery.mockReturnValue({
      data: { id: "1", nin_verified: true },
      isLoading: false,
      isError: false,
    });
  });

  it("redirects to login when not authenticated", () => {
    renderProtected({ isAuthenticated: false, accessToken: null });
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("shows loading spinner when profile is loading", () => {
    mockUseGetProfileQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    renderProtected({ isAuthenticated: true, accessToken: "tok" });
    // FullPageSpinner renders a spinner, not "Protected Content"
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("renders children when authenticated and profile loaded", () => {
    renderProtected({ isAuthenticated: true, accessToken: "tok" });
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("redirects to login on profile error", () => {
    mockUseGetProfileQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    renderProtected({ isAuthenticated: true, accessToken: "tok" });
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("redirects to profile when requireNIN and user not NIN verified", () => {
    mockUseGetProfileQuery.mockReturnValue({
      data: { id: "1", nin_verified: false },
      isLoading: false,
      isError: false,
    });
    renderProtected({ isAuthenticated: true, accessToken: "tok" }, true);
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.getByText("Profile Page")).toBeInTheDocument();
  });

  it("allows NIN-verified user through when requireNIN is true", () => {
    mockUseGetProfileQuery.mockReturnValue({
      data: { id: "1", nin_verified: true },
      isLoading: false,
      isError: false,
    });
    renderProtected({ isAuthenticated: true, accessToken: "tok" }, true);
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("skips profile query when not authenticated", () => {
    renderProtected({ isAuthenticated: false, accessToken: null });
    expect(mockUseGetProfileQuery).toHaveBeenCalledWith(undefined, {
      skip: true,
    });
  });
});
