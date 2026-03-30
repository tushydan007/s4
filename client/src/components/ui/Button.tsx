import { type ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd"
> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-navy-800 text-white hover:bg-navy-900 focus:ring-navy-500/30 shadow-lg shadow-navy-800/20",
    secondary:
      "bg-navy-100 text-navy-800 hover:bg-navy-200 focus:ring-navy-300/30",
    danger:
      "bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500/30",
    ghost:
      "bg-transparent text-navy-700 hover:bg-navy-50 focus:ring-navy-300/30",
    outline:
      "bg-transparent text-navy-700 border border-navy-300 hover:bg-navy-50 focus:ring-navy-300/30",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.01 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-semibold
        transition-colors duration-200 focus:outline-none focus:ring-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        icon
      )}
      {children}
    </motion.button>
  );
}
