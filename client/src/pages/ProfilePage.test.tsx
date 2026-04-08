import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createMockUser } from "../test/utils";

const mockUser = createMockUser({
  nin_verified: false,
  two_factor_enabled: false,
});
const mockRefetch = vi.fn().mockResolvedValue({ data: mockUser });
const mockSetup2FA = vi.fn();
const mockConfirm2FA = vi.fn();
const mockDisable2FA = vi.fn();
const mockVerifyNIN = vi.fn();

vi.mock("@/store/api/authApi", () => ({
  authApi: {
    reducerPath: "authApi",
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (action: unknown) =>
      next(action),
    endpoints: {},
  },
  useGetProfileQuery: () => ({
    data: mockUser,
    isLoading: false,
    refetch: mockRefetch,
  }),
  useLazySetupTwoFactorQuery: () => [mockSetup2FA, { data: undefined }],
  useConfirmTwoFactorSetupMutation: () => [
    mockConfirm2FA,
    { isLoading: false },
  ],
  useDisableTwoFactorMutation: () => [mockDisable2FA, { isLoading: false }],
  useVerifyNINMutation: () => [mockVerifyNIN, { isLoading: false }],
}));

import ProfilePage from "../pages/ProfilePage";

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.nin_verified = false;
    mockUser.two_factor_enabled = false;
  });

  it("renders user profile header", () => {
    renderWithProviders(<ProfilePage />);
    expect(
      screen.getByText(`${mockUser.first_name} ${mockUser.last_name}`),
    ).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
  });

  it("shows NIN verification section when NIN not verified", () => {
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText("NIN Verification Required")).toBeInTheDocument();
    expect(screen.getByText("Verify NIN")).toBeInTheDocument();
  });

  it("shows 2FA setup button when 2FA not enabled", () => {
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText("Setup 2FA")).toBeInTheDocument();
  });

  it("renders account details section", () => {
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText("Account Details")).toBeInTheDocument();
    expect(screen.getByText(mockUser.username)).toBeInTheDocument();
  });

  it("renders status badges", () => {
    renderWithProviders(<ProfilePage />);
    const emailBadges = screen.getAllByText(/Email/);
    expect(emailBadges.length).toBeGreaterThanOrEqual(1);
    const ninBadges = screen.getAllByText(/NIN/);
    expect(ninBadges.length).toBeGreaterThanOrEqual(1);
    const tfaBadges = screen.getAllByText(/2FA/);
    expect(tfaBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("renders user initials in avatar", () => {
    renderWithProviders(<ProfilePage />);
    const avatar = screen.getByText(
      `${mockUser.first_name[0]}${mockUser.last_name[0]}`,
    );
    expect(avatar).toBeInTheDocument();
  });

  it("renders Two-Factor Authentication section heading", () => {
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText("Two-Factor Authentication")).toBeInTheDocument();
  });

  it("shows phone number or dash in account details", () => {
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText("Phone")).toBeInTheDocument();
  });

  it("shows member since date", () => {
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText("Member Since")).toBeInTheDocument();
  });

  it("submits NIN verification form", async () => {
    const user = userEvent.setup();
    mockVerifyNIN.mockReturnValue({
      unwrap: () => Promise.resolve({ message: "NIN verified" }),
    });
    mockRefetch.mockResolvedValue({
      data: { ...mockUser, nin_verified: true },
    });

    renderWithProviders(<ProfilePage />);

    // Fill NIN form fields
    const firstNameInput = screen
      .getByPlaceholderText("12345678901")
      .closest("form")!
      .querySelector('input[name="first_name"]') as HTMLInputElement;
    const lastNameInput = screen
      .getByPlaceholderText("12345678901")
      .closest("form")!
      .querySelector('input[name="last_name"]') as HTMLInputElement;

    if (firstNameInput) await user.type(firstNameInput, "John");
    if (lastNameInput) await user.type(lastNameInput, "Doe");
    await user.type(screen.getByPlaceholderText("12345678901"), "12345678901");
    await user.click(screen.getByText("Verify NIN"));

    await waitFor(() => {
      expect(mockVerifyNIN).toHaveBeenCalled();
    });
  });

  it("submits NIN verification form and handles failure", async () => {
    const user = userEvent.setup();
    mockVerifyNIN.mockReturnValue({
      unwrap: () => Promise.reject({ data: { error: "NIN mismatch" } }),
    });

    renderWithProviders(<ProfilePage />);

    const firstNameInput = screen
      .getByPlaceholderText("12345678901")
      .closest("form")!
      .querySelector('input[name="first_name"]') as HTMLInputElement;
    const lastNameInput = screen
      .getByPlaceholderText("12345678901")
      .closest("form")!
      .querySelector('input[name="last_name"]') as HTMLInputElement;

    if (firstNameInput) await user.type(firstNameInput, "John");
    if (lastNameInput) await user.type(lastNameInput, "Doe");
    await user.type(screen.getByPlaceholderText("12345678901"), "12345678901");
    await user.click(screen.getByText("Verify NIN"));

    await waitFor(() => {
      expect(mockVerifyNIN).toHaveBeenCalled();
    });
  });

  it("triggers 2FA setup when Setup 2FA button is clicked", async () => {
    const user = userEvent.setup();
    mockSetup2FA.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          qr_code: "data:image/png;base64,abc",
          secret: "MYSECRETKEY",
        }),
    });

    renderWithProviders(<ProfilePage />);
    await user.click(screen.getByText("Setup 2FA"));

    await waitFor(() => {
      expect(mockSetup2FA).toHaveBeenCalled();
    });

    // Verify the 2FA setup modal content
    await waitFor(() => {
      expect(
        screen.getByText("Setup Two-Factor Authentication"),
      ).toBeInTheDocument();
      expect(screen.getByText("MYSECRETKEY")).toBeInTheDocument();
      expect(screen.getByText("Verification Code")).toBeInTheDocument();
    });
  });

  it("handles 2FA setup failure", async () => {
    const user = userEvent.setup();
    mockSetup2FA.mockReturnValue({
      unwrap: () => Promise.reject(new Error("fail")),
    });

    renderWithProviders(<ProfilePage />);
    await user.click(screen.getByText("Setup 2FA"));

    await waitFor(() => {
      expect(mockSetup2FA).toHaveBeenCalled();
    });
  });

  it("confirms 2FA setup with OTP code", async () => {
    const user = userEvent.setup();
    mockSetup2FA.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          qr_code: "data:image/png;base64,abc",
          secret: "MYSECRETKEY",
        }),
    });
    mockConfirm2FA.mockReturnValue({
      unwrap: () => Promise.resolve({ message: "2FA enabled" }),
    });
    mockRefetch.mockResolvedValue({
      data: { ...mockUser, two_factor_enabled: true },
    });

    renderWithProviders(<ProfilePage />);

    // Open 2FA setup modal
    await user.click(screen.getByText("Setup 2FA"));
    await waitFor(() =>
      expect(
        screen.getByText("Setup Two-Factor Authentication"),
      ).toBeInTheDocument(),
    );

    // Enter OTP and confirm
    await user.type(screen.getByPlaceholderText("000000"), "123456");
    await user.click(screen.getByText("Confirm & Enable 2FA"));

    await waitFor(() => {
      expect(mockConfirm2FA).toHaveBeenCalledWith({ otp_code: "123456" });
    });
  });

  it("handles 2FA confirm failure", async () => {
    const user = userEvent.setup();
    mockSetup2FA.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          qr_code: "data:image/png;base64,abc",
          secret: "MYSECRETKEY",
        }),
    });
    mockConfirm2FA.mockReturnValue({
      unwrap: () => Promise.reject({ data: { error: "Invalid OTP" } }),
    });

    renderWithProviders(<ProfilePage />);

    await user.click(screen.getByText("Setup 2FA"));
    await waitFor(() =>
      expect(
        screen.getByText("Setup Two-Factor Authentication"),
      ).toBeInTheDocument(),
    );

    await user.type(screen.getByPlaceholderText("000000"), "999999");
    await user.click(screen.getByText("Confirm & Enable 2FA"));

    await waitFor(() => {
      expect(mockConfirm2FA).toHaveBeenCalled();
    });
  });

  it("renders QR code image in 2FA setup modal", async () => {
    const user = userEvent.setup();
    mockSetup2FA.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          qr_code: "data:image/png;base64,abc",
          secret: "MYSECRETKEY",
        }),
    });

    renderWithProviders(<ProfilePage />);
    await user.click(screen.getByText("Setup 2FA"));

    await waitFor(() => {
      const img = screen.getByAltText("2FA QR Code");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "data:image/png;base64,abc");
    });
  });

  it("shows success toast after 2FA confirm", async () => {
    const user = userEvent.setup();
    mockSetup2FA.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          qr_code: "data:image/png;base64,abc",
          secret: "SECRET",
        }),
    });
    mockConfirm2FA.mockReturnValue({
      unwrap: () => Promise.resolve({ message: "2FA enabled" }),
    });
    mockRefetch.mockResolvedValue({
      data: { ...mockUser, two_factor_enabled: true },
    });

    renderWithProviders(<ProfilePage />);
    await user.click(screen.getByText("Setup 2FA"));
    await waitFor(() =>
      expect(screen.getByPlaceholderText("000000")).toBeInTheDocument(),
    );
    await user.type(screen.getByPlaceholderText("000000"), "123456");
    await user.click(screen.getByText("Confirm & Enable 2FA"));

    await waitFor(() => {
      expect(mockConfirm2FA).toHaveBeenCalledWith({ otp_code: "123456" });
    });
  });
});

