import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiCheckCircle, HiXCircle } from "react-icons/hi2";

import { useVerifyEmailMutation } from "@/store/api/authApi";
import Spinner from "@/components/ui/Spinner";

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [message, setMessage] = useState(
    token ? "" : "Invalid verification link.",
  );

  useEffect(() => {
    if (!token) return;

    verifyEmail(token)
      .unwrap()
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus("error");
        const errorData = err?.data as { error?: string } | undefined;
        setMessage(errorData?.error ?? "Email verification failed.");
      });
  }, [token, verifyEmail]);

  return (
    <div className="min-h-full flex items-center justify-center px-4 bg-linear-to-br from-navy-900 via-navy-800 to-navy-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-10">
          {status === "loading" || isLoading ? (
            <>
              <Spinner size="lg" className="mb-4" />
              <h2 className="text-xl font-bold text-navy-800">
                Verifying your email...
              </h2>
            </>
          ) : status === "success" ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
              >
                <HiCheckCircle className="w-16 h-16 mx-auto text-success-500 mb-4" />
              </motion.div>
              <h2 className="text-xl font-bold text-navy-800 mb-2">
                Email Verified!
              </h2>
              <p className="text-navy-600 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block px-6 py-3 bg-navy-800 text-white font-semibold rounded-lg hover:bg-navy-900 transition-colors"
              >
                Continue to Login
              </Link>
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
              >
                <HiXCircle className="w-16 h-16 mx-auto text-danger-500 mb-4" />
              </motion.div>
              <h2 className="text-xl font-bold text-navy-800 mb-2">
                Verification Failed
              </h2>
              <p className="text-navy-600 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block px-6 py-3 bg-navy-800 text-white font-semibold rounded-lg hover:bg-navy-900 transition-colors"
              >
                Go to Login
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
