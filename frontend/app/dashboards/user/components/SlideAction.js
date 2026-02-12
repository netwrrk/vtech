/**
 * SLIDE ACTION COMPONENT
 * ------------------------------------------------------
 * Route: frontend/app/user-dashboard/components/SlideAction.js
 *
 * Purpose:
 * Dual-mode interaction component used on the User Dashboard.
 * Provides either:
 * 1) A "slide to confirm" secure session trigger
 * 2) A tech action bottom sheet with contextual actions
 *
 * Core Responsibilities:
 * - Render interactive slide-to-confirm control
 * - Handle drag, threshold completion, and keyboard activation
 * - Render modal tech action sheet when mode="tech"
 * - Display tech status, ETA, and optional stats
 * - Trigger action callbacks (onStart, onWorkOrder, onRequestNext)
 * - Provide accessible dialog and button semantics
 *
 * Data Sources:
 * - Props: label, helper, disabled, onComplete
 * - Tech mode props: tech object (name, specialty, status, etaMin, avatarUrl, stats)
 * - Callback props for session and workflow actions
 *
 * Security / Env:
 * - No direct environment dependencies (UI interaction component)
 */

"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../page.module.css";

const STROKE = 1.6;

function IconLock(props) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M7 11V8.5A5 5 0 0 1 12 3a5 5 0 0 1 5 5.5V11"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M6.5 11h11A2.5 2.5 0 0 1 20 13.5v5A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-5A2.5 2.5 0 0 1 6.5 11Z"
        stroke="currentColor"
        strokeWidth={STROKE}
      />
    </svg>
  );
}

function IconUnlock(props) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M9 11V8.7A4.2 4.2 0 0 1 13.2 4.5c2.32 0 4.2 1.88 4.2 4.2"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M6.5 11h11A2.5 2.5 0 0 1 20 13.5v5A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-5A2.5 2.5 0 0 1 6.5 11Z"
        stroke="currentColor"
        strokeWidth={STROKE}
      />
    </svg>
  );
}

function IconArrow(props) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClose(props) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M7 7l10 10M17 7L7 17"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * SlideAction
 * - Default mode: "slide to start secure session"
 * - NEW: tech sheet mode (bottom sheet) via `mode="tech"`
 *
 * Tech mode props:
 * - open: boolean
 * - onClose: function
 * - tech: { name, specialty, status, etaMin, avatarUrl, stats? }
 * - onStart: function(tech)
 * - onWorkOrder: function(tech)
 * - onRequestNext: function(tech)
 *
 * NOTE: This is UI-only wiring — no backend assumptions.
 */
