export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  nin_verified: boolean;
  email_verified: boolean;
  two_factor_enabled: boolean;
  is_fully_verified: boolean;
  profile_picture: string | null;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  requires_2fa: boolean;
  temp_token?: string;
  access?: string;
  refresh?: string;
  user?: User;
  message?: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qr_code: string;
  provisioning_uri: string;
}

export interface Report {
  id: string;
  user: string;
  user_email: string;
  user_name: string;
  title: string;
  description: string;
  voice_note: string;
  latitude: number;
  longitude: number;
  category: ReportCategory;
  category_display: string;
  severity: ReportSeverity;
  severity_display: string;
  is_active: boolean;
  media: ReportMedia[];
  created_at: string;
  updated_at: string;
}

export interface ReportMedia {
  id: string;
  media_type: "image" | "video";
  file: string;
  created_at: string;
}

export type ReportCategory =
  | "robbery"
  | "assault"
  | "fire"
  | "accident"
  | "kidnapping"
  | "terrorism"
  | "flooding"
  | "suspicious"
  | "gunshot"
  | "vandalism"
  | "medical"
  | "other";

export type ReportSeverity = "low" | "medium" | "high" | "critical";

export interface SecurityStation {
  id: string;
  name: string;
  station_type: StationType;
  station_type_display: string;
  latitude: number;
  longitude: number;
  address: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
  distance_km?: number;
}

export type StationType = "police" | "army" | "fire" | "health";

export interface ApiError {
  error?: string;
  detail?: string;
  message?: string;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface WebSocketMessage {
  type: "new_report";
  report: Report;
}

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

export const REPORT_CATEGORIES: {
  value: ReportCategory;
  label: string;
  icon: string;
}[] = [
  { value: "robbery", label: "Robbery", icon: "🔫" },
  { value: "assault", label: "Assault", icon: "👊" },
  { value: "fire", label: "Fire Outbreak", icon: "🔥" },
  { value: "accident", label: "Road Accident", icon: "🚗" },
  { value: "kidnapping", label: "Kidnapping", icon: "🚨" },
  { value: "terrorism", label: "Terrorism", icon: "💣" },
  { value: "flooding", label: "Flooding", icon: "🌊" },
  { value: "suspicious", label: "Suspicious Activity", icon: "👀" },
  { value: "gunshot", label: "Gunshots / Shooting", icon: "💥" },
  { value: "vandalism", label: "Vandalism", icon: "🔨" },
  { value: "medical", label: "Medical Emergency", icon: "🏥" },
  { value: "other", label: "Other", icon: "📋" },
];

export const SEVERITY_LEVELS: {
  value: ReportSeverity;
  label: string;
  color: string;
}[] = [
  { value: "low", label: "Low", color: "#22c55e" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "high", label: "High", color: "#ef4444" },
  { value: "critical", label: "Critical", color: "#b91c1c" },
];

export const STATION_TYPES: {
  value: StationType;
  label: string;
  color: string;
}[] = [
  { value: "police", label: "Police Station", color: "#166534" },
  { value: "army", label: "Army Barracks", color: "#4ade80" },
  { value: "fire", label: "Fire Station", color: "#ef4444" },
  { value: "health", label: "Health Facility", color: "#eab308" },
];
