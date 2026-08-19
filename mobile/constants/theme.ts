export const colors = {
  background: "#0A0A0A",
  surface: "#151515",
  surfaceAlt: "#1C1C1C",
  border: "#262626",
  primary: "#2DD4BF",
  primaryLight: "#5EEAD4",
  primaryDark: "#0F766E",
  safe: "#22C55E",
  warning: "#F59E0B",
  emergency: "#F87171",
  muted: "#9CA3AF",
  text: "#F5F5F5",
} as const;

export type DeviceStatusLabel = "Online" | "Degraded" | "Offline";

export const deviceStatusLabels: DeviceStatusLabel[] = ["Online", "Degraded", "Offline"];

// Kept only so app/(app)/gamification/xp.tsx still compiles — gamification
// isn't part of GuardianTag's spec, so this screen is a candidate to delete
// rather than adapt. See note at the end of this batch of files.
export type GuardianLevelLabel = "Rookie" | "Watchman" | "Guardian" | "Sentinel" | "Hostel Protector";
export const guardianLevels: GuardianLevelLabel[] = [
  "Rookie",
  "Watchman",
  "Guardian",
  "Sentinel",
  "Hostel Protector",
];
