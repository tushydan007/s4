import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiArrowRightOnRectangle,
  HiUser,
  HiBars3,
  HiXMark,
  HiViewColumns,
  HiMapPin,
} from "react-icons/hi2";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch } from "@/store";
import { toggleSidebar } from "@/store/slices/uiSlice";
import S4Logo from "@/components/ui/S4Logo";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-navy-900/95 backdrop-blur-md border-b border-navy-700/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            onClick={closeMobileMenu}
          >
            <motion.div
              whileHover={{ scale: 1.08 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <S4Logo className="w-9 h-9" />
            </motion.div>
            <div className="leading-none">
              <span className="text-base font-black text-white tracking-tight">
                S4 Security
              </span>
              <p className="text-[9px] text-navy-400 tracking-[0.15em] uppercase mt-0.5 hidden sm:block">
                See · Something · Say · Something
              </p>
            </div>
          </Link>

          {/* Desktop right side */}
          <div className="hidden sm:flex items-center gap-1">
            {isAuthenticated ? (
              <>
                {/* User pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800 mr-1">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${user?.nin_verified ? "bg-emerald-400" : "bg-amber-400"}`}
                  />
                  <span className="text-sm text-navy-200 max-w-35 truncate">
                    {user?.first_name} {user?.last_name}
                  </span>
                </div>

                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-navy-300 hover:text-white hover:bg-navy-800 transition-colors"
                  title="Dashboard"
                >
                  <HiViewColumns className="w-4 h-4" />
                  Dashboard
                </button>

                <button
                  onClick={() => navigate("/profile")}
                  className="p-2 rounded-lg text-navy-300 hover:text-white hover:bg-navy-800 transition-colors"
                  title="Profile"
                >
                  <HiUser className="w-5 h-5" />
                </button>

                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-navy-300 hover:text-danger-400 hover:bg-navy-800 transition-colors"
                  title="Logout"
                >
                  <HiArrowRightOnRectangle className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-emerald-400 hover:text-emerald-300 hover:bg-navy-800 transition-colors"
                  title="Live Map"
                >
                  <HiMapPin className="w-4 h-4" />
                  Live Map
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-1.5 text-sm font-medium text-navy-200 hover:text-white transition-colors rounded-lg hover:bg-navy-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile right: sidebar toggle (authenticated) or hamburger (unauthenticated) */}
          <div className="flex sm:hidden items-center gap-1">
            {isAuthenticated && (
              <button
                onClick={() => dispatch(toggleSidebar())}
                className="p-2 rounded-lg text-navy-300 hover:text-white hover:bg-navy-800 transition-colors"
                aria-label="Toggle reports sidebar"
              >
                <HiBars3 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-2 rounded-lg text-navy-300 hover:text-white hover:bg-navy-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <HiXMark className="w-5 h-5" />
              ) : (
                <HiBars3 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-navy-950/60 sm:hidden"
              onClick={closeMobileMenu}
            />
            <motion.nav
              key="drawer"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="fixed top-14 left-0 right-0 z-30 bg-navy-900 border-b border-navy-700/60 shadow-xl sm:hidden"
            >
              <div className="px-6 py-4 space-y-1">
                {isAuthenticated ? (
                  <>
                    {/* User info */}
                    <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-navy-800">
                      <div className="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {user?.first_name?.[0]}
                        {user?.last_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-navy-400 truncate">
                          {user?.email}
                        </p>
                      </div>
                      <span
                        className={`ml-auto w-2.5 h-2.5 rounded-full shrink-0 ${user?.nin_verified ? "bg-emerald-400" : "bg-amber-400"}`}
                      />
                    </div>

                    <MobileNavItem
                      icon={<HiViewColumns className="w-5 h-5" />}
                      label="Dashboard"
                      onClick={() => {
                        navigate("/dashboard");
                        closeMobileMenu();
                      }}
                    />
                    <MobileNavItem
                      icon={<HiUser className="w-5 h-5" />}
                      label="Profile"
                      onClick={() => {
                        navigate("/profile");
                        closeMobileMenu();
                      }}
                    />
                    <div className="border-t border-navy-700/50 pt-2 mt-2">
                      <MobileNavItem
                        icon={<HiArrowRightOnRectangle className="w-5 h-5" />}
                        label="Logout"
                        onClick={() => {
                          logout();
                          closeMobileMenu();
                        }}
                        danger
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-navy-800 transition-colors text-sm font-medium"
                    >
                      <HiMapPin className="w-5 h-5" />
                      Live Map
                    </Link>
                    <Link
                      to="/login"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-navy-200 hover:text-white hover:bg-navy-800 transition-colors text-sm font-medium"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors"
                    >
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MobileNavItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-sm font-medium ${
        danger
          ? "text-danger-400 hover:bg-danger-500/10"
          : "text-navy-200 hover:text-white hover:bg-navy-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
