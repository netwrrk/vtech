/**
 * SECTION HEADER COMPONENT
 * ------------------------------------------------------
 * Route: frontend/app/user-dashboard/components/SectionHeader.js
 *
 * Purpose:
 * Simple title row component used within the
 * User Dashboard to label content sections.
 *
 * Core Responsibilities:
 * - Render section title text
 * - Maintain consistent dashboard spacing and typography
 *
 * Data Sources:
 * - Props: title
 *
 * Security / Env:
 * - No environment dependencies (UI-only component)
 */

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
