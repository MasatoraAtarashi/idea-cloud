/** Claude Design system tokens. CSS in app.css must stay in sync. */
export const DESIGN_TOKENS = {
  surface: "#ffffff",
  sidebar: "#fafafb",
  tableHead: "#f4f5f7",
  border: "#c5cad3",
  borderControl: "#b8bfc9",
  accent: "#3b6ef6",
  body: "#0a0a0a",
  muted: "#3a424e",
  rowHover: "#f8fafe",
  selection: "#eef2fd",
  rowHeight: 40,
} as const;

export const STAGE_PILL_HEX = {
  spark: { bg: "#f3f0ff", fg: "#6d28d9" },
  aging: { bg: "#fff6ec", fg: "#b45309" },
  ripe: { bg: "#ecfbf6", fg: "#0f766e" },
  selected: { bg: "#edf4ff", fg: "#1f49c4" },
  archived: { bg: "#f4f5f8", fg: "#687280" },
} as const;
