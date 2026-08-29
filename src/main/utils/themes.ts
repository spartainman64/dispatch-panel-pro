export type ThemePreset = {
  label: string;
  mode: "dark" | "light";
  background: { default: string; paper: string };
  primary: string;
  secondary: string;
  success: string;
  divider: string;
  text: { primary: string; secondary: string };
  /** Swatch color shown in the theme picker. */
  swatch: string;
};

export const THEMES: Record<string, ThemePreset> = {
  navy: {
    label: "Navy",
    mode: "dark",
    background: { default: "#0a0e14", paper: "#141a23" },
    primary: "#2f6690",
    secondary: "#3b82f6",
    success: "#3fb950",
    divider: "#262d38",
    text: { primary: "#e6edf3", secondary: "#8b98a5" },
    swatch: "#2f6690",
  },
  forest: {
    label: "Forest",
    mode: "dark",
    background: { default: "#0a120d", paper: "#111f17" },
    primary: "#14532d",
    secondary: "#22c55e",
    success: "#4ade80",
    divider: "#1f3326",
    text: { primary: "#e7f3ec", secondary: "#8fab9b" },
    swatch: "#166534",
  },
  daylight: {
    label: "Daylight",
    mode: "light",
    background: { default: "#f8fafc", paper: "#ffffff" },
    primary: "#1976d2",
    secondary: "#3b82f6",
    success: "#2e7d32",
    divider: "#e2e8f0",
    text: { primary: "#0f172a", secondary: "#475569" },
    swatch: "#1976d2",
  },
};

export const DEFAULT_THEME_NAME = "navy";
