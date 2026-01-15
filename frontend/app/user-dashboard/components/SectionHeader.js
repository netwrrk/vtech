// frontend/app/user-dashboard/components/SectionHeader.js
"use client";

import styles from "../page.module.css";

export default function SectionHeader({
  title = "",
  onMore,
  moreLabel = "More options",
}) {
  return (
    <div className={styles.sectionRow}>
      <div className={styles.sectionTitle}>{title}</div>

      <button
        type="button"
        className={styles.iconBtn}
        aria-label={moreLabel}
        onClick={onMore}
      >
        <span className={styles.moreEllipsis} aria-hidden="true">
          …
        </span>
      </button>
    </div>
  );
}
