import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setCredentials,
  logout as logoutAction,
  setTempToken,
} from "@/store/slices/authSlice";
import { useLogoutMutation } from "@/store/api/authApi";
import type { User } from "@/types";

export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    accessToken,
    refreshToken,
    requires2FA,
    tempToken,
  } = useAppSelector((state) => state.auth);
  const [logoutApi] = useLogoutMutation();

  const login = useCallback(
    (userData: { user: User; access: string; refresh: string }) => {
      dispatch(setCredentials(userData));
    },
    [dispatch],
  );

  const handleRequires2FA = useCallback(
    (token: string) => {
      dispatch(setTempToken(token));
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    if (refreshToken) {
      try {
        await logoutApi({ refresh: refreshToken }).unwrap();
      } catch {
        // Token may already be blacklisted
      }
    }
    dispatch(logoutAction());
    navigate("/login");
  }, [dispatch, navigate, refreshToken, logoutApi]);

  return {
    user,
    isAuthenticated,
    accessToken,
    refreshToken,
    requires2FA,
    tempToken,
    login,
    handleRequires2FA,
    logout,
  };
}
