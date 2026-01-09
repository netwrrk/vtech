// frontend/app/user-dashboard/page.js
"use client";

import { useState } from "react";
import styles from "./page.module.css";

import TopBar from "./components/TopBar";
import HeroCard from "./components/HeroCard";
import SlideAction from "./components/SlideAction";
import ActionTiles from "./components/ActionTiles";
import BottomNav from "./components/BottomNav";

export default function Page() {
  const [activeNav, setActiveNav] = useState("home");

  // skeleton states (swap these later with real device/session data)
  const [health] = useState("98%");
  const [primary] = useState("On");
  const [secondary] = useState("secure connection");

  return (
    <main className={styles.root}>
      <div className={styles.shell}>
        <TopBar
          kicker="VTECH"
          title="My Device"
          onMenu={() => console.log("menu")}
          onSettings={() => console.log("settings")}
        />

        <HeroCard
          statValue={health}
          statLabel="system health"
          primary={primary}
          secondary={secondary}
          rightLabel="device preview"
        />

        <SlideAction
          label="Slide to start secure session"
          helper="No access is granted until you confirm."
          onComplete={() => console.log("slide complete")}
        />

        <ActionTiles
          onPrimary={() => console.log("request tech")}
          onSecondary={() => console.log("run scan")}
          primaryLabel="Request Tech"
          primarySub="Start a secure session"
          secondaryLabel="Run Scan"
          secondarySub="Quick system check"
        />

        <BottomNav
          activeKey={activeNav}
          onChange={(key) => setActiveNav(key)}
        />
      </div>
    </main>
  );
}
