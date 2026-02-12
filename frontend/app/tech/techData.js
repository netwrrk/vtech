/**
 * TECH PROFILE DATA MODULE
 * ------------------------------------------------------
 * Route: app/tech/techData.js
 *
 * Purpose:
 * Centralized source of truth for tech profile metadata
 * used by /tech/[techId] pages and related UI.
 *
 * Core Responsibilities:
 * - Define static tech profile objects
 * - Provide normalized status handling
 * - Expose helper utilities:
 *   - normStatus()
 *   - statusLabel()
 *   - getTechById()
 *
 * Data Sources:
 * - Local static TECHS array (profile metadata)
 * - Avatar image paths (public assets)
 *
 * Security / Env:
 * - No environment variables required
 * - No external API calls
 * - Pure client-safe static data + helpers
 */

export const TECHS = [
  {
    id: "maria-qsr",
    name: "Maria",
    role: "QSR Ops (Generalist)",
    status: "available", // available | busy | away | offline
    etaMin: 6,
    avatarUrl: "/techs/Maria.jpg",
    bio: "Fast, calm, and systematic. I’ll get you back online without guessing.",
    expertise: ["QSR Ops", "POS basics", "KDS", "Online orders", "Vending", "Network basics"],
    background: [
      "6+ yrs QSR operations support",
      "Square/Toast-style POS workflows",
      "Great with “it worked yesterday” outages",
    ],
  },
  {
    id: "sam-network",
    name: "Sam",
    role: "Network / Wi-Fi",
    status: "available",
    etaMin: 8,
    avatarUrl: "/techs/Sam.jpg",
    bio: "If it touches Wi-Fi, routers, or weird dropouts — I’m your guy.",
    expertise: ["Wi-Fi drops", "Router setup", "ISP troubleshooting", "LAN basics", "Printers", "Cameras"],
    background: [
      "Network-first troubleshooting style",
      "Clean step-by-step validation",
      "Works well on remote sessions",
    ],
  },
  {
    id: "chris-pos",
    name: "Chris",
    role: "POS / Payments",
    status: "busy",
    etaMin: 12,
    avatarUrl: "/techs/Chris.jpg",
    bio: "POS and payment failures are usually fixable fast if you test the right order.",
    expertise: ["Card readers", "Payment outages", "POS terminals", "Printers", "KDS", "Reboots/rollbacks"],
    background: [
      "Focused on POS uptime and payment recovery",
      "Knows common provider failure patterns",
      "Busy often — message still works",
    ],
  },
  {
    id: "jordan-kds",
    name: "Jordan",
    role: "Online Orders / KDS",
    status: "away",
    etaMin: 18,
    avatarUrl: "/techs/Jordan.jpg", // optional, add later
    bio: "Order flow + KDS issues: syncing, tickets, stuck queues, missing orders.",
    expertise: ["KDS tickets", "Order routing", "Aggregator issues", "Tablet setup", "Menu sync"],
    background: [
      "Handles order pipeline issues end-to-end",
      "Strong on vendor portals + syncing checks",
    ],
  },
];

export function normStatus(s) {
  const v = String(s || "").toLowerCase();
  if (v === "available" || v === "online") return "available";
  if (v === "busy") return "busy";
  if (v === "away") return "away";
  return "offline";
}

export function statusLabel(status) {
  const s = normStatus(status);
  if (s === "available") return "Online";
  if (s === "busy") return "Busy";
  if (s === "away") return "Away";
  return "Offline";
}

export function getTechById(id) {
  const key = String(id || "").trim().toLowerCase();
  return TECHS.find((t) => String(t.id).toLowerCase() === key) || null;
}
