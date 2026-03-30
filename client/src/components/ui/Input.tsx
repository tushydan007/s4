import { forwardRef, type InputHTMLAttributes } from "react";
import { type FieldError } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError | string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", ...props }, ref) => {
    const errorMessage = typeof error === "string" ? error : error?.message;
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-navy-700">
          {label}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-navy-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-3 rounded-lg border transition-all duration-200 text-base
              focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500
              ${icon ? "pl-10" : ""}
              ${
                error
                  ? "border-danger-500 bg-danger-50 text-danger-700"
                  : "border-navy-200 bg-white text-navy-900 hover:border-navy-300"
              }
              ${className}
            `}
            {...props}
          />
        </div>
        <AnimatePresence>
          {errorMessage && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-sm text-danger-600"
            >
              {errorMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
