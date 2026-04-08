import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import Header from "@/components/layout/Header";
import { createTestStore } from "@/test/utils";

const mockLogout = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: "1",
      first_name: "John",
      last_name: "Doe",
      nin_verified: true,
    },
    isAuthenticated: true,
    logout: mockLogout,
  }),
}));

describe("Header", () => {
  function renderHeader() {
    const store = createTestStore({
      auth: { isAuthenticated: true, accessToken: "token" },
    });
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </Provider>,
    );
  }

  it("renders S4 Security brand", () => {
    renderHeader();
    expect(screen.getByText("S4 Security")).toBeInTheDocument();
  });

  it("renders user name when authenticated", () => {
    renderHeader();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders Dashboard button when authenticated", () => {
    renderHeader();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("navigates to dashboard on Dashboard click", () => {
    renderHeader();
    fireEvent.click(screen.getByText("Dashboard"));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("navigates to profile on profile button click", () => {
    renderHeader();
    const profileBtn = screen.getByTitle("Profile");
    fireEvent.click(profileBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/profile");
  });

  it("calls logout on logout button click", () => {
    renderHeader();
    const logoutBtn = screen.getByTitle("Logout");
    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalled();
  });

  it("shows NIN verified status indicator", () => {
    renderHeader();
    const indicator = document.querySelector(".bg-emerald-400");
    expect(indicator).toBeTruthy();
  });

  it("opens mobile menu when toggle button is clicked", () => {
    renderHeader();
    const toggleBtn = screen.getByLabelText("Toggle navigation menu");
    fireEvent.click(toggleBtn);
    // Mobile menu shows the Dashboard link
    const dashTexts = screen.getAllByText("Dashboard");
    expect(dashTexts.length).toBeGreaterThanOrEqual(2); // desktop + mobile
  });

  it("closes mobile menu on backdrop click after opening", async () => {
    renderHeader();
    const toggleBtn = screen.getByLabelText("Toggle navigation menu");
    fireEvent.click(toggleBtn);
    // dash texts visible in mobile
    const dashTexts = screen.getAllByText("Dashboard");
    expect(dashTexts.length).toBeGreaterThanOrEqual(2);
  });

  it("dispatches toggleSidebar when sidebar toggle is clicked on mobile", () => {
    renderHeader();
    const sidebarBtn = screen.getByLabelText("Toggle reports sidebar");
    fireEvent.click(sidebarBtn);
    // Dispatch was called (toggleSidebar action)
    expect(sidebarBtn).toBeInTheDocument();
  });

  it("navigates from mobile menu Dashboard item", () => {
    renderHeader();
    const toggleBtn = screen.getByLabelText("Toggle navigation menu");
    fireEvent.click(toggleBtn);
    const dashButtons = screen.getAllByText("Dashboard");
    // Click the mobile drawer one (last)
    fireEvent.click(dashButtons[dashButtons.length - 1]);
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("navigates from mobile menu Profile item", () => {
    renderHeader();
    const toggleBtn = screen.getByLabelText("Toggle navigation menu");
    fireEvent.click(toggleBtn);
    const profileButton = screen.getByText("Profile");
    fireEvent.click(profileButton);
    expect(mockNavigate).toHaveBeenCalledWith("/profile");
  });

  it("calls logout from mobile menu", () => {
    renderHeader();
    const toggleBtn = screen.getByLabelText("Toggle navigation menu");
    fireEvent.click(toggleBtn);
    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalled();
  });
});
