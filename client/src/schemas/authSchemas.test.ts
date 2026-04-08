import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  twoFactorSchema,
  resendVerificationSchema,
  ninVerifySchema,
} from "@/schemas/authSchemas";

describe("registerSchema", () => {
  const validData = {
    email: "test@example.com",
    username: "testuser",
    first_name: "John",
    last_name: "Doe",
    phone_number: "+2341234567890",
    nin: "12345678901",
    password: "Password1!",
    password_confirm: "Password1!",
  };

  it("accepts valid data", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({ ...validData, email: "bad" });
    expect(result.success).toBe(false);
  });

  it("rejects short username", () => {
    const result = registerSchema.safeParse({ ...validData, username: "ab" });
    expect(result.success).toBe(false);
  });

  it("rejects long username", () => {
    const result = registerSchema.safeParse({
      ...validData,
      username: "a".repeat(31),
    });
    expect(result.success).toBe(false);
  });

  it("rejects username with special characters", () => {
    const result = registerSchema.safeParse({
      ...validData,
      username: "user@name",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short first name", () => {
    const result = registerSchema.safeParse({ ...validData, first_name: "J" });
    expect(result.success).toBe(false);
  });

  it("rejects short last name", () => {
    const result = registerSchema.safeParse({ ...validData, last_name: "D" });
    expect(result.success).toBe(false);
  });

  it("rejects short phone number", () => {
    const result = registerSchema.safeParse({
      ...validData,
      phone_number: "123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid phone number format", () => {
    const result = registerSchema.safeParse({
      ...validData,
      phone_number: "abc1234567",
    });
    expect(result.success).toBe(false);
  });

  it("rejects NIN not exactly 11 digits", () => {
    const result = registerSchema.safeParse({
      ...validData,
      nin: "1234567890",
    });
    expect(result.success).toBe(false);
  });

  it("rejects NIN with non-digits", () => {
    const result = registerSchema.safeParse({
      ...validData,
      nin: "1234567890a",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "password1!",
      password_confirm: "password1!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without lowercase", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "PASSWORD1!",
      password_confirm: "PASSWORD1!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "Password!",
      password_confirm: "Password!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without special character", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "Password1",
      password_confirm: "Password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "Pa1!",
      password_confirm: "Pa1!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password_confirm: "Different1!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("password_confirm");
    }
  });
});

describe("loginSchema", () => {
  it("accepts valid data", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "notanemail",
      password: "anything",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("twoFactorSchema", () => {
  it("accepts valid 6-digit code", () => {
    const result = twoFactorSchema.safeParse({ otp_code: "123456" });
    expect(result.success).toBe(true);
  });

  it("rejects code that is not 6 digits", () => {
    const result = twoFactorSchema.safeParse({ otp_code: "12345" });
    expect(result.success).toBe(false);
  });

  it("rejects code with non-digits", () => {
    const result = twoFactorSchema.safeParse({ otp_code: "12345a" });
    expect(result.success).toBe(false);
  });

  it("rejects code longer than 6 digits", () => {
    const result = twoFactorSchema.safeParse({ otp_code: "1234567" });
    expect(result.success).toBe(false);
  });
});

describe("resendVerificationSchema", () => {
  it("accepts valid email", () => {
    const result = resendVerificationSchema.safeParse({
      email: "test@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = resendVerificationSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
  });
});

describe("ninVerifySchema", () => {
  it("accepts valid data", () => {
    const result = ninVerifySchema.safeParse({
      nin: "12345678901",
      first_name: "John",
      last_name: "Doe",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid NIN", () => {
    const result = ninVerifySchema.safeParse({
      nin: "123",
      first_name: "John",
      last_name: "Doe",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short first_name", () => {
    const result = ninVerifySchema.safeParse({
      nin: "12345678901",
      first_name: "J",
      last_name: "Doe",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short last_name", () => {
    const result = ninVerifySchema.safeParse({
      nin: "12345678901",
      first_name: "John",
      last_name: "D",
    });
    expect(result.success).toBe(false);
  });
});
