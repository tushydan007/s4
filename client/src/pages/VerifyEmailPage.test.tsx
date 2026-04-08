import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const mockVerifyEmail = vi.fn();

vi.mock("@/store/api/authApi", () => ({
  authApi: {
    reducerPath: "authApi",
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (action: unknown) =>
      next(action),
    endpoints: {},
  },
  useVerifyEmailMutation: () => [mockVerifyEmail, { isLoading: false }],
}));

import VerifyEmailPage from "../pages/VerifyEmailPage";

function renderPage(token = "test-token") {
  return render(
    <MemoryRouter initialEntries={[`/verify-email/${token}`]}>
      <Routes>
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("shows success state when token is cached in sessionStorage", () => {
    sessionStorage.setItem(
      "email_verified_test-token",
      "Email verified successfully!",
    );

    renderPage("test-token");
    expect(screen.getByText("Email Verified!")).toBeInTheDocument();
    expect(
      screen.getByText("Email verified successfully!"),
    ).toBeInTheDocument();
    expect(screen.getByText("Continue to Login")).toBeInTheDocument();
  });

  it("calls verifyEmail on mount when not cached", () => {
    mockVerifyEmail.mockReturnValue({
      unwrap: () =>
        Promise.resolve({ message: "Email verified successfully!" }),
    });

    renderPage("abc-123");
    expect(mockVerifyEmail).toHaveBeenCalledWith("abc-123");
  });

  it("shows success after verification succeeds", async () => {
    mockVerifyEmail.mockReturnValue({
      unwrap: () =>
        Promise.resolve({ message: "Email verified successfully!" }),
    });

    renderPage("abc-123");
    expect(
      await screen.findByText("Email verified successfully!"),
    ).toBeInTheDocument();
    expect(screen.getByText("Email Verified!")).toBeInTheDocument();
  });

  it("shows error on verification failure", async () => {
    mockVerifyEmail.mockReturnValue({
      unwrap: () =>
        Promise.reject({ data: { error: "Token expired or invalid." } }),
    });

    renderPage("bad-token");
    expect(
      await screen.findByText("Token expired or invalid."),
    ).toBeInTheDocument();
    expect(screen.getByText("Verification Failed")).toBeInTheDocument();
    expect(screen.getByText("Go to Login")).toBeInTheDocument();
  });
});
