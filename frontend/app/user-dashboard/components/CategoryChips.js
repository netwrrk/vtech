// frontend/app/user-dashboard/components/CategoryChips.js
"use client";

import styles from "../page.module.css";

/**
 * CategoryChips — icon-chip horizontal row (matches reference layout)
 * Expects items: [{ key, label, icon? }]
 * - icon can be a React node (recommended), or omitted (falls back to first letter)
 */
export default function CategoryChips({
  items = [],
  activeKey,
  onChange,
  ariaLabel = "Categories",
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={styles.categoryRow}
    >
      {items.map((c) => {
        const active = c.key === activeKey;
        const Icon = c.icon;

        return (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={active}
            className={`${styles.chip} ${active ? styles.chipActive : ""}`}
            onClick={() => onChange?.(c.key)}
          >
            <span className={styles.chipIcon} aria-hidden="true">
              {Icon ? (
                typeof Icon === "function" ? (
                  <Icon />
                ) : (
                  Icon
                )
              ) : (
                <span style={{ fontWeight: 850, fontSize: 12, opacity: 0.9 }}>
                  {(c.label || "?").trim().slice(0, 1).toUpperCase()}
                </span>
              )}
            </span>

            <span className={styles.chipLabel}>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
