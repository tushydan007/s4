import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  User,
  LoginResponse,
  RegisterResponse,
  TwoFactorSetupResponse,
} from "@/types";
import type { RegisterFormData, LoginFormData } from "@/schemas/authSchemas";
import { baseQueryWithReauth } from "./baseQuery";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    register: builder.mutation<RegisterResponse, RegisterFormData>({
      query: (data) => ({
        url: "/users/register/",
        method: "POST",
        body: data,
      }),
    }),

    login: builder.mutation<LoginResponse, LoginFormData>({
      query: (data) => ({
        url: "/users/login/",
        method: "POST",
        body: data,
      }),
    }),

    verifyEmail: builder.mutation<{ message: string }, string>({
      query: (token) => ({
        url: `/users/verify-email/${token}/`,
        method: "GET",
      }),
    }),

    resendVerification: builder.mutation<
      { message: string },
      { email: string }
    >({
      query: (data) => ({
        url: "/users/resend-verification/",
        method: "POST",
        body: data,
      }),
    }),

    setupTwoFactor: builder.query<TwoFactorSetupResponse, void>({
      query: () => "/users/2fa/setup/",
    }),

    confirmTwoFactorSetup: builder.mutation<
      { message: string },
      { otp_code: string }
    >({
      query: (data) => ({
        url: "/users/2fa/setup/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    verifyTwoFactor: builder.mutation<
      { access: string; refresh: string; user: User },
      { otp_code: string; temp_token: string }
    >({
      query: (data) => ({
        url: "/users/2fa/verify/",
        method: "POST",
        body: data,
      }),
    }),

    verifyLoginOTP: builder.mutation<
      { access: string; refresh: string; user: User },
      { otp_code: string; temp_token: string }
    >({
      query: (data) => ({
        url: "/users/login/verify-otp/",
        method: "POST",
        body: data,
      }),
    }),

    disableTwoFactor: builder.mutation<
      { message: string },
      { otp_code: string }
    >({
      query: (data) => ({
        url: "/users/2fa/disable/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    verifyNIN: builder.mutation<
      { message: string; verified: boolean },
      { nin: string; first_name: string; last_name: string }
    >({
      query: (data) => ({
        url: "/users/nin/verify/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    getProfile: builder.query<User, void>({
      query: () => "/users/profile/",
      providesTags: ["User"],
    }),

    updateProfile: builder.mutation<User, Partial<User>>({
      query: (data) => ({
        url: "/users/profile/",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    logout: builder.mutation<{ message: string }, { refresh: string }>({
      query: (data) => ({
        url: "/users/logout/",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useLazySetupTwoFactorQuery,
  useConfirmTwoFactorSetupMutation,
  useVerifyTwoFactorMutation,
  useVerifyLoginOTPMutation,
  useDisableTwoFactorMutation,
  useVerifyNINMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useLogoutMutation,
} = authApi;
