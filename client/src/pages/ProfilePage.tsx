import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiShieldCheck,
  HiCheckBadge,
  HiExclamationTriangle,
  HiIdentification,
  HiQrCode,
} from "react-icons/hi2";

import {
  useGetProfileQuery,
  useLazySetupTwoFactorQuery,
  useConfirmTwoFactorSetupMutation,
  useDisableTwoFactorMutation,
  useVerifyNINMutation,
} from "@/store/api/authApi";
import { useAppDispatch } from "@/store";
import { setUser } from "@/store/slices/authSlice";
import {
  ninVerifySchema,
  twoFactorSchema,
  type NINVerifyFormData,
  type TwoFactorFormData,
} from "@/schemas/authSchemas";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import type { ApiError } from "@/types";

export default function ProfilePage() {
  const { data: user, isLoading, refetch } = useGetProfileQuery();
  const dispatch = useAppDispatch();

  // NIN verification
  const [verifyNIN, { isLoading: isNINLoading }] = useVerifyNINMutation();
  const ninForm = useForm<NINVerifyFormData>({
    resolver: zodResolver(ninVerifySchema),
    defaultValues: {
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
    },
  });

  // 2FA setup
  const [trigger2FASetup] = useLazySetupTwoFactorQuery();
  const [confirm2FA, { isLoading: is2FAConfirmLoading }] =
    useConfirmTwoFactorSetupMutation();
  const [disable2FA, { isLoading: is2FADisableLoading }] =
    useDisableTwoFactorMutation();
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret2FA, setSecret2FA] = useState("");

  const setup2FAForm = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
  });
  const disable2FAForm = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
  });

  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);

  const handleNINVerify = async (data: NINVerifyFormData) => {
    try {
      await verifyNIN(data).unwrap();
      toast.success("NIN verified successfully!");
      const { data: updatedUser } = await refetch();
      if (updatedUser) dispatch(setUser(updatedUser));
    } catch (err) {
      const error = err as { data?: ApiError };
      toast.error(String(error.data?.error ?? "NIN verification failed."));
    }
  };

  const handle2FASetup = async () => {
    try {
      const result = await trigger2FASetup().unwrap();
      setQrCode(result.qr_code);
      setSecret2FA(result.secret);
      setShow2FAModal(true);
    } catch {
      toast.error("Failed to generate 2FA setup.");
    }
  };

  const handleConfirm2FA = async (data: TwoFactorFormData) => {
    try {
      await confirm2FA({ otp_code: data.otp_code }).unwrap();
      toast.success("2FA enabled successfully!");
      setShow2FAModal(false);
      setup2FAForm.reset();
      const { data: updatedUser } = await refetch();
      if (updatedUser) dispatch(setUser(updatedUser));
    } catch (err) {
      const error = err as { data?: ApiError };
      toast.error(String(error.data?.error ?? "Invalid OTP code."));
    }
  };

  const handleDisable2FA = async (data: TwoFactorFormData) => {
    try {
      await disable2FA({ otp_code: data.otp_code }).unwrap();
      toast.success("2FA disabled.");
      setShowDisable2FAModal(false);
      disable2FAForm.reset();
      const { data: updatedUser } = await refetch();
      if (updatedUser) dispatch(setUser(updatedUser));
    } catch (err) {
      const error = err as { data?: ApiError };
      toast.error(String(error.data?.error ?? "Invalid OTP code."));
    }
  };

  if (isLoading) return <Spinner size="lg" className="mt-20" />;
  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden">
          <div className="bg-linear-to-r from-navy-800 to-navy-900 px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-navy-700 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-white shrink-0">
                {user.first_name[0]}
                {user.last_name[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {user.first_name} {user.last_name}
                </h1>
                <p className="text-navy-300">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 flex flex-wrap gap-3">
            <StatusBadge verified={user.email_verified} label="Email" />
            <StatusBadge verified={user.nin_verified} label="NIN" />
            <StatusBadge verified={user.two_factor_enabled} label="2FA" />
          </div>
        </div>

        {/* NIN Verification */}
        {!user.nin_verified && (
          <div className="bg-white rounded-2xl shadow-sm border border-warning-500/30 p-6">
            <div className="flex items-start gap-3 mb-4">
              <HiExclamationTriangle className="w-6 h-6 text-warning-500 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-navy-800">
                  NIN Verification Required
                </h2>
                <p className="text-sm text-navy-500 mt-1">
                  Verify your National Identity Number to access all features
                  including posting security reports.
                </p>
              </div>
            </div>

            <form
              onSubmit={ninForm.handleSubmit(handleNINVerify)}
              noValidate
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  error={ninForm.formState.errors.first_name}
                  {...ninForm.register("first_name")}
                />
                <Input
                  label="Last Name"
                  error={ninForm.formState.errors.last_name}
                  {...ninForm.register("last_name")}
                />
              </div>
              <Input
                label="NIN (11 digits)"
                icon={<HiIdentification className="w-4 h-4" />}
                placeholder="12345678901"
                maxLength={11}
                error={ninForm.formState.errors.nin}
                {...ninForm.register("nin")}
              />
              <Button
                type="submit"
                isLoading={isNINLoading}
                icon={<HiShieldCheck className="w-4 h-4" />}
              >
                Verify NIN
              </Button>
            </form>
          </div>
        )}

        {/* 2FA Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-navy-100 p-6">
          <div className="flex items-start gap-3 mb-4">
            <HiQrCode className="w-6 h-6 text-navy-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-navy-800">
                Two-Factor Authentication
              </h2>
              <p className="text-sm text-navy-500 mt-1">
                {user.two_factor_enabled
                  ? "2FA is currently enabled. Your account is secured with an authenticator app."
                  : "Add an extra layer of security to your account by enabling 2FA."}
              </p>
            </div>
          </div>

          {user.two_factor_enabled ? (
            <Button
              variant="danger"
              onClick={() => setShowDisable2FAModal(true)}
              size="sm"
            >
              Disable 2FA
            </Button>
          ) : (
            <Button
              onClick={handle2FASetup}
              icon={<HiQrCode className="w-4 h-4" />}
            >
              Setup 2FA
            </Button>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-navy-100 p-6">
          <h2 className="text-lg font-bold text-navy-800 mb-4">
            Account Details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-navy-400">Username</dt>
              <dd className="text-navy-800 font-medium">{user.username}</dd>
            </div>
            <div>
              <dt className="text-navy-400">Phone</dt>
              <dd className="text-navy-800 font-medium">
                {user.phone_number || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-navy-400">Member Since</dt>
              <dd className="text-navy-800 font-medium">
                {new Date(user.date_joined).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </motion.div>

      {/* 2FA Setup Modal */}
      <Modal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        title="Setup Two-Factor Authentication"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-navy-600">
            Scan this QR code with your authenticator app (Google Authenticator,
            Authy, etc.) then enter the 6-digit code to confirm.
          </p>

          {qrCode && (
            <div className="flex justify-center py-4">
              <img
                src={qrCode}
                alt="2FA QR Code"
                className="w-48 h-48 rounded-lg"
              />
            </div>
          )}

          <div className="bg-navy-50 rounded-lg p-3">
            <p className="text-xs text-navy-500 mb-1">
              Can&apos;t scan? Enter this key manually:
            </p>
            <code className="text-sm font-mono text-navy-800 break-all">
              {secret2FA}
            </code>
          </div>

          <form
            onSubmit={setup2FAForm.handleSubmit(handleConfirm2FA)}
            noValidate
            className="space-y-4"
          >
            <Input
              label="Verification Code"
              placeholder="000000"
              maxLength={6}
              className="text-center text-xl tracking-[0.5em] font-mono"
              error={setup2FAForm.formState.errors.otp_code}
              {...setup2FAForm.register("otp_code")}
            />
            <Button
              type="submit"
              isLoading={is2FAConfirmLoading}
              className="w-full"
            >
              Confirm &amp; Enable 2FA
            </Button>
          </form>
        </div>
      </Modal>

      {/* Disable 2FA Modal */}
      <Modal
        isOpen={showDisable2FAModal}
        onClose={() => setShowDisable2FAModal(false)}
        title="Disable Two-Factor Authentication"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-navy-600">
            Enter your current authenticator code to disable 2FA.
          </p>
          <form
            onSubmit={disable2FAForm.handleSubmit(handleDisable2FA)}
            noValidate
            className="space-y-4"
          >
            <Input
              label="Authentication Code"
              placeholder="000000"
              maxLength={6}
              className="text-center text-xl tracking-[0.5em] font-mono"
              error={disable2FAForm.formState.errors.otp_code}
              {...disable2FAForm.register("otp_code")}
            />
            <Button
              type="submit"
              variant="danger"
              isLoading={is2FADisableLoading}
              className="w-full"
            >
              Disable 2FA
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
}

function StatusBadge({
  verified,
  label,
}: {
  verified: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
        verified
          ? "bg-success-50 text-success-600"
          : "bg-warning-50 text-warning-600"
      }`}
    >
      {verified ? (
        <HiCheckBadge className="w-3.5 h-3.5" />
      ) : (
        <HiExclamationTriangle className="w-3.5 h-3.5" />
      )}
      {label} {verified ? "Verified" : "Pending"}
    </span>
  );
}
