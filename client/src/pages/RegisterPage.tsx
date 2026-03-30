import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiShieldCheck,
  HiEnvelope,
  HiLockClosed,
  HiUser,
  HiPhone,
  HiIdentification,
} from "react-icons/hi2";

import { registerSchema, type RegisterFormData } from "@/schemas/authSchemas";
import { useRegisterMutation } from "@/store/api/authApi";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { ApiError } from "@/types";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register(data).unwrap();
      toast.success(
        "Registration successful! Please check your email to verify your account.",
      );
      navigate("/login");
    } catch (err) {
      const error = err as { data?: ApiError };
      const errorData = error.data;
      if (errorData) {
        const fieldNames: (keyof RegisterFormData)[] = [
          "email",
          "username",
          "first_name",
          "last_name",
          "phone_number",
          "nin",
          "password",
          "password_confirm",
        ];
        Object.entries(errorData).forEach(([key, value]) => {
          if (fieldNames.includes(key as keyof RegisterFormData)) {
            const msg = Array.isArray(value)
              ? (value[0] as string)
              : String(value);
            setError(key as keyof RegisterFormData, { message: msg });
          }
        });
        if (errorData.error || errorData.detail) {
          toast.error(String(errorData.error ?? errorData.detail));
        }
      } else {
        toast.error("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-8 sm:py-12 bg-linear-to-br from-navy-900 via-navy-800 to-navy-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
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
            Create Account
          </h1>
          <p className="text-navy-300 mt-2">
            Join S4 Security to help protect your community
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-5 sm:p-8">
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                icon={<HiUser className="w-4 h-4" />}
                placeholder="John"
                error={errors.first_name}
                {...registerField("first_name")}
              />
              <Input
                label="Last Name"
                icon={<HiUser className="w-4 h-4" />}
                placeholder="Doe"
                error={errors.last_name}
                {...registerField("last_name")}
              />
            </div>

            <Input
              label="Username"
              icon={<HiUser className="w-4 h-4" />}
              placeholder="johndoe"
              error={errors.username}
              {...registerField("username")}
            />

            <Input
              label="Email Address"
              type="email"
              icon={<HiEnvelope className="w-4 h-4" />}
              placeholder="john@example.com"
              error={errors.email}
              {...registerField("email")}
            />

            <Input
              label="Phone Number"
              type="tel"
              icon={<HiPhone className="w-4 h-4" />}
              placeholder="+234 800 000 0000"
              error={errors.phone_number}
              {...registerField("phone_number")}
            />

            <Input
              label="National Identity Number (NIN)"
              icon={<HiIdentification className="w-4 h-4" />}
              placeholder="12345678901"
              maxLength={11}
              error={errors.nin}
              {...registerField("nin")}
            />

            <Input
              label="Password"
              type="password"
              icon={<HiLockClosed className="w-4 h-4" />}
              placeholder="••••••••"
              error={errors.password}
              {...registerField("password")}
            />

            <Input
              label="Confirm Password"
              type="password"
              icon={<HiLockClosed className="w-4 h-4" />}
              placeholder="••••••••"
              error={errors.password_confirm}
              {...registerField("password_confirm")}
            />

            <div className="bg-navy-50 rounded-lg p-3 text-sm text-navy-600">
              <p className="font-medium text-navy-700 mb-1">
                Password Requirements:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>At least 8 characters</li>
                <li>One uppercase and one lowercase letter</li>
                <li>One number and one special character</li>
              </ul>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              size="lg"
            >
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-navy-500 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-navy-800 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
