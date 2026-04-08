import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils";

const mockLoginApi = vi.fn();
const mockVerify2FA = vi.fn();
const mockNavigate = vi.fn();
const mockSetAuth = vi.fn();
const mockHandleRequires2FA = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    login: mockSetAuth,
    handleRequires2FA: mockHandleRequires2FA,
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}));

vi.mock("@/store/api/authApi", () => ({
  authApi: {
    reducerPath: "authApi",
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (action: unknown) =>
      next(action),
    endpoints: {},
  },
  useLoginMutation: () => [mockLoginApi, { isLoading: false }],
  useVerifyLoginOTPMutation: () => [mockVerify2FA, { isLoading: false }],
}));

import LoginPage from "../pages/LoginPage";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("john@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("shows link to register page", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText("Create one")).toBeInTheDocument();
  });

  it("submits login form and navigates on success", async () => {
    const user = userEvent.setup();
    mockLoginApi.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          access: "access-token",
          refresh: "refresh-token",
          user: { id: "1", email: "test@test.com" },
        }),
    });

    renderWithProviders(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("john@example.com"),
      "test@test.com",
    );
    await user.type(screen.getByPlaceholderText("••••••••"), "Password1!");
    await user.click(screen.getByText("Sign In"));

    await waitFor(() => {
      expect(mockLoginApi).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith({
        user: { id: "1", email: "test@test.com" },
        access: "access-token",
        refresh: "refresh-token",
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("shows 2FA form when login requires it", async () => {
    const user = userEvent.setup();
    mockLoginApi.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          requires_2fa: true,
          temp_token: "temp-token-123",
        }),
    });

    renderWithProviders(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("john@example.com"),
      "test@test.com",
    );
    await user.type(screen.getByPlaceholderText("••••••••"), "Password1!");
    await user.click(screen.getByText("Sign In"));

    expect(
      await screen.findByText("Two-Factor Authentication"),
    ).toBeInTheDocument();
    expect(screen.getByText("Verify Code")).toBeInTheDocument();
    expect(mockHandleRequires2FA).toHaveBeenCalledWith("temp-token-123");
  });

  it("handles login error", async () => {
    const user = userEvent.setup();
    mockLoginApi.mockReturnValue({
      unwrap: () => Promise.reject({ data: { error: "Invalid credentials" } }),
    });

    renderWithProviders(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("john@example.com"),
      "test@test.com",
    );
    await user.type(screen.getByPlaceholderText("••••••••"), "Password1!");
    await user.click(screen.getByText("Sign In"));

    await waitFor(() => {
      expect(mockLoginApi).toHaveBeenCalled();
    });
  });

  it("submits 2FA form and navigates on success", async () => {
    const user = userEvent.setup();

    mockLoginApi.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          requires_2fa: true,
          temp_token: "temp-token-123",
        }),
    });

    renderWithProviders(<LoginPage />);

    // First: trigger 2FA
    await user.type(
      screen.getByPlaceholderText("john@example.com"),
      "test@test.com",
    );
    await user.type(screen.getByPlaceholderText("••••••••"), "Password1!");
    await user.click(screen.getByText("Sign In"));

    await screen.findByText("Two-Factor Authentication");

    // Now submit 2FA
    mockVerify2FA.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          access: "new-access",
          refresh: "new-refresh",
          user: { id: "1" },
        }),
    });

    const otpInput = screen.getByPlaceholderText("000000");
    await user.type(otpInput, "123456");
    await user.click(screen.getByText("Verify Code"));

    await waitFor(() => {
      expect(mockVerify2FA).toHaveBeenCalledWith({
        otp_code: "123456",
        temp_token: "temp-token-123",
      });
    });
    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalled();
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("handles 2FA error", async () => {
    const user = userEvent.setup();

    mockLoginApi.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          requires_2fa: true,
          temp_token: "temp-token-123",
        }),
    });

    renderWithProviders(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("john@example.com"),
      "test@test.com",
    );
    await user.type(screen.getByPlaceholderText("••••••••"), "Password1!");
    await user.click(screen.getByText("Sign In"));

    await screen.findByText("Two-Factor Authentication");

    mockVerify2FA.mockReturnValue({
      unwrap: () => Promise.reject({ data: { error: "Invalid code" } }),
    });

    const otpInput = screen.getByPlaceholderText("000000");
    await user.type(otpInput, "999999");
    await user.click(screen.getByText("Verify Code"));

    await waitFor(() => {
      expect(mockVerify2FA).toHaveBeenCalled();
    });
  });

  it("can go back from 2FA to login form", async () => {
    const user = userEvent.setup();
    mockLoginApi.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          requires_2fa: true,
          temp_token: "temp-token-123",
        }),
    });

    renderWithProviders(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("john@example.com"),
      "test@test.com",
    );
    await user.type(screen.getByPlaceholderText("••••••••"), "Password1!");
    await user.click(screen.getByText("Sign In"));

    await screen.findByText("Two-Factor Authentication");

    await user.click(screen.getByText(/Back to login/i));
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
  });

  it("renders email and password labels", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText("Email Address")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
  });
});
