// frontend/app/user-dashboard/page.js
"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

import TopBar from "./components/TopBar";

// layout blocks
import CategoryChips from "./components/CategoryChips";
import SectionHeader from "./components/SectionHeader";
import DeviceGrid from "./components/DeviceGrid";

// icons
import { CATEGORY_ICON_MAP } from "./components/icons";

// data (single source of truth)
import {
  CATEGORIES as BASE_CATEGORIES,
  STATUSLINE_DEFAULT,
} from "./components/dashboardData";

/**
 * VTech (Hands-On Assistance) — Home
 * This version shows TECH tiles only (no primary action card).
 * - Header: "Start Remote Help"
 * - Grid: Best Available + 3 tech tiles (2x2)
 * - Auto-filter by active category when possible
 */

// attach icons to category chip items
const CATEGORIES = (BASE_CATEGORIES || []).map((c) => ({
  ...c,
  icon: CATEGORY_ICON_MAP?.[c.key] || undefined,
}));

// Temporary local tech pool (so page works even before dashboardData gets TECHS)
const TECH_POOL = [
  {
    key: "best-available", // special tile
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
    specialties: ["emergency", "pos", "food", "vending"],
  },
  {
    key: "chris-pos",
    name: "Chris",
    specialty: "POS / Payments",
    status: "busy",
    etaMin: 12,
    specialties: ["pos", "payments", "emergency"],
  },
  {
    key: "sam-network",
    name: "Sam",
    specialty: "Network / Wi-Fi",
    status: "available",
    etaMin: 8,
    specialties: ["pos", "payments", "hvac", "emergency"],
  },
  {
    key: "jordan-kds",
    name: "Jordan",
    specialty: "Online Orders / KDS",
    status: "away",
    etaMin: 18,
    specialties: ["pos", "food", "emergency"],
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
  if (!activeKey) return true;
  if (tech.isBest) return true; // best available always shows

  // If your categories are broad (emergency/food/vending/pos/hvac/etc),
  // we match against tech.specialties if present; otherwise show generalists.
  const list = Array.isArray(tech.specialties) ? tech.specialties : [];
  if (!list.length) return tech.specialty.toLowerCase().includes("generalist");

  return list.map((x) => String(x).toLowerCase()).includes(String(activeKey).toLowerCase());
}

function toTile(tech) {
  const status = normStatus(tech.status);
  const statusLabel =
    status === "available" ? "Available" : status === "busy" ? "Busy" : status === "away" ? "Away" : "Offline";

  const eta =
    status === "available" && Number.isFinite(tech.etaMin)
      ? ` • ~${Math.max(1, Math.round(tech.etaMin))}m`
      : "";

  return {
    key: tech.key,
    title: tech.name,
    subtitle: `${tech.specialty} • ${statusLabel}${eta}`,
    // optional fields for later (DeviceGrid can ignore if it wants)
    status,
    etaMin: tech.etaMin,
    avatarUrl: tech.avatarUrl,
    raw: tech,
  };
}

export default function Page() {
  const [activeCategory, setActiveCategory] = useState(
    BASE_CATEGORIES?.[0]?.key || "emergency"
  );

  const sectionTitle = "Start Remote Help";

  const TECH_TILES = useMemo(() => {
    const best = TECH_POOL.find((t) => t.key === "best-available") || TECH_POOL[0];

    const filtered = TECH_POOL
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

    // 2x2 grid: Best Available + 3 techs
    return [toTile(best), ...sorted.map(toTile)];
  }, [activeCategory]);

  return (
    <main className={styles.root}>
      <div className={styles.shell}>
        {/* Top bar (thin utility row) */}
        <TopBar
          kicker=""
          title=""
          onMenu={() => console.log("menu")}
          onSettings={() => console.log("profile/settings")}
        />

        {/* Greeting block */}
        <div className={styles.sublineWrap}>
          <div className={styles.pageTitle}>Hi Javi</div>
          <div className={styles.helperText}>
            Choose equipment type. Start remote help in seconds.
          </div>
        </div>

        {/* Equipment categories */}
        <CategoryChips
          items={CATEGORIES}
          activeKey={activeCategory}
          onChange={setActiveCategory}
        />

        {/* Start Remote Help header + TECH tiles */}
        <SectionHeader
          title={sectionTitle}
          onMore={() => console.log("view all techs")}
          moreLabel="View all techs"
        />

        <DeviceGrid
          items={TECH_TILES}
          onOpen={(itemOrKey) => {
            const key = typeof itemOrKey === "string" ? itemOrKey : itemOrKey?.key;

            if (key === "best-available") {
              console.log("start help: auto-assign", "category:", activeCategory);
              return;
            }

            console.log("open tech", key, "category:", activeCategory);
          }}
          ariaLabel="Start remote help with a tech"
        />

        {/* Optional status line */}
        {Boolean(STATUSLINE_DEFAULT) && (
          <div className={styles.helperText} style={{ marginTop: 6 }}>
            {STATUSLINE_DEFAULT}
          </div>
        )}
      </div>
    </main>
  );
}
