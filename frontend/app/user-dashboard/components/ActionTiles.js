// frontend/app/user-dashboard/components/ActionTiles.js
"use client";

import styles from "../page.module.css";

const STROKE = 1.6;

function IconWrench(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M21 7.5a6 6 0 0 1-8.7 5.3L7 18l-2 2-3-3 2-2 5.2-5.3A6 6 0 0 1 16.5 3l-3 3 4.5 4.5 3-3Z"
        stroke="currentColor"
        strokeWidth={STROKE}
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
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.2 11 13.7l3.6-3.8"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconDevice(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7 4.5h10A2.5 2.5 0 0 1 19.5 7v10A2.5 2.5 0 0 1 17 19.5H7A2.5 2.5 0 0 1 4.5 17V7A2.5 2.5 0 0 1 7 4.5Z"
        stroke="currentColor"
        strokeWidth={STROKE}
      />
      <path
        d="M9 19.5v1.5h6v-1.5"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * This component now supports two modes:
 * 1) Legacy: renders the original 2 action tiles (Request Tech / Run Scan).
 * 2) Grid: pass `items` to render a “device cards” grid (layout-only).
 *
 * items: [{ key, label, sub, icon, accent, onClick }]
 */
function Tile({ accent, icon, label, sub, onClick }) {
  return (
    <button
      type="button"
      className={`${styles.tile} ${accent ? styles.tileAccent : ""}`}
      onClick={onClick}
      aria-label={label}
      style={{ textAlign: "left" }}
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
  // legacy props
  onPrimary,
  onSecondary,
  primaryLabel = "Request Tech",
  primarySub = "Start a secure session",
  secondaryLabel = "Run Scan",
  secondarySub = "Quick system check",

  // new prop (optional)
  items,
}) {
  // NEW: device-grid mode (used for the “smart home” style layout)
  if (Array.isArray(items) && items.length) {
    return (
      <section className={styles.tiles} aria-label="Device cards">
        {items.map((it) => (
          <Tile
            key={it.key ?? it.label}
            accent={Boolean(it.accent)}
            icon={it.icon ?? <IconDevice />}
            label={it.label}
            sub={it.sub}
            onClick={it.onClick}
          />
        ))}
      </section>
    );
  }

  // Legacy: keep original behavior for compatibility
  return (
    <section className={styles.tiles} aria-label="Quick actions">
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
