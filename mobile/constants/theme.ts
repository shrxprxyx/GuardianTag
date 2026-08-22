export const colors = {
  background: "#0B0F0E",
  surface: "#151A18",
  surfaceAlt: "#1B211E",
  border: "#252D29",
  hairline: "#1C2220",
  primary: "#69D7B8",
  primaryLight: "#8BE8CD",
  primaryDark: "#4FBFA0",
  secondary: "#69D7B8",
  secondaryLight: "#8BE8CD",
  safe: "#69D7B8",
  warning: "#F2B84B",
  emergency: "#EF6262",
  muted: "#9AA7A1",
  mutedLight: "#B8C2BD",
  text: "#F1F5F3",
} as const;

export type DeviceStatusLabel = "Online" | "Degraded" | "Offline";

export const deviceStatusLabels: DeviceStatusLabel[] = ["Online", "Degraded", "Offline"];

// Matches the backend's GuardianLevel enum exactly (app/models/enums.py) -
// these are the 5 real level values, lowest to highest.
export type GuardianLevel = "rookie" | "watchman" | "guardian" | "sentinel" | "hostel_protector";

export const guardianLevelLabels: Record<GuardianLevel, string> = {
  rookie: "Rookie",
  watchman: "Watchman",
  guardian: "Guardian",
  sentinel: "Sentinel",
  hostel_protector: "Hostel Protector",
};