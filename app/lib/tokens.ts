/** v2 design tokens. CSS in app.css must stay in sync. */
export const DESIGN_TOKENS = {
  background: "#f9fafb",
  surface: "#ffffff",
  sidebar: "#ffffff",
  tableHead: "#f9fafb",
  border: "#eaecf0",
  borderCard: "#e4e7ec",
  borderControl: "#d0d5dd",
  accent: "#4f46e5",
  body: "#101828",
  secondary: "#344054",
  muted: "#667085",
  rowHover: "#fcfcfd",
  selection: "#f2f4f7",
  rowHeight: 40,
} as const;

export const STAGE_PILL_HEX = {
  spark: { bg: "#f2f4f7", fg: "#344054", dot: "#98a2b3" },
  aging: { bg: "#fffaeb", fg: "#b54708", dot: "#f79009" },
  ripe: { bg: "#ecfdf3", fg: "#067647", dot: "#17b26a" },
  selected: { bg: "#eef4ff", fg: "#3538cd", dot: "#6172f3" },
  archived: { bg: "#f9fafb", fg: "#667085", dot: "#d0d5dd" },
} as const;

export const TAG_COLOR_HEX = {
  indigo: { bg: "#eef4ff", fg: "#3538cd" },
  violet: { bg: "#f4f3ff", fg: "#5925dc" },
  pink: { bg: "#fdf2fa", fg: "#c11574" },
  cyan: { bg: "#ecfdff", fg: "#0e7090" },
  blue: { bg: "#f0f9ff", fg: "#026aa2" },
  green: { bg: "#ecfdf3", fg: "#067647" },
  red: { bg: "#fef3f2", fg: "#b42318" },
  grey: { bg: "#f2f4f7", fg: "#344054" },
} as const;

export type TagColor = keyof typeof TAG_COLOR_HEX;
