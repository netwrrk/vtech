// frontend/app/user-dashboard/components/CategoryChips.js
"use client";

import styles from "../page.module.css";

export default function CategoryChips({
  items = [],
  activeKey,
  onChange,
  ariaLabel = "Categories",
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={styles.categoryRow}>
      {items.map((c) => {
        const active = c.key === activeKey;
        return (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={active}
            className={`${styles.chip} ${active ? styles.chipActive : ""}`}
            onClick={() => onChange?.(c.key)}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
