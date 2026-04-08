import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { createTestStore } from "./test/utils";

// Mock the complex pages to avoid mapbox and other heavy deps
vi.mock("@/pages/DashboardPage", () => ({
  default: () => <div>Dashboard Page</div>,
}));
vi.mock("@/pages/HomePage", () => ({
  default: () => <div>Home Page</div>,
}));
vi.mock("@/pages/LoginPage", () => ({
  default: () => <div>Login Page</div>,
}));
vi.mock("@/pages/RegisterPage", () => ({
  default: () => <div>Register Page</div>,
}));
vi.mock("@/pages/ProfilePage", () => ({
  default: () => <div>Profile Page</div>,
}));
vi.mock("@/pages/VerifyEmailPage", () => ({
  default: () => <div>Verify Email Page</div>,
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}));

// Test App component directly
import App from "./App";

describe("App component", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});

// Test routing via Layout + MemoryRouter
import Layout from "./components/layout/Layout";
import { Routes, Route } from "react-router-dom";

describe("App routing", () => {
  function renderApp(route = "/") {
    const store = createTestStore();
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<div>Home Page</div>} />
              <Route path="login" element={<div>Login Page</div>} />
              <Route path="register" element={<div>Register Page</div>} />
              <Route path="dashboard" element={<div>Dashboard Page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>,
    );
  }

  it("renders home page at /", () => {
    renderApp("/");
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  it("renders login page at /login", () => {
    renderApp("/login");
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders register page at /register", () => {
    renderApp("/register");
    expect(screen.getByText("Register Page")).toBeInTheDocument();
  });

  it("renders dashboard page at /dashboard", () => {
    renderApp("/dashboard");
    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
  });
});

// Test the router export exists
describe("router export", () => {
  it("exports a router object", async () => {
    const mod = await import("./router");
    expect(mod.router).toBeDefined();
    expect(mod.router.routes).toBeDefined();
  });
});
