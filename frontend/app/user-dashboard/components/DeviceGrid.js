// frontend/app/user-dashboard/components/DeviceGrid.js
"use client";

import styles from "../page.module.css";

export default function DeviceGrid({
  items = [],
  onOpen,
  ariaLabel = "Device cards",
}) {
  return (
    <div className={styles.tiles} aria-label={ariaLabel}>
      {items.map((d) => (
        <button
          key={d.key}
          type="button"
          className={`${styles.tile} ${d.featured ? styles.tileAccent : ""} ${styles.tileLeft}`}
          onClick={() => onOpen?.(d.key)}
          aria-label={d.title}
        >
          <div className={styles.tileTop}>
            <div>
              <div className={styles.tileLabel}>{d.title}</div>
              <div className={styles.tileSub}>{d.sub}</div>
            </div>

            <div className={styles.tileIcon} aria-hidden="true">
              <span className={styles.tileGlyph}>⟂</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
