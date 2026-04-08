import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import authReducer from "../store/slices/authSlice";
import uiReducer from "../store/slices/uiSlice";
import { authApi } from "../store/api/authApi";
import { reportApi } from "../store/api/reportApi";
import { stationApi } from "../store/api/stationApi";
import type { RootState } from "../store";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function createTestStore(preloadedState?: DeepPartial<RootState>) {
  const rootReducer = combineReducers({
    auth: authReducer,
    ui: uiReducer,
    [authApi.reducerPath]: authApi.reducer,
    [reportApi.reducerPath]: reportApi.reducer,
    [stationApi.reducerPath]: stationApi.reducer,
  });

  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(authApi.middleware)
        .concat(reportApi.middleware)
        .concat(stationApi.middleware),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    preloadedState: preloadedState as any,
  });
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  preloadedState?: DeepPartial<RootState>;
  store?: ReturnType<typeof createTestStore>;
  route?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    route = "/",
    ...renderOptions
  }: CustomRenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

export function createMockUser(overrides = {}) {
  return {
    id: "user-1",
    email: "test@example.com",
    username: "testuser",
    first_name: "Test",
    last_name: "User",
    phone_number: "+2341234567890",
    nin_verified: false,
    email_verified: true,
    two_factor_enabled: false,
    is_fully_verified: false,
    profile_picture: null,
    date_joined: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createMockReport(overrides = {}) {
  return {
    id: "report-1",
    user: "user-1",
    user_email: "test@example.com",
    user_name: "testuser",
    title: "Test Report",
    description: "Test description",
    voice_note: "/media/voice.webm",
    latitude: 6.5,
    longitude: 3.4,
    category: "robbery" as const,
    category_display: "Robbery",
    severity: "high" as const,
    severity_display: "High",
    is_active: true,
    media: [],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createMockStation(overrides = {}) {
  return {
    id: "station-1",
    name: "Test Police Station",
    station_type: "police" as const,
    station_type_display: "Police Station",
    latitude: 6.5,
    longitude: 3.4,
    address: "123 Test Street",
    phone_number: "+234123456789",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}
