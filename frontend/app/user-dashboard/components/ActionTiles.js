// frontend/app/user-dashboard/components/ActionTiles.js
"use client";

import styles from "../page.module.css";

function IconWrench(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M21 7.5a6 6 0 0 1-8.7 5.3L7 18l-2 2-3-3 2-2 5.2-5.3A6 6 0 0 1 16.5 3l-3 3 4.5 4.5 3-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShield(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2 20 6v6c0 5-3.2 9.4-8 10-4.8-.6-8-5-8-10V6l8-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.2 11 13.7l3.6-3.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Tile({ accent, icon, label, sub, onClick }) {
  return (
    <button
      type="button"
      className={`${styles.tile} ${accent ? styles.tileAccent : ""}`}
      onClick={onClick}
    >
      <div className={styles.tileTop}>
        <div className={styles.tileIcon}>{icon}</div>
      </div>

      <div>
        <div className={styles.tileLabel}>{label}</div>
        {sub ? <div className={styles.tileSub}>{sub}</div> : null}
      </div>
    </button>
  );
}

export default function ActionTiles({
  onPrimary,
  onSecondary,
  primaryLabel = "Request Tech",
  primarySub = "Start a secure session",
  secondaryLabel = "Run Scan",
  secondarySub = "Quick system check",
}) {
  return (
    <section className={styles.tiles}>
      <Tile
        accent
        icon={<IconWrench />}
        label={primaryLabel}
        sub={primarySub}
        onClick={onPrimary}
      />
      <Tile
        icon={<IconShield />}
        label={secondaryLabel}
        sub={secondarySub}
        onClick={onSecondary}
      />
    </section>
  );
}