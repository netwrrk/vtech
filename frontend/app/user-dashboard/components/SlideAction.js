// frontend/app/user-dashboard/components/SlideAction.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../page.module.css";

function IconLock(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7 11V8.5A5 5 0 0 1 12 3a5 5 0 0 1 5 5.5V11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.5 11h11A2.5 2.5 0 0 1 20 13.5v5A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-5A2.5 2.5 0 0 1 6.5 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconUnlock(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M9 11V8.7A4.2 4.2 0 0 1 13.2 4.5c2.32 0 4.2 1.88 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.5 11h11A2.5 2.5 0 0 1 20 13.5v5A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-5A2.5 2.5 0 0 1 6.5 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconArrow(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SlideAction({
  label = "Slide to start secure session",
  helper = "No access is granted until you confirm.",
  disabled = false,
  onComplete,
  completeAt = 0.86, // % of track travel required
}) {
  const trackRef = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const dims = useMemo(() => {
    const el = trackRef.current;
    if (!el) return { maxX: 0 };
    // thumb is 44px; left inset is 6px; right inset is 6px
    const trackW = el.getBoundingClientRect().width;
    const maxX = Math.max(0, trackW - (6 + 44 + 6));
    return { maxX };
  }, [trackRef.current]);

  useEffect(() => {
    const onResize = () => {
      // force a gentle clamp on resize
      const el = trackRef.current;
      if (!el) return;
      const trackW = el.getBoundingClientRect().width;
      const maxX = Math.max(0, trackW - (6 + 44 + 6));
      setDragX((x) => Math.min(Math.max(0, x), maxX));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function clamp(x, maxX) {
    return Math.min(Math.max(0, x), maxX);
  }

  function handlePointerDown(e) {
    if (disabled) return;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragging || disabled) return;
    const el = trackRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const maxX = Math.max(0, rect.width - (6 + 44 + 6));
    // pointer position relative to track, minus thumb center offset
    const raw = e.clientX - rect.left - 6 - 22;
    setDragX(clamp(raw, maxX));
  }

  function finishDrag() {
    if (disabled) return;
    setDragging(false);

    const el = trackRef.current;
    if (!el) {
      setDragX(0);
      return;
    }
    const rect = el.getBoundingClientRect();
    const maxX = Math.max(0, rect.width - (6 + 44 + 6));
    const pct = maxX === 0 ? 0 : dragX / maxX;

    if (pct >= completeAt) {
      setDragX(maxX);
      onComplete?.();
      // reset after a short beat so it feels intentional
      setTimeout(() => setDragX(0), 450);
    } else {
      setDragX(0);
    }
  }

  return (
    <section className={styles.slideWrap} aria-disabled={disabled}>
      <div className={styles.slideRow}>
        <div className={styles.slideDot} aria-label="Locked">
          <IconLock />
        </div>

        <div className={styles.slideTrack} ref={trackRef}>
          <div className={styles.slideHint} style={{ opacity: disabled ? 0.45 : 1 }}>
            <span className={styles.slideChevrons} aria-hidden="true">
              <IconArrow />
              <IconArrow />
              <IconArrow />
            </span>
            <span style={{ marginLeft: 10 }}>{label}</span>
          </div>

          <div
            className={styles.slideThumb}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={label}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            style={{
              transform: `translateX(${dragX}px)`,
              opacity: disabled ? 0.55 : 1,
              pointerEvents: disabled ? "none" : "auto",
            }}
          >
            <IconUnlock />
          </div>
        </div>

        <div className={styles.slideDot} aria-label="Unlocked">
          <IconUnlock />
        </div>
      </div>

      <div className={styles.helperText}>{helper}</div>
    </section>
  );
}
