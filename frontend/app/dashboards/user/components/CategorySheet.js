// frontend/app/user-dashboard/components/CategorySheet.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../page.module.css";

/**
 * CategorySheet (bottom sheet)
 * - Smooth open/close animation
 * - Backdrop click + Esc closes
 * - Locks body scroll while open
 *
 * Props:
 * - open: boolean
 * - title: string (optional, default "Select Category")
 * - items: [{ key, label }]
 * - activeKey: string
 * - onSelect: (key) => void
 * - onClose: () => void
 */
export default function CategorySheet({
  open,
  title = "Select Category",
  items = [],
  activeKey = "",
  onSelect,
  onClose,
}) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const closeTimer = useRef(null);

  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setShown(true));
      return;
    }

    setShown(false);
    closeTimer.current = setTimeout(() => setMounted(false), 220);

    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [open]);

  useEffect(() => {
    if (!mounted) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`${styles.sheetBackdrop} ${shown ? styles.sheetBackdropOpen : ""}`}
      onClick={() => onClose?.()}
    >
      <div
        className={`${styles.sheet} ${shown ? styles.sheetOpen : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab handle */}
        <div className={styles.sheetHandleWrap} aria-hidden="true">
          <div className={styles.sheetHandle} />
        </div>

        {/* Header */}
        <div className={styles.sheetHeader}>
          <div className={styles.sheetTitleBlock}>
            <div className={styles.sheetKicker}>{title}</div>
            <div className={styles.sheetSubtitle}>Pick one to filter techs</div>
          </div>

          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Close"
            className={styles.sheetCloseBtn}
          >
            ×
          </button>
        </div>

        {/* List */}
        <div className={styles.sheetList}>
          {safeItems.map((c) => {
            const active = c.key === activeKey;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => {
                  onSelect?.(c.key);
                  onClose?.();
                }}
                aria-pressed={active}
                className={`${styles.sheetItem} ${active ? styles.sheetItemActive : ""}`}
              >
                <span>{c.label}</span>
                <span className={styles.sheetItemRight} aria-hidden="true">
                  {active ? "✓" : "›"}
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.sheetSafePad} />
      </div>
    </div>
  );
}
