import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiShieldCheck,
  HiArrowRightOnRectangle,
  HiUser,
  HiBars3,
} from "react-icons/hi2";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch } from "@/store";
import { toggleSidebar } from "@/store/slices/uiSlice";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-navy-900/95 backdrop-blur-md border-b border-navy-700/50">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo — always on the left */}
        <Link to="/" className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 10 }}
            className="p-1.5 bg-navy-700 rounded-lg"
          >
            <HiShieldCheck className="w-6 h-6 text-emerald-400" />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">S4</h1>
            <p className="text-[10px] text-navy-400 leading-none tracking-wider">
              SECURE · SWIFT · SMART · SAFE
            </p>
          </div>
        </Link>

        {/* Right side controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {isAuthenticated ? (
            <>
              {/* User name pill — desktop only */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${user?.nin_verified ? "bg-emerald-400" : "bg-warning-500"}`}
                />
                <span className="text-sm text-navy-200">
                  {user?.first_name} {user?.last_name}
                </span>
              </div>

              {/* Profile */}
              <button
                onClick={() => navigate("/profile")}
                className="p-2 rounded-lg text-navy-300 hover:text-white hover:bg-navy-800 transition-colors"
                title="Profile"
              >
                <HiUser className="w-5 h-5" />
              </button>

              {/* Logout — desktop only */}
              <button
                onClick={logout}
                className="hidden sm:flex p-2 rounded-lg text-navy-300 hover:text-danger-400 hover:bg-navy-800 transition-colors"
                title="Logout"
              >
                <HiArrowRightOnRectangle className="w-5 h-5" />
              </button>

              {/* Hamburger — mobile only, rightmost */}
              <button
                onClick={() => dispatch(toggleSidebar())}
                className="p-2 rounded-lg text-navy-300 hover:text-white hover:bg-navy-800 transition-colors sm:hidden"
                aria-label="Toggle menu"
              >
                <HiBars3 className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-sm font-medium text-navy-200 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