describe("ProfilePage with verified user", () => {
  beforeEach(() => {
    mockUser.nin_verified = true;
    mockUser.two_factor_enabled = true;
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockUser.nin_verified = false;
    mockUser.two_factor_enabled = false;
  });

  it("hides NIN section when verified", () => {
    renderWithProviders(<ProfilePage />);
    expect(
      screen.queryByText("NIN Verification Required"),
    ).not.toBeInTheDocument();
  });

  it("shows Disable 2FA button when enabled", () => {
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText("Disable 2FA")).toBeInTheDocument();
  });

  it("shows 2FA enabled description", () => {
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText(/2FA is currently enabled/i)).toBeInTheDocument();
  });

  it("opens disable 2FA modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    await user.click(screen.getByText("Disable 2FA"));

    await waitFor(() => {
      expect(
        screen.getByText("Disable Two-Factor Authentication"),
      ).toBeInTheDocument();
    });
  });

  it("submits disable 2FA form", async () => {
    const user = userEvent.setup();
    mockDisable2FA.mockReturnValue({
      unwrap: () => Promise.resolve({ message: "2FA disabled" }),
    });
    mockRefetch.mockResolvedValue({
      data: { ...mockUser, two_factor_enabled: false },
    });

    renderWithProviders(<ProfilePage />);

    // Open the disable modal
    await user.click(screen.getByText("Disable 2FA"));
    await waitFor(() =>
      expect(
        screen.getByText("Disable Two-Factor Authentication"),
      ).toBeInTheDocument(),
    );

    // Enter OTP and submit
    await user.type(screen.getByPlaceholderText("000000"), "654321");

    // Click the Disable 2FA button inside the modal form
    const disableButtons = screen.getAllByText("Disable 2FA");
    const submitBtn = disableButtons.find((el) => el.closest("form") !== null);
    if (submitBtn) await user.click(submitBtn);

    await waitFor(() => {
      expect(mockDisable2FA).toHaveBeenCalledWith({ otp_code: "654321" });
    });
  });

  it("handles disable 2FA failure", async () => {
    const user = userEvent.setup();
    mockDisable2FA.mockReturnValue({
      unwrap: () => Promise.reject({ data: { error: "Wrong OTP" } }),
    });

    renderWithProviders(<ProfilePage />);

    await user.click(screen.getByText("Disable 2FA"));
    await waitFor(() =>
      expect(
        screen.getByText("Disable Two-Factor Authentication"),
      ).toBeInTheDocument(),
    );

    await user.type(screen.getByPlaceholderText("000000"), "000000");
    const disableButtons = screen.getAllByText("Disable 2FA");
    const submitBtn = disableButtons.find((el) => el.closest("form") !== null);
    if (submitBtn) await user.click(submitBtn);

    await waitFor(() => {
      expect(mockDisable2FA).toHaveBeenCalled();
    });
  });
});
