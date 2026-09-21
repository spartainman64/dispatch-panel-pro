// Maps a channel's category text (as typed in config.json) to a display
// color and label. Matching is case-insensitive so "police", "Police",
// and "POLICE" all resolve the same way. Any category not in this list
// still displays (using its own text, capitalized) with a neutral color,
// instead of rendering blank.

const COLOR_MAP: Record<string, string> = {
  POLICE: "#3b82f6",
  LAW: "#3b82f6",
  TACTICAL: "#f59e0b",
  TAC: "#f59e0b",
  "FIRE/EMS": "#ef4444",
  FIRE: "#ef4444",
  EMS: "#ef4444",
  INTEROP: "#a855f7",
  SERVICE: "#10b981",
  OTHER: "#10b981",
};

const DEFAULT_COLOR = "#6b7280";

const normalize = (category?: string): string => (category ?? "OTHER").trim().toUpperCase();

export const categoryColor = (category?: string): string => {
  const key = normalize(category);
  return COLOR_MAP[key] ?? DEFAULT_COLOR;
};

export const categoryLabel = (category?: string): string => {
  if (!category || category.trim() === "") return "OTHER";
  return category.trim().toUpperCase();
};
