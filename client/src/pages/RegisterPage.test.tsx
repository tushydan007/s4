import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils";

const mockRegister = vi.fn();
const mockPreVerifyNIN = vi.fn();
const mockNavigate = vi.fn();
const mockToast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({ default: mockToast }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/store/api/authApi", () => ({
  authApi: {
    reducerPath: "authApi",
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (action: unknown) =>
      next(action),
    endpoints: {},
  },
  useRegisterMutation: () => [mockRegister, { isLoading: false }],
  usePreVerifyNINMutation: () => [mockPreVerifyNIN, { isLoading: false }],
}));

import RegisterPage from "../pages/RegisterPage";

async function fillAndVerifyNIN(user: ReturnType<typeof userEvent.setup>) {
  mockPreVerifyNIN.mockReturnValue({
    unwrap: () => Promise.resolve({ message: "NIN verified" }),
  });
  await user.type(screen.getByPlaceholderText("John"), "John");
  await user.type(screen.getByPlaceholderText("Doe"), "Doe");
  await user.type(screen.getByPlaceholderText("12345678901"), "12345678901");
  await user.click(screen.getByText("Verify NIN"));
  await waitFor(() => expect(mockPreVerifyNIN).toHaveBeenCalled());
  await waitFor(() =>
    expect(screen.getByText("NIN Verified")).toBeInTheDocument(),
  );
}

async function fillAllFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByPlaceholderText("john@example.com"),
    "john@test.com",
  );
  await user.type(screen.getByPlaceholderText("johndoe"), "johndoe");
  await user.type(
    screen.getByPlaceholderText("+234 800 000 0000"),
    "+2348012345678",
  );
  const passwordFields = screen.getAllByPlaceholderText("••••••••");
  await user.type(passwordFields[0], "Password1!");
  await user.type(passwordFields[1], "Password1!");
}

async function clickSubmit(user: ReturnType<typeof userEvent.setup>) {
  const submitButtons = screen.getAllByText("Create Account");
  const submitBtn = submitButtons.find(
    (el) => el.tagName === "BUTTON" || el.closest("button"),
  );
  if (submitBtn) await user.click(submitBtn);
}

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders registration form with all fields", () => {
    renderWithProviders(<RegisterPage />);
    const headings = screen.getAllByText("Create Account");
    expect(headings.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByPlaceholderText("john@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("johndoe")).toBeInTheDocument();
  });

  it("shows link to login page", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByText(/Already have an account/i)).toBeInTheDocument();
  });

  it("renders NIN verification button", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByText("Verify NIN")).toBeInTheDocument();
  });

  it("shows field labels", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByText("Email Address")).toBeInTheDocument();
    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
    expect(screen.getByText("First Name")).toBeInTheDocument();
    expect(screen.getByText("Last Name")).toBeInTheDocument();
    expect(screen.getByText("Phone Number")).toBeInTheDocument();
    expect(
      screen.getByText("National Identity Number (NIN)"),
    ).toBeInTheDocument();
  });

  it("shows NIN verify prompt when NIN not verified", () => {
    renderWithProviders(<RegisterPage />);
    expect(
      screen.getByText(/Please verify your NIN above/),
    ).toBeInTheDocument();
  });

  it("verifies NIN and shows success", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    await fillAndVerifyNIN(user);
    expect(mockToast.success).toHaveBeenCalledWith(
      "NIN verified successfully!",
    );
  });

  it("handles NIN verification failure", async () => {
    const user = userEvent.setup();
    mockPreVerifyNIN.mockReturnValue({
      unwrap: () =>
        Promise.reject({ data: { error: "NIN verification failed" } }),
    });

    renderWithProviders(<RegisterPage />);
    await user.type(screen.getByPlaceholderText("John"), "John");
    await user.type(screen.getByPlaceholderText("Doe"), "Doe");
    await user.type(screen.getByPlaceholderText("12345678901"), "12345678901");
    await user.click(screen.getByText("Verify NIN"));

    await waitFor(() => expect(mockPreVerifyNIN).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByText("Retry NIN Verification")).toBeInTheDocument(),
    );
  });

  it("handles NIN failure with no error data", async () => {
    const user = userEvent.setup();
    mockPreVerifyNIN.mockReturnValue({
      unwrap: () => Promise.reject({}),
    });

    renderWithProviders(<RegisterPage />);
    await user.type(screen.getByPlaceholderText("John"), "John");
    await user.type(screen.getByPlaceholderText("Doe"), "Doe");
    await user.type(screen.getByPlaceholderText("12345678901"), "12345678901");
    await user.click(screen.getByText("Verify NIN"));

    await waitFor(() => expect(mockPreVerifyNIN).toHaveBeenCalled());
    // Falls back to default error message
    await waitFor(() =>
      expect(screen.getByText("Retry NIN Verification")).toBeInTheDocument(),
    );
  });

  it("submits form successfully and navigates to login", async () => {
    const user = userEvent.setup();
    mockRegister.mockReturnValue({
      unwrap: () => Promise.resolve({ message: "Registration successful" }),
    });

    renderWithProviders(<RegisterPage />);
    await fillAndVerifyNIN(user);
    await fillAllFields(user);
    await clickSubmit(user);

    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/login"));
    expect(mockToast.success).toHaveBeenCalledWith(
      "Registration successful! Please check your email to verify your account.",
    );
  });

  it("shows field-level errors from server", async () => {
    const user = userEvent.setup();
    mockRegister.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          data: { email: ["Email already exists"], username: "Username taken" },
        }),
    });

    renderWithProviders(<RegisterPage />);
    await fillAndVerifyNIN(user);
    await fillAllFields(user);
    await clickSubmit(user);

    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByText("Email already exists")).toBeInTheDocument(),
    );
  });

  it("shows toast error for server error/detail", async () => {
    const user = userEvent.setup();
    mockRegister.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          data: { error: "Server error occurred" },
        }),
    });

    renderWithProviders(<RegisterPage />);
    await fillAndVerifyNIN(user);
    await fillAllFields(user);
    await clickSubmit(user);

    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith("Server error occurred"),
    );
  });

  it("shows toast error for detail field", async () => {
    const user = userEvent.setup();
    mockRegister.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          data: { detail: "Rate limited" },
        }),
    });

    renderWithProviders(<RegisterPage />);
    await fillAndVerifyNIN(user);
    await fillAllFields(user);
    await clickSubmit(user);

    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith("Rate limited"),
    );
  });

  it("shows generic error when no data in response", async () => {
    const user = userEvent.setup();
    mockRegister.mockReturnValue({
      unwrap: () => Promise.reject({}),
    });

    renderWithProviders(<RegisterPage />);
    await fillAndVerifyNIN(user);
    await fillAllFields(user);
    await clickSubmit(user);

    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith(
        "Registration failed. Please try again.",
      ),
    );
  });
});