export default function SlideAction({
  // default slider props
  label = "Slide to start secure session",
  helper = "No access is granted until you confirm.",
  disabled = false,
  onComplete,
  completeAt = 0.86, // % of track travel required

  // new: modal tech sheet mode
  mode = "slide", // "slide" | "tech"
  open = false,
  onClose,
  tech,
  onStart,
  onWorkOrder,
  onRequestNext,
}) {
  // ---------- TECH SHEET MODE ----------
  if (mode === "tech") {
    const t = tech || {};
    const title = t.name || "Tech";
    const specialty = t.specialty || "";
    const avatarUrl = t.avatarUrl || t.avatar_url || "";

    const statusRaw = (t.status || "").toString().toLowerCase();
    const status =
      statusRaw === "available" || statusRaw === "online"
        ? "available"
        : statusRaw === "busy"
        ? "busy"
        : statusRaw === "away"
        ? "away"
        : "offline";

    const statusLabel =
      status === "available"
        ? "Available"
        : status === "busy"
        ? "Busy"
        : status === "away"
        ? "Away"
        : "Offline";

    const eta =
      status === "available" && Number.isFinite(t.etaMin)
        ? `~${Math.max(1, Math.round(t.etaMin))}m`
        : status === "busy" && Number.isFinite(t.etaMin)
        ? `~${Math.max(1, Math.round(t.etaMin))}m`
        : "";

    // keep it minimal; stats optional
    const stats = t.stats || {};
    const statA = stats.avgResponseMin
      ? `${stats.avgResponseMin}m avg response`
      : "";
    const statB =
      typeof stats.jobsCompleted === "number"
        ? `${stats.jobsCompleted} jobs`
        : "";
    const statC =
      typeof stats.remoteResolveRate === "number"
        ? `${Math.round(stats.remoteResolveRate)}% remote resolve`
        : "";

    const statsLine = [statA, statB, statC].filter(Boolean).slice(0, 3).join(" • ");

    // initials fallback
    const initials = (title || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.slice(0, 1).toUpperCase())
      .join("");

    if (!open) return null;

    return (
      <div
        className={styles.sheetOverlay}
        role="dialog"
        aria-modal="true"
        aria-label={`Tech actions for ${title}`}
        onMouseDown={(e) => {
          // click outside closes
          if (e.target === e.currentTarget) onClose?.();
        }}
      >
        <div className={styles.sheet}>
          <div className={styles.sheetHandle} aria-hidden="true" />

          <div className={styles.sheetHeader}>
            <div className={styles.sheetAvatar}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className={styles.sheetAvatarImg}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
              <span className={styles.sheetAvatarFallback}>{initials}</span>

              <span
                className={`${styles.sheetStatusDot} ${styles[`status_${status}`]}`}
                aria-hidden="true"
              />
            </div>

            <div className={styles.sheetMeta}>
              <div className={styles.sheetTitle}>{title}</div>
              <div className={styles.sheetSub}>
                {specialty}
                {specialty ? " • " : ""}
                {statusLabel}
                {eta ? ` • ${eta}` : ""}
              </div>
              {statsLine ? (
                <div className={styles.sheetStats}>{statsLine}</div>
              ) : null}
            </div>

            <button
              type="button"
              className={styles.sheetClose}
              aria-label="Close"
              onClick={() => onClose?.()}
            >
              <IconClose />
            </button>
          </div>

          <div className={styles.sheetActions}>
            <button
              type="button"
              className={styles.sheetPrimary}
              onClick={() => onStart?.(t)}
            >
              {status === "available"
                ? `Start Visual Assist`
                : `Start with next available`}
            </button>

            <button
              type="button"
              className={styles.sheetSecondary}
              onClick={() => onWorkOrder?.(t)}
            >
              Create Work Order
            </button>

            <button
              type="button"
              className={styles.sheetSecondary}
              onClick={() => onRequestNext?.(t)}
            >
              Request this tech next
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- ORIGINAL SLIDER MODE ----------
  const trackRef = useRef(null);
  const thumbRef = useRef(null);

  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const DRAG_LEFT_INSET = 6;
  const THUMB_SIZE = 44;
  const DRAG_RIGHT_INSET = 6;

  const getMaxX = () => {
    const el = trackRef.current;
    if (!el) return 0;
    const trackW = el.getBoundingClientRect().width;
    return Math.max(
      0,
      trackW - (DRAG_LEFT_INSET + THUMB_SIZE + DRAG_RIGHT_INSET)
    );
  };

  const clamp = (x, maxX) => Math.min(Math.max(0, x), maxX);

  useEffect(() => {
    const onResize = () => {
      const maxX = getMaxX();
      setDragX((x) => clamp(x, maxX));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function handlePointerDown(e) {
    if (disabled) return;
    setDragging(true);
    thumbRef.current?.setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragging || disabled) return;
    const el = trackRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const maxX = Math.max(
      0,
      rect.width - (DRAG_LEFT_INSET + THUMB_SIZE + DRAG_RIGHT_INSET)
    );

    // pointer position relative to track, minus thumb center offset
    const raw = e.clientX - rect.left - DRAG_LEFT_INSET - THUMB_SIZE / 2;
    setDragX(clamp(raw, maxX));
  }

  function complete() {
    const maxX = getMaxX();
    setDragX(maxX);
    onComplete?.();
    setTimeout(() => setDragX(0), 450);
  }

  function cancel() {
    setDragX(0);
  }

  function finishDrag() {
    if (disabled) return;
    setDragging(false);

    const maxX = getMaxX();
    const pct = maxX === 0 ? 0 : dragX / maxX;

    if (pct >= completeAt) complete();
    else cancel();
  }

  // Keyboard support (tab + enter/space to complete)
  function handleKeyDown(e) {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      complete();
    }
  }

  return (
    <section className={styles.slideWrap} aria-disabled={disabled}>
      <div className={styles.slideRow}>
        <div className={styles.slideDot} aria-label="Locked">
          <IconLock />
        </div>

        <div className={styles.slideTrack} ref={trackRef}>
          <div
            className={styles.slideHint}
            style={{ opacity: disabled ? 0.45 : 1 }}
          >
            <span className={styles.slideChevrons} aria-hidden="true">
              <IconArrow />
              <IconArrow />
              <IconArrow />
            </span>
            <span style={{ marginLeft: 10 }}>{label}</span>
          </div>

          <div
            ref={thumbRef}
            className={styles.slideThumb}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={label}
            aria-disabled={disabled}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onKeyDown={handleKeyDown}
            style={{
              transform: `translateX(${dragX}px)`,
              opacity: disabled ? 0.55 : 1,
              pointerEvents: disabled ? "none" : "auto",
              cursor: disabled ? "not-allowed" : dragging ? "grabbing" : "grab",
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
