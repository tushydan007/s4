import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { HiShieldCheck, HiEnvelope, HiLockClosed } from "react-icons/hi2";

import {
  loginSchema,
  twoFactorSchema,
  type LoginFormData,
  type TwoFactorFormData,
} from "@/schemas/authSchemas";
import {
  useLoginMutation,
  useVerifyLoginOTPMutation,
} from "@/store/api/authApi";
import { useAuth } from "@/hooks/useAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { ApiError } from "@/types";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: setAuth, handleRequires2FA } = useAuth();
  const [loginApi, { isLoading: isLoginLoading }] = useLoginMutation();
  const [verify2FA, { isLoading: is2FALoading }] = useVerifyLoginOTPMutation();
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const twoFactorForm = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      const response = await loginApi(data).unwrap();

      if (response.requires_2fa && response.temp_token) {
        setTempToken(response.temp_token);
        setShow2FA(true);
        handleRequires2FA(response.temp_token);
        toast.success("A verification code has been sent to your email.");
      } else if (response.access && response.refresh && response.user) {
        setAuth({
          user: response.user,
          access: response.access,
          refresh: response.refresh,
        });
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (err) {
      const error = err as { data?: ApiError };
      toast.error(
        String(error.data?.error ?? error.data?.detail ?? "Login failed."),
      );
    }
  };

  const on2FASubmit = async (data: TwoFactorFormData) => {
    try {
      const response = await verify2FA({
        otp_code: data.otp_code,
        temp_token: tempToken,
      }).unwrap();

      setAuth({
        user: response.user,
        access: response.access,
        refresh: response.refresh,
      });
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      const error = err as { data?: ApiError };
      toast.error(String(error.data?.error ?? "Invalid verification code."));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 bg-linear-to-br from-navy-900 via-navy-800 to-navy-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="inline-flex p-3 bg-navy-700/50 rounded-2xl mb-4"
          >
            <HiShieldCheck className="w-10 h-10 text-emerald-400" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {show2FA ? "Two-Factor Authentication" : "Welcome Back"}
          </h1>
          <p className="text-navy-300 mt-2">
            {show2FA
              ? "Enter the 6-digit code sent to your email"
              : "Sign in to your S4 Security account"}
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-5 sm:p-8">
          {!show2FA ? (
            <form
              onSubmit={loginForm.handleSubmit(onLoginSubmit)}
              noValidate
              className="space-y-5"
            >
              <Input
                label="Email Address"
                type="email"
                icon={<HiEnvelope className="w-4 h-4" />}
                placeholder="john@example.com"
                error={loginForm.formState.errors.email}
                {...loginForm.register("email")}
              />

              <Input
                label="Password"
                type="password"
                icon={<HiLockClosed className="w-4 h-4" />}
                placeholder="••••••••"
                error={loginForm.formState.errors.password}
                {...loginForm.register("password")}
              />

              <Button
                type="submit"
                isLoading={isLoginLoading}
                className="w-full"
                size="lg"
              >
                Sign In
              </Button>
            </form>
          ) : (
            <form
              onSubmit={twoFactorForm.handleSubmit(on2FASubmit)}
              noValidate
              className="space-y-5"
            >
              <Input
                label="Verification Code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                error={twoFactorForm.formState.errors.otp_code}
                autoFocus
                className="text-center text-2xl tracking-[0.5em] font-mono"
                {...twoFactorForm.register("otp_code")}
              />

              <Button
                type="submit"
                isLoading={is2FALoading}
                className="w-full"
                size="lg"
              >
                Verify Code
              </Button>

              <button
                type="button"
                onClick={() => {
                  setShow2FA(false);
                  setTempToken("");
                }}
                className="w-full text-sm text-navy-500 hover:text-navy-700 transition-colors"
              >
                ← Back to login
              </button>
            </form>
          )}

          {!show2FA && (
            <p className="text-center text-sm text-navy-500 mt-6">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="text-navy-800 font-semibold hover:underline"
              >
                Create one
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
