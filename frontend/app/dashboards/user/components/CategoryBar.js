/**
 * CATEGORY BAR COMPONENT
 * ------------------------------------------------------
 * Route: frontend/app/user-dashboard/components/CategoryBar.js
 *
 * Purpose:
 * Premium selector control used on the User Dashboard
 * to display and open the equipment category picker.
 *
 * Core Responsibilities:
 * - Display current selected category
 * - Trigger category sheet open via click or keyboard
 * - Support swipe-down gesture to open (mobile-friendly)
 * - Reflect open/pressed visual state
 * - Provide accessible button semantics (aria-expanded)
 *
 * Data Sources:
 * - Props: label, value, open, onOpen, hint, ariaLabel
 *
 * Security / Env:
 * - No environment dependencies (UI interaction component)
 */

"use client";

import { useRef, useState } from "react";
import styles from "../page.module.css";

/**
 * CategoryBar (Pill)
 * - Premium selector control (kicker + selected value + chevron)
 * - Tap to open category sheet
 * - Optional swipe-down gesture to open (natural on mobile)
 *
 * Props:
 * - label: string (kicker text, e.g., "Equipment type")
 * - value: string (selected value, e.g., "All", "HVAC")
 * - open: boolean (optional; styles chevron/state when sheet is open)
 * - onOpen: () => void
 * - hint: string (optional helper text under pill)
 * - ariaLabel: string (optional override)
 */
export default function CategoryBar({
  label = "Equipment type",
  value = "All",
  open = false,
  onOpen,
  hint = "",
  ariaLabel,
}) {
  const startRef = useRef({ x: 0, y: 0, t: 0 });
  const [pressed, setPressed] = useState(false);

  function onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    setPressed(true);
    startRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  }

  function onPointerUp(e) {
    setPressed(false);

    const s = startRef.current;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    const dt = performance.now() - s.t;

    // Swipe-down open:
    // - Downward enough
    // - Not too sideways
    // - Fast-ish gesture
    const swipeDown = dy > 28 && Math.abs(dx) < 60 && dt < 450;
    if (swipeDown) onOpen?.();
  }

  function onPointerCancel() {
    setPressed(false);
  }

  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen?.();
    }
  }

  const classes = [
    styles.categoryPill,
    pressed ? styles.categoryPillPressed : "",
    open ? styles.categoryPillOpen : "",
  ]
    .filter(Boolean)
    .join(" ");

  const a11y =
    ariaLabel ||
    `${label}: ${value}. Open equipment selector.`;

  return (
    <button
      type="button"
      className={classes}
      onClick={() => onOpen?.()}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      aria-label={a11y}
      aria-expanded={open ? "true" : "false"}
    >
      <div className={styles.categoryPillRow}>
        <div className={styles.categoryPillText}>
          <div className={styles.categoryPillKicker}>{label}</div>
          <div className={styles.categoryPillValue}>{value}</div>
        </div>

        <span className={styles.categoryPillChevron} aria-hidden="true">
          <span className={styles.categoryPillChevronGlyph}>▾</span>
        </span>
      </div>

      {hint ? <div className={styles.categoryPillHint}>{hint}</div> : null}
    </button>
  );
}
