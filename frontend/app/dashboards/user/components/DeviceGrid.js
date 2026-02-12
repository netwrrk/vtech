/**
 * DEVICE GRID COMPONENT
 * ------------------------------------------------------
 * Route: frontend/app/user-dashboard/components/DeviceGrid.js
 *
 * Purpose:
 * Renders the 2-column card grid used on the User Dashboard
 * for both equipment tiles and tech selection tiles.
 *
 * Core Responsibilities:
 * - Render icon-based tiles (legacy mode)
 * - Render tech tiles with avatar, status, and ETA
 * - Normalize and display status (Online/Busy/Away/Offline)
 * - Extract and format ETA from subtitle text
 * - Provide fallback initials when avatar image fails
 * - Maintain consistent tile proportions and layout
 * - Trigger onOpen callback when a tile is selected
 *
 * Data Sources:
 * - Props: items[], onOpen, ariaLabel
 * - Tile fields: key, title, sub/subtitle, avatarUrl, status, etaMin, isBest
 *
 * Security / Env:
 * - No environment dependencies (UI rendering component)
 */

"use client";

import { useMemo, useState } from "react";
import styles from "../page.module.css";

/**
 * DeviceGrid — 2-column card grid
 *
 * Modes:
 * 1) Icon tiles: [{ key, title, sub, featured?, icon? }]
 * 2) Tech tiles: [{ key, title, subtitle|sub, avatarUrl?, status?, isBest? }]
 *
 * Tech tile layout (smart-home):
 * - Top media area (photo / fallback)
 * - Bottom meta panel (white)
 * - Initials ONLY when missing/failed image
 *
 * Status (Option A cleanup):
 * - Keep status pill (Online/Busy/Away/Offline)
 * - Keep ONE status line (Status • ~Xm)
 * - REMOVE all dots (no dot on media, no dot in status line)
 */
const TILE_ASPECT_RATIO = "1 / 1.15"; // width : height (taller than a square)
const TILE_MIN_HEIGHT_PX = 180;

const STATUS_LABEL = {
  available: "Online",
  busy: "Busy",
  away: "Away",
  offline: "Offline",
};

function titleCaseWord(s) {
  if (!s) return "";
  const t = String(s);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function extractEta(sub) {
  if (typeof sub !== "string") return "";
  // Grab "~6m", "6m", "8 m", etc.
  const m = sub.match(/~\s*\d+\s*m\b|\b\d+\s*m\b/i);
  return m ? m[0].replace(/\s+/g, "") : "";
}

function stripStatusAndEta(sub) {
  if (typeof sub !== "string") return sub ?? "";
  // Remove trailing "• Busy/Away/Offline/Online" and any eta "• ~6m" / "• 6m"
  return sub
    .replace(/\s*•\s*(busy|away|offline|online)\b/gi, "")
    .replace(/\s*•\s*~?\s*\d+\s*m\b/gi, "")
    .trim();
}

export default function DeviceGrid({
  items = [],
  onOpen,
  ariaLabel = "Device cards",
}) {
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  // Track per-tile image failures so initials only appear when needed
  const [imgFailed, setImgFailed] = useState(() => ({}));

  return (
    <div className={styles.tiles} aria-label={ariaLabel}>
      {safeItems.map((d) => {
        const Icon = d.icon;
        const key = d.key;

        const title = d.title || "";
        const rawSub = d.sub ?? d.subtitle ?? "";
        const avatarUrl =
          d.avatarUrl || d.avatar_url || d.photoUrl || d.photo_url || "";

        const statusRaw = (d.status || "").toString().toLowerCase();
        const status =
          statusRaw === "available" || statusRaw === "online"
            ? "available"
            : statusRaw === "busy"
            ? "busy"
            : statusRaw === "away"
            ? "away"
            : statusRaw
            ? "offline"
            : ""; // blank = no status UI

        const statusLabel = status
          ? STATUS_LABEL[status] || titleCaseWord(status)
          : "";

        const eta = extractEta(rawSub);
        const statusLine = statusLabel
          ? `${statusLabel}${eta ? ` • ${eta}` : ""}`
          : "";

        // Clean subtitle for the meta panel (avoid repeating status/eta)
        const sub = stripStatusAndEta(rawSub);

        const initials = (title || "?")
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((p) => p.slice(0, 1).toUpperCase())
          .join("");

        const isTech = Boolean(avatarUrl) || Boolean(status) || Boolean(d.isBest);

        const tileClassName = [
          styles.tile,
          d.featured ? styles.tileAccent : "",
          styles.tileLeft,
          d.isBest ? styles.tileBest : "",
          status === "offline" ? styles.tileOffline : "",
          isTech ? styles.tileTech : "",
        ]
          .filter(Boolean)
          .join(" ");

        // Enforce consistent tile proportions (matches smart-home tile feel)
        const tileStyle = {
          aspectRatio: TILE_ASPECT_RATIO,
          minHeight: `${TILE_MIN_HEIGHT_PX}px`,
        };

        // --- TECH TILE: smart-home layout (media + meta) ---
        if (isTech) {
          const failed = Boolean(imgFailed[key]);
          const showFallback = !avatarUrl || failed;

          return (
            <button
              key={key}
              type="button"
              className={tileClassName}
              style={tileStyle}
              onClick={() => onOpen?.(d)}
              aria-label={title}
            >
              <div className={styles.techMedia} aria-hidden="true">
                {avatarUrl && !failed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className={styles.techImg}
                    loading="lazy"
                    onLoad={() => {
                      setImgFailed((prev) => {
                        if (!prev?.[key]) return prev;
                        const next = { ...prev };
                        delete next[key];
                        return next;
                      });
                    }}
                    onError={() =>
                      setImgFailed((prev) =>
                        prev?.[key] ? prev : { ...prev, [key]: true }
                      )
                    }
                  />
                ) : null}

                {showFallback ? (
                  <span className={styles.techFallback}>{initials}</span>
                ) : null}

                {/* Option A: NO status dot on media */}
              </div>

              <div className={styles.techMeta}>
                {/* Header row: name + status pill */}
                <div className={styles.techHeadRow}>
                  <div className={styles.techName}>{title}</div>

                  {statusLabel ? (
                    <span
                      className={[
                        styles.techStatusPill,
                        styles[`pill_${status}`],
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-label={`Status: ${statusLabel}`}
                    >
                      {statusLabel}
                    </span>
                  ) : null}
                </div>

                <div className={styles.techSub}>{sub}</div>

                {/* Option A: ONE clean status line, no dot */}
                {statusLine ? (
                  <div className={styles.techStatusLine} aria-label={statusLine}>
                    <span className={styles.techStatusText}>{statusLine}</span>
                  </div>
                ) : null}
              </div>
            </button>
          );
        }

        // --- ICON TILE: original layout ---
        return (
          <button
            key={key}
            type="button"
            className={tileClassName}
            style={tileStyle}
            onClick={() => onOpen?.(d)}
            aria-label={title}
          >
            <div className={styles.tileTop}>
              <div className={styles.tileIcon} aria-hidden="true">
                {Icon ? (
                  typeof Icon === "function" ? (
                    <Icon />
                  ) : (
                    Icon
                  )
                ) : (
                  <span className={styles.tileGlyph}>{initials || "?"}</span>
                )}
              </div>

              <span className={styles.moreEllipsis} aria-hidden="true">
                ›
              </span>
            </div>

            <div>
              <div className={styles.tileLabel}>{title}</div>
              <div className={styles.tileSub}>{rawSub}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
