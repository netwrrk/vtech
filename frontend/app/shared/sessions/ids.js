// frontend/app/shared/sessions/ids.js
// Shared id helpers (sessionId + techId) used across dashboards + call pages.

export const TECH_ID_LS_KEY = "vtech.techId";

/** Normalize techId exactly like backend presence expects */
export function normTechId(x) {
  return String(x || "").trim().toLowerCase();
}

/** Normalize sessionId (server uses nanoid uppercase for generated IDs, but we accept any trimmed string) */
export function normSessionId(x) {
  return String(x || "").trim();
}

/** Read techId from ?techId=... OR localStorage fallback */
export function getTechIdFromUrlOrStorage() {
  if (typeof window === "undefined") return "";
  const qs = new URLSearchParams(window.location.search);
  const fromQS = normTechId(qs.get("techId"));
  const fromLS = normTechId(readStoredTechId());
  return fromQS || fromLS || "";
}

/** Read raw techId from localStorage */
export function readStoredTechId() {
  if (typeof window === "undefined") return "";
  try {
    return String(localStorage.getItem(TECH_ID_LS_KEY) || "");
  } catch {
    return "";
  }
}

/** Store techId to localStorage (normalized) */
export function storeTechId(id) {
  if (typeof window === "undefined") return;
  const v = normTechId(id);
  if (!v) return;
  try {
    localStorage.setItem(TECH_ID_LS_KEY, v);
  } catch {}
}

/** Pull techId from current URL (querystring) */
export function getTechIdFromUrl() {
  if (typeof window === "undefined") return "";
  const qs = new URLSearchParams(window.location.search);
  return normTechId(qs.get("techId"));
}

/** Demo convenience: ?autoJoin=1|true|yes */
export function inferAutoJoinFromUrl() {
  if (typeof window === "undefined") return false;
  const qs = new URLSearchParams(window.location.search);
  const v = String(qs.get("autoJoin") || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** Safe sessionId extraction from Next params */
export function getSessionIdFromParams(params) {
  return normSessionId(params?.sessionId);
}
