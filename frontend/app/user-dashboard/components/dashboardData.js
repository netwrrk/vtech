// frontend/app/user-dashboard/data/dashboardData.js
// VTech (Hands-On Assistance) — Dashboard skeleton data
// Focus: route by equipment type + start help fast via tech tiles.

export const CATEGORIES = [
  { key: "emergency", label: "Emergency" },
  { key: "food", label: "Food Equipment" },
  { key: "vending", label: "Vending / Soda" },
  { key: "pos", label: "POS / Payments" },
  { key: "hvac", label: "HVAC" },
  { key: "electrical", label: "Electrical" },
  { key: "other", label: "Other" },
];

/**
 * TECHS
 * Used by the Home "Start Remote Help" section (tech tiles).
 *
 * Fields:
 * - key: stable id
 * - name: display name
 * - specialty: short label shown on tile
 * - status: "available" | "busy" | "away" | "offline"
 * - etaMin: number (minutes) — only used when available
 * - specialties: category keys this tech can handle (for filtering)
 * - avatarUrl: optional (later: AI suit portrait)
 */
export const TECHS = [
  // "Best Available" is a special tile used to auto-assign the right tech.
  {
    key: "best-available",
    name: "Best Available",
    specialty: "Auto-assign",
    status: "available",
    etaMin: 3,
    specialties: ["emergency", "food", "vending", "pos", "hvac", "electrical", "other"],
    avatarUrl: "", // optional
    isBest: true,
  },

  // Core QSR ops coverage (generalists first)
  {
    key: "maria-qsr",
    name: "Maria",
    specialty: "QSR Ops (Generalist)",
    status: "available",
    etaMin: 6,
    specialties: ["emergency", "food", "vending", "pos", "other"],
    avatarUrl: "",
  },
  {
    key: "devon-qsr",
    name: "Devon",
    specialty: "QSR Ops (Generalist)",
    status: "busy",
    etaMin: 12,
    specialties: ["emergency", "food", "pos", "other"],
    avatarUrl: "",
  },

  // Specialists that matter most for QSR uptime
  {
    key: "chris-pos",
    name: "Chris",
    specialty: "POS / Payments",
    status: "available",
    etaMin: 8,
    specialties: ["pos", "emergency"],
    avatarUrl: "",
  },
  {
    key: "sam-network",
    name: "Sam",
    specialty: "Network / Wi-Fi",
    status: "away",
    etaMin: 18,
    specialties: ["pos", "emergency", "other"],
    avatarUrl: "",
  },
  {
    key: "jordan-orders",
    name: "Jordan",
    specialty: "Online Orders / KDS",
    status: "available",
    etaMin: 10,
    specialties: ["food", "pos", "emergency", "other"],
    avatarUrl: "",
  },

  // Optional: if you really want this early, keep it as triage only
  {
    key: "riley-bev",
    name: "Riley",
    specialty: "Beverage / Fountain (Triage)",
    status: "offline",
    etaMin: null,
    specialties: ["vending", "food", "emergency"],
    avatarUrl: "",
  },
];

// Optional: tiny “real-world” signal line (if you choose to render it)
export const STATUSLINE_DEFAULT = "Online now • Avg response 8m";

// Optional: if you want a dedicated tech status line later
// export const TECH_STATUSLINE = "Online now • Avg response 8m";
