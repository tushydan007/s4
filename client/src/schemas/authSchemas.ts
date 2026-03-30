import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    first_name: z.string().min(2, "First name must be at least 2 characters"),
    last_name: z.string().min(2, "Last name must be at least 2 characters"),
    phone_number: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .regex(/^\+?[0-9\s-]+$/, "Please enter a valid phone number"),
    nin: z
      .string()
      .length(11, "NIN must be exactly 11 digits")
      .regex(/^\d{11}$/, "NIN must contain only digits"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character",
      ),
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const twoFactorSchema = z.object({
  otp_code: z
    .string()
    .length(6, "OTP code must be 6 digits")
    .regex(/^\d{6}$/, "OTP code must contain only digits"),
});

export type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

export const resendVerificationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ResendVerificationFormData = z.infer<
  typeof resendVerificationSchema
>;

export const ninVerifySchema = z.object({
  nin: z
    .string()
    .length(11, "NIN must be exactly 11 digits")
    .regex(/^\d{11}$/, "NIN must contain only digits"),
  first_name: z.string().min(2, "First name is required"),
  last_name: z.string().min(2, "Last name is required"),
});

export type NINVerifyFormData = z.infer<typeof ninVerifySchema>;
