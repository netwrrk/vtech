/**
 * USER DASHBOARD HOME
 * ------------------------------------------------------
 * Route: frontend/app/dashboards/user/page.js
 *
 * Purpose:
 * Primary landing page for Users to initiate remote help.
 * Displays available techs, supports category filtering,
 * and reflects live tech availability through presence.
 *
 * Core Responsibilities:
 * - Render dashboard layout (TopBar, CategoryBar, DeviceGrid)
 * - Filter techs by selected equipment category
 * - Subscribe to backend presence via WebSocket
 * - Override tech status based on live online state
 * - Sort techs by availability and ETA
 * - Route to /tech/[techId] when a tech is selected
 *
 * Data Sources:
 * - BASE_CATEGORIES (dashboardData)
 * - CATEGORY_ICON_MAP (icon mapping)
 * - Local TECH_POOL (MVP tech dataset)
 * - Backend WebSocket presence stream
 *
 * Security / Env:
 * - Requires NEXT_PUBLIC_BACKEND_WS for presence subscription
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

import TopBar from "./components/TopBar";
import SectionHeader from "./components/SectionHeader";
import DeviceGrid from "./components/DeviceGrid";

// category bar + sheet
import CategoryBar from "./components/CategoryBar";
import CategorySheet from "./components/CategorySheet";

// icons (optional for the sheet chips)
import { CATEGORY_ICON_MAP } from "./components/icons";

// data (single source of truth)
import { CATEGORIES as BASE_CATEGORIES } from "./data/dashboardData";

/**
 * VTech (Hands-On Assistance) — Home
 *
 * Changes:
 * - Removed hamburger + "..." action wiring
 * - Profile icon routes to /settings
 * - Category matching treats "all" as no filter
 *
 * NEW:
 * - Clicking a tech (not Best Available) routes to /tech/[techId]
 *
 * PRESENCE (Phase 1):
 * - Subscribes to backend presence via WS
 * - If a tech is not present in live presence -> force Offline
 * - If present -> keep their status (or bump offline->available)
 */

const CATEGORIES = (BASE_CATEGORIES || []).map((c) => ({
  ...c,
  icon: CATEGORY_ICON_MAP?.[c.key] || undefined,
}));

// Temporary local tech pool (works before wiring real TECHS list)
const TECH_POOL = [
  {
    key: "best-available",
    name: "Best Available",
    specialty: "Auto-assign",
    status: "available",
    etaMin: 3,
    isBest: true,
  },
  {
    key: "maria-qsr",
    name: "Maria",
    specialty: "QSR Ops (Generalist)",
    status: "available",
    etaMin: 6,
    specialties: ["pos", "food", "vending", "other"],
    avatarUrl: "/techs/Maria.jpg",
  },
  {
    key: "chris-pos",
    name: "Chris",
    specialty: "POS / Payments",
    status: "busy",
    etaMin: 12,
    specialties: ["pos"],
    avatarUrl: "/techs/Chris.jpg",
  },
  {
    key: "sam-network",
    name: "Sam",
    specialty: "Network / Wi-Fi",
    status: "available",
    etaMin: 8,
    specialties: ["pos", "hvac", "other"],
    avatarUrl: "/techs/Sam.jpg",
  },
  {
    key: "jordan-kds",
    name: "Jordan",
    specialty: "Online Orders / KDS",
    status: "away",
    etaMin: 18,
    specialties: ["pos", "food", "other"],
  },
];

const STATUS_ORDER = { available: 0, busy: 1, away: 2, offline: 3 };

function normStatus(s) {
  const v = String(s || "").toLowerCase();
  if (v === "available" || v === "online") return "available";
  if (v === "busy") return "busy";
  if (v === "away") return "away";
  return "offline";
}

function matchesCategory(tech, activeKey) {
  // "all" (or blank) = no filter
  if (!activeKey || String(activeKey).toLowerCase() === "all") return true;
  if (tech.isBest) return true;

  const list = Array.isArray(tech.specialties) ? tech.specialties : [];
  if (!list.length)
    return String(tech.specialty || "").toLowerCase().includes("generalist");

  return list
    .map((x) => String(x).toLowerCase())
    .includes(String(activeKey).toLowerCase());
}

function toTile(tech) {
  const status = normStatus(tech.status);

  const eta =
    status === "available" && Number.isFinite(tech.etaMin)
      ? ` • ~${Math.max(1, Math.round(tech.etaMin))}m`
      : "";

  const statusText =
    status === "available"
      ? ""
      : status === "busy"
      ? " • Busy"
      : status === "away"
      ? " • Away"
      : " • Offline";

  const subtitle = tech.isBest
    ? `${tech.specialty}${eta}`
    : `${tech.specialty}${statusText}${eta}`;

  return {
    key: tech.key,
    title: tech.name,
    sub: subtitle,
    subtitle,
    status,
    etaMin: tech.etaMin,
    avatarUrl: tech.avatarUrl,
    isBest: Boolean(tech.isBest),
    raw: tech,
  };
}

