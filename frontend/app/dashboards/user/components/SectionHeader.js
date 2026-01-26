// frontend/app/user-dashboard/components/SectionHeader.js
"use client";

import styles from "../page.module.css";

/**
 * SectionHeader
 * - Title only (no right-side actions)
 *
 * Props:
 * - title: string
 */
export default function SectionHeader({ title = "" }) {
  return (
    <div className={styles.sectionRow}>
      <div className={styles.sectionTitle}>{title}</div>
    </div>
  );
}
