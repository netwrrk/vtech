// frontend/app/user-dashboard/components/DeviceGrid.js
"use client";

import { useMemo } from "react";
import styles from "../page.module.css";

/**
 * DeviceGrid — 2-column card grid (reference style)
 *
 * Supports two tile "modes" automatically based on item fields:
 *
 * 1) Icon tiles (existing behavior)
 *    items: [{ key, title, sub, featured?, icon? }]
 *
 * 2) Tech tiles (new)
 *    items: [{ key, title, subtitle|sub, avatarUrl?, status?, etaMin?, featured?, isBest? }]
 *
 * Tech tile rules:
 * - If avatarUrl exists, render image + status dot overlay
 * - If no avatarUrl, render initials fallback + status dot
 * - Still supports icon if you pass it
 */
export default function DeviceGrid({
  items = [],
  onOpen,
  ariaLabel = "Device cards",
}) {
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  return (
    <div className={styles.tiles} aria-label={ariaLabel}>
      {safeItems.map((d) => {
        const Icon = d.icon;
        const title = d.title || "";
        const sub = d.sub ?? d.subtitle ?? "";
        const avatarUrl = d.avatarUrl || d.avatar_url || d.photoUrl || d.photo_url || "";
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
            : ""; // blank = no dot

        // Initials fallback (best for names, okay for everything else)
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
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={d.key}
            type="button"
            className={tileClassName}
            onClick={() => onOpen?.(d)}
            aria-label={title}
          >
            <div className={styles.tileTop}>
              <div className={styles.tileIcon} aria-hidden="true">
                {avatarUrl ? (
                  <div className={styles.avatarWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarUrl}
                      alt=""
                      className={styles.avatarImg}
                      loading="lazy"
                      onError={(e) => {
                        // if the image fails, hide it and let initials show (CSS)
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <span className={styles.avatarFallback}>{initials}</span>

                    {status ? (
                      <span
                        className={`${styles.statusDot} ${styles[`status_${status}`]}`}
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                ) : Icon ? (
                  typeof Icon === "function" ? (
                    <Icon />
                  ) : (
                    Icon
                  )
                ) : (
                  <span className={styles.tileGlyph}>
                    {initials || "?"}
                  </span>
                )}

                {/* If it's a tech tile without avatarUrl (initials), still show status dot */}
                {isTech && !avatarUrl && status ? (
                  <span
                    className={`${styles.statusDot} ${styles[`status_${status}`]} ${styles.statusDotCorner}`}
                    aria-hidden="true"
                  />
                ) : null}
              </div>

              <span className={styles.moreEllipsis} aria-hidden="true">
                ›
              </span>
            </div>

            <div>
              <div className={styles.tileLabel}>{title}</div>
              <div className={styles.tileSub}>{sub}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