export default function Page() {
  const router = useRouter();
  const WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS;

  // Presence: store online tech ids from backend
  const [onlineTechIds, setOnlineTechIds] = useState([]);
  const wsRef = useRef(null);

  // Default to "all" if available, otherwise first category, otherwise "all"
  const defaultKey =
    (BASE_CATEGORIES || []).find((c) => String(c?.key).toLowerCase() === "all")
      ?.key ||
    BASE_CATEGORIES?.[0]?.key ||
    "all";

  const [activeCategory, setActiveCategory] = useState(defaultKey);
  const [catOpen, setCatOpen] = useState(false);

  const activeLabel =
    (CATEGORIES || []).find((c) => c.key === activeCategory)?.label || "All";

  const sectionTitle = "Start Remote Help";

  // ---- WS presence subscribe ----
  useEffect(() => {
    if (!WS_URL) return;

    // avoid reconnect spam in dev refresh
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      // subscribe to live presence updates
      ws.send(JSON.stringify({ type: "subscribe_presence" }));
    };

    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }

      if (msg.type === "presence_state") {
        const ids = Array.isArray(msg.onlineTechIds) ? msg.onlineTechIds : [];
        setOnlineTechIds(ids.map((x) => String(x).trim().toLowerCase()));
        return;
      }

      if (msg.type === "presence_update") {
        const id = String(msg.techId || "").trim().toLowerCase();
        if (!id) return;

        setOnlineTechIds((prev) => {
          const set = new Set((prev || []).map((x) => String(x).toLowerCase()));
          if (msg.online) set.add(id);
          else set.delete(id);
          return Array.from(set);
        });
        return;
      }
    };

    ws.onerror = () => {
      // silent fail for now (presence is optional in MVP)
    };

    ws.onclose = () => {
      // Optional: clear presence on disconnect so UI doesn’t lie
      setOnlineTechIds([]);
    };

    return () => {
      try {
        ws.close();
      } catch {}
    };
  }, [WS_URL]);

  const { TECH_TILES, statusLine } = useMemo(() => {
    const best =
      TECH_POOL.find((t) => t.key === "best-available") || TECH_POOL[0];

    const onlineSet = new Set((onlineTechIds || []).map((x) => String(x)));

    // Apply presence override:
    // - if tech isn't online -> force offline
    // - if tech is online but profile says offline -> bump to available (demo-friendly)
    const withPresence = TECH_POOL.map((t) => {
      if (t.isBest) return t;
      const isOnline = onlineSet.has(String(t.key).toLowerCase());
      if (!isOnline) return { ...t, status: "offline" };
      const s = normStatus(t.status);
      if (s === "offline") return { ...t, status: "available" };
      return t;
    });

    const filtered = withPresence
      .filter((t) => t.key !== "best-available")
      .filter((t) => matchesCategory(t, activeCategory));

    const sorted = filtered
      .map((t) => ({ ...t, statusNorm: normStatus(t.status) }))
      .sort((a, b) => {
        const ao = STATUS_ORDER[a.statusNorm] ?? 9;
        const bo = STATUS_ORDER[b.statusNorm] ?? 9;
        if (ao !== bo) return ao - bo;

        const aEta = Number.isFinite(a.etaMin) ? a.etaMin : 9999;
        const bEta = Number.isFinite(b.etaMin) ? b.etaMin : 9999;
        return aEta - bEta;
      })
      .slice(0, 3);

    const tiles = [toTile(best), ...sorted.map(toTile)];

    // Online count = presence intersection with known tech keys (excludes "best-available")
    const poolKeys = new Set(
      TECH_POOL.filter((t) => !t.isBest).map((t) => String(t.key).toLowerCase())
    );
    const onlineCount = (onlineTechIds || []).filter((id) =>
      poolKeys.has(String(id).toLowerCase())
    ).length;

    const line = `${onlineCount} online • Avg response 8m`;

    return { TECH_TILES: tiles, statusLine: line };
  }, [activeCategory, onlineTechIds]);

  return (
    <main className={styles.root}>
      <div className={styles.shell}>
        <TopBar kicker="" title="" onSettings={() => router.push("/settings")} />

        <div className={styles.sublineWrap}>
          <div className={styles.pageTitle}>Hi Javi</div>
          <div className={styles.helperText}>
            Choose equipment type. Start remote help in seconds.
          </div>
        </div>

        <CategoryBar
          label="Category"
          value={activeLabel}
          onOpen={() => setCatOpen(true)}
        />

        <CategorySheet
          open={catOpen}
          title="Choose equipment type"
          items={CATEGORIES}
          activeKey={activeCategory}
          onSelect={(key) => {
            setActiveCategory(key);
            setCatOpen(false);
          }}
          onClose={() => setCatOpen(false)}
        />

        <SectionHeader title={sectionTitle} />

        <DeviceGrid
          items={TECH_TILES}
          onOpen={(itemOrKey) => {
            const key =
              typeof itemOrKey === "string" ? itemOrKey : itemOrKey?.key;

            if (!key) return;

            if (key === "best-available") {
              console.log(
                "start help: auto-assign",
                "category:",
                activeCategory
              );
              return;
            }

            // NEW: open tech contact page
            router.push(`/tech/${encodeURIComponent(key)}`);
          }}
          ariaLabel="Start remote help with a tech"
        />

        <div className={styles.helperText} style={{ marginTop: 6 }}>
          {statusLine}
        </div>
      </div>
    </main>
  );
}
