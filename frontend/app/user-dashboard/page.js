// frontend/app/user-dashboard/page.js
"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

import TopBar from "./components/TopBar";
import HeroCard from "./components/HeroCard";
import SlideAction from "./components/SlideAction";
import BottomNav from "./components/BottomNav";

// NEW: extracted layout blocks
import CategoryChips from "./components/CategoryChips";
import SectionHeader from "./components/SectionHeader";
import DeviceGrid from "./components/DeviceGrid";

const CATEGORIES = [
  { key: "overview", label: "Overview" },
  { key: "devices", label: "Devices" },
  { key: "network", label: "Network" },
  { key: "security", label: "Security" },
  { key: "sessions", label: "Sessions" },
  { key: "tickets", label: "Tickets" },
  { key: "messages", label: "Messages" },
];

// dummy device cards (swap later)
const DEVICES = [
  { key: "primary", title: "My Device", sub: "Healthy • Ready", featured: true },
  { key: "wifi", title: "Wi-Fi", sub: "Connected • Strong" },
  { key: "browser", title: "Browser", sub: "Protected • Clean" },
  { key: "accounts", title: "Accounts", sub: "2 alerts • Review" },
];

export default function Page() {
  const [activeNav, setActiveNav] = useState("home");
  const [activeCategory, setActiveCategory] = useState("overview");

  // skeleton states (swap these later with real device/session data)
  const [health] = useState("98%");
  const [primary] = useState("On");
  const [secondary] = useState("secure connection");

  const sectionTitle = useMemo(() => {
    // keep it simple for now; later this can filter content
    return "Devices";
  }, [activeCategory]);

  return (
    <main className={styles.root}>
      <div className={styles.shell}>
        {/* Header (utility row) */}
        <TopBar
          kicker="VTECH"
          title="Hi Javi"
          onMenu={() => console.log("menu")}
          onSettings={() => console.log("settings")}
        />

        {/* Subline */}
        <div className={styles.sublineWrap}>
          <div className={styles.helperText}>
            Welcome back. Choose a category to begin.
          </div>
        </div>

        {/* Category chips row (moved into component) */}
        <CategoryChips
          items={CATEGORIES}
          activeKey={activeCategory}
          onChange={setActiveCategory}
        />

        {/* Featured device card */}
        <HeroCard
          statValue={health}
          statLabel="system health"
          primary={primary}
          secondary={secondary}
          rightLabel="device preview"
          onOpen={() => console.log("open featured device")}
        />

        {/* Session action */}
        <SlideAction
          label="Slide to start secure session"
          helper="No access is granted until you confirm."
          onComplete={() => console.log("slide complete")}
        />

        {/* Section header (moved into component) */}
        <SectionHeader
          title={sectionTitle}
          onMore={() => console.log("devices more")}
        />

        {/* Devices grid (moved into component) */}
        <DeviceGrid
          items={DEVICES}
          onOpen={(itemOrKey) => {
            const key =
              typeof itemOrKey === "string" ? itemOrKey : itemOrKey?.key;
            console.log("open", key);
          }}
        />

        <BottomNav
          activeKey={activeNav}
          onChange={(key) => setActiveNav(key)}
        />
      </div>
    </main>
  );
}
