import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  tempToken: string | null;
  isAuthenticated: boolean;
  requires2FA: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem("access_token"),
  refreshToken: localStorage.getItem("refresh_token"),
  tempToken: null,
  isAuthenticated: !!localStorage.getItem("access_token"),
  requires2FA: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: User; access: string; refresh: string }>,
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh;
      state.isAuthenticated = true;
      state.requires2FA = false;
      state.tempToken = null;
      localStorage.setItem("access_token", action.payload.access);
      localStorage.setItem("refresh_token", action.payload.refresh);
    },
    setTempToken(state, action: PayloadAction<string>) {
      state.tempToken = action.payload;
      state.requires2FA = true;
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    updateTokens(
      state,
      action: PayloadAction<{ access: string; refresh?: string }>,
    ) {
      state.accessToken = action.payload.access;
      localStorage.setItem("access_token", action.payload.access);
      if (action.payload.refresh) {
        state.refreshToken = action.payload.refresh;
        localStorage.setItem("refresh_token", action.payload.refresh);
      }
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.tempToken = null;
      state.isAuthenticated = false;
      state.requires2FA = false;
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    },
  },
});

export const { setCredentials, setTempToken, setUser, updateTokens, logout } =
  authSlice.actions;

export default authSlice.reducer;
